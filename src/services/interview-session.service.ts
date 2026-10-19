import { prisma } from '../config/database';
import { AIInterviewerService } from './ai-interviewer.service';
import {
  InterviewContext,
  InterviewPlan,
  ConversationMessage,
  SkillAssessment
} from '../interfaces/interviewer.interface';

export class InterviewSessionService {
  private aiInterviewer = new AIInterviewerService();

  /**
   * Start a new AI-generated interview session
   */
  async startAIInterview(userId: string, interviewType: 'technical' | 'system-design' | 'behavioral' = 'technical') {
    try {
      // Get user profile
      const profile = await this.getUserProfile(userId);

      let interviewPlan;

      // Generate AI interview plan
      interviewPlan = await this.aiInterviewer.generateInterviewPlan(profile);

      // Create interview session in database
      const session = await prisma.interviewSession.create({
        data: {
          userId,
          status: 'created',
          mode: interviewType,
          targetRole: profile.targetRole,
          level: profile.experienceLevel,
          technologies: profile.technologies || [],
          industry: profile.industry,
          duration: 5  // 5 minutes for testing
        }
      });

      // Create initial context
      const context: InterviewContext = {
        sessionId: session.id,
        userProfile: {
          level: profile.experienceLevel,
          technologies: profile.technologies || [],
          industry: profile.industry || undefined,
          targetRole: profile.targetRole
        },
        conversationHistory: [],
        currentTopic: interviewPlan.topicAreas[0]?.topic || 'General',
        timeRemaining: 5,  // 5 minutes for testing
        skillAssessments: [],
        interviewType
      };

      // Generate AI opening question
      const openingQuestion = await this.aiInterviewer.generateOpeningQuestion(context);

      // Save opening question
      await this.addMessage(session.id, 'interviewer', openingQuestion.question, 'question');

      return {
        sessionId: session.id,
        firstQuestion: openingQuestion.question,
        interviewDetails: {
          plan: interviewPlan,
          status: 'ready',
          duration: 5  // 5 minutes for testing
        }
      };
    } catch (error) {
      console.error('Failed to start AI interview:', error);
      throw new Error('Unable to start interview. Please try again.');
    }
  }

  /**
   * Process candidate response and get next question
   */
  async processResponse(sessionId: string, candidateResponse: string) {
    try {
      // Get session and validate
      const session = await this.getSession(sessionId);
      if (!session || session.status === 'completed') {
        throw new Error('Invalid or completed interview session');
      }

      // Build current context
      const context = await this.buildInterviewContext(session);

      // Add candidate response to conversation
      await this.addMessage(sessionId, 'candidate', candidateResponse, 'answer');
      context.conversationHistory.push({
        speaker: 'candidate',
        content: candidateResponse,
        timestamp: new Date()
      });

      // Update time remaining (estimate: 1.5 minutes per exchange)
      const newTimeRemaining = Math.max(0, context.timeRemaining - 1.5);

      // Determine if this is the final question (when time is running low)
      const isFinalQuestion = newTimeRemaining <= 1;

      // Get AI evaluation and next question
      const { evaluation, nextQuestion, shouldEnd } = await this.aiInterviewer.evaluateAndGenerateNext(
        candidateResponse,
        context,
        isFinalQuestion
      );

      // Update skill assessments (skip if evaluation failed)
      if (evaluation.skillsAssessed && evaluation.skillsAssessed.length > 0) {
        await this.updateSkillAssessments(sessionId, evaluation.skillsAssessed);
      }

      let response: any = {
        evaluation: {
          score: evaluation.score,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          feedback: `Score: ${evaluation.score}/5. ${evaluation.strengths.join(', ')}`
        }
      };

      if (!shouldEnd && nextQuestion && newTimeRemaining > 1) {
        // Add next question to conversation and database
        await this.addMessage(sessionId, 'interviewer', nextQuestion.question, 'question');

        response.nextQuestion = nextQuestion.question;
        response.timeRemaining = newTimeRemaining;
        response.hasNextQuestion = true;
        response.status = 'continuing';
      } else {
        // Generate graceful closing remarks
        const closingRemarks = await this.aiInterviewer.generateClosingRemarks(context);
        await this.addMessage(sessionId, 'interviewer', closingRemarks, 'closing');

        // End interview
        await this.endInterview(sessionId);

        response.closingRemarks = closingRemarks;
        response.hasNextQuestion = false;
        response.status = 'completed';
        response.message = 'Interview completed. Generating final report...';
      }

      return response;
    } catch (error) {
      console.error('Failed to process response:', error);
      throw new Error('Unable to process response. Please try again.');
    }
  }

  /**
   * Get interview session with validation
   */
  async getSession(sessionId: string) {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        skillAssessments: true
      }
    });

    return session;
  }

  /**
   * End interview and trigger report generation
   */
  async endInterview(sessionId: string) {
    try {
      // Update session status
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          endedAt: new Date()
        }
      });

      // Generate final report (async - don't wait)
      this.generateFinalReport(sessionId).catch(error =>
        console.error('Report generation failed:', error)
      );

      return { status: 'completed' };
    } catch (error) {
      console.error('Failed to end interview:', error);
      throw new Error('Unable to end interview');
    }
  }

  /**
   * Get user profile for interview planning
   */
  private async getUserProfile(userId: string) {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        technologies: true,
        focusAreas: true
      }
    });

    if (!profile) {
      throw new Error('User profile not found. Please complete your profile first.');
    }

    return {
      experienceLevel: profile.experienceLevel,
      targetRole: profile.targetRole,
      industry: profile.industry,
      technologies: profile.technologies.map((t: any) => t.technology),
      focusAreas: profile.focusAreas.map((f: any) => f.focusArea)
    };
  }

  /**
   * Build interview context from session data
   */
  private async buildInterviewContext(session: any): Promise<InterviewContext> {
    // Parse interview plan
    let interviewPlan;
    try {
      interviewPlan = JSON.parse(session.interviewPlan || '{}');
    } catch {
      interviewPlan = {};
    }

    // Build conversation history
    const conversationHistory: ConversationMessage[] = session.messages.map((msg: any) => ({
      speaker: msg.speaker,
      content: msg.content,
      timestamp: msg.createdAt,
      questionType: msg.type === 'question' ? 'concept' : undefined
    }));

    // Calculate time remaining (rough estimate)
    const elapsedMinutes = Math.floor(
      (Date.now() - new Date(session.createdAt).getTime()) / (1000 * 60)
    );
    const timeRemaining = Math.max(0, 5 - elapsedMinutes);  // 5 minutes for testing

    return {
      sessionId: session.id,
      userProfile: {
        level: session.level,
        technologies: Array.isArray(session.technologies) ? session.technologies : [],
        industry: session.industry,
        targetRole: session.targetRole
      },
      conversationHistory,
      currentTopic: interviewPlan.topicAreas?.[0]?.topic || 'General',
      timeRemaining,
      skillAssessments: session.skillAssessments.map((sa: any) => ({
        skill: sa.skillId,
        score: sa.score || 0,
        confidence: sa.confidence || 'medium',
        notes: sa.notes || ''
      })),
      interviewType: session.mode as any
    };
  }

  /**
   * Add message to interview conversation
   */
  private async addMessage(sessionId: string, speaker: 'interviewer' | 'candidate', content: string, type = 'transcript') {
    return await prisma.interviewMessage.create({
      data: {
        sessionId,
        speaker,
        content,
        type
      }
    });
  }

  /**
   * Update skill assessments based on AI evaluation
   */
  private async updateSkillAssessments(sessionId: string, skillsAssessed: SkillAssessment[]) {
    for (const skill of skillsAssessed) {
      // Find or create skill in database
      let skillRecord = await prisma.skill.findFirst({
        where: { name: { contains: skill.skill } }
      });

      if (!skillRecord) {
        skillRecord = await prisma.skill.create({
          data: {
            name: skill.skill,
            category: 'Technical'
          }
        });
      }

      // Upsert skill assessment
      await prisma.skillAssessment.upsert({
        where: {
          sessionId_skillId: {
            sessionId,
            skillId: skillRecord.id
          }
        },
        create: {
          sessionId,
          skillId: skillRecord.id,
          score: skill.score,
          confidence: skill.confidence,
          notes: skill.notes
        },
        update: {
          score: skill.score,
          confidence: skill.confidence,
          notes: skill.notes
        }
      });
    }
  }

  /**
   * Generate final interview report (async)
   */
  private async generateFinalReport(sessionId: string) {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        console.error('Session not found for report generation');
        return;
      }

      // Build conversation context
      const context = await this.buildInterviewContext(session);

      // Generate comprehensive report using AI
      const report = await this.aiInterviewer.generateComprehensiveReport(context);

      // Generate detailed feedback for each Q&A pair
      const questionFeedbacks = [];
      let currentQuestion = null;
      let qaPairCount = 0;

      for (const msg of session.messages) {
        if (msg.speaker === 'interviewer' && msg.type === 'question') {
          currentQuestion = msg;
        } else if (msg.speaker === 'candidate' && msg.type === 'answer' && currentQuestion) {
          qaPairCount++;
          try {
            // Add small delay between API calls to avoid rate limiting
            if (qaPairCount > 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const feedback = await this.aiInterviewer.generateQuestionFeedback(
              currentQuestion.content,
              msg.content,
              context
            );

            questionFeedbacks.push({
              questionId: String(currentQuestion.id), // Convert BigInt to string
              answerId: String(msg.id), // Convert BigInt to string
              question: currentQuestion.content,
              answer: msg.content,
              idealApproach: feedback.idealApproach,
              improvements: feedback.improvements
            });
          } catch (error) {
            console.error('Failed to generate feedback for Q&A pair:', error instanceof Error ? error.message : String(error));
            // Add fallback feedback so user still gets something
            questionFeedbacks.push({
              questionId: String(currentQuestion.id), // Convert BigInt to string
              answerId: String(msg.id), // Convert BigInt to string
              question: currentQuestion.content,
              answer: msg.content,
              idealApproach: `To effectively answer "${currentQuestion.content.substring(0, 100)}${currentQuestion.content.length > 100 ? '...' : ''}": Provide specific technical details with concrete examples from your experience.`,
              improvements: [
                "Include more specific technical details directly related to the question",
                "Use concrete examples to demonstrate your understanding",
                "Structure your response with a clear logical flow"
              ]
            });
          }
          currentQuestion = null;
        }
      }

      // Save report to database
      await prisma.interviewReport.create({
        data: {
          sessionId,
          overallScore: report.overallScore,
          technicalScore: report.scores.technical,
          communicationScore: report.scores.communication,
          problemSolvingScore: report.scores.problemSolving,
          strengths: report.strengths,
          weaknesses: report.weaknesses,
          recommendations: report.recommendations,
          detailedFeedback: report.detailedFeedback,
          summary: report.summary,
          questionFeedbacks: JSON.stringify(questionFeedbacks) // Store as JSON for now
        }
      });

      console.log(`Report generated successfully for session ${sessionId}`);
    } catch (error) {
      console.error(`Failed to generate report for session ${sessionId}:`, error);
    }
  }

  /**
   * Get interview report
   */
  async getInterviewReport(sessionId: string) {
    const report = await prisma.interviewReport.findUnique({
      where: { sessionId },
      include: {
        session: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' }
            },
            skillAssessments: {
              include: {
                skill: true
              }
            }
          }
        }
      }
    });

    if (!report) {
      return null;
    }

    return report;
  }
}