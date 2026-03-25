import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RUDIMENTS_LIBRARY, RudimentDef } from '../../data/practiceLibrary'
import { useMetronomeStore } from '../../stores/useMetronomeStore'
import { audioService } from '../../services/audioService'
import PatternGrid from '../../components/shared/PatternGrid'

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'rolls', label: 'Rolls' },
  { id: 'diddles', label: 'Diddles' },
  { id: 'flams', label: 'Flams' },
  { id: 'drags', label: 'Drags' },
]

export default function RudimentsPracticePage() {
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<RudimentDef | null>(null)
  const [playing, setPlaying] = useState(false)
  const { bpm, setBpm } = useMetronomeStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [currentStep, setCurrentStep] = useState(-1)

  const rudiments = category === 'all'
    ? RUDIMENTS_LIBRARY
    : RUDIMENTS_LIBRARY.filter(r => r.category === category)

  function startPractice(rud: RudimentDef) {
    if (playing) {
      stopPractice()
      return
    }
    setSelected(rud)
    setPlaying(true)
    setBpm(rud.startBpm)

    audioService.startMetronome(rud.startBpm, [4, 4], () => {})

    const stepMs = (60000 / rud.startBpm) / rud.patternData.subdivisions
    const totalSteps = rud.patternData.beats * rud.patternData.subdivisions
    let step = 0
    setCurrentStep(0)

    intervalRef.current = setInterval(() => {
      step = (step + 1) % totalSteps
      setCurrentStep(step)
    }, stepMs)
  }

  function stopPractice() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    audioService.stopMetronome()
    setPlaying(false)
    setCurrentStep(-1)
  }

  function changeBpm(delta: number) {
    const newBpm = Math.max(40, Math.min(200, bpm + delta))
    setBpm(newBpm)
    if (playing && selected) {
      stopPractice()
      setTimeout(() => {
        const rud = { ...selected, startBpm: newBpm }
        startPractice(rud)
      }, 100)
    }
  }

  useEffect(() => () => stopPractice(), [])

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-6">
        <Link to="/practice" className="hover:text-violet-400">Practice</Link>
        <span>›</span>
        <span className="text-[#94a3b8]">Rudiment Trainer</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">🥢 Rudiment Trainer</h1>
        <p className="text-sm text-[#6b7280]">
          Master the essential PAS rudiments. Start slow, nail it, speed up. Select a rudiment below.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              category === c.id
                ? 'border-violet-700 text-violet-300 bg-violet-900/20'
                : 'border-[#2d3748] text-[#6b7280] hover:text-violet-400'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: rudiment list */}
        <div className="col-span-1 space-y-1 max-h-[600px] overflow-y-auto pr-2">
          {rudiments.map(rud => (
            <button
              key={rud.id}
              onClick={() => { stopPractice(); setSelected(rud); setBpm(rud.startBpm) }}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selected?.id === rud.id
                  ? 'border-violet-700 bg-[#13101e]'
                  : 'border-[#1e2433] bg-[#0d1117] hover:border-[#2d3748]'
              }`}
            >
              <div className="text-sm text-white font-medium">{rud.name}</div>
              <div className="text-[10px] text-[#4b5563] mt-0.5 capitalize">{rud.category} · ⚡{rud.difficulty}/10</div>
            </button>
          ))}
        </div>

        {/* Right: selected rudiment detail */}
        <div className="col-span-2">
          {selected ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                <p className="text-sm text-[#6b7280] mt-1">{selected.description}</p>
              </div>

              {/* Sticking */}
              <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-4">
                <div className="text-xs text-[#4b5563] mb-2">Sticking Pattern</div>
                <div className="text-lg font-mono font-bold text-white tracking-widest">
                  {selected.sticking}
                </div>
              </div>

              {/* Pattern grid */}
              <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-4">
                <div className="text-xs text-[#4b5563] mb-2">Pattern</div>
                <PatternGrid
                  pattern={selected.patternData}
                  currentStep={playing ? currentStep : undefined}
                />
              </div>

              {/* BPM control */}
              <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#4b5563]">Tempo</div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => changeBpm(-5)} className="w-8 h-8 rounded-lg bg-[#1e2433] text-[#94a3b8] hover:text-white transition-colors">-</button>
                    <span className="text-white font-bold text-lg w-16 text-center">{bpm}</span>
                    <button onClick={() => changeBpm(5)} className="w-8 h-8 rounded-lg bg-[#1e2433] text-[#94a3b8] hover:text-white transition-colors">+</button>
                  </div>
                </div>
              </div>

              {/* Play/stop */}
              <button
                onClick={() => playing ? stopPractice() : startPractice(selected)}
                className={`w-full py-3 rounded-xl font-semibold text-lg transition-colors ${
                  playing
                    ? 'bg-red-800/50 text-red-300 border border-red-800/40 hover:bg-red-700/50'
                    : 'bg-violet-600 text-white hover:bg-violet-500'
                }`}
              >
                {playing ? '■ Stop' : '▶ Start with Metronome'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-[#4b5563] text-sm">
              Select a rudiment from the list to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
