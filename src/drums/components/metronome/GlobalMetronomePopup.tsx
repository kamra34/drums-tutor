import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useGlobalMetronomeStore } from '@drums/stores/useGlobalMetronomeStore'
import {
  startGlobalMetronome,
  stopGlobalMetronome,
  updateGlobalMetronomeBpm,
  updateGlobalMetronomeVolume,
} from '@shared/services/globalMetronome'

// ── Preset tempos with musical terms ─────────────────────────────────────────

const TEMPO_PRESETS = [
  { bpm: 60, label: 'Largo' },
  { bpm: 80, label: 'Andante' },
  { bpm: 100, label: 'Moderato' },
  { bpm: 120, label: 'Allegro' },
  { bpm: 140, label: 'Vivace' },
  { bpm: 160, label: 'Presto' },
]

const TIME_SIGS: [number, number][] = [[2, 4], [3, 4], [4, 4], [5, 4], [6, 8], [7, 8]]

interface Props { open: boolean; onClose: () => void }

export default function GlobalMetronomePopup({ open, onClose }: Props) {
  const store = useGlobalMetronomeStore()
  const tapTimesRef = useRef<number[]>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const bpmInputRef = useRef<HTMLInputElement>(null)
  const [editingBpm, setEditingBpm] = useState(false)
  const [bpmDraft, setBpmDraft] = useState('')

  const toggle = useCallback(() => {
    if (store.isPlaying) {
      stopGlobalMetronome()
      store.setPlaying(false)
    } else {
      startGlobalMetronome(store.bpm, store.beatsPerMeasure, store.volume, store.accentFirst, (beat) => store.setCurrentBeat(beat))
      store.setPlaying(true)
    }
  }, [store.bpm, store.beatsPerMeasure, store.volume, store.accentFirst, store.isPlaying])

  function handleBpm(v: number) {
    const clamped = Math.max(30, Math.min(300, v))
    store.setBpm(clamped)
    if (store.isPlaying) updateGlobalMetronomeBpm(clamped)
  }

  function handleVolume(v: number) { store.setVolume(v); updateGlobalMetronomeVolume(v) }

  function handleTimeSig(beats: number, value: number) {
    const wasPlaying = store.isPlaying
    if (wasPlaying) { stopGlobalMetronome(); store.setPlaying(false) }
    store.setTimeSignature(beats, value)
    if (wasPlaying) setTimeout(() => {
      startGlobalMetronome(store.bpm, beats, store.volume, store.accentFirst, (beat) => store.setCurrentBeat(beat))
      store.setPlaying(true)
    }, 50)
  }

  function handleTap() {
    const now = Date.now(), taps = tapTimesRef.current
    taps.push(now)
    while (taps.length > 6) taps.shift()
    if (taps.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1])
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const bpm = Math.round(60000 / avg)
      if (bpm >= 30 && bpm <= 300) handleBpm(bpm)
    }
    setTimeout(() => { if (taps.length && Date.now() - taps[taps.length - 1] > 2000) taps.length = 0 }, 2100)
  }

  function startEditBpm() {
    setBpmDraft(String(store.bpm))
    setEditingBpm(true)
    setTimeout(() => bpmInputRef.current?.select(), 10)
  }

  function commitBpmEdit() {
    const v = parseInt(bpmDraft, 10)
    if (!isNaN(v)) handleBpm(v)
    setEditingBpm(false)
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const n = store.beatsPerMeasure
  const beats = Array.from({ length: n }, (_, i) => i)
  const playing = store.isPlaying
  const cur = store.currentBeat

  // Ring geometry
  const R = 110
  const beatAngle = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2
  const beatX = (i: number) => Math.cos(beatAngle(i)) * R
  const beatY = (i: number) => Math.sin(beatAngle(i)) * R

  // Get the current tempo label
  const tempoLabel = (() => {
    const b = store.bpm
    if (b < 70) return 'Largo'
    if (b < 90) return 'Andante'
    if (b < 110) return 'Moderato'
    if (b < 130) return 'Allegro'
    if (b < 150) return 'Vivace'
    return 'Presto'
  })()

  // Arc path helper
  function arcPath(startDeg: number, endDeg: number, r: number) {
    const toRad = (d: number) => (d - 90) * Math.PI / 180
    const x1 = Math.cos(toRad(startDeg)) * r, y1 = Math.sin(toRad(startDeg)) * r
    const x2 = Math.cos(toRad(endDeg)) * r, y2 = Math.sin(toRad(endDeg)) * r
    const large = (endDeg - startDeg) > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }

  const arcEnd = playing && cur > 0 ? (cur / n) * 360 : 0

  return createPortal(
    <div
      className="fixed inset-0 z-[100]"
      onClick={(e) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose() }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <div className="w-full h-full flex items-center justify-center p-4">
        <div
          ref={panelRef}
          className="relative w-full max-w-[420px]"
          style={{
            borderRadius: 32,
            background: 'linear-gradient(160deg, rgba(16,19,30,0.97) 0%, rgba(8,10,16,0.99) 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: `0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.02) inset${playing ? ', 0 0 120px -20px rgba(245,158,11,0.08)' : ''}`,
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.06] text-[#4b5563] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* ═══ Beat ring visualization ═══ */}
          <div className="flex justify-center pt-7 pb-2">
            <div className="relative" style={{ width: 280, height: 280 }}>
              <svg viewBox="-140 -140 280 280" className="w-full h-full">
                {/* Background ring */}
                <circle cx="0" cy="0" r={R} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2.5" />

                {/* Progress arc */}
                {playing && cur > 0 && (
                  <path
                    d={arcPath(0, arcEnd, R)}
                    fill="none"
                    stroke="url(#metGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}

                {/* Full ring flash on beat 0 */}
                {playing && cur === 0 && (
                  <circle cx="0" cy="0" r={R} fill="none" stroke="rgba(245,158,11,0.15)" strokeWidth="2.5" />
                )}

                <defs>
                  <linearGradient id="metGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0.3" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Beat dots */}
                {beats.map(i => {
                  const cx = beatX(i), cy = beatY(i)
                  const isActive = playing && cur === i
                  const isPlayed = playing && cur > i
                  const isAccent = i === 0 && store.accentFirst

                  return (
                    <g key={i}>
                      {isActive && (
                        <circle cx={cx} cy={cy} r={16}
                          fill={isAccent ? 'rgba(245,158,11,0.12)' : 'rgba(148,163,184,0.06)'}
                        />
                      )}
                      <circle cx={cx} cy={cy}
                        r={isActive ? 7 : 5}
                        fill={
                          isActive
                            ? isAccent ? '#f59e0b' : '#94a3b8'
                            : isPlayed
                              ? isAccent ? 'rgba(245,158,11,0.35)' : 'rgba(148,163,184,0.2)'
                              : isAccent ? 'rgba(245,158,11,0.15)' : 'rgba(148,163,184,0.07)'
                        }
                        filter={isActive ? 'url(#glow)' : undefined}
                        style={{ transition: 'fill 0.06s, r 0.06s' }}
                      />
                    </g>
                  )
                })}

                {/* Pendulum */}
                {playing && cur >= 0 && (() => {
                  const a = beatAngle(cur)
                  const lx = Math.cos(a) * (R - 24)
                  const ly = Math.sin(a) * (R - 24)
                  return (
                    <line x1="0" y1="0" x2={lx} y2={ly}
                      stroke="rgba(245,158,11,0.1)" strokeWidth="1.5" strokeLinecap="round"
                      style={{ transition: 'x2 0.08s, y2 0.08s' }}
                    />
                  )
                })()}

                {/* Center pivot */}
                <circle cx="0" cy="0" r="3"
                  fill={playing ? '#f59e0b' : 'rgba(255,255,255,0.06)'}
                  style={{ transition: 'fill 0.2s' }}
                />
              </svg>

              {/* Center BPM display — click to type */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {editingBpm ? (
                  <input
                    ref={bpmInputRef}
                    type="number"
                    value={bpmDraft}
                    onChange={e => setBpmDraft(e.target.value)}
                    onBlur={commitBpmEdit}
                    onKeyDown={e => { if (e.key === 'Enter') commitBpmEdit(); if (e.key === 'Escape') setEditingBpm(false) }}
                    className="w-24 text-center text-5xl font-black text-white bg-transparent border-b-2 border-amber-500/40 outline-none tabular-nums"
                    style={{ letterSpacing: '-2px' }}
                    min={30}
                    max={300}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={startEditBpm}
                    className="cursor-pointer select-none group"
                    title="Click to type tempo"
                  >
                    <div className="text-5xl font-black tabular-nums text-white/90 group-hover:text-amber-400 transition-colors leading-none" style={{ letterSpacing: '-2px' }}>
                      {store.bpm}
                    </div>
                  </button>
                )}
                <div className="text-[10px] text-amber-500/40 font-medium mt-1 tracking-wide">{tempoLabel}</div>
                <div className="text-[11px] text-[#3d4d5d] font-mono mt-0.5">{n}/{store.beatValue}</div>
              </div>
            </div>
          </div>

          {/* ═══ Controls panel ═══ */}
          <div className="px-7 pb-7 space-y-4">

            {/* ── Tempo presets ── */}
            <div>
              <div className="text-[9px] text-[#374151] uppercase tracking-[0.15em] mb-2 font-medium">Tempo</div>
              <div className="grid grid-cols-6 gap-1.5">
                {TEMPO_PRESETS.map(p => {
                  const isActive = store.bpm === p.bpm
                  return (
                    <button
                      key={p.bpm}
                      onClick={() => handleBpm(p.bpm)}
                      className={`flex flex-col items-center py-2 rounded-xl border cursor-pointer transition-all ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-500/25 shadow-lg shadow-amber-500/5'
                          : 'border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02]'
                      }`}
                    >
                      <span className={`text-sm font-bold tabular-nums ${isActive ? 'text-amber-400' : 'text-white/70'}`}>
                        {p.bpm}
                      </span>
                      <span className={`text-[8px] mt-0.5 ${isActive ? 'text-amber-500/60' : 'text-[#374151]'}`}>
                        {p.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── BPM slider with +/- ── */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBpm(store.bpm - 1)}
                className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#6b7280] hover:text-white hover:bg-white/[0.06] flex items-center justify-center cursor-pointer transition-colors text-lg font-light"
              >
                -
              </button>
              <div className="flex-1 relative h-8 flex items-center">
                <div className="absolute inset-x-0 h-1 rounded-full bg-white/[0.04]" />
                <div
                  className="absolute left-0 h-1 rounded-full"
                  style={{
                    width: `${((store.bpm - 30) / 270) * 100}%`,
                    background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                    opacity: 0.6,
                  }}
                />
                <input
                  type="range" min={30} max={300} value={store.bpm}
                  onChange={e => handleBpm(Number(e.target.value))}
                  className="absolute inset-x-0 w-full h-8 opacity-0 cursor-pointer"
                />
                {/* Custom thumb */}
                <div
                  className="absolute w-4 h-4 rounded-full border-2 border-amber-500 bg-[#0a0c13] pointer-events-none shadow-lg shadow-amber-500/20"
                  style={{ left: `calc(${((store.bpm - 30) / 270) * 100}% - 8px)` }}
                />
              </div>
              <button
                onClick={() => handleBpm(store.bpm + 1)}
                className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#6b7280] hover:text-white hover:bg-white/[0.06] flex items-center justify-center cursor-pointer transition-colors text-lg font-light"
              >
                +
              </button>
            </div>

            {/* ── Time sig + Accent + Tap ── */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1">
                {TIME_SIGS.map(([b, v]) => (
                  <button
                    key={`${b}/${v}`}
                    onClick={() => handleTimeSig(b, v)}
                    className={`text-[10px] px-2 py-1.5 rounded-lg border font-mono cursor-pointer transition-colors ${
                      store.beatsPerMeasure === b && store.beatValue === v
                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                        : 'border-white/[0.04] text-[#374151] hover:text-[#6b7280]'
                    }`}
                  >
                    {b}/{v}
                  </button>
                ))}
              </div>
              <button
                onClick={() => store.setAccentFirst(!store.accentFirst)}
                className={`text-[9px] px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors font-bold tracking-wide ${
                  store.accentFirst ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' : 'border-white/[0.04] text-[#374151] hover:text-[#6b7280]'
                }`}
              >
                ACC
              </button>
              <button
                onClick={handleTap}
                className="text-[9px] px-2.5 py-1.5 rounded-lg border border-white/[0.04] text-[#4b5563] hover:text-amber-400 hover:border-amber-500/20 cursor-pointer transition-colors font-bold tracking-wide active:bg-amber-500/10 active:text-amber-400"
              >
                TAP
              </button>
            </div>

            {/* ── Volume ── */}
            <div className="flex items-center gap-3">
              <svg className="w-3.5 h-3.5 text-[#374151] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <div className="flex-1 relative h-6 flex items-center">
                <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/[0.04]" />
                <div
                  className="absolute left-0 h-[3px] rounded-full bg-white/10"
                  style={{ width: `${store.volume * 100}%` }}
                />
                <input
                  type="range" min={0} max={1} step={0.05} value={store.volume}
                  onChange={e => handleVolume(Number(e.target.value))}
                  className="absolute inset-x-0 w-full h-6 opacity-0 cursor-pointer"
                />
                <div
                  className="absolute w-3 h-3 rounded-full bg-[#94a3b8] border border-white/20 pointer-events-none"
                  style={{ left: `calc(${store.volume * 100}% - 6px)` }}
                />
              </div>
              <span className="text-[10px] text-[#374151] font-mono w-6 text-right tabular-nums">{Math.round(store.volume * 100)}</span>
            </div>

            {/* ── Play / Stop button ── */}
            <button
              onClick={toggle}
              className="w-full cursor-pointer transition-all group"
              style={{
                padding: '14px 0',
                borderRadius: 18,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '1px',
                background: playing
                  ? 'rgba(255,255,255,0.03)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                border: playing ? '1px solid rgba(255,255,255,0.06)' : 'none',
                color: playing ? '#6b7280' : '#fff',
                boxShadow: playing ? 'none' : '0 8px 32px -8px rgba(245,158,11,0.4)',
              }}
            >
              {playing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="currentColor">
                    <rect x="1" y="1" width="10" height="10" rx="1.5" />
                  </svg>
                  STOP
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M3 1.5l7.5 4.5L3 10.5V1.5z" />
                  </svg>
                  START
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
