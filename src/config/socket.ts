import { Server } from 'socket.io';
import { configureVoiceSocket } from './voice-socket';

export function configureSocketIO(io: Server) {
  // Configure voice interview WebSocket handlers
  configureVoiceSocket(io);

  // Legacy socket handlers (can be removed later if not needed)
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Join interview room
    socket.on('join-interview', (interviewId: string) => {
      socket.join(interviewId);
      console.log(`👥 Client ${socket.id} joined interview ${interviewId}`);

      socket.to(interviewId).emit('participant-joined', {
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Leave interview room
    socket.on('leave-interview', (interviewId: string) => {
      socket.leave(interviewId);
      console.log(`👋 Client ${socket.id} left interview ${interviewId}`);
    });

    // Handle interview messages
    socket.on('interview-message', (data) => {
      const { interviewId, message, type } = data;

      // Broadcast to interview room
      socket.to(interviewId).emit('interview-message', {
        ...data,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('🔌 Client disconnected:', socket.id, 'Reason:', reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('🚨 Socket error:', error);
    });
  });
}