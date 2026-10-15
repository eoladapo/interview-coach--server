export interface CreateInterviewData {
  duration?: number;
  mode?: string;
}

export interface InterviewResponse {
  id: string;
  userId: string;
  status: string;
  mode: string;
  targetRole: string;
  level: string;
  technologies: string[];
  industry?: string;
  duration: number;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
}

export interface InterviewMessageResponse {
  id: string;
  sessionId: string;
  speaker: string;
  content: string;
  type: string;
  createdAt: Date;
}

export interface PerformanceData {
  skillId: string;
  score: number;
}