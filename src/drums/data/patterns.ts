import { DrumPad } from '@drums/types/midi';
import { HitValue, PatternData } from '@drums/types/curriculum';

// ─── Factory ────────────────────────────────────────────────────────────────

/**
 * Create a PatternData object, filling any track arrays to the correct length.
 */
export function createPattern(
  beats: number,
  subdivisions: number,
  tracks: Partial<Record<DrumPad, HitValue[]>>,
): PatternData {
  const length = beats * subdivisions;
  const normalised: Partial<Record<DrumPad, HitValue[]>> = {};

  for (const [pad, arr] of Object.entries(tracks) as [DrumPad, HitValue[]][]) {
    if (arr.length < length) {
      // Pad with rests to fill the remaining slots
      normalised[pad] = [...arr, ...Array<HitValue>(length - arr.length).fill(0)];
    } else {
      normalised[pad] = arr.slice(0, length);
    }
  }

  return { beats, subdivisions, tracks: normalised };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Shorthand: create an array of a given length filled with rests. */
function rests(len: number): HitValue[] {
  return Array<HitValue>(len).fill(0);
}

/** Place hits (value) at specific indices in an array of the given length. */
function placeHits(
  length: number,
  indices: number[],
  value: HitValue = 1,
): HitValue[] {
  const arr = rests(length);
  for (const i of indices) {
    if (i < length) arr[i] = value;
  }
  return arr;
}

// ─── Pre-built patterns ─────────────────────────────────────────────────────

/** Free Hit — kick+snare+HH on every beat so the student hears all pads */
export const PATTERN_FREE_HIT: PatternData = createPattern(4, 4, {
  [DrumPad.Kick]: placeHits(16, [0]),
  [DrumPad.Snare]: placeHits(16, [4]),
  [DrumPad.HiHatClosed]: placeHits(16, [8]),
  [DrumPad.Tom1]: placeHits(16, [12]),
});

/** Know Your Kit — each beat uses a different instrument */
export const PATTERN_KNOW_YOUR_KIT: PatternData = createPattern(4, 4, {
  [DrumPad.Kick]: placeHits(16, [0]),
  [DrumPad.Snare]: placeHits(16, [4]),
  [DrumPad.Tom1]: placeHits(16, [8]),
  [DrumPad.HiHatClosed]: placeHits(16, [12]),
});

/** Quarter notes on snare: beats 1, 2, 3, 4.  (4 beats x 4 subs = 16 slots) */
export const PATTERN_QUARTER_SNARE: PatternData = createPattern(4, 4, {
  [DrumPad.Snare]: placeHits(16, [0, 4, 8, 12]),
});

/** Eighth notes on snare: every eighth note. */
export const PATTERN_EIGHTH_SNARE: PatternData = createPattern(4, 4, {
  [DrumPad.Snare]: placeHits(16, [0, 2, 4, 6, 8, 10, 12, 14]),
});

/** Quarter notes on kick: beats 1, 2, 3, 4. */
export const PATTERN_QUARTER_KICK: PatternData = createPattern(4, 4, {
  [DrumPad.Kick]: placeHits(16, [0, 4, 8, 12]),
});

/** Alternating kick (1,3) and snare (2,4). */
export const PATTERN_KICK_SNARE_ALT: PatternData = createPattern(4, 4, {
  [DrumPad.Kick]: placeHits(16, [0, 8]),
  [DrumPad.Snare]: placeHits(16, [4, 12]),
});

/** Hi-hat closed on every eighth note. */
export const PATTERN_HIHAT_EIGHTHS: PatternData = createPattern(4, 4, {
  [DrumPad.HiHatClosed]: placeHits(16, [0, 2, 4, 6, 8, 10, 12, 14]),
});

/** Kick on 1,3 + hi-hat eighths. */
export const PATTERN_KICK_HIHAT: PatternData = createPattern(4, 4, {
  [DrumPad.HiHatClosed]: placeHits(16, [0, 2, 4, 6, 8, 10, 12, 14]),
  [DrumPad.Kick]: placeHits(16, [0, 8]),
});

/** Single stroke roll — snare on every eighth note. */
export const PATTERN_SINGLE_STROKE_ROLL: PatternData = createPattern(4, 4, {
  [DrumPad.Snare]: placeHits(16, [0, 2, 4, 6, 8, 10, 12, 14]),
});

/** Basic rock beat: hi-hat eighths + snare 2,4 + kick 1,3. */
export const PATTERN_BASIC_ROCK_BEAT: PatternData = createPattern(4, 4, {
  [DrumPad.HiHatClosed]: placeHits(16, [0, 2, 4, 6, 8, 10, 12, 14]),
  [DrumPad.Snare]: placeHits(16, [4, 12]),
  [DrumPad.Kick]: placeHits(16, [0, 8]),
});

// ─── Module 0 additional patterns ────────────────────────────────────────────

/** Whole notes on snare — one hit per bar */
export const PATTERN_WHOLE_SNARE: PatternData = createPattern(4, 4, {
  [DrumPad.Snare]: placeHits(16, [0]),
});

/** Half notes on snare — 2 hits per bar */
export const PATTERN_HALF_SNARE: PatternData = createPattern(4, 4, {
  [DrumPad.Snare]: placeHits(16, [0, 8]),
});

/** Quarter notes with rests — hit beats 1,2,4 (rest on 3) */
export const PATTERN_QUARTER_REST: PatternData = createPattern(4, 4, {
  [DrumPad.Snare]: placeHits(16, [0, 4, 12]),
});

/** Eighth notes with rests — alternating hit/rest */
export const PATTERN_EIGHTH_REST: PatternData = createPattern(4, 4, {
  [DrumPad.Snare]: placeHits(16, [0, 4, 8, 12]),
  [DrumPad.HiHatClosed]: placeHits(16, [2, 6, 10, 14]),
});

/** Accented snare pattern — accent on 2 and 4, normal on 1 and 3 */
export const PATTERN_ACCENT_SNARE: PatternData = createPattern(4, 4, {
  [DrumPad.Snare]: [1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0] as HitValue[],
});

/** Ghost note pattern — ghost notes between backbeats */
export const PATTERN_GHOST_SNARE: PatternData = createPattern(4, 4, {
  [DrumPad.Snare]: [3, 0, 3, 0, 2, 0, 3, 0, 3, 0, 3, 0, 2, 0, 3, 0] as HitValue[],
  [DrumPad.Kick]: placeHits(16, [0, 8]),
});

/** Full kit introduction — HH eighths + kick 1,3 + snare 2,4 + crash on 1 */
export const PATTERN_FULL_KIT_INTRO: PatternData = createPattern(4, 4, {
  [DrumPad.CrashCymbal]: placeHits(16, [0]),
  [DrumPad.HiHatClosed]: placeHits(16, [2, 4, 6, 8, 10, 12, 14]),
  [DrumPad.Snare]: placeHits(16, [4, 12]),
  [DrumPad.Kick]: placeHits(16, [0, 8]),
});

/** Tom fill — descending toms */
export const PATTERN_TOM_FILL: PatternData = createPattern(4, 4, {
  [DrumPad.Tom1]: placeHits(16, [0, 2, 4, 6]),
  [DrumPad.Tom2]: placeHits(16, [8, 10]),
  [DrumPad.FloorTom]: placeHits(16, [12, 14]),
});

/** Sixteenth note snare exercise */
export const PATTERN_SIXTEENTH_SNARE: PatternData = createPattern(4, 4, {
  [DrumPad.Snare]: placeHits(16, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]),
});

// ─── Expected hits for scoring ──────────────────────────────────────────────

export type VelocityLabel = 'normal' | 'accent' | 'ghost';

export interface ExpectedHit {
  /** Time in milliseconds from the start of the pattern. */
  time: number;
  pad: DrumPad;
  velocity: VelocityLabel;
}

/**
 * Given a pattern and a BPM, produce an ordered array of expected hits with
 * their absolute time positions (in ms). One bar only — the caller can offset
 * for multi-bar loops.
 */
export function getExpectedHits(
  pattern: PatternData,
  bpm: number,
): ExpectedHit[] {
  const { beats, subdivisions, tracks } = pattern;
  const totalSlots = beats * subdivisions;

  // Duration of one subdivision in ms
  const msPerBeat = 60_000 / bpm;
  const msPerSlot = msPerBeat / subdivisions;

  const hits: ExpectedHit[] = [];

  for (const [pad, values] of Object.entries(tracks) as [DrumPad, HitValue[]][]) {
    for (let i = 0; i < Math.min(values.length, totalSlots); i++) {
      const v = values[i];
      if (v === 0) continue;

      const velocity: VelocityLabel =
        v === 2 ? 'accent' : v === 3 ? 'ghost' : 'normal';

      hits.push({
        time: i * msPerSlot,
        pad,
        velocity,
      });
    }
  }

  // Sort chronologically, then by pad name for stable ordering
  hits.sort((a, b) => a.time - b.time || a.pad.localeCompare(b.pad));

  return hits;
}
