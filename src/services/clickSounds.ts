/**
 * Lightweight Web Audio API sound utility for visual components.
 * Plays clicks (accent / normal) and a snare-like hit without Tone.js.
 */

let _ctx: AudioContext | null = null

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

/** High-pitched accent click (beat 1) */
export function playAccentClick(volume = 0.6): void {
  const c = ctx()
  const now = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(c.destination)
  osc.type = 'triangle'
  osc.frequency.value = 1400
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
  osc.start(now)
  osc.stop(now + 0.05)
}

/** Normal beat click */
export function playNormalClick(volume = 0.35): void {
  const c = ctx()
  const now = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(c.destination)
  osc.type = 'triangle'
  osc.frequency.value = 900
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)
  osc.start(now)
  osc.stop(now + 0.04)
}

/** Short, bright snare hit using filtered noise */
export function playSnare(volume = 0.5): void {
  const c = ctx()
  const now = c.currentTime
  const duration = 0.14

  // White noise buffer
  const bufferSize = Math.floor(c.sampleRate * duration)
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5)
  }
  const noise = c.createBufferSource()
  noise.buffer = buffer

  // Bandpass filter to colour the noise
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 2800
  filter.Q.value = 0.8

  const gain = c.createGain()
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  noise.start(now)
  noise.stop(now + duration)

  // Thin body tone under the noise
  const body = c.createOscillator()
  const bodyGain = c.createGain()
  body.connect(bodyGain)
  bodyGain.connect(c.destination)
  body.type = 'sine'
  body.frequency.setValueAtTime(200, now)
  body.frequency.exponentialRampToValueAtTime(80, now + 0.06)
  bodyGain.gain.setValueAtTime(volume * 0.6, now)
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)
  body.start(now)
  body.stop(now + 0.08)
}

/** Kick drum — low thud */
export function playKick(volume = 0.6): void {
  const c = ctx()
  const now = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(c.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, now)
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.12)
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
  osc.start(now)
  osc.stop(now + 0.2)
}

/** Hi-hat closed — short metallic tick */
export function playHiHat(volume = 0.3): void {
  const c = ctx()
  const now = c.currentTime
  const bufferSize = Math.floor(c.sampleRate * 0.05)
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }
  const noise = c.createBufferSource()
  noise.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 7000
  const gain = c.createGain()
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  noise.start(now)
  noise.stop(now + 0.05)
}
