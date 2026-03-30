import type { NoteEvent, ChordEvent } from '../types/curriculum'

// ═══════════════════════════════════════════════════════════════════════════════
// Piano Studio AI Service — generates exercises and creative pieces via Claude
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

// ── Types ────────────────────────────────────────────────────────────────────

export interface GenerationParams {
  mode: 'exercise'
  exerciseType?: 'scale' | 'chord-progression' | 'melody' | 'technique' | 'sight-reading'
  genre?: string
  length?: 'short' | 'medium' | 'long'
  difficulty: number
  key: string
  hands: 'right' | 'left' | 'both'
  timeSignature: [number, number]
  bpm: number
  bars: number
}

export interface GeneratedPiece {
  title: string
  description: string
  notes: NoteEvent[]
  notesLeft?: NoteEvent[]
  chordsLeft?: ChordEvent[]
  keySignature: string
  timeSignature: [number, number]
  targetBpm: number
  difficulty: number
  hands: 'right' | 'left' | 'both'
}

// ── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Clara, an expert piano instructor and composer. You generate piano exercises as structured JSON data.

CRITICAL RULES:
1. Return ONLY valid JSON — no markdown, no explanation, no backticks
2. Note format: "C4", "Db3", "F#5" etc. Use flats (Db, Eb, Gb, Ab, Bb) not sharps for black keys
3. Available range: C3-C6
4. Duration in beats: 0.25=sixteenth, 0.5=eighth, 1=quarter, 1.5=dotted quarter, 2=half, 3=dotted half, 4=whole
5. Finger numbers 1-5 (1=thumb, 5=pinky)
6. For "both" hands: include "notesLeft" or "chordsLeft". RH=treble (C4-C6), LH=bass (C3-C4)
7. Match difficulty: 1-2=simple, 3-4=intermediate, 5-6=advanced, 7=expert
8. Keep pieces musically correct — proper voice leading, correct scale degrees

JSON FORMAT:
{
  "title": "short descriptive title",
  "description": "one sentence about the piece",
  "notes": [{"note":"C4","duration":1,"finger":1}, ...],
  "notesLeft": [{"note":"C3","duration":4,"finger":5}, ...],
  "chordsLeft": [{"name":"C","notes":["C3","E3","G3"],"duration":4,"fingers":[5,3,1]}, ...],
  "keySignature": "C",
  "timeSignature": [4,4],
  "targetBpm": 80,
  "difficulty": 3,
  "hands": "both"
}

Include "notesLeft" OR "chordsLeft" for both-hands pieces (not both). Single-hand pieces omit these fields.`

// ── Prompt builder ───────────────────────────────────────────────────────────

function buildUserPrompt(params: GenerationParams): string {
  const { mode, hands } = params

  if (mode === 'exercise') {
    const type = params.exerciseType || 'technique'
    const genre = params.genre || 'Classical'
    const lengthMap = { short: '8-12 notes', medium: '16-24 notes', long: '28-40 notes' }
    const lengthDesc = lengthMap[params.length || 'medium']

    let prompt = `Generate a piano ${type} exercise:
- Key: ${params.key}
- Difficulty: ${params.difficulty}/7
- Hands: ${hands}
- Time signature: ${params.timeSignature[0]}/${params.timeSignature[1]}
- Genre/style: ${genre}
- Length: approximately ${lengthDesc} (right hand). Choose an appropriate tempo.
- Type: ${type}`

    if (type === 'scale') prompt += '\nInclude proper fingering with thumb-under crossings.'
    if (type === 'chord-progression') prompt += '\nUse genre-appropriate progressions with proper voicing.'
    if (type === 'melody') prompt += '\nCreate a singable, memorable melody in the requested genre style.'
    if (type === 'sight-reading') prompt += '\nMix stepwise motion with occasional leaps. Varied rhythms.'
    if (type === 'technique') prompt += '\nFocus on a specific technical skill appropriate for the genre.'

    if (genre === 'Jazz') prompt += '\nUse swing feel, 7th chords, blue notes, ii-V-I patterns.'
    if (genre === 'Blues') prompt += '\nUse 12-bar blues form, blue notes (b3, b5, b7), shuffle rhythm.'
    if (genre === 'Pop') prompt += '\nUse common pop progressions, catchy hooks, simple rhythms.'
    if (genre === 'Latin') prompt += '\nUse syncopated rhythms, montuno patterns, Latin voicings.'
    if (genre === 'Film / Cinematic') prompt += '\nUse expressive, atmospheric writing with wide intervals.'

    return prompt
  }

  return ''
}

// ── Generator ────────────────────────────────────────────────────────────────

export async function generatePiece(apiKey: string, params: GenerationParams): Promise<GeneratedPiece> {
  const userPrompt = buildUserPrompt(params)

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`AI generation failed: ${response.status} — ${err}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text ?? ''

  const jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('AI returned invalid JSON. Please try again.')
  }

  const piece: GeneratedPiece = {
    title: (parsed.title as string) || 'Generated Piece',
    description: (parsed.description as string) || '',
    notes: validateNoteEvents(parsed.notes as NoteEvent[]),
    keySignature: (parsed.keySignature as string) || params.key,
    timeSignature: (parsed.timeSignature as [number, number]) || params.timeSignature,
    targetBpm: (parsed.targetBpm as number) || params.bpm,
    difficulty: (parsed.difficulty as number) || params.difficulty,
    hands: (parsed.hands as 'right' | 'left' | 'both') || params.hands,
  }

  if (parsed.notesLeft) piece.notesLeft = validateNoteEvents(parsed.notesLeft as NoteEvent[])
  if (parsed.chordsLeft) piece.chordsLeft = validateChordEvents(parsed.chordsLeft as ChordEvent[])

  if (piece.notes.length === 0 && !piece.chordsLeft?.length) {
    throw new Error('AI generated an empty piece. Please try again.')
  }

  return piece
}

// ── Validators ───────────────────────────────────────────────────────────────

function validateNoteEvents(events: unknown): NoteEvent[] {
  if (!Array.isArray(events)) return []
  return events.filter((e: unknown) => {
    if (typeof e !== 'object' || !e) return false
    const ev = e as Record<string, unknown>
    return typeof ev.note === 'string' && typeof ev.duration === 'number'
  }).map((e: unknown) => {
    const ev = e as Record<string, unknown>
    return { note: ev.note as string, duration: ev.duration as number, finger: ev.finger as number | undefined }
  })
}

function validateChordEvents(events: unknown): ChordEvent[] {
  if (!Array.isArray(events)) return []
  return events.filter((e: unknown) => {
    if (typeof e !== 'object' || !e) return false
    const ev = e as Record<string, unknown>
    return typeof ev.name === 'string' && Array.isArray(ev.notes) && typeof ev.duration === 'number'
  }).map((e: unknown) => {
    const ev = e as Record<string, unknown>
    return {
      name: ev.name as string,
      notes: ev.notes as string[],
      duration: ev.duration as number,
      fingers: ev.fingers as number[] | undefined,
    }
  })
}
