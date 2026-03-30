import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { playPianoNote, preloadSamples } from '@piano/services/pianoSounds'
import type { NoteEvent, ChordEvent } from '@piano/types/curriculum'

// ═══════════════════════════════════════════════════════════════════════════════
// Audio Engine
// ═══════════════════════════════════════════════════════════════════════════════

const ctxRef = { current: null as AudioContext | null }
function getCtx() { if (!ctxRef.current) ctxRef.current = new AudioContext(); return ctxRef.current }

function clickNow(accentBeat: boolean, volume: number) {
  const ctx = getCtx(); const t = ctx.currentTime
  const osc = ctx.createOscillator(); const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(accentBeat ? 1200 : 900, t)
  osc.frequency.exponentialRampToValueAtTime(accentBeat ? 600 : 450, t + 0.02)
  const v = volume * (accentBeat ? 0.1 : 0.06)
  gain.gain.setValueAtTime(v, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
  osc.connect(gain).connect(ctx.destination); osc.start(t); osc.stop(t + 0.08)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Keyboard
// ═══════════════════════════════════════════════════════════════════════════════

interface KeyInfo { note: string; isBlack: boolean; x: number }

function buildKeys(startOctave: number, octaveCount: number, kw: number, bw: number, gap: number): KeyInfo[] {
  const keys: KeyInfo[] = []
  const wn = ['C','D','E','F','G','A','B'], bn = ['Db','Eb','','Gb','Ab','Bb','']
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
  const en: Record<string, string> = { 'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb' }
  const norm = (s: string) => s.replace(/(\D+)(\d)/, (_: string, n: string, o: string) => `${en[n]||n}${o}`)
  return norm(a) === norm(b)
}

// ═══════════════════════════════════════════════════════════════════════════════
// KeyboardSVG
// ═══════════════════════════════════════════════════════════════════════════════

function KeyboardSVG({ keys, activeNotes, currentFinger, allNotes, large }: {
  keys: KeyInfo[]; activeNotes: string[]; currentFinger?: number; allNotes: string[]; large?: boolean
}) {
  const kw = large ? 36 : 30, kh = large ? 120 : 100, bw = large ? 22 : 19, bh = large ? 74 : 62
  const whites = keys.filter(k => !k.isBlack), blacks = keys.filter(k => k.isBlack)
  const totalWPx = whites.length * (kw + 1.5) - 1.5
  const svgW = totalWPx + 4, svgH = kh + 30
  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ maxHeight: large ? 220 : 180, minWidth: 380 }} className="block">
      <defs><linearGradient id="kglow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity="0.03" /><stop offset="100%" stopColor="#a78bfa" stopOpacity="0" /></linearGradient></defs>
      <rect x="0" y="0" width={svgW} height={svgH} fill="url(#kglow)" rx="8" />
      {whites.map(k => {
        const isAct = activeNotes.some(n => noteMatch(n, k.note))
        const inEx = allNotes.some(n => noteMatch(n, k.note))
        return (<g key={k.note} onClick={() => playPianoNote(k.note, 0.6)} className="cursor-pointer">
          <rect x={k.x+2} y={16} width={kw} height={kh} rx={3} fill={isAct ? '#a78bfa' : inEx ? '#f0f0ff' : '#f8fafc'} stroke={isAct ? '#8b5cf6' : inEx ? '#c4b5fd' : '#cbd5e1'} strokeWidth={isAct ? 1.5 : 0.5} style={{ transition: 'fill 0.08s' }} />
          {isAct && <rect x={k.x+2} y={16} width={kw} height={kh} rx={3} fill="none" stroke="#a78bfa" strokeWidth={2} opacity={0.5}><animate attributeName="opacity" values="0.5;0.15;0.5" dur="0.5s" repeatCount="indefinite" /></rect>}
          <text x={k.x+2+kw/2} y={kh+12} textAnchor="middle" fontSize={large ? 9 : 7.5} fill={isAct ? '#e2e8f0' : '#64748b'} fontWeight={isAct ? 700 : 400}>{k.note}</text>
        </g>)
      })}
      {blacks.map(k => {
        const isAct = activeNotes.some(n => noteMatch(n, k.note))
        return (<g key={k.note} onClick={() => playPianoNote(k.note, 0.6)} className="cursor-pointer">
          <rect x={k.x+2} y={16} width={bw} height={bh} rx={2.5} fill={isAct ? '#a78bfa' : '#1e293b'} stroke={isAct ? '#8b5cf6' : '#334155'} strokeWidth={isAct ? 1.5 : 0.5} style={{ transition: 'fill 0.08s' }} />
          {isAct && <rect x={k.x+2} y={16} width={bw} height={bh} rx={2.5} fill="none" stroke="#a78bfa" strokeWidth={2} opacity={0.5}><animate attributeName="opacity" values="0.5;0.15;0.5" dur="0.5s" repeatCount="indefinite" /></rect>}
        </g>)
      })}
      {currentFinger != null && activeNotes.length > 0 && (() => {
        const key = keys.find(k => noteMatch(k.note, activeNotes[0]))
        if (!key) return null
        const cx = key.x + 2 + (key.isBlack ? bw/2 : kw/2)
        return (<g><circle cx={cx} cy={8} r={8} fill="#8b5cf6" /><circle cx={cx} cy={8} r={8} fill="none" stroke="#a78bfa" strokeWidth={1.5} opacity={0.5}><animate attributeName="r" values="8;11;8" dur="0.8s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.5;0;0.5" dur="0.8s" repeatCount="indefinite" /></circle><text x={cx} y={11.5} textAnchor="middle" fontSize={10} fill="#fff" fontWeight={700}>{currentFinger}</text></g>)
      })()}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// NotationWithGrid
// ═══════════════════════════════════════════════════════════════════════════════

const NOTE_POS: Record<string, number> = { C:0,D:1,E:2,F:3,G:4,A:5,B:6 }
function getNoteY(note: string, clef: 'treble'|'bass'): number {
  const name = note.replace(/[0-9#b]/g, ''), oct = parseInt(note.replace(/[^0-9]/g, ''))
  const pos = NOTE_POS[name] ?? 0
  if (clef === 'treble') return 50 - ((oct-4)*7+pos-6)*5
  return 50 - ((oct-3)*7+pos-1)*5
}

function NotationWithGrid({ events, activeIdx, timeSig, large, onClickNote }: {
  events: PlayEvent[]; activeIdx: number; timeSig: [number,number]; large?: boolean; onClickNote: (i: number) => void
}) {
  const allN = events.flatMap(e => e.type === 'note' ? [e.note] : e.notes)
  const octs = allN.map(n => parseInt(n.replace(/[^0-9]/g, '')))
  const avg = octs.length ? octs.reduce((a,b) => a+b,0)/octs.length : 4
  const clef: 'treble'|'bass' = avg >= 4 ? 'treble' : 'bass'
  const sp = large ? 56 : 48, lp = 70
  const totalW = lp + events.length * sp + 40
  const staffH = large ? 140 : 120, gridH = large ? 44 : 38, svgH = staffH + gridH
  const sTop = large ? 38 : 30, lg = large ? 12 : 10
  const lines = [0,1,2,3,4].map(i => sTop+i*lg), gridY = staffH
  const centerY = sTop + 2*lg

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${svgH}`} width={totalW} height={svgH} className="block min-w-full">
        {lines.map((y,i) => <line key={i} x1={10} y1={y} x2={totalW-10} y2={y} stroke="#2d3748" strokeWidth={0.8} />)}
        <text x={18} y={clef==='treble' ? sTop+3.2*lg : sTop+2.5*lg} fontSize={large?44:38} fill="#6b7280" fontFamily="serif">{clef==='treble' ? '\u{1D11E}' : '\u{1D122}'}</text>
        <text x={50} y={sTop+1.5*lg} fontSize={large?16:14} fill="#6b7280" fontWeight={700} fontFamily="serif">{timeSig[0]}</text>
        <text x={50} y={sTop+3.2*lg} fontSize={large?16:14} fill="#6b7280" fontWeight={700} fontFamily="serif">{timeSig[1]}</text>
        <line x1={10} y1={gridY} x2={totalW-10} y2={gridY} stroke="#1e2433" strokeWidth={1} />
        {events.map((ev,i) => {
          const x = lp+i*sp, isAct = i===activeIdx, isPast = activeIdx>=0 && i<activeIdx
          const isHalf = ev.duration>=2, isWhole = ev.duration>=4, col = isAct ? '#a78bfa' : '#e2e8f0'
          const notes = ev.type==='note' ? [ev.note] : ev.notes
          const yPositions = notes.map(n => centerY - (getNoteY(n,clef)-50))
          const topY = Math.min(...yPositions), botY = Math.max(...yPositions)
          const allLedgers = new Set<number>()
          for (const nY of yPositions) { if (nY<sTop-2) for (let ly=sTop-lg; ly>=nY-2; ly-=lg) allLedgers.add(ly); if (nY>sTop+4*lg+2) for (let ly=sTop+5*lg; ly<=nY+2; ly+=lg) allLedgers.add(ly) }
          const cellW = sp-4, cellH = gridH-8, cellX = x-cellW/2, cellY = gridY+4
          return (<g key={i}>
            <g opacity={isPast ? 0.3 : 1}>
              {isAct && <circle cx={x} cy={(topY+botY)/2} r={large?16:14} fill="#a78bfa" opacity={0.15}><animate attributeName="r" values={large?'14;18;14':'12;16;12'} dur="0.6s" repeatCount="indefinite" /></circle>}
              {[...allLedgers].map((ly,li) => <line key={li} x1={x-10} y1={ly} x2={x+10} y2={ly} stroke={isAct?'#a78bfa':'#4b5563'} strokeWidth={0.8} />)}
              {notes.map((note,ni) => {
                const nY = yPositions[ni], hasAcc = note.includes('b')||note.includes('#')
                return (<g key={ni}>
                  {hasAcc && <text x={x-12} y={nY+4} fontSize={11} fill={isAct?'#c4b5fd':'#6b7280'} fontFamily="serif">{note.includes('b')?'\u266D':'\u266F'}</text>}
                  {isWhole ? <ellipse cx={x} cy={nY} rx={7} ry={5} fill="none" stroke={col} strokeWidth={1.5} />
                    : <ellipse cx={x} cy={nY} rx={6} ry={4.5} fill={isHalf?'none':col} stroke={col} strokeWidth={isHalf?1.5:0} transform={`rotate(-10 ${x} ${nY})`} />}
                </g>)
              })}
              {!isWhole && <><line x1={x+6} y1={botY} x2={x+6} y2={topY-28} stroke={col} strokeWidth={1.2} />
                {ev.duration<=0.5 && <path d={`M${x+6} ${topY-28} q 8 8 2 18`} fill="none" stroke={col} strokeWidth={1.2} />}
                {ev.duration<=0.25 && <path d={`M${x+6} ${topY-22} q 8 8 2 18`} fill="none" stroke={col} strokeWidth={1.2} />}</>}
              {(ev.duration===1.5||ev.duration===3) && <circle cx={x+10} cy={topY-2} r={1.5} fill={col} />}
              {ev.finger && <text x={x} y={sTop+4*lg+22} textAnchor="middle" fontSize={9} fill={isAct?'#a78bfa':'#4b5563'} fontWeight={600}>{ev.finger}</text>}
              {ev.type==='chord' && <text x={x} y={sTop-10} textAnchor="middle" fontSize={10} fill={isAct?'#c4b5fd':'#6b7280'} fontWeight={600}>{ev.name}</text>}
            </g>
            {isAct && <line x1={x} y1={sTop+4*lg+(ev.finger?26:6)} x2={x} y2={cellY} stroke="#a78bfa" strokeWidth={1} opacity={0.3} strokeDasharray="2 2" />}
            <g className="cursor-pointer" onClick={() => onClickNote(i)} opacity={isPast?0.3:1}>
              <rect x={cellX} y={cellY} width={cellW} height={cellH} rx={6} fill={isAct?'rgba(167,139,250,0.15)':'rgba(255,255,255,0.02)'} stroke={isAct?'rgba(167,139,250,0.4)':'rgba(255,255,255,0.04)'} strokeWidth={isAct?1.5:0.5} />
              {isAct && <rect x={cellX} y={cellY} width={cellW} height={cellH} rx={6} fill="none" stroke="#a78bfa" strokeWidth={1.5} opacity={0.3}><animate attributeName="opacity" values="0.3;0.1;0.3" dur="0.6s" repeatCount="indefinite" /></rect>}
              <text x={x} y={cellY+cellH/2+(large?4:3.5)} textAnchor="middle" fontSize={large?11:10} fontWeight={isAct?700:500} fill={isAct?'#fff':'#6b7280'}>{ev.type==='chord'?ev.name:ev.note}</text>
            </g>
          </g>)
        })}
      </svg>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Event types
// ═══════════════════════════════════════════════════════════════════════════════

interface NotePlayEvent { type: 'note'; note: string; duration: number; finger?: number }
interface ChordPlayEvent { type: 'chord'; name: string; notes: string[]; duration: number; finger?: number; fingers?: number[] }
type PlayEvent = NotePlayEvent | ChordPlayEvent

function buildEventSequence(notes?: NoteEvent[], chords?: ChordEvent[]): PlayEvent[] {
  const events: PlayEvent[] = []
  if (notes && notes.length > 0) for (const n of notes) events.push({ type:'note', note:n.note, duration:n.duration, finger:n.finger })
  if (chords && chords.length > 0 && (!notes || notes.length === 0)) for (const c of chords) events.push({ type:'chord', name:c.name, notes:c.notes, duration:c.duration, finger:c.fingers?.[0], fingers:c.fingers })
  return events
}

// ═══════════════════════════════════════════════════════════════════════════════
// PracticePlayer — The shared component
// ═══════════════════════════════════════════════════════════════════════════════

export interface PracticePlayerProps {
  notes?: NoteEvent[]
  chords?: ChordEvent[]
  defaultBpm: number
  timeSignature?: [number, number]
  /** Reset key — change this to reset playback state (e.g. when switching scales) */
  resetKey?: string
  /** Called when a full playback session completes */
  onSessionComplete?: () => void
}

type PlayState = 'idle' | 'playing' | 'paused'

export default function PracticePlayer({ notes, chords, defaultBpm, timeSignature, resetKey, onSessionComplete }: PracticePlayerProps) {
  const [bpm, setBpm] = useState(defaultBpm)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [playState, setPlayState] = useState<PlayState>('idle')
  const [metronomeOn, setMetronomeOn] = useState(true)
  const [metronomeVol, setMetronomeVol] = useState(0.7)
  const [repeats, setRepeats] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)

  const animRef = useRef(0)
  const startRef = useRef(0)
  const pausedAtRef = useRef(0)
  const scheduleRef = useRef<{ start: number; end: number }[]>([])
  const playedNotesRef = useRef<Set<number>>(new Set())
  const playedClicksRef = useRef<Set<number>>(new Set())
  const metronomeOnRef = useRef(true)
  const metronomeVolRef = useRef(0.7)

  useEffect(() => { metronomeOnRef.current = metronomeOn }, [metronomeOn])
  useEffect(() => { metronomeVolRef.current = metronomeVol }, [metronomeVol])

  const events = useMemo(() => buildEventSequence(notes, chords), [notes, chords])
  const timeSig: [number, number] = timeSignature ?? [4, 4]

  // Reset on key change
  useEffect(() => {
    cancelAnimationFrame(animRef.current)
    setActiveIdx(-1); setPlayState('idle'); pausedAtRef.current = 0
    setBpm(defaultBpm)
  }, [resetKey, defaultBpm])

  // Preload
  useEffect(() => {
    const all: string[] = []
    if (notes) all.push(...notes.map(n => n.note))
    if (chords) chords.forEach(c => all.push(...c.notes))
    if (all.length > 0) preloadSamples([...new Set(all)])
  }, [notes, chords])

  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  const buildSchedule = useCallback((currentBpm: number) => {
    const beatDur = 60/currentBpm; const sched: { start: number; end: number }[] = []; let t = 0
    for (const ev of events) { sched.push({ start:t, end:t+ev.duration*beatDur }); t += ev.duration*beatDur }
    return { sched, totalDur:t, beatDur }
  }, [events])

  const startPlayback = useCallback((fromIdx = 0) => {
    if (events.length === 0) return
    const ctx = getCtx(); if (ctx.state === 'suspended') ctx.resume()
    const { sched, totalDur, beatDur } = buildSchedule(bpm)
    const fullSched: { start:number; end:number }[] = []
    for (let r = 0; r < repeats; r++) for (const s of sched) fullSched.push({ start:s.start+r*totalDur, end:s.end+r*totalDur })
    const offset = fromIdx > 0 && fromIdx < fullSched.length ? fullSched[fromIdx].start : 0
    const trimmed = fullSched.slice(fromIdx).map(s => ({ start:s.start-offset, end:s.end-offset }))
    const dur = trimmed.length > 0 ? trimmed[trimmed.length-1].end : 0
    scheduleRef.current = trimmed; playedNotesRef.current = new Set(); playedClicksRef.current = new Set()
    setPlayState('playing'); setActiveIdx(fromIdx); startRef.current = performance.now(); pausedAtRef.current = 0
    const tsn = timeSig[0]; const totalBeats = Math.ceil(dur/beatDur)
    function tick() {
      const elapsed = pausedAtRef.current + (performance.now()-startRef.current)/1000
      if (elapsed >= dur) { setPlayState('idle'); setActiveIdx(-1); onSessionComplete?.(); return }
      for (let i = 0; i < trimmed.length; i++) {
        if (elapsed >= trimmed[i].start && !playedNotesRef.current.has(i)) {
          playedNotesRef.current.add(i)
          const ev = events[(fromIdx+i)%events.length]; const d = ev.duration*beatDur
          if (ev.type==='note') playPianoNote(ev.note, 0.65, d)
          else ev.notes.forEach((n,j) => setTimeout(() => playPianoNote(n, 0.55, d), j*30))
        }
      }
      if (metronomeOnRef.current) for (let b = 0; b < totalBeats; b++) { if (b*beatDur<=elapsed && !playedClicksRef.current.has(b)) { playedClicksRef.current.add(b); clickNow(b%tsn===0, metronomeVolRef.current) } }
      const idx = trimmed.findIndex(s => elapsed>=s.start && elapsed<s.end)
      if (idx >= 0) setActiveIdx((fromIdx+idx)%events.length)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [events, bpm, repeats, timeSig, buildSchedule, onSessionComplete])

  const handlePause = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    pausedAtRef.current += (performance.now()-startRef.current)/1000
    setPlayState('paused')
  }, [])

  const handleResume = useCallback(() => {
    if (playState !== 'paused') return
    const ctx = getCtx(); if (ctx.state === 'suspended') ctx.resume()
    setPlayState('playing'); startRef.current = performance.now()
    const { beatDur } = buildSchedule(bpm); const trimmed = scheduleRef.current
    const dur = trimmed.length > 0 ? trimmed[trimmed.length-1].end : 0
    const tsn = timeSig[0]; const totalBeats = Math.ceil(dur/beatDur)
    function tick() {
      const elapsed = pausedAtRef.current + (performance.now()-startRef.current)/1000
      if (elapsed >= dur) { setPlayState('idle'); setActiveIdx(-1); onSessionComplete?.(); return }
      for (let i = 0; i < trimmed.length; i++) {
        if (elapsed >= trimmed[i].start && !playedNotesRef.current.has(i)) {
          playedNotesRef.current.add(i); const ev = events[i%events.length]; const d = ev.duration*beatDur
          if (ev.type==='note') playPianoNote(ev.note, 0.65, d)
          else ev.notes.forEach((n,j) => setTimeout(() => playPianoNote(n, 0.55, d), j*30))
        }
      }
      if (metronomeOnRef.current) for (let b = 0; b < totalBeats; b++) { if (b*beatDur<=elapsed && !playedClicksRef.current.has(b)) { playedClicksRef.current.add(b); clickNow(b%tsn===0, metronomeVolRef.current) } }
      const idx = trimmed.findIndex(s => elapsed>=s.start && elapsed<s.end)
      if (idx >= 0) setActiveIdx(idx%events.length)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [playState, events, bpm, timeSig, buildSchedule, onSessionComplete])

  const handleStop = useCallback(() => { cancelAnimationFrame(animRef.current); setPlayState('idle'); setActiveIdx(-1); pausedAtRef.current = 0 }, [])

  // Derived
  const allNotes: string[] = []
  if (notes) allNotes.push(...notes.map(n => n.note))
  if (chords) chords.forEach(c => allNotes.push(...c.notes))
  const octs = allNotes.map(n => parseInt(n.replace(/[^0-9]/g, '')))
  const minOct = octs.length ? Math.min(...octs) : 3
  const maxOct = octs.length ? Math.max(...octs) : 5
  const keys = buildKeys(minOct, maxOct-minOct+1, 30, 19, 1.5)
  const keysLarge = buildKeys(minOct, maxOct-minOct+1, 36, 22, 1.5)

  const activeNotes: string[] = []
  if (activeIdx >= 0 && activeIdx < events.length) {
    const ev = events[activeIdx]
    if (ev.type === 'note') activeNotes.push(ev.note); else activeNotes.push(...ev.notes)
  }
  const currentFinger = activeIdx >= 0 && activeIdx < events.length ? events[activeIdx].finger : undefined
  const isActive = playState !== 'idle'

  if (events.length === 0) return <div className="text-center text-[#4b5563] text-sm py-8">No notes to play</div>

  const controlBar = (isLarge: boolean) => (
    <div className="flex flex-wrap items-center gap-2.5 lg:gap-4">
      {playState==='idle' && <button onClick={() => startPlayback(0)} className="group w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer" style={{ background:'linear-gradient(135deg,#a78bfa,#8b5cf6)', boxShadow:'0 4px 20px -4px rgba(167,139,250,0.4)' }}><svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></button>}
      {playState==='playing' && <button onClick={handlePause} className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-500/15 border border-amber-500/25 hover:bg-amber-500/25 transition-all cursor-pointer"><svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg></button>}
      {playState==='paused' && <button onClick={handleResume} className="group w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer" style={{ background:'linear-gradient(135deg,#a78bfa,#8b5cf6)', boxShadow:'0 4px 20px -4px rgba(167,139,250,0.4)' }}><svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></button>}
      {isActive && <button onClick={handleStop} className="w-11 h-11 rounded-xl flex items-center justify-center bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"><svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg></button>}
      <div className="w-px h-8 bg-white/[0.06]" />
      <div className="flex items-center gap-1.5">
        <button onClick={() => setBpm(b => Math.max(30,b-5))} disabled={isActive} className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#6b7280] hover:text-white disabled:opacity-30 cursor-pointer transition-all flex items-center justify-center text-sm font-bold">-</button>
        <div className="text-center w-14"><div className="text-white font-bold text-sm leading-none">{bpm}</div><div className="text-[9px] text-[#4b5563] uppercase tracking-wider mt-0.5">BPM</div></div>
        <button onClick={() => setBpm(b => Math.min(200,b+5))} disabled={isActive} className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#6b7280] hover:text-white disabled:opacity-30 cursor-pointer transition-all flex items-center justify-center text-sm font-bold">+</button>
      </div>
      <div className="w-px h-8 bg-white/[0.06]" />
      <div className="flex items-center gap-1">{[1,2,3,4].map(r => <button key={r} onClick={() => setRepeats(r)} disabled={isActive} className="w-7 h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center" style={{ background:repeats===r?'rgba(167,139,250,0.15)':'rgba(255,255,255,0.02)', border:`1px solid ${repeats===r?'rgba(167,139,250,0.3)':'rgba(255,255,255,0.04)'}`, color:repeats===r?'#a78bfa':'#4b5563' }}>{r}x</button>)}</div>
      <div className="w-px h-8 bg-white/[0.06]" />
      <button onClick={() => setMetronomeOn(!metronomeOn)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer" style={{ background:metronomeOn?'rgba(167,139,250,0.1)':'rgba(255,255,255,0.02)', border:`1px solid ${metronomeOn?'rgba(167,139,250,0.25)':'rgba(255,255,255,0.04)'}` }}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={metronomeOn?'#a78bfa':'#4b5563'} strokeWidth={1.8}><path d="M12 2L8 22h8L12 2z" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 8l4-3" strokeLinecap="round" /><line x1="6" y1="22" x2="18" y2="22" strokeLinecap="round" /></svg>
        <span className="text-[10px] font-medium" style={{ color:metronomeOn?'#a78bfa':'#4b5563' }}>{metronomeOn?'On':'Off'}</span>
      </button>
      {metronomeOn && <input type="range" min={0} max={1} step={0.05} value={metronomeVol} onChange={e => setMetronomeVol(parseFloat(e.target.value))} className="w-16 h-1 rounded-full cursor-pointer" style={{ accentColor:'#a78bfa' }} />}
      <div className="ml-auto">
        {!isLarge ? <button onClick={() => setFullscreen(true)} className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] flex items-center justify-center transition-all cursor-pointer"><svg className="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" /></svg></button>
        : <button onClick={() => setFullscreen(false)} className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] flex items-center justify-center transition-all cursor-pointer"><svg className="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 4v4H4M15 4v4h5M9 20v-4H4M15 20v-4h5" /></svg></button>}
      </div>
    </div>
  )

  // Fullscreen
  if (fullscreen) return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background:'#06080d' }}>
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/[0.05]" style={{ background:'rgba(12,14,20,0.95)', backdropFilter:'blur(12px)' }}>
        <div className="flex items-center gap-3 mb-2.5">
          <button onClick={() => setFullscreen(false)} className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center cursor-pointer transition-all"><svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
          <span className="text-sm font-bold text-white">Fullscreen Practice</span>
        </div>
        {controlBar(true)}
      </div>
      <div className="flex-1 overflow-auto flex flex-col">
        <div className="flex-shrink-0 p-4 border-b border-white/[0.04]" style={{ background:'rgba(12,14,20,0.5)' }}>
          <NotationWithGrid events={events} activeIdx={activeIdx} timeSig={timeSig} large onClickNote={startPlayback} />
        </div>
        <div className="flex-1 flex items-center justify-center p-4" style={{ minHeight:200 }}>
          <div className="w-full max-w-4xl overflow-x-auto">
            <KeyboardSVG keys={keysLarge} activeNotes={activeNotes} currentFinger={currentFinger} allNotes={allNotes} large />
          </div>
        </div>
      </div>
    </div>
  )

  // Normal
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/[0.05] p-3 lg:p-4" style={{ background:'linear-gradient(180deg, rgba(20,22,30,0.9) 0%, rgba(12,14,20,0.95) 100%)', backdropFilter:'blur(12px)' }}>
        {controlBar(false)}
      </div>
      <div className="rounded-2xl overflow-hidden" style={{
        background:'linear-gradient(180deg, rgba(12,14,20,0.7) 0%, rgba(8,10,16,0.9) 100%)',
        border:'1px solid rgba(255,255,255,0.04)',
        boxShadow: playState==='playing' ? '0 0 40px -10px rgba(167,139,250,0.15)' : 'none',
        transition:'box-shadow 0.3s',
      }}>
        <div className="p-4 lg:p-5 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold">Notation</div>
            <div className="text-[9px] text-[#374151]">Click a note to play from there</div>
          </div>
          <NotationWithGrid events={events} activeIdx={activeIdx} timeSig={timeSig} onClickNote={startPlayback} />
        </div>
        <div className="p-4 lg:p-5">
          <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold mb-2">Keyboard</div>
          <div className="overflow-x-auto pb-1">
            <KeyboardSVG keys={keys} activeNotes={activeNotes} currentFinger={currentFinger} allNotes={allNotes} />
          </div>
        </div>
      </div>
    </div>
  )
}
