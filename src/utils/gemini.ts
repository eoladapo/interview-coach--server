import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

interface AIResponse {
  text: string;
}

class AIService {
  private genAI?: GoogleGenerativeAI;
  private geminiModel?: any;
  private useOllama: boolean;
  private ollamaBaseUrl: string;
  private ollamaModel: string;
  private isOllamaWarmedUp: boolean = false;

  constructor() {
    // Initialize Gemini as primary
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(geminiApiKey);
      this.geminiModel = this.genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
      });
    }

    // Configure Ollama as fallback
    this.useOllama = process.env.USE_OLLAMA === 'true';
    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

    // Only warm up Ollama if it's enabled
    if (this.useOllama) {
      this.warmUpOllama();
    }
  }

  private async warmUpOllama() {
    try {
      console.log('Warming up Ollama fallback model...');
      const response = await axios.post(`${this.ollamaBaseUrl}/api/generate`, {
        model: this.ollamaModel,
        prompt: 'Hi',
        stream: false,
        options: {
          temperature: 0.1
        }
      }, {
        timeout: 120000 // 2 minute timeout for warmup
      });

      if (response.data?.response) {
        this.isOllamaWarmedUp = true;
        console.log('✅ Ollama fallback model ready');
      }
    } catch (error: any) {
      console.warn('⚠️ Ollama fallback warmup failed (will try on-demand):', error.message);
      this.isOllamaWarmedUp = false;
    }
  }

  async generateText(prompt: string): Promise<string> {
    // Try Gemini first (primary)
    if (this.geminiModel) {
      try {
        return await this.generateWithGemini(prompt);
      } catch (error: any) {
        console.warn('Gemini failed, falling back to Ollama:', error.message);
        // Fall back to Ollama if available
        try {
          return await this.generateWithOllama(prompt);
        } catch (ollamaError: any) {
          console.error('Both Gemini and Ollama failed:', ollamaError.message);
          throw new Error('AI generation failed: Both primary and fallback services unavailable');
        }
      }
    } else {
      // If Gemini isn't configured, try Ollama
      return await this.generateWithOllama(prompt);
    }
  }

  private async generateWithOllama(prompt: string): Promise<string> {
    try {
      console.log('Sending request to Ollama:', this.ollamaBaseUrl, 'Model:', this.ollamaModel);

      // Use longer timeout if model isn't warmed up yet
      const timeout = this.isOllamaWarmedUp ? 60000 : 300000; // 1 min vs 5 min

      const response = await axios.post(`${this.ollamaBaseUrl}/api/generate`, {
        model: this.ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9
        }
      }, {
        timeout,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      console.log('Ollama response received, length:', response.data?.response?.length || 0);

      // Mark as warmed up after first successful response
      if (!this.isOllamaWarmedUp) {
        this.isOllamaWarmedUp = true;
        console.log('✅ Ollama model now warmed up');
      }

      return response.data.response;
    } catch (error: any) {
      console.error('Ollama API error:', error.message);
      console.error('Error code:', error.code);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw new Error('Failed to generate response from Ollama');
    }
  }

  private async generateWithGemini(prompt: string): Promise<string> {
    try {
      if (!this.geminiModel) {
        throw new Error('Gemini not configured');
      }

      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate response from Gemini');
    }
  }

  async generateInterviewQuestion(context: {
    candidateLevel: string;
    technologies: string[];
    industry?: string;
    previousQuestions?: string[];
    candidateResponse?: string;
  }): Promise<string> {
    const { candidateLevel, technologies, industry, previousQuestions, candidateResponse } = context;

    const prompt = `
You are a senior software engineer conducting a technical interview. Your role is to ask progressively deeper questions that test both conceptual knowledge and implementation ability.

CANDIDATE PROFILE:
- Level: ${candidateLevel}
- Technologies: ${technologies.join(', ')}
- Industry: ${industry || 'General'}

INTERVIEW STYLE:
- Start with concepts, then drill down to implementation details
- Ask "How would you implement that?" and "Show me the actual code/syntax"
- Focus on real-world scenarios, not theoretical problems
- Be conversational but challenging

${previousQuestions?.length ? `
PREVIOUS QUESTIONS ASKED:
${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Avoid repeating similar questions.
` : ''}

${candidateResponse ? `
CANDIDATE'S LAST RESPONSE:
"${candidateResponse}"

Based on their response, ask a relevant follow-up that probes deeper into their implementation knowledge. If they mentioned a concept, ask them HOW they would implement it using specific technologies from their stack.
` : `
Ask an opening question that tests their understanding of a core concept in their technology stack, then be ready to drill down into implementation details.
`}

Generate ONE interview question that follows this pattern:
1. Be specific to their technology stack
2. Test both understanding AND implementation
3. Be realistic and practical
4. Set up for progressive follow-ups

Your question:`;

    return this.generateText(prompt);
  }

  async evaluateResponse(context: {
    question: string;
    candidateResponse: string;
    candidateLevel: string;
    technologies: string[];
    expectedConcepts?: string[];
  }): Promise<{
    score: number; // 1-5
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    suggestedFollowUp: string;
  }> {
    const { question, candidateResponse, candidateLevel, technologies, expectedConcepts } = context;

    const prompt = `
You are evaluating a candidate's response in a technical interview.

QUESTION ASKED:
"${question}"

CANDIDATE RESPONSE:
"${candidateResponse}"

CANDIDATE PROFILE:
- Level: ${candidateLevel}
- Technologies: ${technologies.join(', ')}

EVALUATION CRITERIA:
1. Correctness (technically accurate?)
2. Completeness (covers key aspects?)
3. Implementation Knowledge (knows actual syntax/methods?)
4. Communication (clear explanation?)
5. Level Appropriateness (matches ${candidateLevel} expectations?)

${expectedConcepts?.length ? `
KEY CONCEPTS TO LOOK FOR:
${expectedConcepts.join(', ')}
` : ''}

Provide your evaluation in this JSON format:
{
  "score": <number 1-5>,
  "feedback": "<detailed feedback explaining the score>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "suggestedFollowUp": "<a follow-up question to probe deeper or test implementation>"
}

Focus on whether they can actually IMPLEMENT what they're talking about, not just conceptual knowledge.`;

    const response = await this.generateText(prompt);

    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse evaluation JSON:', error);
      // Fallback response
      return {
        score: 3,
        feedback: 'Response evaluated but parsing failed',
        strengths: ['Provided an answer'],
        weaknesses: ['Evaluation system error'],
        suggestedFollowUp: 'Could you elaborate on your implementation approach?'
      };
    }
  }

  async generateReport(context: {
    candidateName?: string;
    sessionSummary: {
      questionsAsked: string[];
      responses: string[];
      scores: number[];
    };
    overallPerformance: {
      strengths: string[];
      weaknesses: string[];
      skillGaps: string[];
    };
  }): Promise<string> {
    const { sessionSummary, overallPerformance } = context;
    const avgScore = sessionSummary.scores.reduce((a, b) => a + b, 0) / sessionSummary.scores.length;

    const prompt = `
Generate a comprehensive interview report based on this technical interview session.

SESSION SUMMARY:
- Questions Asked: ${sessionSummary.questionsAsked.length}
- Average Score: ${avgScore.toFixed(1)}/5.0
- Individual Scores: ${sessionSummary.scores.join(', ')}

PERFORMANCE ANALYSIS:
Strengths: ${overallPerformance.strengths.join(', ')}
Weaknesses: ${overallPerformance.weaknesses.join(', ')}
Skill Gaps: ${overallPerformance.skillGaps.join(', ')}

Generate a professional interview report with:
1. Executive Summary
2. Technical Assessment 
3. Strengths & Areas for Improvement
4. Specific Recommendations
5. Next Steps

Keep it constructive and actionable.`;

    return this.generateText(prompt);
  }
}

// Export singleton instance
export const aiService = new AIService();