export interface InterviewPlan {
  overallStrategy: string;
  topicAreas: TopicArea[];
  firstQuestion: string;
  estimatedDuration: number;
}

export interface TopicArea {
  topic: string;
  timeAllocation: number; // minutes
  depth: 'junior' | 'intermediate' | 'senior' | 'advanced';
  keySkills: string[];
}

export interface InterviewContext {
  sessionId: string;
  userProfile: {
    level: string;
    technologies: string[];
    industry?: string;
    targetRole: string;
    experienceYears?: number;
  };
  conversationHistory: ConversationMessage[];
  currentTopic: string;
  timeRemaining: number;
  skillAssessments: SkillAssessment[];
  interviewType: 'technical' | 'system-design' | 'behavioral';
}

export interface ConversationMessage {
  speaker: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
  questionType?: 'concept' | 'implementation' | 'syntax' | 'edge-case';
}

export interface SkillAssessment {
  skill: string;
  score: number; // 1-5
  confidence: 'low' | 'medium' | 'high';
  notes: string;
}

export interface QuestionResponse {
  question: string;
  questionType: 'concept' | 'implementation' | 'syntax' | 'edge-case';
  expectedConcepts: string[];
  timeEstimate: number; // minutes expected for answer
  followUpStrategy: string;
}

export interface EvaluationResult {
  score: number; // 1-5
  confidence: 'low' | 'medium' | 'high';
  strengths: string[];
  weaknesses: string[];
  conceptsIdentified: string[];
  skillsAssessed: SkillAssessment[];
  suggestedFollowUp: string;
  shouldContinueTopic: boolean;
}