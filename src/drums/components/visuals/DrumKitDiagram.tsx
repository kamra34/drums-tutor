import { useState } from 'react'

interface DrumPiece {
  id: string
  label: string
  description: string
  color: string
  hoverColor: string
}

const PIECES: DrumPiece[] = [
  {
    id: 'kick',
    label: 'Kick Drum',
    description: 'Played with the right foot pedal. The deep heartbeat of the kit — "boom".',
    color: '#b45309',
    hoverColor: '#f59e0b',
  },
  {
    id: 'snare',
    label: 'Snare Drum',
    description: 'Sits between your knees. The crack of the backbeat — typically on beats 2 and 4.',
    color: '#1d4ed8',
    hoverColor: '#60a5fa',
  },
  {
    id: 'hihat',
    label: 'Hi-Hat',
    description: 'Two cymbals on a stand, controlled by your left foot pedal. The timekeeper.',
    color: '#15803d',
    hoverColor: '#4ade80',
  },
  {
    id: 'tom1',
    label: 'High Tom',
    description: 'Smallest tom, mounted above the kick. High-pitched — used in fills.',
    color: '#7e22ce',
    hoverColor: '#c084fc',
  },
  {
    id: 'tom2',
    label: 'Mid Tom',
    description: 'Second tom, also mounted above the kick. Slightly lower pitch.',
    color: '#6d28d9',
    hoverColor: '#a78bfa',
  },
  {
    id: 'floortom',
    label: 'Floor Tom',
    description: 'Largest tom, stands to your right on legs. Deep, resonant sound.',
    color: '#9d174d',
    hoverColor: '#f472b6',
  },
  {
    id: 'crash',
    label: 'Crash Cymbal',
    description: 'Loud, explosive accent cymbal. Crash it at the start of a chorus or fill.',
    color: '#374151',
    hoverColor: '#9ca3af',
  },
  {
    id: 'ride',
    label: 'Ride Cymbal',
    description: 'Larger cymbal to your right. Clear "ping" sound used for keeping time.',
    color: '#374151',
    hoverColor: '#9ca3af',
  },
]

export default function DrumKitDiagram() {
  const [active, setActive] = useState<string | null>(null)

  const activePiece = PIECES.find((p) => p.id === active)

  function color(id: string, base: string, hover: string) {
    return active === id ? hover : active ? '#1f2937' : base
  }

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6">
      <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-4">
        Interactive Drum Kit — click any piece to learn about it
      </div>

      <div className="flex gap-6 flex-col md:flex-row items-center">
        {/* SVG diagram */}
        <svg
          viewBox="0 0 400 320"
          className="w-full max-w-sm flex-shrink-0"
          style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.5))' }}
        >
          {/* Background */}
          <rect width="400" height="320" fill="#0a0c13" rx="12" />

          {/* Drummer position indicator */}
          <text x="200" y="308" textAnchor="middle" fill="#1f2937" fontSize="10" fontFamily="system-ui">
            ▲ DRUMMER SITS HERE
          </text>

          {/* ── Cymbals (flat ellipses) ── */}

          {/* Crash cymbal */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setActive(active === 'crash' ? null : 'crash')}
          >
            <ellipse cx="80" cy="72" rx="48" ry="13" fill={color('crash', '#374151', '#6b7280')} opacity="0.9" />
            <ellipse cx="80" cy="72" rx="48" ry="13" fill="none" stroke={color('crash', '#4b5563', '#9ca3af')} strokeWidth="1.5" />
            <ellipse cx="80" cy="72" rx="8" ry="3" fill={color('crash', '#4b5563', '#d1d5db')} />
            <text x="80" y="56" textAnchor="middle" fill={active === 'crash' ? '#e5e7eb' : '#6b7280'} fontSize="9" fontFamily="system-ui">CRASH</text>
          </g>

          {/* Ride cymbal */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setActive(active === 'ride' ? null : 'ride')}
          >
            <ellipse cx="325" cy="88" rx="58" ry="16" fill={color('ride', '#374151', '#6b7280')} opacity="0.9" />
            <ellipse cx="325" cy="88" rx="58" ry="16" fill="none" stroke={color('ride', '#4b5563', '#9ca3af')} strokeWidth="1.5" />
            <ellipse cx="325" cy="88" rx="9" ry="4" fill={color('ride', '#4b5563', '#d1d5db')} />
            <text x="325" y="70" textAnchor="middle" fill={active === 'ride' ? '#e5e7eb' : '#6b7280'} fontSize="9" fontFamily="system-ui">RIDE</text>
          </g>

          {/* ── Drums ── */}

          {/* Hi-Hat */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setActive(active === 'hihat' ? null : 'hihat')}
          >
            {/* Stand */}
            <line x1="90" y1="155" x2="90" y2="290" stroke="#1f2937" strokeWidth="3" />
            {/* Top cymbal */}
            <ellipse cx="90" cy="143" rx="33" ry="10" fill={color('hihat', '#14532d', '#16a34a')} />
            <ellipse cx="90" cy="143" rx="33" ry="10" fill="none" stroke={color('hihat', '#15803d', '#4ade80')} strokeWidth="1.5" />
            {/* Bottom cymbal (slightly lower) */}
            <ellipse cx="90" cy="151" rx="33" ry="10" fill={color('hihat', '#14532d', '#16a34a')} opacity="0.7" />
            <ellipse cx="90" cy="151" rx="33" ry="10" fill="none" stroke={color('hihat', '#15803d', '#4ade80')} strokeWidth="1" />
            {/* Foot pedal */}
            <rect x="76" y="282" width="28" height="8" rx="2" fill={color('hihat', '#1f2937', '#374151')} />
            <text x="90" y="128" textAnchor="middle" fill={active === 'hihat' ? '#e5e7eb' : '#6b7280'} fontSize="9" fontFamily="system-ui">HI-HAT</text>
          </g>

          {/* Tom 1 (High tom) */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setActive(active === 'tom1' ? null : 'tom1')}
          >
            <circle cx="158" cy="122" r="27" fill={color('tom1', '#4c1d95', '#6d28d9')} />
            <circle cx="158" cy="122" r="27" fill="none" stroke={color('tom1', '#7e22ce', '#c084fc')} strokeWidth="2" />
            <circle cx="158" cy="122" r="20" fill="none" stroke={color('tom1', '#581c87', '#9333ea')} strokeWidth="1" opacity="0.5" />
            <text x="158" y="126" textAnchor="middle" fill={active === 'tom1' ? '#f3e8ff' : '#a78bfa'} fontSize="9" fontWeight="bold" fontFamily="system-ui">TOM 1</text>
          </g>

          {/* Tom 2 (Mid tom) */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setActive(active === 'tom2' ? null : 'tom2')}
          >
            <circle cx="242" cy="122" r="27" fill={color('tom2', '#4c1d95', '#5b21b6')} />
            <circle cx="242" cy="122" r="27" fill="none" stroke={color('tom2', '#7e22ce', '#a78bfa')} strokeWidth="2" />
            <circle cx="242" cy="122" r="20" fill="none" stroke={color('tom2', '#581c87', '#7c3aed')} strokeWidth="1" opacity="0.5" />
            <text x="242" y="126" textAnchor="middle" fill={active === 'tom2' ? '#ede9fe' : '#a78bfa'} fontSize="9" fontWeight="bold" fontFamily="system-ui">TOM 2</text>
          </g>

          {/* Snare drum */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setActive(active === 'snare' ? null : 'snare')}
          >
            <circle cx="165" cy="195" r="30" fill={color('snare', '#1e3a8a', '#1d4ed8')} />
            <circle cx="165" cy="195" r="30" fill="none" stroke={color('snare', '#2563eb', '#60a5fa')} strokeWidth="2.5" />
            <circle cx="165" cy="195" r="22" fill="none" stroke={color('snare', '#1d4ed8', '#3b82f6')} strokeWidth="1" opacity="0.6" />
            {/* Snare wires indicator */}
            <line x1="135" y1="200" x2="195" y2="200" stroke={color('snare', '#1d4ed8', '#93c5fd')} strokeWidth="1" opacity="0.8" />
            <line x1="135" y1="203" x2="195" y2="203" stroke={color('snare', '#1d4ed8', '#93c5fd')} strokeWidth="1" opacity="0.6" />
            <text x="165" y="199" textAnchor="middle" fill={active === 'snare' ? '#dbeafe' : '#93c5fd'} fontSize="9" fontWeight="bold" fontFamily="system-ui">SNARE</text>
          </g>

          {/* Floor tom */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setActive(active === 'floortom' ? null : 'floortom')}
          >
            <circle cx="315" cy="195" r="42" fill={color('floortom', '#831843', '#9d174d')} />
            <circle cx="315" cy="195" r="42" fill="none" stroke={color('floortom', '#be185d', '#f472b6')} strokeWidth="2" />
            <circle cx="315" cy="195" r="32" fill="none" stroke={color('floortom', '#9d174d', '#ec4899')} strokeWidth="1" opacity="0.5" />
            <text x="315" y="192" textAnchor="middle" fill={active === 'floortom' ? '#fce7f3' : '#f9a8d4'} fontSize="8" fontWeight="bold" fontFamily="system-ui">FLOOR</text>
            <text x="315" y="204" textAnchor="middle" fill={active === 'floortom' ? '#fce7f3' : '#f9a8d4'} fontSize="8" fontWeight="bold" fontFamily="system-ui">TOM</text>
          </g>

          {/* Kick drum */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setActive(active === 'kick' ? null : 'kick')}
          >
            <ellipse cx="200" cy="248" rx="72" ry="55" fill={color('kick', '#78350f', '#92400e')} />
            <ellipse cx="200" cy="248" rx="72" ry="55" fill="none" stroke={color('kick', '#b45309', '#f59e0b')} strokeWidth="2.5" />
            <ellipse cx="200" cy="248" rx="55" ry="42" fill="none" stroke={color('kick', '#92400e', '#d97706')} strokeWidth="1" opacity="0.6" />
            {/* Kick pedal */}
            <rect x="185" y="291" width="30" height="8" rx="3" fill={color('kick', '#1f2937', '#374151')} />
            <text x="200" y="246" textAnchor="middle" fill={active === 'kick' ? '#fef3c7' : '#fcd34d'} fontSize="10" fontWeight="bold" fontFamily="system-ui">KICK</text>
            <text x="200" y="260" textAnchor="middle" fill={active === 'kick' ? '#fef3c7' : '#fcd34d'} fontSize="8" fontFamily="system-ui">DRUM</text>
          </g>
        </svg>

        {/* Info panel */}
        <div className="flex-1 min-w-0">
          {activePiece ? (
            <div className="animate-fade-in">
              <div
                className="w-3 h-3 rounded-full mb-3"
                style={{ backgroundColor: activePiece.hoverColor }}
              />
              <h3 className="text-lg font-bold text-white mb-2">{activePiece.label}</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed mb-4">{activePiece.description}</p>
            </div>
          ) : (
            <div>
              <p className="text-[#6b7280] text-sm mb-4">
                Click any part of the drum kit to learn what it is and how it sounds.
              </p>
              <div className="space-y-1.5">
                {PIECES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActive(p.id)}
                    className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#94a3b8] w-full text-left transition-colors"
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activePiece && (
            <button
              onClick={() => setActive(null)}
              className="text-xs text-[#4b5563] hover:text-[#6b7280] mt-2"
            >
              ← Back to overview
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
