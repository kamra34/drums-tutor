import { useState, useRef, useEffect } from 'react'
import { PatternData, HitValue } from '@drums/types/curriculum'
import { DrumPad } from '@drums/types/midi'
import { subdivisionLabel, isDownbeat } from '@drums/utils/beatLabels'

interface Props {
  pattern: PatternData
  enabledPads: DrumPad[]
  bars: number
  onChange: (pattern: PatternData) => void
}

// ── Layout constants ─────────────────────────────────────────────────────────

const LINE_SP = 14
const HALF = LINE_SP / 2
const MIN_COL_W = 36
const LABEL_W = 72
const HEAD_H = 28
const PAD_TOP = 24
const STAFF_H = LINE_SP * 4 // 5 lines = 4 gaps
const PAD_BOT = 20

// ── Staff positions per drum pad ─────────────────────────────────────────────
// Y offsets from top staff line, based on standard percussion notation layout
// (drumMusicXml.ts display positions: Crash=A5, HH=G5, Ride=F5, etc.)

const PAD_INFO: Partial<Record<DrumPad, { y: number; head: 'x' | 'fill'; color: string; label: string }>> = {
  [DrumPad.CrashCymbal]: { y: -LINE_SP,     head: 'x',    color: '#60a5fa', label: 'Crash' },
  [DrumPad.HiHatOpen]:   { y: -HALF - 1,    head: 'x',    color: '#67e8f9', label: 'HH Op' },
  [DrumPad.HiHatClosed]: { y: -HALF + 2,    head: 'x',    color: '#22d3ee', label: 'HH Cl' },
  [DrumPad.RideCymbal]:  { y: 0,            head: 'x',    color: '#93c5fd', label: 'Ride' },
  [DrumPad.Tom1]:        { y: HALF,         head: 'fill', color: '#4ade80', label: 'Tom 1' },
  [DrumPad.Tom2]:        { y: LINE_SP,      head: 'fill', color: '#86efac', label: 'Tom 2' },
  [DrumPad.Snare]:       { y: HALF * 3,     head: 'fill', color: '#fb923c', label: 'Snare' },
  [DrumPad.FloorTom]:    { y: HALF * 5,     head: 'fill', color: '#34d399', label: 'Floor' },
  [DrumPad.Kick]:        { y: HALF * 7,     head: 'fill', color: '#f87171', label: 'Kick' },
  [DrumPad.HiHatPedal]:  { y: HALF * 9,     head: 'x',    color: '#a5f3fc', label: 'Pedal' },
}

// Render order (top to bottom on staff)
const RENDER_ORDER: DrumPad[] = [
  DrumPad.CrashCymbal, DrumPad.HiHatOpen, DrumPad.HiHatClosed,
  DrumPad.RideCymbal, DrumPad.Tom1, DrumPad.Tom2, DrumPad.Snare,
  DrumPad.FloorTom, DrumPad.Kick, DrumPad.HiHatPedal,
]

// ── Component ────────────────────────────────────────────────────────────────

export default function NotationInput({ pattern, enabledPads, bars, onChange }: Props) {
  const { beats, subdivisions, tracks } = pattern
  const totalSlots = beats * subdivisions * bars
  const slotsPerBar = beats * subdivisions

  // Measure container to fill available width
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setContainerW(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Column width: fill container, but never smaller than MIN_COL_W
  const availableW = containerW > 0 ? containerW - LABEL_W - 20 : 0
  const COL_W = availableW > 0 ? Math.max(MIN_COL_W, availableW / totalSlots) : MIN_COL_W

  const staffY = HEAD_H + PAD_TOP
  const svgW = LABEL_W + totalSlots * COL_W + 20
  const svgH = staffY + STAFF_H + PAD_BOT + 10

  const orderedPads = RENDER_ORDER.filter(p => enabledPads.includes(p))

  function handleClick(pad: DrumPad, slotIdx: number) {
    const track = tracks[pad] ? [...tracks[pad]] : new Array(totalSlots).fill(0)
    while (track.length < totalSlots) track.push(0)
    track[slotIdx] = ((track[slotIdx] + 1) % 4) as HitValue
    const newTracks = { ...tracks }
    if (track.every(v => v === 0)) delete newTracks[pad]
    else newTracks[pad] = track
    onChange({ ...pattern, tracks: newTracks })
  }

  function handleRightClick(e: React.MouseEvent, pad: DrumPad, slotIdx: number) {
    e.preventDefault()
    const track = tracks[pad] ? [...tracks[pad]] : new Array(totalSlots).fill(0)
    while (track.length < totalSlots) track.push(0)
    track[slotIdx] = 0
    const newTracks = { ...tracks }
    if (track.every(v => v === 0)) delete newTracks[pad]
    else newTracks[pad] = track
    onChange({ ...pattern, tracks: newTracks })
  }

  return (
    <div ref={containerRef} className="overflow-x-auto rounded-xl pb-1">
      <style>{`
        .nslot:hover .nslot-bg { opacity: 1; }
        .nslot:active .nslot-bg { opacity: 1; fill: rgba(255,255,255,0.08); }
      `}</style>

      {containerW > 0 && (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height={svgH}
        preserveAspectRatio="xMinYMid meet"
        className="block select-none" style={{ minHeight: 120 }}>

        {/* ── Instrument labels ── */}
        {orderedPads.map(pad => {
          const info = PAD_INFO[pad]
          if (!info) return null
          return (
            <text key={`lbl-${pad}`} x={LABEL_W - 8} y={staffY + info.y + 3.5}
              textAnchor="end" fontSize={9} fontWeight={600}
              fill={info.color} opacity={0.75}>
              {info.label}
            </text>
          )
        })}

        {/* ── Staff lines ── */}
        {[0, 1, 2, 3, 4].map(i => (
          <line key={`sl-${i}`}
            x1={LABEL_W - 2} y1={staffY + i * LINE_SP}
            x2={svgW - 8} y2={staffY + i * LINE_SP}
            stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        ))}

        {/* ── Percussion clef (two thick bars) ── */}
        <rect x={LABEL_W + 3} y={staffY + LINE_SP * 1.5 - 8} width={3.5} height={16} rx={1}
          fill="rgba(255,255,255,0.3)" />
        <rect x={LABEL_W + 9} y={staffY + LINE_SP * 1.5 - 8} width={3.5} height={16} rx={1}
          fill="rgba(255,255,255,0.3)" />

        {/* ── Start bar line ── */}
        <line x1={LABEL_W - 1} y1={staffY} x2={LABEL_W - 1} y2={staffY + STAFF_H}
          stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />

        {/* ── Beat columns ── */}
        {Array.from({ length: totalSlots }).map((_, si) => {
          const cx = LABEL_W + si * COL_W + COL_W / 2
          const localStep = si % slotsPerBar
          const barStart = si > 0 && si % slotsPerBar === 0
          const downbeat = isDownbeat(localStep, subdivisions)

          return (
            <g key={`col-${si}`}>
              {/* Bar line */}
              {barStart && (
                <line x1={LABEL_W + si * COL_W} y1={staffY - PAD_TOP + 6}
                  x2={LABEL_W + si * COL_W} y2={staffY + STAFF_H + PAD_BOT - 6}
                  stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
              )}

              {/* Column guide */}
              <line x1={cx} y1={staffY - 2} x2={cx} y2={staffY + STAFF_H + 2}
                stroke={downbeat ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.012)'}
                strokeWidth={1} strokeDasharray={downbeat ? undefined : '2 4'} />

              {/* Beat label */}
              <text x={cx} y={HEAD_H - 4}
                textAnchor="middle" fontSize={9}
                fontWeight={downbeat ? 700 : 400}
                fill={downbeat ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)'}>
                {subdivisionLabel(localStep, subdivisions)}
              </text>

              {/* ── Clickable note slots for each enabled pad ── */}
              {orderedPads.map(pad => {
                const info = PAD_INFO[pad]
                if (!info) return null
                const ny = staffY + info.y
                const track = tracks[pad] || []
                const val = (si < track.length ? track[si] : 0) as HitValue

                return (
                  <g key={`${pad}-${si}`}
                    className="nslot cursor-pointer"
                    onClick={() => handleClick(pad, si)}
                    onContextMenu={(e) => handleRightClick(e, pad, si)}>
                    {/* Hover highlight */}
                    <rect className="nslot-bg" x={cx - COL_W / 2 + 1} y={ny - 6}
                      width={COL_W - 2} height={12} rx={3}
                      fill="rgba(255,255,255,0.04)" opacity={0}
                      style={{ transition: 'opacity 0.12s' }} />

                    {/* Notehead */}
                    {val > 0 && <Notehead x={cx} y={ny} head={info.head} color={info.color} hit={val} />}
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* ── End bar line ── */}
        <line x1={LABEL_W + totalSlots * COL_W + 2} y1={staffY}
          x2={LABEL_W + totalSlots * COL_W + 2} y2={staffY + STAFF_H}
          stroke="rgba(255,255,255,0.15)" strokeWidth={2} />

        {/* ── Ledger lines for notes above/below staff ── */}
        {orderedPads.map(pad => {
          const info = PAD_INFO[pad]
          if (!info) return null
          const ny = staffY + info.y
          const needsLedger = info.y < 0 && Math.abs(info.y) >= LINE_SP
          const needsLedgerBelow = info.y > STAFF_H
          if (!needsLedger && !needsLedgerBelow) return null

          return Array.from({ length: totalSlots }).map((_, si) => {
            const track = tracks[pad] || []
            if (si >= track.length || track[si] === 0) return null
            const cx = LABEL_W + si * COL_W + COL_W / 2
            return (
              <line key={`lg-${pad}-${si}`}
                x1={cx - 7} y1={ny} x2={cx + 7} y2={ny}
                stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            )
          })
        })}
      </svg>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2 px-3">
        <div className="flex items-center gap-3 text-[9px] text-[#4b5563]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400/70" /> Normal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/40" /> Accent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400/30" /> Ghost
          </span>
        </div>
        <span className="text-[9px] text-[#374151]">Click to cycle &middot; Right-click to clear</span>
      </div>
    </div>
  )
}

// ── Notehead renderer ────────────────────────────────────────────────────────

function Notehead({ x, y, head, color, hit }: {
  x: number; y: number; head: 'x' | 'fill'; color: string; hit: HitValue
}) {
  const r = hit === 2 ? 6.5 : hit === 3 ? 4 : 5.5
  const op = hit === 2 ? 1 : hit === 3 ? 0.35 : 0.75

  if (head === 'x') {
    const d = r * 0.7
    return (
      <g opacity={op}>
        <line x1={x - d} y1={y - d} x2={x + d} y2={y + d}
          stroke={color} strokeWidth={hit === 2 ? 2.5 : 1.8} strokeLinecap="round" />
        <line x1={x + d} y1={y - d} x2={x - d} y2={y + d}
          stroke={color} strokeWidth={hit === 2 ? 2.5 : 1.8} strokeLinecap="round" />
        {hit === 2 && (
          <circle cx={x} cy={y} r={r + 3} fill="none" stroke={color} strokeWidth={0.5} opacity={0.25} />
        )}
      </g>
    )
  }

  return (
    <g opacity={op}>
      <ellipse cx={x} cy={y} rx={r} ry={r * 0.72} fill={color}
        style={hit === 2 ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined} />
      {hit === 2 && (
        <ellipse cx={x} cy={y} rx={r + 3} ry={r * 0.72 + 3}
          fill="none" stroke={color} strokeWidth={0.5} opacity={0.2} />
      )}
    </g>
  )
}
