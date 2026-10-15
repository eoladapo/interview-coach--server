import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { validate, asyncHandler } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { profileSchema } from '../helpers/validation.schemas';

const router = Router();
const profileController = new ProfileController();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.post('/', validate(profileSchema), asyncHandler(profileController.createOrUpdateProfile));
router.get('/me', asyncHandler(profileController.getMyProfile));
router.patch('/me', validate(profileSchema.map(v => v.optional())), asyncHandler(profileController.updateMyProfile));
router.delete('/me', asyncHandler(profileController.deleteMyProfile));

export default router;