import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { playPianoNote, preloadSamples } from '@piano/services/pianoSounds'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'
import SelfAssessment from './SelfAssessment'

// ── Scale data ───────────────────────────────────────────────────────────────

interface ScaleDef {
  name: string
  notes: string[]
  fingers: { rh: number[]; lh: number[] }
  category: string
}

const SCALES: ScaleDef[] = [
  { name: 'C Major', notes: ['C4','D4','E4','F4','G4','A4','B4','C5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'major' },
  { name: 'G Major', notes: ['G4','A4','B4','C5','D5','E5','F#5','G5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'major' },
  { name: 'F Major', notes: ['F4','G4','A4','Bb4','C5','D5','E5','F5'], fingers: { rh: [1,2,3,4,1,2,3,4], lh: [5,4,3,2,1,3,2,1] }, category: 'major' },
  { name: 'A Natural Minor', notes: ['A4','B4','C5','D5','E5','F5','G5','A5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'minor' },
  { name: 'D Natural Minor', notes: ['D4','E4','F4','G4','A4','Bb4','C5','D5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'minor' },
  { name: 'D Harmonic Minor', notes: ['D4','E4','F4','G4','A4','Bb4','C#5','D5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'minor' },
  { name: 'Chromatic (1 octave)', notes: ['C4','C#4','D4','Eb4','E4','F4','F#4','G4','Ab4','A4','Bb4','B4','C5'], fingers: { rh: [1,3,1,3,1,1,3,1,3,1,3,1,1], lh: [1,3,1,3,1,1,3,1,3,1,3,1,1] }, category: 'chromatic' },
]

// ── Keyboard rendering ───────────────────────────────────────────────────────

const W_W = 34, W_H = 110, B_W = 21, B_H = 68, GAP = 1
const WHITE_NOTES = ['C','D','E','F','G','A','B']
const BLACK_OFF: Record<string, number> = { C: 0.65, D: 0.65, F: 0.65, G: 0.65, A: 0.65 }

interface KeyDef { note: string; x: number; isBlack: boolean }

function buildKeys(startOct: number, octaves: number): KeyDef[] {
  const keys: KeyDef[] = []
  let x = 0
  for (let o = startOct; o < startOct + octaves; o++) {
    for (const wn of WHITE_NOTES) {
      keys.push({ note: `${wn}${o}`, x, isBlack: false })
      if (BLACK_OFF[wn] !== undefined) keys.push({ note: `${wn}#${o}`, x: x + W_W * BLACK_OFF[wn], isBlack: true })
      x += W_W + GAP
    }
  }
  keys.push({ note: `C${startOct + octaves}`, x, isBlack: false })
  return keys
}

function norm(n: string) { return n.replace(/\s/g, '') }

// ── Metronome click ──────────────────────────────────────────────────────────

const ctxRef = { current: null as AudioContext | null }
function getCtx() { if (!ctxRef.current) ctxRef.current = new AudioContext(); return ctxRef.current }

function scheduleClick(time: number, accent: boolean) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(accent ? 1200 : 900, time)
  osc.frequency.exponentialRampToValueAtTime(accent ? 600 : 450, time + 0.02)
  gain.gain.setValueAtTime(accent ? 0.1 : 0.06, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06)
  osc.connect(gain).connect(ctx.destination)
  osc.start(time); osc.stop(time + 0.08)
}

// ── Component ────────────────────────────────────────────────────────────────

const accent = '#a78bfa'

export default function ScalePracticePage() {
  const [scale, setScale] = useState(SCALES[0])
  const [hand, setHand] = useState<'rh' | 'lh'>('rh')
  const [bpm, setBpm] = useState(72)
  const [ascending, setAscending] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [showAssessment, setShowAssessment] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const animRef = useRef<number>(0)
  const startRef = useRef(0)
  const scheduleRef = useRef<{ start: number; end: number }[]>([])

  const { addPracticeTime } = usePianoProgressStore()

  // Build the note sequence (ascending + descending if selected)
  const noteSeq = ascending
    ? [...scale.notes, ...scale.notes.slice(0, -1).reverse()]
    : [...scale.notes.slice().reverse(), ...scale.notes.slice(1)]

  const fingerSeq = (() => {
    const f = hand === 'rh' ? scale.fingers.rh : scale.fingers.lh
    if (ascending) return [...f, ...f.slice(0, -1).reverse()]
    return [...f.slice().reverse(), ...f.slice(1)]
  })()

  // Preload
  useEffect(() => {
    preloadSamples([...new Set(scale.notes)])
  }, [scale])

  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  const handlePlay = useCallback(() => {
    if (playing) return

    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()

    const beatDur = 60 / bpm
    const schedule: { start: number; end: number }[] = []
    let t = 0
    for (let i = 0; i < noteSeq.length; i++) {
      schedule.push({ start: t, end: t + beatDur })
      t += beatDur
    }
    scheduleRef.current = schedule
    const totalDur = t

    setPlaying(true)
    setActiveIdx(0)

    const now = ctx.currentTime

    // Schedule all notes
    noteSeq.forEach((note, i) => {
      setTimeout(() => playPianoNote(note, 0.6), schedule[i].start * 1000)
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
        setActiveIdx(-1)
        setSessionCount(c => c + 1)
        return
      }
      const idx = schedule.findIndex(s => elapsed >= s.start && elapsed < s.end)
      if (idx >= 0) setActiveIdx(idx)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [playing, noteSeq, bpm])

  function handleFinishPractice() {
    addPracticeTime(Math.max(1, Math.round(sessionCount * noteSeq.length * (60 / bpm) / 60)))
    setShowAssessment(true)
  }

  // Keyboard
  const noteOctaves = scale.notes.map(n => parseInt(n.replace(/[^0-9]/g, '')))
  const minOct = Math.min(...noteOctaves)
  const maxOct = Math.max(...noteOctaves)
  const keys = buildKeys(minOct, maxOct - minOct + 1)
  const whites = keys.filter(k => !k.isBlack)
  const blacks = keys.filter(k => k.isBlack)
  const totalW = whites.length * (W_W + GAP) - GAP
  const svgW = totalW + 4
  const svgH = W_H + 26

  const activeNote = activeIdx >= 0 ? norm(noteSeq[activeIdx]) : null
  const scaleSet = new Set(scale.notes.map(norm))
  const activeFinger = activeIdx >= 0 ? fingerSeq[activeIdx] : undefined

  if (showAssessment) {
    return <SelfAssessment
      exerciseName={`${scale.name} Scale (${hand === 'rh' ? 'RH' : 'LH'})`}
      sessionCount={sessionCount}
      onDone={() => { setShowAssessment(false); setSessionCount(0) }}
    />
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1000px] mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#4b5563] mb-6">
        <Link to="/piano/practice" className="text-[#6b7280] hover:text-violet-400 transition-colors">Practice</Link>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-[#94a3b8]">Scale Practice</span>
      </nav>

      {/* Controls */}
      <div className="rounded-2xl p-5 border border-white/[0.04] mb-6" style={{
        background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
      }}>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Scale selector */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold block mb-1.5">Scale</label>
            <select
              value={scale.name}
              onChange={e => setScale(SCALES.find(s => s.name === e.target.value) ?? SCALES[0])}
              className="w-full bg-[#161b22] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              {SCALES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          {/* Hand */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold block mb-1.5">Hand</label>
            <div className="flex gap-1">
              {(['rh', 'lh'] as const).map(h => (
                <button key={h} onClick={() => setHand(h)}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  style={{ background: hand === h ? `${accent}20` : '#161b22', color: hand === h ? accent : '#6b7280', border: `1px solid ${hand === h ? `${accent}40` : 'rgba(255,255,255,0.06)'}` }}>
                  {h === 'rh' ? 'Right' : 'Left'}
                </button>
              ))}
            </div>
          </div>

          {/* BPM */}
          <div className="w-28">
            <label className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold block mb-1.5">BPM</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setBpm(b => Math.max(40, b - 4))} className="w-8 h-8 rounded-lg bg-[#161b22] border border-white/[0.06] text-[#6b7280] hover:text-white flex items-center justify-center cursor-pointer">-</button>
              <span className="text-sm font-mono text-white w-8 text-center">{bpm}</span>
              <button onClick={() => setBpm(b => Math.min(160, b + 4))} className="w-8 h-8 rounded-lg bg-[#161b22] border border-white/[0.06] text-[#6b7280] hover:text-white flex items-center justify-center cursor-pointer">+</button>
            </div>
          </div>

          {/* Direction */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold block mb-1.5">Direction</label>
            <button onClick={() => setAscending(a => !a)}
              className="px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
              style={{ background: '#161b22', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)' }}>
              {ascending ? '↑ Up & Down' : '↓ Down & Up'}
            </button>
          </div>
        </div>
      </div>

      {/* Note sequence bar */}
      <div className="rounded-2xl p-4 border border-white/[0.04] mb-4" style={{
        background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
      }}>
        <div className="flex gap-1 overflow-x-auto py-1">
          {noteSeq.map((n, i) => {
            const letter = n.replace(/\d/, '')
            const isActive = i === activeIdx
            const isPast = activeIdx >= 0 && i < activeIdx
            return (
              <div key={i} className="flex flex-col items-center justify-center rounded-lg px-1.5 py-1.5 transition-all duration-75 min-w-[28px]"
                style={{
                  background: isActive ? `${accent}30` : isPast ? `${accent}08` : '#161b22',
                  border: `1px solid ${isActive ? accent : 'transparent'}`,
                  boxShadow: isActive ? `0 0 10px ${accent}40` : 'none',
                }}>
                <span className="text-xs font-bold" style={{ color: isActive ? accent : isPast ? '#4b5563' : '#94a3b8' }}>{letter}</span>
                <span className="text-[9px]" style={{ color: isActive ? `${accent}cc` : '#374151' }}>{fingerSeq[i]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Keyboard */}
      <div className="rounded-2xl p-4 border border-white/[0.04] mb-6" style={{
        background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
      }}>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="mx-auto" style={{ maxWidth: `${svgW}px`, width: '100%', height: 'auto' }}>
            <g transform="translate(2, 2)">
              {whites.map(k => {
                const inScale = scaleSet.has(norm(k.note))
                const isHit = norm(k.note) === activeNote
                const scaleIdx = noteSeq.findIndex(n => norm(n) === norm(k.note) && noteSeq.indexOf(n) === activeIdx)
                return (
                  <g key={k.note}>
                    <rect x={k.x} y={0} width={W_W} height={W_H} rx={3}
                      fill={isHit ? accent : inScale ? `${accent}20` : '#f0f0f0'}
                      stroke={inScale ? accent : '#999'} strokeWidth={inScale ? 1.2 : 0.5}
                      style={{ transition: 'fill 0.06s' }} />
                    {inScale && !isHit && <circle cx={k.x + W_W / 2} cy={W_H - 16} r={4} fill={accent} opacity={0.6} />}
                    {isHit && activeFinger != null && (
                      <text x={k.x + W_W / 2} y={W_H + 15} textAnchor="middle" fill={accent} fontSize={12} fontWeight={700} fontFamily="system-ui">{activeFinger}</text>
                    )}
                  </g>
                )
              })}
              {blacks.map(k => {
                const inScale = scaleSet.has(norm(k.note))
                const isHit = norm(k.note) === activeNote
                return (
                  <g key={k.note}>
                    <rect x={k.x} y={0} width={B_W} height={B_H} rx={2}
                      fill={isHit ? accent : inScale ? `${accent}bb` : '#1a1a1a'}
                      stroke={inScale ? accent : '#000'} strokeWidth={inScale ? 1.2 : 0.5}
                      style={{ transition: 'fill 0.06s' }} />
                  </g>
                )
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={handlePlay}
            disabled={playing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 cursor-pointer disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${accent}, #8b5cf6)`, boxShadow: `0 4px 20px -4px ${accent}40` }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2l10 6-10 6V2z" /></svg>
            {playing ? 'Playing...' : 'Play Scale'}
          </button>

          {sessionCount > 0 && (
            <button onClick={handleFinishPractice}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer">
              Finish & Self-Assess ({sessionCount} run{sessionCount > 1 ? 's' : ''})
            </button>
          )}
        </div>

        <div className="text-xs text-[#4b5563]">
          {hand === 'rh' ? 'Right Hand' : 'Left Hand'} · {bpm} BPM · {noteSeq.length} notes
        </div>
      </div>
    </div>
  )
}
