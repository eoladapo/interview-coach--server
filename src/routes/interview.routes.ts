import { Router } from 'express';
import { InterviewController } from '../controllers/interview.controller';
import { validate, asyncHandler } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { createInterviewSchema, idParamSchema, paginationSchema } from '../helpers/validation.schemas';

const router = Router();
const interviewController = new InterviewController();

// All routes require authentication
router.use(authenticate);

// Interview routes
router.post('/', validate(createInterviewSchema), asyncHandler(interviewController.createInterview));

// AI Interview routes
router.post('/ai/start', asyncHandler(interviewController.createAIInterview));
router.post('/ai/:sessionId/respond', asyncHandler(interviewController.processAIResponse));
router.post('/ai/:sessionId/end', asyncHandler(interviewController.endAIInterview));
router.get('/ai/:sessionId/report', asyncHandler(interviewController.getAIInterviewReport));

// Standard interview routes
router.get('/progress', asyncHandler(interviewController.getProgress));
router.get('/', validate(paginationSchema), asyncHandler(interviewController.getMyInterviews));
router.get('/:id', validate(idParamSchema), asyncHandler(interviewController.getInterview));
router.post('/:id/start', validate(idParamSchema), asyncHandler(interviewController.startInterview));
router.post('/:id/end', validate(idParamSchema), asyncHandler(interviewController.endInterview));
router.get('/:id/messages', validate(idParamSchema), asyncHandler(interviewController.getInterviewMessages));
router.post('/:id/messages', validate(idParamSchema), asyncHandler(interviewController.addInterviewMessage));
router.get('/:id/next-question', validate(idParamSchema), asyncHandler(interviewController.getNextQuestion));

export default router;