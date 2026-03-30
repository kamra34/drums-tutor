import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { playPianoNote, preloadSamples } from '@piano/services/pianoSounds'
import type { NoteEvent, ChordEvent } from '@piano/types/curriculum'

// ═══════════════════════════════════════════════════════════════════════════════
// Audio
// ═══════════════════════════════════════════════════════════════════════════════

const ctxRef = { current: null as AudioContext | null }
function getCtx() { if (!ctxRef.current) ctxRef.current = new AudioContext(); return ctxRef.current }

function clickNow(accent: boolean, vol: number) {
  const ctx = getCtx(); const t = ctx.currentTime
  const osc = ctx.createOscillator(); const g = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(accent ? 1200 : 900, t)
  osc.frequency.exponentialRampToValueAtTime(accent ? 600 : 450, t + 0.02)
  const v = vol * (accent ? 0.1 : 0.06)
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
  osc.connect(g).connect(ctx.destination); osc.start(t); osc.stop(t + 0.08)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Keyboard
// ═══════════════════════════════════════════════════════════════════════════════

interface KeyInfo { note: string; isBlack: boolean; x: number }

function buildKeys(startOct: number, octCount: number, kw: number, bw: number, gap: number): KeyInfo[] {
  const keys: KeyInfo[] = [], wn = ['C','D','E','F','G','A','B'], bn = ['Db','Eb','','Gb','Ab','Bb','']
  let wx = 0
  for (let o = startOct; o < startOct + octCount; o++) {
    for (let i = 0; i < 7; i++) {
      keys.push({ note: `${wn[i]}${o}`, isBlack: false, x: wx })
      if (bn[i]) keys.push({ note: `${bn[i]}${o}`, isBlack: true, x: wx + kw - bw/2 + gap/2 })
      wx += kw + gap
    }
  }
  keys.push({ note: `C${startOct + octCount}`, isBlack: false, x: wx })
  return keys
}

function noteMatch(a: string, b: string): boolean {
  if (a === b) return true
  const en: Record<string, string> = { 'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb' }
  const norm = (s: string) => s.replace(/(\D+)(\d)/, (_: string, n: string, o: string) => `${en[n]||n}${o}`)
  return norm(a) === norm(b)
}

// Colors: RH = purple, LH = teal
const RH_COLOR = '#a78bfa'
const LH_COLOR = '#2dd4bf'

// ═══════════════════════════════════════════════════════════════════════════════
// KeyboardSVG — two-color highlighting for RH/LH
// ═══════════════════════════════════════════════════════════════════════════════

function KeyboardSVG({ keys, rhNotes, lhNotes, rhFinger, lhFinger, allNotes, large }: {
  keys: KeyInfo[]; rhNotes: string[]; lhNotes: string[]; rhFinger?: number; lhFinger?: number; allNotes: string[]; large?: boolean
}) {
  const kw = large ? 36 : 30, kh = large ? 120 : 100, bw = large ? 22 : 19, bh = large ? 74 : 62
  const whites = keys.filter(k => !k.isBlack), blacks = keys.filter(k => k.isBlack)
  const totalW = whites.length * (kw+1.5) - 1.5
  const svgW = totalW + 4, svgH = kh + 30

  function getKeyColor(note: string): { fill: string; stroke: string; glow: boolean; color: string } {
    const isRH = rhNotes.some(n => noteMatch(n, note))
    const isLH = lhNotes.some(n => noteMatch(n, note))
    if (isRH && isLH) return { fill: '#8b5cf6', stroke: '#7c3aed', glow: true, color: '#8b5cf6' } // both = deeper purple
    if (isRH) return { fill: RH_COLOR, stroke: '#8b5cf6', glow: true, color: RH_COLOR }
    if (isLH) return { fill: LH_COLOR, stroke: '#14b8a6', glow: true, color: LH_COLOR }
    return { fill: '', stroke: '', glow: false, color: '' }
  }

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ maxHeight: large ? 220 : 180, minWidth: 380 }} className="block">
      <defs><linearGradient id="kglow2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity="0.03" /><stop offset="100%" stopColor="#a78bfa" stopOpacity="0" /></linearGradient></defs>
      <rect x="0" y="0" width={svgW} height={svgH} fill="url(#kglow2)" rx="8" />
      {whites.map(k => {
        const { fill, stroke, glow } = getKeyColor(k.note)
        const inEx = allNotes.some(n => noteMatch(n, k.note))
        return (<g key={k.note} onClick={() => playPianoNote(k.note, 0.6)} className="cursor-pointer">
          <rect x={k.x+2} y={16} width={kw} height={kh} rx={3} fill={glow ? fill : inEx ? '#f0f0ff' : '#f8fafc'} stroke={glow ? stroke : inEx ? '#c4b5fd' : '#cbd5e1'} strokeWidth={glow ? 1.5 : 0.5} style={{ transition:'fill 0.08s' }} />
          {glow && <rect x={k.x+2} y={16} width={kw} height={kh} rx={3} fill="none" stroke={stroke} strokeWidth={2} opacity={0.5}><animate attributeName="opacity" values="0.5;0.15;0.5" dur="0.5s" repeatCount="indefinite" /></rect>}
          <text x={k.x+2+kw/2} y={kh+12} textAnchor="middle" fontSize={large?9:7.5} fill={glow?'#e2e8f0':'#64748b'} fontWeight={glow?700:400}>{k.note}</text>
        </g>)
      })}
      {blacks.map(k => {
        const { fill, stroke, glow } = getKeyColor(k.note)
        return (<g key={k.note} onClick={() => playPianoNote(k.note, 0.6)} className="cursor-pointer">
          <rect x={k.x+2} y={16} width={bw} height={bh} rx={2.5} fill={glow ? fill : '#1e293b'} stroke={glow ? stroke : '#334155'} strokeWidth={glow?1.5:0.5} style={{ transition:'fill 0.08s' }} />
          {glow && <rect x={k.x+2} y={16} width={bw} height={bh} rx={2.5} fill="none" stroke={stroke} strokeWidth={2} opacity={0.5}><animate attributeName="opacity" values="0.5;0.15;0.5" dur="0.5s" repeatCount="indefinite" /></rect>}
        </g>)
      })}
      {/* Finger bubbles */}
      {rhFinger != null && rhNotes.length > 0 && (() => {
        const key = keys.find(k => noteMatch(k.note, rhNotes[0]))
        if (!key) return null
        const cx = key.x + 2 + (key.isBlack ? bw/2 : kw/2)
        return (<g><circle cx={cx} cy={8} r={8} fill="#8b5cf6" /><text x={cx} y={11.5} textAnchor="middle" fontSize={10} fill="#fff" fontWeight={700}>{rhFinger}</text></g>)
      })()}
      {lhFinger != null && lhNotes.length > 0 && (() => {
        const key = keys.find(k => noteMatch(k.note, lhNotes[0]))
        if (!key) return null
        const cx = key.x + 2 + (key.isBlack ? bw/2 : kw/2)
        return (<g><circle cx={cx} cy={8} r={8} fill="#14b8a6" /><text x={cx} y={11.5} textAnchor="middle" fontSize={10} fill="#fff" fontWeight={700}>{lhFinger}</text></g>)
      })()}
      {/* Legend when both hands */}
      {(rhNotes.length > 0 && lhNotes.length > 0) && <>
        <circle cx={svgW-60} cy={8} r={4} fill={RH_COLOR} /><text x={svgW-53} y={11} fontSize={8} fill="#94a3b8">RH</text>
        <circle cx={svgW-30} cy={8} r={4} fill={LH_COLOR} /><text x={svgW-23} y={11} fontSize={8} fill="#94a3b8">LH</text>
      </>}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// NotationWithGrid — Grand staff when both hands present
// ═══════════════════════════════════════════════════════════════════════════════

const NOTE_POS: Record<string, number> = { C:0,D:1,E:2,F:3,G:4,A:5,B:6 }
function getNoteY(note: string, clef: 'treble'|'bass'): number {
  const name = note.replace(/[0-9#b]/g, ''), oct = parseInt(note.replace(/[^0-9]/g, ''))
  if (clef === 'treble') return 50 - ((oct-4)*7+(NOTE_POS[name]??0)-6)*5
  return 50 - ((oct-3)*7+(NOTE_POS[name]??0)-1)*5
}

function NotationWithGrid({ eventsRH, eventsLH, activeIdxRH, activeIdxLH, timeSig, large, onClickNote }: {
  eventsRH: PlayEvent[]; eventsLH: PlayEvent[]; activeIdxRH: number; activeIdxLH: number
  timeSig: [number,number]; large?: boolean; onClickNote: (i: number) => void
}) {
  const hasBothHands = eventsLH.length > 0
  const mainEvents = eventsRH.length > 0 ? eventsRH : eventsLH
  const sp = large ? 56 : 48, lp = 70
  const totalW = lp + mainEvents.length * sp + 40
  const lg = large ? 12 : 10
  const staffH = large ? 140 : 120
  const grandStaffH = hasBothHands ? staffH * 2 + 20 : staffH
  const gridH = large ? 44 : 38
  const svgH = grandStaffH + gridH

  const tTop = large ? 38 : 30
  const tLines = [0,1,2,3,4].map(i => tTop + i * lg)
  const bTop = tTop + 5 * lg + (large ? 40 : 30)
  const bLines = [0,1,2,3,4].map(i => bTop + i * lg)
  const gridY = grandStaffH

  // ── Time-based alignment: compute start times for RH and LH ──
  // RH start times (used for X positions — RH is the master timeline)
  const rhStartTimes: number[] = []
  let t = 0; for (const ev of eventsRH) { rhStartTimes.push(t); t += ev.duration }

  // LH start times
  const lhStartTimes: number[] = []
  t = 0; for (const ev of eventsLH) { lhStartTimes.push(t); t += ev.duration }

  // For each LH event, find the RH column index whose start time is closest
  // This tells us which X position to render the LH note at
  function lhToRHColumn(lhIdx: number): number {
    if (eventsRH.length === 0) return lhIdx
    const lhTime = lhStartTimes[lhIdx]
    let bestCol = 0, bestDist = Infinity
    for (let r = 0; r < rhStartTimes.length; r++) {
      const dist = Math.abs(rhStartTimes[r] - lhTime)
      if (dist < bestDist) { bestDist = dist; bestCol = r }
    }
    return bestCol
  }

  // For the grid: at each RH column, find if an LH event starts at the same time
  function lhEventAtRHColumn(rhIdx: number): PlayEvent | null {
    if (!hasBothHands || rhIdx >= rhStartTimes.length) return null
    const rhTime = rhStartTimes[rhIdx]
    for (let li = 0; li < lhStartTimes.length; li++) {
      if (Math.abs(lhStartTimes[li] - rhTime) < 0.01) return eventsLH[li]
    }
    return null
  }

  // For the grid: find which LH event is ACTIVE at a given RH time (for display)
  function lhActiveAtRHColumn(rhIdx: number): { ev: PlayEvent; idx: number } | null {
    if (!hasBothHands || rhIdx >= rhStartTimes.length) return null
    const rhTime = rhStartTimes[rhIdx]
    for (let li = lhStartTimes.length - 1; li >= 0; li--) {
      if (lhStartTimes[li] <= rhTime + 0.01) return { ev: eventsLH[li], idx: li }
    }
    return null
  }

  // Helper to render a notehead cluster (shared by RH and LH)
  function renderNotes(x: number, ev: PlayEvent, isAct: boolean, isPast: boolean, clef: 'treble' | 'bass', color: string, staffTop: number) {
    const notes = ev.type === 'note' ? [ev.note] : ev.notes
    const centerY = staffTop + 2 * lg
    const isHalf = ev.duration >= 2, isWhole = ev.duration >= 4
    const col = isAct ? color : '#e2e8f0'
    return (<g opacity={isPast ? 0.3 : 1}>
      {notes.map((note, ni) => {
        const nY = centerY - (getNoteY(note, clef) - 50)
        const hasAcc = note.includes('b') || note.includes('#')
        const ledgers: number[] = []
        if (nY < staffTop - 2) for (let ly = staffTop - lg; ly >= nY - 2; ly -= lg) ledgers.push(ly)
        if (nY > staffTop + 4 * lg + 2) for (let ly = staffTop + 5 * lg; ly <= nY + 2; ly += lg) ledgers.push(ly)
        return (<g key={ni}>
          {ledgers.map((ly, li) => <line key={li} x1={x - 10} y1={ly} x2={x + 10} y2={ly} stroke={isAct ? color : '#4b5563'} strokeWidth={0.8} />)}
          {isAct && ni === 0 && <circle cx={x} cy={nY} r={14} fill={color} opacity={0.15}><animate attributeName="r" values="12;16;12" dur="0.6s" repeatCount="indefinite" /></circle>}
          {hasAcc && <text x={x - 12} y={nY + 4} fontSize={11} fill={isAct ? color : '#6b7280'} fontFamily="serif">{note.includes('b') ? '\u266D' : '\u266F'}</text>}
          {isWhole ? <ellipse cx={x} cy={nY} rx={7} ry={5} fill="none" stroke={col} strokeWidth={1.5} />
            : <ellipse cx={x} cy={nY} rx={6} ry={4.5} fill={isHalf ? 'none' : col} stroke={col} strokeWidth={isHalf ? 1.5 : 0} transform={`rotate(-10 ${x} ${nY})`} />}
        </g>)
      })}
      {!isWhole && notes.length > 0 && (() => {
        const yPos = notes.map(n => centerY - (getNoteY(n, clef) - 50))
        const top = Math.min(...yPos), bot = Math.max(...yPos)
        return <line x1={x + 6} y1={bot} x2={x + 6} y2={top - 28} stroke={col} strokeWidth={1.2} />
      })()}
      {ev.duration <= 0.5 && notes.length > 0 && (() => { const nY = centerY - (getNoteY(notes[0], clef) - 50); return <path d={`M${x + 6} ${nY - 28} q 8 8 2 18`} fill="none" stroke={col} strokeWidth={1.2} /> })()}
      {(ev.duration === 1.5 || ev.duration === 3) && notes.length > 0 && (() => { const nY = centerY - (getNoteY(notes[0], clef) - 50); return <circle cx={x + 10} cy={nY - 2} r={1.5} fill={col} /> })()}
      {ev.finger && <text x={x} y={staffTop + 4 * lg + 22} textAnchor="middle" fontSize={9} fill={isAct ? color : '#4b5563'} fontWeight={600}>{ev.finger}</text>}
      {ev.type === 'chord' && <text x={x} y={staffTop - 10} textAnchor="middle" fontSize={10} fill={isAct ? color : '#6b7280'} fontWeight={600}>{ev.name}</text>}
    </g>)
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${svgH}`} width={totalW} height={svgH} className="block min-w-full">
        {/* Treble staff */}
        {tLines.map((y, i) => <line key={`t${i}`} x1={10} y1={y} x2={totalW - 10} y2={y} stroke="#2d3748" strokeWidth={0.8} />)}
        <text x={18} y={tTop + 3.2 * lg} fontSize={large ? 44 : 38} fill="#6b7280" fontFamily="serif">{'\u{1D11E}'}</text>
        <text x={50} y={tTop + 1.5 * lg} fontSize={large ? 16 : 14} fill="#6b7280" fontWeight={700} fontFamily="serif">{timeSig[0]}</text>
        <text x={50} y={tTop + 3.2 * lg} fontSize={large ? 16 : 14} fill="#6b7280" fontWeight={700} fontFamily="serif">{timeSig[1]}</text>

        {/* Bass staff */}
        {hasBothHands && <>
          {bLines.map((y, i) => <line key={`b${i}`} x1={10} y1={y} x2={totalW - 10} y2={y} stroke="#2d3748" strokeWidth={0.8} />)}
          <text x={18} y={bTop + 2.5 * lg} fontSize={large ? 44 : 38} fill="#6b7280" fontFamily="serif">{'\u{1D122}'}</text>
          <line x1={10} y1={tTop} x2={10} y2={bTop + 4 * lg} stroke="#4b5563" strokeWidth={2} />
        </>}

        <line x1={10} y1={gridY} x2={totalW - 10} y2={gridY} stroke="#1e2433" strokeWidth={1} />

        {/* RH notes — positioned by their own index (master timeline) */}
        {eventsRH.map((ev, i) => {
          const x = lp + i * sp
          return <g key={`rh${i}`}>{renderNotes(x, ev, i === activeIdxRH, activeIdxRH >= 0 && i < activeIdxRH, 'treble', RH_COLOR, tTop)}</g>
        })}

        {/* LH notes — positioned at the RH column matching their start time */}
        {hasBothHands && eventsLH.map((ev, li) => {
          const rhCol = lhToRHColumn(li)
          const x = lp + rhCol * sp
          return <g key={`lh${li}`}>{renderNotes(x, ev, li === activeIdxLH, activeIdxLH >= 0 && li < activeIdxLH, 'bass', LH_COLOR, bTop)}</g>
        })}

        {/* Grid cells — one per RH event, with LH label when LH starts at that beat */}
        {mainEvents.map((ev, i) => {
          const x = lp + i * sp
          const isRHAct = i === activeIdxRH
          const lhInfo = lhActiveAtRHColumn(i)
          const isLHAct = lhInfo ? lhInfo.idx === activeIdxLH : false
          const isAct = isRHAct || isLHAct
          const isPast = activeIdxRH >= 0 && i < activeIdxRH
          const cellW = sp - 4, cellH = gridH - 8, cellX = x - cellW / 2, cellY = gridY + 4
          const rhLabel = ev.type === 'chord' ? ev.name : ev.note
          // Show LH label if an LH event STARTS at this column
          const lhStartsHere = lhEventAtRHColumn(i)
          const lhLabel = lhStartsHere ? (lhStartsHere.type === 'chord' ? lhStartsHere.name : lhStartsHere.note) : null
          const showBothLabels = lhLabel && lhLabel !== rhLabel

          return (<g key={`grid${i}`} className="cursor-pointer" onClick={() => onClickNote(i)} opacity={isPast ? 0.3 : 1}>
            <rect x={cellX} y={cellY} width={cellW} height={cellH} rx={6}
              fill={isAct ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.02)'}
              stroke={isAct ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.04)'} strokeWidth={isAct ? 1.5 : 0.5} />
            {isAct && <rect x={cellX} y={cellY} width={cellW} height={cellH} rx={6} fill="none" stroke="#a78bfa" strokeWidth={1.5} opacity={0.3}><animate attributeName="opacity" values="0.3;0.1;0.3" dur="0.6s" repeatCount="indefinite" /></rect>}
            {showBothLabels ? <>
              <text x={x} y={cellY + cellH / 2 - 1} textAnchor="middle" fontSize={large ? 10 : 9} fontWeight={isAct ? 700 : 500} fill={isRHAct ? RH_COLOR : '#6b7280'}>{rhLabel}</text>
              <text x={x} y={cellY + cellH / 2 + 10} textAnchor="middle" fontSize={large ? 9 : 8} fontWeight={isLHAct ? 600 : 400} fill={isLHAct ? LH_COLOR : '#4b5563'}>{lhLabel}</text>
            </> : <text x={x} y={cellY + cellH / 2 + (large ? 4 : 3.5)} textAnchor="middle" fontSize={large ? 11 : 10} fontWeight={isAct ? 700 : 500} fill={isAct ? '#fff' : '#6b7280'}>{rhLabel}</text>}
          </g>)
        })}
      </svg>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Event types + builder
// ═══════════════════════════════════════════════════════════════════════════════

interface NotePlayEvent { type: 'note'; note: string; duration: number; finger?: number }
interface ChordPlayEvent { type: 'chord'; name: string; notes: string[]; duration: number; finger?: number; fingers?: number[] }
type PlayEvent = NotePlayEvent | ChordPlayEvent

function buildEvents(notes?: NoteEvent[], chords?: ChordEvent[]): PlayEvent[] {
  const events: PlayEvent[] = []
  if (notes && notes.length > 0) for (const n of notes) events.push({ type:'note', note:n.note, duration:n.duration, finger:n.finger })
  else if (chords && chords.length > 0) for (const c of chords) events.push({ type:'chord', name:c.name, notes:c.notes, duration:c.duration, finger:c.fingers?.[0], fingers:c.fingers })
  return events
}

// ═══════════════════════════════════════════════════════════════════════════════
// PracticePlayer
// ═══════════════════════════════════════════════════════════════════════════════

export interface PracticePlayerProps {
  notes?: NoteEvent[]           // RH notes
  chords?: ChordEvent[]         // RH chords (used if no notes)
  notesLeft?: NoteEvent[]       // LH notes
  chordsLeft?: ChordEvent[]     // LH chords
  defaultBpm: number
  timeSignature?: [number, number]
  resetKey?: string
  onSessionComplete?: () => void
}

type PlayState = 'idle' | 'playing' | 'paused'

export default function PracticePlayer({ notes, chords, notesLeft, chordsLeft, defaultBpm, timeSignature, resetKey, onSessionComplete }: PracticePlayerProps) {
  const [bpm, setBpm] = useState(defaultBpm)
  const [activeIdxRH, setActiveIdxRH] = useState(-1)
  const [activeIdxLH, setActiveIdxLH] = useState(-1)
  const [playState, setPlayState] = useState<PlayState>('idle')
  const [metronomeOn, setMetronomeOn] = useState(true)
  const [metronomeVol, setMetronomeVol] = useState(0.7)
  const [repeats, setRepeats] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)

  const animRef = useRef(0)
  const startRef = useRef(0)
  const pausedAtRef = useRef(0)
  const schedRHRef = useRef<{ start:number; end:number }[]>([])
  const schedLHRef = useRef<{ start:number; end:number }[]>([])
  const playedRHRef = useRef<Set<number>>(new Set())
  const playedLHRef = useRef<Set<number>>(new Set())
  const playedClicksRef = useRef<Set<number>>(new Set())
  const metOnRef = useRef(true)
  const metVolRef = useRef(0.7)

  useEffect(() => { metOnRef.current = metronomeOn }, [metronomeOn])
  useEffect(() => { metVolRef.current = metronomeVol }, [metronomeVol])

  const eventsRH = useMemo(() => buildEvents(notes, chords), [notes, chords])
  const eventsLH = useMemo(() => buildEvents(notesLeft, chordsLeft), [notesLeft, chordsLeft])
  const hasBothHands = eventsLH.length > 0
  const timeSig: [number,number] = timeSignature ?? [4,4]

  useEffect(() => {
    cancelAnimationFrame(animRef.current)
    setActiveIdxRH(-1); setActiveIdxLH(-1); setPlayState('idle'); pausedAtRef.current = 0; setBpm(defaultBpm)
  }, [resetKey, defaultBpm])

  useEffect(() => {
    const all: string[] = []
    if (notes) all.push(...notes.map(n => n.note))
    if (chords) chords.forEach(c => all.push(...c.notes))
    if (notesLeft) all.push(...notesLeft.map(n => n.note))
    if (chordsLeft) chordsLeft.forEach(c => all.push(...c.notes))
    if (all.length > 0) preloadSamples([...new Set(all)])
  }, [notes, chords, notesLeft, chordsLeft])

  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  const buildSchedule = useCallback((evs: PlayEvent[], currentBpm: number) => {
    const beatDur = 60/currentBpm; const sched: { start:number; end:number }[] = []; let t = 0
    for (const ev of evs) { sched.push({ start:t, end:t+ev.duration*beatDur }); t += ev.duration*beatDur }
    return { sched, totalDur:t, beatDur }
  }, [])

  const startPlayback = useCallback((fromIdx = 0) => {
    if (eventsRH.length === 0 && eventsLH.length === 0) return
    const ctx = getCtx(); if (ctx.state === 'suspended') ctx.resume()
    const beatDur = 60/bpm

    // Build RH schedule
    const rhBuild = buildSchedule(eventsRH, bpm)
    const rhFull: { start:number; end:number }[] = []
    for (let r = 0; r < repeats; r++) for (const s of rhBuild.sched) rhFull.push({ start:s.start+r*rhBuild.totalDur, end:s.end+r*rhBuild.totalDur })

    // Build LH schedule
    const lhBuild = buildSchedule(eventsLH, bpm)
    const lhFull: { start:number; end:number }[] = []
    for (let r = 0; r < repeats; r++) for (const s of lhBuild.sched) lhFull.push({ start:s.start+r*lhBuild.totalDur, end:s.end+r*lhBuild.totalDur })

    const rhDur = rhBuild.totalDur * repeats
    const lhDur = lhBuild.totalDur * repeats
    const fullDur = Math.max(rhDur, lhDur)

    // Offset for click-to-play-from
    const offset = fromIdx > 0 && fromIdx < rhFull.length ? rhFull[fromIdx].start : 0
    const trimRH = rhFull.slice(fromIdx).map(s => ({ start:s.start-offset, end:s.end-offset }))
    // For LH, find the corresponding start index
    const lhFromIdx = lhFull.findIndex(s => s.start >= offset)
    const trimLH = lhFromIdx >= 0 ? lhFull.slice(lhFromIdx).map(s => ({ start:s.start-offset, end:s.end-offset })) : []
    const trimDur = Math.max(trimRH.length > 0 ? trimRH[trimRH.length-1].end : 0, trimLH.length > 0 ? trimLH[trimLH.length-1].end : 0)

    schedRHRef.current = trimRH; schedLHRef.current = trimLH
    playedRHRef.current = new Set(); playedLHRef.current = new Set(); playedClicksRef.current = new Set()
    setPlayState('playing'); setActiveIdxRH(fromIdx); setActiveIdxLH(lhFromIdx >= 0 ? lhFromIdx : -1)
    startRef.current = performance.now(); pausedAtRef.current = 0

    const tsn = timeSig[0]; const totalBeats = Math.ceil(trimDur/beatDur)

    function tick() {
      const elapsed = pausedAtRef.current + (performance.now()-startRef.current)/1000
      if (elapsed >= trimDur) { setPlayState('idle'); setActiveIdxRH(-1); setActiveIdxLH(-1); onSessionComplete?.(); return }

      // RH notes
      for (let i = 0; i < trimRH.length; i++) {
        if (elapsed >= trimRH[i].start && !playedRHRef.current.has(i)) {
          playedRHRef.current.add(i)
          const ev = eventsRH[(fromIdx+i) % eventsRH.length]; const d = ev.duration*beatDur
          if (ev.type==='note') playPianoNote(ev.note, 0.65, d)
          else ev.notes.forEach((n,j) => setTimeout(() => playPianoNote(n, 0.55, d), j*30))
        }
      }
      // LH notes
      for (let i = 0; i < trimLH.length; i++) {
        if (elapsed >= trimLH[i].start && !playedLHRef.current.has(i)) {
          playedLHRef.current.add(i)
          const lhIdx = (lhFromIdx >= 0 ? lhFromIdx : 0) + i
          const ev = eventsLH[lhIdx % eventsLH.length]; const d = ev.duration*beatDur
          if (ev.type==='note') playPianoNote(ev.note, 0.55, d)
          else ev.notes.forEach((n,j) => setTimeout(() => playPianoNote(n, 0.5, d), j*30))
        }
      }
      // Metronome
      if (metOnRef.current) for (let b = 0; b < totalBeats; b++) { if (b*beatDur<=elapsed && !playedClicksRef.current.has(b)) { playedClicksRef.current.add(b); clickNow(b%tsn===0, metVolRef.current) } }
      // Active indices
      const rhIdx = trimRH.findIndex(s => elapsed>=s.start && elapsed<s.end)
      if (rhIdx >= 0) setActiveIdxRH((fromIdx+rhIdx) % eventsRH.length)
      const lhIdx = trimLH.findIndex(s => elapsed>=s.start && elapsed<s.end)
      if (lhIdx >= 0) setActiveIdxLH(((lhFromIdx>=0?lhFromIdx:0)+lhIdx) % eventsLH.length)

      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [eventsRH, eventsLH, bpm, repeats, timeSig, buildSchedule, onSessionComplete])

  const handlePause = useCallback(() => { cancelAnimationFrame(animRef.current); pausedAtRef.current += (performance.now()-startRef.current)/1000; setPlayState('paused') }, [])

  const handleResume = useCallback(() => {
    if (playState !== 'paused') return
    const ctx = getCtx(); if (ctx.state === 'suspended') ctx.resume()
    setPlayState('playing'); startRef.current = performance.now()
    const beatDur = 60/bpm; const trimRH = schedRHRef.current; const trimLH = schedLHRef.current
    const trimDur = Math.max(trimRH.length>0?trimRH[trimRH.length-1].end:0, trimLH.length>0?trimLH[trimLH.length-1].end:0)
    const tsn = timeSig[0]; const totalBeats = Math.ceil(trimDur/beatDur)
    function tick() {
      const elapsed = pausedAtRef.current + (performance.now()-startRef.current)/1000
      if (elapsed >= trimDur) { setPlayState('idle'); setActiveIdxRH(-1); setActiveIdxLH(-1); onSessionComplete?.(); return }
      for (let i = 0; i < trimRH.length; i++) { if (elapsed>=trimRH[i].start && !playedRHRef.current.has(i)) { playedRHRef.current.add(i); const ev=eventsRH[i%eventsRH.length]; const d=ev.duration*beatDur; if (ev.type==='note') playPianoNote(ev.note,0.65,d); else ev.notes.forEach((n,j) => setTimeout(() => playPianoNote(n,0.55,d),j*30)) } }
      for (let i = 0; i < trimLH.length; i++) { if (elapsed>=trimLH[i].start && !playedLHRef.current.has(i)) { playedLHRef.current.add(i); const ev=eventsLH[i%eventsLH.length]; const d=ev.duration*beatDur; if (ev.type==='note') playPianoNote(ev.note,0.55,d); else ev.notes.forEach((n,j) => setTimeout(() => playPianoNote(n,0.5,d),j*30)) } }
      if (metOnRef.current) for (let b=0; b<totalBeats; b++) { if (b*beatDur<=elapsed && !playedClicksRef.current.has(b)) { playedClicksRef.current.add(b); clickNow(b%tsn===0, metVolRef.current) } }
      const rhI = trimRH.findIndex(s => elapsed>=s.start && elapsed<s.end); if (rhI>=0) setActiveIdxRH(rhI%eventsRH.length)
      const lhI = trimLH.findIndex(s => elapsed>=s.start && elapsed<s.end); if (lhI>=0) setActiveIdxLH(lhI%eventsLH.length)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [playState, eventsRH, eventsLH, bpm, timeSig, onSessionComplete])

  const handleStop = useCallback(() => { cancelAnimationFrame(animRef.current); setPlayState('idle'); setActiveIdxRH(-1); setActiveIdxLH(-1); pausedAtRef.current = 0 }, [])

  // Derived
  const allNotes: string[] = []
  if (notes) allNotes.push(...notes.map(n => n.note))
  if (chords) chords.forEach(c => allNotes.push(...c.notes))
  if (notesLeft) allNotes.push(...notesLeft.map(n => n.note))
  if (chordsLeft) chordsLeft.forEach(c => allNotes.push(...c.notes))
  const octs = allNotes.map(n => parseInt(n.replace(/[^0-9]/g,'')))
  const minOct = octs.length ? Math.min(...octs) : 3, maxOct = octs.length ? Math.max(...octs) : 5
  const keys = buildKeys(minOct, maxOct-minOct+1, 30, 19, 1.5)
  const keysLg = buildKeys(minOct, maxOct-minOct+1, 36, 22, 1.5)

  const rhActiveNotes: string[] = [], lhActiveNotes: string[] = []
  if (activeIdxRH >= 0 && activeIdxRH < eventsRH.length) {
    const ev = eventsRH[activeIdxRH]; if (ev.type==='note') rhActiveNotes.push(ev.note); else rhActiveNotes.push(...ev.notes)
  }
  if (activeIdxLH >= 0 && activeIdxLH < eventsLH.length) {
    const ev = eventsLH[activeIdxLH]; if (ev.type==='note') lhActiveNotes.push(ev.note); else lhActiveNotes.push(...ev.notes)
  }
  const rhFinger = activeIdxRH>=0 && activeIdxRH<eventsRH.length ? eventsRH[activeIdxRH].finger : undefined
  const lhFinger = activeIdxLH>=0 && activeIdxLH<eventsLH.length ? eventsLH[activeIdxLH].finger : undefined
  const isActive = playState !== 'idle'

  if (eventsRH.length === 0 && eventsLH.length === 0) return <div className="text-center text-[#4b5563] text-sm py-8">No notes to play</div>

  const controlBar = (isLg: boolean) => (
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
      {hasBothHands && <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">Both Hands</span>}
      <div className="ml-auto">
        <button onClick={() => setFullscreen(!fullscreen)} className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] flex items-center justify-center transition-all cursor-pointer">
          <svg className="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {fullscreen ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v4H4M15 4v4h5M9 20v-4H4M15 20v-4h5" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />}
          </svg>
        </button>
      </div>
    </div>
  )

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
          <NotationWithGrid eventsRH={eventsRH} eventsLH={eventsLH} activeIdxRH={activeIdxRH} activeIdxLH={activeIdxLH} timeSig={timeSig} large onClickNote={startPlayback} />
        </div>
        <div className="flex-1 flex items-center justify-center p-4" style={{ minHeight:200 }}>
          <div className="w-full max-w-4xl overflow-x-auto">
            <KeyboardSVG keys={keysLg} rhNotes={rhActiveNotes} lhNotes={lhActiveNotes} rhFinger={rhFinger} lhFinger={lhFinger} allNotes={allNotes} large />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/[0.05] p-3 lg:p-4" style={{ background:'linear-gradient(180deg, rgba(20,22,30,0.9) 0%, rgba(12,14,20,0.95) 100%)', backdropFilter:'blur(12px)' }}>
        {controlBar(false)}
      </div>
      <div className="rounded-2xl overflow-hidden" style={{
        background:'linear-gradient(180deg, rgba(12,14,20,0.7) 0%, rgba(8,10,16,0.9) 100%)',
        border:'1px solid rgba(255,255,255,0.04)',
        boxShadow: playState==='playing' ? '0 0 40px -10px rgba(167,139,250,0.15)' : 'none',
      }}>
        <div className="p-4 lg:p-5 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold">
              {hasBothHands ? 'Grand Staff' : 'Notation'}
            </div>
            <div className="text-[9px] text-[#374151]">Click a note to play from there</div>
          </div>
          <NotationWithGrid eventsRH={eventsRH} eventsLH={eventsLH} activeIdxRH={activeIdxRH} activeIdxLH={activeIdxLH} timeSig={timeSig} onClickNote={startPlayback} />
        </div>
        <div className="p-4 lg:p-5">
          <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold mb-2">Keyboard</div>
          <div className="overflow-x-auto pb-1">
            <KeyboardSVG keys={keys} rhNotes={rhActiveNotes} lhNotes={lhActiveNotes} rhFinger={rhFinger} lhFinger={lhFinger} allNotes={allNotes} />
          </div>
        </div>
      </div>
    </div>
  )
}
