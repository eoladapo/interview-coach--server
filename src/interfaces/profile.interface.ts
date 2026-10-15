export interface CreateProfileData {
  targetRole: string;
  experienceLevel: string;
  industry?: string;
  interviewMode: string;
  durationMinutes: number;
  technologies: string[];
  focusAreas: string[];
}

export interface ProfileResponse {
  id: string;
  userId: string;
  targetRole: string;
  experienceLevel: string;
  industry?: string;
  interviewMode: string;
  durationMinutes: number;
  technologies: string[];
  focusAreas: string[];
  createdAt: Date;
  updatedAt: Date;
}