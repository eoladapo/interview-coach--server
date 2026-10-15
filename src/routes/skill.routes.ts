import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseHelper } from '../utils/response';

const router = Router();

// All routes require authentication
router.use(authenticate);

// TODO: Implement skill routes
router.get('/', async (req, res) => {
  return ResponseHelper.success(res, null, 'Skill endpoints not implemented yet');
});

router.get('/progress', async (req, res) => {
  return ResponseHelper.success(res, null, 'Skill progress endpoints not implemented yet');
});

export default router;