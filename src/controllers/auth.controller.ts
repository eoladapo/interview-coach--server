import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ResponseHelper } from '../utils/response';
import { AuthenticatedRequest } from '../interfaces/common.interface';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password, firstName, lastName } = req.body;

      const result = await this.authService.register({
        email,
        password,
        firstName,
        lastName,
      });

      return ResponseHelper.created(res, result, 'User registered successfully');
    } catch (error) {
      console.error('Registration error:', error);

      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return ResponseHelper.badRequest(res, error.message);
        }
      }

      return ResponseHelper.error(res, 'Registration failed');
    }
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password } = req.body;

      const result = await this.authService.login(email, password);

      return ResponseHelper.success(res, result, 'Login successful');
    } catch (error) {
      console.error('Login error:', error);

      if (error instanceof Error) {
        if (error.message.includes('Invalid email or password')) {
          return ResponseHelper.unauthorized(res, 'Invalid email or password');
        }
      }

      return ResponseHelper.error(res, 'Login failed');
    }
  };

  getMe = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      return ResponseHelper.success(res, req.user, 'User profile retrieved');
    } catch (error) {
      console.error('Get profile error:', error);
      return ResponseHelper.error(res, 'Failed to get user profile');
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const updateData = req.body;

      const updatedUser = await this.authService.updateUser(userId, updateData);

      return ResponseHelper.success(res, updatedUser, 'Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      return ResponseHelper.error(res, 'Failed to update profile');
    }
  };

  deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;

      await this.authService.deleteUser(userId);

      return ResponseHelper.success(res, null, 'Account deleted successfully');
    } catch (error) {
      console.error('Delete account error:', error);
      return ResponseHelper.error(res, 'Failed to delete account');
    }
  };
}