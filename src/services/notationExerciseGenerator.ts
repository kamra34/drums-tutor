/**
 * Algorithmic notation exercise generator.
 * Creates infinite, musically-valid drum patterns based on configurable parameters.
 */

import { DrumPad } from '../types/midi'
import { HitValue, PatternData } from '../types/curriculum'
import { createPattern } from '../data/patterns'

// ── Configuration types ─────────────────────────────────────────────────────

export interface ExerciseConfig {
  // Rhythm complexity
  noteValues: NoteValueSet       // which note durations to include
  includeRests: boolean          // insert rests in the pattern
  includeSyncopation: boolean    // offbeat accents, "and" hits
  includeDynamics: boolean       // accents (>) and ghost notes

  // Instruments
  instruments: InstrumentSet

  // Structure
  timeSignature: [number, number]
  bars: number
  bpm: number

  // Difficulty (1-10) — influences density and complexity
  difficulty: number

  // AI seed text (optional — if set, AI generates the pattern)
  aiPrompt?: string
}

export interface NoteValueSet {
  whole: boolean
  half: boolean
  quarter: boolean
  eighth: boolean
  sixteenth: boolean
  triplet: boolean
}

export interface InstrumentSet {
  kick: boolean
  snare: boolean
  hihatClosed: boolean
  hihatOpen: boolean
  ride: boolean
  crash: boolean
  tom1: boolean
  tom2: boolean
  floorTom: boolean
  hihatPedal: boolean
}

// ── Presets ──────────────────────────────────────────────────────────────────

export const PRESETS: { id: string; name: string; description: string; icon: string; config: ExerciseConfig }[] = [
  {
    id: 'absolute-beginner',
    name: 'First Steps',
    description: 'Whole and half notes on snare only. Learn to read the most basic notation.',
    icon: '🐣',
    config: {
      noteValues: { whole: true, half: true, quarter: false, eighth: false, sixteenth: false, triplet: false },
      includeRests: false, includeSyncopation: false, includeDynamics: false,
      instruments: { kick: false, snare: true, hihatClosed: false, hihatOpen: false, ride: false, crash: false, tom1: false, tom2: false, floorTom: false, hihatPedal: false },
      timeSignature: [4, 4], bars: 2, bpm: 70, difficulty: 1,
    },
  },
  {
    id: 'quarter-kick-snare',
    name: 'Kick & Snare Quarters',
    description: 'Quarter notes alternating between kick and snare. Two voices, simple reading.',
    icon: '🥁',
    config: {
      noteValues: { whole: false, half: false, quarter: true, eighth: false, sixteenth: false, triplet: false },
      includeRests: false, includeSyncopation: false, includeDynamics: false,
      instruments: { kick: true, snare: true, hihatClosed: false, hihatOpen: false, ride: false, crash: false, tom1: false, tom2: false, floorTom: false, hihatPedal: false },
      timeSignature: [4, 4], bars: 2, bpm: 80, difficulty: 2,
    },
  },
  {
    id: 'eighth-hihat',
    name: 'Hi-Hat Eighths',
    description: 'Steady eighth notes on closed hi-hat. The timekeeper pattern you\'ll use in every beat.',
    icon: '🔔',
    config: {
      noteValues: { whole: false, half: false, quarter: false, eighth: true, sixteenth: false, triplet: false },
      includeRests: false, includeSyncopation: false, includeDynamics: false,
      instruments: { kick: false, snare: false, hihatClosed: true, hihatOpen: false, ride: false, crash: false, tom1: false, tom2: false, floorTom: false, hihatPedal: false },
      timeSignature: [4, 4], bars: 2, bpm: 85, difficulty: 2,
    },
  },
  {
    id: 'basic-rock',
    name: 'Basic Rock Reading',
    description: 'HH eighths + snare on 2,4 + kick on 1,3. Read three voices simultaneously.',
    icon: '🎸',
    config: {
      noteValues: { whole: false, half: false, quarter: true, eighth: true, sixteenth: false, triplet: false },
      includeRests: false, includeSyncopation: false, includeDynamics: false,
      instruments: { kick: true, snare: true, hihatClosed: true, hihatOpen: false, ride: false, crash: false, tom1: false, tom2: false, floorTom: false, hihatPedal: false },
      timeSignature: [4, 4], bars: 4, bpm: 90, difficulty: 4,
    },
  },
  {
    id: 'quarter-rests',
    name: 'Reading Rests',
    description: 'Patterns with quarter rests. Count through the silence without losing your place.',
    icon: '🤫',
    config: {
      noteValues: { whole: false, half: false, quarter: true, eighth: false, sixteenth: false, triplet: false },
      includeRests: true, includeSyncopation: false, includeDynamics: false,
      instruments: { kick: true, snare: true, hihatClosed: false, hihatOpen: false, ride: false, crash: false, tom1: false, tom2: false, floorTom: false, hihatPedal: false },
      timeSignature: [4, 4], bars: 2, bpm: 80, difficulty: 3,
    },
  },
  {
    id: 'eighth-rests',
    name: 'Eighth Note Rests',
    description: 'Eighth note patterns with rests on the "ands." Builds offbeat awareness.',
    icon: '⏸',
    config: {
      noteValues: { whole: false, half: false, quarter: true, eighth: true, sixteenth: false, triplet: false },
      includeRests: true, includeSyncopation: true, includeDynamics: false,
      instruments: { kick: true, snare: true, hihatClosed: true, hihatOpen: false, ride: false, crash: false, tom1: false, tom2: false, floorTom: false, hihatPedal: false },
      timeSignature: [4, 4], bars: 4, bpm: 85, difficulty: 5,
    },
  },
  {
    id: 'dynamics-intro',
    name: 'Accents & Ghosts',
    description: 'Same rhythm but with accented and ghost notes. Learn to read dynamics on the staff.',
    icon: '💪',
    config: {
      noteValues: { whole: false, half: false, quarter: true, eighth: true, sixteenth: false, triplet: false },
      includeRests: false, includeSyncopation: false, includeDynamics: true,
      instruments: { kick: true, snare: true, hihatClosed: true, hihatOpen: false, ride: false, crash: false, tom1: false, tom2: false, floorTom: false, hihatPedal: false },
      timeSignature: [4, 4], bars: 4, bpm: 85, difficulty: 5,
    },
  },
  {
    id: 'sixteenth-intro',
    name: 'Sixteenth Notes',
    description: 'Read double-beamed sixteenth note groups. Start slow!',
    icon: '⚡',
    config: {
      noteValues: { whole: false, half: false, quarter: true, eighth: true, sixteenth: true, triplet: false },
      includeRests: false, includeSyncopation: false, includeDynamics: false,
      instruments: { kick: true, snare: true, hihatClosed: true, hihatOpen: false, ride: false, crash: false, tom1: false, tom2: false, floorTom: false, hihatPedal: false },
      timeSignature: [4, 4], bars: 2, bpm: 70, difficulty: 6,
    },
  },
  {
    id: 'full-kit',
    name: 'Full Kit Reading',
    description: 'All drums and cymbals including toms, ride, crash. Read complex multi-voice notation.',
    icon: '🎯',
    config: {
      noteValues: { whole: false, half: false, quarter: true, eighth: true, sixteenth: false, triplet: false },
      includeRests: true, includeSyncopation: true, includeDynamics: true,
      instruments: { kick: true, snare: true, hihatClosed: true, hihatOpen: true, ride: false, crash: true, tom1: true, tom2: true, floorTom: true, hihatPedal: false },
      timeSignature: [4, 4], bars: 4, bpm: 90, difficulty: 7,
    },
  },
  {
    id: 'advanced-mixed',
    name: 'Advanced Mixed',
    description: 'Everything: sixteenths, syncopation, dynamics, full kit. The real-world reading test.',
    icon: '🏆',
    config: {
      noteValues: { whole: false, half: false, quarter: true, eighth: true, sixteenth: true, triplet: false },
      includeRests: true, includeSyncopation: true, includeDynamics: true,
      instruments: { kick: true, snare: true, hihatClosed: true, hihatOpen: true, ride: true, crash: true, tom1: true, tom2: true, floorTom: true, hihatPedal: true },
      timeSignature: [4, 4], bars: 4, bpm: 100, difficulty: 9,
    },
  },
]

// ── Generator ───────────────────────────────────────────────────────────────

export function generateExercise(config: ExerciseConfig, seed?: number): PatternData {
  const rng = createRng(seed ?? Math.floor(Math.random() * 999999))
  const { noteValues, instruments, timeSignature, difficulty, includeRests, includeSyncopation, includeDynamics } = config

  // Determine grid resolution
  const subdivisions = noteValues.sixteenth ? 4 : noteValues.eighth ? 2 : 1
  const beats = timeSignature[0]
  const totalSlots = beats * subdivisions

  const tracks: Partial<Record<DrumPad, HitValue[]>> = {}

  // Get enabled pads
  const pads: DrumPad[] = []
  if (instruments.kick) pads.push(DrumPad.Kick)
  if (instruments.snare) pads.push(DrumPad.Snare)
  if (instruments.hihatClosed) pads.push(DrumPad.HiHatClosed)
  if (instruments.hihatOpen) pads.push(DrumPad.HiHatOpen)
  if (instruments.ride) pads.push(DrumPad.RideCymbal)
  if (instruments.crash) pads.push(DrumPad.CrashCymbal)
  if (instruments.tom1) pads.push(DrumPad.Tom1)
  if (instruments.tom2) pads.push(DrumPad.Tom2)
  if (instruments.floorTom) pads.push(DrumPad.FloorTom)
  if (instruments.hihatPedal) pads.push(DrumPad.HiHatPedal)

  if (pads.length === 0) pads.push(DrumPad.Snare) // fallback

  // Density: how many slots should have notes (influenced by difficulty)
  const baseDensity = 0.2 + (difficulty / 10) * 0.5 // 0.2 to 0.7

  // ── Build patterns per instrument role ──

  // Cymbal timekeeper (hi-hat / ride)
  const timekeepers = pads.filter(p => [DrumPad.HiHatClosed, DrumPad.RideCymbal].includes(p))
  if (timekeepers.length > 0) {
    const tk = timekeepers[0]
    const arr: HitValue[] = new Array<HitValue>(totalSlots).fill(0)

    if (noteValues.eighth || noteValues.sixteenth) {
      // Eighth note pattern on timekeeper
      const step = noteValues.sixteenth ? 1 : subdivisions >= 2 ? 1 : 2
      for (let i = 0; i < totalSlots; i += step) {
        if (subdivisions >= 2 && i % 2 === 0) arr[i] = 1
        else if (subdivisions >= 4) arr[i] = 1
        else if (i % subdivisions === 0) arr[i] = 1
      }
      // Add some open hi-hat if enabled
      if (instruments.hihatOpen && rng() > 0.5) {
        const openSlot = (beats - 1) * subdivisions + subdivisions - 1 // "and" of last beat
        arr[openSlot] = 0 // remove closed
        const openArr: HitValue[] = new Array(totalSlots).fill(0)
        openArr[openSlot] = 1
        tracks[DrumPad.HiHatOpen] = openArr
      }
    } else {
      // Quarter notes
      for (let i = 0; i < totalSlots; i += subdivisions) arr[i] = 1
    }
    tracks[tk] = arr
  }

  // Kick pattern
  if (pads.includes(DrumPad.Kick)) {
    tracks[DrumPad.Kick] = generateRhythmicTrack(totalSlots, subdivisions, rng, {
      density: baseDensity * 0.6,
      preferDownbeats: true,
      includeRests,
      includeSyncopation,
      includeDynamics: false, // kick is rarely accented/ghosted
    })
  }

  // Snare pattern
  if (pads.includes(DrumPad.Snare)) {
    const snareArr: HitValue[] = new Array(totalSlots).fill(0)
    // Standard backbeat (2, 4) if difficulty >= 3
    if (difficulty >= 3 && beats >= 4) {
      snareArr[1 * subdivisions] = includeDynamics && rng() > 0.5 ? 2 : 1 // beat 2
      snareArr[3 * subdivisions] = includeDynamics && rng() > 0.5 ? 2 : 1 // beat 4
      // Ghost notes between backbeats
      if (includeDynamics && difficulty >= 5) {
        for (let i = 0; i < totalSlots; i++) {
          if (snareArr[i] === 0 && rng() < 0.2) snareArr[i] = 3
        }
      }
    } else {
      // Simple: snare on some beats
      Object.assign(snareArr, generateRhythmicTrack(totalSlots, subdivisions, rng, {
        density: baseDensity * 0.5,
        preferDownbeats: true,
        includeRests,
        includeSyncopation,
        includeDynamics,
      }))
    }
    tracks[DrumPad.Snare] = snareArr
  }

  // Toms (used in fills, less frequent)
  for (const tom of [DrumPad.Tom1, DrumPad.Tom2, DrumPad.FloorTom]) {
    if (pads.includes(tom)) {
      tracks[tom] = generateRhythmicTrack(totalSlots, subdivisions, rng, {
        density: baseDensity * 0.15,
        preferDownbeats: false,
        includeRests: true,
        includeSyncopation: true,
        includeDynamics,
      })
    }
  }

  // Crash (typically beat 1 only)
  if (pads.includes(DrumPad.CrashCymbal)) {
    const arr: HitValue[] = new Array<HitValue>(totalSlots).fill(0)
    if (rng() > 0.3) arr[0] = 2 // accent on beat 1
    tracks[DrumPad.CrashCymbal] = arr
  }

  // HH Pedal (beats 2 and 4 in jazz)
  if (pads.includes(DrumPad.HiHatPedal)) {
    const arr: HitValue[] = new Array<HitValue>(totalSlots).fill(0)
    if (beats >= 4) {
      arr[1 * subdivisions] = 1
      arr[3 * subdivisions] = 1
    }
    tracks[DrumPad.HiHatPedal] = arr
  }

  return createPattern(beats, subdivisions, tracks)
}

// ── Rhythmic track generator ────────────────────────────────────────────────

function generateRhythmicTrack(
  totalSlots: number,
  subdivisions: number,
  rng: () => number,
  opts: {
    density: number
    preferDownbeats: boolean
    includeRests: boolean
    includeSyncopation: boolean
    includeDynamics: boolean
  }
): HitValue[] {
  const arr: HitValue[] = []
  for (let j = 0; j < totalSlots; j++) arr.push(0)

  for (let i = 0; i < totalSlots; i++) {
    const isDownbeat = i % subdivisions === 0
    const isUpbeat = subdivisions >= 2 && i % subdivisions === Math.floor(subdivisions / 2)

    let chance = opts.density
    if (opts.preferDownbeats && isDownbeat) chance *= 2.0
    if (!opts.includeSyncopation && !isDownbeat) chance *= 0.2
    if (opts.includeSyncopation && isUpbeat) chance *= 1.5

    if (rng() < chance) {
      if (opts.includeDynamics && rng() > 0.7) {
        arr[i] = (rng() > 0.5 ? 2 : 3) as HitValue
      } else {
        arr[i] = 1 as HitValue
      }
    }
  }

  // Ensure at least one hit
  const hasAny = arr.some(v => v > 0)
  if (!hasAny) {
    arr[0] = 1
  }

  return arr
}

// ── Simple seeded RNG ────────────────────────────────────────────────────────

function createRng(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

// ── AI prompt builder ────────────────────────────────────────────────────────

export function buildAiExercisePrompt(config: ExerciseConfig): string {
  const instruments = Object.entries(config.instruments)
    .filter(([, v]) => v)
    .map(([k]) => k)

  const noteVals = Object.entries(config.noteValues)
    .filter(([, v]) => v)
    .map(([k]) => k)

  return `Generate a drum notation exercise with these parameters:
- Time signature: ${config.timeSignature.join('/')}
- BPM: ${config.bpm}
- Bars: ${config.bars}
- Difficulty: ${config.difficulty}/10
- Note values: ${noteVals.join(', ')}
- Instruments: ${instruments.join(', ')}
- Include rests: ${config.includeRests ? 'yes' : 'no'}
- Include syncopation: ${config.includeSyncopation ? 'yes' : 'no'}
- Include dynamics (accents/ghosts): ${config.includeDynamics ? 'yes' : 'no'}
${config.aiPrompt ? `\nSpecial instruction: ${config.aiPrompt}` : ''}

Return ONLY a JSON object with this exact format (no other text):
{
  "title": "short descriptive title",
  "description": "1-sentence description of the musical feel",
  "tracks": {
    "kick": [0,0,1,0, ...],
    "snare": [0,0,0,0, ...],
    "hihat_closed": [1,0,1,0, ...]
  }
}

Each array must have exactly ${config.timeSignature[0] * (config.noteValues.sixteenth ? 4 : config.noteValues.eighth ? 2 : 1)} elements.
Values: 0=rest, 1=normal hit, 2=accent, 3=ghost note.
Make it musically valid and interesting for the given difficulty level.`
}
