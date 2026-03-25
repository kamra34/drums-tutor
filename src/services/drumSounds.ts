/**
 * Complete drum kit sound library using Web Audio API synthesis.
 * Each instrument has a distinct, recognisable sound.
 */

import { DrumPad } from '../types/midi'
import { HitValue } from '../types/curriculum'

let _ctx: AudioContext | null = null
function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

// ── Individual drum sounds ──────────────────────────────────────────────────

export function playKickSound(vol = 0.7): void {
  const c = ctx(), now = c.currentTime
  // Low sine sweep + click transient
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain); gain.connect(c.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(160, now)
  osc.frequency.exponentialRampToValueAtTime(35, now + 0.15)
  gain.gain.setValueAtTime(vol, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
  osc.start(now); osc.stop(now + 0.26)
  // Click attack
  const click = c.createOscillator()
  const cg = c.createGain()
  click.connect(cg); cg.connect(c.destination)
  click.type = 'triangle'
  click.frequency.value = 100
  cg.gain.setValueAtTime(vol * 0.4, now)
  cg.gain.exponentialRampToValueAtTime(0.001, now + 0.02)
  click.start(now); click.stop(now + 0.03)
}

export function playSnareSound(vol = 0.6): void {
  const c = ctx(), now = c.currentTime
  const dur = 0.15
  // Noise (snare wires)
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.8)
  const noise = c.createBufferSource()
  noise.buffer = buf
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.7
  const ng = c.createGain()
  ng.gain.setValueAtTime(vol, now)
  ng.gain.exponentialRampToValueAtTime(0.001, now + dur)
  noise.connect(bp); bp.connect(ng); ng.connect(c.destination)
  noise.start(now); noise.stop(now + dur)
  // Body
  const body = c.createOscillator()
  const bg = c.createGain()
  body.connect(bg); bg.connect(c.destination)
  body.type = 'sine'
  body.frequency.setValueAtTime(220, now)
  body.frequency.exponentialRampToValueAtTime(120, now + 0.05)
  bg.gain.setValueAtTime(vol * 0.5, now)
  bg.gain.exponentialRampToValueAtTime(0.001, now + 0.07)
  body.start(now); body.stop(now + 0.08)
}

export function playHiHatClosedSound(vol = 0.35): void {
  const c = ctx(), now = c.currentTime
  const dur = 0.045
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const noise = c.createBufferSource()
  noise.buffer = buf
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'; hp.frequency.value = 8000
  const g = c.createGain()
  g.gain.setValueAtTime(vol, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + dur)
  noise.connect(hp); hp.connect(g); g.connect(c.destination)
  noise.start(now); noise.stop(now + dur)
}

export function playHiHatOpenSound(vol = 0.35): void {
  const c = ctx(), now = c.currentTime
  const dur = 0.3 // longer sustain
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 0.5)
  const noise = c.createBufferSource()
  noise.buffer = buf
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'; hp.frequency.value = 6000
  const g = c.createGain()
  g.gain.setValueAtTime(vol, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + dur)
  noise.connect(hp); hp.connect(g); g.connect(c.destination)
  noise.start(now); noise.stop(now + dur)
}

export function playHiHatPedalSound(vol = 0.15): void {
  const c = ctx(), now = c.currentTime
  const dur = 0.04
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const noise = c.createBufferSource()
  noise.buffer = buf
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'; hp.frequency.value = 9000
  const g = c.createGain()
  g.gain.setValueAtTime(vol, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + dur)
  noise.connect(hp); hp.connect(g); g.connect(c.destination)
  noise.start(now); noise.stop(now + dur)
}

export function playCrashSound(vol = 0.5): void {
  const c = ctx(), now = c.currentTime
  const dur = 0.8
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 0.3)
  const noise = c.createBufferSource()
  noise.buffer = buf
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'; bp.frequency.value = 5000; bp.Q.value = 0.3
  const g = c.createGain()
  g.gain.setValueAtTime(vol, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + dur)
  noise.connect(bp); bp.connect(g); g.connect(c.destination)
  noise.start(now); noise.stop(now + dur)
  // Metallic shimmer
  const osc = c.createOscillator()
  const og = c.createGain()
  osc.connect(og); og.connect(c.destination)
  osc.type = 'square'
  osc.frequency.value = 340
  og.gain.setValueAtTime(vol * 0.08, now)
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
  osc.start(now); osc.stop(now + 0.5)
}

export function playRideSound(vol = 0.35): void {
  const c = ctx(), now = c.currentTime
  const dur = 0.4
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 0.6)
  const noise = c.createBufferSource()
  noise.buffer = buf
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'; bp.frequency.value = 6000; bp.Q.value = 0.5
  const g = c.createGain()
  g.gain.setValueAtTime(vol * 0.5, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + dur)
  noise.connect(bp); bp.connect(g); g.connect(c.destination)
  noise.start(now); noise.stop(now + dur)
  // Ping
  const osc = c.createOscillator()
  const og = c.createGain()
  osc.connect(og); og.connect(c.destination)
  osc.type = 'triangle'
  osc.frequency.value = 500
  og.gain.setValueAtTime(vol * 0.3, now)
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
  osc.start(now); osc.stop(now + 0.21)
}

function playTom(freq: number, vol: number): void {
  const c = ctx(), now = c.currentTime
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.connect(g); g.connect(c.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, now)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.2)
  g.gain.setValueAtTime(vol, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
  osc.start(now); osc.stop(now + 0.26)
  // Attack noise
  const dur = 0.04
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const n = c.createBufferSource()
  n.buffer = buf
  const ng = c.createGain()
  ng.gain.setValueAtTime(vol * 0.3, now)
  ng.gain.exponentialRampToValueAtTime(0.001, now + dur)
  n.connect(ng); ng.connect(c.destination)
  n.start(now); n.stop(now + dur)
}

export function playTom1Sound(vol = 0.45): void { playTom(260, vol) }
export function playTom2Sound(vol = 0.45): void { playTom(200, vol) }
export function playFloorTomSound(vol = 0.5): void { playTom(130, vol) }

// ── DrumPad → sound mapping ─────────────────────────────────────────────────

const PAD_SOUND: Record<string, (vol: number) => void> = {
  [DrumPad.Kick]: playKickSound,
  [DrumPad.Snare]: playSnareSound,
  [DrumPad.SnareRim]: (v) => playSnareSound(v * 0.6),
  [DrumPad.HiHatClosed]: playHiHatClosedSound,
  [DrumPad.HiHatOpen]: playHiHatOpenSound,
  [DrumPad.HiHatPedal]: playHiHatPedalSound,
  [DrumPad.CrashCymbal]: playCrashSound,
  [DrumPad.RideCymbal]: playRideSound,
  [DrumPad.RideBell]: (v) => playRideSound(v * 1.2),
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
}

/**
 * Play a PatternData with correct sounds at the given BPM.
 * Calls onStep(slotIndex) for each subdivision to drive visual highlighting.
 * Calls onFinish() when done.
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

  const { beats, subdivisions, tracks } = pattern
  const totalSlots = beats * subdivisions
  const msPerSlot = (60000 / bpm) / subdivisions
  const totalSteps = totalSlots * bars

  for (let step = 0; step < totalSteps; step++) {
    const delay = step * msPerSlot
    const slotIdx = step % totalSlots

    _playbackTimers.push(setTimeout(() => {
      if (!_isPlaying) return
      _stepCallback?.(slotIdx)

      // Play all notes at this slot
      for (const [pad, values] of Object.entries(tracks) as [DrumPad, HitValue[]][]) {
        const hv = values[slotIdx]
        if (hv > 0) playPadSound(pad, hv)
      }
    }, delay))
  }

  // Finish callback
  _playbackTimers.push(setTimeout(() => {
    if (!_isPlaying) return
    _isPlaying = false
    _stepCallback = null
    onFinish?.()
  }, totalSteps * msPerSlot + 50))
}
