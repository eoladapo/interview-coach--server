import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate, asyncHandler } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { registerSchema, loginSchema } from '../helpers/validation.schemas';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));

// Protected routes
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.patch('/me', authenticate, asyncHandler(authController.updateProfile));
router.delete('/me', authenticate, asyncHandler(authController.deleteAccount));

export default router;