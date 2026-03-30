import { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { playPianoNote, preloadSamples } from '@piano/services/pianoSounds'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'
import SelfAssessment from './SelfAssessment'

// ── Chord progression data ───────────────────────────────────────────────────

interface ChordStep {
  name: string
  notes: string[]
  fingers: number[]
  beats: number
}

interface ProgressionDef {
  name: string
  description: string
  key: string
  chords: ChordStep[]
}

const PROGRESSIONS: ProgressionDef[] = [
  {
    name: 'I-IV-V7-I in C', description: 'The foundation of Western harmony.', key: 'C',
    chords: [
      { name: 'C', notes: ['C3','E3','G3'], fingers: [5,3,1], beats: 4 },
      { name: 'F', notes: ['F3','A3','C4'], fingers: [5,3,1], beats: 4 },
      { name: 'G7', notes: ['G2','B2','D3','F3'], fingers: [5,3,2,1], beats: 4 },
      { name: 'C', notes: ['C3','E3','G3'], fingers: [5,3,1], beats: 4 },
    ],
  },
  {
    name: 'I-V-vi-IV (Pop)', description: 'The most used progression in pop music.', key: 'C',
    chords: [
      { name: 'C', notes: ['C3','E3','G3'], fingers: [5,3,1], beats: 4 },
      { name: 'G', notes: ['G3','B3','D4'], fingers: [5,3,1], beats: 4 },
      { name: 'Am', notes: ['A3','C4','E4'], fingers: [5,3,1], beats: 4 },
      { name: 'F', notes: ['F3','A3','C4'], fingers: [5,3,1], beats: 4 },
    ],
  },
  {
    name: 'ii-V-I (Jazz)', description: 'The foundation of jazz harmony.', key: 'C',
    chords: [
      { name: 'Dm', notes: ['D3','F3','A3'], fingers: [5,3,1], beats: 4 },
      { name: 'G7', notes: ['G2','B2','D3','F3'], fingers: [5,3,2,1], beats: 4 },
      { name: 'C', notes: ['C3','E3','G3'], fingers: [5,3,1], beats: 4 },
      { name: 'C', notes: ['C3','E3','G3'], fingers: [5,3,1], beats: 4 },
    ],
  },
  {
    name: 'I-IV-V7-I in G', description: 'Primary chords in G major.', key: 'G',
    chords: [
      { name: 'G', notes: ['G3','B3','D4'], fingers: [5,3,1], beats: 4 },
      { name: 'C', notes: ['C3','E3','G3'], fingers: [5,3,1], beats: 4 },
      { name: 'D7', notes: ['D3','F#3','A3','C4'], fingers: [5,3,2,1], beats: 4 },
      { name: 'G', notes: ['G3','B3','D4'], fingers: [5,3,1], beats: 4 },
    ],
  },
  {
    name: 'I-IV-V7-I in F', description: 'Primary chords in F major.', key: 'F',
    chords: [
      { name: 'F', notes: ['F3','A3','C4'], fingers: [5,3,1], beats: 4 },
      { name: 'Bb', notes: ['Bb3','D4','F4'], fingers: [5,3,1], beats: 4 },
      { name: 'C7', notes: ['C3','E3','G3','Bb3'], fingers: [5,3,2,1], beats: 4 },
      { name: 'F', notes: ['F3','A3','C4'], fingers: [5,3,1], beats: 4 },
    ],
  },
]

const accent = '#a78bfa'

// ── Metronome ────────────────────────────────────────────────────────────────

const ctxRef = { current: null as AudioContext | null }
function getCtx() { if (!ctxRef.current) ctxRef.current = new AudioContext(); return ctxRef.current }

function scheduleClick(time: number, strong: boolean) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(strong ? 1200 : 900, time)
  osc.frequency.exponentialRampToValueAtTime(strong ? 600 : 450, time + 0.02)
  gain.gain.setValueAtTime(strong ? 0.1 : 0.06, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06)
  osc.connect(gain).connect(ctx.destination)
  osc.start(time); osc.stop(time + 0.08)
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ChordPracticePage() {
  const [prog, setProg] = useState(PROGRESSIONS[0])
  const [bpm, setBpm] = useState(60)
  const [playing, setPlaying] = useState(false)
  const [activeChordIdx, setActiveChordIdx] = useState(-1)
  const [showAssessment, setShowAssessment] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const animRef = useRef<number>(0)
  const startRef = useRef(0)

  const { addPracticeTime } = usePianoProgressStore()

  useEffect(() => {
    const allNotes = prog.chords.flatMap(c => c.notes)
    preloadSamples([...new Set(allNotes)])
  }, [prog])

  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  const handlePlay = useCallback(() => {
    if (playing) return
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()

    const beatDur = 60 / bpm
    setPlaying(true)
    setActiveChordIdx(0)

    // Build schedule
    let t = 0
    const schedule: { start: number; end: number }[] = []
    for (const chord of prog.chords) {
      schedule.push({ start: t, end: t + chord.beats * beatDur })
      t += chord.beats * beatDur
    }
    const totalDur = t

    const now = ctx.currentTime

    // Schedule chord sounds
    prog.chords.forEach((chord, i) => {
      const chordTime = schedule[i].start
      chord.notes.forEach((note, j) => {
        setTimeout(() => playPianoNote(note, 0.55), chordTime * 1000 + j * 30)
      })
    })

    // Schedule metronome
    const totalBeats = Math.ceil(totalDur / beatDur)
    for (let b = 0; b < totalBeats; b++) {
      scheduleClick(now + b * beatDur, b % 4 === 0)
    }

    // Animate
    startRef.current = performance.now()
    function tick() {
      const elapsed = (performance.now() - startRef.current) / 1000
      if (elapsed >= totalDur) {
        setPlaying(false)
        setActiveChordIdx(-1)
        setSessionCount(c => c + 1)
        return
      }
      const idx = schedule.findIndex(s => elapsed >= s.start && elapsed < s.end)
      if (idx >= 0) setActiveChordIdx(idx)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [playing, prog, bpm])

  function handleFinish() {
    addPracticeTime(Math.max(1, sessionCount))
    setShowAssessment(true)
  }

  if (showAssessment) {
    return <SelfAssessment
      exerciseName={`${prog.name} Chords`}
      sessionCount={sessionCount}
      onDone={() => { setShowAssessment(false); setSessionCount(0) }}
    />
  }

  const activeChord = activeChordIdx >= 0 ? prog.chords[activeChordIdx] : null

  return (
    <div className="p-6 lg:p-8 max-w-[1000px] mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#4b5563] mb-6">
        <Link to="/piano/practice" className="text-[#6b7280] hover:text-violet-400 transition-colors">Practice</Link>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-[#94a3b8]">Chord Drills</span>
      </nav>

      {/* Controls */}
      <div className="rounded-2xl p-5 border border-white/[0.04] mb-6" style={{
        background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
      }}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold block mb-1.5">Progression</label>
            <select value={prog.name} onChange={e => setProg(PROGRESSIONS.find(p => p.name === e.target.value) ?? PROGRESSIONS[0])}
              className="w-full bg-[#161b22] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer"
              style={{ colorScheme: 'dark' }}>
              {PROGRESSIONS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="w-28">
            <label className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold block mb-1.5">BPM</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setBpm(b => Math.max(40, b - 4))} className="w-8 h-8 rounded-lg bg-[#161b22] border border-white/[0.06] text-[#6b7280] hover:text-white flex items-center justify-center cursor-pointer">-</button>
              <span className="text-sm font-mono text-white w-8 text-center">{bpm}</span>
              <button onClick={() => setBpm(b => Math.min(120, b + 4))} className="w-8 h-8 rounded-lg bg-[#161b22] border border-white/[0.06] text-[#6b7280] hover:text-white flex items-center justify-center cursor-pointer">+</button>
            </div>
          </div>
        </div>
        <p className="text-xs text-[#4b5563] mt-2">{prog.description} — Key of {prog.key}</p>
      </div>

      {/* Chord sequence */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {prog.chords.map((chord, i) => {
          const isActive = i === activeChordIdx
          return (
            <div key={i} className="rounded-2xl p-4 border transition-all text-center"
              style={{
                background: isActive ? `${accent}15` : 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
                border: `1px solid ${isActive ? accent : 'rgba(255,255,255,0.04)'}`,
                boxShadow: isActive ? `0 0 20px ${accent}25` : 'none',
              }}>
              <div className="text-2xl font-bold mb-1" style={{ color: isActive ? accent : '#e2e8f0' }}>{chord.name}</div>
              <div className="text-[10px] text-[#6b7280] font-mono">{chord.notes.map(n => n.replace(/\d/, '')).join(' ')}</div>
              <div className="text-[10px] mt-1" style={{ color: `${accent}80` }}>
                {chord.fingers.join('-')}
              </div>
              <div className="mt-2 flex justify-center gap-0.5">
                {Array.from({ length: chord.beats }).map((_, b) => (
                  <div key={b} className="w-2 h-2 rounded-full" style={{
                    background: isActive ? accent : '#1e2433',
                  }} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Active chord detail */}
      {activeChord && (
        <div className="rounded-2xl p-4 border mb-6 text-center" style={{
          background: `${accent}08`, border: `1px solid ${accent}30`,
        }}>
          <span className="text-lg font-bold" style={{ color: accent }}>Now: {activeChord.name}</span>
          <span className="text-sm text-[#6b7280] ml-3">
            Notes: {activeChord.notes.join(' ')} — Fingers: {activeChord.fingers.join('-')}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button onClick={handlePlay} disabled={playing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 cursor-pointer disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${accent}, #8b5cf6)`, boxShadow: `0 4px 20px -4px ${accent}40` }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2l10 6-10 6V2z" /></svg>
            {playing ? 'Playing...' : 'Play Progression'}
          </button>
          {sessionCount > 0 && (
            <button onClick={handleFinish}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer">
              Finish & Assess ({sessionCount})
            </button>
          )}
        </div>
        <div className="text-xs text-[#4b5563]">{bpm} BPM · {prog.chords.length} chords</div>
      </div>
    </div>
  )
}
