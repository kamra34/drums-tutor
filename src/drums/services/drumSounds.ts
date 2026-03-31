/**
 * Drum kit sound library using real acoustic samples (VCSL, CC0).
 * Samples are loaded once and cached as AudioBuffers for low-latency playback.
 */

import { DrumPad } from '@drums/types/midi'
import { HitValue } from '@drums/types/curriculum'
import { registerAudioContext } from '@shared/services/audioUnlock'

// ── AudioContext singleton ──────────────────────────────────────────────────

let _ctx: AudioContext | null = null
function ctx(): AudioContext {
  if (!_ctx) {
    _ctx = new AudioContext()
    registerAudioContext(_ctx)
  }
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
  // Create AudioContext synchronously during the user gesture callstack.
  // This MUST happen before any await — iOS WebKit only allows context
  // creation + silent buffer playback during a direct user interaction.
  ctx()
  if (_loadingPromise) return _loadingPromise
  _loadingPromise = Promise.all(
    Object.entries(SAMPLE_FILES).map(([name, file]) => loadSample(name, file))
  ).then(() => {
    console.log(`Drum samples loaded: ${_bufferCache.size}/${Object.keys(SAMPLE_FILES).length}`)
  })
  return _loadingPromise
}

/** Check if all samples are already cached */
export function areSamplesLoaded(): boolean {
  return _bufferCache.size >= Object.keys(SAMPLE_FILES).length
}

/** Preload samples and warm up AudioContext. Call on page mount or before first play. */
export async function ensureAudioReady(): Promise<void> {
  ctx() // create + unlock AudioContext
  if (!areSamplesLoaded()) await loadDrumSamples()
}

// ── Sample playback ─────────────────────────────────────────────────────────

// Track scheduled audio nodes so they can be stopped on cancel
let _scheduledSources: AudioBufferSourceNode[] = []
let _scheduledOscillators: OscillatorNode[] = []

// Samples that need their duration capped (seconds) with a fade-out
const SAMPLE_MAX_DURATION: Record<string, number> = {
  crash: 2.0,
  ride: 2.5,
  rideBell: 2.0,
}

function playSample(name: string, vol: number, when?: number): void {
  const buffer = _bufferCache.get(name)
  if (!buffer) {
    loadDrumSamples()
    return
  }
  const c = ctx()
  const startTime = when ?? c.currentTime
  const source = c.createBufferSource()
  source.buffer = buffer
  const gain = c.createGain()
  gain.gain.setValueAtTime(vol, startTime)

  source.connect(gain)
  gain.connect(c.destination)
  source.start(startTime)

  // Apply fade-out for long samples (must be after start)
  const maxDur = SAMPLE_MAX_DURATION[name]
  if (maxDur && buffer.duration > maxDur) {
    const fadeStart = startTime + maxDur - 0.3
    const fadeEnd = startTime + maxDur
    gain.gain.setValueAtTime(vol, fadeStart)
    gain.gain.exponentialRampToValueAtTime(0.001, fadeEnd)
    source.stop(fadeEnd)
  }
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

// ── Backing track ───────────────────────────────────────────────────────────

let _backingBuffer: AudioBuffer | null = null
let _backingBpm = 120
let _backingVolume = 0.7
let _backingSource: AudioBufferSourceNode | null = null
let _backingGain: GainNode | null = null

/** Load an audio file as a backing track */
export async function loadBackingTrack(file: File): Promise<{ buffer: AudioBuffer; duration: number }> {
  const c = ctx()
  const arrayBuf = await file.arrayBuffer()
  const buffer = await c.decodeAudioData(arrayBuf)
  return { buffer, duration: buffer.duration }
}

/** Set the backing track buffer and its original BPM */
export function setBackingTrack(buffer: AudioBuffer, originalBpm: number): void {
  _backingBuffer = buffer
  _backingBpm = originalBpm
}

/** Clear the backing track */
export function clearBackingTrack(): void {
  stopBackingTrack()
  _backingBuffer = null
  _backingBpm = 120
}

/** Set backing track volume (0-1) */
export function setBackingVolume(vol: number): void {
  _backingVolume = Math.max(0, Math.min(1, vol))
  if (_backingGain) _backingGain.gain.value = _backingVolume
}
export function getBackingVolume(): number { return _backingVolume }

export function hasBackingTrack(): boolean { return _backingBuffer !== null }

/** Update the original BPM of the backing track (affects playback rate) */
export function setBackingBpm(bpm: number): void { _backingBpm = bpm }

function startBackingTrack(c: AudioContext, startTime: number, bpm: number, offsetSec: number = 0): void {
  if (!_backingBuffer) return
  stopBackingTrack()

  const source = c.createBufferSource()
  source.buffer = _backingBuffer
  source.playbackRate.value = bpm / _backingBpm
  source.loop = true

  const gain = c.createGain()
  gain.gain.value = _backingVolume
  source.connect(gain)
  gain.connect(c.destination)
  // offset is in buffer time (at original BPM)
  const bufferOffset = offsetSec % _backingBuffer.duration
  source.start(startTime, bufferOffset)

  _backingSource = source
  _backingGain = gain
}

function stopBackingTrack(): void {
  if (_backingSource) {
    try { _backingSource.stop() } catch {}
    _backingSource = null
  }
  _backingGain = null
}

// ── Pattern playback engine ─────────────────────────────────────────────────

let _playbackTimers: ReturnType<typeof setTimeout>[] = []
let _isPlaying = false
let _isPaused = false
let _stepCallback: ((step: number) => void) | null = null
let _lastReportedSlot = -1

// State for pause/resume/seek
let _savedPattern: import('../types/curriculum').PatternData | null = null
let _savedBpm = 90
let _savedBars = 1
let _savedOnStep: ((step: number) => void) | null = null
let _savedOnFinish: (() => void) | null = null

export function isPatternPlaying(): boolean { return _isPlaying }
export function isPatternPaused(): boolean { return _isPaused }
export function getLastPlayedSlot(): number { return _lastReportedSlot }

function clearScheduled(): void {
  _playbackTimers.forEach(t => clearTimeout(t))
  _playbackTimers = []
  for (const src of _scheduledSources) { try { src.stop() } catch {} }
  _scheduledSources = []
  for (const osc of _scheduledOscillators) { try { osc.stop() } catch {} }
  _scheduledOscillators = []
  stopBackingTrack()
}

export function stopPatternPlayback(): void {
  _isPlaying = false
  _isPaused = false
  _lastReportedSlot = -1
  _stepCallback = null
  clearScheduled()
  _savedPattern = null
}

/** Pause playback — remembers position for resume */
export function pausePatternPlayback(): number {
  if (!_isPlaying) return _lastReportedSlot
  _isPaused = true
  _isPlaying = false
  clearScheduled()
  return _lastReportedSlot
}

/** Resume from paused position */
export function resumePatternPlayback(): void {
  if (!_isPaused || !_savedPattern || _lastReportedSlot < 0) return
  _isPaused = false
  playPatternFromSlot(_savedPattern, _savedBpm, _savedBars, _lastReportedSlot, _savedOnStep ?? undefined, _savedOnFinish ?? undefined)
}

/** Play pattern starting from a specific slot */
export async function playPatternFromSlot(
  pattern: import('../types/curriculum').PatternData,
  bpm: number,
  bars: number,
  startSlot: number,
  onStep?: (step: number) => void,
  onFinish?: () => void,
): Promise<void> {
  clearScheduled()
  _isPlaying = true
  _isPaused = false
  _stepCallback = onStep ?? null
  _savedPattern = pattern
  _savedBpm = bpm
  _savedBars = bars
  _savedOnStep = onStep ?? null
  _savedOnFinish = onFinish ?? null

  // Ensure AudioContext is created synchronously (within user gesture)
  const c = ctx()
  // Wait for samples to load BEFORE scheduling — prevents first-play desync
  if (!areSamplesLoaded()) {
    await loadDrumSamples()
    if (!_isPlaying) return // user stopped during loading
  }
  schedulePattern(c, pattern, bpm, bars, onFinish, startSlot)
}

/**
 * Play a PatternData with correct sounds at the given BPM.
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
  playPatternFromSlot(pattern, bpm, bars, 0, onStep, onFinish)
}

function schedulePattern(
  c: AudioContext,
  pattern: import('../types/curriculum').PatternData,
  bpm: number,
  bars: number,
  onFinish?: () => void,
  startFromStep: number = 0,
): void {
  const { beats, subdivisions, tracks } = pattern
  const totalSlots = beats * subdivisions
  const secPerSlot = (60 / bpm) / subdivisions
  const totalSteps = totalSlots * bars

  // Small lookahead so first note doesn't collide with scheduling overhead
  const startTime = c.currentTime + 0.05

  // Start backing track synced — with offset if seeking
  const backingOffsetSec = startFromStep * 60 / (_backingBpm * subdivisions)
  startBackingTrack(c, startTime, bpm, backingOffsetSec)

  // Schedule audio from startFromStep onward
  for (let step = startFromStep; step < totalSteps; step++) {
    const when = startTime + (step - startFromStep) * secPerSlot
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
      _lastReportedSlot = slotIdx
      _stepCallback?.(slotIdx)
    }, Math.max(0, delayMs)))
  }

  // Finish callback
  const remainingSteps = totalSteps - startFromStep
  const finishDelay = ((startTime + remainingSteps * secPerSlot) - c.currentTime) * 1000 + 50
  _playbackTimers.push(setTimeout(() => {
    if (!_isPlaying) return
    _isPlaying = false
    _stepCallback = null
    _lastReportedSlot = -1
    onFinish?.()
  }, Math.max(0, finishDelay)))
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
