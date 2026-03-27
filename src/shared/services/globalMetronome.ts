/**
 * Global standalone metronome using Web Audio API.
 * Completely independent from the pattern playback engine.
 * Uses a lookahead scheduler for rock-solid timing.
 */

let _ctx: AudioContext | null = null
function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

let _timerId: ReturnType<typeof setInterval> | null = null
let _nextNoteTime = 0
let _currentBeat = 0

// Config — set before starting
let _bpm = 90
let _beatsPerMeasure = 4
let _volume = 0.6
let _accentFirst = true
let _onBeat: ((beat: number) => void) | null = null

const LOOKAHEAD = 25 // ms — how often the scheduler runs
const SCHEDULE_AHEAD = 0.1 // seconds — how far ahead to schedule

function scheduleClick(time: number, accent: boolean) {
  const c = ctx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(c.destination)
  osc.type = accent ? 'triangle' : 'sine'
  osc.frequency.value = accent ? 1200 : 800
  const vol = _volume * (accent ? 0.8 : 0.45)
  gain.gain.setValueAtTime(vol, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
  osc.start(time)
  osc.stop(time + 0.06)
}

function scheduler() {
  const c = ctx()
  while (_nextNoteTime < c.currentTime + SCHEDULE_AHEAD) {
    const accent = _accentFirst && _currentBeat === 0
    scheduleClick(_nextNoteTime, accent)

    // Notify UI on the main thread
    const beat = _currentBeat
    setTimeout(() => _onBeat?.(beat), Math.max(0, (_nextNoteTime - c.currentTime) * 1000))

    const secondsPerBeat = 60.0 / _bpm
    _nextNoteTime += secondsPerBeat
    _currentBeat = (_currentBeat + 1) % _beatsPerMeasure
  }
}

export function startGlobalMetronome(
  bpm: number,
  beatsPerMeasure: number,
  volume: number,
  accentFirst: boolean,
  onBeat: (beat: number) => void,
) {
  stopGlobalMetronome()
  _bpm = bpm
  _beatsPerMeasure = beatsPerMeasure
  _volume = volume
  _accentFirst = accentFirst
  _onBeat = onBeat
  _currentBeat = 0
  _nextNoteTime = ctx().currentTime + 0.05
  _timerId = setInterval(scheduler, LOOKAHEAD)
}

export function stopGlobalMetronome() {
  if (_timerId !== null) {
    clearInterval(_timerId)
    _timerId = null
  }
  _onBeat = null
  _currentBeat = 0
}

export function updateGlobalMetronomeBpm(bpm: number) {
  _bpm = Math.max(30, Math.min(300, bpm))
}

export function updateGlobalMetronomeVolume(vol: number) {
  _volume = Math.max(0, Math.min(1, vol))
}

export function isGlobalMetronomePlaying(): boolean {
  return _timerId !== null
}
