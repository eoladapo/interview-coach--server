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
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Target role must be between 1 and 200 characters'),
  body('experienceLevel')
    .optional()
    .isIn(['entry', 'mid', 'senior', 'lead', 'junior', 'mid-level'])
    .withMessage('Invalid experience level'),
  body('industry')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Industry must be between 1 and 200 characters'),
  body('interviewMode')
    .optional()
    .isIn(['mock', 'practice', 'technical', 'behavioral', 'system-design', 'full'])
    .withMessage('Invalid interview mode'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 15, max: 120 })
    .withMessage('Duration must be between 15 and 120 minutes'),
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  body('focusAreas')
    .optional()
    .isArray()
    .withMessage('Focus areas must be an array'),
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