import { useState, useCallback, useRef, useEffect } from 'react'
import { playPianoNote, preloadOctaves } from '@piano/services/pianoSounds'

// ── Types ────────────────────────────────────────────────────────────────────

interface KeyDef {
  note: string   // e.g. "C4"
  x: number
  isBlack: boolean
}

interface Props {
  startOctave?: number
  octaves?: number
  highlightKeys?: string[]          // notes to highlight e.g. ["C4","E4","G4"]
  fingerNumbers?: Record<string, number>  // note → finger number
  highlightColor?: string
  label?: string
  showNoteNames?: boolean
  interactive?: boolean
}

// ── Dimensions ───────────────────────────────────────────────────────────────

const WHITE_W = 36
const WHITE_H = 140
const BLACK_W = 22
const BLACK_H = 88
const GAP = 1

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const BLACK_OFFSETS: Record<string, number> = {
  C: 0.65, D: 0.65, F: 0.65, G: 0.65, A: 0.65,
}

function buildKeys(startOctave: number, octaves: number): KeyDef[] {
  const keys: KeyDef[] = []
  let x = 0
  for (let oct = startOctave; oct < startOctave + octaves; oct++) {
    for (const wn of WHITE_NOTES) {
      keys.push({ note: `${wn}${oct}`, x, isBlack: false })
      if (BLACK_OFFSETS[wn] !== undefined) {
        keys.push({
          note: `${wn}#${oct}`,
          x: x + WHITE_W * BLACK_OFFSETS[wn],
          isBlack: true,
        })
      }
      x += WHITE_W + GAP
    }
  }
  // Add final C
  keys.push({ note: `C${startOctave + octaves}`, x, isBlack: false })
  return keys
}

// ── Component ────────────────────────────────────────────────────────────────

export default function KeyboardDiagram({
  startOctave = 3,
  octaves = 2,
  highlightKeys = [],
  fingerNumbers = {},
  highlightColor = '#a78bfa',
  label,
  showNoteNames = true,
  interactive = true,
}: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Preload piano samples on mount
  useEffect(() => {
    preloadOctaves(startOctave, octaves)
  }, [startOctave, octaves])

  const keys = buildKeys(startOctave, octaves)
  const whites = keys.filter((k) => !k.isBlack)
  const blacks = keys.filter((k) => k.isBlack)
  const totalW = whites.length * (WHITE_W + GAP) - GAP
  const svgW = totalW + 4
  const svgH = WHITE_H + 40

  const isHighlighted = useCallback(
    (note: string) => highlightKeys.some((h) => normalise(h) === normalise(note)),
    [highlightKeys],
  )

  function handleClick(note: string) {
    if (!interactive) return
    playPianoNote(note)
    setActiveKey(note)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setActiveKey(null), 600)
  }

  return (
    <div className="my-6 rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: '#0d1117' }}>
      {label && (
        <div className="px-5 pt-4 pb-2">
          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: highlightColor }}>
            {label}
          </span>
        </div>
      )}

      <div className="px-4 pb-5 pt-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="mx-auto"
          style={{ maxWidth: `${svgW}px`, width: '100%', height: 'auto' }}
        >
          <g transform="translate(2, 2)">
            {/* White keys */}
            {whites.map((k) => {
              const hl = isHighlighted(k.note)
              const active = activeKey === k.note
              const finger = fingerNumbers[k.note]
              return (
                <g key={k.note} onClick={() => handleClick(k.note)} style={{ cursor: interactive ? 'pointer' : 'default' }}>
                  <rect
                    x={k.x}
                    y={0}
                    width={WHITE_W}
                    height={WHITE_H}
                    rx={3}
                    fill={active ? highlightColor : hl ? `${highlightColor}30` : '#f0f0f0'}
                    stroke={hl ? highlightColor : '#999'}
                    strokeWidth={hl ? 1.5 : 0.5}
                  />
                  {/* Note name */}
                  {showNoteNames && (
                    <text
                      x={k.x + WHITE_W / 2}
                      y={WHITE_H - 8}
                      textAnchor="middle"
                      fill={hl ? highlightColor : '#888'}
                      fontSize={10}
                      fontWeight={hl ? 700 : 400}
                      fontFamily="system-ui"
                    >
                      {k.note}
                    </text>
                  )}
                  {/* Highlight dot */}
                  {hl && !active && (
                    <circle
                      cx={k.x + WHITE_W / 2}
                      cy={WHITE_H - 28}
                      r={6}
                      fill={highlightColor}
                      opacity={0.9}
                    />
                  )}
                  {/* Finger number */}
                  {finger != null && (
                    <text
                      x={k.x + WHITE_W / 2}
                      y={WHITE_H + 16}
                      textAnchor="middle"
                      fill={highlightColor}
                      fontSize={13}
                      fontWeight={700}
                      fontFamily="system-ui"
                    >
                      {finger}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Black keys */}
            {blacks.map((k) => {
              const hl = isHighlighted(k.note)
              const active = activeKey === k.note
              return (
                <g key={k.note} onClick={() => handleClick(k.note)} style={{ cursor: interactive ? 'pointer' : 'default' }}>
                  <rect
                    x={k.x}
                    y={0}
                    width={BLACK_W}
                    height={BLACK_H}
                    rx={2}
                    fill={active ? highlightColor : hl ? `${highlightColor}cc` : '#1a1a1a'}
                    stroke={hl ? highlightColor : '#000'}
                    strokeWidth={hl ? 1.5 : 0.5}
                  />
                  {hl && !active && (
                    <circle
                      cx={k.x + BLACK_W / 2}
                      cy={BLACK_H - 14}
                      r={5}
                      fill={highlightColor}
                      opacity={0.9}
                    />
                  )}
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {interactive && (
        <div className="px-5 pb-3 text-[11px] text-[#4b5563]">
          Click any key to hear its sound
        </div>
      )}
    </div>
  )
}

// Normalise note names for comparison (e.g. treat "Db4" and "C#4" loosely)
function normalise(n: string): string {
  return n.replace(/\s/g, '')
}
