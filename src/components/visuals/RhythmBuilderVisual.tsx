import { useState, useRef, useEffect } from 'react'
import { playSnare, playAccentClick, playNormalClick } from '../../services/clickSounds'

/**
 * RhythmBuilderVisual — Interactive rhythm cell explorer.
 *
 * Shows every possible way to fill one beat in 4/4 time, from simple
 * (quarter note, quarter rest) to complex (sixteenth-note combinations).
 * Each cell is clickable to hear it, and an "animate" mode plays through
 * patterns at tempo to train the ear-eye connection.
 */

// ── Rhythm cell definitions ─────────────────────────────────────────────────

// A "cell" represents what happens in one beat of 4/4 time.
// We use a 4-slot grid (sixteenth notes) to represent all possibilities.
// 1 = note, 0 = rest/continuation, 'T' = start of tied note
// The "shape" describes how the beat looks in notation.

interface RhythmCell {
  id: string
  name: string
  slots: (0 | 1)[]   // 4 sixteenth-note slots: 1 = attack, 0 = rest/hold
  notation: string    // text description of what it looks like
  counting: string    // how to count it
  level: number       // 1-5 difficulty
  category: string
  // Beaming instructions: each entry is [startSlot, endSlot, beamCount]
  // beamCount: 1 = eighth-note beam, 2 = sixteenth-note beam
  beams: [number, number, number][]
  // Counting display: which syllables to show and their state
  // 'hit' = play on this syllable, 'rest' = silent, 'hold' = note sustains (don't show)
  grid: { label: string; state: 'hit' | 'rest' | 'hold' }[]
}

// Beam definitions: [startSlotIndex, endSlotIndex, numberOfBeams]
// Grid: defines what counting syllables to display
//   'hit' = you play here, 'rest' = count silently, 'hold' = note sustains (hidden)
const RHYTHM_CELLS: RhythmCell[] = [
  // ── Level 1: Quarter notes — only "1", no subdivisions ──
  { id: 'q',      name: 'Quarter Note',        slots: [1,0,0,0], notation: 'One filled notehead, stem, no flag. One hit lasting a full beat.',              counting: '1',             level: 1, category: 'Quarter Notes', beams: [],
    grid: [{ label: '1', state: 'hit' }] },
  { id: 'qr',     name: 'Quarter Rest',         slots: [0,0,0,0], notation: 'Zig-zag rest symbol. Silence for a full beat.',                                counting: '(1)',           level: 1, category: 'Quarter Notes', beams: [],
    grid: [{ label: '(1)', state: 'rest' }] },

  // ── Level 2: Eighths — only "1" and "+" ──
  { id: 'ee',     name: 'Two Eighth Notes',     slots: [1,0,1,0], notation: 'Two notes connected by ONE beam. Two equal hits per beat.',                   counting: '1  +',          level: 2, category: 'Eighth Notes', beams: [[0,2,1]],
    grid: [{ label: '1', state: 'hit' }, { label: '+', state: 'hit' }] },
  { id: 'er',     name: 'Eighth + Eighth Rest', slots: [1,0,0,0], notation: 'Eighth note (1 flag on stem) + small "7" rest. Hit then silence.',            counting: '1  (+)',        level: 2, category: 'Eighth Notes', beams: [],
    grid: [{ label: '1', state: 'hit' }, { label: '(+)', state: 'rest' }] },
  { id: 're',     name: 'Eighth Rest + Eighth', slots: [0,0,1,0], notation: 'Eighth rest (small "7") then eighth note (1 flag). Syncopation!',             counting: '(1)  +',       level: 2, category: 'Eighth Notes', beams: [],
    grid: [{ label: '(1)', state: 'rest' }, { label: '+', state: 'hit' }] },

  // ── Level 3: 16ths — all 4 syllables: "1 e + a" ──
  { id: 'ssss',   name: 'Four 16ths',            slots: [1,1,1,1], notation: 'Four notes connected by TWO beams across all four.',                          counting: '1 e + a',       level: 3, category: '16th Notes', beams: [[0,3,1],[0,3,2]],
    grid: [{ label: '1', state: 'hit' }, { label: 'e', state: 'hit' }, { label: '+', state: 'hit' }, { label: 'a', state: 'hit' }] },
  { id: 'ess',    name: 'Eighth + Two 16ths',   slots: [1,0,1,1], notation: 'ONE beam across all three. SECOND beam only on the last two (the 16ths).',    counting: '1   + a',       level: 3, category: '16th Notes', beams: [[0,3,1],[2,3,2]],
    grid: [{ label: '1', state: 'hit' }, { label: 'e', state: 'hold' }, { label: '+', state: 'hit' }, { label: 'a', state: 'hit' }] },
  { id: 'sse',    name: 'Two 16ths + Eighth',   slots: [1,1,1,0], notation: 'ONE beam across all three. SECOND beam only on the first two (the 16ths).',   counting: '1 e +',         level: 3, category: '16th Notes', beams: [[0,2,1],[0,1,2]],
    grid: [{ label: '1', state: 'hit' }, { label: 'e', state: 'hit' }, { label: '+', state: 'hit' }, { label: 'a', state: 'hold' }] },
  { id: 'ses',    name: '16th+8th+16th',        slots: [1,1,0,1], notation: 'ONE beam across all. Partial SECOND beams on the two outer 16ths.',           counting: '1 e   a',       level: 3, category: '16th Notes', beams: [[0,3,1],[0,0,2],[3,3,2]],
    grid: [{ label: '1', state: 'hit' }, { label: 'e', state: 'hit' }, { label: '+', state: 'hold' }, { label: 'a', state: 'hit' }] },

  // ── Level 4: 16th rests — all 4 syllables with some rested ──
  { id: 'rss',    name: '16th Rest + Three',    slots: [0,1,1,1], notation: '16th rest then three 16ths with TWO beams.',                                counting: '(1) e + a',     level: 4, category: '16th Rests', beams: [[1,3,1],[1,3,2]],
    grid: [{ label: '(1)', state: 'rest' }, { label: 'e', state: 'hit' }, { label: '+', state: 'hit' }, { label: 'a', state: 'hit' }] },
  { id: 'srs',    name: '16th + Rest + Two',    slots: [1,0,1,1], notation: '16th (with double flag), rest, then two beamed 16ths.',                      counting: '1   + a',       level: 4, category: '16th Rests', beams: [[2,3,1],[2,3,2]],
    grid: [{ label: '1', state: 'hit' }, { label: '(e)', state: 'rest' }, { label: '+', state: 'hit' }, { label: 'a', state: 'hit' }] },
  { id: 'ssr',    name: 'Three + 16th Rest',    slots: [1,1,1,0], notation: 'Three 16ths with TWO beams, then 16th rest.',                                counting: '1 e + (a)',     level: 4, category: '16th Rests', beams: [[0,2,1],[0,2,2]],
    grid: [{ label: '1', state: 'hit' }, { label: 'e', state: 'hit' }, { label: '+', state: 'hit' }, { label: '(a)', state: 'rest' }] },
  { id: 'srsr',   name: 'Alternating',          slots: [1,0,1,0], notation: 'Two eighths — same look as "ee". ONE beam.',                                  counting: '1   +',         level: 4, category: '16th Rests', beams: [[0,2,1]],
    grid: [{ label: '1', state: 'hit' }, { label: '+', state: 'hit' }] },
  { id: 'rsrs',   name: 'Offbeat Alternating',  slots: [0,1,0,1], notation: 'Two sixteenths on "e" and "a" — each with a flag (not beamed).',              counting: '  e   a',       level: 4, category: '16th Rests', beams: [],
    grid: [{ label: '(1)', state: 'rest' }, { label: 'e', state: 'hit' }, { label: '(+)', state: 'rest' }, { label: 'a', state: 'hit' }] },

  // ── Level 5: Dotted and triplets ──
  { id: 'dq',     name: 'Dotted Quarter',       slots: [1,0,0,0], notation: 'Filled note with a dot beside it — 1½ beats. No flag, no beam.',              counting: '1 (+)',         level: 5, category: 'Dotted & Triplets', beams: [],
    grid: [{ label: '1', state: 'hit' }, { label: '(+)', state: 'hold' }] },
  { id: 'de-s',   name: 'Dotted 8th + 16th',   slots: [1,0,0,1], notation: 'ONE beam across both. Short SECOND beam only on the last note (the 16th).',   counting: '1     a',       level: 5, category: 'Dotted & Triplets', beams: [[0,3,1],[3,3,2]],
    grid: [{ label: '1', state: 'hit' }, { label: 'e', state: 'hold' }, { label: '+', state: 'hold' }, { label: 'a', state: 'hit' }] },
  { id: 's-de',   name: '16th + Dotted 8th',    slots: [1,1,0,0], notation: 'ONE beam across both. Short SECOND beam only on the first note (the 16th).',  counting: '1 e',           level: 5, category: 'Dotted & Triplets', beams: [[0,1,1],[0,0,2]],
    grid: [{ label: '1', state: 'hit' }, { label: 'e', state: 'hit' }, { label: '+', state: 'hold' }, { label: 'a', state: 'hold' }] },
  { id: 'trip',   name: 'Eighth-Note Triplet',  slots: [1,1,1,0], notation: 'Three notes with ONE beam and a "3" bracket. NOT sixteenths — 3 equal parts!', counting: '1 trip let',   level: 5, category: 'Dotted & Triplets', beams: [],
    grid: [{ label: '1', state: 'hit' }, { label: 'trip', state: 'hit' }, { label: 'let', state: 'hit' }] },
]

// Group by category
const CATEGORIES = [...new Set(RHYTHM_CELLS.map(c => c.category))]

// ── Sound playback ──────────────────────────────────────────────────────────

function playCellOnce(cell: RhythmCell, bpm: number, onStep?: (i: number) => void): ReturnType<typeof setTimeout>[] {
  const beatMs = 60000 / bpm
  const gridLen = cell.grid.length
  const stepMs = beatMs / gridLen
  const timers: ReturnType<typeof setTimeout>[] = []

  // Map grid index to slot index (for SVG highlight position + sound lookup)
  const gridToSlot = (gi: number) => {
    if (gridLen === 1) return 0           // quarter: slot 0
    if (gridLen === 2) return gi * 2      // eighth: slots 0, 2
    return gi                             // 16th/triplet: slots 0,1,2,(3)
  }

  cell.grid.forEach((g, gi) => {
    const slotIdx = gridToSlot(gi)
    timers.push(setTimeout(() => {
      onStep?.(slotIdx)
      // Always play beat notifier on the downbeat
      if (gi === 0) playAccentClick(0.4)
      // Play snare on every attack
      if (cell.slots[slotIdx] === 1) playSnare(0.4)
    }, gi * stepMs))
  })

  // Clear highlight after
  timers.push(setTimeout(() => onStep?.(-1), gridLen * stepMs))

  return timers
}

// ── SVG for one rhythm cell ─────────────────────────────────────────────────

function CellNotation({ cell, highlight = -1, size = 'normal' }: { cell: RhythmCell; highlight?: number; size?: 'normal' | 'large' }) {
  const w = size === 'large' ? 120 : 80
  const h = size === 'large' ? 50 : 36
  const noteW = w / 4
  const staffY = h * 0.6
  const noteY = staffY - 2
  const stemH = size === 'large' ? 18 : 14
  const noteR = size === 'large' ? 5 : 3.5

  const attacks = cell.slots.map((s, i) => s === 1 ? i : -1).filter(i => i >= 0)
  const isTriplet = cell.id === 'trip'

  // Collect all slots that participate in any beam (for stem drawing)
  const beamedSlots = new Set<number>()
  for (const [s, e] of cell.beams) {
    for (let i = s; i <= e; i++) { if (cell.slots[i] === 1) beamedSlots.add(i) }
  }
  // Triplet notes are also beamed
  if (isTriplet) attacks.forEach(i => beamedSlots.add(i))

  const beamY = noteY - stemH

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Staff line */}
      <line x1={2} y1={staffY} x2={w - 2} y2={staffY} stroke="#2d3748" strokeWidth={0.8} />

      {/* Highlight backgrounds */}
      {[0,1,2,3].map(i => {
        const isHl = highlight === i
        return isHl ? <rect key={i} x={i * noteW + 1} y={0} width={noteW - 2} height={h} fill="#7c3aed" opacity={0.15} rx={3} /> : null
      })}

      {/* Stems for beamed notes */}
      {attacks.filter(i => beamedSlots.has(i)).map(i => {
        const x = i * noteW + noteW / 2 + noteR
        return <line key={`stem-${i}`} x1={x} y1={noteY} x2={x} y2={beamY} stroke="#c8d0d8" strokeWidth={1} />
      })}

      {/* Beams from explicit definitions */}
      {cell.beams.map(([s, e, count], bi) => {
        // For beam count 1: draw at beamY. For beam count 2: draw at beamY+4 (the second beam line)
        const bLineY = count === 2 ? beamY + 4 : beamY
        // Find actual note positions for start and end
        const sx = s * noteW + noteW / 2 + noteR
        const ex = e * noteW + noteW / 2 + noteR
        // If start===end, it's a partial beam (flag-like stub)
        const stubLen = size === 'large' ? 8 : 5
        const x1 = sx
        const x2 = s === e ? sx + stubLen : ex
        return <line key={`beam-${bi}`} x1={x1} y1={bLineY} x2={x2} y2={bLineY} stroke="#c8d0d8" strokeWidth={2.5} strokeLinecap="round" />
      })}

      {/* Triplet: one beam + bracket with "3" */}
      {isTriplet && attacks.length >= 2 && (() => {
        const x1 = attacks[0] * noteW + noteW / 2 + noteR
        const x2 = attacks[attacks.length - 1] * noteW + noteW / 2 + noteR
        return <g>
          <line x1={x1} y1={beamY} x2={x2} y2={beamY} stroke="#c8d0d8" strokeWidth={2.5} strokeLinecap="round" />
          <text x={(x1 + x2) / 2} y={beamY - 5} textAnchor="middle" fill="#d97706" fontSize={size === 'large' ? 11 : 8} fontWeight="bold" fontFamily="system-ui">3</text>
        </g>
      })()}

      {/* Noteheads */}
      {cell.slots.map((slot, i) => {
        const x = i * noteW + noteW / 2
        const isHl = highlight === i
        const col = isHl ? '#e0d4ff' : slot ? '#d1d8e0' : '#4b5563'

        if (slot === 1) {
          return (
            <g key={i}>
              <ellipse cx={x} cy={noteY} rx={noteR + 1} ry={noteR} fill={col} transform={`rotate(-12 ${x} ${noteY})`} />
              {/* Solo stem + flag for unbeamed single notes */}
              {!beamedSlots.has(i) && (() => {
                const stemX = x + noteR
                // Determine flag count: level 2 = eighth (1 flag), level 3-4 = 16th (2 flags)
                const flagCount = cell.level >= 3 && cell.level <= 4 ? 2 : cell.level === 2 ? 1 : 0
                return (
                  <g>
                    <line x1={stemX} y1={noteY} x2={stemX} y2={noteY - stemH} stroke={col} strokeWidth={1} />
                    {flagCount >= 1 && (
                      <path d={`M ${stemX} ${noteY - stemH} C ${stemX + 8} ${noteY - stemH + 3} ${stemX + 7} ${noteY - stemH + 10} ${stemX + 1} ${noteY - stemH + 14}`}
                        fill="none" stroke={col} strokeWidth={1.2} strokeLinecap="round" />
                    )}
                    {flagCount >= 2 && (
                      <path d={`M ${stemX} ${noteY - stemH + 5} C ${stemX + 8} ${noteY - stemH + 8} ${stemX + 7} ${noteY - stemH + 15} ${stemX + 1} ${noteY - stemH + 19}`}
                        fill="none" stroke={col} strokeWidth={1.2} strokeLinecap="round" />
                    )}
                  </g>
                )
              })()}
            </g>
          )
        } else if (cell.slots.every(s => s === 0)) {
          if (i === 0) {
            return (
              <path key={i}
                d={`M ${w/2 + 2} ${noteY - 8} L ${w/2 - 2} ${noteY - 4} L ${w/2 + 2} ${noteY} L ${w/2 - 2} ${noteY + 4} Q ${w/2 + 3} ${noteY + 7} ${w/2} ${noteY + 9}`}
                fill="none" stroke="#6b7280" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
              />
            )
          }
          return null
        }
        return null
      })}

      {/* Counting text below */}
      <text x={w / 2} y={h - 2} textAnchor="middle" fill="#4b5a6a" fontSize={size === 'large' ? 9 : 7} fontFamily="system-ui">
        {cell.counting}
      </text>
    </svg>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function RhythmBuilderVisual() {
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0])
  const [selectedCell, setSelectedCell] = useState<RhythmCell | null>(null)
  const [highlight, setHighlight] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [bpm, setBpm] = useState(80)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const filtered = RHYTHM_CELLS.filter(c => c.category === selectedCat)

  function playCell(cell: RhythmCell) {
    stopPlay()
    setSelectedCell(cell)
    setPlaying(true)
    timersRef.current = playCellOnce(cell, bpm, (i) => setHighlight(i))
    // Play twice
    const beatMs = 60000 / bpm
    const secondTimers = playCellOnce(cell, bpm, (i) => setHighlight(i)).map(t => {
      // Offset by one beat
      clearTimeout(t)
      return setTimeout(() => {}, 0) // placeholder
    })
    // Actually schedule second play
    setTimeout(() => {
      timersRef.current.push(...playCellOnce(cell, bpm, (i) => {
        setHighlight(i)
        if (i === -1) setPlaying(false)
      }))
    }, beatMs)
  }

  function stopPlay() {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    setPlaying(false)
    setHighlight(-1)
  }

  useEffect(() => () => stopPlay(), [])

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6 space-y-4">
      <div className="text-xs text-[#4b5563] uppercase tracking-wider">
        Rhythm Cell Explorer — Every Way to Fill One Beat
      </div>

      <p className="text-sm text-[#6b7280]">
        Each box below shows one possible rhythm for <strong className="text-white">a single beat</strong> in 4/4 time.
        Click any cell to <strong className="text-white">hear</strong> it and see the counting.
        Master these cells and you can read any rhythm!
      </p>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => { setSelectedCat(cat); setSelectedCell(null) }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              selectedCat === cat
                ? 'border-violet-700 text-violet-300 bg-violet-900/20'
                : 'border-[#2d3748] text-[#6b7280] hover:text-violet-400'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Rhythm cell grid */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map(cell => {
          const isSelected = selectedCell?.id === cell.id
          return (
            <button key={cell.id} onClick={() => playCell(cell)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-violet-600 bg-[#13101e]'
                  : 'border-[#1e2433] bg-[#0a0e16] hover:border-[#2d3748]'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-white font-medium">{cell.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1e2433] text-[#4b5563]">Lvl {cell.level}</span>
              </div>
              <div className="flex justify-center">
                <CellNotation cell={cell} highlight={isSelected ? highlight : -1} size="normal" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected cell detail */}
      {selectedCell && (
        <div className="border border-[#1e2433] bg-[#0a0e16] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">{selectedCell.name}</h3>
            <div className="flex items-center gap-2 text-xs">
              <button onClick={() => setBpm(b => Math.max(40, b - 10))} className="w-6 h-6 rounded bg-[#1e2433] text-[#94a3b8] hover:text-white flex items-center justify-center">−</button>
              <span className="font-mono text-white w-8 text-center">{bpm}</span>
              <button onClick={() => setBpm(b => Math.min(160, b + 10))} className="w-6 h-6 rounded bg-[#1e2433] text-[#94a3b8] hover:text-white flex items-center justify-center">+</button>
              <span className="text-[#4b5a6a]">BPM</span>
            </div>
          </div>

          <div className="flex justify-center py-2">
            <CellNotation cell={selectedCell} highlight={highlight} size="large" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[10px] text-[#4b5563] uppercase tracking-wider mb-1">What it looks like</div>
              <p className="text-[#94a3b8]">{selectedCell.notation}</p>
            </div>
            <div>
              <div className="text-[10px] text-[#4b5563] uppercase tracking-wider mb-1">How to count it</div>
              <div className="flex gap-1 font-mono">
                {selectedCell.grid.map((g, i) => (
                  <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${
                    g.state === 'hit'
                      ? 'bg-violet-900/40 text-violet-300 border border-violet-700/50'
                      : g.state === 'rest'
                      ? 'bg-red-900/20 text-red-400/60 border border-red-800/30'
                      : 'bg-[#1e2433] text-[#374151] border border-[#1e2433]'
                  }`}>
                    {g.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button onClick={() => playCell(selectedCell)}
            className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
              playing ? 'bg-red-700/60 text-red-200' : 'bg-violet-600 text-white hover:bg-violet-500'
            }`}>
            {playing ? '♪ Playing...' : '▶ Play Again'}
          </button>
        </div>
      )}

      {/* Key insight */}
      <div className="bg-violet-900/10 border border-violet-800/30 rounded-lg p-3 text-sm text-[#94a3b8]">
        <strong className="text-violet-300">The secret:</strong> Every bar of music is just{' '}
        <strong className="text-white">4 of these cells in a row</strong> (in 4/4 time).
        Once you can instantly recognise each cell, reading any rhythm becomes like reading words instead of individual letters.
      </div>
    </div>
  )
}
