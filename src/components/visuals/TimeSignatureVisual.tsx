import { useState, useEffect, useRef } from 'react'
import { playAccentClick, playSnare, playNormalClick } from '../../services/clickSounds'

interface TimeSig {
  id: string
  top: number
  bottom: number
  description: string
  feel: string
  examples: string[]
  accentPattern: number[] // which beats are accented (0-indexed)
}

const TIME_SIGS: TimeSig[] = [
  {
    id: '4/4',
    top: 4,
    bottom: 4,
    description: '4 quarter-note beats per measure. The most common time signature in rock, pop, and jazz.',
    feel: 'ONE two three four | ONE two three four',
    examples: ['Most rock & pop songs', 'Hip-hop', 'Jazz standards', 'Blues'],
    accentPattern: [0],
  },
  {
    id: '3/4',
    top: 3,
    bottom: 4,
    description: '3 quarter-note beats per measure. Gives a "waltz" or circular feel.',
    feel: 'ONE two three | ONE two three',
    examples: ['Waltzes', 'Country ballads', 'Some jazz', '"My Favorite Things"'],
    accentPattern: [0],
  },
  {
    id: '6/8',
    top: 6,
    bottom: 8,
    description: '6 eighth-note beats per measure, felt in 2 groups of 3. Rocking, compound feel.',
    feel: 'ONE two three FOUR five six',
    examples: ['Irish jigs', '"House of the Rising Sun"', 'Some blues', 'Compound grooves'],
    accentPattern: [0, 3],
  },
  {
    id: '5/4',
    top: 5,
    bottom: 4,
    description: '5 quarter-note beats — an "odd" time signature. Sounds slightly off-balance.',
    feel: 'ONE two THREE four five OR ONE TWO three four five',
    examples: ['"Take Five" (Dave Brubeck)', '"Mission: Impossible"', 'Progressive rock'],
    accentPattern: [0, 2],
  },
]

export default function TimeSignatureVisual() {
  const [active, setActive] = useState('4/4')
  const [currentBeat, setCurrentBeat] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sig = TIME_SIGS.find((s) => s.id === active)!

  function togglePlay() {
    if (isPlaying) {
      clearInterval(intervalRef.current!)
      setIsPlaying(false)
      setCurrentBeat(-1)
      return
    }

    setIsPlaying(true)
    setCurrentBeat(0)
    // Play first beat immediately
    playAccentClick()

    let beat = 0
    intervalRef.current = setInterval(() => {
      beat = (beat + 1) % sig.top
      setCurrentBeat(beat)
      // Accented beats get a snare hit, other beats get a click
      if (sig.accentPattern.includes(beat)) {
        playAccentClick()
        playSnare(0.25)
      } else {
        playNormalClick()
      }
    }, 500) // 120 BPM quarter notes
  }

  // Stop when changing sig
  function changeSig(id: string) {
    clearInterval(intervalRef.current!)
    setIsPlaying(false)
    setCurrentBeat(-1)
    setActive(id)
  }

  useEffect(() => () => clearInterval(intervalRef.current!), [])
  // Reset when sig changes
  useEffect(() => {
    setCurrentBeat(-1)
  }, [active])

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6 space-y-5">
      <div className="text-xs text-[#4b5563] uppercase tracking-wider">Time Signatures — Interactive</div>

      {/* Sig selector */}
      <div className="flex gap-2 flex-wrap">
        {TIME_SIGS.map((s) => (
          <button
            key={s.id}
            onClick={() => changeSig(s.id)}
            className={`px-4 py-2 rounded-lg transition-all ${
              active === s.id
                ? 'bg-violet-700 text-white font-bold'
                : 'bg-[#1a1f2e] text-[#6b7280] hover:text-white'
            }`}
          >
            <span className="text-lg font-mono leading-none">{s.id}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-6 flex-col md:flex-row items-start">
        {/* Beat visualizer */}
        <div className="flex flex-col items-center gap-4 flex-shrink-0">
          {/* Big time sig display */}
          <div className="relative w-16 h-16 flex flex-col items-center justify-center bg-[#13101e] border-2 border-violet-800 rounded-lg">
            <span className="text-3xl font-bold text-violet-300 leading-none">{sig.top}</span>
            <div className="w-10 h-0.5 bg-violet-700 my-0.5" />
            <span className="text-3xl font-bold text-violet-400 leading-none">{sig.bottom}</span>
          </div>

          {/* Beat circles */}
          <div className="flex gap-2 flex-wrap justify-center max-w-48">
            {Array.from({ length: sig.top }).map((_, i) => {
              const isAccent = sig.accentPattern.includes(i)
              const isCurrent = currentBeat === i

              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className="rounded-full flex items-center justify-center font-bold transition-all duration-100"
                    style={{
                      width: isAccent ? '44px' : '36px',
                      height: isAccent ? '44px' : '36px',
                      backgroundColor: isCurrent
                        ? isAccent ? '#7c3aed' : '#4f46e5'
                        : isAccent ? '#1e1030' : '#0f172a',
                      border: isCurrent
                        ? `2px solid ${isAccent ? '#a78bfa' : '#818cf8'}`
                        : `2px solid ${isAccent ? '#4c1d95' : '#1e293b'}`,
                      boxShadow: isCurrent ? `0 0 12px ${isAccent ? '#7c3aed' : '#4f46e5'}` : 'none',
                      transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                      color: isCurrent ? 'white' : isAccent ? '#7c3aed' : '#374151',
                      fontSize: '13px',
                    }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-[10px] text-[#374151]">{isAccent ? 'ONE' : ''}</span>
                </div>
              )
            })}
          </div>

          {/* Play button */}
          <button
            onClick={togglePlay}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isPlaying
                ? 'bg-red-800/50 border border-red-700/50 text-red-300 hover:bg-red-700/50'
                : 'bg-violet-700 text-white hover:bg-violet-600'
            }`}
          >
            {isPlaying ? '■ Stop' : '▶ Animate'}
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-sm text-[#94a3b8] leading-relaxed">{sig.description}</p>
          </div>

          <div>
            <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-2">Count aloud</div>
            <div className="bg-[#1a1f2e] rounded-lg px-4 py-2 font-mono text-sm text-violet-300 tracking-wider">
              {sig.feel}
            </div>
          </div>

          <div>
            <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-2">You'll hear it in</div>
            <ul className="space-y-1">
              {sig.examples.map((ex) => (
                <li key={ex} className="flex gap-2 text-sm text-[#6b7280]">
                  <span className="text-violet-600">•</span>
                  {ex}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[#1e2433] pt-3 text-xs text-[#4b5563]">
        The top number tells you how many beats are in each measure. The bottom number tells you what kind of note gets one beat (4 = quarter note, 8 = eighth note).
      </div>
    </div>
  )
}
