import { Response } from 'express';
import { InterviewService } from '../services/interview.service';
import { InterviewSessionService } from '../services/interview-session.service';
import { ResponseHelper } from '../utils/response';
import { AuthenticatedRequest } from '../interfaces/common.interface';

export class InterviewController {
  private interviewService = new InterviewService();
  private aiInterviewService = new InterviewSessionService();

  // New AI-powered interview creation
  createAIInterview = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      console.log('Starting AI interview creation for user:', req.user!.id);
      const userId = req.user!.id;
      const { interviewType = 'technical' } = req.body;

      const result = await this.aiInterviewService.startAIInterview(userId, interviewType);

      console.log('AI interview created successfully:', result);
      return ResponseHelper.created(res, result, 'AI Interview started successfully');
    } catch (error) {
      console.error('Create AI interview error:', error);

      if (error instanceof Error && error.message.includes('profile not found')) {
        return ResponseHelper.badRequest(res, error.message);
      }

      return ResponseHelper.error(res, 'Failed to create AI interview');
    }
  };

  // Process candidate response in AI interview
  processAIResponse = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;
      const { response } = req.body;

      console.log('=== PROCESSING AI RESPONSE ===');
      console.log('User ID:', userId);
      console.log('Session ID:', sessionId);
      console.log('Response received:', response);
      console.log('Response length:', response?.length);

      if (!sessionId || typeof sessionId !== 'string') {
        return ResponseHelper.badRequest(res, 'Invalid session ID');
      }

      if (!response || typeof response !== 'string') {
        console.log('Invalid response - not a string or empty');
        return ResponseHelper.badRequest(res, 'Response is required');
      }

      // Verify session belongs to user
      const session = await this.aiInterviewService.getSession(sessionId);
      if (!session || session.userId !== userId) {
        console.log('Session not found or does not belong to user');
        return ResponseHelper.notFound(res, 'Interview session not found');
      }

      console.log('Processing response through AI service...');
      const result = await this.aiInterviewService.processResponse(sessionId, response);
      console.log('AI service result:', JSON.stringify(result, null, 2));

      return ResponseHelper.success(res, result, 'Response processed successfully');
    } catch (error) {
      console.error('Process AI response error:', error);
      return ResponseHelper.error(res, 'Failed to process response');
    }
  };

  // End AI interview
  endAIInterview = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;

      if (!sessionId || typeof sessionId !== 'string') {
        return ResponseHelper.badRequest(res, 'Invalid session ID');
      }

      // Verify session belongs to user
      const session = await this.aiInterviewService.getSession(sessionId);
      if (!session || session.userId !== userId) {
        return ResponseHelper.notFound(res, 'Interview session not found');
      }

      const result = await this.aiInterviewService.endInterview(sessionId);

      return ResponseHelper.success(res, result, 'Interview ended successfully');
    } catch (error) {
      console.error('End AI interview error:', error);
      return ResponseHelper.error(res, 'Failed to end interview');
    }
  };

  // Get AI interview report
  getAIInterviewReport = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;

      if (!sessionId || typeof sessionId !== 'string') {
        return ResponseHelper.badRequest(res, 'Invalid session ID');
      }

      // Verify session belongs to user
      const session = await this.aiInterviewService.getSession(sessionId);
      if (!session || session.userId !== userId) {
        return ResponseHelper.notFound(res, 'Interview session not found');
      }

      const report = await this.aiInterviewService.getInterviewReport(sessionId);

      if (!report) {
        return ResponseHelper.notFound(res, 'Report not yet available. Please wait a moment and try again.');
      }

      return ResponseHelper.success(res, report, 'Report retrieved successfully');
    } catch (error) {
      console.error('Get AI interview report error:', error);
      return ResponseHelper.error(res, 'Failed to retrieve report');
    }
  };

  createInterview = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const { duration, mode } = req.body;

      const interview = await this.interviewService.createInterview(userId, {
        duration,
        mode,
      });

      return ResponseHelper.created(res, interview, 'Interview created successfully');
    } catch (error) {
      console.error('Create interview error:', error);

      if (error instanceof Error && error.message.includes('profile not found')) {
        return ResponseHelper.badRequest(res, error.message);
      }

      return ResponseHelper.error(res, 'Failed to create interview');
    }
  };

  getInterview = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        return ResponseHelper.badRequest(res, 'Invalid interview ID');
      }

      const interview = await this.interviewService.getInterview(id, userId);

      if (!interview) {
        return ResponseHelper.notFound(res, 'Interview not found');
      }

      return ResponseHelper.success(res, interview, 'Interview retrieved successfully');
    } catch (error) {
      console.error('Get interview error:', error);
      return ResponseHelper.error(res, 'Failed to get interview');
    }
  };

  getMyInterviews = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 10 } = req.query;

      const result = await this.interviewService.getUserInterviews(
        userId,
        parseInt(page as string) || 1,
        parseInt(limit as string) || 10
      );

      return ResponseHelper.paginated(
        res,
        result.interviews,
        parseInt(page as string) || 1,
        parseInt(limit as string) || 10,
        result.total,
        'Interviews retrieved successfully'
      );
    } catch (error) {
      console.error('Get interviews error:', error);
      return ResponseHelper.error(res, 'Failed to get interviews');
    }
  };

  startInterview = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        return ResponseHelper.badRequest(res, 'Invalid interview ID');
      }

      const interview = await this.interviewService.startInterview(id, userId);

      return ResponseHelper.success(res, interview, 'Interview started successfully');
    } catch (error) {
      console.error('Start interview error:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        return ResponseHelper.notFound(res, error.message);
      }

      return ResponseHelper.error(res, 'Failed to start interview');
    }
  };

  endInterview = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        return ResponseHelper.badRequest(res, 'Invalid interview ID');
      }

      const interview = await this.interviewService.endInterview(id, userId);

      return ResponseHelper.success(res, interview, 'Interview ended successfully');
    } catch (error) {
      console.error('End interview error:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        return ResponseHelper.notFound(res, error.message);
      }

      return ResponseHelper.error(res, 'Failed to end interview');
    }
  };

  getInterviewMessages = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        return ResponseHelper.badRequest(res, 'Invalid interview ID');
      }

      const messages = await this.interviewService.getInterviewMessages(id, userId);

      return ResponseHelper.success(res, messages, 'Interview messages retrieved successfully');
    } catch (error) {
      console.error('Get interview messages error:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        return ResponseHelper.notFound(res, error.message);
      }

      return ResponseHelper.error(res, 'Failed to get interview messages');
    }
  };

  addInterviewMessage = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { content, type = 'transcript' } = req.body;

      if (!id || typeof id !== 'string') {
        return ResponseHelper.badRequest(res, 'Invalid interview ID');
      }

      // Verify user owns the interview
      const interview = await this.interviewService.getInterview(id, userId);
      if (!interview) {
        return ResponseHelper.notFound(res, 'Interview not found');
      }

      const message = await this.interviewService.addMessage(id, 'candidate', content, type);

      return ResponseHelper.created(res, message, 'Message added successfully');
    } catch (error) {
      console.error('Add interview message error:', error);
      return ResponseHelper.error(res, 'Failed to add message');
    }
  };

  getNextQuestion = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        return ResponseHelper.badRequest(res, 'Invalid interview ID');
      }

      const question = await this.interviewService.getNextQuestion(id, userId);

      if (!question) {
        return ResponseHelper.success(res, null, 'No more questions available - interview complete');
      }

      return ResponseHelper.success(res, question, 'Next question retrieved successfully');
    } catch (error) {
      console.error('Get next question error:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        return ResponseHelper.notFound(res, error.message);
      }

      return ResponseHelper.error(res, 'Failed to get next question');
    }
  };
}