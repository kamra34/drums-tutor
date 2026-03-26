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
  /** Base64 image data (data URI) attached to the message */
  image?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AiContext {
  studentLevel: 'beginner' | 'intermediate' | 'advanced';
  currentModule: string;
  exerciseName?: string;
  scoringData?: ExerciseResult;
  skillProfile?: SkillProfile;
  chatHistory?: ChatMessage[];
}
