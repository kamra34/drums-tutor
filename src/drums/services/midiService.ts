import { MidiEvent, DrumMap, DrumPad, ALESIS_DRUM_MAP } from '@drums/types/midi';

type NoteOnCallback = (event: MidiEvent) => void;

class MidiService {
  private midiAccess: MIDIAccess | null = null;
  private activeInput: MIDIInput | null = null;
  private noteOnCallbacks: NoteOnCallback[] = [];
  private currentDrumMap: DrumMap = ALESIS_DRUM_MAP;

  /**
   * Request access to the Web MIDI API.
   * Returns true on success, false if unavailable or denied.
   */
  async requestMidiAccess(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      console.error('Web MIDI API is not supported in this browser.');
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      return true;
    } catch (err) {
      console.error('Failed to get MIDI access:', err);
      return false;
    }
  }

  /**
   * Returns a list of available MIDI input devices.
   */
  getInputDevices(): { id: string; name: string; manufacturer: string }[] {
    if (!this.midiAccess) return [];

    const devices: { id: string; name: string; manufacturer: string }[] = [];
    this.midiAccess.inputs.forEach((input) => {
      devices.push({
        id: input.id,
        name: input.name ?? 'Unknown Device',
        manufacturer: input.manufacturer ?? 'Unknown',
      });
    });
    return devices;
  }

  /**
   * Connect to a specific MIDI input device by its ID.
   * Sets up the onmidimessage listener.
   */
  connectToDevice(deviceId: string): boolean {
    if (!this.midiAccess) {
      console.error('MIDI access not initialized. Call requestMidiAccess() first.');
      return false;
    }

    // Disconnect any existing device first
    this.disconnectDevice();

    const input = this.midiAccess.inputs.get(deviceId);
    if (!input) {
      console.error(`MIDI device with id "${deviceId}" not found.`);
      return false;
    }

    this.activeInput = input;
    this.activeInput.onmidimessage = this.handleMidiMessage;
    return true;
  }

  /**
   * Disconnect the currently connected MIDI device and clean up.
   */
  disconnectDevice(): void {
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
      this.activeInput = null;
    }
  }

  /**
   * Get the name of the currently connected device, or null.
   */
  getConnectedDeviceName(): string | null {
    return this.activeInput?.name ?? null;
  }

  /**
   * Set the drum map used for resolving MIDI notes to DrumPad values.
   */
  setDrumMap(drumMap: DrumMap): void {
    this.currentDrumMap = drumMap;
  }

  /**
   * Register a callback to be invoked on every note-on event.
   * Returns an unsubscribe function.
   */
  onNoteOn(callback: NoteOnCallback): () => void {
    this.noteOnCallbacks.push(callback);
    return () => {
      this.noteOnCallbacks = this.noteOnCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Parse raw MIDI data into a MidiEvent.
   * Only note-on messages (status 0x90) with velocity > 0 are returned.
   */
  parseMidiMessage(data: Uint8Array, timestamp: number): MidiEvent | null {
    if (data.length < 3) return null;

    const status = data[0] & 0xf0;
    const channel = data[0] & 0x0f;
    const note = data[1];
    const velocity = data[2];

    // Only handle note-on with velocity > 0
    // (note-on with velocity 0 is equivalent to note-off)
    if (status !== 0x90 || velocity === 0) {
      return null;
    }

    return { note, velocity, timestamp, channel };
  }

  /**
   * Resolve a MIDI note number to a DrumPad using the active drum map.
   */
  resolvePad(note: number): DrumPad | undefined {
    return this.currentDrumMap[note];
  }

  /**
   * Internal handler for raw MIDI messages from the device.
   */
  private handleMidiMessage = (event: MIDIMessageEvent): void => {
    if (!event.data) return;

    const midiEvent = this.parseMidiMessage(event.data, event.timeStamp);
    if (!midiEvent) return;

    // Notify all registered listeners
    for (const callback of this.noteOnCallbacks) {
      callback(midiEvent);
    }
  };
}

// Export a singleton instance
export const midiService = new MidiService();
export type { NoteOnCallback };
