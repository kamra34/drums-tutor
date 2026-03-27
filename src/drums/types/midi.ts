export interface MidiEvent {
  note: number;
  velocity: number;
  timestamp: number;
  channel: number;
}

export enum DrumPad {
  Kick = 'kick',
  Snare = 'snare',
  SnareRim = 'snare_rim',
  HiHatClosed = 'hihat_closed',
  HiHatOpen = 'hihat_open',
  HiHatPedal = 'hihat_pedal',
  Tom1 = 'tom1',
  Tom2 = 'tom2',
  FloorTom = 'floor_tom',
  CrashCymbal = 'crash',
  RideCymbal = 'ride',
  RideBell = 'ride_bell',
}

export interface DrumMap {
  [midiNote: number]: DrumPad;
}

// General MIDI Percussion Map
export const GM_DRUM_MAP: DrumMap = {
  36: DrumPad.Kick,
  38: DrumPad.Snare,
  40: DrumPad.SnareRim,
  42: DrumPad.HiHatClosed,
  44: DrumPad.HiHatPedal,
  46: DrumPad.HiHatOpen,
  48: DrumPad.Tom1,
  45: DrumPad.Tom2,
  43: DrumPad.FloorTom,
  49: DrumPad.CrashCymbal,
  51: DrumPad.RideCymbal,
  53: DrumPad.RideBell,
};

// Alesis kits have slightly different mappings
export const ALESIS_DRUM_MAP: DrumMap = {
  36: DrumPad.Kick,
  38: DrumPad.Snare,
  40: DrumPad.SnareRim,
  42: DrumPad.HiHatClosed,
  44: DrumPad.HiHatPedal,
  46: DrumPad.HiHatOpen,
  48: DrumPad.Tom1,
  47: DrumPad.Tom2,
  43: DrumPad.FloorTom,
  49: DrumPad.CrashCymbal,
  51: DrumPad.RideCymbal,
  53: DrumPad.RideBell,
};
