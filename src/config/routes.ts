import { Express } from 'express';
import authRoutes from '../routes/auth.routes';
import profileRoutes from '../routes/profile.routes';
import interviewRoutes from '../routes/interview.routes';
import questionRoutes from '../routes/question.routes';
import reportRoutes from '../routes/report.routes';
import skillRoutes from '../routes/skill.routes';
import debugRoutes from '../routes/debug.routes';

export function configureRoutes(app: Express) {
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/interviews', interviewRoutes);
  app.use('/api/questions', questionRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/skills', skillRoutes);

  // Debug routes (development only)
  if (process.env.NODE_ENV === 'development') {
    app.use('/api/debug', debugRoutes);
  }
}