import { DrumPad } from '../types/midi';
import { HitValue, PatternData } from '../types/curriculum';

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

/** Empty pattern for free-play / exploration exercises. */
export const PATTERN_FREE_HIT: PatternData = createPattern(4, 4, {});

/** "Know Your Kit" — one hit per bar on different pads (not scored strictly). */
export const PATTERN_KNOW_YOUR_KIT: PatternData = createPattern(4, 4, {});

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
