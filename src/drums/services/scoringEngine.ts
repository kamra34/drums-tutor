import {
  PatternData,
  ExerciseResult,
  HitValue,
  PadTimingStats,
  VelocityStats,
} from '@drums/types/curriculum';
import { MidiEvent, DrumMap, DrumPad } from '@drums/types/midi';

interface ExpectedHit {
  pad: DrumPad;
  /** Absolute timestamp (ms) when this note should be played */
  expectedTime: number;
  /** The hit value from the pattern (1=normal, 2=accent, 3=ghost) */
  hitValue: HitValue;
  /** Whether this expected hit has been matched to an actual hit */
  matched: boolean;
  /** The actual hit that matched, if any */
  matchedEvent?: MidiEvent;
  /** Timing offset in ms (positive = late, negative = early) */
  timingOffset?: number;
}

interface RealtimeScore {
  accuracy: number;
  currentBeat: number;
  totalBeats: number;
  hitCount: number;
  missCount: number;
  totalExpected: number;
}

/** Timing window in ms: hits within this window are considered valid */
const TIMING_WINDOW_MS = 50;

class ScoringEngine {
  private pattern: PatternData;
  private bpm: number;
  private drumMap: DrumMap;
  private expectedHits: ExpectedHit[] = [];
  private unmatchedHits: MidiEvent[] = [];
  private allHits: MidiEvent[] = [];
  private startTime: number = 0;
  private exerciseId: string = '';
  private bars: number = 1;

  /** Duration of one subdivision step in ms */
  private subdivisionDurationMs: number;

  constructor(pattern: PatternData, bpm: number, drumMap: DrumMap) {
    this.pattern = pattern;
    this.bpm = bpm;
    this.drumMap = drumMap;

    // One beat duration in ms
    const beatDurationMs = 60000 / bpm;
    // Duration of one subdivision step
    this.subdivisionDurationMs = beatDurationMs / pattern.subdivisions;
  }

  /**
   * Set exercise metadata for the result.
   */
  setExerciseInfo(exerciseId: string, bars: number): void {
    this.exerciseId = exerciseId;
    this.bars = bars;
  }

  /**
   * Start the scoring session. Records the start timestamp and
   * builds the list of expected hits from the pattern.
   */
  start(): void {
    this.startTime = performance.now();
    this.expectedHits = [];
    this.unmatchedHits = [];
    this.allHits = [];
    this.buildExpectedHits();
  }

  /**
   * Build the array of expected hits from the pattern data,
   * repeated for the configured number of bars.
   */
  private buildExpectedHits(): void {
    const stepsPerBar = this.pattern.beats * this.pattern.subdivisions;
    const barDurationMs = stepsPerBar * this.subdivisionDurationMs;

    for (let bar = 0; bar < this.bars; bar++) {
      const barOffset = bar * barDurationMs;

      for (const [padKey, steps] of Object.entries(this.pattern.tracks)) {
        const pad = padKey as DrumPad;
        if (!steps) continue;

        for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
          const hitValue = steps[stepIndex];
          if (hitValue === 0) continue;

          const expectedTime =
            this.startTime + barOffset + stepIndex * this.subdivisionDurationMs;

          this.expectedHits.push({
            pad,
            expectedTime,
            hitValue,
            matched: false,
          });
        }
      }
    }

    // Sort by time for efficient matching
    this.expectedHits.sort((a, b) => a.expectedTime - b.expectedTime);
  }

  /**
   * Record a hit from the MIDI input. Attempts to match it
   * to the nearest expected note within the timing window.
   */
  recordHit(event: MidiEvent): void {
    this.allHits.push(event);

    // Resolve the MIDI note to a drum pad
    const pad = this.drumMap[event.note];
    if (!pad) {
      // Unknown pad, still record as unmatched
      this.unmatchedHits.push(event);
      return;
    }

    // Use performance.now() as the actual timestamp for matching
    const hitTime = performance.now();

    // Find the closest unmatched expected hit for this pad within the timing window
    let bestMatch: ExpectedHit | null = null;
    let bestDistance = Infinity;

    for (const expected of this.expectedHits) {
      if (expected.matched) continue;
      if (expected.pad !== pad) continue;

      const distance = Math.abs(hitTime - expected.expectedTime);

      // Skip if well beyond the timing window (with some extra margin for late hits)
      if (hitTime < expected.expectedTime - TIMING_WINDOW_MS * 2) continue;
      if (hitTime > expected.expectedTime + TIMING_WINDOW_MS * 2) continue;

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = expected;
      }
    }

    if (bestMatch && bestDistance <= TIMING_WINDOW_MS) {
      bestMatch.matched = true;
      bestMatch.matchedEvent = event;
      bestMatch.timingOffset = hitTime - bestMatch.expectedTime;
    } else {
      this.unmatchedHits.push(event);
    }
  }

  /**
   * Get the current real-time score while the exercise is in progress.
   */
  getRealtimeScore(): RealtimeScore {
    const now = performance.now();
    const elapsed = now - this.startTime;
    const stepsPerBar = this.pattern.beats * this.pattern.subdivisions;
    const totalSteps = stepsPerBar * this.bars;
    const totalDuration = totalSteps * this.subdivisionDurationMs;

    // Current beat (0-based)
    const currentStep = Math.floor(elapsed / this.subdivisionDurationMs);
    const currentBeat = Math.floor(currentStep / this.pattern.subdivisions);

    // Only count expected hits that should have occurred by now
    const pastExpected = this.expectedHits.filter(
      (h) => h.expectedTime <= now + TIMING_WINDOW_MS
    );
    const matched = pastExpected.filter((h) => h.matched).length;
    const total = pastExpected.length;
    const accuracy = total > 0 ? matched / total : 1;

    return {
      accuracy,
      currentBeat: Math.min(currentBeat, this.pattern.beats * this.bars),
      totalBeats: this.pattern.beats * this.bars,
      hitCount: matched,
      missCount: total - matched,
      totalExpected: this.expectedHits.length,
    };
  }

  /**
   * Finish the exercise and calculate the final ExerciseResult.
   */
  finish(): ExerciseResult {
    const matched = this.expectedHits.filter((h) => h.matched);
    const missed = this.expectedHits.filter((h) => !h.matched);
    const totalExpected = this.expectedHits.length;

    // Overall accuracy
    const accuracy = totalExpected > 0 ? matched.length / totalExpected : 0;

    // Per-pad timing statistics
    const timingData = this.calculateTimingData(matched);

    // Per-pad velocity statistics
    const velocityData = this.calculateVelocityData(matched);

    // Score: 0-100 based on accuracy and timing precision
    const score = this.calculateScore(accuracy, matched);

    // Stars
    const stars = this.calculateStars(score);

    return {
      exerciseId: this.exerciseId,
      timestamp: Date.now(),
      bpm: this.bpm,
      accuracy,
      timingData,
      score,
      stars,
      missedNotes: missed.length,
      velocityData,
    };
  }

  /**
   * Calculate per-pad timing statistics from matched hits.
   */
  private calculateTimingData(
    matched: ExpectedHit[]
  ): Partial<Record<DrumPad, PadTimingStats>> {
    const padGroups = new Map<DrumPad, ExpectedHit[]>();

    for (const hit of matched) {
      const group = padGroups.get(hit.pad) ?? [];
      group.push(hit);
      padGroups.set(hit.pad, group);
    }

    const result: Partial<Record<DrumPad, PadTimingStats>> = {};

    for (const [pad, hits] of padGroups) {
      const offsets = hits
        .filter((h) => h.timingOffset !== undefined)
        .map((h) => h.timingOffset!);

      if (offsets.length === 0) continue;

      const avgOffset = offsets.reduce((a, b) => a + b, 0) / offsets.length;
      const variance =
        offsets.reduce((sum, o) => sum + (o - avgOffset) ** 2, 0) / offsets.length;
      const stdDev = Math.sqrt(variance);

      // Count total expected for this pad
      const totalForPad = this.expectedHits.filter((h) => h.pad === pad).length;

      result[pad] = {
        avgOffset: Math.round(avgOffset * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        hitCount: hits.length,
        missCount: totalForPad - hits.length,
      };
    }

    // Add entries for pads with zero hits
    const allPads = new Set(this.expectedHits.map((h) => h.pad));
    for (const pad of allPads) {
      if (!result[pad]) {
        const totalForPad = this.expectedHits.filter((h) => h.pad === pad).length;
        result[pad] = {
          avgOffset: 0,
          stdDev: 0,
          hitCount: 0,
          missCount: totalForPad,
        };
      }
    }

    return result;
  }

  /**
   * Calculate per-pad velocity statistics from matched hits.
   */
  private calculateVelocityData(
    matched: ExpectedHit[]
  ): Partial<Record<DrumPad, VelocityStats>> {
    const padGroups = new Map<DrumPad, number[]>();

    for (const hit of matched) {
      if (!hit.matchedEvent) continue;
      const velocities = padGroups.get(hit.pad) ?? [];
      velocities.push(hit.matchedEvent.velocity);
      padGroups.set(hit.pad, velocities);
    }

    const result: Partial<Record<DrumPad, VelocityStats>> = {};

    for (const [pad, velocities] of padGroups) {
      if (velocities.length === 0) continue;

      const avg = velocities.reduce((a, b) => a + b, 0) / velocities.length;
      const min = Math.min(...velocities);
      const max = Math.max(...velocities);
      const variance =
        velocities.reduce((sum, v) => sum + (v - avg) ** 2, 0) / velocities.length;
      const stdDev = Math.sqrt(variance);

      result[pad] = {
        avg: Math.round(avg * 100) / 100,
        min,
        max,
        stdDev: Math.round(stdDev * 100) / 100,
      };
    }

    return result;
  }

  /**
   * Calculate a 0-100 score. Accuracy counts for 70%, timing precision for 30%.
   */
  private calculateScore(accuracy: number, matched: ExpectedHit[]): number {
    const accuracyScore = accuracy * 70;

    // Timing precision: average absolute offset, normalized
    let timingScore = 30; // full marks if no hits (edge case)
    if (matched.length > 0) {
      const offsets = matched
        .filter((h) => h.timingOffset !== undefined)
        .map((h) => Math.abs(h.timingOffset!));

      if (offsets.length > 0) {
        const avgAbsOffset = offsets.reduce((a, b) => a + b, 0) / offsets.length;
        // Perfect = 0ms offset -> 30 points, worst (50ms) -> 0 points
        const timingFraction = Math.max(0, 1 - avgAbsOffset / TIMING_WINDOW_MS);
        timingScore = timingFraction * 30;
      }
    }

    return Math.round(accuracyScore + timingScore);
  }

  /**
   * Convert a 0-100 score into 0-3 stars.
   */
  private calculateStars(score: number): number {
    if (score >= 95) return 3;
    if (score >= 85) return 2;
    if (score >= 70) return 1;
    return 0;
  }
}

export { ScoringEngine };
export type { RealtimeScore, ExpectedHit };
