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
    name: '16th Notes',
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
  const { noteValues, instruments, timeSignature, difficulty, includeRests, includeSyncopation, includeDynamics, bars } = config

  // Determine grid resolution
  const subdivisions = noteValues.sixteenth ? 4 : noteValues.eighth ? 2 : 1
  const beats = timeSignature[0]
  const slotsPerBar = beats * subdivisions
  const numBars = bars ?? 1
  const totalSlots = slotsPerBar * numBars

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
      const step = noteValues.sixteenth ? 1 : subdivisions >= 2 ? 1 : 2
      for (let i = 0; i < totalSlots; i += step) {
        if (subdivisions >= 2 && i % 2 === 0) arr[i] = 1
        else if (subdivisions >= 4) arr[i] = 1
        else if (i % subdivisions === 0) arr[i] = 1
      }
      // Add some open hi-hat if enabled (on last beat of random bars)
      if (instruments.hihatOpen) {
        const openArr: HitValue[] = new Array(totalSlots).fill(0)
        for (let bar = 0; bar < numBars; bar++) {
          if (rng() > 0.5) {
            const openSlot = bar * slotsPerBar + (beats - 1) * subdivisions + subdivisions - 1
            arr[openSlot] = 0
            openArr[openSlot] = 1
          }
        }
        if (openArr.some(v => v > 0)) tracks[DrumPad.HiHatOpen] = openArr
      }
    } else {
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
      includeDynamics: false,
    })
  }

  // Snare pattern
  if (pads.includes(DrumPad.Snare)) {
    const snareArr: HitValue[] = new Array(totalSlots).fill(0)
    if (difficulty >= 3 && beats >= 4) {
      // Backbeat on 2 and 4 in every bar
      for (let bar = 0; bar < numBars; bar++) {
        const offset = bar * slotsPerBar
        snareArr[offset + 1 * subdivisions] = includeDynamics && rng() > 0.5 ? 2 : 1
        snareArr[offset + 3 * subdivisions] = includeDynamics && rng() > 0.5 ? 2 : 1
      }
      // Ghost notes
      if (includeDynamics && difficulty >= 5) {
        for (let i = 0; i < totalSlots; i++) {
          if (snareArr[i] === 0 && rng() < 0.2) snareArr[i] = 3
        }
      }
    } else {
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

  // Crash (typically beat 1 of first bar, optionally other bars)
  if (pads.includes(DrumPad.CrashCymbal)) {
    const arr: HitValue[] = new Array<HitValue>(totalSlots).fill(0)
    if (rng() > 0.3) arr[0] = 2
    tracks[DrumPad.CrashCymbal] = arr
  }

  // HH Pedal (beats 2 and 4 in every bar)
  if (pads.includes(DrumPad.HiHatPedal)) {
    const arr: HitValue[] = new Array<HitValue>(totalSlots).fill(0)
    if (beats >= 4) {
      for (let bar = 0; bar < numBars; bar++) {
        const offset = bar * slotsPerBar
        arr[offset + 1 * subdivisions] = 1
        arr[offset + 3 * subdivisions] = 1
      }
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

  const subdivisions = config.noteValues.sixteenth ? 4 : config.noteValues.eighth ? 2 : 1
  const slotsPerBar = config.timeSignature[0] * subdivisions
  const totalSlots = slotsPerBar * config.bars

  // Build instrument guide based on what's enabled
  const instrumentGuide: string[] = []
  if (config.instruments.kick) instrumentGuide.push('  - "kick": Bass drum — the foundation. Typically on beats 1 and 3 in rock, varied in jazz/funk.')
  if (config.instruments.snare) instrumentGuide.push('  - "snare": Snare drum — backbeat (beats 2 and 4 in rock). Use ghost notes (3) for funk/jazz feel.')
  if (config.instruments.hihatClosed) instrumentGuide.push('  - "hihat_closed": Closed hi-hat — timekeeping. Eighth notes or 16ths depending on style.')
  if (config.instruments.hihatOpen) instrumentGuide.push('  - "hihat_open": Open hi-hat — accent/color. Use sparingly, typically on "and" of a beat.')
  if (config.instruments.ride) instrumentGuide.push('  - "ride": Ride cymbal — alternative timekeeping. Common in jazz, ballads, bridge sections.')
  if (config.instruments.crash) instrumentGuide.push('  - "crash": Crash cymbal — accent on downbeats, section changes. Usually paired with a kick hit. Don\'t overuse.')
  if (config.instruments.tom1) instrumentGuide.push('  - "tom1": High tom — fills, melodic patterns. Common in fill descending runs (tom1 → tom2 → floor_tom).')
  if (config.instruments.tom2) instrumentGuide.push('  - "tom2": Mid tom — fills and groove embellishments.')
  if (config.instruments.floorTom) instrumentGuide.push('  - "floor_tom": Floor tom — lowest tom. Powerful in fills, can substitute for kick in breakdowns.')
  if (config.instruments.hihatPedal) instrumentGuide.push('  - "hihat_pedal": Hi-hat foot — independence training. Plays on beats while hands do other things.')

  // Build difficulty guide
  let difficultyGuide: string
  if (config.difficulty <= 2) {
    difficultyGuide = `BEGINNER (${config.difficulty}/10): Use only quarter notes. Simple kick-snare patterns. Hi-hat on every beat. No syncopation, no ghost notes. Keep it dead simple — the student is learning to read notation for the first time.`
  } else if (config.difficulty <= 4) {
    difficultyGuide = `EASY (${config.difficulty}/10): Quarter and eighth notes. Basic rock/pop grooves. Hi-hat on eighths, kick on 1 and 3, snare on 2 and 4. Occasional variation but keep the groove steady and predictable. One beam level max.`
  } else if (config.difficulty <= 6) {
    difficultyGuide = `INTERMEDIATE (${config.difficulty}/10): Eighth and some sixteenth note patterns. Introduce offbeat kicks, syncopated snare hits, and open hi-hats. Ghost notes if dynamics enabled. Two beam levels. Patterns should groove but challenge reading.`
  } else if (config.difficulty <= 8) {
    difficultyGuide = `ADVANCED (${config.difficulty}/10): Dense sixteenth note patterns. Complex kick patterns with syncopation. Ghost notes on snare, open/closed hi-hat interplay. Tom fills within the groove. Linear patterns (no two limbs hitting simultaneously). Double beam groups throughout.`
  } else {
    difficultyGuide = `EXPERT (${config.difficulty}/10): Maximum complexity. Odd groupings, dense 16th-note syncopation, polyrhythmic feels, displaced backbeats, four-way independence patterns. Ghost note cascades, flams implied via accents. This should challenge an experienced drummer's reading ability.`
  }

  return `Generate a drum notation exercise.

## Parameters
- Time signature: ${config.timeSignature.join('/')}
- Tempo: ${config.bpm} BPM
- Length: ${config.bars} bar${config.bars > 1 ? 's' : ''}
- Grid resolution: ${subdivisions === 4 ? 'sixteenth notes (4 slots per beat)' : subdivisions === 2 ? 'eighth notes (2 slots per beat)' : 'quarter notes (1 slot per beat)'}
- Available note values: ${noteVals.join(', ')}
- Include rests: ${config.includeRests ? 'yes — leave intentional gaps for the student to count through' : 'no — keep a continuous pattern'}
- Include syncopation: ${config.includeSyncopation ? 'yes — place hits on offbeats and "e"/"a" of beats' : 'no — keep hits on strong beats and "and"s only'}
- Include dynamics: ${config.includeDynamics ? 'yes — use accents (2) and ghost notes (3) for dynamic contrast' : 'no — all hits are normal (1)'}

## Difficulty Level
${difficultyGuide}

## Available Instruments (ONLY use these keys)
${instrumentGuide.join('\n')}

## Notation Rules
- Each track array must have EXACTLY ${totalSlots} elements (${config.bars} bar${config.bars > 1 ? 's' : ''} × ${config.timeSignature[0]} beats × ${subdivisions} subdivisions = ${totalSlots} slots total)
- The array represents ALL ${config.bars} bars concatenated: slots 0-${slotsPerBar - 1} = bar 1, slots ${slotsPerBar}-${slotsPerBar * 2 - 1} = bar 2${config.bars > 2 ? ', and so on' : ''}
- CRITICAL: You MUST place notes throughout ALL ${config.bars} bars, not just the first bar. Every bar must have musical content — DO NOT leave later bars empty or silent.${config.bars > 1 ? ` Vary the pattern slightly across bars to make it interesting (e.g. small fill in bar ${config.bars}, variation in bar 2).` : ''}
- Values: 0 = rest/silence, 1 = normal hit, 2 = accent (louder), 3 = ghost note (softer)
- ${!config.includeDynamics ? 'Only use 0 and 1 (no accents or ghosts since dynamics are disabled).' : 'Use the full range 0-3 for musical expression.'}
- The pattern must be musically valid — something a real drummer would actually play
- Kick + snare should form a coherent groove together
- Cymbal patterns (hi-hat/ride) should be consistent timekeeping throughout ALL bars, not random
${config.instruments.crash ? '- Crash cymbal: use VERY sparingly — typically only on beat 1 of the first bar or at section transitions' : ''}
${config.instruments.tom1 || config.instruments.tom2 || config.instruments.floorTom ? '- Toms: use for fills or color, not constant patterns. A fill typically descends: tom1 → tom2 → floor_tom' : ''}
${config.aiPrompt ? `\n## Special Instruction from Student\n${config.aiPrompt}` : ''}

## Output Format
Return ONLY a JSON object, no explanation, no markdown fences.
Each array must have exactly ${totalSlots} values — fill ALL of them with musical content across all ${config.bars} bars:
{
  "title": "short descriptive title (3-6 words)",
  "description": "1-sentence description of the musical feel/style",
  "tracks": {
${instruments.map(i => {
    const key = i === 'hihatClosed' ? 'hihat_closed' : i === 'hihatOpen' ? 'hihat_open' : i === 'floorTom' ? 'floor_tom' : i === 'hihatPedal' ? 'hihat_pedal' : i
    // Show bar boundaries in the template to guide the AI
    const barSlots = Array.from({ length: config.bars }, (_, bar) =>
      Array(slotsPerBar).fill('...').join(',')
    ).join(', ')
    return `    "${key}": [${barSlots}]`
  }).join(',\n')}
  }
}`
}
