import { useState, useRef, useEffect } from 'react'
import { playAccentClick, playNormalClick, playHiHat } from '../../services/clickSounds'

// ── Subdivision definitions ─────────────────────────────────────────────────

interface SubdivisionDef {
  id: string
  name: string
  labels: string[]
  perBeat: number
  color: string
  description: string
}

const SUBDIVISIONS: SubdivisionDef[] = [
  {
    id: 'quarter',
    name: 'Quarter Notes',
    labels: ['1', '2', '3', '4'],
    perBeat: 1,
    color: '#7c3aed',
    description: 'Count: "1 — 2 — 3 — 4"  (one hit per beat)',
  },
  {
    id: 'eighth',
    name: 'Eighth Notes',
    labels: ['1', '+', '2', '+', '3', '+', '4', '+'],
    perBeat: 2,
    color: '#2563eb',
    description: 'Count: "1-and-2-and-3-and-4-and"  (two per beat)',
  },
  {
    id: 'sixteenth',
    name: 'Sixteenth Notes',
    labels: ['1', 'e', '+', 'a', '2', 'e', '+', 'a', '3', 'e', '+', 'a', '4', 'e', '+', 'a'],
    perBeat: 4,
    color: '#dc2626',
    description: 'Count: "1-e-and-a-2-e-and-a-3-e-and-a-4-e-and-a"  (four per beat)',
  },
  {
    id: 'triplet',
    name: 'Eighth-Note Triplets',
    labels: ['1', 'trip', 'let', '2', 'trip', 'let', '3', 'trip', 'let', '4', 'trip', 'let'],
    perBeat: 3,
    color: '#d97706',
    description: 'Count: "1-trip-let-2-trip-let-3-trip-let-4-trip-let"  (three per beat)',
  },
]

// ── Main component ──────────────────────────────────────────────────────────

export default function CountingGuide() {
  const [selected, setSelected] = useState<string>('quarter')
  const [playing, setPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepRef = useRef(0)

  const subdivision = SUBDIVISIONS.find(s => s.id === selected)!

  function play() {
    if (playing) {
      stop()
      return
    }
    setPlaying(true)
    stepRef.current = 0
    setCurrentStep(0)

    const beatMs = 500 // 120 BPM
    const subdivMs = beatMs / subdivision.perBeat

    // Play first step
    playSoundForStep(0, subdivision)

    intervalRef.current = setInterval(() => {
      stepRef.current++
      const total = subdivision.labels.length
      if (stepRef.current >= total * 2) {
        // Play 2 bars, then stop
        stop()
        return
      }
      const step = stepRef.current % total
      setCurrentStep(step)
      playSoundForStep(step, subdivision)
    }, subdivMs)
  }

  function playSoundForStep(step: number, sub: SubdivisionDef) {
    const isDownbeat = step % sub.perBeat === 0
    const isBeatOne = step === 0

    if (isBeatOne) {
      playAccentClick(0.5)
    } else if (isDownbeat) {
      playNormalClick(0.35)
    } else {
      playHiHat(0.2)
    }
  }

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPlaying(false)
    setCurrentStep(-1)
  }

  useEffect(() => () => stop(), [])

  // When changing subdivision, stop playback
  useEffect(() => {
    stop()
  }, [selected])

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6 space-y-4">
      <div className="text-xs text-[#4b5563] uppercase tracking-wider">
        Counting Guide — Hear and See Each Subdivision
      </div>

      {/* Subdivision selector */}
      <div className="flex gap-2 flex-wrap">
        {SUBDIVISIONS.map(sub => (
          <button
            key={sub.id}
            onClick={() => setSelected(sub.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              selected === sub.id
                ? 'border-violet-700 text-violet-300 bg-violet-900/20'
                : 'border-[#2d3748] text-[#6b7280] hover:text-violet-400'
            }`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-[#6b7280]">{subdivision.description}</p>

      {/* Beat grid */}
      <div className="flex gap-1">
        {subdivision.labels.map((label, i) => {
          const isDownbeat = i % subdivision.perBeat === 0
          const isBeatOne = i === 0
          const isActive = currentStep === i

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
            >
              {/* Circle */}
              <div
                className="w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: isActive
                    ? subdivision.color
                    : isBeatOne
                    ? subdivision.color + '44'
                    : isDownbeat
                    ? subdivision.color + '22'
                    : '#1a1f2e',
                  color: isActive
                    ? 'white'
                    : isDownbeat
                    ? '#e2e8f0'
                    : '#4b5563',
                  boxShadow: isActive ? `0 0 12px ${subdivision.color}80` : 'none',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {label}
              </div>
              {/* Beat number indicator */}
              {isDownbeat && (
                <div className="text-[9px] text-[#374151] font-medium">
                  Beat {Math.floor(i / subdivision.perBeat) + 1}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Play button */}
      <button
        onClick={play}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
          playing
            ? 'bg-red-800/50 text-red-300 border border-red-800/40 hover:bg-red-700/50'
            : 'bg-violet-600 text-white hover:bg-violet-500'
        }`}
      >
        {playing ? '■ Stop' : '▶ Play at 120 BPM — count along!'}
      </button>

      {/* Key points */}
      <div className="bg-violet-900/10 border border-violet-800/30 rounded-lg p-3 text-sm text-[#94a3b8] space-y-1">
        <p>
          <strong className="text-violet-300">Downbeats</strong> (the numbers: 1, 2, 3, 4) are
          louder clicks. <strong className="text-violet-300">Upbeats/subdivisions</strong> (+, e, a)
          are softer.
        </p>
        <p>
          Say each syllable out loud while tapping your foot on the downbeats.
          When you can count and tap simultaneously, you're ready to add sticks.
        </p>
      </div>
    </div>
  )
}
