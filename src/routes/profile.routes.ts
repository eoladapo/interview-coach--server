import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { validate, asyncHandler } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { profileSchema } from '../helpers/validation.schemas';

const router = Router();
const profileController = new ProfileController();

// All routes require authentication
router.use(authenticate);

// Profile routes - matching frontend expectations
router.get('/', asyncHandler(profileController.getMyProfile));
router.post('/', validate(profileSchema), asyncHandler(profileController.createOrUpdateProfile));
router.put('/', validate(profileSchema), asyncHandler(profileController.createOrUpdateProfile));
router.patch('/', asyncHandler(profileController.updateMyProfile));
router.delete('/', asyncHandler(profileController.deleteMyProfile));

export default router;