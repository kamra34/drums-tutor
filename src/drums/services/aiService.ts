import { AiFeedback, AiContext, ChatMessage } from '@shared/types/ai';
import { ExerciseResult, UserProgress } from '@drums/types/curriculum';
import { getTutorPersona } from '@shared/services/tutorPersonas';

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
- Skill profile: ${Object.entries(sp).map(([k, v]) => `${k} ${v}`).join(', ')} (each out of 100)
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
      const persona = context.instrument ? getTutorPersona(context.instrument) : TUTOR_PERSONA
      const systemPrompt =
        persona +
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
      const systemPrompt = `You are an elite studio drummer and drum programmer with decades of experience across rock, funk, jazz, latin, metal, hip-hop, world music, and electronic genres. You have played on hundreds of hit records and know exactly what makes a groove feel good.

## Your Mission
Generate drum patterns as JSON data. Every pattern you create must sound like it belongs on a real recording — musical, groovy, and stylistically authentic.

## Core Principles
1. GROOVE FIRST: The pattern must make people nod their heads. Kick + snare interlock is everything.
2. TIMEKEEPING: Hi-hat or ride must be steady and consistent — this is what the listener locks onto.
3. FEEL OVER COMPLEXITY: A simple pattern that grooves hard beats a complex pattern that sounds random.
4. DYNAMICS MATTER: Ghost notes (3) between main hits create depth and pocket. Accents (2) create emphasis.
5. MUSICAL ARC: Multi-bar patterns should tell a mini story — establish, develop, resolve.
6. AUTHENTIC STYLE: If a genre is specified, channel the signature drummers of that style.

## Technical Format
- Array values: 0=rest, 1=normal hit, 2=accent, 3=ghost note
- Arrays are concatenated bars (bar1 slots, then bar2 slots, etc.)
- Return ONLY valid JSON — no markdown fences, no explanation, no text outside the JSON object.`;

      return await this.callApi(MODEL, systemPrompt, [{ role: 'user', content: prompt }], 4096);
    } catch (err) {
      console.error('AI exercise generation failed:', err);
      throw err;
    }
  }

  // ── Scan notation from image ────────────────────────────────────────────

  async scanNotation(imageDataUri: string): Promise<string> {
    const systemPrompt = `You are an expert drum/rhythm notation reader and transcriber. You analyze images of drum sheet music or rhythm notation and extract it into a structured JSON format.

## Step-by-step process
1. Look at the image carefully. Identify the time signature (numbers at start, default 4/4).
2. Count exactly how many bars/measures are shown. Check for bar lines carefully.
3. Determine the smallest subdivision: 16th notes (4 slots/beat), 8th notes (2 slots/beat), or quarter notes (1 slot/beat).
4. Identify which instruments are present on the staff.
5. Go through EACH BAR one at a time, left to right, and transcribe every beat.

## Drum staff positions (standard percussion notation)
- Top line or above with x/+ notehead = hi-hat closed (or crash if at very top)
- x notehead with circle (o) = hi-hat open
- Middle of staff (3rd line) with regular notehead = snare drum
- Parenthesized ( ) noteheads on snare line = ghost notes (value 3)
- Notes with > mark = accents (value 2)
- Bottom space / lowest line = bass drum (kick)
- Stems up = cymbal layer, stems down = drum layer
- Notes between snare and kick = toms

## For single-line rhythm notation (clapping, counting exercises)
- Use "snare" as the track key
- Quarter note = hit on the beat: [1,0,0,0] in 16th grid, [1,0] in 8th grid
- Eighth note = hit on the beat or "and": occupies 2 slots in 16th grid, 1 slot in 8th grid
- Sixteenth note = one slot in 16th grid
- Eighth rest = silence for one 8th value
- Quarter rest = silence for one beat

## Grid position mapping (critical for accuracy)
For 4/4 time with 16th note resolution (subdivisions=4), each bar has 16 slots:
- Beat 1: slots 0,1,2,3 (1 e & a)
- Beat 2: slots 4,5,6,7 (2 e & a)
- Beat 3: slots 8,9,10,11 (3 e & a)
- Beat 4: slots 12,13,14,15 (4 e & a)

For 4/4 time with 8th note resolution (subdivisions=2), each bar has 8 slots:
- Beat 1: slots 0,1 (1 &)
- Beat 2: slots 2,3 (2 &)
- Beat 3: slots 4,5 (3 &)
- Beat 4: slots 6,7 (4 &)

Common patterns for reference:
- Hi-hat on all 8th notes in 16th grid: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]
- Hi-hat on all 16th notes: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1]
- Snare backbeat (beats 2,4) in 16th grid: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]
- Kick on beats 1,3 in 16th grid: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0]

## Values
- 0 = rest/silence
- 1 = normal hit
- 2 = accent (> mark above note)
- 3 = ghost note (parenthesized or smaller notehead)

## Output format
Think through each bar carefully, then return ONLY a valid JSON object (no explanation, no markdown):
{
  "title": "short description (3-6 words)",
  "description": "brief description of the groove/exercise",
  "timeSignature": [beats_per_bar, beat_value],
  "subdivisions": 4,
  "bars": number_of_bars,
  "bpm": tempo_if_shown_or_90,
  "barByBar": [
    "Bar 1: hi-hat 8ths, kick on 1 and 3, snare on 2 and 4",
    "Bar 2: same pattern with ghost note on snare e of 2",
    ...
  ],
  "tracks": {
    "hihat_closed": [bar1_slots, bar2_slots, ...all concatenated],
    "snare": [bar1_slots, bar2_slots, ...all concatenated],
    "kick": [bar1_slots, bar2_slots, ...all concatenated]
  }
}

Available track keys: "hihat_closed", "hihat_open", "ride", "crash", "hihat_pedal", "snare", "kick", "tom1", "tom2", "floor_tom"

CRITICAL:
- Each array length MUST = beats_per_bar × subdivisions × bars
- Transcribe EXACTLY what you see. Do NOT invent or simplify.
- Think through each bar in "barByBar" before writing the arrays — this helps accuracy
- Ghost notes (parenthesized) = 3, accents (>) = 2, regular = 1, rest = 0`;

    const content = this.buildImageContent(
      'Analyze this drum/rhythm notation image. First identify time signature, bar count, and subdivision. Then go bar by bar, describe what you see, and transcribe into the JSON grid format. Be precise with note placement.',
      imageDataUri
    );

    return await this.callApi(MODEL, systemPrompt, [{ role: 'user', content }], 16384);
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
