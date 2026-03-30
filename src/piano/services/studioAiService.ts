import type { NoteEvent, ChordEvent } from '../types/curriculum'

// ═══════════════════════════════════════════════════════════════════════════════
// Piano Studio AI Service — generates exercises and arrangements via Claude
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

export interface GenerationParams {
  mode: 'exercise' | 'song' | 'style'
  // Exercise mode
  exerciseType?: 'scale' | 'chord-progression' | 'melody' | 'technique' | 'sight-reading'
  // Song mode
  songName?: string
  // Style mode
  stylePrompt?: string
  // Shared params
  difficulty: number       // 1-7
  key: string              // e.g. 'C', 'G', 'Am', 'Bb'
  hands: 'right' | 'left' | 'both'
  timeSignature: [number, number]
  bpm: number
  bars: number             // 4, 8, 16
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

const SYSTEM_PROMPT = `You are Clara, an expert piano instructor and composer. You generate piano exercises and simplified song arrangements as structured JSON data.

CRITICAL RULES:
1. Return ONLY valid JSON — no markdown, no explanation, no backticks
2. Use note format: "C4", "Db3", "F#5" etc. (letter + optional accidental + octave number)
3. Available samples: C3-C6 with all chromatic notes. Use flats (Db, Eb, Gb, Ab, Bb) not sharps for black keys
4. Duration is in beats: 0.25=sixteenth, 0.5=eighth, 1=quarter, 1.5=dotted quarter, 2=half, 3=dotted half, 4=whole
5. Finger numbers 1-5 (1=thumb, 5=pinky). RH: 1=C going up. LH: 5=C going up
6. For "both" hands: include "notesLeft" or "chordsLeft" arrays. RH=treble (C4-C6), LH=bass (C3-C4)
7. Keep pieces musically correct — proper voice leading, correct scale degrees, idiomatic piano writing
8. Match the requested difficulty level:
   - 1-2: C position only, simple rhythms, one hand
   - 3-4: Two positions, eighth notes, simple both-hands
   - 5-6: Full scales, syncopation, both hands independent
   - 7: Advanced technique, complex rhythms

JSON RESPONSE FORMAT:
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

Include "notesLeft" OR "chordsLeft" for both-hands pieces (not both). Single-hand pieces omit these fields.
For chord exercises, put chords in "chordsLeft" and omit "notes" — or put chord names in "notes" field if single-hand chords.`

function buildUserPrompt(params: GenerationParams): string {
  const { mode, difficulty, key, hands, timeSignature, bpm, bars } = params

  let prompt = ''

  if (mode === 'exercise') {
    const type = params.exerciseType || 'technique'
    prompt = `Generate a piano ${type} exercise with these parameters:
- Key: ${key}
- Difficulty: ${difficulty}/7
- Hands: ${hands}
- Time signature: ${timeSignature[0]}/${timeSignature[1]}
- Tempo: ${bpm} BPM
- Length: approximately ${bars} bars
- Type: ${type}`

    if (type === 'scale') prompt += '\nInclude proper fingering for the scale with thumb-under crossings.'
    if (type === 'chord-progression') prompt += '\nUse common progressions (I-IV-V, ii-V-I, etc.) with proper voicing.'
    if (type === 'melody') prompt += '\nCreate a singable, memorable melody with good phrasing.'
    if (type === 'sight-reading') prompt += '\nMix stepwise motion with occasional leaps. Varied rhythms.'
  } else if (mode === 'song') {
    prompt = `Generate a simplified piano arrangement of "${params.songName}":
- Key: ${key}
- Difficulty: ${difficulty}/7
- Hands: ${hands}
- Tempo: ${bpm} BPM
- Simplify to fit the difficulty level
If you don't know the exact melody, create something in the style/spirit of the song.`
  } else if (mode === 'style') {
    prompt = `Generate a piano piece based on this request: "${params.stylePrompt}"
- Key: ${key}
- Difficulty: ${difficulty}/7
- Hands: ${hands}
- Time signature: ${timeSignature[0]}/${timeSignature[1]}
- Tempo: ${bpm} BPM
- Length: approximately ${bars} bars`
  }

  return prompt
}

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

  // Parse JSON from response (strip any accidental markdown)
  const jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('AI returned invalid JSON. Please try again.')
  }

  // Validate and build the result
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
