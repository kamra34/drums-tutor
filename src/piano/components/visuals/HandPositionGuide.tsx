import { useState } from 'react'

type Hand = 'right' | 'left'

const FINGERS = [
  { num: 1, name: 'Thumb', tip: 'Plays on its side corner, not flat. Stays relaxed.' },
  { num: 2, name: 'Index', tip: 'The most independent finger — leads melodic lines.' },
  { num: 3, name: 'Middle', tip: 'Longest finger — curves more to keep hand level.' },
  { num: 4, name: 'Ring', tip: 'The weakest finger — needs extra practice for even tone.' },
  { num: 5, name: 'Pinky', tip: 'Stays curved, never collapses flat. Firm but relaxed.' },
]

const POSTURE_TIPS = [
  { icon: '🪑', title: 'Bench Height', desc: 'Sit so your forearms are parallel to the floor or slope slightly downward toward the keys.' },
  { icon: '🦴', title: 'Wrist Position', desc: 'Keep wrists level with your knuckles — not dropped below or arched above the keys.' },
  { icon: '🥚', title: 'Hand Shape', desc: 'Imagine holding an egg or a small ball. Fingers curved, knuckles slightly raised, relaxed arch.' },
  { icon: '💪', title: 'Arm Weight', desc: 'Play using arm weight, not finger pressing. Let gravity do the work — fingers guide the direction.' },
  { icon: '🧘', title: 'Shoulders', desc: 'Keep shoulders dropped and relaxed. Tension travels to your fingers and ruins your tone.' },
]

export default function HandPositionGuide() {
  const [hand, setHand] = useState<Hand>('right')
  const [activeFinger, setActiveFinger] = useState<number | null>(null)

  const accent = '#a78bfa'

  // SVG hand: simple outline with numbered circles
  function renderHand(h: Hand) {
    // Finger tip positions (roughly a spread hand, palm down)
    const isRight = h === 'right'
    const fingers = isRight
      ? [
          { x: 45, y: 100, num: 1 },  // thumb
          { x: 70, y: 30, num: 2 },   // index
          { x: 100, y: 18, num: 3 },  // middle
          { x: 130, y: 28, num: 4 },  // ring
          { x: 155, y: 50, num: 5 },  // pinky
        ]
      : [
          { x: 155, y: 100, num: 1 }, // thumb
          { x: 130, y: 30, num: 2 },  // index
          { x: 100, y: 18, num: 3 },  // middle
          { x: 70, y: 28, num: 4 },   // ring
          { x: 45, y: 50, num: 5 },   // pinky
        ]

    return (
      <svg viewBox="0 0 200 160" className="w-full" style={{ maxWidth: 260, height: 'auto' }}>
        {/* Palm */}
        <ellipse cx={100} cy={120} rx={55} ry={30} fill="#1e2433" stroke="#374151" strokeWidth={1} />
        {/* Finger lines from palm to tip */}
        {fingers.map((f) => (
          <g key={f.num}>
            <line
              x1={100 + (f.x - 100) * 0.3}
              y1={110}
              x2={f.x}
              y2={f.y}
              stroke={activeFinger === f.num ? accent : '#374151'}
              strokeWidth={activeFinger === f.num ? 3 : 2}
              strokeLinecap="round"
            />
            <circle
              cx={f.x}
              cy={f.y}
              r={activeFinger === f.num ? 15 : 13}
              fill={activeFinger === f.num ? `${accent}30` : '#161b22'}
              stroke={activeFinger === f.num ? accent : '#4b5563'}
              strokeWidth={activeFinger === f.num ? 2 : 1}
              onMouseEnter={() => setActiveFinger(f.num)}
              onMouseLeave={() => setActiveFinger(null)}
              style={{ cursor: 'pointer' }}
            />
            <text
              x={f.x}
              y={f.y + 4.5}
              textAnchor="middle"
              fill={activeFinger === f.num ? accent : '#94a3b8'}
              fontSize={14}
              fontWeight={700}
              fontFamily="system-ui"
              pointerEvents="none"
            >
              {f.num}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  return (
    <div className="my-6 rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: '#0d1117' }}>
      <div className="px-5 pt-4 pb-2 flex items-center justify-between flex-wrap gap-2">
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accent }}>
          Hand Position & Finger Numbers
        </span>
        <div className="flex gap-1">
          {(['right', 'left'] as Hand[]).map((h) => (
            <button
              key={h}
              onClick={() => setHand(h)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              style={{
                background: hand === h ? `${accent}20` : 'transparent',
                color: hand === h ? accent : '#6b7280',
                border: hand === h ? `1px solid ${accent}40` : '1px solid transparent',
              }}
            >
              {h === 'right' ? 'Right Hand (RH)' : 'Left Hand (LH)'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-3 flex flex-col md:flex-row gap-4 items-start">
        {/* Hand diagram */}
        <div className="flex-shrink-0 w-full md:w-64">
          {renderHand(hand)}
          <p className="text-center text-[11px] text-[#4b5563] mt-1">
            Hover a finger to see details
          </p>
        </div>

        {/* Finger list */}
        <div className="flex-1 space-y-1.5">
          {FINGERS.map((f) => (
            <div
              key={f.num}
              className="flex items-start gap-3 px-3 py-2 rounded-xl transition-colors"
              style={{
                background: activeFinger === f.num ? `${accent}10` : 'transparent',
                border: `1px solid ${activeFinger === f.num ? `${accent}30` : 'transparent'}`,
              }}
              onMouseEnter={() => setActiveFinger(f.num)}
              onMouseLeave={() => setActiveFinger(null)}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: activeFinger === f.num ? `${accent}25` : '#1e2433',
                  color: activeFinger === f.num ? accent : '#94a3b8',
                }}
              >
                {f.num}
              </span>
              <div>
                <span className="text-sm font-medium text-white">{f.name}</span>
                <p className="text-xs text-[#6b7280] leading-relaxed">{f.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Posture tips */}
      <div className="mx-5 mb-4 mt-2">
        <div className="text-[10px] uppercase tracking-widest font-semibold text-[#6b7280] mb-2">Posture Essentials</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {POSTURE_TIPS.map((t) => (
            <div key={t.title} className="px-3 py-2.5 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{t.icon}</span>
                <span className="text-xs font-semibold text-white">{t.title}</span>
              </div>
              <p className="text-[11px] text-[#6b7280] leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
