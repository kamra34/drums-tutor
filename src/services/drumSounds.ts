/**
 * Drum kit sound library using real acoustic samples (VCSL, CC0).
 * Samples are loaded once and cached as AudioBuffers for low-latency playback.
 */

import { DrumPad } from '../types/midi'
import { HitValue } from '../types/curriculum'

// ── AudioContext singleton ──────────────────────────────────────────────────

let _ctx: AudioContext | null = null
function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

// ── Sample loader & cache ───────────────────────────────────────────────────

const SAMPLE_BASE = '/audio/drum-samples/'

const SAMPLE_FILES: Record<string, string> = {
  kick:         'kick.wav',
  snare:        'snare.wav',
  snareRim:     'snare-rim.wav',
  hihatClosed:  'hihat-closed.wav',
  hihatOpen:    'hihat-open.wav',
  hihatPedal:   'hihat-pedal.wav',
  crash:        'crash.wav',
  ride:         'ride.wav',
  rideBell:     'ride-bell.wav',
  tom1:         'tom1.wav',
  tom2:         'tom2.wav',
  floorTom:     'floor-tom.wav',
}

const _bufferCache: Map<string, AudioBuffer> = new Map()
let _loadingPromise: Promise<void> | null = null

async function loadSample(name: string, file: string): Promise<void> {
  try {
    const response = await fetch(SAMPLE_BASE + file)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const arrayBuf = await response.arrayBuffer()
    const audioBuffer = await ctx().decodeAudioData(arrayBuf)
    _bufferCache.set(name, audioBuffer)
  } catch (err) {
    console.warn(`Failed to load drum sample "${name}":`, err)
  }
}

/** Preload all samples. Safe to call multiple times. */
export async function loadDrumSamples(): Promise<void> {
  if (_loadingPromise) return _loadingPromise
  _loadingPromise = Promise.all(
    Object.entries(SAMPLE_FILES).map(([name, file]) => loadSample(name, file))
  ).then(() => {
    console.log(`Drum samples loaded: ${_bufferCache.size}/${Object.keys(SAMPLE_FILES).length}`)
  })
  return _loadingPromise
}

// ── Sample playback ─────────────────────────────────────────────────────────

// Track scheduled audio nodes so they can be stopped on cancel
let _scheduledSources: AudioBufferSourceNode[] = []
let _scheduledOscillators: OscillatorNode[] = []

function playSample(name: string, vol: number, when?: number): void {
  const buffer = _bufferCache.get(name)
  if (!buffer) {
    loadDrumSamples()
    return
  }
  const c = ctx()
  const source = c.createBufferSource()
  source.buffer = buffer
  const gain = c.createGain()
  gain.gain.value = vol
  source.connect(gain)
  gain.connect(c.destination)
  source.start(when ?? 0)
  if (when !== undefined) {
    _scheduledSources.push(source)
    source.onended = () => {
      const idx = _scheduledSources.indexOf(source)
      if (idx >= 0) _scheduledSources.splice(idx, 1)
    }
  }
}

// ── Individual drum sound exports ───────────────────────────────────────────

export function playKickSound(vol = 0.7): void { playSample('kick', vol) }
export function playSnareSound(vol = 0.6): void { playSample('snare', vol) }
export function playHiHatClosedSound(vol = 0.35): void { playSample('hihatClosed', vol) }
export function playHiHatOpenSound(vol = 0.35): void { playSample('hihatOpen', vol) }
export function playHiHatPedalSound(vol = 0.15): void { playSample('hihatPedal', vol) }
export function playCrashSound(vol = 0.5): void { playSample('crash', vol) }
export function playRideSound(vol = 0.35): void { playSample('ride', vol) }
export function playTom1Sound(vol = 0.45): void { playSample('tom1', vol) }
export function playTom2Sound(vol = 0.45): void { playSample('tom2', vol) }
export function playFloorTomSound(vol = 0.5): void { playSample('floorTom', vol) }

// ── DrumPad → sound mapping ─────────────────────────────────────────────────

const PAD_SOUND: Record<string, (vol: number) => void> = {
  [DrumPad.Kick]: playKickSound,
  [DrumPad.Snare]: playSnareSound,
  [DrumPad.SnareRim]: (v) => playSample('snareRim', v),
  [DrumPad.HiHatClosed]: playHiHatClosedSound,
  [DrumPad.HiHatOpen]: playHiHatOpenSound,
  [DrumPad.HiHatPedal]: playHiHatPedalSound,
  [DrumPad.CrashCymbal]: playCrashSound,
  [DrumPad.RideCymbal]: playRideSound,
  [DrumPad.RideBell]: (v) => playSample('rideBell', v),
  [DrumPad.Tom1]: playTom1Sound,
  [DrumPad.Tom2]: playTom2Sound,
  [DrumPad.FloorTom]: playFloorTomSound,
}

/** Play the correct sound for a given DrumPad */
export function playPadSound(pad: DrumPad, hitValue: HitValue = 1): void {
  const fn = PAD_SOUND[pad]
  if (!fn) return
  const vol = hitValue === 2 ? 1.0 : hitValue === 3 ? 0.15 : 0.6
  fn(vol)
}

// ── Built-in metronome click (synced with pattern playback) ─────────────────

let _clickEnabled = false
let _clickVolume = 0.5

/** Enable/disable metronome click during pattern playback */
export function setClickEnabled(enabled: boolean): void { _clickEnabled = enabled }
export function getClickEnabled(): boolean { return _clickEnabled }

/** Set click volume (0-1) relative to drum sounds */
export function setClickVolume(vol: number): void { _clickVolume = Math.max(0, Math.min(1, vol)) }
export function getClickVolume(): number { return _clickVolume }

function playClick(accent: boolean, when?: number): void {
  const c = ctx()
  const t = when ?? c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(c.destination)
  osc.type = 'triangle'
  osc.frequency.value = accent ? 1400 : 900
  const vol = _clickVolume * (accent ? 0.7 : 0.4)
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
  osc.start(t)
  osc.stop(t + 0.05)
  if (when !== undefined) {
    _scheduledOscillators.push(osc)
    osc.onended = () => {
      const idx = _scheduledOscillators.indexOf(osc)
      if (idx >= 0) _scheduledOscillators.splice(idx, 1)
    }
  }
}

// ── Pattern playback engine ─────────────────────────────────────────────────

let _playbackTimers: ReturnType<typeof setTimeout>[] = []
let _isPlaying = false
let _stepCallback: ((step: number) => void) | null = null

export function isPatternPlaying(): boolean { return _isPlaying }

export function stopPatternPlayback(): void {
  _isPlaying = false
  _playbackTimers.forEach(t => clearTimeout(t))
  _playbackTimers = []
  _stepCallback = null
  // Stop all pre-scheduled audio nodes
  for (const src of _scheduledSources) {
    try { src.stop() } catch {}
  }
  _scheduledSources = []
  for (const osc of _scheduledOscillators) {
    try { osc.stop() } catch {}
  }
  _scheduledOscillators = []
}

/**
 * Play a PatternData with correct sounds at the given BPM.
 * Awaits sample loading before scheduling anything.
 * Schedules audio via Web Audio API timing for sample-accurate playback,
 * and uses setTimeout only for UI step callbacks.
 */
export function playPattern(
  pattern: import('../types/curriculum').PatternData,
  bpm: number,
  bars: number = 1,
  onStep?: (step: number) => void,
  onFinish?: () => void,
): void {
  stopPatternPlayback()
  _isPlaying = true
  _stepCallback = onStep ?? null

  // Await samples, then schedule everything
  loadDrumSamples().then(() => {
    if (!_isPlaying) return // stopped before samples loaded

    const c = ctx()
    const { beats, subdivisions, tracks } = pattern
    const totalSlots = beats * subdivisions
    const secPerSlot = (60 / bpm) / subdivisions
    const totalSteps = totalSlots * bars

    // Small lookahead so first note doesn't collide with scheduling overhead
    const startTime = c.currentTime + 0.05

    // Schedule all audio using Web Audio API timing (sample-accurate)
    for (let step = 0; step < totalSteps; step++) {
      const when = startTime + step * secPerSlot
      const slotIdx = step % totalSlots

      // Schedule drum sounds at precise audio time
      for (const [pad, values] of Object.entries(tracks) as [DrumPad, HitValue[]][]) {
        const hv = values[slotIdx]
        if (hv > 0) {
          const fn = PAD_SOUND[pad]
          if (!fn) continue
          const vol = hv === 2 ? 1.0 : hv === 3 ? 0.15 : 0.6
          const sampleName = PAD_TO_SAMPLE[pad]
          if (sampleName) playSample(sampleName, vol, when)
        }
      }

      // Metronome click at precise audio time
      if (_clickEnabled && slotIdx % subdivisions === 0) {
        const beatIdx = slotIdx / subdivisions
        playClick(beatIdx === 0, when)
      }

      // UI callback via setTimeout (doesn't need to be sample-accurate)
      const delayMs = (when - c.currentTime) * 1000
      _playbackTimers.push(setTimeout(() => {
        if (!_isPlaying) return
        _stepCallback?.(slotIdx)
      }, Math.max(0, delayMs)))
    }

    // Finish callback
    const finishDelay = ((startTime + totalSteps * secPerSlot) - c.currentTime) * 1000 + 50
    _playbackTimers.push(setTimeout(() => {
      if (!_isPlaying) return
      _isPlaying = false
      _stepCallback = null
      onFinish?.()
    }, Math.max(0, finishDelay)))
  })
}

// Map DrumPad to sample name for scheduled playback
const PAD_TO_SAMPLE: Partial<Record<DrumPad, string>> = {
  [DrumPad.Kick]: 'kick',
  [DrumPad.Snare]: 'snare',
  [DrumPad.SnareRim]: 'snareRim',
  [DrumPad.HiHatClosed]: 'hihatClosed',
  [DrumPad.HiHatOpen]: 'hihatOpen',
  [DrumPad.HiHatPedal]: 'hihatPedal',
  [DrumPad.CrashCymbal]: 'crash',
  [DrumPad.RideCymbal]: 'ride',
  [DrumPad.RideBell]: 'rideBell',
  [DrumPad.Tom1]: 'tom1',
  [DrumPad.Tom2]: 'tom2',
  [DrumPad.FloorTom]: 'floorTom',
}
