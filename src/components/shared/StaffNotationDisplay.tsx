import React, { useState, useCallback, useEffect, useRef } from 'react'
import { PatternData, HitValue } from '../../types/curriculum'
import { DrumPad } from '../../types/midi'
import { playPattern, stopPatternPlayback } from '../../services/drumSounds'

// ═══════════════════════════════════════════════════════════════════════════
//  STAFF NOTATION DISPLAY v3 — Clean, large, readable drum notation
// ═══════════════════════════════════════════════════════════════════════════

// ── Layout ──────────────────────────────────────────────────────────────────

const LS = 14          // line spacing
const SY = 56          // top staff line y
const CLEF_W = 44      // percussion clef width
const PAD_R = 16

const L5 = SY, L4 = SY + LS, L3 = SY + LS * 2, L2 = SY + LS * 3, L1 = SY + LS * 4

// PAS positions
const PY: Partial<Record<DrumPad, number>> = {
  [DrumPad.CrashCymbal]: L5 - LS,
  [DrumPad.HiHatClosed]: L5 - LS / 2,
  [DrumPad.HiHatOpen]:   L5 - LS / 2,
  [DrumPad.RideCymbal]:  L5,
  [DrumPad.RideBell]:    L5,
  [DrumPad.Tom1]:        L5 + LS / 2,
  [DrumPad.Tom2]:        L4,
  [DrumPad.Snare]:       L4 + LS / 2,
  [DrumPad.SnareRim]:    L4 + LS / 2,
  [DrumPad.FloorTom]:    L3 + LS / 2,
  [DrumPad.Kick]:        L2 + LS / 2,
  [DrumPad.HiHatPedal]:  L1 + LS / 2,
}

const CYM = new Set([DrumPad.HiHatClosed, DrumPad.HiHatOpen, DrumPad.HiHatPedal, DrumPad.CrashCymbal, DrumPad.RideCymbal, DrumPad.RideBell])

// ── SVG primitives ──────────────────────────────────────────────────────────

function XHead({ x, y, color, size = 6 }: { x: number; y: number; color: string; size?: number }) {
  return <g>
    <line x1={x-size} y1={y-size} x2={x+size} y2={y+size} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={x+size} y1={y-size} x2={x-size} y2={y+size} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </g>
}

function Oval({ x, y, color, ghost }: { x: number; y: number; color: string; ghost: boolean }) {
  return <ellipse cx={x} cy={y} rx={7} ry={4.5} fill={ghost ? 'none' : color}
    stroke={color} strokeWidth={ghost ? 1.5 : 0} transform={`rotate(-12 ${x} ${y})`} />
}

// ── One bar of notation ─────────────────────────────────────────────────────

interface BarProps {
  pattern: PatternData
  offsetX: number
  noteW: number
  highlightSlot?: number  // -1 = none
  barIndex?: number
}

function NotationBar({ pattern, offsetX, noteW, highlightSlot = -1, barIndex = 0 }: BarProps) {
  const { beats, subdivisions, tracks } = pattern
  const totalSlots = beats * subdivisions
  const barW = totalSlots * noteW

  // Collect notes per slot
  interface N { pad: DrumPad; hv: HitValue; y: number; cym: boolean }
  const slots: N[][] = Array.from({ length: totalSlots }, () => [])
  for (const [pad, vals] of Object.entries(tracks) as [DrumPad, HitValue[]][]) {
    const y = PY[pad]; if (y === undefined) continue
    for (let i = 0; i < Math.min(vals.length, totalSlots); i++) {
      if (vals[i] > 0) slots[i].push({ pad, hv: vals[i], y, cym: CYM.has(pad) })
    }
  }

  function nx(slot: number) { return offsetX + slot * noteW + noteW / 2 }

  // Beam groups per beat, separated by voice
  const beamCount = subdivisions >= 4 ? 2 : subdivisions >= 2 ? 1 : 0

  function beamGroup(beatIdx: number, isCym: boolean) {
    const start = beatIdx * subdivisions
    const notes: { x: number; y: number }[] = []
    for (let i = start; i < start + subdivisions; i++) {
      const matching = slots[i].filter(n => n.cym === isCym)
      if (matching.length > 0) {
        const y = isCym ? Math.min(...matching.map(n => n.y)) : Math.max(...matching.map(n => n.y))
        notes.push({ x: nx(i), y })
      }
    }
    if (notes.length < 2 || beamCount === 0) return null

    const stemUp = !isCym
    const off = stemUp ? 6 : -6
    const stemLen = 32
    const beamY = stemUp ? Math.min(...notes.map(n => n.y)) - stemLen : Math.max(...notes.map(n => n.y)) + stemLen

    return <g key={`bg-${beatIdx}-${isCym}`}>
      {notes.map((n, i) => <line key={i} x1={n.x + off} y1={n.y} x2={n.x + off} y2={beamY} stroke="#6b7a8a" strokeWidth={1.3} />)}
      {Array.from({ length: beamCount }).map((_, b) => {
        const by = stemUp ? beamY + b * 5.5 : beamY - b * 5.5
        return <line key={b} x1={notes[0].x + off} y1={by} x2={notes[notes.length-1].x + off} y2={by} stroke="#6b7a8a" strokeWidth={3} strokeLinecap="round" />
      })}
    </g>
  }

  // Track which slots are beamed
  const beamed = new Set<string>()
  if (beamCount > 0) {
    for (let b = 0; b < beats; b++) {
      for (const isCym of [true, false]) {
        let count = 0
        for (let i = b * subdivisions; i < (b + 1) * subdivisions; i++) {
          if (slots[i].some(n => n.cym === isCym)) count++
        }
        if (count >= 2) {
          for (let i = b * subdivisions; i < (b + 1) * subdivisions; i++) {
            if (slots[i].some(n => n.cym === isCym)) beamed.add(`${i}-${isCym}`)
          }
        }
      }
    }
  }

  return <g>
    {/* Staff lines */}
    {[L5, L4, L3, L2, L1].map(y => <line key={y} x1={offsetX} y1={y} x2={offsetX + barW} y2={y} stroke="#1e2d3d" strokeWidth={1.2} />)}

    {/* Bar number */}
    <text x={offsetX + 4} y={L5 - LS - 8} fill="#2d3e50" fontSize="10" fontFamily="system-ui">{barIndex + 1}</text>

    {/* Highlight column */}
    {highlightSlot >= 0 && highlightSlot < totalSlots && (
      <rect x={nx(highlightSlot) - noteW/2 + 2} y={L5 - LS * 1.5} width={noteW - 4} height={LS * 7}
        fill="#7c3aed" opacity={0.12} rx={4} />
    )}

    {/* Beat dividers (subtle) */}
    {Array.from({ length: beats - 1 }).map((_, i) => {
      const x = offsetX + (i + 1) * subdivisions * noteW
      return <line key={i} x1={x} y1={L5} x2={x} y2={L1} stroke="#1a2a38" strokeWidth={0.8} strokeDasharray="2,3" />
    })}

    {/* Beams */}
    {Array.from({ length: beats }).map((_, b) => <React.Fragment key={b}>{beamGroup(b, true)}{beamGroup(b, false)}</React.Fragment>)}

    {/* Notes */}
    {slots.map((notes, i) => {
      const x = nx(i)
      const isHl = highlightSlot === i
      return notes.map((note, ni) => {
        const col = isHl ? '#e0d4ff' : note.hv === 2 ? '#fbbf24' : note.hv === 3 ? '#555e6b' : '#d1d8e0'
        const stemUp = !note.cym
        const isBeamed = beamed.has(`${i}-${note.cym}`)

        return <g key={`${i}-${ni}`}>
          {/* Ledger for crash */}
          {note.pad === DrumPad.CrashCymbal && <line x1={x-10} y1={L5-LS} x2={x+10} y2={L5-LS} stroke="#253040" strokeWidth={1} />}

          {/* Notehead */}
          {note.cym ? <XHead x={x} y={note.y} color={col} /> : <Oval x={x} y={note.y} color={col} ghost={note.hv===3} />}

          {/* Ghost parens */}
          {note.hv === 3 && !note.cym && <>
            <text x={x-11} y={note.y+5} fill="#555e6b" fontSize="15" fontFamily="system-ui">(</text>
            <text x={x+6} y={note.y+5} fill="#555e6b" fontSize="15" fontFamily="system-ui">)</text>
          </>}

          {/* Solo stem (not beamed) */}
          {!isBeamed && <line x1={x + (stemUp?6:-6)} y1={note.y} x2={x + (stemUp?6:-6)} y2={stemUp ? note.y - 32 : note.y + 32} stroke="#6b7a8a" strokeWidth={1.3} />}

          {/* Accent */}
          {note.hv === 2 && <text x={x} y={note.cym ? note.y - 16 : note.y - 16} textAnchor="middle" fill="#fbbf24" fontSize="13" fontWeight="bold" fontFamily="system-ui">{'>'}</text>}

          {/* Open HH */}
          {note.pad === DrumPad.HiHatOpen && <circle cx={x} cy={note.y-13} r={4.5} fill="none" stroke={col} strokeWidth={1.5} />}

          {/* Closed HH */}
          {note.pad === DrumPad.HiHatClosed && <>
            <line x1={x-4} y1={note.y-12} x2={x+4} y2={note.y-12} stroke={col} strokeWidth={1.8} />
            <line x1={x} y1={note.y-16} x2={x} y2={note.y-8} stroke={col} strokeWidth={1.8} />
          </>}
        </g>
      })
    })}

    {/* Rests for empty beats */}
    {Array.from({ length: beats }).map((_, b) => {
      const empty = slots.slice(b * subdivisions, (b+1) * subdivisions).every(s => s.length === 0)
      if (!empty) return null
      const x = nx(b * subdivisions + Math.floor(subdivisions / 2))
      return <path key={`r${b}`} d={`M ${x+3} ${L3-10} L ${x-3} ${L3-3} L ${x+3} ${L3+4} L ${x-3} ${L3+11} Q ${x+6} ${L3+16} ${x} ${L3+18}`}
        fill="none" stroke="#3d4d5d" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    })}

    {/* End bar line */}
    <line x1={offsetX + barW} y1={L5} x2={offsetX + barW} y2={L1} stroke="#2d3e50" strokeWidth={1.5} />

    {/* Beat numbers */}
    {Array.from({ length: beats }).map((_, i) =>
      <text key={i} x={nx(i * subdivisions)} y={L1 + LS * 1.6} textAnchor="middle" fill="#3d4d5d" fontSize="11" fontFamily="system-ui">{i + 1}</text>
    )}
  </g>
}

// ── Percussion clef ─────────────────────────────────────────────────────────

function PercClef({ x }: { x: number }) {
  return <g>
    <rect x={x} y={L5 - 3} width={6} height={LS * 4 + 6} fill="#5a6a7a" rx={1.5} />
    <rect x={x + 11} y={L5 - 3} width={6} height={LS * 4 + 6} fill="#5a6a7a" rx={1.5} />
  </g>
}

// ── Grid bar (SVG) — colored blocks aligned to the same noteW ────────────────

const GRID_PAD_ORDER: DrumPad[] = [
  DrumPad.CrashCymbal, DrumPad.HiHatOpen, DrumPad.HiHatClosed, DrumPad.RideCymbal,
  DrumPad.Tom1, DrumPad.Tom2, DrumPad.Snare, DrumPad.FloorTom, DrumPad.Kick, DrumPad.HiHatPedal,
]

const GRID_PAD_LABEL: Partial<Record<DrumPad, string>> = {
  [DrumPad.HiHatClosed]: 'HH', [DrumPad.HiHatOpen]: 'HH o', [DrumPad.Snare]: 'Snare',
  [DrumPad.Kick]: 'Kick', [DrumPad.Tom1]: 'T1', [DrumPad.Tom2]: 'T2',
  [DrumPad.FloorTom]: 'Fl.T', [DrumPad.CrashCymbal]: 'Crash', [DrumPad.RideCymbal]: 'Ride',
  [DrumPad.HiHatPedal]: 'HH P',
}

const HIT_FILL: Record<number, string> = { 0: '#141a28', 1: '#7c3aed', 2: '#eab308', 3: '#3b1d72' }
const HIT_FILL_HL: Record<number, string> = { 0: '#1e2840', 1: '#a78bfa', 2: '#fde047', 3: '#6d28d9' }

const GRID_ROW_H = 14
const GRID_LABEL_W = 40
const GRID_GAP = 2

interface GridBarProps {
  pattern: PatternData
  offsetX: number
  noteW: number
  topY: number
  highlightSlot?: number
}

function GridBar({ pattern, offsetX, noteW, topY, highlightSlot = -1 }: GridBarProps) {
  const { beats, subdivisions, tracks } = pattern
  const totalSlots = beats * subdivisions
  const activePads = GRID_PAD_ORDER.filter(p => tracks[p]?.some(v => v > 0))

  return <g>
    {activePads.map((pad, rowIdx) => {
      const steps = tracks[pad] ?? []
      const ry = topY + rowIdx * (GRID_ROW_H + GRID_GAP)
      return <g key={pad}>
        {/* Label */}
        <text x={offsetX - 4} y={ry + GRID_ROW_H / 2 + 4} textAnchor="end" fill="#4b5a6a" fontSize="9" fontFamily="system-ui">
          {GRID_PAD_LABEL[pad] ?? pad}
        </text>
        {/* Cells */}
        {Array.from({ length: totalSlots }).map((_, si) => {
          const hv = (steps[si] ?? 0) as number
          const isHl = highlightSlot === si
          const cx = offsetX + si * noteW + 1
          const cw = noteW - 2
          return <rect key={si} x={cx} y={ry} width={cw} height={GRID_ROW_H} rx={2}
            fill={isHl ? HIT_FILL_HL[hv] : HIT_FILL[hv]}
            stroke={isHl ? '#a78bfa55' : 'none'} strokeWidth={isHl ? 1 : 0} />
        })}
      </g>
    })}
    {/* Beat numbers */}
    {Array.from({ length: beats }).map((_, b) => {
      const x = offsetX + b * subdivisions * noteW + noteW / 2
      const y = topY - 4
      return <text key={b} x={x} y={y} textAnchor="middle" fill="#3d4d5d" fontSize="9" fontFamily="system-ui">{b + 1}</text>
    })}
  </g>
}

function gridHeight(pattern: PatternData): number {
  const activePads = GRID_PAD_ORDER.filter(p => pattern.tracks[p]?.some(v => v > 0))
  return activePads.length * (GRID_ROW_H + GRID_GAP) + 10
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return <div className="flex gap-5 text-[11px] text-[#5a6a7a] flex-wrap items-center">
    <span className="flex items-center gap-1.5">
      <svg width="16" height="14"><ellipse cx={8} cy={7} rx={6} ry={4} fill="#c8cdd5" transform="rotate(-12 8 7)" /></svg> Drum
    </span>
    <span className="flex items-center gap-1.5">
      <svg width="16" height="14">
        <line x1={2} y1={2} x2={14} y2={14} stroke="#c8cdd5" strokeWidth={2.2} strokeLinecap="round" />
        <line x1={14} y1={2} x2={2} y2={14} stroke="#c8cdd5" strokeWidth={2.2} strokeLinecap="round" />
      </svg> Cymbal
    </span>
    <span className="flex items-center gap-1.5"><span className="text-yellow-400 font-bold">{'>'}</span> Accent</span>
    <span className="flex items-center gap-1.5 text-[#555e6b]">( ) Ghost</span>
    <span className="flex items-center gap-1.5">
      <svg width="14" height="14">
        <line x1={3} y1={7} x2={11} y2={7} stroke="#c8cdd5" strokeWidth={1.8} />
        <line x1={7} y1={3} x2={7} y2={11} stroke="#c8cdd5" strokeWidth={1.8} />
      </svg> Closed HH
    </span>
    <span className="flex items-center gap-1.5">
      <svg width="14" height="14"><circle cx={7} cy={7} r={5} fill="none" stroke="#c8cdd5" strokeWidth={1.5} /></svg> Open HH
    </span>
  </div>
}

// ── Play controls ────────────────────────────────────────────────────────────

function PlayBar({ playing, bpm, loops, onToggle, onBpmChange, onLoopsChange }: {
  playing: boolean; bpm: number; loops: number
  onToggle: () => void; onBpmChange: (b: number) => void; onLoopsChange: (l: number) => void
}) {
  return <div className="flex items-center gap-4 flex-wrap">
    <button onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
        playing ? 'bg-red-700/60 text-red-200 hover:bg-red-600/60' : 'bg-violet-600 text-white hover:bg-violet-500'
      }`}>
      {playing ? '■  Stop' : '▶  Listen'}
    </button>
    <div className="flex items-center gap-2 text-xs">
      <button onClick={() => onBpmChange(Math.max(40, bpm - 5))} className="w-6 h-6 rounded-md bg-[#1a2030] text-[#94a3b8] hover:text-white flex items-center justify-center">−</button>
      <span className="font-mono text-white w-8 text-center">{bpm}</span>
      <button onClick={() => onBpmChange(Math.min(200, bpm + 5))} className="w-6 h-6 rounded-md bg-[#1a2030] text-[#94a3b8] hover:text-white flex items-center justify-center">+</button>
      <span className="text-[#4b5a6a]">BPM</span>
    </div>
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-[#4b5a6a]">Repeat:</span>
      {[1, 2, 4, 8].map(n =>
        <button key={n} onClick={() => onLoopsChange(n)}
          className={`px-2 py-1 rounded-md transition-colors ${loops === n ? 'bg-violet-800/40 text-violet-300' : 'bg-[#1a2030] text-[#4b5a6a] hover:text-white'}`}>
          {n}×
        </button>
      )}
      <button onClick={() => onLoopsChange(0)}
        className={`px-2 py-1 rounded-md transition-colors ${loops === 0 ? 'bg-violet-800/40 text-violet-300' : 'bg-[#1a2030] text-[#4b5a6a] hover:text-white'}`}>
        ∞
      </button>
    </div>
  </div>
}

// ── Scrolling practice view ─────────────────────────────────────────────────

function ScrollingView({ pattern, noteW, playing, currentSlot, currentLoop, totalLoops }: {
  pattern: PatternData; noteW: number; playing: boolean
  currentSlot: number; currentLoop: number; totalLoops: number
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const slotsPerBar = pattern.beats * pattern.subdivisions
  const barW = slotsPerBar * noteW
  const barsToShow = totalLoops === 0 ? 4 : totalLoops
  const totalW = CLEF_W + barsToShow * barW + PAD_R
  const staffBottom = L1 + LS * 1.8
  const gH = gridHeight(pattern)
  const svgH = staffBottom + gH + 20

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    if (!playing || !scrollRef.current) return
    const globalSlot = currentLoop * slotsPerBar + currentSlot
    const playheadX = CLEF_W + globalSlot * noteW + noteW / 2
    const container = scrollRef.current
    const center = container.clientWidth / 2
    container.scrollLeft = Math.max(0, playheadX - center)
  }, [currentSlot, currentLoop, playing, noteW, slotsPerBar])

  return <div ref={scrollRef} className="overflow-x-auto scrollbar-thin" style={{ scrollBehavior: 'smooth' }}>
    <svg viewBox={`0 0 ${totalW} ${svgH}`} width={totalW} height={svgH} className="block">
      <rect width={totalW} height={svgH} fill="#080c14" rx="10" />
      <PercClef x={10} />

      {Array.from({ length: barsToShow }).map((_, bi) => {
        const ox = CLEF_W + bi * barW
        const hl = playing && currentLoop === bi ? currentSlot : -1
        return <React.Fragment key={bi}>
          <NotationBar pattern={pattern} offsetX={ox} noteW={noteW} highlightSlot={hl} barIndex={bi} />
          <GridBar pattern={pattern} offsetX={ox} noteW={noteW} topY={staffBottom + 8} highlightSlot={hl} />
        </React.Fragment>
      })}

      {/* Separator line between notation and grid */}
      <line x1={CLEF_W} y1={staffBottom - 4} x2={totalW - PAD_R} y2={staffBottom - 4} stroke="#1a2a38" strokeWidth={0.5} />

      {/* Playhead line (full height including grid) */}
      {playing && (() => {
        const globalSlot = currentLoop * slotsPerBar + currentSlot
        const px = CLEF_W + globalSlot * noteW + noteW / 2
        return <line x1={px} y1={SY - LS * 2} x2={px} y2={svgH - 8} stroke="#7c3aed" strokeWidth={2} opacity={0.6} />
      })()}

      {/* Loop indicator */}
      {playing && <text x={totalW - PAD_R} y={16} textAnchor="end" fill="#5a6a7a" fontSize="11" fontFamily="system-ui">
        Loop {currentLoop + 1}{totalLoops > 0 ? ` / ${totalLoops}` : ''}
      </text>}
    </svg>
  </div>
}

// ── Fullscreen modal ────────────────────────────────────────────────────────

function Modal({ pattern, bpm: initBpm, bars, onClose }: {
  pattern: PatternData; bpm: number; bars: number; onClose: () => void
}) {
  const [bpm, setBpm] = useState(initBpm)
  const [loops, setLoops] = useState(bars)
  const [playing, setPlaying] = useState(false)
  const [slot, setSlot] = useState(-1)
  const [loop, setLoop] = useState(0)
  const slotsPerBar = pattern.beats * pattern.subdivisions

  function toggle() {
    if (playing) { stopPatternPlayback(); setPlaying(false); setSlot(-1); setLoop(0); return }
    setPlaying(true); setLoop(0); setSlot(0)
    const effectiveLoops = loops === 0 ? 99 : loops
    playPattern(pattern, bpm, effectiveLoops,
      (s) => { setSlot(s); if (s === 0) setLoop(prev => prev > 0 || s === 0 ? prev : prev) },
      () => { setPlaying(false); setSlot(-1); setLoop(0) }
    )
  }

  // Track loop number from slot resets
  const prevSlotRef = useRef(-1)
  useEffect(() => {
    if (playing && slot === 0 && prevSlotRef.current > 0) setLoop(l => l + 1)
    prevSlotRef.current = slot
  }, [slot, playing])

  useEffect(() => () => { stopPatternPlayback() }, [])

  const noteW = Math.max(50, Math.min(80, 1000 / slotsPerBar))

  return <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col" onClick={() => { stopPatternPlayback(); onClose() }}>
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-6" onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <PlayBar playing={playing} bpm={bpm} loops={loops} onToggle={toggle} onBpmChange={setBpm} onLoopsChange={setLoops} />
        <button onClick={() => { stopPatternPlayback(); onClose() }} className="text-[#5a6a7a] hover:text-white text-2xl px-3 ml-4">✕</button>
      </div>

      {/* Scrolling notation */}
      <div className="flex-1 flex items-center min-h-0">
        <ScrollingView
          pattern={pattern} noteW={noteW}
          playing={playing} currentSlot={slot >= 0 ? slot : -1}
          currentLoop={loop} totalLoops={loops}
        />
      </div>

      {/* Legend + grid legend */}
      <div className="mt-4 flex items-center gap-4 flex-wrap">
        <Legend />
        <span className="text-[#1a2a38]">|</span>
        <div className="flex gap-3 text-[10px] text-[#3d4d5d]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-violet-600 inline-block" /> Hit</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" /> Accent</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-violet-900 inline-block" /> Ghost</span>
        </div>
      </div>
    </div>
  </div>
}

// ── Main component ──────────────────────────────────────────────────────────

interface Props {
  pattern: PatternData
  currentStep?: number  // external (from practice engine)
  bpm?: number
  bars?: number
}

export default function StaffNotationDisplay({ pattern, currentStep, bpm = 90, bars = 1 }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [localBpm, setLocalBpm] = useState(bpm)
  const [loops, setLoops] = useState(bars)
  const [playing, setPlaying] = useState(false)
  const [demoSlot, setDemoSlot] = useState(-1)
  const [demoLoop, setDemoLoop] = useState(0)
  const prevSlotRef = useRef(-1)

  const slotsPerBar = pattern.beats * pattern.subdivisions
  const noteW = Math.max(36, Math.min(56, 500 / slotsPerBar))

  function toggle() {
    if (playing) { stopPatternPlayback(); setPlaying(false); setDemoSlot(-1); setDemoLoop(0); return }
    setPlaying(true); setDemoLoop(0); setDemoSlot(0)
    const effectiveLoops = loops === 0 ? 99 : loops
    playPattern(pattern, localBpm, effectiveLoops,
      (s) => setDemoSlot(s),
      () => { setPlaying(false); setDemoSlot(-1); setDemoLoop(0) }
    )
  }

  useEffect(() => {
    if (playing && demoSlot === 0 && prevSlotRef.current > 0) setDemoLoop(l => l + 1)
    prevSlotRef.current = demoSlot
  }, [demoSlot, playing])

  useEffect(() => () => { stopPatternPlayback() }, [])

  const activeSlot = currentStep !== undefined ? currentStep : playing ? demoSlot : -1
  const barW = slotsPerBar * noteW
  const svgW = CLEF_W + barW + PAD_R
  const staffBottom = L1 + LS * 1.8
  const gH = gridHeight(pattern)
  const svgH = staffBottom + gH + 20

  return <div className="space-y-2">
    {/* Controls */}
    <PlayBar playing={playing} bpm={localBpm} loops={loops} onToggle={toggle} onBpmChange={setLocalBpm} onLoopsChange={setLoops} />

    {/* Combined notation + grid (single SVG, aligned) */}
    <div className="overflow-x-auto rounded-xl border border-[#1a2030]">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} className="block">
        <rect width={svgW} height={svgH} fill="#080c14" rx="10" />
        <PercClef x={10} />
        <NotationBar pattern={pattern} offsetX={CLEF_W} noteW={noteW} highlightSlot={activeSlot} />
        {/* Separator */}
        <line x1={CLEF_W} y1={staffBottom - 4} x2={svgW - PAD_R} y2={staffBottom - 4} stroke="#1a2a38" strokeWidth={0.5} />
        {/* Grid below */}
        <GridBar pattern={pattern} offsetX={CLEF_W} noteW={noteW} topY={staffBottom + 8} highlightSlot={activeSlot} />
      </svg>
    </div>

    {/* Grid legend + expand */}
    <div className="flex items-center justify-between">
      <div className="flex gap-4 text-[10px] text-[#3d4d5d] items-center">
        <Legend />
        <span className="mx-2 text-[#1a2a38]">|</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-violet-600 inline-block" /> Hit</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" /> Accent</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-violet-900 inline-block" /> Ghost</span>
      </div>
      <button onClick={() => setExpanded(true)}
        className="text-xs text-violet-500 hover:text-violet-400 transition-colors flex-shrink-0 ml-4">
        ⤢ Fullscreen
      </button>
    </div>

    {expanded && <Modal pattern={pattern} bpm={localBpm} bars={loops || 4} onClose={() => setExpanded(false)} />}
  </div>
}
