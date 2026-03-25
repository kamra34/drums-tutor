import { useState } from 'react'
import { playSnare, playKick, playHiHat, playAccentClick } from '../../services/clickSounds'

// ── Staff geometry ────────────────────────────────────────────────────────────
const LINE_SPACING = 18      // px between staff lines
const STAFF_TOP    = 88      // y of line 5 (top line)
const STAFF_LEFT   = 72      // x where staff begins (after clef)
const STAFF_RIGHT  = 560

// Five staff lines (y positions, top → bottom)
const STAFF_LINES = [0, 1, 2, 3, 4].map(i => STAFF_TOP + i * LINE_SPACING)
// → 88, 106, 124, 142, 160

// Named y positions
const Y = {
  // Above staff
  crashSpace:     STAFF_TOP - LINE_SPACING * 2 + LINE_SPACING / 2,  // 61
  crashLedger:    STAFF_TOP - LINE_SPACING * 2,                      // 52
  rideLedger:     STAFF_TOP - LINE_SPACING,                          // 70
  rideSpace:      STAFF_TOP - LINE_SPACING + LINE_SPACING / 2,       // 79
  hihatSpace:     STAFF_TOP - LINE_SPACING / 2,                      // 79 → use 79
  // On/between staff lines
  topSpace:       STAFF_TOP + LINE_SPACING / 2,                      // 97   (space 4 = top space) → Floor Tom
  line4:          STAFF_TOP + LINE_SPACING,                          // 106  → Tom 2 / mid tom
  space3:         STAFF_TOP + LINE_SPACING + LINE_SPACING / 2,       // 115  → Snare / Tom 1
  line3:          STAFF_TOP + LINE_SPACING * 2,                      // 124  (middle line)
  space2:         STAFF_TOP + LINE_SPACING * 2 + LINE_SPACING / 2,   // 133
  line2:          STAFF_TOP + LINE_SPACING * 3,                      // 142
  space1:         STAFF_TOP + LINE_SPACING * 3 + LINE_SPACING / 2,   // 151
  line1:          STAFF_TOP + LINE_SPACING * 4,                      // 160  (bottom line)
  // Below staff
  belowSpace:     STAFF_TOP + LINE_SPACING * 4 + LINE_SPACING / 2,   // 169
  kickLedger:     STAFF_TOP + LINE_SPACING * 5,                      // 178  → kick ledger line
  kickNote:       STAFF_TOP + LINE_SPACING * 5 + LINE_SPACING / 2,   // 187  → kick note
}

// ── Drum definitions ──────────────────────────────────────────────────────────
interface DrumDef {
  id:          string
  label:       string
  y:           number
  isCymbal:    boolean
  color:       string
  glow:        string
  ledgers:     number[]   // extra ledger line y positions
  xPos:        number     // horizontal position on the staff (0–1 = left–right)
  info:        string
  kitNote:     string
  playSound:   () => void
  marker?:     'open' | 'closed' | 'foot'  // additional symbol above/on the notehead
}

// Positions per Hal Leonard Drum Method / PAS standard:
//
//  Crash:    ON 1st ledger line above staff (line 6)   = y 70
//  Hi-Hat:   Space above top line (space 5)             = y 79
//  Ride:     ON top staff line (line 5)                 = y 88
//  Tom 1:    Top space (space 4)                        = y 97
//  Tom 2:    4th line                                   = y 106
//  Snare:    3rd space (space 3)                        = y 115
//  Floor Tom: 2nd space (space 2)                       = y 133
//  Kick:     1st space (space 1)                        = y 151
//  HH Pedal: Below bottom line                          = y 169

const DRUMS: DrumDef[] = [
  {
    id: 'crash',
    label: 'Crash',
    y: Y.rideLedger,                    // ON the 1st ledger line above (y=70)
    isCymbal: true,
    color: '#9ca3af',
    glow: '#f3f4f6',
    ledgers: [Y.rideLedger],            // one ledger line
    xPos: 0.06,
    info: 'X notehead on the first ledger line above the staff. Loud accent cymbal — used to mark crashes at important moments like chorus entries and fill endings.',
    kitNote: '✓ Alesis Nitro Max: crash sits on the ledger line above the staff. One of the most recognisable cymbal sounds.',
    playSound: () => playAccentClick(0.7),
  },
  {
    id: 'hihat',
    label: 'HH +',
    y: Y.hihatSpace,                    // space above top line (y=79)
    isCymbal: true,
    color: '#4ade80',
    glow: '#86efac',
    ledgers: [],
    xPos: 0.16,
    marker: 'closed',
    info: 'X notehead in the space above the top staff line, with a "+" above it. Foot pressed on pedal = tight, crisp "tss." This is the default hi-hat sound in most rock/pop beats.',
    kitNote: '✓ Alesis Nitro Max: "+" means your left foot clamps the hi-hat cymbals together while you strike with a stick.',
    playSound: () => playHiHat(0.4),
  },
  {
    id: 'hihat-open',
    label: 'HH o',
    y: Y.hihatSpace,                    // same space, different marker
    isCymbal: true,
    color: '#22d3ee',
    glow: '#a5f3fc',
    ledgers: [],
    xPos: 0.26,
    marker: 'open',
    info: 'X notehead in the same position as closed hi-hat, but with a small "o" (circle) above it. Foot OFF the pedal — the cymbals ring with a washy sustain. Close again when you see "+".',
    kitNote: '✓ Alesis Nitro Max: lift your left foot, strike the hi-hat pad. The sustained "tshhh" adds energy to fills and transitions.',
    playSound: () => { playHiHat(0.6); setTimeout(() => playHiHat(0.3), 100) },
  },
  {
    id: 'ride',
    label: 'Ride',
    y: STAFF_TOP,                       // ON the top staff line (line 5, y=88)
    isCymbal: true,
    color: '#9ca3af',
    glow: '#f3f4f6',
    ledgers: [],                        // no ledger — it's ON a staff line
    xPos: 0.35,
    info: 'X notehead on the top staff line (line 5). The ride cymbal is used for steady time-keeping with a clear "ping." The ride bell (centre dome) is sometimes shown as a diamond notehead.',
    kitNote: '✓ Alesis Nitro Max: ride sits on the top line of the staff — lower than hi-hat and crash. Different from crash by position, not symbol.',
    playSound: () => playAccentClick(0.4),
  },
  {
    id: 'tom1',
    label: 'Tom 1',
    y: Y.topSpace,                      // top space (space 4, y=97)
    isCymbal: false,
    color: '#fb923c',
    glow: '#fed7aa',
    ledgers: [],
    xPos: 0.44,
    info: 'Oval notehead in the top space (between lines 4 and 5). The highest-pitched rack tom — first in a descending tom fill.',
    kitNote: '✓ Alesis Nitro Max Tom 1 (high rack tom) — sits in the top space of the staff.',
    playSound: () => playSnare(0.18),
  },
  {
    id: 'tom2',
    label: 'Tom 2',
    y: Y.line4,                         // 4th line (y=106)
    isCymbal: false,
    color: '#a78bfa',
    glow: '#e9d5ff',
    ledgers: [],
    xPos: 0.52,
    info: 'Oval notehead on the 4th line. The mid-pitched rack tom — middle of a descending tom run.',
    kitNote: '✓ Alesis Nitro Max Tom 2 (mid rack tom) — on the 4th line of the staff.',
    playSound: () => playSnare(0.24),
  },
  {
    id: 'snare',
    label: 'Snare',
    y: Y.space3,                        // 3rd space (y=115)
    isCymbal: false,
    color: '#60a5fa',
    glow: '#dbeafe',
    ledgers: [],
    xPos: 0.60,
    info: 'Oval notehead in the 3rd space (between lines 3 and 4). The snare is the backbeat drum — almost always on beats 2 and 4.',
    kitNote: '✓ Snare drum — the most important drum in any kit. 3rd space is the universal standard position.',
    playSound: () => playSnare(0.6),
  },
  {
    id: 'floortom',
    label: 'Fl. Tom',
    y: Y.space2,                        // 2nd space (y=133)
    isCymbal: false,
    color: '#f472b6',
    glow: '#fce7f3',
    ledgers: [],
    xPos: 0.68,
    info: 'Oval notehead in the 2nd space (between lines 2 and 3). The floor tom (Tom 3) — deepest tom, last stop in a descending fill.',
    kitNote: '✓ Alesis Nitro Max Floor Tom (Tom 3) — in the 2nd space, below the snare.',
    playSound: () => playSnare(0.3),
  },
  {
    id: 'kick',
    label: 'Kick',
    y: Y.space1,                        // 1st space (y=151) — INSIDE the staff
    isCymbal: false,
    color: '#fbbf24',
    glow: '#fef3c7',
    ledgers: [],                        // no ledger line needed — it's in space 1
    xPos: 0.78,
    info: 'Oval notehead in the 1st space (between lines 1 and 2). Played with your right foot pedal — the deepest, most powerful sound on the kit.',
    kitNote: '✓ Bass/kick drum — in the bottom space of the staff. Played with your right foot.',
    playSound: () => playKick(0.7),
  },
  {
    id: 'hihat-pedal',
    label: 'HH Foot',
    y: Y.belowSpace,                    // below the bottom line (y=169)
    isCymbal: true,
    color: '#4ade80',
    glow: '#86efac',
    ledgers: [],
    xPos: 0.90,
    marker: 'foot',
    info: 'X notehead below the bottom staff line. Left foot alone (no stick) — closing the hi-hat cymbals produces a soft "chick." Common in jazz and funk.',
    kitNote: '✓ Alesis Nitro Max: press the hi-hat pedal with your left foot WITHOUT striking the pad.',
    playSound: () => playHiHat(0.15),
  },
]

// ── Helper renderers ──────────────────────────────────────────────────────────
function noteX(drum: DrumDef): number {
  return STAFF_LEFT + drum.xPos * (STAFF_RIGHT - STAFF_LEFT)
}

function XNotehead({ x, y, size = 7, color }: { x: number; y: number; size?: number; color: string }) {
  return (
    <g>
      <line x1={x - size} y1={y - size} x2={x + size} y2={y + size} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1={x + size} y1={y - size} x2={x - size} y2={y + size} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  )
}

function OvalNotehead({ x, y, color, filled = true }: { x: number; y: number; color: string; filled?: boolean }) {
  return (
    <ellipse
      cx={x} cy={y}
      rx={8} ry={5.5}
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={filled ? 0 : 2}
      transform={`rotate(-15 ${x} ${y})`}
    />
  )
}

function Stem({ x, noteY, up = true }: { x: number; noteY: number; up?: boolean }) {
  const length = 34
  return (
    <line
      x1={x + 7} y1={noteY}
      x2={x + 7} y2={up ? noteY - length : noteY + length}
      stroke="#94a3b8" strokeWidth="1.5"
    />
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function DrumStaffDiagram() {
  const [active, setActive] = useState<string | null>(null)
  const [showKit, setShowKit] = useState(false)

  const activeDrum = DRUMS.find(d => d.id === active)

  function handleClick(drum: DrumDef) {
    drum.playSound()
    setActive(active === drum.id ? null : drum.id)
  }

  const svgHeight = Y.belowSpace + 50  // lowest note is HH pedal at 169

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-[#4b5563] uppercase tracking-wider">
          Drum Staff — click any note to hear and learn
        </div>
        <button
          onClick={() => setShowKit(v => !v)}
          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${showKit ? 'border-violet-700 text-violet-300 bg-violet-900/20' : 'border-[#2d3748] text-[#6b7280] hover:text-violet-400'}`}
        >
          🥁 Alesis Nitro Max
        </button>
      </div>

      <svg
        viewBox={`0 0 ${STAFF_RIGHT + 20} ${svgHeight}`}
        className="w-full"
        style={{ maxHeight: '290px' }}
      >
        {/* ── Background ── */}
        <rect width={STAFF_RIGHT + 20} height={svgHeight} fill="#0a0c13" rx="8" />

        {/* ── Percussion clef (two vertical bars) ── */}
        <rect x={30} y={STAFF_TOP - 4} width={5}  height={LINE_SPACING * 4 + 8} fill="#6b7280" rx="1" />
        <rect x={40} y={STAFF_TOP - 4} width={5}  height={LINE_SPACING * 4 + 8} fill="#6b7280" rx="1" />

        {/* ── Five staff lines ── */}
        {STAFF_LINES.map((y, i) => (
          <line key={i} x1={STAFF_LEFT} y1={y} x2={STAFF_RIGHT} y2={y}
            stroke="#1e2433" strokeWidth="1.5" />
        ))}

        {/* ── Bar line at the end ── */}
        <line x1={STAFF_RIGHT} y1={STAFF_TOP} x2={STAFF_RIGHT} y2={STAFF_TOP + LINE_SPACING * 4}
          stroke="#2d3748" strokeWidth="2" />

        {/* ── Beat subdivisions guide (subtle) ── */}
        {[0.25, 0.5, 0.75].map(frac => {
          const x = STAFF_LEFT + frac * (STAFF_RIGHT - STAFF_LEFT)
          return (
            <line key={frac} x1={x} y1={STAFF_TOP} x2={x} y2={STAFF_TOP + LINE_SPACING * 4}
              stroke="#1a1f2e" strokeWidth="1" strokeDasharray="3,3" />
          )
        })}

        {/* ── Space labels (subtle, left side) ── */}
        <text x={58} y={Y.topSpace + 4} textAnchor="end" fill="#2d3748" fontSize="8" fontFamily="system-ui">4</text>
        <text x={58} y={Y.space3  + 4} textAnchor="end" fill="#2d3748" fontSize="8" fontFamily="system-ui">3</text>
        <text x={58} y={Y.space2  + 4} textAnchor="end" fill="#2d3748" fontSize="8" fontFamily="system-ui">2</text>
        <text x={58} y={Y.space1  + 4} textAnchor="end" fill="#2d3748" fontSize="8" fontFamily="system-ui">1</text>

        {/* ── Drums ── */}
        {DRUMS.map(drum => {
          const x = noteX(drum)
          const isActive = active === drum.id
          const noteColor = isActive ? drum.glow : drum.color
          const opacity = active && !isActive ? 0.3 : 1

          return (
            <g
              key={drum.id}
              style={{ cursor: 'pointer', opacity }}
              onClick={() => handleClick(drum)}
            >
              {/* Glow halo when active */}
              {isActive && (
                <circle cx={x} cy={drum.y} r="18"
                  fill={drum.color} opacity="0.12" />
              )}

              {/* Ledger lines */}
              {drum.ledgers.map(ly => (
                <line key={ly}
                  x1={x - 12} y1={ly} x2={x + 20} y2={ly}
                  stroke={isActive ? drum.glow : '#374151'}
                  strokeWidth="1.5"
                />
              ))}

              {/* Stem */}
              <Stem x={x} noteY={drum.y} up={drum.y >= STAFF_LINES[2]} />

              {/* Note head */}
              {drum.isCymbal
                ? <XNotehead x={x} y={drum.y} color={noteColor} />
                : <OvalNotehead x={x} y={drum.y} color={noteColor} />
              }

              {/* Marker symbol above/near note (open hi-hat circle, closed +, foot label) */}
              {drum.marker === 'open' && (
                <circle cx={x} cy={drum.y - 16} r={5} fill="none" stroke={noteColor} strokeWidth={1.5} />
              )}
              {drum.marker === 'closed' && (
                <g>
                  <line x1={x - 4} y1={drum.y - 16} x2={x + 4} y2={drum.y - 16} stroke={noteColor} strokeWidth={2} strokeLinecap="round" />
                  <line x1={x} y1={drum.y - 20} x2={x} y2={drum.y - 12} stroke={noteColor} strokeWidth={2} strokeLinecap="round" />
                </g>
              )}
              {drum.marker === 'foot' && (
                <text x={x} y={drum.y - 12} textAnchor="middle" fill={noteColor} fontSize="7" fontFamily="system-ui" fontWeight="bold">foot</text>
              )}

              {/* Label below */}
              <text
                x={x + 4} y={svgHeight - 18}
                textAnchor="middle"
                fill={isActive ? drum.glow : '#4b5563'}
                fontSize="9"
                fontWeight={isActive ? 'bold' : 'normal'}
                fontFamily="system-ui"
              >
                {drum.label}
              </text>

              {/* Vertical dotted guide to label */}
              <line
                x1={x + 4} y1={drum.y + 8}
                x2={x + 4} y2={svgHeight - 26}
                stroke={isActive ? drum.color : '#1e2433'}
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            </g>
          )
        })}

        {/* ── X vs oval legend ── */}
        <XNotehead x={STAFF_RIGHT - 120} y={STAFF_TOP - 28} color="#6b7280" size={5} />
        <text x={STAFF_RIGHT - 108} y={STAFF_TOP - 24} fill="#4b5563" fontSize="8" fontFamily="system-ui">= cymbal</text>
        <OvalNotehead x={STAFF_RIGHT - 50} y={STAFF_TOP - 28} color="#6b7280" />
        <text x={STAFF_RIGHT - 38} y={STAFF_TOP - 24} fill="#4b5563" fontSize="8" fontFamily="system-ui">= drum</text>
      </svg>

      {/* ── Info panel ── */}
      {activeDrum ? (
        <div className="border border-[#1e2433] rounded-xl p-4 flex gap-4 items-start">
          <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: activeDrum.color }} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white mb-1">{activeDrum.label}</div>
            <p className="text-sm text-[#94a3b8] leading-relaxed mb-2">{activeDrum.info}</p>
            {showKit && (
              <div className="text-xs text-violet-300 bg-violet-900/20 border border-violet-800/40 rounded-lg px-3 py-2">
                {activeDrum.kitNote}
              </div>
            )}
          </div>
          <button onClick={() => { activeDrum.playSound(); }} className="flex-shrink-0 text-lg" title="Play sound">
            🔊
          </button>
        </div>
      ) : (
        <div className="text-sm text-[#4b5563] text-center py-1">
          Click any note head to hear its sound and learn where it sits on the staff.
          {showKit && <span className="text-violet-400 ml-2">Alesis Nitro Max notes highlighted.</span>}
        </div>
      )}

      {/* ── Alesis Nitro Max overview (when toggled) ── */}
      {showKit && !activeDrum && (
        <div className="bg-violet-900/10 border border-violet-800/30 rounded-xl p-4 text-sm space-y-3">
          <div className="font-semibold text-violet-300 text-xs uppercase tracking-wider">
            Your Alesis Nitro Max — all pieces on the staff
          </div>
          <p className="text-[#94a3b8]">
            Your kit has <strong className="text-white">cymbals</strong> (Hi-Hat closed/open, Crash, Ride, HH Pedal) all shown as <em>x noteheads</em>,
            and <strong className="text-white">drums</strong> (Tom 1, Tom 2, Snare, Floor Tom, Kick) with <em>oval noteheads</em>.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-[#4b5563] mb-1.5">Cymbals (x noteheads)</div>
              <div className="flex flex-col gap-1.5">
                {['crash', 'hihat', 'hihat-open', 'ride', 'hihat-pedal'].map(id => {
                  const d = DRUMS.find(x => x.id === id)!
                  return (
                    <button key={id} onClick={() => handleClick(d)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#1e2433] hover:border-violet-700 text-sm text-[#94a3b8] hover:text-white transition-colors text-left">
                      <span className="text-xs font-bold" style={{ color: d.color }}>×</span>
                      {d.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#4b5563] mb-1.5">Drums (oval noteheads)</div>
              <div className="flex flex-col gap-1.5">
                {['tom1', 'tom2', 'snare', 'floortom', 'kick'].map(id => {
                  const d = DRUMS.find(x => x.id === id)!
                  return (
                    <button key={id} onClick={() => handleClick(d)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#1e2433] hover:border-violet-700 text-sm text-[#94a3b8] hover:text-white transition-colors text-left">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      {d.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
