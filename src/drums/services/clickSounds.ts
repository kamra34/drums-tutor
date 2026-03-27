/**
 * Lightweight sound utility for visual components.
 * Click sounds remain synthesized (they're metronome ticks, not drums).
 * Drum sounds delegate to the sample-based drumSounds service.
 */

import { playSnareSound, playKickSound, playHiHatClosedSound, loadDrumSamples } from './drumSounds'

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

/** Snare hit — real sample */
export function playSnare(volume = 0.5): void {
  loadDrumSamples()
  playSnareSound(volume)
}

/** Kick drum — real sample */
export function playKick(volume = 0.6): void {
  loadDrumSamples()
  playKickSound(volume)
}

/** Hi-hat closed — real sample */
export function playHiHat(volume = 0.3): void {
  loadDrumSamples()
  playHiHatClosedSound(volume)
}
