import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from 'dotenv';
import { connectDatabase } from './config/database';
import { configureMiddleware } from './config/middleware';
import { configureRoutes } from './config/routes';
import { configureSocketIO } from './config/socket';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';


// Load environment variables
config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Configure middleware
    configureMiddleware(app);

    // Configure routes
    configureRoutes(app);

    // Configure Socket.IO
    configureSocketIO(io);

    // Error handling middleware (must be last)
    app.use(notFound);
    app.use(errorHandler);

    const PORT = process.env.PORT || 3001;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📖 API Health: http://localhost:${PORT}/api/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  const { prisma } = await import('./config/database');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export { io };