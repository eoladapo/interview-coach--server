import { Server as SocketIOServer } from 'socket.io';
import { VoiceInterviewService } from '../services/voice-interview.service';
import { InterviewSessionService } from '../services/interview-session.service';
import { verify } from 'jsonwebtoken';

interface AuthenticatedSocket {
  userId: string;
  sessionId?: string;
}

export function configureVoiceSocket(io: SocketIOServer) {
  const voiceService = new VoiceInterviewService();
  const sessionService = new InterviewSessionService();

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new Error('No authentication token provided');
      }

      const decoded = verify(token, process.env.JWT_SECRET!) as any;
      (socket as any).userId = decoded.sub;
      next();
    } catch (error) {
      console.error('Socket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Voice interview client connected: ${socket.id}`);
    const userId = (socket as any).userId;

    // Start voice interview session
    socket.on('start_voice_interview', async (data) => {
      try {
        console.log(`Starting voice interview for user: ${userId}`);

        // Create AI interview session
        const result = await sessionService.startAIInterview(userId, data.interviewType);
        const sessionId = result.sessionId;

        (socket as any).sessionId = sessionId;
        socket.join(`session_${sessionId}`);

        // Initialize voice interview with Gemini
        const candidateProfile = {
          level: data.level || 'Mid-level',
          technologies: data.technologies || ['JavaScript'],
          targetRole: data.targetRole || 'Software Engineer',
          industry: data.industry
        };

        const openingMessage = await voiceService.initializeVoiceInterview({
          sessionId,
          candidateProfile
        });

        socket.emit('interview_started', {
          sessionId,
          openingMessage,
          status: 'ready_for_voice'
        });

        console.log(`Voice interview started - Session: ${sessionId}`);
      } catch (error) {
        console.error('Failed to start voice interview:', error);
        socket.emit('interview_error', {
          message: 'Failed to start voice interview',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Handle voice/audio data from client
    socket.on('voice_data', async (audioData) => {
      try {
        const sessionId = (socket as any).sessionId;
        if (!sessionId) {
          socket.emit('voice_error', { message: 'No active interview session' });
          return;
        }

        console.log(`Received voice data for session: ${sessionId}`);

        // Note: In production, you'd process the actual audio here
        // For now, we'll simulate with text input
        const transcribedText = audioData.text || 'Simulated voice response';

        // Get session context
        const session = await sessionService.getSession(sessionId);
        if (!session || session.userId !== userId) {
          socket.emit('voice_error', { message: 'Invalid session' });
          return;
        }

        // Build context from session
        const context = {
          sessionId,
          userProfile: {
            level: session.level,
            technologies: typeof session.technologies === 'string'
              ? JSON.parse(session.technologies)
              : session.technologies,
            targetRole: session.targetRole,
            industry: session.industry || undefined
          },
          conversationHistory: session.messages.map((msg: any) => ({
            speaker: msg.speaker,
            content: msg.content,
            timestamp: msg.createdAt
          })),
          currentTopic: 'Technical Discussion',
          timeRemaining: Math.max(0, 30 - Math.floor((Date.now() - new Date(session.createdAt).getTime()) / 60000)),
          skillAssessments: [],
          interviewType: session.mode as any
        };

        // Process voice response with AI
        const result = await voiceService.processVoiceResponse(
          sessionId,
          transcribedText,
          context
        );

        // Update database with response and evaluation
        await sessionService.processResponse(sessionId, transcribedText);

        // Send AI response back to client
        socket.emit('interviewer_response', {
          evaluation: result.evaluation,
          nextQuestion: result.nextQuestion,
          shouldContinue: result.shouldContinue,
          timeRemaining: context.timeRemaining
        });

        if (!result.shouldContinue) {
          socket.emit('interview_completed', {
            message: 'Interview completed. Generating final report...'
          });
        }

      } catch (error) {
        console.error('Voice processing error:', error);
        socket.emit('voice_error', {
          message: 'Failed to process voice input',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Handle text input (fallback for testing)
    socket.on('text_response', async (data) => {
      try {
        const sessionId = (socket as any).sessionId;
        if (!sessionId) {
          socket.emit('interview_error', { message: 'No active interview session' });
          return;
        }

        console.log(`Processing text response for session: ${sessionId}`);

        // Process the response
        const result = await sessionService.processResponse(sessionId, data.response);

        socket.emit('interviewer_response', {
          evaluation: result.evaluation,
          nextQuestion: result.nextQuestion,
          status: result.status,
          timeRemaining: result.timeRemaining
        });

        if (result.status === 'completed') {
          socket.emit('interview_completed', {
            message: 'Interview completed successfully!'
          });
        }

      } catch (error) {
        console.error('Text processing error:', error);
        socket.emit('interview_error', {
          message: 'Failed to process response',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // End interview
    socket.on('end_interview', async () => {
      try {
        const sessionId = (socket as any).sessionId;
        if (!sessionId) {
          socket.emit('interview_error', { message: 'No active interview session' });
          return;
        }

        await sessionService.endInterview(sessionId);
        socket.leave(`session_${sessionId}`);
        (socket as any).sessionId = undefined;

        socket.emit('interview_ended', {
          message: 'Interview ended successfully'
        });

        console.log(`Interview ended - Session: ${sessionId}`);
      } catch (error) {
        console.error('End interview error:', error);
        socket.emit('interview_error', {
          message: 'Failed to end interview',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const sessionId = (socket as any).sessionId;
      console.log(`Voice interview client disconnected: ${socket.id}${sessionId ? ` (Session: ${sessionId})` : ''}`);

      if (sessionId) {
        socket.leave(`session_${sessionId}`);
      }
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  });

  console.log('Voice interview WebSocket configured');
}