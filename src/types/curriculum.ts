import { DrumPad } from './midi';

// ─── Pattern Data ───────────────────────────────────────────────────────────

/**
 * Represents a drum pattern on a grid.
 *
 * Each track maps a DrumPad to an array of hit values.
 * Array length MUST equal `beats * subdivisions`.
 *
 * Values: 0 = rest, 1 = normal hit, 2 = accent, 3 = ghost note
 */
export type HitValue = 0 | 1 | 2 | 3;

export interface PatternData {
  beats: number;
  subdivisions: number;
  tracks: Partial<Record<DrumPad, HitValue[]>>;
}

// ─── Lesson Blocks (discriminated union) ────────────────────────────────────

export interface TextBlock {
  type: 'text';
  content: string; // markdown
}

export interface ImageBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

export interface NotationBlock {
  type: 'notation';
  pattern: PatternData;
  description: string;
}

export interface QuizBlock {
  type: 'quiz';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type LessonBlock = TextBlock | ImageBlock | NotationBlock | QuizBlock;

// ─── Lesson ─────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  content: LessonBlock[];
  completed: boolean;
}

// ─── Exercise ───────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  patternData: PatternData;
  targetBpm: number;
  timeSignature: [number, number]; // e.g. [4, 4]
  bars: number;
  difficulty: number; // 1-10
}

// ─── Exercise Result / Scoring ──────────────────────────────────────────────

export interface PadTimingStats {
  avgOffset: number; // ms, positive = late
  stdDev: number;
  hitCount: number;
  missCount: number;
}

export interface VelocityStats {
  avg: number;
  min: number;
  max: number;
  stdDev: number;
}

export interface ExerciseResult {
  exerciseId: string;
  timestamp: number;
  bpm: number;
  accuracy: number; // 0-1
  timingData: Partial<Record<DrumPad, PadTimingStats>>;
  score: number; // 0-100
  stars: number; // 0-3
  missedNotes: number;
  velocityData: Partial<Record<DrumPad, VelocityStats>>;
}

// ─── Unlock Requirements ────────────────────────────────────────────────────

export interface UnlockRequirement {
  requiredModuleComplete?: string;
  minStarsOnAll?: number;
}

// ─── Module ─────────────────────────────────────────────────────────────────

export interface Module {
  id: string;
  name: string;
  description: string;
  order: number;
  lessons: Lesson[];
  exercises: Exercise[];
  unlockRequirements: UnlockRequirement;
}

// ─── Skill Profile ──────────────────────────────────────────────────────────

export interface SkillProfile {
  timing: number;       // 0-100
  dynamics: number;     // 0-100
  independence: number; // 0-100
  speed: number;        // 0-100
  musicality: number;   // 0-100
}

// ─── User Progress ──────────────────────────────────────────────────────────

export interface UserProgress {
  currentModule: string;
  completedLessons: string[];
  exerciseResults: ExerciseResult[];
  skillProfile: SkillProfile;
}
