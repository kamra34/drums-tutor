import { AiFeedback, AiContext, ChatMessage } from '../types/ai';
import { ExerciseResult, UserProgress } from '../types/curriculum';

const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-4-6';

// Content block types for the Anthropic API
interface TextBlock {
  type: 'text';
  text: string;
}

interface ImageBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

type ContentBlock = TextBlock | ImageBlock;

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
}

// ── Rich system prompt ──────────────────────────────────────────────────────

const TUTOR_PERSONA = `You are **Max**, a world-class drum instructor with over 20 years of professional playing and teaching experience. You've toured internationally, recorded on dozens of albums, and hold a degree in percussion performance. You now dedicate yourself to teaching — it's your passion.

## Your Personality
- **Patient and encouraging** — you never make students feel bad for mistakes
- **Enthusiastic** — you genuinely love drums and it shows in every response
- **Clear communicator** — you explain complex concepts simply, using analogies when helpful
- **Structured** — you give actionable advice, not vague encouragement
- **Honest** — you praise what's good AND identify what needs work

## Your Expertise
- All styles: rock, jazz, funk, Latin, metal, pop, world percussion
- Drum notation reading and writing
- All 40 PAS rudiments and their applications
- Technique: Moeller, finger control, heel-toe, open/closed grip
- Musical concepts: dynamics, phrasing, groove, feel, odd time signatures, polyrhythms
- Practice methodology: effective practice routines, tempo ladders, goal setting
- Drum kit setup, tuning, and gear advice
- Music theory as it relates to rhythm and percussion

## Response Formatting
- Use **markdown** for structure: headers, bold, lists, code blocks
- Use backtick code blocks for sticking patterns: \`RLRL LRLR\`
- Use numbered lists for step-by-step instructions
- Use bullet points for tips and options
- Keep responses focused and concise — respect the student's time
- When discussing notation, describe it clearly since you can't draw it
- If the student shares an image, analyze it carefully and reference specific things you see

## Teaching Approach
- Always start by acknowledging what the student did well or what's good about their question
- Break complex topics into digestible pieces
- Suggest specific exercises with BPM ranges when recommending practice
- Relate new concepts back to what the student already knows
- End responses with a clear next step or follow-up question when appropriate`;

function buildLevelContext(level: string): string {
  switch (level) {
    case 'beginner':
      return `\n\n## Current Student Level: BEGINNER
- Use simple language, define any jargon
- Focus on: grip, posture, basic timing, quarter and eighth notes, simple rock beats
- Celebrate small victories — they need motivation
- Suggest BPM ranges of 50-80 for exercises
- Don't overwhelm with too many concepts at once`;

    case 'intermediate':
      return `\n\n## Current Student Level: INTERMEDIATE
- They know basic patterns, time signatures, and rudiments
- Focus on: dynamics, fills, limb independence, 16th notes, syncopation, ghost notes
- Push for consistency and groove feel
- Suggest BPM ranges of 70-120 for exercises
- Can handle more technical terminology`;

    case 'advanced':
      return `\n\n## Current Student Level: ADVANCED
- Strong fundamentals, can handle complex patterns
- Focus on: musicality, odd time signatures, polyrhythms, metric modulation, brush technique, advanced independence
- Be more technical and detailed in feedback
- Suggest BPM ranges of 100-200+ for exercises
- Discuss stylistic nuances and professional-level concepts`;

    default:
      return '';
  }
}

function buildProgressContext(progress: UserProgress): string {
  const sp = progress.skillProfile;
  const weakest = Object.entries(sp).sort(([, a], [, b]) => a - b)[0];
  const strongest = Object.entries(sp).sort(([, a], [, b]) => b - a)[0];

  return `\n\n## Student's Current Progress
- Current module: ${progress.currentModule}
- Lessons completed: ${progress.completedLessons.length}
- Exercises played: ${progress.exerciseResults.length}
- Skill profile: Timing ${sp.timing}, Dynamics ${sp.dynamics}, Independence ${sp.independence}, Speed ${sp.speed}, Musicality ${sp.musicality} (each out of 100)
- Strongest area: ${strongest[0]} (${strongest[1]}/100)
- Area needing work: ${weakest[0]} (${weakest[1]}/100)
${progress.exerciseResults.length > 0 ? `- Last exercise score: ${progress.exerciseResults[progress.exerciseResults.length - 1].score}/100` : '- No exercises completed yet'}`;
}

// ── Suggested follow-ups ────────────────────────────────────────────────────

const FOLLOWUP_INSTRUCTION = `

After your response, on a new line, add exactly 3 contextual follow-up suggestions the student might want to ask next. Format them as:
<followups>
suggestion 1
suggestion 2
suggestion 3
</followups>

These should be natural, relevant next questions — not generic. Keep each under 50 characters.`;

/**
 * Extract follow-up suggestions from the response and return clean text + suggestions.
 */
export function parseFollowups(response: string): { text: string; followups: string[] } {
  const match = response.match(/<followups>\s*([\s\S]*?)\s*<\/followups>/);
  if (!match) return { text: response.trim(), followups: [] };

  const text = response.replace(/<followups>[\s\S]*?<\/followups>/, '').trim();
  const followups = match[1]
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .slice(0, 3);

  return { text, followups };
}

// ── Service class ───────────────────────────────────────────────────────────

class AiService {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = localStorage.getItem('anthropic_api_key');
  }

  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('anthropic_api_key', key);
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  // ── Exercise feedback (Haiku for speed) ─────────────────────────────────

  async getExerciseFeedback(
    result: ExerciseResult,
    context: AiContext
  ): Promise<AiFeedback> {
    try {
      const systemPrompt = TUTOR_PERSONA + buildLevelContext(context.studentLevel);
      const feedbackPrompt = this.buildFeedbackPrompt(result, context);

      const response = await this.callApi(
        MODEL,
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

  // ── Chat (Sonnet for quality) ───────────────────────────────────────────

  async chat(message: string, context: AiContext, image?: string): Promise<string> {
    try {
      const systemPrompt =
        TUTOR_PERSONA +
        buildLevelContext(context.studentLevel) +
        (context.skillProfile
          ? buildProgressContext({
              currentModule: context.currentModule,
              completedLessons: [],
              exerciseResults: [],
              skillProfile: context.skillProfile,
            } as UserProgress)
          : '') +
        FOLLOWUP_INSTRUCTION;

      // Build conversation history
      const messages: AnthropicMessage[] = [];
      if (context.chatHistory) {
        for (const msg of context.chatHistory.slice(-20)) {
          if (msg.role === 'user' && msg.image) {
            // Reconstruct image message
            messages.push({
              role: 'user',
              content: this.buildImageContent(msg.content, msg.image),
            });
          } else {
            messages.push({ role: msg.role, content: msg.content });
          }
        }
      }

      // Build current message content
      if (image) {
        messages.push({ role: 'user', content: this.buildImageContent(message, image) });
      } else {
        messages.push({ role: 'user', content: message });
      }

      const response = await this.callApi(MODEL, systemPrompt, messages, 2048);
      return response;
    } catch (err) {
      console.error('AI chat request failed:', err);
      return 'Sorry, I was unable to process your message. Please check your API key and try again.';
    }
  }

  // ── Daily suggestion (Haiku) ────────────────────────────────────────────

  async getDailySuggestion(progress: UserProgress): Promise<string> {
    try {
      const level = this.inferLevel(progress);
      const systemPrompt = TUTOR_PERSONA + buildLevelContext(level);

      const prompt = `Based on the student's progress, suggest what they should practice today.
${buildProgressContext(progress)}

Give a brief, encouraging suggestion (2-3 sentences) about what to focus on today. Be specific — mention a rudiment, exercise type, or concept by name.`;

      return await this.callApi(MODEL, systemPrompt, [{ role: 'user', content: prompt }], 512);
    } catch (err) {
      console.error('Daily suggestion request failed:', err);
      return 'Try warming up with some basic patterns today, then work on the exercises in your current module. Consistency is key!';
    }
  }

  // ── Generate conversation title (Haiku) ─────────────────────────────────

  async generateTitle(firstMessage: string): Promise<string> {
    try {
      const response = await this.callApi(
        MODEL,
        'Generate a short title (3-6 words, no quotes) for a drum tutoring conversation that starts with this message. Just output the title, nothing else.',
        [{ role: 'user', content: firstMessage }],
        30
      );
      return response.trim().replace(/^["']|["']$/g, '');
    } catch {
      return firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '');
    }
  }

  // ── Suggest exercise name ──────────────────────────────────────────────

  async suggestExerciseName(config: {
    noteValues?: Record<string, boolean>
    instruments?: Record<string, boolean>
    difficulty?: number
    bpm?: number
    timeSignature?: number[]
    aiPrompt?: string
  }): Promise<string> {
    try {
      const activeNotes = Object.entries(config.noteValues ?? {}).filter(([, v]) => v).map(([k]) => k)
      const activeInst = Object.entries(config.instruments ?? {}).filter(([, v]) => v).map(([k]) => k)
      const prompt = `Suggest a creative, short name (2-5 words) for a drum exercise with these settings:
- Note values: ${activeNotes.join(', ') || 'quarter, eighth'}
- Instruments: ${activeInst.join(', ') || 'kick, snare, hihat'}
- Difficulty: ${config.difficulty ?? 5}/10
- BPM: ${config.bpm ?? 90}
- Time signature: ${(config.timeSignature ?? [4, 4]).join('/')}
${config.aiPrompt ? `- Style hint: ${config.aiPrompt}` : ''}

Output ONLY the name, nothing else. Be creative — think of musical terms, groove descriptions, or evocative names. Examples: "Midnight Shuffle", "Pocket Groove", "Syncopated Storm", "Ghost Note Flow".`

      const response = await this.callApi(
        MODEL,
        'You name drum exercises with creative, concise titles. Output only the title, no quotes, no explanation.',
        [{ role: 'user', content: prompt }],
        30
      )
      return response.trim().replace(/^["']|["']$/g, '')
    } catch {
      return `Custom Exercise ${Math.floor(Math.random() * 1000)}`
    }
  }

  // ── Generate exercise (used by ReadingPracticePage) ──────────────────────

  async generateExercise(prompt: string): Promise<string> {
    try {
      const systemPrompt = `${TUTOR_PERSONA}

## Exercise Generation Mode
You are generating a drum notation exercise. You have deep knowledge of what makes a musically valid, pedagogically useful drum pattern. Ensure:
- The pattern sounds natural and musical, not random
- Difficulty matches the requested level
- Kick and snare form a coherent groove foundation
- Hi-hat/ride patterns are consistent and idiomatic for the style
- Accents and ghost notes are placed where a real drummer would play them
- The exercise teaches something specific and useful

Return ONLY the JSON object requested — no explanation, no markdown, no extra text.`;

      return await this.callApi(MODEL, systemPrompt, [{ role: 'user', content: prompt }], 4096);
    } catch (err) {
      console.error('AI exercise generation failed:', err);
      throw err;
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private buildImageContent(text: string, dataUri: string): ContentBlock[] {
    // Parse data URI: "data:image/png;base64,AAAA..."
    const match = dataUri.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return [{ type: 'text', text }];
    }

    const blocks: ContentBlock[] = [];
    if (text) {
      blocks.push({ type: 'text', text });
    }
    blocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: match[1],
        data: match[2],
      },
    });
    return blocks;
  }

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

  private parseFeedbackResponse(response: string, exerciseId: string): AiFeedback {
    try {
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
      return {
        exerciseId,
        summary: response.slice(0, 200),
        tips: ['Keep working on your timing consistency.'],
        encouragement: 'Every practice session makes you better!',
      };
    }
  }

  private getFallbackFeedback(result: ExerciseResult): AiFeedback {
    const tips: string[] = [];

    if (result.accuracy < 0.7) {
      tips.push('Try slowing down the tempo and focus on hitting every note accurately.');
    }
    if (result.missedNotes > 5) {
      tips.push('Practice the pattern slowly, making sure you know which pads to hit on each beat.');
    }

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
