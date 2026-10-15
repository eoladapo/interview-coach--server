import { body, query, param } from 'express-validator';

// Auth validation schemas
export const registerSchema = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name cannot be empty'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name cannot be empty'),
];

export const loginSchema = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Profile validation schemas
export const profileSchema = [
  body('targetRole')
    .isIn(['frontend', 'backend', 'fullstack', 'devops', 'mobile'])
    .withMessage('Invalid target role'),
  body('experienceLevel')
    .isIn(['junior', 'mid-level', 'senior'])
    .withMessage('Invalid experience level'),
  body('industry')
    .optional()
    .isIn(['fintech', 'saas', 'ecommerce', 'banking', 'healthcare', 'logistics', 'big-tech'])
    .withMessage('Invalid industry'),
  body('interviewMode')
    .isIn(['mock', 'practice'])
    .withMessage('Invalid interview mode'),
  body('durationMinutes')
    .isInt({ min: 15, max: 120 })
    .withMessage('Duration must be between 15 and 120 minutes'),
  body('technologies')
    .isArray({ min: 1 })
    .withMessage('At least one technology must be selected'),
  body('technologies.*')
    .isIn([
      'javascript', 'typescript', 'react', 'nextjs', 'nodejs', 'nestjs', 'express',
      'python', 'fastapi', 'java', 'spring-boot', 'postgresql', 'mysql', 'mongodb',
      'redis', 'aws', 'docker', 'kubernetes'
    ])
    .withMessage('Invalid technology'),
  body('focusAreas')
    .isArray({ min: 1 })
    .withMessage('At least one focus area must be selected'),
  body('focusAreas.*')
    .isIn(['dsa', 'system-design', 'practical-implementation', 'databases', 'testing', 'security', 'performance'])
    .withMessage('Invalid focus area'),
];

// Interview validation schemas
export const createInterviewSchema = [
  body('duration')
    .optional()
    .isInt({ min: 15, max: 120 })
    .withMessage('Duration must be between 15 and 120 minutes'),
  body('mode')
    .optional()
    .isIn(['mock', 'practice'])
    .withMessage('Invalid interview mode'),
];

// Question validation schemas
export const questionQuerySchema = [
  query('technology')
    .optional()
    .isString()
    .withMessage('Technology must be a string'),
  query('level')
    .optional()
    .isIn(['junior', 'mid-level', 'senior'])
    .withMessage('Invalid experience level'),
  query('industry')
    .optional()
    .isString()
    .withMessage('Industry must be a string'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
];

// Generic validation schemas
export const idParamSchema = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
];

export const paginationSchema = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];