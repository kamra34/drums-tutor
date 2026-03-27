import { useState } from 'react'
import { playSnare, playHiHat, playAccentClick, playKick } from '@drums/services/clickSounds'

// ── Articulation definitions ─────────────────────────────────────────────────

interface ArticulationDef {
  id: string
  name: string
  category: 'dynamics' | 'technique' | 'cymbal' | 'structure'
  description: string
  howItLooks: string
  playSound?: () => void
}

const ARTICULATIONS: ArticulationDef[] = [
  // ─ Technique marks
  {
    id: 'accent',
    name: 'Accent  >',
    category: 'technique',
    description: 'Hit noticeably harder than the surrounding notes. The ">" mark sits above or below the notehead.',
    howItLooks: 'A small ">" (greater-than sign) above or below the note.',
    playSound: () => playSnare(0.8),
  },
  {
    id: 'ghost',
    name: 'Ghost Note  ( )',
    category: 'technique',
    description: 'Play extremely softly — barely touching the head. Creates a subtle texture, especially on the snare. Ghost notes are the quiet "filler" between loud backbeats.',
    howItLooks: 'The notehead is wrapped in parentheses: (•)',
    playSound: () => playSnare(0.08),
  },
  {
    id: 'flam',
    name: 'Flam',
    category: 'technique',
    description: 'A grace note played just before the main note. One hand hits softly a split second before the other hits at full volume, creating a fatter "flam" sound.',
    howItLooks: 'A small grace note (tiny notehead) attached to the main note by a slur.',
    playSound: () => { playSnare(0.1); setTimeout(() => playSnare(0.6), 30) },
  },
  {
    id: 'drag',
    name: 'Drag (Ruff)',
    category: 'technique',
    description: 'Two grace notes before the main note. A quick "duh-duh-DAH" pattern. Used to add weight to a hit.',
    howItLooks: 'Two small grace notes connected to the main note.',
    playSound: () => { playSnare(0.08); setTimeout(() => playSnare(0.08), 25); setTimeout(() => playSnare(0.6), 60) },
  },
  {
    id: 'buzzroll',
    name: 'Buzz Roll  Z',
    category: 'technique',
    description: 'Press the stick into the head and let it bounce rapidly, creating a sustained "buzz." Notated with a Z on the stem or three slashes through it.',
    howItLooks: 'A "Z" drawn through the note\'s stem, or three diagonal slashes.',
    playSound: () => {
      for (let i = 0; i < 6; i++) setTimeout(() => playSnare(0.12), i * 40)
    },
  },
  {
    id: 'rimshot',
    name: 'Rim Shot / Cross-stick',
    category: 'technique',
    description: 'Rim shot: hit the head and rim simultaneously for a loud crack. Cross-stick (or side stick): lay the stick across the head and tap the rim for a "click" sound.',
    howItLooks: 'Rim shot: sometimes an "x" on the snare line. Cross-stick: an "x" notehead on the snare space, or a note with a "+" above.',
    playSound: () => playAccentClick(0.5),
  },

  // ─ Cymbal notation
  {
    id: 'hh-closed',
    name: 'Closed Hi-Hat  +',
    category: 'cymbal',
    description: 'Press your left foot on the hi-hat pedal to clamp the cymbals together, then strike with a stick. Produces a tight, crisp "tss" sound.',
    howItLooks: 'An x notehead above the staff with a "+" symbol above it.',
    playSound: () => playHiHat(0.4),
  },
  {
    id: 'hh-open',
    name: 'Open Hi-Hat  o',
    category: 'cymbal',
    description: 'Release the foot pedal so the cymbals are apart, then strike. The sound sustains with a washy "tshhh." Close it again when you see the next "+" mark.',
    howItLooks: 'An x notehead above the staff with a small "o" (circle) above it.',
    playSound: () => { playHiHat(0.6); setTimeout(() => playHiHat(0.3), 100) },
  },
  {
    id: 'hh-pedal',
    name: 'Hi-Hat Foot (pedal)',
    category: 'cymbal',
    description: 'Close the hi-hat with just your left foot, without striking with a stick. Creates a soft "chick" sound on the off-beats. Common in jazz and funk.',
    howItLooks: 'An x notehead BELOW the staff (near the kick drum area) — represents the left foot alone.',
    playSound: () => playHiHat(0.15),
  },
  {
    id: 'bell',
    name: 'Ride Bell',
    category: 'cymbal',
    description: 'Strike the raised bell (dome) in the centre of the ride cymbal. Produces a loud, cutting "ping" that cuts through a mix.',
    howItLooks: 'A diamond-shaped notehead (◆) on the ride cymbal line, or a circled x.',
    playSound: () => playAccentClick(0.6),
  },

  // ─ Dynamics
  {
    id: 'pp',
    name: 'pp (pianissimo)',
    category: 'dynamics',
    description: 'Very soft. Play as quietly as you can while still producing a clear sound.',
    howItLooks: 'The letters "pp" written below the staff in italic.',
  },
  {
    id: 'p',
    name: 'p (piano)',
    category: 'dynamics',
    description: 'Soft. A gentle, subdued volume.',
    howItLooks: 'The letter "p" below the staff in italic.',
  },
  {
    id: 'mp',
    name: 'mp (mezzo-piano)',
    category: 'dynamics',
    description: 'Moderately soft. A comfortable "default" quiet volume.',
    howItLooks: '"mp" below the staff.',
  },
  {
    id: 'mf',
    name: 'mf (mezzo-forte)',
    category: 'dynamics',
    description: 'Moderately loud. The most common default dynamic — a comfortable, confident volume.',
    howItLooks: '"mf" below the staff.',
  },
  {
    id: 'f',
    name: 'f (forte)',
    category: 'dynamics',
    description: 'Loud. Play with confidence and power.',
    howItLooks: 'The letter "f" below the staff.',
  },
  {
    id: 'ff',
    name: 'ff (fortissimo)',
    category: 'dynamics',
    description: 'Very loud. Maximum power — crashes, accents, and intense moments.',
    howItLooks: '"ff" below the staff.',
  },
  {
    id: 'cresc',
    name: 'Crescendo  <',
    category: 'dynamics',
    description: 'Gradually get louder over the marked passage. Shown as an opening hairpin or the word "cresc."',
    howItLooks: 'A long "<" (opening angle) stretching under several notes.',
  },
  {
    id: 'decresc',
    name: 'Decrescendo  >',
    category: 'dynamics',
    description: 'Gradually get softer. Also called "diminuendo." Shown as a closing hairpin.',
    howItLooks: 'A long ">" (closing angle) stretching under several notes.',
  },

  // ─ Structure
  {
    id: 'repeat',
    name: 'Repeat Signs  ||: :||',
    category: 'structure',
    description: 'Go back to the start repeat sign (||:) and play the section again. If there\'s no start sign, go back to the beginning.',
    howItLooks: 'Double bar lines with two dots — dots face inward toward the repeated section.',
  },
  {
    id: 'endings',
    name: '1st & 2nd Endings',
    category: 'structure',
    description: 'Play the "1." ending the first time through, then on the repeat skip to the "2." ending instead.',
    howItLooks: 'Bracketed sections above the staff labeled "1." and "2."',
  },
  {
    id: 'ds-dc',
    name: 'D.S. / D.C. / Coda',
    category: 'structure',
    description: 'D.S. (Dal Segno) = go back to the 𝄋 sign. D.C. (Da Capo) = go back to the very beginning. Coda (⊕) = jump to the coda (ending section).',
    howItLooks: 'Text markings like "D.S. al Coda" at the end of a section.',
  },
  {
    id: 'triplet',
    name: 'Triplet  ³',
    category: 'structure',
    description: 'Three notes played in the time of two. Eighth-note triplets: three notes per beat instead of two. Creates a "rolling" or "shuffle" feel.',
    howItLooks: 'A bracket or slur with a "3" above a group of three notes.',
    playSound: () => {
      const ms = 500 / 3 // triplet at 120 BPM
      playSnare(0.4)
      setTimeout(() => playSnare(0.25), ms)
      setTimeout(() => playSnare(0.25), ms * 2)
    },
  },
]

// ── Category metadata ────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'technique', label: 'Technique Marks', icon: '🥢' },
  { id: 'cymbal', label: 'Cymbal Notation', icon: '🔔' },
  { id: 'dynamics', label: 'Dynamics', icon: '🔊' },
  { id: 'structure', label: 'Structure & Navigation', icon: '🔁' },
] as const

// ── SVG mini-diagrams for key symbols ────────────────────────────────────────

function AccentSVG() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <ellipse cx={20} cy={28} rx={7} ry={4.5} fill="#94a3b8" transform="rotate(-15 20 28)" />
      <line x1={26} y1={26} x2={26} y2={8} stroke="#94a3b8" strokeWidth={1.5} />
      <path d="M 14 6 L 22 10 L 14 14" fill="none" stroke="#fbbf24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GhostSVG() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <text x={8} y={32} fill="#6b7280" fontSize="18" fontFamily="system-ui">(</text>
      <ellipse cx={20} cy={28} rx={6} ry={4} fill="#6b7280" transform="rotate(-15 20 28)" />
      <text x={27} y={32} fill="#6b7280" fontSize="18" fontFamily="system-ui">)</text>
      <line x1={25} y1={26} x2={25} y2={10} stroke="#6b7280" strokeWidth={1.5} />
    </svg>
  )
}

function OpenHiHatSVG() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      {/* x notehead */}
      <line x1={14} y1={22} x2={26} y2={34} stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={26} y1={22} x2={14} y2={34} stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" />
      {/* stem */}
      <line x1={26} y1={24} x2={26} y2={6} stroke="#4ade80" strokeWidth={1.5} />
      {/* o above */}
      <circle cx={20} cy={10} r={5} fill="none" stroke="#4ade80" strokeWidth={1.5} />
    </svg>
  )
}

function ClosedHiHatSVG() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      {/* x notehead */}
      <line x1={14} y1={22} x2={26} y2={34} stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={26} y1={22} x2={14} y2={34} stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round" />
      {/* stem */}
      <line x1={26} y1={24} x2={26} y2={6} stroke="#94a3b8" strokeWidth={1.5} />
      {/* + above */}
      <line x1={16} y1={10} x2={24} y2={10} stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" />
      <line x1={20} y1={6} x2={20} y2={14} stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

function HiHatPedalSVG() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      {/* Staff line */}
      <line x1={4} y1={14} x2={36} y2={14} stroke="#1e2433" strokeWidth={1} />
      {/* x notehead BELOW the staff */}
      <line x1={14} y1={22} x2={26} y2={34} stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={26} y1={22} x2={14} y2={34} stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" />
      {/* stem goes DOWN */}
      <line x1={14} y1={32} x2={14} y2={38} stroke="#4ade80" strokeWidth={1.5} />
      {/* label */}
      <text x={20} y={10} textAnchor="middle" fill="#4b5563" fontSize="7" fontFamily="system-ui">foot</text>
    </svg>
  )
}

function DynamicsSVG() {
  return (
    <svg width="120" height="30" viewBox="0 0 120 30">
      {['pp', 'p', 'mp', 'mf', 'f', 'ff'].map((d, i) => (
        <text key={d} x={10 + i * 20} y={20} fill={`hsl(${270 - i * 30}, 70%, ${50 + i * 5}%)`}
          fontSize="12" fontFamily="serif" fontStyle="italic" fontWeight="bold">{d}</text>
      ))}
      {/* Arrow: soft to loud */}
      <line x1={8} y1={28} x2={112} y2={28} stroke="#374151" strokeWidth={1} />
      <text x={4} y={28} fill="#4b5563" fontSize="6" fontFamily="system-ui">soft</text>
      <text x={104} y={28} fill="#4b5563" fontSize="6" fontFamily="system-ui">loud</text>
    </svg>
  )
}

function RepeatSignSVG() {
  return (
    <svg width="80" height="36" viewBox="0 0 80 36">
      {/* Staff lines */}
      {[0, 1, 2, 3, 4].map(i => (
        <line key={i} x1={4} y1={4 + i * 7} x2={76} y2={4 + i * 7} stroke="#1e2433" strokeWidth={1} />
      ))}
      {/* Start repeat ||: */}
      <line x1={10} y1={4} x2={10} y2={32} stroke="#94a3b8" strokeWidth={3} />
      <line x1={15} y1={4} x2={15} y2={32} stroke="#94a3b8" strokeWidth={1} />
      <circle cx={19} cy={14} r={2} fill="#a78bfa" />
      <circle cx={19} cy={22} r={2} fill="#a78bfa" />
      {/* End repeat :|| */}
      <circle cx={61} cy={14} r={2} fill="#a78bfa" />
      <circle cx={61} cy={22} r={2} fill="#a78bfa" />
      <line x1={65} y1={4} x2={65} y2={32} stroke="#94a3b8" strokeWidth={1} />
      <line x1={70} y1={4} x2={70} y2={32} stroke="#94a3b8" strokeWidth={3} />
    </svg>
  )
}

function getSymbolSVG(id: string) {
  switch (id) {
    case 'accent': return <AccentSVG />
    case 'ghost': return <GhostSVG />
    case 'hh-open': return <OpenHiHatSVG />
    case 'hh-closed': return <ClosedHiHatSVG />
    case 'hh-pedal': return <HiHatPedalSVG />
    case 'repeat': return <RepeatSignSVG />
    default: return null
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DrumArticulationsGuide() {
  const [activeCategory, setActiveCategory] = useState<string>('technique')
  const [activeItem, setActiveItem] = useState<string | null>(null)

  const filtered = ARTICULATIONS.filter(a => a.category === activeCategory)
  const activeArticulation = ARTICULATIONS.find(a => a.id === activeItem)

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6 space-y-4">
      <div className="text-xs text-[#4b5563] uppercase tracking-wider">
        Drum Notation Symbols — Complete Reference
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setActiveItem(null) }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              activeCategory === cat.id
                ? 'border-violet-700 text-violet-300 bg-violet-900/20'
                : 'border-[#2d3748] text-[#6b7280] hover:text-violet-400'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Dynamics visual (show when dynamics tab is active) */}
      {activeCategory === 'dynamics' && (
        <div className="flex justify-center py-2">
          <DynamicsSVG />
        </div>
      )}

      {/* Item list */}
      <div className="space-y-1.5">
        {filtered.map(art => {
          const isActive = activeItem === art.id
          return (
            <div
              key={art.id}
              className={`rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? 'border-violet-700/50 bg-[#13101e]'
                  : 'border-[#1e2433] hover:border-[#2d3748] bg-[#0d1117]'
              }`}
              onClick={() => setActiveItem(isActive ? null : art.id)}
            >
              <div className="flex items-center gap-3 p-3">
                {/* SVG symbol (if available) */}
                {getSymbolSVG(art.id) && (
                  <div className="flex-shrink-0">{getSymbolSVG(art.id)}</div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{art.name}</div>
                  <div className="text-xs text-[#6b7280] mt-0.5 line-clamp-1">{art.description}</div>
                </div>

                {/* Play button */}
                {art.playSound && (
                  <button
                    onClick={(e) => { e.stopPropagation(); art.playSound!() }}
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-900/30 border border-violet-800/40 flex items-center justify-center text-violet-400 hover:bg-violet-800/30 transition-colors text-xs"
                    title="Play sound"
                  >
                    ▶
                  </button>
                )}
              </div>

              {/* Expanded detail */}
              {isActive && (
                <div className="px-3 pb-3 border-t border-[#1e2433] mt-0 pt-3 space-y-2">
                  <p className="text-sm text-[#94a3b8] leading-relaxed">{art.description}</p>
                  <div className="text-xs text-[#4b5563]">
                    <strong className="text-[#6b7280]">On the page:</strong> {art.howItLooks}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Key takeaway */}
      <div className="bg-violet-900/10 border border-violet-800/30 rounded-lg p-3 text-sm text-[#94a3b8]">
        <strong className="text-violet-300">Tip:</strong>{' '}
        You don't need to memorise all of these at once. Focus on <strong className="text-white">accents</strong>,{' '}
        <strong className="text-white">ghost notes</strong>, and{' '}
        <strong className="text-white">open/closed hi-hat</strong> first — you'll encounter them in every rock beat.
        The rest will come naturally as you progress.
      </div>
    </div>
  )
}
