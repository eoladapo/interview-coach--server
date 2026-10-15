import { aiService } from '../utils/gemini';
import {
  InterviewPlan,
  InterviewContext,
  QuestionResponse,
  EvaluationResult,
  SkillAssessment
} from '../interfaces/interviewer.interface';

export class AIInterviewerService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Generate a personalized interview plan based on candidate profile
   */
  async generateInterviewPlan(userProfile: any): Promise<InterviewPlan> {
    const prompt = this.buildInterviewPlanPrompt(userProfile);

    try {
      const response = await this.executeWithRetry(() =>
        aiService.generateText(prompt)
      );

      return this.parseInterviewPlan(response);
    } catch (error) {
      console.error('Failed to generate interview plan:', error);
      throw new Error('Unable to generate interview plan. Please try again.');
    }
  }

  /**
   * Generate the opening question for the interview
   */
  async generateOpeningQuestion(context: InterviewContext): Promise<QuestionResponse> {
    const prompt = this.buildOpeningQuestionPrompt(context);

    try {
      const response = await this.executeWithRetry(() =>
        aiService.generateText(prompt)
      );

      return this.parseQuestionResponse(response);
    } catch (error) {
      console.error('Failed to generate opening question:', error);
      throw new Error('Unable to generate opening question. Please try again.');
    }
  }

  /**
   * Evaluate candidate response and generate next question
   */
  async evaluateAndGenerateNext(
    candidateResponse: string,
    context: InterviewContext
  ): Promise<{ evaluation: EvaluationResult; nextQuestion?: QuestionResponse }> {
    try {
      // Step 1: Evaluate the response
      const evaluation = await this.evaluateResponse(candidateResponse, context);

      // Step 2: Decide if we need a follow-up or new topic
      let nextQuestion: QuestionResponse | undefined;

      if (context.timeRemaining > 3 && this.shouldContinueInterview(evaluation, context)) {
        nextQuestion = await this.generateFollowUpQuestion(evaluation, context);
      }

      return { evaluation, nextQuestion };
    } catch (error) {
      console.error('Failed to evaluate and generate next question:', error);
      throw new Error('Unable to process response. Please try again.');
    }
  }

  /**
   * Evaluate a candidate's response
   */
  private async evaluateResponse(
    candidateResponse: string,
    context: InterviewContext
  ): Promise<EvaluationResult> {
    const prompt = this.buildEvaluationPrompt(candidateResponse, context);

    const response = await this.executeWithRetry(() =>
      aiService.generateText(prompt)
    );

    return this.parseEvaluationResult(response);
  }

  /**
   * Generate follow-up question based on evaluation
   */
  private async generateFollowUpQuestion(
    evaluation: EvaluationResult,
    context: InterviewContext
  ): Promise<QuestionResponse> {
    const prompt = this.buildFollowUpPrompt(evaluation, context);

    const response = await this.executeWithRetry(() =>
      aiService.generateText(prompt)
    );

    return this.parseQuestionResponse(response);
  }

  /**
   * Build interview plan prompt
   */
  private buildInterviewPlanPrompt(userProfile: any): string {
    return `
You are a senior software engineering manager creating a personalized 30-minute technical interview plan.

CANDIDATE PROFILE:
- Level: ${userProfile.experienceLevel}
- Technologies: ${userProfile.technologies?.join(', ') || 'Not specified'}
- Target Role: ${userProfile.targetRole}
- Industry: ${userProfile.industry || 'General'}
- Years Experience: ${userProfile.experienceYears || 'Not specified'}

Create an interview plan that:
1. Tests both conceptual knowledge AND implementation skills
2. Progresses from concepts → implementation → syntax → edge cases
3. Covers 3-4 major technical areas within 30 minutes
4. Is appropriate for their experience level
5. Is relevant to their target role and industry

Respond in this JSON format:
{
  "overallStrategy": "Brief strategy for this candidate",
  "topicAreas": [
    {
      "topic": "Topic name",
      "timeAllocation": 8,
      "depth": "senior",
      "keySkills": ["skill1", "skill2"]
    }
  ],
  "firstQuestion": "Opening question that starts the interview naturally",
  "estimatedDuration": 30
}`;
  }

  /**
   * Build opening question prompt
   */
  private buildOpeningQuestionPrompt(context: InterviewContext): string {
    const { userProfile } = context;

    return `
You are a friendly, encouraging senior software engineer conducting a practice interview. Your goal is to help the candidate learn and grow, not to intimidate them.

CANDIDATE: ${userProfile.level} targeting ${userProfile.targetRole}
TECHNOLOGIES: ${userProfile.technologies.join(', ')}
INTERVIEW TYPE: ${context.interviewType}

Generate a welcoming opening question that:
1. Feels conversational and puts them at ease
2. Tests understanding of a core concept from their stack
3. Sets up for deeper discussion naturally
4. Matches their experience level
5. Shows you're interested in helping them succeed

TONE: Warm, encouraging, curious - like a mentor helping them practice, not a gatekeeper trying to catch them out.

Respond in this JSON format:
{
  "question": "Your friendly opening question (feel free to include brief encouragement like 'Great! Let's start with...' or 'I'm excited to hear about...')",
  "questionType": "concept",
  "expectedConcepts": ["concept1", "concept2"],
  "timeEstimate": 7,
  "followUpStrategy": "How you plan to help them dive deeper based on their answer"
}`;
  }

  /**
   * Build evaluation prompt
   */
  private buildEvaluationPrompt(candidateResponse: string, context: InterviewContext): string {
    const lastQuestion = context.conversationHistory[context.conversationHistory.length - 1]?.content || 'Unknown';

    return `
You are a supportive technical interviewer evaluating a candidate's response. Remember, this is PRACTICE - your role is to help them learn and improve, not to be harsh or overly critical.

QUESTION ASKED: "${lastQuestion}"
CANDIDATE RESPONSE: "${candidateResponse}"

CANDIDATE PROFILE:
- Level: ${context.userProfile.level}
- Technologies: ${context.userProfile.technologies.join(', ')}
- Target Role: ${context.userProfile.targetRole}

EVALUATION CRITERIA (be fair and encouraging):
1. Technical accuracy (do they understand the concept?)
2. Implementation knowledge (could they build something with this?)
3. Communication clarity (did they explain it well?)
4. Appropriate depth for their level
5. What would help them grow?

TONE: Constructive, encouraging, focused on growth. Celebrate what they got right, then help them see what they can improve.

Respond in this JSON format:
{
  "score": 4,
  "confidence": "high",
  "strengths": ["Specific thing they did well", "Another strength"],
  "weaknesses": ["Frame as growth opportunity, not failure"],
  "conceptsIdentified": ["concept1", "concept2"],
  "skillsAssessed": [
    {
      "skill": "React Hooks",
      "score": 4,
      "confidence": "high",
      "notes": "Shows solid understanding, let's verify with implementation"
    }
  ],
  "suggestedFollowUp": "Next question to help them demonstrate more or address gaps",
  "shouldContinueTopic": true
}`;
  }

  /**
   * Build follow-up question prompt
   */
  private buildFollowUpPrompt(evaluation: EvaluationResult, context: InterviewContext): string {
    return `
Generate a friendly, encouraging follow-up question that helps the candidate demonstrate their skills.

CANDIDATE RESPONSE EVALUATION:
- Score: ${evaluation.score}/5
- Strengths: ${evaluation.strengths.join(', ')}
- Growth Areas: ${evaluation.weaknesses.join(', ')}
- Suggested Direction: ${evaluation.suggestedFollowUp}

CONVERSATION SO FAR:
${context.conversationHistory.slice(-3).map(m => `${m.speaker}: ${m.content}`).join('\n')}

TIME REMAINING: ${context.timeRemaining} minutes
CURRENT TOPIC: ${context.currentTopic}

Generate a follow-up question that:
1. Builds naturally from their previous answer (acknowledge what they said!)
2. Helps them demonstrate more knowledge or practice an area they're developing
3. Feels supportive and collaborative, not like a gotcha
4. Fits within remaining time
5. Maintains positive momentum

TONE: Encouraging and curious, like "That's interesting! Let's explore that a bit more..." or "Great! Now let's see how you'd apply that..."

Respond in this JSON format:
{
  "question": "Your friendly follow-up question (can include brief acknowledgment of their answer)",
  "questionType": "implementation",
  "expectedConcepts": ["concept1"],
  "timeEstimate": 5,
  "followUpStrategy": "How this helps them grow"
}`;
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed:`, error);

        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse interview plan from AI response
   */
  private parseInterviewPlan(response: string): InterviewPlan {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      // Fallback plan
      return {
        overallStrategy: 'General technical interview focusing on core concepts and implementation',
        topicAreas: [
          { topic: 'Core Technologies', timeAllocation: 15, depth: 'intermediate', keySkills: ['Problem Solving'] },
          { topic: 'Implementation Skills', timeAllocation: 15, depth: 'intermediate', keySkills: ['Coding'] }
        ],
        firstQuestion: 'Tell me about your experience with the technologies you work with most.',
        estimatedDuration: 30
      };
    }
  }

  /**
   * Parse question response from AI
   */
  private parseQuestionResponse(response: string): QuestionResponse {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Fallback to treating the entire response as the question
        return {
          question: response.trim(),
          questionType: 'concept',
          expectedConcepts: [],
          timeEstimate: 5,
          followUpStrategy: 'Continue based on response'
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        question: parsed.question || response.trim(),
        questionType: parsed.questionType || 'concept',
        expectedConcepts: parsed.expectedConcepts || [],
        timeEstimate: parsed.timeEstimate || 5,
        followUpStrategy: parsed.followUpStrategy || 'Continue based on response'
      };
    } catch (error) {
      console.error('Failed to parse question response JSON:', error);
      // Fallback response
      return {
        question: response.trim() || 'Can you tell me more about your experience with this technology?',
        questionType: 'concept',
        expectedConcepts: [],
        timeEstimate: 5,
        followUpStrategy: 'Continue based on response'
      };
    }
  }

  /**
   * Parse evaluation result from AI
   */
  private parseEvaluationResult(response: string): EvaluationResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      // Fallback evaluation
      return {
        score: 3,
        confidence: 'medium',
        strengths: ['Provided an answer'],
        weaknesses: ['Need more technical detail'],
        conceptsIdentified: ['General Knowledge'],
        skillsAssessed: [{ skill: 'Communication', score: 3, confidence: 'medium', notes: 'Adequate response' }],
        suggestedFollowUp: 'Ask for more specific technical details',
        shouldContinueTopic: true
      };
    }
  }

  /**
   * Determine if interview should continue
   */
  private shouldContinueInterview(evaluation: EvaluationResult, context: InterviewContext): boolean {
    // Continue if we have time and haven't exhausted the topic
    return context.timeRemaining > 3 && evaluation.shouldContinueTopic;
  }

  /**
   * Generate comprehensive final report
   */
  async generateComprehensiveReport(context: InterviewContext) {
    const prompt = this.buildReportPrompt(context);

    try {
      const response = await this.executeWithRetry(() =>
        aiService.generateText(prompt)
      );

      return this.parseReportResponse(response);
    } catch (error) {
      console.error('Failed to generate comprehensive report:', error);
      // Return fallback report
      return this.generateFallbackReport(context);
    }
  }

  /**
   * Build comprehensive report prompt
   */
  private buildReportPrompt(context: InterviewContext): string {
    const conversationText = context.conversationHistory
      .map(m => `${m.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n\n');

    return `
You are a warm, encouraging technical interviewer providing feedback to a candidate who just completed a practice interview.

INTERVIEW DETAILS:
- Candidate Level: ${context.userProfile.level}
- Target Role: ${context.userProfile.targetRole}
- Technologies: ${context.userProfile.technologies.join(', ')}
- Interview Type: ${context.interviewType}
- Duration: ${30 - context.timeRemaining} minutes

FULL CONVERSATION:
${conversationText}

SKILL ASSESSMENTS:
${context.skillAssessments.map(sa => `- ${sa.skill}: ${sa.score}/5 (${sa.confidence} confidence) - ${sa.notes}`).join('\n')}

Generate a comprehensive, encouraging, and actionable feedback report. Be warm and supportive while being honest about areas for improvement. Remember this is practice - celebrate what they did well and motivate them to keep improving.

Respond in this JSON format:
{
  "overallScore": 85,
  "scores": {
    "technical": 82,
    "communication": 88,
    "problemSolving": 80,
    "interviewPresence": 87
  },
  "summary": "A warm 2-3 sentence overall summary that's encouraging and highlights their main achievement",
  "strengths": [
    "Specific strength with example from their answers",
    "Another strength that stood out",
    "One more strength to celebrate"
  ],
  "weaknesses": [
    "Area for improvement framed positively (not 'you failed at X', but 'consider strengthening Y')",
    "Another growth opportunity",
    "One more area to develop"
  ],
  "recommendations": [
    "Specific, actionable next step they can take",
    "Another concrete recommendation",
    "A third helpful suggestion"
  ],
  "detailedFeedback": "A warm, encouraging paragraph (4-6 sentences) that synthesizes the interview, celebrates specific moments, and motivates them to keep practicing. Be specific about what they did well and frame improvements as opportunities for growth."
}

Remember: Be friendly, specific, and motivating. This is practice - help them feel good about the effort while giving honest, actionable feedback.`;
  }

  /**
   * Parse report response
   */
  private parseReportResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate fallback report
   */
  private generateFallbackReport(context: InterviewContext) {
    const avgSkillScore = context.skillAssessments.length > 0
      ? Math.round(context.skillAssessments.reduce((sum, sa) => sum + sa.score, 0) / context.skillAssessments.length * 20)
      : 75;

    return {
      overallScore: avgSkillScore,
      scores: {
        technical: avgSkillScore,
        communication: avgSkillScore + 5,
        problemSolving: avgSkillScore - 3,
        interviewPresence: avgSkillScore + 2
      },
      summary: `Great job completing your ${context.interviewType} interview! You showed up, engaged with the questions, and gained valuable practice experience.`,
      strengths: [
        'Completed the full interview session showing commitment to improvement',
        'Engaged thoughtfully with the questions asked',
        'Demonstrated willingness to practice and learn'
      ],
      weaknesses: [
        'Consider providing more detailed technical explanations in your answers',
        'Try to use specific examples from your experience when possible',
        'Work on structuring your responses with clear beginning, middle, and end'
      ],
      recommendations: [
        'Take another practice interview to build confidence and improve your skills',
        'Review common interview questions for your target role',
        'Practice explaining technical concepts out loud to improve clarity'
      ],
      detailedFeedback: `Thank you for completing this practice interview! Every interview you do builds your confidence and skills. You showed up, engaged with the questions, and got valuable practice under your belt. Keep practicing regularly, focus on explaining your thought process clearly, and don't be afraid to ask clarifying questions. You're on the right path - keep going!`
    };
  }
}