import { Response } from 'express';
import { QuestionService } from '../services/question.service';
import { ResponseHelper } from '../utils/response';
import { AuthenticatedRequest } from '../interfaces/common.interface';

export class QuestionController {
  private questionService = new QuestionService();

  getQuestions = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const {
        technology,
        level,
        industry,
        type,
        page = 1,
        limit = 10
      } = req.query;

      const filters = {
        technology: technology as string,
        level: level as string,
        industry: industry as string,
        type: type as string,
      };

      const pagination = {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
      };

      const result = await this.questionService.getQuestions(filters, pagination);

      return ResponseHelper.paginated(
        res,
        result.questions,
        pagination.page,
        pagination.limit,
        result.total,
        'Questions retrieved successfully'
      );
    } catch (error) {
      console.error('Get questions error:', error);
      return ResponseHelper.error(res, 'Failed to get questions');
    }
  };

  getQuestionById = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        return ResponseHelper.badRequest(res, 'Invalid question ID');
      }

      const question = await this.questionService.getQuestionById(id);

      if (!question) {
        return ResponseHelper.notFound(res, 'Question not found');
      }

      return ResponseHelper.success(res, question, 'Question retrieved successfully');
    } catch (error) {
      console.error('Get question error:', error);
      return ResponseHelper.error(res, 'Failed to get question');
    }
  };

  getPersonalizedQuestions = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const { limit = 10 } = req.query;

      const questions = await this.questionService.getQuestionsForProfile(
        userId,
        parseInt(limit as string) || 10
      );

      return ResponseHelper.success(res, questions, 'Personalized questions retrieved successfully');
    } catch (error) {
      console.error('Get personalized questions error:', error);
      return ResponseHelper.error(res, 'Failed to get personalized questions');
    }
  };

  getAdaptiveQuestion = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;

      if (!sessionId || typeof sessionId !== 'string') {
        return ResponseHelper.badRequest(res, 'Invalid session ID');
      }

      // Get performance data from request body if provided
      const { previousPerformance } = req.body;

      const question = await this.questionService.getAdaptiveQuestion(
        userId,
        sessionId,
        previousPerformance
      );

      if (!question) {
        return ResponseHelper.notFound(res, 'No suitable question found');
      }

      return ResponseHelper.success(res, question, 'Adaptive question retrieved successfully');
    } catch (error) {
      console.error('Get adaptive question error:', error);
      return ResponseHelper.error(res, 'Failed to get adaptive question');
    }
  };
}