import { prisma } from '../config/database';
import { CreateProfileData, ProfileResponse } from '../interfaces/profile.interface';

export class ProfileService {
  async createOrUpdateProfile(userId: string, profileData: CreateProfileData): Promise<ProfileResponse> {
    const { technologies, focusAreas, ...profileFields } = profileData;

    // Filter out null/undefined values from arrays
    const validTechnologies = (technologies || []).filter((tech): tech is string => tech != null && tech.trim() !== '');
    const validFocusAreas = (focusAreas || []).filter((area): area is string => area != null && area.trim() !== '');

    // Check if profile already exists
    const existingProfile = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (existingProfile) {
      // Update existing profile
      await this.deleteProfileRelations(existingProfile.id);

      const updatedProfile = await prisma.candidateProfile.update({
        where: { userId },
        data: {
          ...profileFields,
          ...(validTechnologies.length > 0 && {
            technologies: {
              create: validTechnologies.map((tech: string) => ({ technology: tech }))
            }
          }),
          ...(validFocusAreas.length > 0 && {
            focusAreas: {
              create: validFocusAreas.map((area: string) => ({ focusArea: area }))
            }
          })
        },
        include: {
          technologies: true,
          focusAreas: true,
        }
      });

      return this.formatProfileResponse(updatedProfile);
    }

    // Create new profile
    const newProfile = await prisma.candidateProfile.create({
      data: {
        userId,
        ...profileFields,
        ...(validTechnologies.length > 0 && {
          technologies: {
            create: validTechnologies.map((tech: string) => ({ technology: tech }))
          }
        }),
        ...(validFocusAreas.length > 0 && {
          focusAreas: {
            create: validFocusAreas.map((area: string) => ({ focusArea: area }))
          }
        })
      },
      include: {
        technologies: true,
        focusAreas: true,
      }
    });

    return this.formatProfileResponse(newProfile);
  }

  async getProfileByUserId(userId: string): Promise<ProfileResponse | null> {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        technologies: true,
        focusAreas: true,
      }
    });

    if (!profile) {
      return null;
    }

    return this.formatProfileResponse(profile);
  }

  async updateProfile(userId: string, updateData: Partial<CreateProfileData>): Promise<ProfileResponse> {
    const existingProfile = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (!existingProfile) {
      throw new Error('Profile not found');
    }

    const { technologies, focusAreas, ...profileFields } = updateData;

    // Update relations if provided
    if (technologies || focusAreas) {
      await this.deleteProfileRelations(existingProfile.id);
    }

    const updatedProfile = await prisma.candidateProfile.update({
      where: { userId },
      data: {
        ...profileFields,
        ...(technologies && {
          technologies: {
            create: technologies.map((tech: string) => ({ technology: tech }))
          }
        }),
        ...(focusAreas && {
          focusAreas: {
            create: focusAreas.map((area: string) => ({ focusArea: area }))
          }
        })
      },
      include: {
        technologies: true,
        focusAreas: true,
      }
    });

    return this.formatProfileResponse(updatedProfile);
  }

  async deleteProfile(userId: string): Promise<void> {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    await prisma.candidateProfile.delete({
      where: { userId }
    });
  }

  private async deleteProfileRelations(profileId: string): Promise<void> {
    await Promise.all([
      prisma.candidateTechnology.deleteMany({
        where: { profileId }
      }),
      prisma.candidateFocusArea.deleteMany({
        where: { profileId }
      })
    ]);
  }

  private formatProfileResponse(profile: any): ProfileResponse {
    return {
      id: profile.id,
      userId: profile.userId,
      targetRole: profile.targetRole,
      experienceLevel: profile.experienceLevel,
      industry: profile.industry,
      interviewMode: profile.interviewMode,
      durationMinutes: profile.durationMinutes,
      technologies: profile.technologies.map((t: any) => t.technology),
      focusAreas: profile.focusAreas.map((f: any) => f.focusArea),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}