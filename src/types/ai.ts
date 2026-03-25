import { ExerciseResult, SkillProfile } from './curriculum';

export interface AiFeedback {
  exerciseId: string;
  summary: string;
  tips: string[];
  encouragement: string;
  suggestedNextExercise?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AiContext {
  studentLevel: 'beginner' | 'intermediate' | 'advanced';
  currentModule: string;
  exerciseName?: string;
  scoringData?: ExerciseResult;
  skillProfile?: SkillProfile;
  chatHistory?: ChatMessage[];
}
