import { Response } from 'express';
import { ProfileService } from '../services/profile.service';
import { ResponseHelper } from '../utils/response';
import { AuthenticatedRequest } from '../interfaces/common.interface';

export class ProfileController {
  private profileService = new ProfileService();

  createOrUpdateProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const profileData = req.body;

      console.log('Creating/updating profile for user:', userId);
      console.log('Profile data received:', JSON.stringify(profileData, null, 2));

      const profile = await this.profileService.createOrUpdateProfile(userId, profileData);

      console.log('Profile created/updated successfully:', profile.id);
      return ResponseHelper.success(res, profile, 'Profile saved successfully');
    } catch (error) {
      console.error('Create/Update profile error:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
      return ResponseHelper.error(res, 'Failed to save profile', 500);
    }
  };

  getMyProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;

      const profile = await this.profileService.getProfileByUserId(userId);

      if (!profile) {
        return ResponseHelper.notFound(res, 'Profile not found');
      }

      return ResponseHelper.success(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      console.error('Get profile error:', error);
      return ResponseHelper.error(res, 'Failed to get profile');
    }
  };

  updateMyProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;
      const updateData = req.body;

      const profile = await this.profileService.updateProfile(userId, updateData);

      return ResponseHelper.success(res, profile, 'Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        return ResponseHelper.notFound(res, error.message);
      }

      return ResponseHelper.error(res, 'Failed to update profile');
    }
  };

  deleteMyProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;

      await this.profileService.deleteProfile(userId);

      return ResponseHelper.success(res, null, 'Profile deleted successfully');
    } catch (error) {
      console.error('Delete profile error:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        return ResponseHelper.notFound(res, error.message);
      }

      return ResponseHelper.error(res, 'Failed to delete profile');
    }
  };
}