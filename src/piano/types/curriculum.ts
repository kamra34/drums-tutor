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

export interface NoteEvent {
  note: string;       // e.g., 'C4', 'Db3'
  duration: number;   // in beats (1 = quarter, 0.5 = eighth, 2 = half, etc.)
  finger?: number;    // 1-5 fingering
}

export interface ChordEvent {
  name: string;       // e.g., 'C', 'G7', 'Dm'
  notes: string[];    // e.g., ['C3', 'E3', 'G3']
  duration: number;   // in beats
  fingers?: number[]; // fingering per note
}

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
  // Musical content — Right hand
  notes?: NoteEvent[];           // RH: scale, melody, technique exercises
  chords?: ChordEvent[];         // RH or LH chord-progression exercises (LH if no notes)
  // Musical content — Left hand (for both-hands exercises)
  notesLeft?: NoteEvent[];       // LH note sequence (parallel to RH notes)
  chordsLeft?: ChordEvent[];     // LH chords (plays simultaneously with RH notes)
  instructions?: string[];       // Step-by-step guidance for the exercise
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
