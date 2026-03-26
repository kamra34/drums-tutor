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
}

const RHYTHM_CELLS: RhythmCell[] = [
  // ── Level 1: Single notes ──
  { id: 'q',      name: 'Quarter Note',        slots: [1,0,0,0], notation: 'One filled notehead, stem, no flag',              counting: '1',             level: 1, category: 'Quarter Notes' },
  { id: 'qr',     name: 'Quarter Rest',         slots: [0,0,0,0], notation: 'Zig-zag rest symbol',                             counting: '(1)',           level: 1, category: 'Quarter Notes' },

  // ── Level 2: Eighth note pairs ──
  { id: 'ee',     name: 'Two Eighth Notes',     slots: [1,0,1,0], notation: 'Two notes connected by ONE beam',                counting: '1  +',          level: 2, category: 'Eighth Notes' },
  { id: 'er',     name: 'Eighth + Eighth Rest', slots: [1,0,0,0], notation: 'Eighth note (1 flag) + small "7" rest',          counting: '1  (+)',        level: 2, category: 'Eighth Notes' },
  { id: 're',     name: 'Eighth Rest + Eighth', slots: [0,0,1,0], notation: 'Eighth rest + eighth note',                       counting: '(1)  +',       level: 2, category: 'Eighth Notes' },

  // ── Level 3: Sixteenth note groups ──
  { id: 'ssss',   name: 'Four Sixteenths',      slots: [1,1,1,1], notation: 'Four notes connected by TWO beams',              counting: '1 e + a',       level: 3, category: 'Sixteenth Notes' },
  { id: 'ess',    name: 'Eighth + Two 16ths',   slots: [1,0,1,1], notation: 'Eighth + two sixteenths (1 beam then 2 beams)',  counting: '1   + a',       level: 3, category: 'Sixteenth Notes' },
  { id: 'sse',    name: 'Two 16ths + Eighth',   slots: [1,1,1,0], notation: 'Two sixteenths + eighth (2 beams then 1 beam)',  counting: '1 e +',         level: 3, category: 'Sixteenth Notes' },
  { id: 'ses',    name: '16th+8th+16th',        slots: [1,1,0,1], notation: 'Sixteenth + eighth + sixteenth',                  counting: '1 e   a',      level: 3, category: 'Sixteenth Notes' },

  // ── Level 4: Rests within sixteenths ──
  { id: 'rss',    name: '16th Rest + Three',    slots: [0,1,1,1], notation: '16th rest + three sixteenths beamed',             counting: '(1) e + a',    level: 4, category: '16th Rests' },
  { id: 'srs',    name: '16th + Rest + Two',    slots: [1,0,1,1], notation: 'Same as eighth+two 16ths visually',              counting: '1   + a',       level: 4, category: '16th Rests' },
  { id: 'ssr',    name: 'Three + 16th Rest',    slots: [1,1,1,0], notation: 'Three sixteenths + 16th rest',                    counting: '1 e + (a)',    level: 4, category: '16th Rests' },
  { id: 'srsr',   name: 'Alternating',          slots: [1,0,1,0], notation: 'Two eighths (same as "ee")',                      counting: '1   +',         level: 4, category: '16th Rests' },
  { id: 'rsrs',   name: 'Offbeat Alternating',  slots: [0,1,0,1], notation: 'Two sixteenths on "e" and "a"',                  counting: '  e   a',       level: 4, category: '16th Rests' },

  // ── Level 5: Dotted and triplets ──
  { id: 'dq',     name: 'Dotted Quarter',       slots: [1,0,0,0], notation: 'Filled note with dot — 1½ beats (spans into next beat)', counting: '1 (+)',  level: 5, category: 'Dotted & Triplets' },
  { id: 'de-s',   name: 'Dotted 8th + 16th',   slots: [1,0,0,1], notation: 'Long-short pattern (dotted eighth + sixteenth)',  counting: '1     a',       level: 5, category: 'Dotted & Triplets' },
  { id: 's-de',   name: '16th + Dotted 8th',    slots: [1,1,0,0], notation: 'Short-long pattern (sixteenth + dotted eighth)',  counting: '1 e',           level: 5, category: 'Dotted & Triplets' },
  { id: 'trip',   name: 'Eighth-Note Triplet',  slots: [1,1,1,0], notation: 'Three notes with "3" bracket — 3 in the time of 2', counting: '1-trip-let', level: 5, category: 'Dotted & Triplets' },
]

// Group by category
const CATEGORIES = [...new Set(RHYTHM_CELLS.map(c => c.category))]

// ── Sound playback ──────────────────────────────────────────────────────────

function playCellOnce(cell: RhythmCell, bpm: number, onStep?: (i: number) => void): ReturnType<typeof setTimeout>[] {
  const sixteenthMs = (60000 / bpm) / 4
  const timers: ReturnType<typeof setTimeout>[] = []

  cell.slots.forEach((slot, i) => {
    timers.push(setTimeout(() => {
      onStep?.(i)
      if (slot === 1) {
        if (i === 0) playAccentClick(0.4)
        else playSnare(0.4)
      }
    }, i * sixteenthMs))
  })

  // Clear highlight after
  timers.push(setTimeout(() => onStep?.(-1), 4 * sixteenthMs))

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

  // Determine beaming
  const attacks = cell.slots.map((s, i) => s === 1 ? i : -1).filter(i => i >= 0)

  // Is this an eighth-note pair? (slots 0,2 filled)
  const isEighthPair = cell.id === 'ee' || cell.id === 'srsr'
  // Is this all four sixteenths?
  const isAllSixteenths = attacks.length >= 3 && !isEighthPair && cell.level >= 3
  const isTriplet = cell.id === 'trip'

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Staff line */}
      <line x1={2} y1={staffY} x2={w - 2} y2={staffY} stroke="#2d3748" strokeWidth={0.8} />

      {/* Beat subdivision ticks */}
      {[0,1,2,3].map(i => {
        const x = i * noteW + noteW / 2
        const isHl = highlight === i
        return (
          <g key={i}>
            {/* Highlight bg */}
            {isHl && <rect x={i * noteW + 1} y={0} width={noteW - 2} height={h} fill="#7c3aed" opacity={0.15} rx={3} />}
          </g>
        )
      })}

      {/* Beams between attacks */}
      {attacks.length >= 2 && !isTriplet && (() => {
        const beamY = noteY - stemH
        const x1 = attacks[0] * noteW + noteW / 2 + noteR
        const x2 = attacks[attacks.length - 1] * noteW + noteW / 2 + noteR

        // Single beam (eighths) or double beam (sixteenths)
        const beamCount = isEighthPair ? 1 : isAllSixteenths ? 2 : 1
        return (
          <g>
            {/* Stems to beam */}
            {attacks.map(i => {
              const x = i * noteW + noteW / 2 + noteR
              return <line key={`s${i}`} x1={x} y1={noteY} x2={x} y2={beamY} stroke="#c8d0d8" strokeWidth={1} />
            })}
            {/* Beams */}
            {Array.from({ length: beamCount }).map((_, b) => (
              <line key={`b${b}`} x1={x1} y1={beamY + b * 4} x2={x2} y2={beamY + b * 4} stroke="#c8d0d8" strokeWidth={2.5} strokeLinecap="round" />
            ))}
            {/* Partial beams for mixed patterns like ess, sse */}
            {cell.id === 'ess' && <line x1={(2 * noteW + noteW/2 + noteR)} y1={beamY + 4} x2={(3 * noteW + noteW/2 + noteR)} y2={beamY + 4} stroke="#c8d0d8" strokeWidth={2.5} strokeLinecap="round" />}
            {cell.id === 'sse' && <line x1={(0 * noteW + noteW/2 + noteR)} y1={beamY + 4} x2={(1 * noteW + noteW/2 + noteR)} y2={beamY + 4} stroke="#c8d0d8" strokeWidth={2.5} strokeLinecap="round" />}
          </g>
        )
      })()}

      {/* Triplet bracket */}
      {isTriplet && (() => {
        const x1 = attacks[0] * noteW + noteW / 2
        const x2 = attacks[attacks.length - 1] * noteW + noteW / 2
        const by = noteY - stemH - 4
        return (
          <g>
            {attacks.map(i => {
              const x = i * noteW + noteW / 2 + noteR
              return <line key={`s${i}`} x1={x} y1={noteY} x2={x} y2={noteY - stemH} stroke="#c8d0d8" strokeWidth={1} />
            })}
            <line x1={x1} y1={noteY - stemH} x2={x2 + noteR * 2} y2={noteY - stemH} stroke="#c8d0d8" strokeWidth={2.5} strokeLinecap="round" />
            <text x={(x1 + x2) / 2 + noteR} y={by} textAnchor="middle" fill="#d97706" fontSize={size === 'large' ? 11 : 8} fontWeight="bold" fontFamily="system-ui">3</text>
          </g>
        )
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
              {/* Solo stem for single notes or unbeamed */}
              {attacks.length === 1 && <line x1={x + noteR} y1={noteY} x2={x + noteR} y2={noteY - stemH} stroke={col} strokeWidth={1} />}
            </g>
          )
        } else if (cell.slots.every(s => s === 0)) {
          // Quarter rest (only on first slot)
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
                {['1', 'e', '+', 'a'].map((syllable, i) => {
                  const isActive = selectedCell.slots[i] === 1
                  return (
                    <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${
                      isActive
                        ? 'bg-violet-900/40 text-violet-300 border border-violet-700/50'
                        : 'bg-[#1e2433] text-[#374151]'
                    }`}>
                      {syllable}
                    </span>
                  )
                })}
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
