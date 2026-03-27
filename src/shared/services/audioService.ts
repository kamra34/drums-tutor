import * as Tone from 'tone';

class AudioService {
  private accentSynth: Tone.Synth | null = null;
  private normalSynth: Tone.Synth | null = null;
  private isMetronomePlaying = false;
  private onBeatCallback: ((beat: number) => void) | null = null;
  private currentBeat = 0;
  private beatsPerMeasure = 4;
  private repeatEventId: number | null = null;

  /**
   * Ensure Tone.js audio context is started (required after user gesture).
   */
  private async ensureAudioContext(): Promise<void> {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
  }

  /**
   * Initialize synths lazily.
   */
  private initSynths(): void {
    if (this.accentSynth) return;

    // High-pitched click for accent (beat 1)
    this.accentSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.02,
      },
    }).toDestination();

    // Lower-pitched click for normal beats
    this.normalSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.02,
      },
    }).toDestination();
  }

  /**
   * Start the metronome at the given BPM and time signature.
   * Calls onBeat with the current beat number (0-indexed) on each beat.
   */
  async startMetronome(
    bpm: number,
    timeSignature: [number, number],
    onBeat: (beat: number) => void
  ): Promise<void> {
    await this.ensureAudioContext();
    this.initSynths();

    // Stop any existing metronome
    this.stopMetronome();

    this.beatsPerMeasure = timeSignature[0];
    this.currentBeat = 0;
    this.onBeatCallback = onBeat;
    this.isMetronomePlaying = true;

    Tone.getTransport().bpm.value = bpm;
    Tone.getTransport().timeSignature = timeSignature[0];

    // Schedule repeating event on each quarter note
    this.repeatEventId = Tone.getTransport().scheduleRepeat(
      (time) => {
        const isAccent = this.currentBeat === 0;
        this.playClickAtTime(isAccent, time);

        // Notify callback on the main thread
        const beat = this.currentBeat;
        Tone.getDraw().schedule(() => {
          this.onBeatCallback?.(beat);
        }, time);

        this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
      },
      '4n' // quarter note interval
    );

    Tone.getTransport().start();
  }

  /**
   * Stop the metronome.
   */
  stopMetronome(): void {
    if (this.repeatEventId !== null) {
      Tone.getTransport().clear(this.repeatEventId);
      this.repeatEventId = null;
    }
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    this.isMetronomePlaying = false;
    this.currentBeat = 0;
    this.onBeatCallback = null;
  }

  /**
   * Update the BPM while the metronome is running.
   */
  setBpm(bpm: number): void {
    Tone.getTransport().bpm.value = bpm;
  }

  /**
   * Play a single click sound (for UI preview or tap tempo feedback).
   */
  async playClick(accent: boolean): Promise<void> {
    await this.ensureAudioContext();
    this.initSynths();

    const now = Tone.now();
    this.playClickAtTime(accent, now);
  }

  /**
   * Returns whether the metronome is currently playing.
   */
  isPlaying(): boolean {
    return this.isMetronomePlaying;
  }

  /**
   * Set the metronome click volume (0-1).
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  private volume = 0.7;

  /**
   * Internal: play a click at a specific Tone.js time.
   */
  private playClickAtTime(accent: boolean, time: number): void {
    if (accent && this.accentSynth) {
      this.accentSynth.triggerAttackRelease('C6', '32n', time, 0.8 * this.volume);
    } else if (this.normalSynth) {
      this.normalSynth.triggerAttackRelease('G5', '32n', time, 0.5 * this.volume);
    }
  }

  /**
   * Dispose of audio resources.
   */
  dispose(): void {
    this.stopMetronome();
    this.accentSynth?.dispose();
    this.normalSynth?.dispose();
    this.accentSynth = null;
    this.normalSynth = null;
  }
}

export const audioService = new AudioService();
