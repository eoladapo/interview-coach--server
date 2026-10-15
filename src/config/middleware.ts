import { Express } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export function configureMiddleware(app: Express) {
  // Trust proxy for Render deployment
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));

  // Rate limiting
  app.use(rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging in development
  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
  }
}