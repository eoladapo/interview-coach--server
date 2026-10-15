import { Router } from 'express';
import { QuestionController } from '../controllers/question.controller';
import { validate, asyncHandler } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { questionQuerySchema, idParamSchema } from '../helpers/validation.schemas';

const router = Router();
const questionController = new QuestionController();

// All routes require authentication
router.use(authenticate);

// Question routes
router.get('/', validate(questionQuerySchema), asyncHandler(questionController.getQuestions));
router.get('/personalized', asyncHandler(questionController.getPersonalizedQuestions));
router.get('/:id', validate(idParamSchema), asyncHandler(questionController.getQuestionById));
router.post('/adaptive/:sessionId', validate(idParamSchema), asyncHandler(questionController.getAdaptiveQuestion));

export default router;