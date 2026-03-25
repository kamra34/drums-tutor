import { create } from 'zustand';
import { MidiEvent, DrumPad, DrumMap, GM_DRUM_MAP } from '../types/midi';

interface MidiState {
  isSupported: boolean;
  isConnected: boolean;
  deviceName: string | null;
  deviceId: string | null;
  drumMap: DrumMap;
  activePads: Partial<Record<DrumPad, { velocity: number; timestamp: number }>>;
  recentEvents: MidiEvent[];
  detectedPads: Set<DrumPad>;

  setSupported: (supported: boolean) => void;
  setConnected: (connected: boolean, deviceName?: string, deviceId?: string) => void;
  setDrumMap: (map: DrumMap) => void;
  padHit: (pad: DrumPad, velocity: number) => void;
  padRelease: (pad: DrumPad) => void;
  addEvent: (event: MidiEvent) => void;
  addDetectedPad: (pad: DrumPad) => void;
  clearDetectedPads: () => void;
  disconnect: () => void;
}

export const useMidiStore = create<MidiState>((set) => ({
  isSupported: true,
  isConnected: false,
  deviceName: null,
  deviceId: null,
  drumMap: GM_DRUM_MAP,
  activePads: {},
  recentEvents: [],
  detectedPads: new Set(),

  setSupported: (supported) => set({ isSupported: supported }),

  setConnected: (connected, deviceName, deviceId) =>
    set({ isConnected: connected, deviceName: deviceName ?? null, deviceId: deviceId ?? null }),

  setDrumMap: (map) => set({ drumMap: map }),

  padHit: (pad, velocity) =>
    set((state) => ({
      activePads: {
        ...state.activePads,
        [pad]: { velocity, timestamp: performance.now() },
      },
    })),

  padRelease: (pad) =>
    set((state) => {
      const next = { ...state.activePads };
      delete next[pad];
      return { activePads: next };
    }),

  addEvent: (event) =>
    set((state) => ({
      recentEvents: [event, ...state.recentEvents].slice(0, 50),
    })),

  addDetectedPad: (pad) =>
    set((state) => ({
      detectedPads: new Set([...state.detectedPads, pad]),
    })),

  clearDetectedPads: () => set({ detectedPads: new Set() }),

  disconnect: () =>
    set({
      isConnected: false,
      deviceName: null,
      deviceId: null,
      activePads: {},
    }),
}));
