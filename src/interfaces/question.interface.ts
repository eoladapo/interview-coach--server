export interface QuestionResponse {
  id: string;
  title: string;
  content: string;
  difficulty: string;
  type: string;
  technology?: string;
  industry?: string;
  expectedAnswer?: string;
  followUpHints: string[];
  timeLimit?: number;
  skills: {
    id: string;
    name: string;
    category: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionFilters {
  technology?: string;
  level?: string;
  industry?: string;
  type?: string;
  skillIds?: string[];
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}