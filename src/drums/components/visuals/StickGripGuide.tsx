import { useState } from 'react'

type GripType = 'matched' | 'traditional'

const GRIP_INFO = {
  matched: {
    title: 'Matched Grip',
    subtitle: 'Recommended for beginners',
    color: '#7c3aed',
    steps: [
      'Pick up the stick and let it rest across your palm',
      'Pinch it between your thumb and index finger ~⅓ from the butt end — this is the fulcrum',
      'Curl your remaining three fingers loosely around the stick',
      'Both hands are identical — mirror images of each other',
      'Hold the stick like you\'d hold a hammer, not a pen',
    ],
    tip: 'Drop the stick on the snare and let it bounce. A relaxed grip gives you 4–5 bounces — like a basketball dribble.',
  },
  traditional: {
    title: 'Traditional Grip',
    subtitle: 'Common in jazz & marching',
    color: '#0284c7',
    steps: [
      'Right hand: same as matched grip',
      'Left hand: rotate your arm so the palm faces up',
      'Rest the stick in the webbing between your thumb and index finger',
      'Your ring finger goes underneath the stick for support',
      'Your index and middle fingers curl over the top',
    ],
    tip: 'Traditional grip originated from marching drummers who held their drum at an angle. It gives a different wrist angle and feel.',
  },
}

export default function StickGripGuide() {
  const [activeGrip, setActiveGrip] = useState<GripType>('matched')
  const info = GRIP_INFO[activeGrip]

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6 space-y-5">
      <div className="text-xs text-[#4b5563] uppercase tracking-wider">Stick Grip Guide</div>

      {/* Toggle */}
      <div className="flex gap-2">
        {(['matched', 'traditional'] as GripType[]).map((g) => (
          <button
            key={g}
            onClick={() => setActiveGrip(g)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeGrip === g
                ? 'bg-violet-700 text-white'
                : 'bg-[#1a1f2e] text-[#6b7280] hover:text-[#94a3b8]'
            }`}
          >
            {g === 'matched' ? 'Matched Grip' : 'Traditional Grip'}
          </button>
        ))}
      </div>

      <div className="flex gap-6 flex-col md:flex-row">
        {/* SVG illustration */}
        <div className="flex-shrink-0 flex justify-center">
          {activeGrip === 'matched' ? <MatchedGripSVG /> : <TraditionalGripSVG />}
        </div>

        {/* Steps */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-white font-semibold text-lg">{info.title}</h3>
            <p className="text-xs text-violet-400">{info.subtitle}</p>
          </div>

          <ol className="space-y-2">
            {info.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: info.color + '33', color: info.color }}
                >
                  {i + 1}
                </span>
                <span className="text-[#94a3b8]">{step}</span>
              </li>
            ))}
          </ol>

          <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-lg p-3 text-xs text-[#6b7280]">
            <span className="text-violet-400 font-medium">💡 Tip: </span>
            {info.tip}
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchedGripSVG() {
  return (
    <svg viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="#0a0c13" rx="8" />

      {/* Drumstick */}
      <line x1="100" y1="20" x2="100" y2="180" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
      {/* Tip */}
      <circle cx="100" cy="20" r="5" fill="#fbbf24" />
      {/* Butt end */}
      <rect x="93" y="173" width="14" height="7" rx="3" fill="#92400e" />

      {/* Fulcrum indicator */}
      <line x1="65" y1="73" x2="100" y2="73" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4,2" />
      <text x="60" y="76" textAnchor="end" fill="#7c3aed" fontSize="9" fontFamily="system-ui">fulcrum</text>
      <circle cx="100" cy="73" r="6" fill="none" stroke="#7c3aed" strokeWidth="2" />

      {/* Hand (palm facing down) */}
      {/* Palm */}
      <ellipse cx="110" cy="95" rx="28" ry="22" fill="#292524" stroke="#44403c" strokeWidth="1.5" />
      {/* Thumb */}
      <ellipse cx="87" cy="78" rx="10" ry="7" fill="#292524" stroke="#44403c" strokeWidth="1.5" transform="rotate(-30 87 78)" />
      {/* Index finger */}
      <ellipse cx="82" cy="68" rx="7" ry="14" fill="#292524" stroke="#44403c" strokeWidth="1.5" transform="rotate(10 82 68)" />
      {/* Other fingers (grouped) */}
      <rect x="102" y="72" width="16" height="26" rx="6" fill="#292524" stroke="#44403c" strokeWidth="1.5" transform="rotate(5 110 85)" />

      {/* Label */}
      <text x="100" y="195" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="system-ui">PALM DOWN</text>
    </svg>
  )
}

function TraditionalGripSVG() {
  return (
    <svg viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="#0a0c13" rx="8" />

      {/* Drumstick — angled for traditional grip */}
      <line x1="80" y1="30" x2="140" y2="170" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
      {/* Tip */}
      <circle cx="80" cy="30" r="5" fill="#fbbf24" />
      {/* Butt end */}
      <rect x="134" y="163" width="14" height="7" rx="3" fill="#92400e" transform="rotate(30 141 167)" />

      {/* Fulcrum indicator */}
      <circle cx="122" cy="130" r="6" fill="none" stroke="#0284c7" strokeWidth="2" />
      <line x1="135" y1="118" x2="122" y2="130" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4,2" />
      <text x="140" y="116" textAnchor="start" fill="#0284c7" fontSize="9" fontFamily="system-ui">fulcrum</text>

      {/* Hand (palm facing up — traditional) */}
      {/* Palm */}
      <ellipse cx="105" cy="120" rx="28" ry="22" fill="#292524" stroke="#44403c" strokeWidth="1.5" transform="rotate(-20 105 120)" />
      {/* Thumb over stick */}
      <ellipse cx="118" cy="103" rx="10" ry="7" fill="#292524" stroke="#44403c" strokeWidth="1.5" transform="rotate(30 118 103)" />
      {/* Ring finger under stick */}
      <ellipse cx="90" cy="133" rx="7" ry="14" fill="#292524" stroke="#44403c" strokeWidth="1.5" transform="rotate(-15 90 133)" />
      {/* Other fingers */}
      <rect x="75" y="108" width="16" height="22" rx="6" fill="#292524" stroke="#44403c" strokeWidth="1.5" transform="rotate(-20 83 119)" />

      {/* PALM UP label */}
      <text x="100" y="195" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="system-ui">PALM UP (left hand)</text>
    </svg>
  )
}
