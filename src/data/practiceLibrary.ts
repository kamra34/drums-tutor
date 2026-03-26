import { DrumPad } from '../types/midi'
import { HitValue, PatternData } from '../types/curriculum'
import { createPattern } from './patterns'

// ═══════════════════════════════════════════════════════════════════════════
//  PRACTICE LIBRARY — Genre beats, reading exercises, fills, rudiments
// ═══════════════════════════════════════════════════════════════════════════

// Re-export placeHits for use here (it's not exported from patterns.ts)
function hits(length: number, indices: number[], value: HitValue = 1): HitValue[] {
  const arr: HitValue[] = Array(length).fill(0)
  for (const i of indices) if (i < length) arr[i] = value
  return arr
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PracticeItem {
  id: string
  title: string
  description: string
  category: PracticeCategory
  difficulty: number     // 1-10
  bpm: number
  timeSignature: [number, number]
  bars: number
  patternData: PatternData
  tags: string[]
}

export type PracticeCategory =
  | 'reading'
  | 'rock'
  | 'pop'
  | 'funk'
  | 'jazz'
  | 'latin'
  | 'metal'
  | 'fills'
  | 'rudiments'

export interface RudimentDef {
  id: string
  name: string
  sticking: string
  category: 'rolls' | 'diddles' | 'flams' | 'drags'
  description: string
  patternData: PatternData
  startBpm: number
  difficulty: number
}

// ─── Notation Reading Exercises (progressive difficulty) ────────────────────

export const READING_EXERCISES: PracticeItem[] = [
  // Level 1: Whole and half notes
  {
    id: 'read-01',
    title: 'Whole Notes on Snare',
    description: 'One hit per bar. Focus on reading the whole note symbol and waiting the full 4 beats.',
    category: 'reading',
    difficulty: 1,
    bpm: 80,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: hits(16, [0]),
    }),
    tags: ['whole-notes', 'beginner'],
  },
  {
    id: 'read-02',
    title: 'Half Notes on Snare',
    description: 'Two hits per bar — on beats 1 and 3. Read the half note symbols.',
    category: 'reading',
    difficulty: 1,
    bpm: 80,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: hits(16, [0, 8]),
    }),
    tags: ['half-notes', 'beginner'],
  },
  // Level 2: Quarter notes
  {
    id: 'read-03',
    title: 'Quarter Notes — Snare',
    description: 'Four hits per bar, one on each beat. The foundational rhythm.',
    category: 'reading',
    difficulty: 2,
    bpm: 90,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: hits(16, [0, 4, 8, 12]),
    }),
    tags: ['quarter-notes', 'beginner'],
  },
  {
    id: 'read-04',
    title: 'Quarter Notes — Kick + Snare',
    description: 'Kick on 1,3 and snare on 2,4. Read two voices simultaneously.',
    category: 'reading',
    difficulty: 2,
    bpm: 85,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Kick]: hits(16, [0, 8]),
      [DrumPad.Snare]: hits(16, [4, 12]),
    }),
    tags: ['quarter-notes', 'two-voice', 'beginner'],
  },
  // Level 3: Quarter notes with rests
  {
    id: 'read-05',
    title: 'Quarter Notes with Rests',
    description: 'Snare on beats 1, 2, 4 — beat 3 is a quarter rest. Count through the silence!',
    category: 'reading',
    difficulty: 3,
    bpm: 85,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: hits(16, [0, 4, 12]),
    }),
    tags: ['quarter-notes', 'rests', 'beginner'],
  },
  // Level 4: Eighth notes
  {
    id: 'read-06',
    title: 'Eighth Notes — Hi-Hat',
    description: 'Steady eighth notes on the hi-hat. Read the beamed groups.',
    category: 'reading',
    difficulty: 3,
    bpm: 90,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.HiHatClosed]: hits(16, [0, 2, 4, 6, 8, 10, 12, 14]),
    }),
    tags: ['eighth-notes', 'hi-hat', 'beginner'],
  },
  {
    id: 'read-07',
    title: 'Eighth Notes with Rests',
    description: 'Eighth notes on beats, rests on the "ands." Read the eighth rests.',
    category: 'reading',
    difficulty: 4,
    bpm: 85,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: hits(16, [0, 4, 8, 12]),  // only downbeats
    }),
    tags: ['eighth-notes', 'rests', 'intermediate'],
  },
  // Level 5: Eighth notes — two voices
  {
    id: 'read-08',
    title: 'Reading a Basic Beat',
    description: 'HH eighths + snare 2,4 + kick 1,3. Read three voices on the staff simultaneously.',
    category: 'reading',
    difficulty: 5,
    bpm: 90,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.HiHatClosed]: hits(16, [0, 2, 4, 6, 8, 10, 12, 14]),
      [DrumPad.Snare]: hits(16, [4, 12]),
      [DrumPad.Kick]: hits(16, [0, 8]),
    }),
    tags: ['eighth-notes', 'three-voice', 'intermediate'],
  },
  // Level 6: Sixteenth notes
  {
    id: 'read-09',
    title: '16th Notes — Snare',
    description: 'Full sixteenth notes on snare. Read the double-beamed groups.',
    category: 'reading',
    difficulty: 6,
    bpm: 70,
    timeSignature: [4, 4],
    bars: 2,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: hits(16, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]),
    }),
    tags: ['sixteenth-notes', 'intermediate'],
  },
  {
    id: 'read-10',
    title: 'Sixteenth Note Patterns',
    description: 'Mixed sixteenth patterns — "1 e + a" on beat 1, quarter on 2, eighths on 3-4.',
    category: 'reading',
    difficulty: 7,
    bpm: 75,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: hits(16, [0, 1, 2, 3, 4, 8, 10, 12, 14]),
    }),
    tags: ['sixteenth-notes', 'mixed', 'intermediate'],
  },
  // Level 7: Accents and ghost notes
  {
    id: 'read-11',
    title: 'Accents on Snare',
    description: 'Eighth notes with accents on beats 2 and 4. Read the ">" marks.',
    category: 'reading',
    difficulty: 6,
    bpm: 85,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: [1,1,2,1,1,1,2,1, 1,1,2,1,1,1,2,1] as HitValue[],
    }),
    tags: ['accents', 'dynamics', 'intermediate'],
  },
  {
    id: 'read-12',
    title: 'Ghost Notes + Accents',
    description: 'Accented backbeats with ghost notes between. The foundation of funk drumming.',
    category: 'reading',
    difficulty: 7,
    bpm: 80,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: [3,0,3,0,2,0,3,0, 3,0,3,0,2,0,3,0] as HitValue[],
      [DrumPad.Kick]: hits(16, [0, 6, 8]),
      [DrumPad.HiHatClosed]: hits(16, [0, 2, 4, 6, 8, 10, 12, 14]),
    }),
    tags: ['ghost-notes', 'accents', 'funk', 'intermediate'],
  },
]

// ─── Genre Beats Library ────────────────────────────────────────────────────

export const GENRE_BEATS: PracticeItem[] = [
  // ── Rock ──
  {
    id: 'rock-01',
    title: 'Basic Rock Beat',
    description: 'The classic rock groove — hi-hat eighths, snare 2+4, kick 1+3. The #1 beat in music.',
    category: 'rock',
    difficulty: 3,
    bpm: 100,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.HiHatClosed]: hits(16, [0,2,4,6,8,10,12,14]),
      [DrumPad.Snare]: hits(16, [4, 12]),
      [DrumPad.Kick]: hits(16, [0, 8]),
    }),
    tags: ['rock', 'essential'],
  },
  {
    id: 'rock-02',
    title: 'Rock Beat — Kick Variation',
    description: 'Rock beat with kick on 1, "and" of 2, and 3. Adds forward momentum.',
    category: 'rock',
    difficulty: 4,
    bpm: 100,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.HiHatClosed]: hits(16, [0,2,4,6,8,10,12,14]),
      [DrumPad.Snare]: hits(16, [4, 12]),
      [DrumPad.Kick]: hits(16, [0, 6, 8]),
    }),
    tags: ['rock', 'kick-variation'],
  },
  {
    id: 'rock-03',
    title: 'Driving Rock',
    description: 'Quarter notes on the ride, snare 2+4, busy kick pattern. Think AC/DC.',
    category: 'rock',
    difficulty: 5,
    bpm: 110,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.RideCymbal]: hits(16, [0,4,8,12]),
      [DrumPad.Snare]: hits(16, [4, 12]),
      [DrumPad.Kick]: hits(16, [0, 2, 8, 10]),
    }),
    tags: ['rock', 'ride', 'driving'],
  },
  // ── Pop ──
  {
    id: 'pop-01',
    title: 'Four-on-the-Floor',
    description: 'Kick on every beat, hi-hat eighths, snare 2+4. The disco/pop staple.',
    category: 'pop',
    difficulty: 3,
    bpm: 110,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.HiHatClosed]: hits(16, [0,2,4,6,8,10,12,14]),
      [DrumPad.Snare]: hits(16, [4, 12]),
      [DrumPad.Kick]: hits(16, [0, 4, 8, 12]),
    }),
    tags: ['pop', 'four-on-floor', 'essential'],
  },
  {
    id: 'pop-02',
    title: 'Syncopated Pop',
    description: 'Pop beat with syncopated kick — "and" of 4 pushes into the next bar.',
    category: 'pop',
    difficulty: 5,
    bpm: 100,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.HiHatClosed]: hits(16, [0,2,4,6,8,10,12,14]),
      [DrumPad.Snare]: hits(16, [4, 12]),
      [DrumPad.Kick]: hits(16, [0, 8, 14]),
    }),
    tags: ['pop', 'syncopation'],
  },
  // ── Funk ──
  {
    id: 'funk-01',
    title: 'Basic Funk',
    description: 'Syncopated kick with hi-hat sixteenths. The groove starts here.',
    category: 'funk',
    difficulty: 5,
    bpm: 90,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.HiHatClosed]: hits(16, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]),
      [DrumPad.Snare]: hits(16, [4, 12]),
      [DrumPad.Kick]: hits(16, [0, 3, 6, 8, 11]),
    }),
    tags: ['funk', 'sixteenths'],
  },
  {
    id: 'funk-02',
    title: 'Ghost Note Funk',
    description: 'Ghost notes between backbeats — the James Brown feel. Snare dynamics are everything.',
    category: 'funk',
    difficulty: 7,
    bpm: 85,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.HiHatClosed]: hits(16, [0,2,4,6,8,10,12,14]),
      [DrumPad.Snare]: [3,0,3,0,2,0,3,0, 3,0,3,0,2,0,3,0] as HitValue[],
      [DrumPad.Kick]: hits(16, [0, 6, 8, 14]),
    }),
    tags: ['funk', 'ghost-notes', 'dynamics'],
  },
  // ── Jazz ──
  {
    id: 'jazz-01',
    title: 'Swing Ride Pattern',
    description: 'Quarter notes on the ride with the jazz "spang-a-lang" feel. Kick feathers on all 4.',
    category: 'jazz',
    difficulty: 5,
    bpm: 130,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.RideCymbal]: hits(16, [0, 4, 8, 12]),
      [DrumPad.Kick]: [3,0,0,0,3,0,0,0, 3,0,0,0,3,0,0,0] as HitValue[],
    }),
    tags: ['jazz', 'ride', 'swing'],
  },
  {
    id: 'jazz-02',
    title: 'Jazz Beat with Hi-Hat Foot',
    description: 'Ride pattern + hi-hat foot on 2 and 4 + snare comping. Classic jazz timekeeping.',
    category: 'jazz',
    difficulty: 6,
    bpm: 120,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.RideCymbal]: hits(16, [0, 4, 8, 12]),
      [DrumPad.HiHatPedal]: hits(16, [4, 12]),
      [DrumPad.Snare]: hits(16, [6, 14]),
    }),
    tags: ['jazz', 'hi-hat-foot', 'comping'],
  },
  // ── Latin ──
  {
    id: 'latin-01',
    title: 'Bossa Nova',
    description: 'The classic bossa nova pattern — cross-stick on snare, bass drum pattern, hi-hat foot.',
    category: 'latin',
    difficulty: 6,
    bpm: 120,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.HiHatClosed]: hits(16, [0,2,4,6,8,10,12,14]),
      [DrumPad.Snare]: hits(16, [6, 12]),
      [DrumPad.Kick]: hits(16, [0, 3, 8, 11]),
    }),
    tags: ['latin', 'bossa-nova'],
  },
  // ── Metal ──
  {
    id: 'metal-01',
    title: 'Metal — Straight Eighths',
    description: 'Aggressive eighth notes on the ride, fast kick pattern. Thrash territory.',
    category: 'metal',
    difficulty: 6,
    bpm: 140,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.RideCymbal]: hits(16, [0,2,4,6,8,10,12,14]),
      [DrumPad.Snare]: hits(16, [4, 12]),
      [DrumPad.Kick]: hits(16, [0, 2, 8, 10]),
    }),
    tags: ['metal', 'fast'],
  },
  {
    id: 'metal-02',
    title: 'Double Kick Intro',
    description: 'Steady sixteenth notes on kick with half-time snare and crash. Building double bass chops.',
    category: 'metal',
    difficulty: 8,
    bpm: 100,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.CrashCymbal]: hits(16, [0]),
      [DrumPad.HiHatClosed]: hits(16, [4, 8, 12]),
      [DrumPad.Snare]: hits(16, [8]),
      [DrumPad.Kick]: hits(16, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]),
    }),
    tags: ['metal', 'double-kick'],
  },
]

// ─── Fill Challenges ─────────────────────────────────────────────────────────

export const FILL_CHALLENGES: PracticeItem[] = [
  {
    id: 'fill-01',
    title: 'One-Beat Snare Fill',
    description: 'Groove for 3.75 bars, fill on beat 4 of bar 4: four sixteenths on snare.',
    category: 'fills',
    difficulty: 3,
    bpm: 90,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.HiHatClosed]: hits(16, [0,2,4,6,8,10,12,14]),
      [DrumPad.Snare]: hits(16, [4, 12, 13, 14, 15]),  // backbeats + fill on beat 4
      [DrumPad.Kick]: hits(16, [0, 8]),
    }),
    tags: ['fill', 'one-beat', 'beginner'],
  },
  {
    id: 'fill-02',
    title: 'Two-Beat Tom Fill',
    description: 'Groove for 3.5 bars, fill on beats 3-4: descending toms.',
    category: 'fills',
    difficulty: 4,
    bpm: 90,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.HiHatClosed]: hits(16, [0,2,4,6]),
      [DrumPad.Snare]: hits(16, [4]),
      [DrumPad.Kick]: hits(16, [0]),
      [DrumPad.Tom1]: hits(16, [8, 9]),
      [DrumPad.Tom2]: hits(16, [10, 11]),
      [DrumPad.FloorTom]: hits(16, [12, 13, 14, 15]),
    }),
    tags: ['fill', 'two-beat', 'toms'],
  },
  {
    id: 'fill-03',
    title: 'Full-Bar Fill — Singles',
    description: 'One full bar fill: single strokes descending across all toms and snare.',
    category: 'fills',
    difficulty: 5,
    bpm: 85,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: hits(16, [0, 1, 2, 3]),
      [DrumPad.Tom1]: hits(16, [4, 5, 6, 7]),
      [DrumPad.Tom2]: hits(16, [8, 9]),
      [DrumPad.FloorTom]: hits(16, [10, 11, 12, 13, 14, 15]),
    }),
    tags: ['fill', 'full-bar', 'toms', 'intermediate'],
  },
  {
    id: 'fill-04',
    title: 'Accented Fill',
    description: 'Full bar: accented notes on beats, ghost notes between. Dynamic fill.',
    category: 'fills',
    difficulty: 6,
    bpm: 80,
    timeSignature: [4, 4],
    bars: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: [2,3,3,3,2,3,3,3, 0,0,0,0,0,0,0,0] as HitValue[],
      [DrumPad.Tom1]: [0,0,0,0,0,0,0,0, 2,3,3,3,0,0,0,0] as HitValue[],
      [DrumPad.FloorTom]: [0,0,0,0,0,0,0,0, 0,0,0,0,2,3,2,1] as HitValue[],
    }),
    tags: ['fill', 'accents', 'dynamics', 'intermediate'],
  },
]

// ─── Rudiments (PAS 40) — first 13 most essential ──────────────────────────

export const RUDIMENTS_LIBRARY: RudimentDef[] = [
  {
    id: 'rud-01', name: 'Single Stroke Roll', sticking: 'R L R L R L R L',
    category: 'rolls', description: 'The most fundamental rudiment. Alternate hands evenly.',
    startBpm: 70, difficulty: 1,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: hits(16, [0,2,4,6,8,10,12,14]),
    }),
  },
  {
    id: 'rud-02', name: 'Single Stroke Four', sticking: 'R L R L (repeat)',
    category: 'rolls', description: 'Four alternating strokes, grouped in fours.',
    startBpm: 70, difficulty: 2,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: hits(16, [0,1,2,3,  8,9,10,11]),
    }),
  },
  {
    id: 'rud-03', name: 'Double Stroke Roll', sticking: 'R R L L R R L L',
    category: 'rolls', description: 'Two hits per hand. Control the bounce.',
    startBpm: 60, difficulty: 3,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: hits(16, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]),
    }),
  },
  {
    id: 'rud-04', name: 'Buzz Roll', sticking: 'Rz Lz Rz Lz',
    category: 'rolls', description: 'Press into the head and let the stick buzz. Sustained sound.',
    startBpm: 60, difficulty: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: hits(16, [0,2,4,6,8,10,12,14]),
    }),
  },
  {
    id: 'rud-05', name: 'Single Paradiddle', sticking: 'R L R R  L R L L',
    category: 'diddles', description: 'The paradiddle — accent the first note. Used to switch leading hands.',
    startBpm: 65, difficulty: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: [2,1,1,1,  2,1,1,1,  2,1,1,1,  2,1,1,1] as HitValue[],
    }),
  },
  {
    id: 'rud-06', name: 'Double Paradiddle', sticking: 'R L R L R R  L R L R L L',
    category: 'diddles', description: 'Extended paradiddle — 6 notes per group with the diddle at the end.',
    startBpm: 60, difficulty: 5,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: [2,1,1,1,1,1,  2,1,1,1,1,1,  0,0,0,0] as HitValue[],
    }),
  },
  {
    id: 'rud-07', name: 'Flam', sticking: 'lR rL lR rL',
    category: 'flams', description: 'Grace note before the main stroke. Fatter sound.',
    startBpm: 70, difficulty: 3,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: [2,0,0,0,  2,0,0,0,  2,0,0,0,  2,0,0,0] as HitValue[],
    }),
  },
  {
    id: 'rud-08', name: 'Flam Accent', sticking: 'lR L R  rL R L',
    category: 'flams', description: 'Flam followed by two taps. A great triplet-based rudiment.',
    startBpm: 60, difficulty: 5,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: [2,1,1,  2,1,1,  2,1,1,  2,1,1,  0,0,0,0] as HitValue[],
    }),
  },
  {
    id: 'rud-09', name: 'Flam Tap', sticking: 'lR R  rL L',
    category: 'flams', description: 'Flam + tap. Each hand plays flam then double.',
    startBpm: 60, difficulty: 5,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: [2,1,  2,1,  2,1,  2,1,  2,1,  2,1,  2,1,  2,1] as HitValue[],
    }),
  },
  {
    id: 'rud-10', name: 'Drag (Single Drag Tap)', sticking: 'llR L  rrL R',
    category: 'drags', description: 'Two grace notes before the main stroke, then a tap.',
    startBpm: 60, difficulty: 4,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: [2,0,1,0,  2,0,1,0,  2,0,1,0,  2,0,1,0] as HitValue[],
    }),
  },
  {
    id: 'rud-11', name: 'Five Stroke Roll', sticking: 'R R L L R',
    category: 'rolls', description: 'Five strokes ending with an accent. Compact roll.',
    startBpm: 65, difficulty: 5,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: [1,1,1,1,2,0,0,0, 1,1,1,1,2,0,0,0] as HitValue[],
    }),
  },
  {
    id: 'rud-12', name: 'Seven Stroke Roll', sticking: 'R R L L R R L',
    category: 'rolls', description: 'Seven strokes — longer sustained roll.',
    startBpm: 60, difficulty: 6,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: [1,1,1,1,1,1,2,0, 1,1,1,1,1,1,2,0] as HitValue[],
    }),
  },
  {
    id: 'rud-13', name: 'Paradiddle-diddle', sticking: 'R L R R L L',
    category: 'diddles', description: 'Single stroke + double strokes. Common in 6/8 feels.',
    startBpm: 60, difficulty: 6,
    patternData: createPattern(4, 4, {
      [DrumPad.Snare]: [2,1,1,1,1,1,  2,1,1,1,1,1,  0,0,0,0] as HitValue[],
    }),
  },
]

// ─── Aggregate all practice items ───────────────────────────────────────────

export function getAllPracticeItems(): PracticeItem[] {
  return [
    ...READING_EXERCISES,
    ...GENRE_BEATS,
    ...FILL_CHALLENGES,
  ]
}

export function getPracticeItemById(id: string): PracticeItem | undefined {
  return getAllPracticeItems().find(p => p.id === id)
}

export function getRudimentById(id: string): RudimentDef | undefined {
  return RUDIMENTS_LIBRARY.find(r => r.id === id)
}
