import { useState, useRef, useEffect } from 'react'
import { playSnare, playAccentClick } from '../../services/clickSounds'

// ── Rudiment definitions ─────────────────────────────────────────────────────

interface RudimentDef {
  id: string
  name: string
  sticking: string[]       // 'R' or 'L' per stroke
  accents: boolean[]       // true = accented
  description: string
  tip: string
  category: string
}

const RUDIMENTS: RudimentDef[] = [
  {
    id: 'single-stroke',
    name: 'Single Stroke Roll',
    sticking: ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'],
    accents:  [false, false, false, false, false, false, false, false],
    description: 'Alternate hands evenly: R L R L. The most fundamental rudiment — used in fills, rolls, and general playing.',
    tip: 'Focus on matching the volume between hands. Most beginners hit harder with their dominant hand.',
    category: 'Rolls',
  },
  {
    id: 'double-stroke',
    name: 'Double Stroke Roll',
    sticking: ['R', 'R', 'L', 'L', 'R', 'R', 'L', 'L'],
    accents:  [false, false, false, false, false, false, false, false],
    description: 'Two hits per hand: R R L L. Use the stick\'s natural bounce for the second stroke instead of muscling it.',
    tip: 'Let the stick bounce! The first hit is a full stroke, the second is controlled bounce. Slow practice is essential.',
    category: 'Rolls',
  },
  {
    id: 'paradiddle',
    name: 'Single Paradiddle',
    sticking: ['R', 'L', 'R', 'R', 'L', 'R', 'L', 'L'],
    accents:  [true, false, false, false, true, false, false, false],
    description: 'R L R R  L R L L — the accent naturally shifts between hands. Used to change which hand leads a pattern.',
    tip: 'Accent the first note of each group of four. The "diddle" (double) at the end sets up the opposite hand to lead next.',
    category: 'Diddles',
  },
  {
    id: 'flam',
    name: 'Flam',
    sticking: ['(l)R', '(r)L', '(l)R', '(r)L'],
    accents:  [true, true, true, true],
    description: 'A grace note just before the main note. One hand taps softly, the other plays the main stroke almost simultaneously.',
    tip: 'The grace note (small letter) should be very low — barely lifting the stick. The main note is a full stroke.',
    category: 'Flams',
  },
  {
    id: 'drag',
    name: 'Drag (Ruff)',
    sticking: ['(ll)R', '(rr)L', '(ll)R', '(rr)L'],
    accents:  [true, true, true, true],
    description: 'Two grace notes before the main note. Creates a "duh-duh-DAH" pattern that adds weight and power.',
    tip: 'The two grace notes should buzz quickly into the main stroke. Think of it as one motion, not three separate hits.',
    category: 'Drags',
  },
]

// ── Main component ──────────────────────────────────────────────────────────

export default function RudimentsVisual() {
  const [selected, setSelected] = useState<string>('single-stroke')
  const [playing, setPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const rudiment = RUDIMENTS.find(r => r.id === selected)!

  function play() {
    if (playing) {
      stop()
      return
    }
    setPlaying(true)

    const beatMs = 250 // eighth notes at 120 BPM
    let step = 0
    setCurrentStep(0)
    playStrokeSound(rudiment, 0)

    intervalRef.current = setInterval(() => {
      step++
      if (step >= rudiment.sticking.length * 2) {
        stop()
        return
      }
      const idx = step % rudiment.sticking.length
      setCurrentStep(idx)
      playStrokeSound(rudiment, idx)
    }, beatMs)
  }

  function playStrokeSound(rud: RudimentDef, idx: number) {
    const stickLabel = rud.sticking[idx]
    const isAccented = rud.accents[idx]

    // Grace notes (in parentheses) are softer
    if (stickLabel.startsWith('(')) {
      playSnare(0.08)
      // Play a second grace note for drags
      if (stickLabel.length > 3) {
        setTimeout(() => playSnare(0.08), 30)
      }
      setTimeout(() => {
        if (isAccented) playAccentClick(0.3)
        playSnare(0.5)
      }, 50)
    } else if (isAccented) {
      playAccentClick(0.2)
      playSnare(0.55)
    } else {
      playSnare(0.3)
    }
  }

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPlaying(false)
    setCurrentStep(-1)
  }

  useEffect(() => () => stop(), [])
  useEffect(() => { stop() }, [selected])

  // Parse sticking display: separate grace notes from main stroke
  function parseSticking(s: string): { grace: string; main: string } {
    const match = s.match(/^\(([^)]+)\)(.+)$/)
    if (match) return { grace: match[1], main: match[2] }
    return { grace: '', main: s }
  }

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6 space-y-4">
      <div className="text-xs text-[#4b5563] uppercase tracking-wider">
        Rudiments — Sticking Patterns with Sound
      </div>

      {/* Rudiment selector */}
      <div className="flex gap-2 flex-wrap">
        {RUDIMENTS.map(rud => (
          <button
            key={rud.id}
            onClick={() => setSelected(rud.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              selected === rud.id
                ? 'border-violet-700 text-violet-300 bg-violet-900/20'
                : 'border-[#2d3748] text-[#6b7280] hover:text-violet-400'
            }`}
          >
            {rud.name}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-[#6b7280]">{rudiment.description}</p>

      {/* Sticking display */}
      <div className="flex gap-1.5 justify-center">
        {rudiment.sticking.map((stick, i) => {
          const { grace, main } = parseSticking(stick)
          const isActive = currentStep === i
          const isRight = main === 'R'
          const isAccented = rudiment.accents[i]

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              {/* Accent mark */}
              {isAccented && (
                <div className="text-yellow-400 text-xs font-bold" style={{ lineHeight: 1 }}>{'>'}</div>
              )}
              {!isAccented && <div className="h-3" />}

              {/* Grace note(s) */}
              {grace && (
                <div className="text-[9px] text-[#4b5563] -mb-0.5">
                  {grace.split('').map((g, gi) => (
                    <span key={gi} className="italic">{g}</span>
                  ))}
                </div>
              )}

              {/* Main stroke */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  backgroundColor: isActive
                    ? isRight ? '#3b82f6' : '#ef4444'
                    : isRight ? '#3b82f620' : '#ef444420',
                  color: isActive ? 'white' : isRight ? '#60a5fa' : '#f87171',
                  boxShadow: isActive
                    ? `0 0 12px ${isRight ? '#3b82f6' : '#ef4444'}80`
                    : 'none',
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  border: `1px solid ${isActive
                    ? (isRight ? '#3b82f6' : '#ef4444')
                    : '#1e2433'}`,
                }}
              >
                {main}
              </div>

              {/* Hand label */}
              <div className="text-[9px]" style={{ color: isRight ? '#60a5fa' : '#f87171' }}>
                {isRight ? 'Right' : 'Left'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center text-xs text-[#4b5563]">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-blue-600/30 border border-blue-800/50 inline-block" /> Right hand
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-red-600/30 border border-red-800/50 inline-block" /> Left hand
        </span>
        <span className="flex items-center gap-1">
          <span className="text-yellow-400 font-bold">{'>'}</span> Accent
        </span>
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
        {playing ? '■ Stop' : `▶ Play ${rudiment.name}`}
      </button>

      {/* Tip */}
      <div className="bg-violet-900/10 border border-violet-800/30 rounded-lg p-3 text-sm text-[#94a3b8]">
        <strong className="text-violet-300">Tip:</strong> {rudiment.tip}
      </div>
    </div>
  )
}
