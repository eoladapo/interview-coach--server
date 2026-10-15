import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseHelper } from '../utils/response';

const router = Router();

// All routes require authentication
router.use(authenticate);

// TODO: Implement report routes
router.get('/:interviewId', async (req, res) => {
  return ResponseHelper.success(res, null, 'Report endpoints not implemented yet');
});

export default router;