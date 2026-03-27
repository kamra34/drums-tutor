import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RUDIMENTS_LIBRARY, RudimentDef } from '@drums/data/practiceLibrary'
import { useMetronomeStore } from '@drums/stores/useMetronomeStore'
import PatternGrid from '@drums/components/PatternGrid'
import MetronomeWidget from '@drums/components/MetronomeWidget'

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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-6">
        <Link to="/practice" className="text-amber-500/80 hover:text-amber-400 transition-colors">Practice</Link>
        <svg className="w-3.5 h-3.5 text-[#2d3748]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-[#94a3b8]">Rudiment Trainer</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Rudiment Trainer</h1>
        <p className="text-sm text-[#6b7280] leading-relaxed">
          Master the essential PAS rudiments. Start slow, nail it, speed up. Select a rudiment below.
        </p>
      </div>

      {/* Category filter */}
      <div className="mb-6">
        <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-3">Category</div>
        <div className="flex gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                category === c.id
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-white/[0.03] border border-white/[0.06] text-[#6b7280] hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: rudiment list */}
        <div className="col-span-1 space-y-1.5 max-h-[600px] overflow-y-auto pr-2">
          {rudiments.map(rud => (
            <button
              key={rud.id}
              onClick={() => { stopPractice(); setSelected(rud); setBpm(rud.startBpm) }}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selected?.id === rud.id
                  ? 'border-amber-500/20 bg-amber-500/[0.06]'
                  : 'border-white/[0.04] hover:border-amber-500/15 hover:bg-white/[0.03]'
              }`}
              style={selected?.id === rud.id ? undefined : { background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
            >
              <div className="text-sm text-white font-medium">{rud.name}</div>
              <div className="text-[10px] text-[#4b5563] mt-0.5 capitalize flex items-center gap-1">
                {rud.category}
                <span className="text-[#2d3748] mx-0.5">·</span>
                <svg className="w-2.5 h-2.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {rud.difficulty}/10
              </div>
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
              <div className="rounded-2xl p-5 border border-white/[0.04]" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
                <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">Sticking Pattern</div>
                <div className="text-lg font-mono font-bold text-white tracking-widest">
                  {selected.sticking}
                </div>
              </div>

              {/* Pattern grid */}
              <div className="rounded-2xl p-5 border border-white/[0.04]" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
                <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">Pattern</div>
                <PatternGrid
                  pattern={selected.patternData}
                  currentStep={playing ? currentStep : undefined}
                />
              </div>

              {/* Tempo + Metronome */}
              <div className="rounded-2xl p-5 border border-white/[0.04]" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">Tempo</div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => changeBpm(-5)} className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.07] transition-colors cursor-pointer">-</button>
                    <span className="text-white font-bold text-lg w-16 text-center">{bpm}</span>
                    <button onClick={() => changeBpm(5)} className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.07] transition-colors cursor-pointer">+</button>
                  </div>
                </div>
                <MetronomeWidget />
              </div>

              {/* Play/stop pattern */}
              <button
                onClick={() => playing ? stopPractice() : startPractice(selected)}
                className={`w-full py-3 rounded-xl font-semibold text-lg transition-colors cursor-pointer ${
                  playing
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/15'
                    : 'text-white border-0'
                }`}
                style={playing ? undefined : { background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 20px -4px rgba(245,158,11,0.35)' }}
              >
                {playing ? '■ Stop' : '▶ Start Pattern'}
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
