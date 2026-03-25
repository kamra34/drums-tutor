import { useState } from 'react'

const CHECKLIST = [
  {
    id: 'throne',
    icon: '🪑',
    label: 'Throne height',
    good: 'Thighs slope slightly downward — hips slightly above knees',
    bad: 'Too high or low causes you to reach awkwardly for pedals',
  },
  {
    id: 'back',
    icon: '🧘',
    label: 'Back & posture',
    good: 'Sit tall but relaxed — "tall and loose," not stiff',
    bad: 'Slumping causes fatigue and limits arm movement',
  },
  {
    id: 'arms',
    icon: '💪',
    label: 'Arms & elbows',
    good: 'Elbows at ~90° when sticks hover over the snare',
    bad: 'If you\'re reaching, adjust the kit position not your body',
  },
  {
    id: 'feet',
    icon: '🦶',
    label: 'Feet & pedals',
    good: 'Both feet rest flat on pedals without stretching',
    bad: 'Tip-toeing or having to stretch causes inconsistent technique',
  },
  {
    id: 'wrists',
    icon: '✋',
    label: 'Wrists',
    good: 'Wrists flat and relaxed, not bent up or down',
    bad: 'Bent wrists restrict movement and lead to repetitive strain',
  },
]

export default function SittingPosture() {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allDone = checked.size === CHECKLIST.length

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6">
      <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-4">Posture Checklist</div>

      <div className="flex gap-6 flex-col md:flex-row">
        {/* Side-view SVG */}
        <div className="flex-shrink-0 flex justify-center">
          <DrummerSVG checked={checked} active={expanded} />
        </div>

        {/* Checklist */}
        <div className="flex-1 space-y-2">
          <p className="text-sm text-[#6b7280] mb-4">
            Before each practice session, run through this quick checklist. Check each item when you've got it right.
          </p>

          {CHECKLIST.map((item) => {
            const isChecked = checked.has(item.id)
            const isExpanded = expanded === item.id

            return (
              <div key={item.id} className={`rounded-lg border transition-colors ${isChecked ? 'border-green-800/50 bg-green-900/10' : 'border-[#1e2433]'}`}>
                <div className="flex items-center gap-3 p-3">
                  <button
                    onClick={() => toggle(item.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      isChecked
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-[#374151] hover:border-[#4b5563]'
                    }`}
                  >
                    {isChecked && <span className="text-xs">✓</span>}
                  </button>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : item.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                    onMouseEnter={() => !isExpanded && setExpanded(item.id)}
                    onMouseLeave={() => setExpanded(null)}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className={`text-sm font-medium ${isChecked ? 'text-green-300' : 'text-[#e2e8f0]'}`}>
                      {item.label}
                    </span>
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-3 space-y-1 text-xs">
                    <div className="flex gap-2 text-green-400">
                      <span>✓</span>
                      <span>{item.good}</span>
                    </div>
                    <div className="flex gap-2 text-red-400">
                      <span>✗</span>
                      <span>{item.bad}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {allDone && (
            <div className="bg-green-900/20 border border-green-700/40 rounded-lg p-3 text-center text-sm text-green-300 mt-2">
              🎉 Perfect setup! You're ready to play.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DrummerSVG({ checked, active }: { checked: Set<string>; active: string | null }) {
  const highlight = (id: string) => active === id || checked.has(id)

  return (
    <svg viewBox="0 0 160 280" width="160" height="280">
      <rect width="160" height="280" fill="#0a0c13" rx="8" />

      {/* Throne/stool */}
      <rect x="60" y="195" width="40" height="6" rx="2" fill="#374151" />
      <line x1="72" y1="201" x2="70" y2="240" stroke="#374151" strokeWidth="3" />
      <line x1="88" y1="201" x2="90" y2="240" stroke="#374151" strokeWidth="3" />
      <line x1="65" y1="238" x2="95" y2="238" stroke="#4b5563" strokeWidth="2" />

      {/* Drummer body */}

      {/* Legs */}
      {/* Right leg */}
      <line x1="85" y1="195" x2="95" y2="240" stroke={highlight('feet') ? '#4ade80' : '#6b7280'} strokeWidth="8" strokeLinecap="round" />
      {/* Left leg */}
      <line x1="75" y1="195" x2="60" y2="240" stroke={highlight('feet') ? '#4ade80' : '#6b7280'} strokeWidth="8" strokeLinecap="round" />
      {/* Feet */}
      <ellipse cx="95" cy="243" rx="10" ry="5" fill={highlight('feet') ? '#4ade80' : '#6b7280'} />
      <ellipse cx="58" cy="243" rx="10" ry="5" fill={highlight('feet') ? '#4ade80' : '#6b7280'} />

      {/* Torso */}
      <rect
        x="65"
        y="130"
        width="36"
        height="68"
        rx="8"
        fill={highlight('back') ? '#1e3a8a' : '#1f2937'}
        stroke={highlight('back') ? '#60a5fa' : '#374151'}
        strokeWidth="1.5"
      />

      {/* Right arm */}
      <path
        d="M 98 145 Q 120 150 115 175"
        stroke={highlight('arms') ? '#c084fc' : '#4b5563'}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right hand + stick */}
      <circle cx="115" cy="177" r="6" fill={highlight('wrists') ? '#fbbf24' : '#374151'} />
      <line x1="115" y1="177" x2="115" y2="148" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <circle cx="115" cy="148" r="3" fill="#fbbf24" />

      {/* Left arm */}
      <path
        d="M 67 145 Q 45 150 48 175"
        stroke={highlight('arms') ? '#c084fc' : '#4b5563'}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left hand + stick */}
      <circle cx="48" cy="177" r="6" fill={highlight('wrists') ? '#fbbf24' : '#374151'} />
      <line x1="48" y1="177" x2="48" y2="148" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <circle cx="48" cy="148" r="3" fill="#fbbf24" />

      {/* Head + neck */}
      <line x1="83" y1="112" x2="83" y2="132" stroke="#4b5563" strokeWidth="6" strokeLinecap="round" />
      <circle cx="83" cy="100" r="18" fill="#292524" stroke={highlight('back') ? '#60a5fa' : '#374151'} strokeWidth="1.5" />

      {/* Spine indicator */}
      {highlight('back') && (
        <line x1="83" y1="118" x2="83" y2="194" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
      )}

      {/* Snare drum (in front) */}
      <ellipse cx="83" cy="180" rx="24" ry="9" fill="#1e3a8a" opacity="0.7" stroke="#2563eb" strokeWidth="1" />

      {/* Kick pedal indicator */}
      {highlight('feet') && (
        <>
          <rect x="86" y="235" width="18" height="6" rx="2" fill="#4ade80" opacity="0.6" />
          <text x="95" y="255" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="system-ui">pedal ✓</text>
        </>
      )}
    </svg>
  )
}
