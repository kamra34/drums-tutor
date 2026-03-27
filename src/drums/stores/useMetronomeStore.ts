import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MetronomeState {
  bpm: number;
  isPlaying: boolean;
  timeSignature: [number, number];
  currentBeat: number; // 0-based
  volume: number; // 0-1

  setBpm: (bpm: number) => void;
  incrementBpm: (amount: number) => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setTimeSignature: (sig: [number, number]) => void;
  setCurrentBeat: (beat: number) => void;
  setVolume: (volume: number) => void;
}

export const useMetronomeStore = create<MetronomeState>()(
  persist(
    (set) => ({
      bpm: 80,
      isPlaying: false,
      timeSignature: [4, 4] as [number, number],
      currentBeat: 0,
      volume: 0.7,

      setBpm: (bpm) => set({ bpm: Math.max(40, Math.min(240, bpm)) }),
      incrementBpm: (amount) =>
        set((state) => ({ bpm: Math.max(40, Math.min(240, state.bpm + amount)) })),
      setPlaying: (playing) => set({ isPlaying: playing }),
      togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setTimeSignature: (sig) => set({ timeSignature: sig }),
      setCurrentBeat: (beat) => set({ currentBeat: beat }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
    }),
    {
      name: 'drum-tutor-metronome',
      partialize: (state) => ({
        bpm: state.bpm,
        timeSignature: state.timeSignature,
        volume: state.volume,
      }),
    }
  )
);
