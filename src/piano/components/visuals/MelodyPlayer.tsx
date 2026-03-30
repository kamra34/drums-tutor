import { useState, useRef, useEffect, useCallback } from 'react'
import { playPianoNote, preloadSamples } from '@piano/services/pianoSounds'

// ── Types ────────────────────────────────────────────────────────────────────

export interface MelodyNote {
  note: string     // e.g. "E4"
  beats: number    // duration in beats (1 = quarter, 2 = half, etc.)
  finger?: number  // 1-5
}

export interface MelodyPlayerProps {
  title: string
  melody: MelodyNote[]
  bpm?: number
  hand?: 'right' | 'left'
  startOctave?: number
}

// ── Keyboard rendering helpers ───────────────────────────────────────────────

const WHITE_W = 40
const WHITE_H = 120
const BLACK_W = 24
const BLACK_H = 76
const GAP = 1
const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const BLACK_OFFSETS: Record<string, number> = { C: 0.65, D: 0.65, F: 0.65, G: 0.65, A: 0.65 }

interface KeyDef { note: string; x: number; isBlack: boolean }

function buildKeys(startOctave: number): KeyDef[] {
  const keys: KeyDef[] = []
  let x = 0
  for (const wn of WHITE_NOTES) {
    keys.push({ note: `${wn}${startOctave}`, x, isBlack: false })
    if (BLACK_OFFSETS[wn] !== undefined) {
      keys.push({ note: `${wn}#${startOctave}`, x: x + WHITE_W * BLACK_OFFSETS[wn], isBlack: true })
    }
    x += WHITE_W + GAP
  }
  keys.push({ note: `C${startOctave + 1}`, x, isBlack: false })
  return keys
}

// ── Metronome click ──────────────────────────────────────────────────────────

const audioCtxRef = { current: null as AudioContext | null }
function getCtx() {
  if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
  return audioCtxRef.current
}

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
  osc.start(time)
  osc.stop(time + 0.08)
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MelodyPlayer({
  title,
  melody,
  bpm = 80,
  hand = 'right',
  startOctave = 4,
}: MelodyPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const animRef = useRef<number>(0)
  const startTimeRef = useRef(0)
  const scheduleRef = useRef<{ start: number; end: number }[]>([])

  const keys = buildKeys(startOctave)
  const whites = keys.filter((k) => !k.isBlack)
  const blacks = keys.filter((k) => k.isBlack)
  const totalW = whites.length * (WHITE_W + GAP) - GAP
  const svgW = totalW + 4
  const svgH = WHITE_H + 30

  const accent = '#a78bfa'
  const activeNote = activeIdx >= 0 && activeIdx < melody.length ? melody[activeIdx].note : null

  // Preload samples
  useEffect(() => {
    const notes = [...new Set(melody.map((m) => m.note))]
    preloadSamples(notes)
  }, [melody])

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  // Build timing schedule
  const buildSchedule = useCallback(() => {
    const beatDur = 60 / bpm
    const schedule: { start: number; end: number }[] = []
    let t = 0
    for (const n of melody) {
      const dur = n.beats * beatDur
      schedule.push({ start: t, end: t + dur })
      t += dur
    }
    return schedule
  }, [melody, bpm])

  const handlePlay = useCallback(() => {
    if (playing) return

    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()

    const beatDur = 60 / bpm
    const schedule = buildSchedule()
    scheduleRef.current = schedule
    const totalDur = schedule[schedule.length - 1].end

    // Calculate total beats for metronome
    const totalBeats = Math.ceil(totalDur / beatDur)

    const now = ctx.currentTime

    // Schedule all piano notes
    for (let i = 0; i < melody.length; i++) {
      const n = melody[i]
      const noteStart = now + schedule[i].start
      // Use setTimeout to trigger playPianoNote at the right time
      const delayMs = schedule[i].start * 1000
      setTimeout(() => {
        playPianoNote(n.note, 0.65)
      }, delayMs)
    }

    // Schedule metronome clicks
    for (let beat = 0; beat < totalBeats; beat++) {
      scheduleClick(now + beat * beatDur, beat % 4 === 0)
    }

    // Animate
    setPlaying(true)
    setActiveIdx(0)
    startTimeRef.current = performance.now()

    function tick() {
      const elapsed = (performance.now() - startTimeRef.current) / 1000
      if (elapsed >= totalDur) {
        setPlaying(false)
        setActiveIdx(-1)
        return
      }
      // Find which note is active
      const idx = schedule.findIndex((s) => elapsed >= s.start && elapsed < s.end)
      if (idx >= 0) setActiveIdx(idx)
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
  }, [playing, melody, bpm, buildSchedule])

  // Note sequence display
  const noteSequence = melody.map((n) => {
    const letter = n.note.replace(/\d/, '')
    return { letter, beats: n.beats, finger: n.finger }
  })

  return (
    <div className="my-6 rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: '#0d1117' }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accent }}>
            {hand === 'right' ? 'Right Hand' : 'Left Hand'} — Listen & Learn
          </span>
          <div className="text-sm font-semibold text-white mt-0.5">{title}</div>
        </div>
        <button
          onClick={handlePlay}
          disabled={playing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-40"
          style={{
            background: playing ? `${accent}20` : `${accent}18`,
            border: `1px solid ${playing ? accent : `${accent}40`}`,
            color: playing ? accent : '#e2e8f0',
          }}
        >
          {playing ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: accent }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: accent }} />
              </span>
              Playing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 2l10 6-10 6V2z" />
              </svg>
              Play Demo
            </>
          )}
        </button>
      </div>

      {/* Note sequence — scrollable bar */}
      <div className="px-5 pb-3">
        <div className="flex gap-1 overflow-x-auto py-1">
          {noteSequence.map((n, i) => {
            const isActive = i === activeIdx
            const isPast = activeIdx >= 0 && i < activeIdx
            const widthClass = n.beats >= 2 ? 'min-w-[48px]' : n.beats >= 1 ? 'min-w-[32px]' : 'min-w-[24px]'

            return (
              <div
                key={i}
                className={`flex flex-col items-center justify-center rounded-lg px-1.5 py-1.5 transition-all duration-100 ${widthClass}`}
                style={{
                  background: isActive ? `${accent}30` : isPast ? `${accent}10` : '#161b22',
                  border: `1px solid ${isActive ? accent : 'transparent'}`,
                  boxShadow: isActive ? `0 0 12px ${accent}40` : 'none',
                  flex: `${n.beats} 0 0`,
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: isActive ? accent : isPast ? '#6b7280' : '#94a3b8' }}
                >
                  {n.letter}
                </span>
                {n.finger != null && (
                  <span className="text-[9px]" style={{ color: isActive ? `${accent}cc` : '#4b5563' }}>
                    {n.finger}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Keyboard */}
      <div className="px-4 pb-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="mx-auto"
          style={{ maxWidth: `${svgW}px`, width: '100%', height: 'auto' }}
        >
          <g transform="translate(2, 2)">
            {/* White keys */}
            {whites.map((k) => {
              const isHit = k.note === activeNote
              const finger = isHit ? melody[activeIdx]?.finger : undefined
              return (
                <g key={k.note}>
                  <rect
                    x={k.x} y={0}
                    width={WHITE_W} height={WHITE_H}
                    rx={3}
                    fill={isHit ? accent : '#f0f0f0'}
                    stroke={isHit ? accent : '#999'}
                    strokeWidth={isHit ? 1.5 : 0.5}
                    style={{ transition: 'fill 0.08s' }}
                  />
                  {isHit && (
                    <rect
                      x={k.x} y={0}
                      width={WHITE_W} height={WHITE_H}
                      rx={3}
                      fill="none"
                      style={{ filter: `drop-shadow(0 0 8px ${accent})` }}
                    />
                  )}
                  {/* Note name */}
                  <text
                    x={k.x + WHITE_W / 2} y={WHITE_H - 8}
                    textAnchor="middle"
                    fill={isHit ? '#fff' : '#888'}
                    fontSize={10} fontWeight={isHit ? 700 : 400} fontFamily="system-ui"
                  >
                    {k.note}
                  </text>
                  {/* Finger number when active */}
                  {finger != null && (
                    <text
                      x={k.x + WHITE_W / 2} y={WHITE_H + 18}
                      textAnchor="middle"
                      fill={accent}
                      fontSize={14} fontWeight={700} fontFamily="system-ui"
                    >
                      {finger}
                    </text>
                  )}
                </g>
              )
            })}
            {/* Black keys */}
            {blacks.map((k) => {
              const isHit = k.note === activeNote
              return (
                <g key={k.note}>
                  <rect
                    x={k.x} y={0}
                    width={BLACK_W} height={BLACK_H}
                    rx={2}
                    fill={isHit ? accent : '#1a1a1a'}
                    stroke={isHit ? accent : '#000'}
                    strokeWidth={isHit ? 1.5 : 0.5}
                    style={{ transition: 'fill 0.08s' }}
                  />
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {/* BPM info */}
      <div className="px-5 pb-3 flex items-center justify-between text-[11px] text-[#4b5563]">
        <span>{bpm} BPM — {hand === 'right' ? 'Right Hand' : 'Left Hand'}</span>
        <span>{melody.length} notes</span>
      </div>
    </div>
  )
}
