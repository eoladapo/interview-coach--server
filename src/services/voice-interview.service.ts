import { GoogleGenerativeAI } from '@google/generative-ai';
import { InterviewContext } from '../interfaces/interviewer.interface';

interface VoiceInterviewConfig {
  sessionId: string;
  candidateProfile: {
    level: string;
    technologies: string[];
    targetRole: string;
    industry?: string;
  };
}

export class VoiceInterviewService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-native-audio-preview-12-2025'
    });
  }

  /**
   * Initialize voice interview session with system prompt
   */
  async initializeVoiceInterview(config: VoiceInterviewConfig): Promise<string> {
    const { candidateProfile } = config;
    
    const systemPrompt = this.buildInterviewerSystemPrompt(candidateProfile);
    
    try {
      // Start conversation with system prompt
      const chat = this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          },
          {
            role: 'model', 
            parts: [{ text: 'I understand. I\'m ready to conduct this technical interview. I\'ll ask progressively deeper questions, drill down to implementation details, and adapt based on the candidate\'s responses. Let\'s begin when the candidate is ready.' }]
          }
        ]
      });

      // Generate opening question
      const result = await chat.sendMessage(
        `Please start the interview with an opening question for this ${candidateProfile.level} ${candidateProfile.targetRole} candidate.`
      );
      
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Failed to initialize voice interview:', error);
      throw new Error('Unable to start voice interview session');
    }
  }

  /**
   * Process voice response and generate next question
   */
  async processVoiceResponse(
    sessionId: string, 
    audioResponse: string, // This would be transcribed audio
    context: InterviewContext
  ): Promise<{
    evaluation: {
      score: number;
      strengths: string[];
      weaknesses: string[];
      feedback: string;
    };
    nextQuestion?: string;
    audioResponse?: Buffer; // This would be the audio output
    shouldContinue: boolean;
  }> {
    try {
      const conversationHistory = context.conversationHistory
        .slice(-6) // Last 6 messages for context
        .map(msg => `${msg.speaker}: ${msg.content}`)
        .join('\n');

      const evaluationPrompt = `
PREVIOUS CONVERSATION:
${conversationHistory}

CANDIDATE'S LATEST RESPONSE:
"${audioResponse}"

CONTEXT:
- Time remaining: ${context.timeRemaining} minutes
- Current topic: ${context.currentTopic}
- Candidate level: ${context.userProfile.level}
- Target role: ${context.userProfile.targetRole}

As the interviewer, evaluate this response and decide what to ask next. Your response should:

1. Evaluate their answer (score 1-5, strengths, weaknesses)
2. Generate the next question that builds naturally from their response
3. Drill deeper into implementation if they show conceptual understanding
4. Switch topics if current area is exhausted
5. Keep the conversation flowing naturally

Respond in this format:
EVALUATION:
Score: X/5
Strengths: [list]
Weaknesses: [list]
Feedback: [brief feedback]

NEXT QUESTION:
[Your next question or "INTERVIEW_COMPLETE" if time is up]

Remember: You're a senior engineer having a natural conversation, not reading from a script.`;

      const result = await this.model.generateContent(evaluationPrompt);
      const response = await result.response;
      const fullResponse = response.text();

      return this.parseVoiceInterviewResponse(fullResponse, context);
    } catch (error) {
      console.error('Failed to process voice response:', error);
      throw new Error('Unable to process voice response');
    }
  }

  /**
   * Generate audio response using Gemini's native audio capabilities
   */
  async generateAudioResponse(textResponse: string): Promise<Buffer> {
    // Note: This is a placeholder for Gemini's native audio generation
    // The actual implementation would use Gemini's Live API audio output
    
    try {
      // For now, return text that would be converted to speech
      // In production, this would directly return audio bytes from Gemini
      return Buffer.from(textResponse, 'utf-8');
    } catch (error) {
      console.error('Failed to generate audio response:', error);
      throw new Error('Unable to generate audio response');
    }
  }

  /**
   * Handle real-time audio streaming (Live API)
   */
  async startLiveAudioInterview(config: VoiceInterviewConfig) {
    // This would implement Gemini's Live API for real-time audio streaming
    // The Live API enables continuous audio input/output streams
    
    const systemPrompt = this.buildInterviewerSystemPrompt(config.candidateProfile);
    
    return {
      sessionId: config.sessionId,
      message: 'Live audio interview session would be initialized here',
      instructions: [
        'Connect to Gemini Live API WebSocket',
        'Configure audio input/output streams', 
        'Set system prompt for interviewer behavior',
        'Enable real-time conversation flow'
      ]
    };
  }

  /**
   * Build system prompt for the AI interviewer
   */
  private buildInterviewerSystemPrompt(candidateProfile: any): string {
    return `
You are a senior software engineer conducting a voice-based technical interview. 

CANDIDATE PROFILE:
- Level: ${candidateProfile.level}
- Target Role: ${candidateProfile.targetRole}
- Technologies: ${candidateProfile.technologies.join(', ')}
- Industry: ${candidateProfile.industry || 'General'}

INTERVIEW STYLE:
- Conversational and natural (you're talking, not typing)
- Ask follow-up questions like a real interviewer
- Start with concepts, drill down to implementation syntax
- Say things like "Interesting, tell me more about..." or "How would you actually implement that?"
- Ask for specific code examples: "Show me what that looks like in React"
- Test edge cases: "What if the API call fails?"
- Be encouraging but challenging

PROGRESSION STRATEGY:
1. Start with high-level concept questions
2. If they know concepts → ask HOW they'd implement
3. If they mention implementation → ask for actual syntax/code
4. If they show syntax knowledge → test edge cases
5. When topic is exhausted → move to next technology area

VOICE CONVERSATION RULES:
- Keep questions concise (this is spoken, not written)
- Use natural speech patterns
- Don't read lists - have a conversation
- Ask ONE question at a time
- Wait for their complete answer before responding
- Build on what they just said

EVALUATION CRITERIA:
- Technical accuracy
- Implementation knowledge (not just theory)
- Code syntax familiarity  
- Problem-solving approach
- Communication clarity

Remember: This is a 30-minute voice conversation. Keep it flowing naturally while gathering comprehensive technical assessment.`;
  }

  /**
   * Parse the AI interviewer's response
   */
  private parseVoiceInterviewResponse(response: string, context: InterviewContext) {
    try {
      const evaluationMatch = response.match(/EVALUATION:([\s\S]*?)NEXT QUESTION:/);
      const questionMatch = response.match(/NEXT QUESTION:([\s\S]*?)$/);
      
      let evaluation = {
        score: 3,
        strengths: ['Provided response'],
        weaknesses: ['Need more detail'],
        feedback: 'Response provided'
      };
      
      let nextQuestion: string | undefined;
      let shouldContinue = true;

      // Parse evaluation
      if (evaluationMatch) {
        const evalText = evaluationMatch[1];
        const scoreMatch = evalText.match(/Score:\s*(\d+)/);
        const strengthsMatch = evalText.match(/Strengths:\s*\[(.*?)\]/);
        const weaknessesMatch = evalText.match(/Weaknesses:\s*\[(.*?)\]/);
        const feedbackMatch = evalText.match(/Feedback:\s*(.*?)(?=\n|$)/);
        
        if (scoreMatch) evaluation.score = parseInt(scoreMatch[1]);
        if (strengthsMatch) evaluation.strengths = strengthsMatch[1].split(',').map(s => s.trim());
        if (weaknessesMatch) evaluation.weaknesses = weaknessesMatch[1].split(',').map(s => s.trim());
        if (feedbackMatch) evaluation.feedback = feedbackMatch[1].trim();
      }

      // Parse next question
      if (questionMatch) {
        const question = questionMatch[1].trim();
        if (question === 'INTERVIEW_COMPLETE' || context.timeRemaining <= 2) {
          shouldContinue = false;
        } else {
          nextQuestion = question;
        }
      }

      return {
        evaluation,
        nextQuestion,
        shouldContinue
      };
    } catch (error) {
      console.error('Failed to parse voice interview response:', error);
      
      // Fallback response
      return {
        evaluation: {
          score: 3,
          strengths: ['Response provided'],
          weaknesses: ['Parsing error occurred'],
          feedback: 'Technical issue with response processing'
        },
        nextQuestion: 'Could you elaborate on your previous answer?',
        shouldContinue: true
      };
    }
  }
}