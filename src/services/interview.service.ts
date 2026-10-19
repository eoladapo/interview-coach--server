import { prisma } from '../config/database';
import { QuestionService } from './question.service';
import {
  CreateInterviewData,
  InterviewResponse,
  InterviewMessageResponse,
  PerformanceData
} from '../interfaces/interview.interface';

export class InterviewService {
  private questionService = new QuestionService();

  async createInterview(userId: string, data: CreateInterviewData = {}): Promise<InterviewResponse> {
    // Get user's profile
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        technologies: true,
        focusAreas: true,
      }
    });

    if (!profile) {
      throw new Error('User profile not found. Please complete your profile first.');
    }

    // Create interview session
    const interview = await prisma.interviewSession.create({
      data: {
        userId,
        status: 'created',
        mode: data.mode || profile.interviewMode,
        targetRole: profile.targetRole,
        level: profile.experienceLevel,
        technologies: profile.technologies.map((t: any) => t.technology),
        industry: profile.industry,
        duration: data.duration || profile.durationMinutes,
      }
    });

    return this.formatInterviewResponse(interview);
  }

  async getInterview(id: string, userId: string): Promise<InterviewResponse | null> {
    const interview = await prisma.interviewSession.findFirst({
      where: {
        id,
        userId, // Ensure user can only access their own interviews
      }
    });

    return interview ? this.formatInterviewResponse(interview) : null;
  }

  async getUserInterviews(userId: string, page = 1, limit = 10): Promise<{ interviews: InterviewResponse[]; total: number }> {
    const offset = (page - 1) * limit;

    const [interviews, total] = await Promise.all([
      prisma.interviewSession.findMany({
        where: { userId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          report: {
            select: {
              overallScore: true
            }
          }
        }
      }),
      prisma.interviewSession.count({ where: { userId } })
    ]);

    return {
      interviews: interviews.map(interview => ({
        ...this.formatInterviewResponse(interview),
        score: (interview as any).report?.overallScore || null
      })),
      total
    };
  }

  async startInterview(id: string, userId: string): Promise<InterviewResponse> {
    const interview = await prisma.interviewSession.findFirst({
      where: {
        id,
        userId,
        status: 'created'
      }
    });

    if (!interview) {
      throw new Error('Interview not found or already started');
    }

    const updatedInterview = await prisma.interviewSession.update({
      where: { id },
      data: {
        status: 'in-progress',
        startedAt: new Date()
      }
    });

    // Get the first question for the interview
    const firstQuestion = await this.questionService.getAdaptiveQuestion(userId, id);

    if (firstQuestion) {
      // Add question to interview
      await prisma.interviewQuestion.create({
        data: {
          sessionId: id,
          questionId: firstQuestion.id,
          order: 1
        }
      });

      // Add initial interviewer message
      await this.addMessage(id, 'interviewer', firstQuestion.content, 'question');
    }

    return this.formatInterviewResponse(updatedInterview);
  }

  async endInterview(id: string, userId: string): Promise<InterviewResponse> {
    const interview = await prisma.interviewSession.findFirst({
      where: {
        id,
        userId,
        status: 'in-progress'
      }
    });

    if (!interview) {
      throw new Error('Interview not found or not in progress');
    }

    const updatedInterview = await prisma.interviewSession.update({
      where: { id },
      data: {
        status: 'completed',
        endedAt: new Date()
      }
    });

    // TODO: Trigger evaluation and report generation
    // This would be implemented in the evaluation service

    return this.formatInterviewResponse(updatedInterview);
  }

  async addMessage(
    sessionId: string,
    speaker: 'interviewer' | 'candidate',
    content: string,
    type = 'transcript'
  ): Promise<InterviewMessageResponse> {
    const message = await prisma.interviewMessage.create({
      data: {
        sessionId,
        speaker,
        content,
        type
      }
    });

    return {
      id: message.id.toString(),
      sessionId: message.sessionId,
      speaker: message.speaker,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
    };
  }

  async getInterviewMessages(sessionId: string, userId: string): Promise<InterviewMessageResponse[]> {
    // Verify user owns the interview
    const interview = await prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!interview) {
      throw new Error('Interview not found or access denied');
    }

    const messages = await prisma.interviewMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });

    return messages.map((message: any) => ({
      id: message.id.toString(),
      sessionId: message.sessionId,
      speaker: message.speaker,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
    }));
  }

  async getNextQuestion(sessionId: string, userId: string): Promise<any> {
    // Verify user owns the interview
    const interview = await prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'in-progress'
      }
    });

    if (!interview) {
      throw new Error('Interview not found or not in progress');
    }

    // Get previous performance for adaptive questioning
    const skillAssessments = await prisma.skillAssessment.findMany({
      where: { sessionId },
      select: { skillId: true, score: true }
    });

    const previousPerformance: PerformanceData[] = skillAssessments
      .filter((assessment: any) => assessment.score !== null)
      .map((assessment: any) => ({
        skillId: assessment.skillId,
        score: assessment.score!
      }));

    // Get next question
    const nextQuestion = await this.questionService.getAdaptiveQuestion(
      userId,
      sessionId,
      previousPerformance
    );

    if (!nextQuestion) {
      // No more questions available - end interview
      await this.endInterview(sessionId, userId);
      return null;
    }

    // Get current question count
    const questionCount = await prisma.interviewQuestion.count({
      where: { sessionId }
    });

    // Add question to interview
    await prisma.interviewQuestion.create({
      data: {
        sessionId,
        questionId: nextQuestion.id,
        order: questionCount + 1
      }
    });

    return nextQuestion;
  }

  private formatInterviewResponse(interview: any): InterviewResponse {
    return {
      id: interview.id,
      userId: interview.userId,
      status: interview.status,
      mode: interview.mode,
      targetRole: interview.targetRole,
      level: interview.level,
      technologies: interview.technologies,
      industry: interview.industry,
      duration: interview.duration,
      startedAt: interview.startedAt,
      endedAt: interview.endedAt,
      createdAt: interview.createdAt,
    };
  }
}