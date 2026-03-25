import { AiFeedback, AiContext, ChatMessage } from '../types/ai';
import { ExerciseResult, UserProgress } from '../types/curriculum';

const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const HAIKU_MODEL = 'claude-3-5-haiku-20241022';
const SONNET_MODEL = 'claude-sonnet-4-20250514';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
}

class AiService {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = localStorage.getItem('anthropic_api_key');
  }

  /**
   * Set or update the API key. Persists to localStorage.
   */
  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('anthropic_api_key', key);
  }

  /**
   * Check whether an API key is configured.
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get structured feedback on an exercise result.
   * Uses Haiku for speed.
   */
  async getExerciseFeedback(
    result: ExerciseResult,
    context: AiContext
  ): Promise<AiFeedback> {
    try {
      const systemPrompt = this.buildSystemPrompt(context.studentLevel);
      const feedbackPrompt = this.buildFeedbackPrompt(result, context);

      const response = await this.callApi(
        HAIKU_MODEL,
        systemPrompt,
        [{ role: 'user', content: feedbackPrompt }],
        1024
      );

      return this.parseFeedbackResponse(response, result.exerciseId);
    } catch (err) {
      console.error('AI feedback request failed:', err);
      return this.getFallbackFeedback(result);
    }
  }

  /**
   * Conversational chat with Claude about drumming.
   * Uses Sonnet for quality.
   */
  async chat(message: string, context: AiContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context.studentLevel);

      // Build conversation history
      const messages: AnthropicMessage[] = [];
      if (context.chatHistory) {
        for (const msg of context.chatHistory.slice(-20)) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
      messages.push({ role: 'user', content: message });

      const response = await this.callApi(SONNET_MODEL, systemPrompt, messages, 2048);
      return response;
    } catch (err) {
      console.error('AI chat request failed:', err);
      return 'Sorry, I was unable to process your message. Please check your API key and try again.';
    }
  }

  /**
   * Get a daily practice suggestion based on the user's progress.
   */
  async getDailySuggestion(progress: UserProgress): Promise<string> {
    try {
      const level = this.inferLevel(progress);
      const systemPrompt = this.buildSystemPrompt(level);

      const prompt = `Based on the student's progress, suggest what they should practice today.

Current module: ${progress.currentModule}
Completed lessons: ${progress.completedLessons.length}
Recent exercises: ${progress.exerciseResults.slice(-10).length}
Skill profile:
  - Timing: ${progress.skillProfile.timing}/100
  - Dynamics: ${progress.skillProfile.dynamics}/100
  - Independence: ${progress.skillProfile.independence}/100
  - Speed: ${progress.skillProfile.speed}/100
  - Musicality: ${progress.skillProfile.musicality}/100

${
  progress.exerciseResults.length > 0
    ? `Last exercise score: ${progress.exerciseResults[progress.exerciseResults.length - 1].score}/100 (${progress.exerciseResults[progress.exerciseResults.length - 1].stars} stars)`
    : 'No exercises completed yet.'
}

Give a brief, encouraging suggestion (2-3 sentences) about what to focus on today.`;

      return await this.callApi(HAIKU_MODEL, systemPrompt, [{ role: 'user', content: prompt }], 512);
    } catch (err) {
      console.error('Daily suggestion request failed:', err);
      return 'Try warming up with some basic patterns today, then work on the exercises in your current module. Consistency is key!';
    }
  }

  /**
   * Build the system prompt based on student level.
   */
  private buildSystemPrompt(level: string): string {
    const basePrompt = `You are an expert drum tutor AI assistant. You are patient, encouraging, and knowledgeable about all aspects of drumming — from basic technique to advanced concepts.

You provide feedback in a structured, actionable way. You understand drum notation, time signatures, rudiments, and musical theory as it relates to percussion.

Always be positive and motivating, while still being honest about areas for improvement.`;

    switch (level) {
      case 'beginner':
        return `${basePrompt}

The student is a beginner. Use simple language, avoid jargon unless you explain it. Focus on fundamentals: stick grip, posture, basic timing, and simple patterns. Celebrate small wins.`;

      case 'intermediate':
        return `${basePrompt}

The student is at an intermediate level. They understand basic patterns and can play along to simple songs. Focus on dynamics, limb independence, fills, and more complex time signatures. Push them to improve consistency.`;

      case 'advanced':
        return `${basePrompt}

The student is advanced. They have strong fundamentals and can handle complex patterns. Focus on musicality, groove feel, subtle dynamics, odd time signatures, polyrhythms, and performance-level execution. Be more technical in your feedback.`;

      default:
        return basePrompt;
    }
  }

  /**
   * Build a detailed prompt from exercise scoring data.
   */
  private buildFeedbackPrompt(result: ExerciseResult, context: AiContext): string {
    const timingEntries = Object.entries(result.timingData)
      .map(
        ([pad, stats]) =>
          `  ${pad}: avg offset ${stats?.avgOffset}ms, std dev ${stats?.stdDev}ms, hit ${stats?.hitCount}/${(stats?.hitCount ?? 0) + (stats?.missCount ?? 0)}`
      )
      .join('\n');

    const velocityEntries = Object.entries(result.velocityData)
      .map(
        ([pad, stats]) =>
          `  ${pad}: avg velocity ${stats?.avg}, range ${stats?.min}-${stats?.max}, consistency (std dev) ${stats?.stdDev}`
      )
      .join('\n');

    return `Please analyze this drum exercise performance and provide feedback.

Exercise: ${context.exerciseName ?? result.exerciseId}
BPM: ${result.bpm}
Overall accuracy: ${(result.accuracy * 100).toFixed(1)}%
Score: ${result.score}/100
Stars: ${result.stars}/3
Missed notes: ${result.missedNotes}

Timing breakdown by pad:
${timingEntries || '  (no data)'}

Velocity breakdown by pad:
${velocityEntries || '  (no data)'}

Respond in this exact JSON format:
{
  "summary": "A 1-2 sentence overall assessment",
  "tips": ["Specific actionable tip 1", "Specific actionable tip 2", "Specific actionable tip 3"],
  "encouragement": "A brief motivating message",
  "suggestedNextExercise": "optional suggestion for what to try next"
}`;
  }

  /**
   * Parse Claude's response into an AiFeedback object.
   */
  private parseFeedbackResponse(response: string, exerciseId: string): AiFeedback {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        exerciseId,
        summary: parsed.summary ?? 'Good effort!',
        tips: Array.isArray(parsed.tips) ? parsed.tips : [],
        encouragement: parsed.encouragement ?? 'Keep practicing!',
        suggestedNextExercise: parsed.suggestedNextExercise,
      };
    } catch {
      // If parsing fails, treat the whole response as summary
      return {
        exerciseId,
        summary: response.slice(0, 200),
        tips: ['Keep working on your timing consistency.'],
        encouragement: 'Every practice session makes you better!',
      };
    }
  }

  /**
   * Fallback feedback when the API is unavailable.
   */
  private getFallbackFeedback(result: ExerciseResult): AiFeedback {
    const tips: string[] = [];

    if (result.accuracy < 0.7) {
      tips.push('Try slowing down the tempo and focus on hitting every note accurately.');
    }
    if (result.missedNotes > 5) {
      tips.push('Practice the pattern slowly, making sure you know which pads to hit on each beat.');
    }

    // Check timing consistency
    for (const [pad, stats] of Object.entries(result.timingData)) {
      if (stats && stats.stdDev > 20) {
        tips.push(`Your ${pad} timing is inconsistent. Try isolating that part and practicing it alone.`);
        break;
      }
    }

    if (tips.length === 0) {
      tips.push('Great work! Try increasing the tempo for a bigger challenge.');
    }

    return {
      exerciseId: result.exerciseId,
      summary:
        result.stars >= 2
          ? `Good job! You scored ${result.score}/100.`
          : `You scored ${result.score}/100. Keep practicing to improve!`,
      tips,
      encouragement:
        result.stars >= 2
          ? 'You are making great progress!'
          : 'Every practice session counts. You will get there!',
    };
  }

  /**
   * Make an API call to Claude via fetch.
   */
  private async callApi(
    model: string,
    systemPrompt: string,
    messages: AnthropicMessage[],
    maxTokens: number
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API key not set. Please configure your Anthropic API key.');
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
    }

    const data: AnthropicResponse = await response.json();

    if (!data.content || data.content.length === 0) {
      throw new Error('Empty response from API');
    }

    return data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');
  }

  /**
   * Infer student level from progress data.
   */
  private inferLevel(
    progress: UserProgress
  ): 'beginner' | 'intermediate' | 'advanced' {
    const avgSkill =
      (progress.skillProfile.timing +
        progress.skillProfile.dynamics +
        progress.skillProfile.independence +
        progress.skillProfile.speed +
        progress.skillProfile.musicality) /
      5;

    if (avgSkill >= 75) return 'advanced';
    if (avgSkill >= 45) return 'intermediate';
    return 'beginner';
  }
}

export const aiService = new AiService();
