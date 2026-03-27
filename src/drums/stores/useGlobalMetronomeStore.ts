import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GlobalMetronomeState {
  bpm: number
  beatsPerMeasure: number
  beatValue: number
  isPlaying: boolean
  volume: number
  currentBeat: number
  accentFirst: boolean

  setBpm: (bpm: number) => void
  setTimeSignature: (beats: number, value: number) => void
  setVolume: (vol: number) => void
  setPlaying: (playing: boolean) => void
  setCurrentBeat: (beat: number) => void
  setAccentFirst: (accent: boolean) => void
}

export const useGlobalMetronomeStore = create<GlobalMetronomeState>()(
  persist(
    (set) => ({
      bpm: 90,
      beatsPerMeasure: 4,
      beatValue: 4,
      isPlaying: false,
      volume: 0.6,
      currentBeat: -1,
      accentFirst: true,

      setBpm: (bpm) => set({ bpm: Math.max(30, Math.min(300, bpm)) }),
      setTimeSignature: (beats, value) => set({ beatsPerMeasure: beats, beatValue: value }),
      setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
      setPlaying: (playing) => set({ isPlaying: playing, currentBeat: playing ? 0 : -1 }),
      setCurrentBeat: (beat) => set({ currentBeat: beat }),
      setAccentFirst: (accent) => set({ accentFirst: accent }),
    }),
    {
      name: 'drum-tutor-global-metronome',
      partialize: (s) => ({ bpm: s.bpm, beatsPerMeasure: s.beatsPerMeasure, beatValue: s.beatValue, volume: s.volume, accentFirst: s.accentFirst }),
    }
  )
)
