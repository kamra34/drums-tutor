import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { getExerciseById, getModuleById } from '@piano/data/curriculum'
import { playPianoNote, preloadSamples } from '@piano/services/pianoSounds'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'
import SelfAssessment from './practice/SelfAssessment'
import type { NoteEvent, ChordEvent } from '@piano/types/curriculum'

// ═══════════════════════════════════════════════════════════════════════════════
// Audio Engine — tick-based so we can stop/pause at any time
// ═══════════════════════════════════════════════════════════════════════════════

const ctxRef = { current: null as AudioContext | null }
function getCtx() { if (!ctxRef.current) ctxRef.current = new AudioContext(); return ctxRef.current }

function clickNow(accentBeat: boolean, volume: number) {
  const ctx = getCtx()
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(accentBeat ? 1200 : 900, t)
  osc.frequency.exponentialRampToValueAtTime(accentBeat ? 600 : 450, t + 0.02)
  const v = volume * (accentBeat ? 0.1 : 0.06)
  gain.gain.setValueAtTime(v, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t); osc.stop(t + 0.08)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Keyboard Rendering
// ═══════════════════════════════════════════════════════════════════════════════

interface KeyInfo { note: string; isBlack: boolean; x: number }

function buildKeys(startOctave: number, octaveCount: number, kw: number, kh: number, bw: number, gap: number): KeyInfo[] {
  const keys: KeyInfo[] = []
  const wn = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const bn = ['Db', 'Eb', '', 'Gb', 'Ab', 'Bb', '']
  let wx = 0
  for (let o = startOctave; o < startOctave + octaveCount; o++) {
    for (let i = 0; i < 7; i++) {
      keys.push({ note: `${wn[i]}${o}`, isBlack: false, x: wx })
      if (bn[i]) keys.push({ note: `${bn[i]}${o}`, isBlack: true, x: wx + kw - bw / 2 + gap / 2 })
      wx += kw + gap
    }
  }
  keys.push({ note: `C${startOctave + octaveCount}`, isBlack: false, x: wx })
  return keys
}

function noteMatch(a: string, b: string): boolean {
  if (a === b) return true
  const en: Record<string, string> = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' }
  const norm = (s: string) => s.replace(/(\D+)(\d)/, (_, n: string, o: string) => `${en[n] || n}${o}`)
  return norm(a) === norm(b)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Keyboard SVG Component
// ═══════════════════════════════════════════════════════════════════════════════

function KeyboardSVG({ keys, activeNotes, currentFinger, allExerciseNotes, large }: {
  keys: KeyInfo[]; activeNotes: string[]; currentFinger?: number; allExerciseNotes: string[]; large?: boolean
}) {
  const kw = large ? 36 : 30, kh = large ? 120 : 100
  const bw = large ? 22 : 19, bh = large ? 74 : 62
  const gap = 1.5
  const whites = keys.filter(k => !k.isBlack)
  const blacks = keys.filter(k => k.isBlack)
  const totalWPx = whites.length * (kw + gap) - gap
  const svgW = totalWPx + 4
  const svgH = kh + 30

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ maxHeight: large ? 220 : 180, minWidth: 380 }} className="block">
      <defs>
        <linearGradient id="keyGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={svgW} height={svgH} fill="url(#keyGlow)" rx="8" />
      {whites.map(k => {
        const isActive = activeNotes.some(n => noteMatch(n, k.note))
        const inEx = allExerciseNotes.some(n => noteMatch(n, k.note))
        return (
          <g key={k.note} onClick={() => playPianoNote(k.note, 0.6)} className="cursor-pointer">
            <rect x={k.x + 2} y={16} width={kw} height={kh} rx={3}
              fill={isActive ? '#a78bfa' : inEx ? '#f0f0ff' : '#f8fafc'}
              stroke={isActive ? '#8b5cf6' : inEx ? '#c4b5fd' : '#cbd5e1'}
              strokeWidth={isActive ? 1.5 : 0.5} style={{ transition: 'fill 0.08s' }} />
            {isActive && <rect x={k.x + 2} y={16} width={kw} height={kh} rx={3} fill="none" stroke="#a78bfa" strokeWidth={2} opacity={0.5}>
              <animate attributeName="opacity" values="0.5;0.15;0.5" dur="0.5s" repeatCount="indefinite" /></rect>}
            <text x={k.x + 2 + kw / 2} y={kh + 12} textAnchor="middle" fontSize={large ? 9 : 7.5} fill={isActive ? '#e2e8f0' : '#64748b'} fontWeight={isActive ? 700 : 400}>{k.note}</text>
          </g>
        )
      })}
      {blacks.map(k => {
        const isActive = activeNotes.some(n => noteMatch(n, k.note))
        return (
          <g key={k.note} onClick={() => playPianoNote(k.note, 0.6)} className="cursor-pointer">
            <rect x={k.x + 2} y={16} width={bw} height={bh} rx={2.5}
              fill={isActive ? '#a78bfa' : '#1e293b'} stroke={isActive ? '#8b5cf6' : '#334155'}
              strokeWidth={isActive ? 1.5 : 0.5} style={{ transition: 'fill 0.08s' }} />
            {isActive && <rect x={k.x + 2} y={16} width={bw} height={bh} rx={2.5} fill="none" stroke="#a78bfa" strokeWidth={2} opacity={0.5}>
              <animate attributeName="opacity" values="0.5;0.15;0.5" dur="0.5s" repeatCount="indefinite" /></rect>}
          </g>
        )
      })}
      {currentFinger != null && activeNotes.length > 0 && (() => {
        const key = keys.find(k => noteMatch(k.note, activeNotes[0]))
        if (!key) return null
        const cx = key.x + 2 + (key.isBlack ? bw / 2 : kw / 2)
        return (<g>
          <circle cx={cx} cy={8} r={8} fill="#8b5cf6" />
          <circle cx={cx} cy={8} r={8} fill="none" stroke="#a78bfa" strokeWidth={1.5} opacity={0.5}>
            <animate attributeName="r" values="8;11;8" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <text x={cx} y={11.5} textAnchor="middle" fontSize={10} fill="#fff" fontWeight={700}>{currentFinger}</text>
        </g>)
      })()}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Notation SVG Component
// ═══════════════════════════════════════════════════════════════════════════════

const NOTE_POS: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }

function getNoteY(note: string, clef: 'treble' | 'bass'): number {
  const name = note.replace(/[0-9#b]/g, '')
  const oct = parseInt(note.replace(/[^0-9]/g, ''))
  const pos = NOTE_POS[name] ?? 0
  if (clef === 'treble') return 50 - ((oct - 4) * 7 + pos - 6) * 5
  return 50 - ((oct - 3) * 7 + pos - 1) * 5
}

// Combined notation + grid: shares the same X layout so grid cells align under their notes
function NotationWithGrid({ events, activeIdx, timeSig, large, onClickNote }: {
  events: PlayEvent[]; activeIdx: number; timeSig: [number, number]; large?: boolean
  onClickNote: (idx: number) => void
}) {
  const allNotes = events.flatMap(e => e.type === 'note' ? [e.note] : e.notes)
  const octs = allNotes.map(n => parseInt(n.replace(/[^0-9]/g, '')))
  const avg = octs.length ? octs.reduce((a, b) => a + b, 0) / octs.length : 4
  const clef: 'treble' | 'bass' = avg >= 4 ? 'treble' : 'bass'
  const sp = large ? 56 : 48, lp = 70
  const totalW = lp + events.length * sp + 40
  const staffH = large ? 140 : 120
  const gridH = large ? 44 : 38
  const svgH = staffH + gridH
  const sTop = large ? 38 : 30, lg = large ? 12 : 10
  const lines = [0, 1, 2, 3, 4].map(i => sTop + i * lg)
  const gridY = staffH

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${svgH}`} width={totalW} height={svgH} className="block min-w-full">
        {/* Staff lines */}
        {lines.map((y, i) => <line key={i} x1={10} y1={y} x2={totalW - 10} y2={y} stroke="#2d3748" strokeWidth={0.8} />)}
        {/* Clef */}
        <text x={18} y={clef === 'treble' ? sTop + 3.2 * lg : sTop + 2.5 * lg} fontSize={large ? 44 : 38} fill="#6b7280" fontFamily="serif">
          {clef === 'treble' ? '\u{1D11E}' : '\u{1D122}'}
        </text>
        {/* Time sig */}
        <text x={50} y={sTop + 1.5 * lg} fontSize={large ? 16 : 14} fill="#6b7280" fontWeight={700} fontFamily="serif">{timeSig[0]}</text>
        <text x={50} y={sTop + 3.2 * lg} fontSize={large ? 16 : 14} fill="#6b7280" fontWeight={700} fontFamily="serif">{timeSig[1]}</text>

        {/* Divider between notation and grid */}
        <line x1={10} y1={gridY} x2={totalW - 10} y2={gridY} stroke="#1e2433" strokeWidth={1} />

        {/* Notes + grid cells (aligned on same X) */}
        {events.map((ev, i) => {
          const x = lp + i * sp
          const isAct = i === activeIdx
          const isPast = activeIdx >= 0 && i < activeIdx
          const isHalf = ev.duration >= 2, isWhole = ev.duration >= 4
          const col = isAct ? '#a78bfa' : '#e2e8f0'
          const centerY = sTop + 2 * lg

          // Collect ALL notes to render (single note or chord stack)
          const notesToRender: string[] = ev.type === 'note' ? [ev.note] : ev.notes
          const noteYPositions = notesToRender.map(n => {
            const rawY = getNoteY(n, clef)
            return centerY - (rawY - 50)
          })
          const topNoteY = Math.min(...noteYPositions)
          const bottomNoteY = Math.max(...noteYPositions)

          // Collect all ledger lines needed across all notes in this event
          const allLedgers = new Set<number>()
          for (const nY of noteYPositions) {
            if (nY < sTop - 2) for (let ly = sTop - lg; ly >= nY - 2; ly -= lg) allLedgers.add(ly)
            if (nY > sTop + 4 * lg + 2) for (let ly = sTop + 5 * lg; ly <= nY + 2; ly += lg) allLedgers.add(ly)
          }

          // Grid cell dimensions
          const cellW = sp - 4, cellH = gridH - 8
          const cellX = x - cellW / 2, cellY = gridY + 4

          return (
            <g key={i}>
              {/* ── Notation part ── */}
              <g opacity={isPast ? 0.3 : 1}>
                {/* Glow around the chord/note cluster */}
                {isAct && <circle cx={x} cy={(topNoteY + bottomNoteY) / 2} r={large ? 16 : 14} fill="#a78bfa" opacity={0.15}>
                  <animate attributeName="r" values={large ? '14;18;14' : '12;16;12'} dur="0.6s" repeatCount="indefinite" /></circle>}

                {/* Ledger lines (shared across all notes) */}
                {[...allLedgers].map((ly, li) => <line key={li} x1={x - 10} y1={ly} x2={x + 10} y2={ly} stroke={isAct ? '#a78bfa' : '#4b5563'} strokeWidth={0.8} />)}

                {/* Render each notehead */}
                {notesToRender.map((note, ni) => {
                  const nY = noteYPositions[ni]
                  const hasAcc = note.includes('b') || note.includes('#')
                  return (
                    <g key={ni}>
                      {hasAcc && <text x={x - 12} y={nY + 4} fontSize={11} fill={isAct ? '#c4b5fd' : '#6b7280'} fontFamily="serif">{note.includes('b') ? '\u266D' : '\u266F'}</text>}
                      {isWhole
                        ? <ellipse cx={x} cy={nY} rx={7} ry={5} fill="none" stroke={col} strokeWidth={1.5} />
                        : <ellipse cx={x} cy={nY} rx={6} ry={4.5}
                            fill={isHalf ? 'none' : col} stroke={col}
                            strokeWidth={isHalf ? 1.5 : 0}
                            transform={`rotate(-10 ${x} ${nY})`} />
                      }
                    </g>
                  )
                })}

                {/* Single shared stem (for non-whole notes) — from top note up */}
                {!isWhole && <>
                  <line x1={x + 6} y1={bottomNoteY} x2={x + 6} y2={topNoteY - 28} stroke={col} strokeWidth={1.2} />
                  {ev.duration <= 0.5 && <path d={`M${x + 6} ${topNoteY - 28} q 8 8 2 18`} fill="none" stroke={col} strokeWidth={1.2} />}
                  {ev.duration <= 0.25 && <path d={`M${x + 6} ${topNoteY - 22} q 8 8 2 18`} fill="none" stroke={col} strokeWidth={1.2} />}
                </>}

                {/* Dot for dotted notes */}
                {(ev.duration === 1.5 || ev.duration === 3) && <circle cx={x + 10} cy={topNoteY - 2} r={1.5} fill={col} />}

                {/* Finger number */}
                {ev.finger && <text x={x} y={sTop + 4 * lg + 22} textAnchor="middle" fontSize={9} fill={isAct ? '#a78bfa' : '#4b5563'} fontWeight={600}>{ev.finger}</text>}

                {/* Chord name above staff */}
                {ev.type === 'chord' && <text x={x} y={sTop - 10} textAnchor="middle" fontSize={10} fill={isAct ? '#c4b5fd' : '#6b7280'} fontWeight={600}>{ev.name}</text>}
              </g>

              {/* Alignment connector line */}
              {isAct && <line x1={x} y1={sTop + 4 * lg + (ev.finger ? 26 : 6)} x2={x} y2={cellY} stroke="#a78bfa" strokeWidth={1} opacity={0.3} strokeDasharray="2 2" />}

              {/* ── Grid cell (clickable) ── */}
              <g className="cursor-pointer" onClick={() => onClickNote(i)} opacity={isPast ? 0.3 : 1}>
                <rect x={cellX} y={cellY} width={cellW} height={cellH} rx={6}
                  fill={isAct ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.02)'}
                  stroke={isAct ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.04)'}
                  strokeWidth={isAct ? 1.5 : 0.5} />
                {isAct && <rect x={cellX} y={cellY} width={cellW} height={cellH} rx={6}
                  fill="none" stroke="#a78bfa" strokeWidth={1.5} opacity={0.3}>
                  <animate attributeName="opacity" values="0.3;0.1;0.3" dur="0.6s" repeatCount="indefinite" />
                </rect>}
                <text x={x} y={cellY + cellH / 2 + (large ? 4 : 3.5)} textAnchor="middle"
                  fontSize={large ? 11 : 10} fontWeight={isAct ? 700 : 500}
                  fill={isAct ? '#fff' : '#6b7280'}>
                  {ev.type === 'chord' ? ev.name : ev.note}
                </text>
              </g>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

type PlayState = 'idle' | 'playing' | 'paused'

export default function PianoExercisePage() {
  const { moduleId, exerciseId } = useParams<{ moduleId: string; exerciseId: string }>()
  const [searchParams] = useSearchParams()
  const fromPractice = searchParams.get('from') === 'practice'
  const module = moduleId ? getModuleById(moduleId) : undefined
  const exercise = exerciseId ? getExerciseById(exerciseId) : undefined
  const { addPracticeTime } = usePianoProgressStore()

  const [showAssessment, setShowAssessment] = useState(false)
  const [bpm, setBpm] = useState(72)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [playState, setPlayState] = useState<PlayState>('idle')
  const [sessionCount, setSessionCount] = useState(0)
  const [metronomeOn, setMetronomeOn] = useState(true)
  const [metronomeVol, setMetronomeVol] = useState(0.7)
  const [repeats, setRepeats] = useState(1)
  const [instructionsOpen, setInstructionsOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  // Tick-based playback refs
  const animRef = useRef(0)
  const startRef = useRef(0)
  const pausedAtRef = useRef(0) // elapsed seconds when paused
  const scheduleRef = useRef<{ start: number; end: number }[]>([])
  const playedNotesRef = useRef<Set<number>>(new Set())
  const playedClicksRef = useRef<Set<number>>(new Set())
  const currentRepeatRef = useRef(0)
  const metronomeOnRef = useRef(true)
  const metronomeVolRef = useRef(0.7)

  // Keep refs in sync
  useEffect(() => { metronomeOnRef.current = metronomeOn }, [metronomeOn])
  useEffect(() => { metronomeVolRef.current = metronomeVol }, [metronomeVol])

  // Reset on exercise change
  useEffect(() => {
    cancelAnimationFrame(animRef.current)
    setShowAssessment(false); setActiveIdx(-1); setPlayState('idle')
    setSessionCount(0); setInstructionsOpen(false); setFullscreen(false)
    if (exercise?.targetBpm) setBpm(exercise.targetBpm)
  }, [exercise?.id])

  // Preload
  useEffect(() => {
    if (!exercise) return
    const all: string[] = []
    if (exercise.notes) all.push(...exercise.notes.map(n => n.note))
    if (exercise.chords) exercise.chords.forEach(c => all.push(...c.notes))
    if (all.length > 0) preloadSamples([...new Set(all)])
  }, [exercise?.id])

  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  const events = useMemo(() => buildEventSequence(exercise?.notes, exercise?.chords), [exercise?.id])

  // Build schedule for a single pass
  const buildSchedule = useCallback((currentBpm: number) => {
    const beatDur = 60 / currentBpm
    const sched: { start: number; end: number }[] = []
    let t = 0
    for (const ev of events) {
      const dur = ev.duration * beatDur
      sched.push({ start: t, end: t + dur })
      t += dur
    }
    return { sched, totalDur: t, beatDur }
  }, [events])

  // ── PLAY ──
  const handlePlay = useCallback(() => {
    if (events.length === 0) return
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()

    const { sched, totalDur, beatDur } = buildSchedule(bpm)
    // For repeats, extend schedule
    const fullSched: { start: number; end: number }[] = []
    for (let r = 0; r < repeats; r++) {
      for (const s of sched) {
        fullSched.push({ start: s.start + r * totalDur, end: s.end + r * totalDur })
      }
    }
    const fullDur = totalDur * repeats
    scheduleRef.current = fullSched
    playedNotesRef.current = new Set()
    playedClicksRef.current = new Set()
    currentRepeatRef.current = 0

    setPlayState('playing')
    setActiveIdx(0)
    startRef.current = performance.now()
    pausedAtRef.current = 0

    const timeSig = exercise?.timeSignature?.[0] ?? 4
    const totalBeats = Math.ceil(fullDur / beatDur)

    function tick() {
      const elapsed = pausedAtRef.current + (performance.now() - startRef.current) / 1000
      if (elapsed >= fullDur) {
        setPlayState('idle')
        setActiveIdx(-1)
        setSessionCount(c => c + 1)
        return
      }

      // Play notes at the right time
      for (let i = 0; i < fullSched.length; i++) {
        if (elapsed >= fullSched[i].start && !playedNotesRef.current.has(i)) {
          playedNotesRef.current.add(i)
          const evIdx = i % events.length
          const ev = events[evIdx]
          const dur = ev.duration * beatDur
          if (ev.type === 'note') {
            playPianoNote(ev.note, 0.65, dur)
          } else {
            ev.notes.forEach((n, j) => setTimeout(() => playPianoNote(n, 0.55, dur), j * 30))
          }
        }
      }

      // Metronome clicks
      if (metronomeOnRef.current) {
        for (let b = 0; b < totalBeats; b++) {
          const clickTime = b * beatDur
          if (elapsed >= clickTime && !playedClicksRef.current.has(b)) {
            playedClicksRef.current.add(b)
            clickNow(b % timeSig === 0, metronomeVolRef.current)
          }
        }
      }

      // Active index
      const idx = fullSched.findIndex(s => elapsed >= s.start && elapsed < s.end)
      if (idx >= 0) setActiveIdx(idx % events.length)

      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [events, bpm, exercise, repeats, buildSchedule])

  // ── PAUSE ──
  const handlePause = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    pausedAtRef.current += (performance.now() - startRef.current) / 1000
    setPlayState('paused')
  }, [])

  // ── RESUME ──
  const handleResume = useCallback(() => {
    if (playState !== 'paused') return
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
    setPlayState('playing')
    startRef.current = performance.now()

    const { totalDur, beatDur } = buildSchedule(bpm)
    const fullDur = totalDur * repeats
    const fullSched = scheduleRef.current
    const timeSig = exercise?.timeSignature?.[0] ?? 4
    const totalBeats = Math.ceil(fullDur / beatDur)

    function tick() {
      const elapsed = pausedAtRef.current + (performance.now() - startRef.current) / 1000
      if (elapsed >= fullDur) {
        setPlayState('idle'); setActiveIdx(-1); setSessionCount(c => c + 1)
        return
      }
      for (let i = 0; i < fullSched.length; i++) {
        if (elapsed >= fullSched[i].start && !playedNotesRef.current.has(i)) {
          playedNotesRef.current.add(i)
          const ev = events[i % events.length]
          const dur = ev.duration * beatDur
          if (ev.type === 'note') playPianoNote(ev.note, 0.65, dur)
          else ev.notes.forEach((n, j) => setTimeout(() => playPianoNote(n, 0.55, dur), j * 30))
        }
      }
      if (metronomeOnRef.current) {
        for (let b = 0; b < totalBeats; b++) {
          if (b * beatDur <= elapsed && !playedClicksRef.current.has(b)) {
            playedClicksRef.current.add(b); clickNow(b % timeSig === 0, metronomeVolRef.current)
          }
        }
      }
      const idx = fullSched.findIndex(s => elapsed >= s.start && elapsed < s.end)
      if (idx >= 0) setActiveIdx(idx % events.length)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [playState, events, bpm, exercise, repeats, buildSchedule])

  // ── STOP ──
  const handleStop = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    setPlayState('idle'); setActiveIdx(-1); pausedAtRef.current = 0
  }, [])

  // ── PLAY FROM INDEX (click on grid cell) ──
  const playFromIndex = useCallback((startIdx: number) => {
    if (events.length === 0 || startIdx >= events.length) return
    // Stop any current playback first
    cancelAnimationFrame(animRef.current)

    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()

    const { sched, totalDur, beatDur } = buildSchedule(bpm)
    // Build schedule for single pass starting from startIdx
    const offsetTime = sched[startIdx].start
    const trimmedSched: { start: number; end: number }[] = []
    for (let i = startIdx; i < sched.length; i++) {
      trimmedSched.push({ start: sched[i].start - offsetTime, end: sched[i].end - offsetTime })
    }
    const trimmedDur = totalDur - offsetTime

    scheduleRef.current = trimmedSched
    playedNotesRef.current = new Set()
    playedClicksRef.current = new Set()

    setPlayState('playing')
    setActiveIdx(startIdx)
    startRef.current = performance.now()
    pausedAtRef.current = 0

    const timeSigN = exercise?.timeSignature?.[0] ?? 4
    const totalBeats = Math.ceil(trimmedDur / beatDur)

    function tick() {
      const elapsed = pausedAtRef.current + (performance.now() - startRef.current) / 1000
      if (elapsed >= trimmedDur) {
        setPlayState('idle'); setActiveIdx(-1); setSessionCount(c => c + 1)
        return
      }
      for (let i = 0; i < trimmedSched.length; i++) {
        if (elapsed >= trimmedSched[i].start && !playedNotesRef.current.has(i)) {
          playedNotesRef.current.add(i)
          const evIdx = startIdx + i
          const ev = events[evIdx]
          const dur = ev.duration * beatDur
          if (ev.type === 'note') playPianoNote(ev.note, 0.65, dur)
          else ev.notes.forEach((n, j) => setTimeout(() => playPianoNote(n, 0.55, dur), j * 30))
        }
      }
      if (metronomeOnRef.current) {
        for (let b = 0; b < totalBeats; b++) {
          if (b * beatDur <= elapsed && !playedClicksRef.current.has(b)) {
            playedClicksRef.current.add(b); clickNow(b % timeSigN === 0, metronomeVolRef.current)
          }
        }
      }
      const idx = trimmedSched.findIndex(s => elapsed >= s.start && elapsed < s.end)
      if (idx >= 0) setActiveIdx(startIdx + idx)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [events, bpm, exercise, buildSchedule])

  const handleFinish = () => {
    handleStop()
    addPracticeTime(Math.max(1, Math.round(sessionCount * events.length * (60 / bpm) / 60)))
    setShowAssessment(true)
  }

  // ── Not found ──
  if (!module || !exercise) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="rounded-2xl border border-white/[0.04] p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
          <p className="text-[#6b7280] mb-3">Exercise not found.</p>
          <Link to="/piano/curriculum" className="text-[#a78bfa] hover:text-[#c4b5fd] text-sm font-medium transition-colors">Back to curriculum</Link>
        </div>
      </div>
    )
  }

  if (showAssessment) {
    return <SelfAssessment exerciseName={exercise.title} sessionCount={sessionCount} onDone={() => { setShowAssessment(false); setSessionCount(0) }} />
  }

  // ── Derived ──
  const exIdx = module.exercises.findIndex(e => e.id === exercise.id)
  const nextExercise = exIdx < module.exercises.length - 1 ? module.exercises[exIdx + 1] : undefined
  const prevExercise = exIdx > 0 ? module.exercises[exIdx - 1] : undefined
  const allNotes: string[] = []
  if (exercise.notes) allNotes.push(...exercise.notes.map(n => n.note))
  if (exercise.chords) exercise.chords.forEach(c => allNotes.push(...c.notes))
  const octs = allNotes.map(n => parseInt(n.replace(/[^0-9]/g, '')))
  const minOct = octs.length ? Math.min(...octs) : 3
  const maxOct = octs.length ? Math.max(...octs) : 5
  const timeSig: [number, number] = exercise.timeSignature ?? [4, 4]
  const difficultyColor = exercise.difficulty <= 2 ? '#22c55e' : exercise.difficulty <= 4 ? '#eab308' : exercise.difficulty <= 6 ? '#f97316' : '#ef4444'

  const activeNotes: string[] = []
  if (activeIdx >= 0 && activeIdx < events.length) {
    const ev = events[activeIdx]
    if (ev.type === 'note') activeNotes.push(ev.note)
    else activeNotes.push(...ev.notes)
  }
  const currentFinger = activeIdx >= 0 && activeIdx < events.length ? events[activeIdx].finger : undefined

  const keys = buildKeys(minOct, maxOct - minOct + 1, 30, 100, 19, 1.5)
  const keysLarge = buildKeys(minOct, maxOct - minOct + 1, 36, 120, 22, 1.5)

  const isActive = playState !== 'idle'

  // ══ Control Bar (shared between normal and fullscreen) ══
  const controlBar = (isLarge: boolean) => (
    <div className="flex flex-wrap items-center gap-2.5 lg:gap-4">
      {/* Play / Pause / Resume */}
      {playState === 'idle' && (
        <button onClick={handlePlay} disabled={events.length === 0}
          className="group relative w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)', boxShadow: '0 4px 20px -4px rgba(167,139,250,0.4)' }}>
          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        </button>
      )}
      {playState === 'playing' && (
        <button onClick={handlePause}
          className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-500/15 border border-amber-500/25 hover:bg-amber-500/25 transition-all cursor-pointer">
          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        </button>
      )}
      {playState === 'paused' && (
        <button onClick={handleResume}
          className="group w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)', boxShadow: '0 4px 20px -4px rgba(167,139,250,0.4)' }}>
          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        </button>
      )}
      {/* Stop (only when playing or paused) */}
      {isActive && (
        <button onClick={handleStop}
          className="w-11 h-11 rounded-xl flex items-center justify-center bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer">
          <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
        </button>
      )}

      <div className="w-px h-8 bg-white/[0.06]" />

      {/* BPM */}
      <div className="flex items-center gap-1.5">
        <button onClick={() => setBpm(b => Math.max(30, b - 5))} disabled={isActive}
          className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#6b7280] hover:text-white disabled:opacity-30 cursor-pointer transition-all flex items-center justify-center text-sm font-bold">-</button>
        <div className="text-center w-14">
          <div className="text-white font-bold text-sm leading-none">{bpm}</div>
          <div className="text-[9px] text-[#4b5563] uppercase tracking-wider mt-0.5">BPM</div>
        </div>
        <button onClick={() => setBpm(b => Math.min(200, b + 5))} disabled={isActive}
          className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#6b7280] hover:text-white disabled:opacity-30 cursor-pointer transition-all flex items-center justify-center text-sm font-bold">+</button>
      </div>

      <div className="w-px h-8 bg-white/[0.06]" />

      {/* Repeats */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map(r => (
          <button key={r} onClick={() => setRepeats(r)} disabled={isActive}
            className="w-7 h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
            style={{
              background: repeats === r ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${repeats === r ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.04)'}`,
              color: repeats === r ? '#a78bfa' : '#4b5563',
            }}>{r}x</button>
        ))}
      </div>

      <div className="w-px h-8 bg-white/[0.06]" />

      {/* Metronome */}
      <button onClick={() => setMetronomeOn(!metronomeOn)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
        style={{
          background: metronomeOn ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${metronomeOn ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.04)'}`,
        }}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={metronomeOn ? '#a78bfa' : '#4b5563'} strokeWidth={1.8}>
          <path d="M12 2L8 22h8L12 2z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 8l4-3" strokeLinecap="round" /><line x1="6" y1="22" x2="18" y2="22" strokeLinecap="round" />
        </svg>
        <span className="text-[10px] font-medium" style={{ color: metronomeOn ? '#a78bfa' : '#4b5563' }}>{metronomeOn ? 'On' : 'Off'}</span>
      </button>
      {metronomeOn && (
        <input type="range" min={0} max={1} step={0.05} value={metronomeVol}
          onChange={e => setMetronomeVol(parseFloat(e.target.value))}
          className="w-16 h-1 rounded-full cursor-pointer" style={{ accentColor: '#a78bfa' }} />
      )}

      {/* Right side: session + fullscreen */}
      <div className="ml-auto flex items-center gap-2">
        {sessionCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/15">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-400">{sessionCount}x done</span>
          </div>
        )}
        {sessionCount >= 1 && playState === 'idle' && (
          <button onClick={handleFinish}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all cursor-pointer">
            Self-Assess
          </button>
        )}
        {!isLarge && (
          <button onClick={() => setFullscreen(true)}
            className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] flex items-center justify-center transition-all cursor-pointer">
            <svg className="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
            </svg>
          </button>
        )}
        {isLarge && (
          <button onClick={() => setFullscreen(false)}
            className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] flex items-center justify-center transition-all cursor-pointer">
            <svg className="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v4H4M15 4v4h5M9 20v-4H4M15 20v-4h5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )

  // ══ FULLSCREEN MODE ══
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#06080d' }}>
        {/* Top bar */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-white/[0.05]" style={{ background: 'rgba(12,14,20,0.95)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3 mb-2.5">
            <button onClick={() => setFullscreen(false)}
              className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center cursor-pointer transition-all">
              <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{exercise.title}</h2>
              <p className="text-[10px] text-[#4b5563]">{module.name}</p>
            </div>
          </div>
          {controlBar(true)}
        </div>

        {/* Main content: notation+grid aligned, then keyboard */}
        <div className="flex-1 overflow-auto flex flex-col">
          {/* Notation with aligned grid below */}
          <div className="flex-shrink-0 p-4 border-b border-white/[0.04]" style={{ background: 'rgba(12,14,20,0.5)' }}>
            <NotationWithGrid events={events} activeIdx={activeIdx} timeSig={timeSig} large onClickNote={playFromIndex} />
          </div>

          {/* Keyboard */}
          <div className="flex-1 flex items-center justify-center p-4" style={{ minHeight: 200 }}>
            <div className="w-full max-w-4xl overflow-x-auto">
              <KeyboardSVG keys={keysLarge} activeNotes={activeNotes} currentFinger={currentFinger} allExerciseNotes={allNotes} large />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ══ NORMAL VIEW ══
  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#4b5563] mb-5">
        {fromPractice ? (<>
          <Link to="/piano/practice" className="hover:text-[#a78bfa] transition-colors">Practice</Link>
          <Chev />
          <Link to="/piano/practice/exercises" className="hover:text-[#a78bfa] transition-colors">Exercises</Link>
        </>) : (<>
          <Link to="/piano/curriculum" className="hover:text-[#a78bfa] transition-colors">Curriculum</Link>
          <Chev />
          <Link to="/piano/curriculum" state={{ expandModule: module.id }} className="hover:text-[#a78bfa] transition-colors truncate max-w-[150px]">{module.name}</Link>
        </>)}
        <Chev />
        <span className="text-[#94a3b8] truncate">{exercise.title}</span>
      </nav>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-5" style={{
        background: 'linear-gradient(135deg, rgba(167,139,250,0.06) 0%, rgba(139,92,246,0.03) 50%, rgba(12,14,20,0.8) 100%)',
        border: '1px solid rgba(167,139,250,0.1)',
      }}>
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
        <div className="relative p-5 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight leading-tight">{exercise.title}</h1>
              <p className="text-sm text-[#6b7280] mt-1 leading-relaxed">{exercise.description}</p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black"
                style={{ background: `${difficultyColor}15`, border: `1px solid ${difficultyColor}30`, color: difficultyColor }}>{exercise.difficulty}</div>
              <span className="text-[9px] uppercase tracking-wider text-[#4b5563]">Level</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3.5">
            <Tag>{exercise.exerciseType.replace('-', ' ')}</Tag>
            <Tag>{exercise.handsRequired === 'both' ? 'Both hands' : exercise.handsRequired === 'right' ? 'Right hand' : 'Left hand'}</Tag>
            {exercise.keySignature && <Tag>Key: {exercise.keySignature}</Tag>}
            <Tag>{timeSig[0]}/{timeSig[1]} time</Tag>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {exercise.instructions && exercise.instructions.length > 0 && (
        <button onClick={() => setInstructionsOpen(!instructionsOpen)}
          className="w-full mb-4 rounded-xl px-4 py-3 flex items-center gap-3 transition-all cursor-pointer"
          style={{
            background: instructionsOpen ? 'rgba(167,139,250,0.04)' : 'rgba(255,255,255,0.01)',
            border: `1px solid ${instructionsOpen ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)'}`,
          }}>
          <svg className={`w-4 h-4 text-[#a78bfa] transition-transform ${instructionsOpen ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider flex-1 text-left">Instructions</span>
          <span className="text-[10px] text-[#4b5563]">{exercise.instructions.length} steps</span>
        </button>
      )}
      {instructionsOpen && exercise.instructions && (
        <div className="mb-5 rounded-xl border border-white/[0.04] p-4 space-y-2" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.5) 0%, rgba(10,12,18,0.6) 100%)' }}>
          {exercise.instructions.map((inst, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
                style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>{i + 1}</span>
              <span className="text-[#94a3b8] leading-relaxed">{inst}</span>
            </div>
          ))}
        </div>
      )}

      {/* Control Bar */}
      <div className="rounded-2xl border border-white/[0.05] p-3 lg:p-4 mb-4" style={{
        background: 'linear-gradient(180deg, rgba(20,22,30,0.9) 0%, rgba(12,14,20,0.95) 100%)',
        backdropFilter: 'blur(12px)',
      }}>
        {controlBar(false)}
      </div>

      {/* Notation + Grid aligned, then Keyboard */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{
        background: 'linear-gradient(180deg, rgba(12,14,20,0.7) 0%, rgba(8,10,16,0.9) 100%)',
        border: '1px solid rgba(255,255,255,0.04)',
        boxShadow: playState === 'playing' ? '0 0 40px -10px rgba(167,139,250,0.15)' : 'none',
        transition: 'box-shadow 0.3s',
      }}>
        {/* Notation with aligned clickable grid */}
        <div className="p-4 lg:p-5 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold">Notation</div>
            <div className="text-[9px] text-[#374151]">Click a note to play from there</div>
          </div>
          <NotationWithGrid events={events} activeIdx={activeIdx} timeSig={timeSig} onClickNote={playFromIndex} />
        </div>
        {/* Keyboard */}
        <div className="p-4 lg:p-5">
          <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold mb-2">Keyboard</div>
          <div className="overflow-x-auto pb-1">
            <KeyboardSVG keys={keys} activeNotes={activeNotes} currentFinger={currentFinger} allExerciseNotes={allNotes} />
          </div>
        </div>
      </div>

      {/* Nav footer */}
      <div className="flex items-center justify-between">
        <div>{prevExercise && (
          <Link to={`/piano/exercise/${module.id}/${prevExercise.id}`} className="flex items-center gap-1.5 text-xs text-[#4b5563] hover:text-[#94a3b8] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Previous
          </Link>
        )}</div>
        <Link to="/piano/curriculum" state={{ expandModule: module.id }} className="text-xs text-[#4b5563] hover:text-[#94a3b8] transition-colors">All exercises</Link>
        <div>{nextExercise && (
          <Link to={`/piano/exercise/${module.id}/${nextExercise.id}`} className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: '#a78bfa' }}>
            Next<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        )}</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared Sub-components
// ═══════════════════════════════════════════════════════════════════════════════

function Chev() {
  return <svg className="w-3 h-3 text-[#2d3748] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="px-2.5 py-1 rounded-md text-[10px] font-medium capitalize" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#6b7280' }}>{children}</span>
}

// ═══════════════════════════════════════════════════════════════════════════════
// Event Sequence Builder
// ═══════════════════════════════════════════════════════════════════════════════

interface NotePlayEvent { type: 'note'; note: string; duration: number; finger?: number }
interface ChordPlayEvent { type: 'chord'; name: string; notes: string[]; duration: number; finger?: number; fingers?: number[] }
type PlayEvent = NotePlayEvent | ChordPlayEvent

function buildEventSequence(notes?: NoteEvent[], chords?: ChordEvent[]): PlayEvent[] {
  const events: PlayEvent[] = []
  if (notes && notes.length > 0) {
    for (const n of notes) events.push({ type: 'note', note: n.note, duration: n.duration, finger: n.finger })
  }
  if (chords && chords.length > 0 && (!notes || notes.length === 0)) {
    for (const c of chords) events.push({ type: 'chord', name: c.name, notes: c.notes, duration: c.duration, finger: c.fingers?.[0], fingers: c.fingers })
  }
  return events
}
