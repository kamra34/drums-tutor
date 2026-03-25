import { useState, useEffect, useRef } from 'react'
import { playAccentClick, playNormalClick } from '../../services/clickSounds'

const TEMPOS = [
  { name: 'Largo', bpm: 50, color: '#1d4ed8', feel: 'Very slow — like a heartbeat at rest' },
  { name: 'Adagio', bpm: 70, color: '#7c3aed', feel: 'Slow and relaxed — a gentle walk' },
  { name: 'Andante', bpm: 90, color: '#059669', feel: 'Walking pace — easy and comfortable' },
  { name: 'Moderato', bpm: 110, color: '#d97706', feel: 'Moderate — a confident stride' },
  { name: 'Allegro', bpm: 140, color: '#dc2626', feel: 'Fast and lively — energetic' },
  { name: 'Presto', bpm: 180, color: '#9d174d', feel: 'Very fast — exciting, demanding!' },
]

export default function BpmMeter() {
  const [bpm, setBpm] = useState(120)
  const [isPlaying, setIsPlaying] = useState(false)
  const [pulse, setPulse] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [tapTimes, setTapTimes] = useState<number[]>([])

  const activeRange = TEMPOS.findLast((t) => bpm >= t.bpm) ?? TEMPOS[0]

  function togglePlay() {
    if (isPlaying) {
      clearInterval(intervalRef.current!)
      setIsPlaying(false)
      setPulse(false)
      return
    }

    setIsPlaying(true)
    const ms = 60000 / bpm
    let beatCount = 0

    // First beat immediately
    playAccentClick()
    setPulse(true)
    setTimeout(() => setPulse(false), Math.min(ms * 0.3, 100))

    intervalRef.current = setInterval(() => {
      beatCount++
      const isAccent = beatCount % 4 === 0
      if (isAccent) playAccentClick()
      else playNormalClick()
      setPulse(true)
      setTimeout(() => setPulse(false), Math.min(ms * 0.3, 100))
    }, ms)
  }

  function handleTap() {
    playNormalClick()
    const now = Date.now()
    setTapTimes((prev) => {
      const recent = [...prev, now].filter((t) => now - t < 4000)
      if (recent.length >= 2) {
        const gaps = recent.slice(1).map((t, i) => t - recent[i])
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
        const detected = Math.round(60000 / avgGap)
        setBpm(Math.max(40, Math.min(240, detected)))
      }
      return recent
    })
    setPulse(true)
    setTimeout(() => setPulse(false), 100)
  }

  // Restart interval when bpm changes while playing
  useEffect(() => {
    if (!isPlaying) return
    clearInterval(intervalRef.current!)
    const ms = 60000 / bpm
    let beatCount = 0
    intervalRef.current = setInterval(() => {
      beatCount++
      if (beatCount % 4 === 0) playAccentClick()
      else playNormalClick()
      setPulse(true)
      setTimeout(() => setPulse(false), Math.min(ms * 0.3, 100))
    }, ms)
  }, [bpm, isPlaying])

  useEffect(() => () => clearInterval(intervalRef.current!), [])

  // Dial angle: map 40-240 BPM to -130° to +130°
  const dialAngle = ((bpm - 40) / (240 - 40)) * 260 - 130

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6 space-y-5">
      <div className="text-xs text-[#4b5563] uppercase tracking-wider">Tempo & BPM — Interactive</div>

      <div className="flex gap-6 flex-col md:flex-row items-center">
        {/* Dial + pulse */}
        <div className="flex flex-col items-center gap-4 flex-shrink-0">
          {/* BPM dial */}
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 200 200" width="192" height="192">
              {/* Background circle */}
              <circle cx="100" cy="100" r="90" fill="#0a0c13" stroke="#1e2433" strokeWidth="2" />

              {/* Arc track */}
              <path
                d="M 30 150 A 80 80 0 1 1 170 150"
                fill="none"
                stroke="#1e2433"
                strokeWidth="12"
                strokeLinecap="round"
              />

              {/* Colored arc (progress) */}
              <path
                d="M 30 150 A 80 80 0 1 1 170 150"
                fill="none"
                stroke={activeRange.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="251"
                strokeDashoffset={251 - ((bpm - 40) / 200) * 251}
                opacity="0.7"
              />

              {/* Tempo zone labels */}
              {TEMPOS.map((t) => {
                const angle = ((t.bpm - 40) / 200) * 260 - 130 - 90
                const rad = (angle * Math.PI) / 180
                const x = 100 + 72 * Math.cos(rad)
                const y = 100 + 72 * Math.sin(rad)
                return (
                  <circle key={t.name} cx={x} cy={y} r="3" fill={t.color} opacity="0.6" />
                )
              })}

              {/* Needle */}
              <g transform={`rotate(${dialAngle} 100 100)`}>
                <line x1="100" y1="100" x2="100" y2="28" stroke={activeRange.color} strokeWidth="3" strokeLinecap="round" />
                <circle cx="100" cy="100" r="6" fill={activeRange.color} />
              </g>

              {/* Center display */}
              <text x="100" y="125" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="system-ui">
                {bpm}
              </text>
              <text x="100" y="140" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="system-ui">
                BPM
              </text>
            </svg>

            {/* Pulse dot */}
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full transition-all duration-75"
              style={{
                backgroundColor: pulse ? activeRange.color : activeRange.color + '33',
                boxShadow: pulse ? `0 0 16px ${activeRange.color}` : 'none',
                transform: `translateX(-50%) scale(${pulse ? 1.4 : 1})`,
              }}
            />
          </div>

          {/* BPM slider */}
          <input
            type="range"
            min={40}
            max={240}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-48 accent-violet-500"
          />

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={togglePlay}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isPlaying
                  ? 'bg-red-800/50 border border-red-700/50 text-red-300'
                  : 'bg-violet-700 text-white hover:bg-violet-600'
              }`}
            >
              {isPlaying ? '■ Stop' : '▶ Play'}
            </button>
            <button
              onClick={handleTap}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#1a1f2e] text-[#94a3b8] hover:text-white transition-colors border border-[#2d3748] active:bg-[#252b3b]"
            >
              Tap
            </button>
          </div>
          <p className="text-xs text-[#4b5563] text-center">Tap a rhythm to detect BPM</p>
        </div>

        {/* Tempo reference table */}
        <div className="flex-1 space-y-2">
          <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-3">Common Tempos</div>
          {TEMPOS.map((t) => {
            const isActive = activeRange.name === t.name
            return (
              <button
                key={t.name}
                onClick={() => setBpm(t.bpm)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-[#13101e] border border-violet-900/50'
                    : 'bg-[#0d1117] border border-transparent hover:border-[#1e2433]'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-[#94a3b8]'}`}>
                      {t.name}
                    </span>
                    <span className="text-xs text-[#4b5563]">~{t.bpm} BPM</span>
                  </div>
                  {isActive && (
                    <div className="text-xs text-[#6b7280] mt-0.5">{t.feel}</div>
                  )}
                </div>
                {isActive && <span className="text-violet-500 text-sm">◀</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-[#1e2433] pt-3 text-xs text-[#4b5563]">
        <span className="text-violet-400 font-medium">Golden Rule:</span>{' '}
        Always start slow. Speed comes from accuracy, never the other way around.
        If you can't play it clean at 60 BPM, you can't play it at 120 BPM.
      </div>
    </div>
  )
}
