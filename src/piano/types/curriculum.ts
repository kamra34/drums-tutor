// ─── Piano Lesson Blocks (discriminated union) ─────────────────────────────

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

export interface QuizBlock {
  type: 'quiz';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type LessonBlock = TextBlock | ImageBlock | QuizBlock;

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

export type ExerciseType =
  | 'scale'
  | 'chord-progression'
  | 'sight-reading'
  | 'technique'
  | 'melody';

export interface Exercise {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  exerciseType: ExerciseType;
  difficulty: number; // 1-10
  handsRequired: 'right' | 'left' | 'both';
  keySignature?: string;
  timeSignature?: [number, number];
  targetBpm?: number;
}

// ─── Exercise Result / Scoring ──────────────────────────────────────────────

export interface ExerciseResult {
  exerciseId: string;
  timestamp: number;
  score: number; // 0-100
  stars: number; // 0-3
  accuracy: number; // 0-1
}

// ─── Unlock Requirements ────────────────────────────────────────────────────

export interface UnlockRequirement {
  requiredModuleComplete?: string;
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
  noteReading: number;         // 0-100
  rhythm: number;              // 0-100
  technique: number;           // 0-100
  handsCoordination: number;   // 0-100
  musicality: number;          // 0-100
}

// ─── User Progress ──────────────────────────────────────────────────────────

export interface UserProgress {
  currentModule: string;
  completedLessons: string[];
  exerciseResults: ExerciseResult[];
  skillProfile: SkillProfile;
}
