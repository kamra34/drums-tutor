import { create } from 'zustand';
import { ExerciseResult } from '@drums/types/curriculum';
import { DrumPad } from '@drums/types/midi';

export type PracticeStatus = 'idle' | 'countdown' | 'playing' | 'finished';
export type HitJudgement = 'perfect' | 'good' | 'early' | 'late' | 'miss';

export interface HitResult {
  step: number;
  pad: DrumPad;
  judgement: HitJudgement;
  offsetMs: number;
}

interface PracticeState {
  status: PracticeStatus;
  currentBeat: number;
  currentBar: number;
  hitResults: HitResult[];
  accuracy: number;
  hitCount: number;
  missCount: number;
  totalExpected: number;
  lastJudgement: { judgement: HitJudgement; offsetMs: number } | null;
  lastJudgementTime: number;
  result: ExerciseResult | null;

  setStatus: (status: PracticeStatus) => void;
  setCurrentBeat: (beat: number) => void;
  setCurrentBar: (bar: number) => void;
  addHitResult: (result: HitResult) => void;
  setLastJudgement: (judgement: HitJudgement, offsetMs: number) => void;
  updateScore: (accuracy: number, hitCount: number, missCount: number, totalExpected: number) => void;
  setResult: (result: ExerciseResult) => void;
  reset: () => void;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  status: 'idle',
  currentBeat: 0,
  currentBar: 0,
  hitResults: [],
  accuracy: 1,
  hitCount: 0,
  missCount: 0,
  totalExpected: 0,
  lastJudgement: null,
  lastJudgementTime: 0,
  result: null,

  setStatus: (status) => set({ status }),
  setCurrentBeat: (beat) => set({ currentBeat: beat }),
  setCurrentBar: (bar) => set({ currentBar: bar }),

  addHitResult: (result) =>
    set((state) => ({
      hitResults: [...state.hitResults, result],
    })),

  setLastJudgement: (judgement, offsetMs) =>
    set({
      lastJudgement: { judgement, offsetMs },
      lastJudgementTime: Date.now(),
    }),

  updateScore: (accuracy, hitCount, missCount, totalExpected) =>
    set({ accuracy, hitCount, missCount, totalExpected }),

  setResult: (result) => set({ result }),

  reset: () =>
    set({
      status: 'idle',
      currentBeat: 0,
      currentBar: 0,
      hitResults: [],
      accuracy: 1,
      hitCount: 0,
      missCount: 0,
      totalExpected: 0,
      lastJudgement: null,
      lastJudgementTime: 0,
      result: null,
    }),
}));
