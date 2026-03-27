import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProgress, ExerciseResult, SkillProfile } from '@drums/types/curriculum';
import { apiRecordSession, apiCompleteLesson, getToken } from '@shared/services/apiClient';
import { registerStore } from '@shared/stores/storeUtils';

interface UserState {
  progress: UserProgress;
  totalPracticeTime: number; // minutes
  practiceStreak: number; // days
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

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      progress: {
        currentModule: 'module-1',
        completedLessons: [],
        exerciseResults: [],
        skillProfile: {
          timing: 0,
          dynamics: 0,
          independence: 0,
          speed: 0,
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
        // Sync to backend (fire-and-forget)
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
        // Sync to backend (fire-and-forget)
        if (getToken()) {
          apiRecordSession({
            exerciseId: result.exerciseId,
            bpm: result.bpm,
            score: result.score,
            stars: result.stars,
            accuracy: result.accuracy,
            timingData: result.timingData,
            velocityData: result.velocityData,
            missedNotes: result.missedNotes ?? 0,
            totalNotes: (result.missedNotes ?? 0) + Object.values(result.timingData ?? {}).reduce((s: number, v: any) => s + (v?.hitCount ?? 0), 0),
            hitNotes: Object.values(result.timingData ?? {}).reduce((s: number, v: any) => s + (v?.hitCount ?? 0), 0),
            practiceMode: 'exercise',
          }).catch(() => {});
        }
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
      name: 'drum-tutor-user',
    }
  )
);

// Register so storeUtils can rehydrate on user switch
registerStore('drum-tutor-user', useUserStore as any);
