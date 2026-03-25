import { useState, useRef, useEffect } from 'react'
import { playNormalClick, playAccentClick } from '../../services/clickSounds'

// ── Rest definitions ─────────────────────────────────────────────────────────

interface RestDef {
  id: string
  name: string
  beats: number
  count: string
  memoryTrick: string
  color: string
  perBar: number // how many fit in a 4/4 bar
}

const RESTS: RestDef[] = [
  {
    id: 'whole',
    name: 'Whole Rest',
    beats: 4,
    count: '(1 — 2 — 3 — 4)',
    memoryTrick: 'Hangs below the line like a "hole" in the ground',
    color: '#7c3aed',
    perBar: 1,
  },
  {
    id: 'half',
    name: 'Half Rest',
    beats: 2,
    count: '(1 — 2)  or  (3 — 4)',
    memoryTrick: 'Sits on top of the line like a "hat"',
    color: '#2563eb',
    perBar: 2,
  },
  {
    id: 'quarter',
    name: 'Quarter Rest',
    beats: 1,
    count: '(1)  or  (2)  etc.',
    memoryTrick: 'The squiggly zig-zag — looks like a lightning bolt',
    color: '#059669',
    perBar: 4,
  },
  {
    id: 'eighth',
    name: 'Eighth Rest',
    beats: 0.5,
    count: '(+)  the "and"',
    memoryTrick: 'A small "7" with a dot — one flag, like eighth note',
    color: '#d97706',
    perBar: 8,
  },
  {
    id: 'sixteenth',
    name: 'Sixteenth Rest',
    beats: 0.25,
    count: '(e) or (a)',
    memoryTrick: 'Like the eighth rest but with two flags',
    color: '#dc2626',
    perBar: 16,
  },
]

// ── SVG rest symbol drawings ──────────────────────────────────────────────────

function WholeRestSymbol({ cx, lineY, color }: { cx: number; lineY: number; color: string }) {
  // Hangs BELOW the 4th line
  return <rect x={cx - 8} y={lineY} width={16} height={6} fill={color} rx={1} />
}

function HalfRestSymbol({ cx, lineY, color }: { cx: number; lineY: number; color: string }) {
  // Sits ON TOP of the 3rd line
  return <rect x={cx - 8} y={lineY - 6} width={16} height={6} fill={color} rx={1} />
}

function QuarterRestSymbol({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  // Zig-zag shape (simplified but recognizable)
  const top = cy - 14
  return (
    <path
      d={`M ${cx + 4} ${top}
          L ${cx - 5} ${top + 7}
          L ${cx + 5} ${top + 14}
          L ${cx - 5} ${top + 21}
          Q ${cx + 6} ${top + 26} ${cx + 1} ${top + 30}`}
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

function EighthRestSymbol({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  // Dot + diagonal line + flag
  const top = cy - 8
  return (
    <g>
      <circle cx={cx + 3} cy={top} r={2.5} fill={color} />
      <line x1={cx + 3} y1={top} x2={cx - 4} y2={top + 18} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </g>
  )
}

function SixteenthRestSymbol({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  // Two dots + diagonal line + two flags
  const top = cy - 10
  return (
    <g>
      <circle cx={cx + 4} cy={top} r={2.2} fill={color} />
      <circle cx={cx + 1} cy={top + 7} r={2.2} fill={color} />
      <line x1={cx + 4} y1={top} x2={cx - 5} y2={top + 22} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </g>
  )
}

function RestSymbol({ id, cx, cy, lineY, color }: { id: string; cx: number; cy: number; lineY: number; color: string }) {
  switch (id) {
    case 'whole': return <WholeRestSymbol cx={cx} lineY={lineY} color={color} />
    case 'half': return <HalfRestSymbol cx={cx} lineY={lineY} color={color} />
    case 'quarter': return <QuarterRestSymbol cx={cx} cy={cy} color={color} />
    case 'eighth': return <EighthRestSymbol cx={cx} cy={cy} color={color} />
    case 'sixteenth': return <SixteenthRestSymbol cx={cx} cy={cy} color={color} />
    default: return null
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RestValuesChart() {
  const [selected, setSelected] = useState<string | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedRest = RESTS.find(r => r.id === selected)

  function playRest(rest: RestDef) {
    if (playing === rest.id) {
      stopPlay()
      return
    }
    stopPlay()
    setPlaying(rest.id)
    setSelected(rest.id)

    // Play one bar of 4/4 with clicks on beats, silent on rests
    // Example: quarter rest on beat 3 means click-click-silence-click
    const beatMs = 500 // 120 BPM
    const subdivMs = beatMs / (rest.perBar / 4)
    let step = 0
    const total = rest.perBar

    // For demo: first half are notes (clicks), second half are rests (silence)
    // Actually: alternate note-rest to show the contrast
    function tick() {
      if (step % 2 === 0) {
        // "Note" beat — play a click
        step % 8 === 0 ? playAccentClick(0.4) : playNormalClick(0.3)
      }
      // Odd steps are the REST — silence (no sound)
      step++
    }

    tick() // first beat
    intervalRef.current = setInterval(() => {
      if (step >= total * 2) {
        stopPlay()
        return
      }
      tick()
    }, subdivMs)
  }

  function stopPlay() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPlaying(null)
  }

  useEffect(() => () => stopPlay(), [])

  // Mini staff geometry for the SVG
  const STAFF_W = 70
  const STAFF_H = 50
  const LINE_GAP = 8
  const STAFF_TOP = 10
  const lines = [0, 1, 2, 3, 4].map(i => STAFF_TOP + i * LINE_GAP)

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6 space-y-5">
      <div className="text-xs text-[#4b5563] uppercase tracking-wider">Rest Values — Every Note Has a Matching Silence</div>

      <p className="text-sm text-[#6b7280]">
        For every note value (whole, half, quarter, etc.) there is a <strong className="text-white">rest</strong> of equal duration.
        Rests tell you <em>when not to play</em> — they're just as important as the notes themselves.
      </p>

      {/* Rest list */}
      <div className="space-y-2">
        {RESTS.map(rest => {
          const isSelected = selected === rest.id
          const isPlaying = playing === rest.id

          return (
            <div
              key={rest.id}
              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-[#13101e]' : 'hover:bg-[#0f1117]'
              }`}
              onClick={() => setSelected(isSelected && !isPlaying ? null : rest.id)}
            >
              {/* Play button */}
              <button
                onClick={(e) => { e.stopPropagation(); playRest(rest) }}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  backgroundColor: isPlaying ? rest.color : rest.color + '22',
                  color: isPlaying ? 'white' : rest.color,
                }}
              >
                {isPlaying ? '■' : '▶'}
              </button>

              {/* Mini staff with rest symbol */}
              <div className="flex-shrink-0">
                <svg width={STAFF_W} height={STAFF_H} viewBox={`0 0 ${STAFF_W} ${STAFF_H}`}>
                  <rect width={STAFF_W} height={STAFF_H} fill="#0a0c13" rx="4" />
                  {lines.map((y, i) => (
                    <line key={i} x1={4} y1={y} x2={STAFF_W - 4} y2={y} stroke="#1e2433" strokeWidth={1} />
                  ))}
                  <RestSymbol
                    id={rest.id}
                    cx={STAFF_W / 2}
                    cy={STAFF_TOP + LINE_GAP * 2}
                    lineY={lines[1]}
                    color={isSelected ? rest.color : '#94a3b8'}
                  />
                </svg>
              </div>

              {/* Name + info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: rest.color }}>{rest.name}</div>
                <div className="text-[10px] text-[#4b5563]">
                  {rest.beats} beat{rest.beats !== 1 ? 's' : ''} of silence · {rest.perBar} per bar
                </div>
              </div>

              {/* Count */}
              <div className="text-xs text-[#4b5563] flex-shrink-0 text-right font-mono">
                {rest.count}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected detail */}
      {selectedRest && (
        <div className="border-t border-[#1e2433] pt-4">
          <div className="flex gap-8 flex-wrap">
            <div>
              <div className="text-xs text-[#4b5563]">Symbol</div>
              <div className="mt-1">
                <svg width="50" height="44" viewBox="0 0 50 44">
                  {[0, 1, 2, 3, 4].map(i => (
                    <line key={i} x1={2} y1={6 + i * 8} x2={48} y2={6 + i * 8} stroke="#1e2433" strokeWidth={1} />
                  ))}
                  <RestSymbol id={selectedRest.id} cx={25} cy={22} lineY={14} color={selectedRest.color} />
                </svg>
              </div>
            </div>
            <div>
              <div className="text-xs text-[#4b5563]">Duration</div>
              <div className="text-white font-semibold">{selectedRest.beats} beat{selectedRest.beats !== 1 ? 's' : ''}</div>
            </div>
            <div>
              <div className="text-xs text-[#4b5563]">Memory trick</div>
              <div className="text-sm text-[#94a3b8]">{selectedRest.memoryTrick}</div>
            </div>
          </div>
        </div>
      )}

      {/* Key point */}
      <div className="bg-violet-900/10 border border-violet-800/30 rounded-lg p-3 text-sm text-[#94a3b8]">
        <strong className="text-violet-300">Whole vs Half rest — easy trick:</strong>{' '}
        The whole rest <em>hangs</em> from the line (like a <strong className="text-white">hole</strong> in the ground).
        The half rest <em>sits</em> on the line (like a <strong className="text-white">hat</strong>).
        Both look like rectangles — the position is what tells them apart.
      </div>
    </div>
  )
}
