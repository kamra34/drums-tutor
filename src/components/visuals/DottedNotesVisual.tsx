import { useState, useRef, useEffect } from 'react'
import { playAccentClick, playNormalClick, playHiHat } from '../../services/clickSounds'

// ── Dotted note definitions ──────────────────────────────────────────────────

interface DottedNoteDef {
  id: string
  name: string
  normalBeats: number
  dottedBeats: number
  color: string
  description: string
  // Grid representation: 1 cell = one eighth note (at 120 BPM = 250ms)
  // 'note' = note sounds, 'hold' = still ringing, 'next' = next note starts
  normalCells: number    // cells for the undotted version
  dottedCells: number    // cells for the dotted version
}

const DOTTED_NOTES: DottedNoteDef[] = [
  {
    id: 'half',
    name: 'Dotted Half Note',
    normalBeats: 2,
    dottedBeats: 3,
    color: '#2563eb',
    description: 'A half note (2 beats) + dot = 3 beats. Fills an entire bar of 3/4 time.',
    normalCells: 4,  // 2 beats = 4 eighth notes
    dottedCells: 6,  // 3 beats = 6 eighth notes
  },
  {
    id: 'quarter',
    name: 'Dotted Quarter Note',
    normalBeats: 1,
    dottedBeats: 1.5,
    color: '#059669',
    description: 'A quarter note (1 beat) + dot = 1½ beats. Extremely common — creates a syncopated "push" feel.',
    normalCells: 2,  // 1 beat = 2 eighth notes
    dottedCells: 3,  // 1.5 beats = 3 eighth notes
  },
  {
    id: 'eighth',
    name: 'Dotted Eighth Note',
    normalBeats: 0.5,
    dottedBeats: 0.75,
    color: '#d97706',
    description: 'An eighth note (½ beat) + dot = ¾ beat. Usually paired with a sixteenth note (long-short pattern).',
    normalCells: 1,  // 0.5 beat = 1 eighth note
    dottedCells: 1.5, // 0.75 beats
  },
]

// ── Main component ──────────────────────────────────────────────────────────

export default function DottedNotesVisual() {
  const [selected, setSelected] = useState<string>('quarter')
  const [playing, setPlaying] = useState<string | null>(null) // 'normal' or 'dotted'
  const [currentCell, setCurrentCell] = useState(-1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const note = DOTTED_NOTES.find(n => n.id === selected)!

  function playDemo(mode: 'normal' | 'dotted') {
    if (playing) {
      stop()
      return
    }
    setPlaying(mode)
    setCurrentCell(0)

    const eighthMs = 250 // at 120 BPM
    const cells = mode === 'normal' ? note.normalCells : note.dottedCells
    const totalCells = 8 // show a full bar of 4/4 (8 eighth notes)
    let step = 0

    // Play first note
    playAccentClick(0.4)

    intervalRef.current = setInterval(() => {
      step++
      if (step >= totalCells) {
        stop()
        return
      }
      setCurrentCell(step)

      // Play a note at each "note start"
      if (step % cells === 0 && step < totalCells) {
        playNormalClick(0.3)
      } else {
        // Soft tick to show the grid
        playHiHat(0.06)
      }
    }, eighthMs)
  }

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPlaying(null)
    setCurrentCell(-1)
  }

  useEffect(() => () => stop(), [])
  useEffect(() => { stop() }, [selected])

  // Build the visual grid (8 eighth notes = 1 bar of 4/4)
  const totalCells = 8
  const activeCells = playing === 'dotted' ? note.dottedCells : note.normalCells
  const eighthLabels = ['1', '+', '2', '+', '3', '+', '4', '+']

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6 space-y-4">
      <div className="text-xs text-[#4b5563] uppercase tracking-wider">
        Dotted Notes — How a Dot Extends Duration
      </div>

      {/* Selector */}
      <div className="flex gap-2 flex-wrap">
        {DOTTED_NOTES.map(n => (
          <button
            key={n.id}
            onClick={() => setSelected(n.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              selected === n.id
                ? 'border-violet-700 text-violet-300 bg-violet-900/20'
                : 'border-[#2d3748] text-[#6b7280] hover:text-violet-400'
            }`}
          >
            {n.name}
          </button>
        ))}
      </div>

      <p className="text-sm text-[#6b7280]">{note.description}</p>

      {/* The formula */}
      <div className="flex items-center gap-3 justify-center text-center py-2">
        <div className="bg-[#1a1f2e] rounded-lg px-4 py-2 border border-[#2d3748]">
          <div className="text-lg font-bold text-white">{note.normalBeats}</div>
          <div className="text-[10px] text-[#4b5563]">beat{note.normalBeats !== 1 ? 's' : ''}</div>
        </div>
        <div className="text-[#4b5563] text-lg">+</div>
        <div className="bg-[#1a1f2e] rounded-lg px-4 py-2 border border-[#2d3748]">
          <div className="text-lg font-bold" style={{ color: note.color }}>{note.normalBeats / 2}</div>
          <div className="text-[10px] text-[#4b5563]">half (the dot)</div>
        </div>
        <div className="text-[#4b5563] text-lg">=</div>
        <div className="rounded-lg px-4 py-2 border" style={{ backgroundColor: note.color + '22', borderColor: note.color + '55' }}>
          <div className="text-lg font-bold" style={{ color: note.color }}>{note.dottedBeats}</div>
          <div className="text-[10px] text-[#4b5563]">beat{note.dottedBeats !== 1 ? 's' : ''} total</div>
        </div>
      </div>

      {/* Side-by-side comparison grids */}
      <div className="grid grid-cols-2 gap-4">
        {/* Normal */}
        <div>
          <div className="text-xs text-[#4b5563] mb-2 text-center">
            Without dot ({note.normalBeats} beat{note.normalBeats !== 1 ? 's' : ''})
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: totalCells }).map((_, i) => {
              const noteIndex = Math.floor(i / note.normalCells)
              const isNoteStart = i % note.normalCells === 0
              const isActive = playing === 'normal' && currentCell === i
              return (
                <div
                  key={i}
                  className="flex-1 h-8 rounded-sm flex items-center justify-center text-[9px] font-bold transition-all"
                  style={{
                    backgroundColor: isActive ? '#6b7280' : isNoteStart ? '#6b728033' : '#6b728015',
                    color: isNoteStart ? '#94a3b8' : '#374151',
                    boxShadow: isActive ? '0 0 6px #6b728080' : 'none',
                  }}
                >
                  {eighthLabels[i]}
                </div>
              )
            })}
          </div>
          <button
            onClick={() => playDemo('normal')}
            className="w-full mt-2 py-1.5 rounded-lg text-xs border border-[#2d3748] text-[#6b7280] hover:text-white hover:border-violet-700 transition-colors"
          >
            {playing === 'normal' ? '■ Stop' : '▶ Listen'}
          </button>
        </div>

        {/* Dotted */}
        <div>
          <div className="text-xs mb-2 text-center" style={{ color: note.color }}>
            With dot ({note.dottedBeats} beat{note.dottedBeats !== 1 ? 's' : ''})
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: totalCells }).map((_, i) => {
              // For dotted notes, the note start positions are at multiples of dottedCells
              // This gets tricky for fractional cells (dotted eighth = 1.5 cells)
              const isNoteStart = i === 0 || (note.dottedCells >= 1 && i % note.dottedCells === 0)
              const isInNote = (i % note.dottedCells) < note.dottedCells
              const isActive = playing === 'dotted' && currentCell === i
              return (
                <div
                  key={i}
                  className="flex-1 h-8 rounded-sm flex items-center justify-center text-[9px] font-bold transition-all"
                  style={{
                    backgroundColor: isActive
                      ? note.color
                      : isNoteStart
                      ? note.color + '55'
                      : isInNote
                      ? note.color + '22'
                      : note.color + '11',
                    color: isActive ? 'white' : isNoteStart ? '#e2e8f0' : '#4b5563',
                    boxShadow: isActive ? `0 0 6px ${note.color}80` : 'none',
                  }}
                >
                  {eighthLabels[i]}
                </div>
              )
            })}
          </div>
          <button
            onClick={() => playDemo('dotted')}
            className="w-full mt-2 py-1.5 rounded-lg text-xs border transition-colors"
            style={{
              borderColor: note.color + '55',
              color: note.color,
            }}
          >
            {playing === 'dotted' ? '■ Stop' : '▶ Listen (dotted)'}
          </button>
        </div>
      </div>

      {/* Key insight */}
      <div className="bg-violet-900/10 border border-violet-800/30 rounded-lg p-3 text-sm text-[#94a3b8]">
        <strong className="text-violet-300">Rule:</strong> A dot always adds{' '}
        <strong className="text-white">half the note's original value</strong>.
        Quarter (1) + dot = 1½. Half (2) + dot = 3. Eighth (½) + dot = ¾.
      </div>
    </div>
  )
}
