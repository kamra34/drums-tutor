import { useState } from 'react'
import { playNormalClick, playAccentClick, playHiHat } from '../../services/clickSounds'

// ── SVG helpers ──────────────────────────────────────────────────────────────

const NOTE_COLOR = '#e2e8f0'
const DIM_COLOR = '#4b5563'
const ACCENT_COLOR = '#a78bfa'

/** Filled oval notehead */
function NoteHead({ x, y, color = NOTE_COLOR }: { x: number; y: number; color?: string }) {
  return <ellipse cx={x} cy={y} rx={7} ry={4.5} fill={color} transform={`rotate(-15 ${x} ${y})`} />
}

/** Stem going up from notehead */
function Stem({ x, y, top, color = NOTE_COLOR }: { x: number; y: number; top: number; color?: string }) {
  return <line x1={x + 6} y1={y - 2} x2={x + 6} y2={top} stroke={color} strokeWidth={1.5} />
}

/** Single flag on a stem (eighth note flag) */
function Flag({ x, top, offset = 0, color = NOTE_COLOR }: { x: number; top: number; offset?: number; color?: string }) {
  const sx = x + 6
  const sy = top + offset
  return (
    <path
      d={`M ${sx} ${sy} C ${sx + 14} ${sy + 4} ${sx + 12} ${sy + 14} ${sx + 2} ${sy + 20}`}
      fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"
    />
  )
}

/** Horizontal beam connecting note stems */
function Beam({ x1, x2, y, thickness = 4, color = NOTE_COLOR }: { x1: number; x2: number; y: number; thickness?: number; color?: string }) {
  return <rect x={x1} y={y} width={x2 - x1} height={thickness} fill={color} rx={0.5} />
}

// ── Example rows ─────────────────────────────────────────────────────────────

interface NoteGroupProps {
  positions: number[]
  noteY: number
  stemTop: number
  mode: 'flagged' | 'beamed'
  flagCount: number           // 1 = eighth, 2 = sixteenth
  color?: string
  groupSize: number           // how many notes per beam group
}

function NoteGroup({ positions, noteY, stemTop, mode, flagCount, color = NOTE_COLOR, groupSize }: NoteGroupProps) {
  return (
    <g>
      {positions.map((x, i) => (
        <g key={i}>
          <NoteHead x={x} y={noteY} color={color} />
          <Stem x={x} y={noteY} top={stemTop} color={color} />
          {mode === 'flagged' && (
            <>
              <Flag x={x} top={stemTop} color={color} />
              {flagCount >= 2 && <Flag x={x} top={stemTop} offset={8} color={color} />}
            </>
          )}
        </g>
      ))}

      {/* Beams */}
      {mode === 'beamed' && (() => {
        const groups: number[][] = []
        for (let i = 0; i < positions.length; i += groupSize) {
          groups.push(positions.slice(i, i + groupSize))
        }
        return groups.map((grp, gi) => {
          const x1 = grp[0] + 6
          const x2 = grp[grp.length - 1] + 6
          return (
            <g key={gi}>
              <Beam x1={x1} x2={x2} y={stemTop} color={color} />
              {flagCount >= 2 && <Beam x1={x1} x2={x2} y={stemTop + 6} color={color} />}
            </g>
          )
        })
      })()}
    </g>
  )
}

// ── Count labels ─────────────────────────────────────────────────────────────

function CountLabels({ positions, labels, y, color = DIM_COLOR }: { positions: number[]; labels: string[]; y: number; color?: string }) {
  return (
    <g>
      {positions.map((x, i) => (
        <text key={i} x={x + 3} y={y} textAnchor="middle" fill={color} fontSize="9" fontFamily="system-ui" fontWeight="bold">
          {labels[i] ?? ''}
        </text>
      ))}
    </g>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function BeamingGuide() {
  const [showBeamed, setShowBeamed] = useState(true)
  const [playingRow, setPlayingRow] = useState<string | null>(null)

  const mode = showBeamed ? 'beamed' : 'flagged'

  // Eighth note positions (8 per bar, grouped in 2s for beaming)
  const eighthX = Array.from({ length: 8 }, (_, i) => 28 + i * 52)
  const eighthLabels = ['1', '+', '2', '+', '3', '+', '4', '+']

  // Sixteenth note positions (16 per bar, grouped in 4s for beaming)
  const sixteenthX = Array.from({ length: 16 }, (_, i) => 16 + i * 26)
  const sixteenthLabels = ['1', 'e', '+', 'a', '2', 'e', '+', 'a', '3', 'e', '+', 'a', '4', 'e', '+', 'a']

  function playRow(type: 'eighth' | 'sixteenth') {
    if (playingRow) return
    setPlayingRow(type)
    const count = type === 'eighth' ? 8 : 16
    const interval = type === 'eighth' ? 250 : 125 // at 120 BPM
    let step = 0

    function tick() {
      if (step >= count) {
        setPlayingRow(null)
        return
      }
      if (type === 'eighth') {
        step % 2 === 0 ? playAccentClick(0.3) : playHiHat(0.25)
      } else {
        step % 4 === 0 ? playAccentClick(0.3) : step % 2 === 0 ? playNormalClick(0.2) : playHiHat(0.15)
      }
      step++
      setTimeout(tick, interval)
    }
    tick()
  }

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-[#4b5563] uppercase tracking-wider">
          Flags vs Beams — How Grouped Notes Look
        </div>
        <button
          onClick={() => setShowBeamed(v => !v)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            showBeamed
              ? 'border-violet-700 text-violet-300 bg-violet-900/20'
              : 'border-[#2d3748] text-[#6b7280] hover:text-violet-400'
          }`}
        >
          {showBeamed ? '⚡ Showing beamed' : '🏳 Showing flagged'}
        </button>
      </div>

      <p className="text-sm text-[#6b7280]">
        Beams and flags mean <strong className="text-white">exactly the same thing</strong> musically.
        When notes are next to each other, their flags turn into connecting <em>beams</em> to make groups easier to read.
        Toggle above to compare.
      </p>

      {/* ── Eighth notes ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-[#94a3b8]">Eighth Notes</span>
          <span className="text-[10px] text-[#4b5563]">— 1 flag → 1 beam</span>
          <button
            onClick={() => playRow('eighth')}
            disabled={!!playingRow}
            className="ml-auto text-xs px-2 py-0.5 rounded border border-[#2d3748] text-[#6b7280] hover:text-white hover:border-violet-700 transition-colors disabled:opacity-30"
          >
            {playingRow === 'eighth' ? '♪ Playing…' : '▶ Listen'}
          </button>
        </div>
        <svg viewBox="0 0 450 85" className="w-full" style={{ maxHeight: '90px' }}>
          <rect width="450" height="85" fill="#0a0c13" rx="6" />
          {/* Staff line */}
          <line x1="10" y1="60" x2="440" y2="60" stroke="#1e2433" strokeWidth="1" />
          {/* Notes */}
          <NoteGroup
            positions={eighthX}
            noteY={56}
            stemTop={26}
            mode={mode as 'flagged' | 'beamed'}
            flagCount={1}
            groupSize={2}
          />
          {/* Count labels */}
          <CountLabels positions={eighthX} labels={eighthLabels} y={78} />
          {/* Beat markers */}
          {[0, 2, 4, 6].map(i => (
            <line key={i} x1={eighthX[i]} y1={65} x2={eighthX[i]} y2={68} stroke="#374151" strokeWidth={1} />
          ))}
        </svg>
      </div>

      {/* ── Sixteenth notes ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-[#94a3b8]">16th Notes</span>
          <span className="text-[10px] text-[#4b5563]">— 2 flags → 2 beams</span>
          <button
            onClick={() => playRow('sixteenth')}
            disabled={!!playingRow}
            className="ml-auto text-xs px-2 py-0.5 rounded border border-[#2d3748] text-[#6b7280] hover:text-white hover:border-violet-700 transition-colors disabled:opacity-30"
          >
            {playingRow === 'sixteenth' ? '♬ Playing…' : '▶ Listen'}
          </button>
        </div>
        <svg viewBox="0 0 450 85" className="w-full" style={{ maxHeight: '90px' }}>
          <rect width="450" height="85" fill="#0a0c13" rx="6" />
          {/* Staff line */}
          <line x1="10" y1="60" x2="440" y2="60" stroke="#1e2433" strokeWidth="1" />
          {/* Notes */}
          <NoteGroup
            positions={sixteenthX}
            noteY={56}
            stemTop={22}
            mode={mode as 'flagged' | 'beamed'}
            flagCount={2}
            groupSize={4}
          />
          {/* Count labels */}
          <CountLabels positions={sixteenthX} labels={sixteenthLabels} y={78} />
          {/* Beat markers */}
          {[0, 4, 8, 12].map(i => (
            <line key={i} x1={sixteenthX[i]} y1={65} x2={sixteenthX[i]} y2={68} stroke="#374151" strokeWidth={1} />
          ))}
        </svg>
      </div>

      {/* ── Key point ── */}
      <div className="bg-violet-900/10 border border-violet-800/30 rounded-lg p-3 text-sm text-[#94a3b8]">
        <strong className="text-violet-300">Key rule:</strong> In 4/4 time, beams group notes by the beat.
        Eighth notes beam in <strong className="text-white">pairs</strong> (2 per beat).
        Sixteenth notes beam in <strong className="text-white">groups of 4</strong> (4 per beat).
        This makes it instant to see where each beat starts.
      </div>

      {/* ── Quick reference table ── */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div className="bg-[#0a0c13] rounded-lg p-3 border border-[#1e2433]">
          <div className="text-white font-semibold mb-1">Quarter ♩</div>
          <div className="text-[#6b7280]">No flag, no beam</div>
          <div className="text-[#4b5563]">1 beat</div>
        </div>
        <div className="bg-[#0a0c13] rounded-lg p-3 border border-[#1e2433]">
          <div className="text-white font-semibold mb-1">Eighth ♪</div>
          <div className="text-[#6b7280]">1 flag → 1 beam</div>
          <div className="text-[#4b5563]">½ beat</div>
        </div>
        <div className="bg-[#0a0c13] rounded-lg p-3 border border-[#1e2433]">
          <div className="text-white font-semibold mb-1">Sixteenth 𝅘𝅥𝅯</div>
          <div className="text-[#6b7280]">2 flags → 2 beams</div>
          <div className="text-[#4b5563]">¼ beat</div>
        </div>
      </div>
    </div>
  )
}
