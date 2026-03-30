import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProgress, ExerciseResult, SkillProfile } from '../types/curriculum';
import { apiCompleteLesson, getToken } from '@shared/services/apiClient';
import { registerStore } from '@shared/stores/storeUtils';

interface PianoProgressState {
  progress: UserProgress;
  totalPracticeTime: number;
  practiceStreak: number;
  lastPracticeDate: string | null;

  setCurrentModule: (moduleId: string) => void;
  completeLesson: (lessonId: string) => void;
  addExerciseResult: (result: ExerciseResult) => void;
  updateSkillProfile: (profile: Partial<SkillProfile>) => void;
  addPracticeTime: (minutes: number) => void;
  getBestResult: (exerciseId: string) => ExerciseResult | undefined;
  isLessonCompleted: (lessonId: string) => boolean;
  getExerciseResults: (exerciseId: string) => ExerciseResult[];
}

export const usePianoProgressStore = create<PianoProgressState>()(
  persist(
    (set, get) => ({
      progress: {
        currentModule: 'piano-0',
        completedLessons: [],
        exerciseResults: [],
        skillProfile: {
          noteReading: 0,
          rhythm: 0,
          technique: 0,
          handsCoordination: 0,
          musicality: 0,
        },
      },
      totalPracticeTime: 0,
      practiceStreak: 0,
      lastPracticeDate: null,

      setCurrentModule: (moduleId) =>
        set((state) => ({
          progress: { ...state.progress, currentModule: moduleId },
        })),

      completeLesson: (lessonId) => {
        set((state) => {
          if (state.progress.completedLessons.includes(lessonId)) return state;
          return {
            progress: {
              ...state.progress,
              completedLessons: [...state.progress.completedLessons, lessonId],
            },
          };
        });
        if (getToken()) {
          apiCompleteLesson(lessonId).catch(() => {});
        }
      },

      addExerciseResult: (result) => {
        set((state) => ({
          progress: {
            ...state.progress,
            exerciseResults: [...state.progress.exerciseResults, result],
          },
        }));
      },

      updateSkillProfile: (profile) =>
        set((state) => ({
          progress: {
            ...state.progress,
            skillProfile: { ...state.progress.skillProfile, ...profile },
          },
        })),

      addPracticeTime: (minutes) =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const wasToday = state.lastPracticeDate === today;
          const wasYesterday =
            state.lastPracticeDate ===
            new Date(Date.now() - 86400000).toISOString().split('T')[0];
          return {
            totalPracticeTime: state.totalPracticeTime + minutes,
            lastPracticeDate: today,
            practiceStreak: wasToday
              ? state.practiceStreak
              : wasYesterday
                ? state.practiceStreak + 1
                : 1,
          };
        }),

      getBestResult: (exerciseId) => {
        const results = get().progress.exerciseResults.filter(
          (r) => r.exerciseId === exerciseId
        );
        if (results.length === 0) return undefined;
        return results.reduce((best, r) => (r.score > best.score ? r : best));
      },

      isLessonCompleted: (lessonId) =>
        get().progress.completedLessons.includes(lessonId),

      getExerciseResults: (exerciseId) =>
        get().progress.exerciseResults.filter((r) => r.exerciseId === exerciseId),
    }),
    {
      name: 'piano-tutor-user',
    }
  )
);

registerStore('piano-tutor-user', usePianoProgressStore as any);
