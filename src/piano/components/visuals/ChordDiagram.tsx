import { useState, useEffect } from 'react'
import { playPianoNote, preloadSamples } from '@piano/services/pianoSounds'

// ── Data ─────────────────────────────────────────────────────────────────────

interface ChordDef {
  name: string
  symbol: string
  notes: string[]        // e.g. ["C4","E4","G4"]
  fingers: number[]      // finger per note
  type: string           // "major" | "minor" | "dominant7"
  description: string
}

const CHORDS: ChordDef[] = [
  { name: 'C Major', symbol: 'C', notes: ['C4', 'E4', 'G4'], fingers: [1, 3, 5], type: 'major', description: 'The most fundamental chord. Bright, stable, resolved. Built on the 1st, 3rd, and 5th notes of the C major scale.' },
  { name: 'F Major', symbol: 'F', notes: ['F3', 'A3', 'C4'], fingers: [1, 3, 5], type: 'major', description: 'The IV chord in C major. Creates a feeling of departure — wants to move somewhere.' },
  { name: 'G Major', symbol: 'G', notes: ['G3', 'B3', 'D4'], fingers: [1, 3, 5], type: 'major', description: 'The V chord in C major. Creates tension that pulls back to C.' },
  { name: 'G7', symbol: 'G7', notes: ['G3', 'B3', 'D4', 'F4'], fingers: [1, 2, 3, 5], type: 'dominant7', description: 'G with an added 7th (F). The strongest pull back to C major — the classic "resolution" sound.' },
  { name: 'A Minor', symbol: 'Am', notes: ['A3', 'C4', 'E4'], fingers: [1, 3, 5], type: 'minor', description: 'The relative minor of C major. Same notes, different root — sounds darker, more emotional.' },
  { name: 'D Minor', symbol: 'Dm', notes: ['D4', 'F4', 'A4'], fingers: [1, 3, 5], type: 'minor', description: 'The ii chord in C major. Often precedes G7 in the classic ii-V-I progression.' },
  { name: 'E Minor', symbol: 'Em', notes: ['E4', 'G4', 'B4'], fingers: [1, 3, 5], type: 'minor', description: 'The iii chord in C major. Has a gentle, contemplative quality.' },
]

// ── Keyboard helpers ─────────────────────────────────────────────────────────

const WHITE_W = 32
const WHITE_H = 100
const BLACK_W = 20
const BLACK_H = 62
const GAP = 1
const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const BLACK_OFFSETS: Record<string, number> = { C: 0.65, D: 0.65, F: 0.65, G: 0.65, A: 0.65 }

interface KeyDef { note: string; x: number; isBlack: boolean }

function buildKeys(startOctave: number, octaves: number): KeyDef[] {
  const keys: KeyDef[] = []
  let x = 0
  for (let oct = startOctave; oct < startOctave + octaves; oct++) {
    for (const wn of WHITE_NOTES) {
      keys.push({ note: `${wn}${oct}`, x, isBlack: false })
      if (BLACK_OFFSETS[wn] !== undefined) {
        keys.push({ note: `${wn}#${oct}`, x: x + WHITE_W * BLACK_OFFSETS[wn], isBlack: true })
      }
      x += WHITE_W + GAP
    }
  }
  keys.push({ note: `C${startOctave + octaves}`, x, isBlack: false })
  return keys
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ChordDiagram() {
  const [selected, setSelected] = useState<ChordDef>(CHORDS[0])
  const [playingNotes, setPlayingNotes] = useState<Set<string>>(new Set())

  const accent = '#a78bfa'

  useEffect(() => {
    const allNotes = CHORDS.flatMap((c) => c.notes)
    preloadSamples([...new Set(allNotes)])
  }, [])

  function handlePlayChord(chord: ChordDef) {
    setSelected(chord)
    setPlayingNotes(new Set(chord.notes))

    // Play all notes simultaneously with slight spread for realism
    chord.notes.forEach((note, i) => {
      setTimeout(() => playPianoNote(note, 0.55), i * 40)
    })

    setTimeout(() => setPlayingNotes(new Set()), 1200)
  }

  // Determine keyboard range
  const allNotes = selected.notes
  const octaves = [3, 4, 5]
  const minOct = Math.min(...allNotes.map((n) => parseInt(n.slice(-1))))
  const startOct = Math.max(minOct - 1, 3)
  const keys = buildKeys(startOct, 2)
  const whites = keys.filter((k) => !k.isBlack)
  const blacks = keys.filter((k) => k.isBlack)
  const totalW = whites.length * (WHITE_W + GAP) - GAP
  const svgW = totalW + 4
  const svgH = WHITE_H + 28

  const highlightSet = new Set(selected.notes)
  const fingerMap = new Map(selected.notes.map((n, i) => [n, selected.fingers[i]]))

  return (
    <div className="my-6 rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: '#0d1117' }}>
      <div className="px-5 pt-4 pb-2">
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accent }}>
          Chord Diagram
        </span>
      </div>

      {/* Chord selector */}
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {CHORDS.map((c) => {
          const isActive = selected.name === c.name
          const typeColor = c.type === 'major' ? '#a78bfa' : c.type === 'minor' ? '#8b5cf6' : '#c4b5fd'
          return (
            <button
              key={c.name}
              onClick={() => handlePlayChord(c)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
              style={{
                background: isActive ? `${typeColor}20` : '#161b22',
                border: `1px solid ${isActive ? `${typeColor}50` : '#1e2433'}`,
                color: isActive ? typeColor : '#6b7280',
              }}
            >
              {c.symbol}
            </button>
          )
        })}
      </div>

      {/* Keyboard */}
      <div className="px-4 pb-2 overflow-x-auto">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="mx-auto" style={{ maxWidth: `${svgW}px`, width: '100%', height: 'auto' }}>
          <g transform="translate(2, 2)">
            {whites.map((k) => {
              const hl = highlightSet.has(k.note)
              const isPlaying = playingNotes.has(k.note)
              const finger = fingerMap.get(k.note)
              return (
                <g key={k.note}>
                  <rect x={k.x} y={0} width={WHITE_W} height={WHITE_H} rx={3}
                    fill={isPlaying ? accent : hl ? `${accent}30` : '#f0f0f0'}
                    stroke={hl ? accent : '#999'} strokeWidth={hl ? 1.5 : 0.5}
                    style={{ transition: 'fill 0.1s' }}
                  />
                  <text x={k.x + WHITE_W / 2} y={WHITE_H - 6} textAnchor="middle"
                    fill={hl ? accent : '#aaa'} fontSize={8} fontWeight={hl ? 700 : 400} fontFamily="system-ui">
                    {k.note}
                  </text>
                  {hl && (
                    <circle cx={k.x + WHITE_W / 2} cy={WHITE_H - 22} r={5} fill={accent} opacity={0.9} />
                  )}
                  {finger != null && (
                    <text x={k.x + WHITE_W / 2} y={WHITE_H + 15} textAnchor="middle"
                      fill={accent} fontSize={12} fontWeight={700} fontFamily="system-ui">
                      {finger}
                    </text>
                  )}
                </g>
              )
            })}
            {blacks.map((k) => {
              const hl = highlightSet.has(k.note)
              const isPlaying = playingNotes.has(k.note)
              return (
                <g key={k.note}>
                  <rect x={k.x} y={0} width={BLACK_W} height={BLACK_H} rx={2}
                    fill={isPlaying ? accent : hl ? `${accent}cc` : '#1a1a1a'}
                    stroke={hl ? accent : '#000'} strokeWidth={hl ? 1.5 : 0.5}
                    style={{ transition: 'fill 0.1s' }}
                  />
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {/* Chord info */}
      <div className="mx-5 mb-4 px-4 py-3 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-bold" style={{ color: accent }}>{selected.symbol}</span>
          <span className="text-sm font-semibold text-white">{selected.name}</span>
          <span className="ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded"
            style={{
              background: selected.type === 'major' ? 'rgba(167,139,250,0.15)' : selected.type === 'minor' ? 'rgba(139,92,246,0.15)' : 'rgba(196,181,253,0.15)',
              color: selected.type === 'major' ? '#a78bfa' : selected.type === 'minor' ? '#8b5cf6' : '#c4b5fd',
            }}>
            {selected.type}
          </span>
        </div>
        <p className="text-xs text-[#94a3b8] leading-relaxed">{selected.description}</p>
        <div className="mt-2 text-[11px] text-[#6b7280]">
          Notes: <span className="text-[#94a3b8] font-mono">{selected.notes.join(' — ')}</span>
          {' | '}Fingers: <span className="text-[#94a3b8] font-mono">{selected.fingers.join('-')}</span>
        </div>
      </div>
    </div>
  )
}
