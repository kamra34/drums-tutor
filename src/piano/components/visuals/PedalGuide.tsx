import { useState } from 'react'

// ── Data ─────────────────────────────────────────────────────────────────────

interface PedalType {
  name: string
  position: string
  description: string
  technique: string[]
  commonMistakes: string[]
}

const PEDALS: PedalType[] = [
  {
    name: 'Sustain Pedal (Damper)',
    position: 'Right pedal',
    description: 'The most used pedal. When pressed, it lifts all the dampers off the strings, allowing them to vibrate freely. Notes continue to ring even after you release the keys. This creates a rich, connected, resonant sound.',
    technique: [
      'Use the ball of your right foot — heel stays on the floor',
      'Press down smoothly, not with a stomp',
      'The pedal has a "catch point" — feel for it',
      'Keep your ankle relaxed — stiff ankles cause late pedaling',
    ],
    commonMistakes: [
      'Pressing the pedal at the same time as a new chord (creates blur between old and new)',
      'Holding the pedal too long — all the notes blend into mud',
      'Forgetting to release between chord changes',
      'Using the whole leg instead of just the ankle',
    ],
  },
  {
    name: 'Soft Pedal (Una Corda)',
    position: 'Left pedal',
    description: 'On a grand piano, this shifts the entire hammer mechanism sideways so hammers hit fewer strings. On an upright, it moves hammers closer to the strings. Either way, the tone becomes softer and slightly different in color — not just quieter, but more veiled and intimate.',
    technique: [
      'Press fully — it is an on/off pedal, not gradual',
      'Use for pp passages or special tonal color',
      'Usually held for longer passages, not single notes',
      'Marked in sheet music as "una corda" (release: "tre corde")',
    ],
    commonMistakes: [
      'Using it as a substitute for playing softly with your fingers',
      'Half-pressing it (no effect on most pianos)',
    ],
  },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function PedalGuide() {
  const [activePedal, setActivePedal] = useState(0)
  const [showLegato, setShowLegato] = useState(false)

  const accent = '#a78bfa'
  const pedal = PEDALS[activePedal]

  return (
    <div className="my-6 rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: '#0d1117' }}>
      <div className="px-5 pt-4 pb-2 flex items-center justify-between flex-wrap gap-2">
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accent }}>
          Piano Pedals
        </span>
        <div className="flex gap-1">
          {PEDALS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setActivePedal(i)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              style={{
                background: activePedal === i ? `${accent}20` : 'transparent',
                color: activePedal === i ? accent : '#6b7280',
                border: activePedal === i ? `1px solid ${accent}40` : '1px solid transparent',
              }}
            >
              {i === 0 ? 'Sustain (Right)' : 'Soft (Left)'}
            </button>
          ))}
        </div>
      </div>

      {/* Pedal diagram */}
      <div className="px-5 pb-3">
        <svg viewBox="0 0 300 80" className="w-full" style={{ maxWidth: 400, height: 'auto' }}>
          {/* Floor line */}
          <line x1="20" y1="70" x2="280" y2="70" stroke="#374151" strokeWidth="1" />
          {/* Foot */}
          <ellipse cx="150" cy="35" rx="50" ry="18" fill="#1e2433" stroke="#374151" strokeWidth="1" />
          <text x="150" y="39" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="system-ui">Foot</text>
          {/* Heel pivot */}
          <circle cx="150" cy="65" r="6" fill="#1e2433" stroke="#374151" strokeWidth="1" />
          <text x="150" y="68" textAnchor="middle" fill="#4b5563" fontSize="7" fontFamily="system-ui">Heel</text>
          {/* Connection */}
          <line x1="150" y1="53" x2="150" y2="59" stroke="#374151" strokeWidth="1" />
          {/* Pedal */}
          <rect x="120" y="72" width="60" height="6" rx="2"
            fill={activePedal === 0 ? `${accent}40` : '#374151'}
            stroke={activePedal === 0 ? accent : '#4b5563'}
            strokeWidth="1"
          />
          {/* Arrow showing press motion */}
          <path d="M 180 42 L 195 58" stroke={accent} strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" opacity="0.6" />
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill={accent} opacity="0.6" />
            </marker>
          </defs>
          {/* Labels */}
          <text x="210" y="55" fill="#6b7280" fontSize="9" fontFamily="system-ui">Press with ball of foot</text>
          <text x="60" y="55" fill="#4b5563" fontSize="8" fontFamily="system-ui">Heel on floor</text>
        </svg>
      </div>

      {/* Info */}
      <div className="px-5 pb-4">
        <div className="px-4 py-3 rounded-xl border border-white/[0.06] mb-3" style={{ background: '#161b22' }}>
          <h3 className="text-sm font-semibold text-white mb-1">{pedal.name}</h3>
          <p className="text-[11px] text-[#6b7280] mb-0.5">{pedal.position}</p>
          <p className="text-xs text-[#94a3b8] leading-relaxed">{pedal.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Technique */}
          <div className="px-4 py-3 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: accent }}>Technique</div>
            <ul className="space-y-1.5">
              {pedal.technique.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#94a3b8]">
                  <span className="text-[10px] mt-0.5" style={{ color: accent }}>+</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Common mistakes */}
          <div className="px-4 py-3 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-rose-400/70 mb-2">Common Mistakes</div>
            <ul className="space-y-1.5">
              {pedal.commonMistakes.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#6b7280]">
                  <span className="text-[10px] text-rose-400/60 mt-0.5">!</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legato pedaling technique (sustain pedal only) */}
        {activePedal === 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowLegato(!showLegato)}
              className="flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors"
              style={{ color: accent }}
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${showLegato ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Legato Pedaling Technique
            </button>

            {showLegato && (
              <div className="mt-2 px-4 py-3 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
                <p className="text-xs text-[#94a3b8] leading-relaxed mb-2">
                  Legato pedaling (also called "syncopated pedaling") is the most important pedal technique. The pedal changes <span className="text-white font-medium">after</span> you play the new note, not before:
                </p>
                <ol className="space-y-1.5 text-xs text-[#94a3b8]">
                  <li className="flex items-start gap-2"><span style={{ color: accent }} className="font-bold">1.</span> Play first chord — press pedal down</li>
                  <li className="flex items-start gap-2"><span style={{ color: accent }} className="font-bold">2.</span> Play next chord while pedal is still down</li>
                  <li className="flex items-start gap-2"><span style={{ color: accent }} className="font-bold">3.</span> <span className="text-white font-medium">Immediately after</span> playing, lift pedal briefly (clears old sound)</li>
                  <li className="flex items-start gap-2"><span style={{ color: accent }} className="font-bold">4.</span> Press pedal back down (catches new chord)</li>
                  <li className="flex items-start gap-2"><span style={{ color: accent }} className="font-bold">5.</span> Repeat for each chord change</li>
                </ol>
                <p className="text-xs text-[#6b7280] mt-2">
                  The key: the pedal change happens a split-second <span className="text-white">after</span> the new note, not before. This creates seamless, connected sound without blurring.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
