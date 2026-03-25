import {
  DrumMap,
  DrumPad,
  GM_DRUM_MAP,
  ALESIS_DRUM_MAP,
} from '../types/midi';

// Re-export the maps so consumers can import from one place
export { GM_DRUM_MAP, ALESIS_DRUM_MAP };
export type { DrumMap };

/**
 * Returns a human-readable display name for a drum pad.
 */
export function getPadName(pad: DrumPad): string {
  const names: Record<DrumPad, string> = {
    [DrumPad.Kick]: 'Kick Drum',
    [DrumPad.Snare]: 'Snare Drum',
    [DrumPad.SnareRim]: 'Snare Rim',
    [DrumPad.HiHatClosed]: 'Hi-Hat (Closed)',
    [DrumPad.HiHatOpen]: 'Hi-Hat (Open)',
    [DrumPad.HiHatPedal]: 'Hi-Hat Pedal',
    [DrumPad.Tom1]: 'High Tom',
    [DrumPad.Tom2]: 'Mid Tom',
    [DrumPad.FloorTom]: 'Floor Tom',
    [DrumPad.CrashCymbal]: 'Crash Cymbal',
    [DrumPad.RideCymbal]: 'Ride Cymbal',
    [DrumPad.RideBell]: 'Ride Bell',
  };
  return names[pad] ?? pad;
}

/**
 * Returns a consistent HSL/hex colour string for rendering each pad type.
 */
export function getPadColor(pad: DrumPad): string {
  const colors: Record<DrumPad, string> = {
    [DrumPad.Kick]: '#E74C3C',       // red
    [DrumPad.Snare]: '#3498DB',      // blue
    [DrumPad.SnareRim]: '#5DADE2',   // light blue
    [DrumPad.HiHatClosed]: '#F1C40F', // yellow
    [DrumPad.HiHatOpen]: '#F39C12',  // orange-yellow
    [DrumPad.HiHatPedal]: '#D4AC0D', // dark yellow
    [DrumPad.Tom1]: '#2ECC71',       // green
    [DrumPad.Tom2]: '#27AE60',       // darker green
    [DrumPad.FloorTom]: '#1ABC9C',   // teal
    [DrumPad.CrashCymbal]: '#9B59B6', // purple
    [DrumPad.RideCymbal]: '#E67E22',  // orange
    [DrumPad.RideBell]: '#D35400',   // dark orange
  };
  return colors[pad] ?? '#95A5A6';
}

/**
 * Look up which DrumPad a MIDI note corresponds to using the given map.
 * Returns undefined when the note is not in the map.
 */
export function lookupPad(
  midiNote: number,
  drumMap: DrumMap = GM_DRUM_MAP,
): DrumPad | undefined {
  return drumMap[midiNote];
}

/**
 * Reverse lookup: find the first MIDI note number that maps to a given pad.
 */
export function lookupMidiNote(
  pad: DrumPad,
  drumMap: DrumMap = GM_DRUM_MAP,
): number | undefined {
  for (const [noteStr, p] of Object.entries(drumMap)) {
    if (p === pad) return Number(noteStr);
  }
  return undefined;
}
