import { Router } from 'express';
import { prisma } from '../config/database';

const router = Router();

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all skills
router.get('/skills', async (req, res) => {
  try {
    const skills = await prisma.skill.findMany();
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// Get all questions
router.get('/questions', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      include: {
        skills: {
          include: {
            skill: true
          }
        }
      }
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get database stats
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      users: await prisma.user.count(),
      skills: await prisma.skill.count(),
      questions: await prisma.question.count(),
      interviews: await prisma.interviewSession.count(),
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;