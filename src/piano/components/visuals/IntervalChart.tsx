import { useState, useEffect } from 'react'
import { playPianoNote, preloadSamples } from '@piano/services/pianoSounds'

// ── Data ─────────────────────────────────────────────────────────────────────

interface IntervalDef {
  name: string
  shortName: string
  semitones: number
  example: [string, string]  // [lower, upper] note
  quality: string
  description: string
  color: string
}

const INTERVALS: IntervalDef[] = [
  { name: 'Half Step', shortName: 'm2', semitones: 1, example: ['C4', 'Db4'], quality: 'minor 2nd', description: 'The smallest interval — one key to the very next (including black keys). Sounds tense, dissonant. Think "Jaws" theme.', color: '#ef4444' },
  { name: 'Whole Step', shortName: 'M2', semitones: 2, example: ['C4', 'D4'], quality: 'major 2nd', description: 'Two half steps. Skip one key. The building block of major scales. Think the first two notes of a major scale.', color: '#f97316' },
  { name: 'Minor 3rd', shortName: 'm3', semitones: 3, example: ['C4', 'Eb4'], quality: 'minor 3rd', description: 'Defines minor chords — sounds darker, sadder. Three half steps up. Think "Greensleeves" opening.', color: '#eab308' },
  { name: 'Major 3rd', shortName: 'M3', semitones: 4, example: ['C4', 'E4'], quality: 'major 3rd', description: 'Defines major chords — sounds bright, happy. Four half steps up. Think "Oh When the Saints."', color: '#22c55e' },
  { name: 'Perfect 4th', shortName: 'P4', semitones: 5, example: ['C4', 'F4'], quality: 'perfect 4th', description: 'Strong, open sound. Five half steps. Think "Here Comes the Bride."', color: '#06b6d4' },
  { name: 'Tritone', shortName: 'TT', semitones: 6, example: ['C4', 'Gb4'], quality: 'augmented 4th', description: 'The "devil\'s interval" — maximally unstable. Exactly half an octave. Think "The Simpsons" theme.', color: '#8b5cf6' },
  { name: 'Perfect 5th', shortName: 'P5', semitones: 7, example: ['C4', 'G4'], quality: 'perfect 5th', description: 'The most stable interval after the octave. Seven half steps. Think "Star Wars" opening.', color: '#a78bfa' },
  { name: 'Octave', shortName: 'P8', semitones: 12, example: ['C4', 'C5'], quality: 'perfect 8th', description: 'Same note, one register higher. Twelve half steps. Sounds like the "same note" — the most consonant interval.', color: '#c4b5fd' },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function IntervalChart() {
  const [selected, setSelected] = useState<IntervalDef | null>(null)
  const [playing, setPlaying] = useState(false)

  const accent = '#a78bfa'

  useEffect(() => {
    const notes = INTERVALS.flatMap((i) => i.example)
    preloadSamples([...new Set(notes)])
  }, [])

  function handlePlay(interval: IntervalDef) {
    if (playing) return
    setSelected(interval)
    setPlaying(true)

    // Play lower note
    playPianoNote(interval.example[0], 0.6)
    // Play upper note after a short delay
    setTimeout(() => playPianoNote(interval.example[1], 0.6), 500)
    // Then play both together
    setTimeout(() => {
      playPianoNote(interval.example[0], 0.5)
      playPianoNote(interval.example[1], 0.5)
      setPlaying(false)
    }, 1200)
  }

  return (
    <div className="my-6 rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: '#0d1117' }}>
      <div className="px-5 pt-4 pb-2">
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accent }}>
          Intervals — The Distance Between Notes
        </span>
      </div>

      <div className="px-5 pb-4">
        {/* Visual half-step ruler */}
        <div className="mb-4">
          <div className="flex gap-0.5 mb-1">
            {Array.from({ length: 12 }).map((_, i) => {
              const matchedInterval = selected && i + 1 === selected.semitones
              return (
                <div
                  key={i}
                  className="h-3 flex-1 rounded-sm transition-colors"
                  style={{
                    background: selected && i < selected.semitones
                      ? selected.color
                      : '#1e2433',
                    opacity: matchedInterval ? 1 : selected && i < selected.semitones ? 0.6 : 1,
                  }}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-[9px] text-[#4b5563]">
            <span>0 (unison)</span>
            <span>12 (octave)</span>
          </div>
        </div>

        {/* Interval buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
          {INTERVALS.map((interval) => {
            const isActive = selected?.name === interval.name
            return (
              <button
                key={interval.name}
                onClick={() => handlePlay(interval)}
                disabled={playing}
                className="px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer disabled:opacity-50"
                style={{
                  background: isActive ? `${interval.color}18` : '#161b22',
                  border: `1px solid ${isActive ? `${interval.color}40` : '#1e2433'}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono" style={{ color: interval.color }}>
                    {interval.shortName}
                  </span>
                  <span className="text-[11px] text-[#94a3b8] truncate">{interval.name}</span>
                </div>
                <div className="text-[10px] text-[#4b5563] mt-0.5">
                  {interval.semitones} half step{interval.semitones > 1 ? 's' : ''}
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="px-4 py-3 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-bold" style={{ color: selected.color }}>{selected.name}</span>
              <span className="text-xs text-[#6b7280]">({selected.quality})</span>
              <span className="ml-auto text-xs font-mono" style={{ color: selected.color }}>
                {selected.example[0]} → {selected.example[1]}
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] leading-relaxed">{selected.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
