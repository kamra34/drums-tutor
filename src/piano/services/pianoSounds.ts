// ── Real Piano Sample Playback ───────────────────────────────────────────────
// Uses Salamander Grand Piano samples (CC BY 3.0) via midi-js-soundfonts

const audioCtxRef = { current: null as AudioContext | null }
function getAudioCtx(): AudioContext {
  if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
  return audioCtxRef.current
}

// Cache decoded audio buffers
const bufferCache = new Map<string, AudioBuffer>()
const loadingPromises = new Map<string, Promise<AudioBuffer | null>>()

// Map note names to file names
// Our files use: C3, Db3, D3, Eb3, E3, F3, Gb3, G3, Ab3, A3, Bb3, B3, ...
function noteToFileName(note: string): string | null {
  const match = note.match(/^([A-G])(#|b)?(\d)$/)
  if (!match) return null

  const letter = match[1]
  const accidental = match[2] || ''
  const octave = match[3]

  // Convert sharps to flats for file names
  const SHARP_TO_FLAT: Record<string, string> = {
    'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
  }

  if (accidental === '#') {
    const flat = SHARP_TO_FLAT[`${letter}#`]
    if (!flat) return null
    return `${flat}${octave}`
  }
  if (accidental === 'b') {
    return `${letter}b${octave}`
  }
  return `${letter}${octave}`
}

async function loadSample(note: string): Promise<AudioBuffer | null> {
  const fileName = noteToFileName(note)
  if (!fileName) return null

  // Check cache
  if (bufferCache.has(fileName)) return bufferCache.get(fileName)!

  // Check if already loading
  if (loadingPromises.has(fileName)) return loadingPromises.get(fileName)!

  const promise = (async () => {
    try {
      const ctx = getAudioCtx()
      const response = await fetch(`/audio/piano/${fileName}.mp3`)
      if (!response.ok) return null
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      bufferCache.set(fileName, audioBuffer)
      return audioBuffer
    } catch {
      return null
    }
  })()

  loadingPromises.set(fileName, promise)
  return promise
}

/**
 * Play a piano note using real samples.
 * @param note - e.g. "C4", "F#3"
 * @param velocity - volume 0-1
 * @param duration - optional duration in seconds; note fades out at this time
 */
export async function playPianoNote(note: string, velocity: number = 0.7, duration?: number): Promise<void> {
  const ctx = getAudioCtx()
  if (ctx.state === 'suspended') await ctx.resume()

  const buffer = await loadSample(note)

  if (buffer) {
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    source.buffer = buffer
    gain.gain.setValueAtTime(velocity, ctx.currentTime)
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
    if (duration != null) {
      const fadeStart = ctx.currentTime + Math.max(0, duration - 0.15)
      gain.gain.setValueAtTime(velocity, fadeStart)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      source.stop(ctx.currentTime + duration + 0.05)
    }
  } else {
    playFallbackNote(note, velocity, duration)
  }
}

/**
 * Preload samples for a range of notes (call on component mount for instant playback).
 */
export function preloadSamples(notes: string[]): void {
  for (const note of notes) {
    loadSample(note)
  }
}

/**
 * Preload all samples for a given octave range.
 */
export function preloadOctaves(startOctave: number, count: number): void {
  const noteNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  const notes: string[] = []
  for (let oct = startOctave; oct < startOctave + count; oct++) {
    for (const n of noteNames) {
      notes.push(`${n}${oct}`)
    }
  }
  notes.push(`C${startOctave + count}`) // top C
  preloadSamples(notes)
}

// ── Fallback synthesis ───────────────────────────────────────────────────────

function noteToFreq(note: string): number {
  const NOTES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  const match = note.match(/^([A-G])(#|b)?(\d)$/)
  if (!match) return 440
  let semitone = NOTES[match[1]]
  if (match[2] === '#') semitone++
  if (match[2] === 'b') semitone--
  const octave = parseInt(match[3])
  return 440 * Math.pow(2, (semitone - 9 + (octave - 4) * 12) / 12)
}

function playFallbackNote(note: string, velocity: number, duration?: number) {
  const ctx = getAudioCtx()
  const freq = noteToFreq(note)
  const dur = duration ?? 1.5

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(velocity * 0.3, ctx.currentTime)
  gain.gain.setValueAtTime(velocity * 0.3, ctx.currentTime + Math.max(0, dur - 0.15))
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + dur + 0.05)
}
