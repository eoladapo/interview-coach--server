import { prisma } from '../config/database';
import { QuestionResponse, QuestionFilters, PaginationOptions } from '../interfaces/question.interface';

export class QuestionService {
  async getQuestions(
    filters: QuestionFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ questions: QuestionResponse[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (filters.technology) {
      where.technology = filters.technology;
    }

    if (filters.level) {
      where.difficulty = filters.level;
    }

    if (filters.industry) {
      where.industry = filters.industry;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.skillIds && filters.skillIds.length > 0) {
      where.skills = {
        some: {
          skillId: {
            in: filters.skillIds
          }
        }
      };
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.question.count({ where })
    ]);

    return {
      questions: questions.map(this.formatQuestionResponse),
      total
    };
  }

  async getQuestionById(id: string): Promise<QuestionResponse | null> {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!question) {
      return null;
    }

    return this.formatQuestionResponse(question);
  }

  async getQuestionsForProfile(userId: string, limit = 10): Promise<QuestionResponse[]> {
    // Get user's profile to understand their preferences
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        technologies: true,
        focusAreas: true,
      }
    });

    if (!profile) {
      // Return general questions if no profile
      const questions = await prisma.question.findMany({
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return questions.map(this.formatQuestionResponse);
    }

    // Build query based on profile
    const technologies = profile.technologies.map((t: any) => t.technology);
    const where: any = {
      OR: [
        {
          technology: {
            in: technologies
          }
        },
        {
          difficulty: profile.experienceLevel
        }
      ]
    };

    if (profile.industry) {
      where.OR.push({
        industry: profile.industry
      });
    }

    const questions = await prisma.question.findMany({
      where,
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return questions.map(this.formatQuestionResponse);
  }

  async getAdaptiveQuestion(
    userId: string,
    sessionId: string,
    previousPerformance?: { skillId: string; score: number }[]
  ): Promise<QuestionResponse | null> {
    // Get user profile
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

    // Get questions already asked in this session
    const askedQuestions = await prisma.interviewQuestion.findMany({
      where: { sessionId },
      select: { questionId: true }
    });

    const askedQuestionIds = askedQuestions.map((q: any) => q.questionId);

    // Base query - exclude already asked questions
    const where: any = {
      NOT: {
        id: {
          in: askedQuestionIds
        }
      }
    };

    // Adapt difficulty based on previous performance
    if (previousPerformance && previousPerformance.length > 0) {
      const averageScore = previousPerformance.reduce((sum, p) => sum + p.score, 0) / previousPerformance.length;

      // Adjust difficulty based on performance
      if (averageScore > 4.0) {
        // Performing well - increase difficulty or stay at current level
        where.difficulty = profile.experienceLevel === 'junior' ? 'mid-level' : 'senior';
      } else if (averageScore < 2.5) {
        // Struggling - decrease difficulty
        where.difficulty = profile.experienceLevel === 'senior' ? 'mid-level' : 'junior';
      } else {
        // Appropriate level
        where.difficulty = profile.experienceLevel;
      }
    } else {
      // First question - use profile level
      where.difficulty = profile.experienceLevel;
    }

    // Prefer questions matching user's technology stack
    const technologies = profile.technologies.map((t: any) => t.technology);
    if (technologies.length > 0) {
      where.OR = [
        {
          technology: {
            in: technologies
          }
        },
        {
          technology: null // Include general questions
        }
      ];
    }

    const question = await prisma.question.findFirst({
      where,
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return question ? this.formatQuestionResponse(question) : null;
  }

  private formatQuestionResponse(question: any): QuestionResponse {
    return {
      id: question.id,
      title: question.title,
      content: question.content,
      difficulty: question.difficulty,
      type: question.type,
      technology: question.technology,
      industry: question.industry,
      expectedAnswer: question.expectedAnswer,
      followUpHints: question.followUpHints,
      timeLimit: question.timeLimit,
      skills: question.skills.map((qs: any) => ({
        id: qs.skill.id,
        name: qs.skill.name,
        category: qs.skill.category,
      })),
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }
}