import { useState, useRef, useCallback, useEffect } from 'react'

// ── Audio ────────────────────────────────────────────────────────────────────

const audioCtxRef = { current: null as AudioContext | null }
function getAudioCtx() {
  if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
  return audioCtxRef.current
}

// Soft metronome click
function playClick(time: number, accent: boolean) {
  const ctx = getAudioCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(accent ? 1200 : 900, time)
  osc.frequency.exponentialRampToValueAtTime(accent ? 600 : 450, time + 0.02)
  filter.type = 'bandpass'
  filter.frequency.value = 1000
  filter.Q.value = 2
  gain.gain.setValueAtTime(accent ? 0.12 : 0.07, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.08)
}

// Warm sustained tone for demonstrating note durations.
// Uses layered sine + triangle with a gentle attack/release for a soft,
// controllable "electric piano" sound that sustains evenly and cuts cleanly.
function playDemoTone(startTime: number, duration: number, freq: number = 523.25) {
  const ctx = getAudioCtx()
  const endTime = startTime + duration
  const fadeIn = 0.03
  const fadeOut = Math.min(0.12, duration * 0.15)

  // Layer 1: fundamental (sine — warm body)
  const osc1 = ctx.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.value = freq

  // Layer 2: octave above, quiet (adds brightness)
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.value = freq * 2

  // Layer 3: soft triangle for presence
  const osc3 = ctx.createOscillator()
  osc3.type = 'triangle'
  osc3.frequency.value = freq

  const mix1 = ctx.createGain()
  const mix2 = ctx.createGain()
  const mix3 = ctx.createGain()
  mix1.gain.value = 0.18
  mix2.gain.value = 0.04
  mix3.gain.value = 0.06

  const master = ctx.createGain()
  // Envelope: fade in → sustain → fade out
  master.gain.setValueAtTime(0.001, startTime)
  master.gain.exponentialRampToValueAtTime(1, startTime + fadeIn)
  master.gain.setValueAtTime(1, endTime - fadeOut)
  master.gain.exponentialRampToValueAtTime(0.001, endTime)

  osc1.connect(mix1).connect(master)
  osc2.connect(mix2).connect(master)
  osc3.connect(mix3).connect(master)
  master.connect(ctx.destination)

  osc1.start(startTime); osc1.stop(endTime + 0.01)
  osc2.start(startTime); osc2.stop(endTime + 0.01)
  osc3.start(startTime); osc3.stop(endTime + 0.01)
}

// ── Data ─────────────────────────────────────────────────────────────────────

interface NoteValue {
  name: string
  symbol: string
  beats: number
  subdivisions: number
  counting: string
  description: string
  color: string
}

const NOTE_VALUES: NoteValue[] = [
  {
    name: 'Whole Note',
    symbol: '𝅝',
    beats: 4,
    subdivisions: 1,
    counting: '1 — 2 — 3 — 4 —',
    description: 'Held for 4 full beats. An open oval with no stem. The longest common note value.',
    color: '#a78bfa',
  },
  {
    name: 'Dotted Half Note',
    symbol: '𝅗𝅥.',
    beats: 3,
    subdivisions: 1,
    counting: '1 — 2 — 3 —',
    description: 'A half note with a dot adds half its value (2 + 1 = 3 beats). Common in 3/4 time.',
    color: '#8b5cf6',
  },
  {
    name: 'Half Note',
    symbol: '𝅗𝅥',
    beats: 2,
    subdivisions: 2,
    counting: '1 — 2 —',
    description: 'Held for 2 beats. An open oval with a stem. Two half notes fill one measure of 4/4.',
    color: '#7c3aed',
  },
  {
    name: 'Quarter Note',
    symbol: '𝅘𝅥',
    beats: 1,
    subdivisions: 4,
    counting: '1',
    description: 'Held for 1 beat. A filled oval with a stem. The basic "pulse" note in most music.',
    color: '#6d28d9',
  },
  {
    name: 'Eighth Note',
    symbol: '𝅘𝅥𝅮',
    beats: 0.5,
    subdivisions: 8,
    counting: '1 &',
    description: 'Half a beat. A filled oval with a stem and one flag. Counted "1 and 2 and..."',
    color: '#5b21b6',
  },
  {
    name: 'Sixteenth Note',
    symbol: '𝅘𝅥𝅯',
    beats: 0.25,
    subdivisions: 16,
    counting: '1 e & a',
    description: 'Quarter of a beat. Two flags on the stem. Counted "1-e-and-a 2-e-and-a..."',
    color: '#4c1d95',
  },
]

const REST_VALUES = [
  { name: 'Whole Rest', symbol: '𝄻', beats: 4, description: 'Hangs below the 4th line — think "hole in the ground." Silence for a full measure.' },
  { name: 'Half Rest', symbol: '𝄼', beats: 2, description: 'Sits on the 3rd line — think "hat on a head." Silence for 2 beats.' },
  { name: 'Quarter Rest', symbol: '𝄽', beats: 1, description: 'A zigzag shape. Silence for 1 beat.' },
  { name: 'Eighth Rest', symbol: '𝄾', beats: 0.5, description: 'Looks like a small "7". Silence for half a beat.' },
]

const BPM = 90
const TOTAL_BEATS = 4
const SUBS = 16 // 16 subdivision cells per measure (4 per beat)

// ── Component ────────────────────────────────────────────────────────────────

type Tab = 'notes' | 'rests'

export default function NoteValuesChart() {
  const [selected, setSelected] = useState<NoteValue | null>(null)
  const [tab, setTab] = useState<Tab>('notes')
  const [playingName, setPlayingName] = useState<string | null>(null)
  const [activeSub, setActiveSub] = useState<number>(-1) // 0-15 active subdivision during playback
  const animFrameRef = useRef<number>(0)
  const playStartRef = useRef<number>(0)

  // Clean up on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [])

  const handlePlay = useCallback((nv: NoteValue) => {
    if (playingName) return // already playing

    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()

    const beatDur = 60 / BPM
    const totalDur = TOTAL_BEATS * beatDur
    const subDur = beatDur / 4 // duration per subdivision cell
    const noteDur = nv.beats * beatDur // actual note duration in seconds

    setPlayingName(nv.name)
    setActiveSub(0)

    // Play warm sustained tone for the exact note duration
    const startTime = ctx.currentTime
    playDemoTone(startTime, noteDur)

    // Schedule metronome clicks on each beat
    for (let beat = 0; beat < TOTAL_BEATS; beat++) {
      playClick(startTime + beat * beatDur, beat === 0)
    }

    // Animate subdivisions
    playStartRef.current = performance.now()
    const totalMs = totalDur * 1000

    function tick() {
      const elapsed = performance.now() - playStartRef.current
      if (elapsed >= totalMs) {
        setPlayingName(null)
        setActiveSub(-1)
        return
      }
      const currentSub = Math.floor(elapsed / (subDur * 1000))
      setActiveSub(Math.min(currentSub, SUBS - 1))
      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
  }, [playingName])

  const themeAccent = '#a78bfa'

  return (
    <div className="my-6 rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: '#0d1117' }}>
      <div className="px-5 pt-4 pb-2 flex items-center justify-between flex-wrap gap-2">
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: themeAccent }}>
          Note & Rest Values
        </span>
        <div className="flex gap-1">
          {(['notes', 'rests'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              style={{
                background: tab === t ? `${themeAccent}20` : 'transparent',
                color: tab === t ? themeAccent : '#6b7280',
                border: tab === t ? `1px solid ${themeAccent}40` : '1px solid transparent',
              }}
            >
              {t === 'notes' ? 'Notes' : 'Rests'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'notes' && (
        <div className="px-5 pb-4">
          {/* Note rows */}
          <div className="space-y-2 mb-2">
            {NOTE_VALUES.map((nv) => {
              const isActive = selected?.name === nv.name
              const isPlaying = playingName === nv.name
              const noteCells = Math.round(nv.beats * 4)

              return (
                <div
                  key={nv.name}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: isActive ? `${nv.color}15` : 'transparent',
                    border: `1px solid ${isActive ? `${nv.color}40` : 'transparent'}`,
                  }}
                  onClick={() => setSelected(isActive ? null : nv)}
                >
                  {/* Symbol */}
                  <span className="text-2xl w-8 text-center flex-shrink-0" style={{ color: nv.color }}>
                    {nv.symbol}
                  </span>

                  {/* Name + beats */}
                  <div className="w-28 flex-shrink-0">
                    <div className="text-sm font-medium text-white">{nv.name}</div>
                    <div className="text-[11px] text-[#6b7280]">
                      {nv.beats >= 1 ? `${nv.beats} beat${nv.beats > 1 ? 's' : ''}` : `${nv.beats} beat`}
                    </div>
                  </div>

                  {/* Duration bar — 16 subdivisions */}
                  <div className="flex-1 flex gap-px">
                    {Array.from({ length: SUBS }).map((_, i) => {
                      const inNote = i < noteCells
                      const isCursor = isPlaying && i === activeSub
                      const isPast = isPlaying && i < activeSub && inNote
                      const isFuture = isPlaying && i > activeSub && inNote

                      let bg = '#1e2433'
                      if (inNote) {
                        if (isPlaying) {
                          if (isCursor) bg = nv.color
                          else if (isPast) bg = `${nv.color}90`
                          else if (isFuture) bg = `${nv.color}35`
                        } else {
                          bg = `${nv.color}50`
                        }
                      }

                      return (
                        <div
                          key={i}
                          className="h-6 rounded-sm flex-1 transition-colors duration-75"
                          style={{
                            background: bg,
                            boxShadow: isCursor ? `0 0 8px ${nv.color}80` : 'none',
                          }}
                        />
                      )
                    })}
                  </div>

                  {/* Play button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlay(nv) }}
                    disabled={playingName !== null}
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer disabled:opacity-40"
                    style={{
                      background: isPlaying ? `${nv.color}25` : '#1e2433',
                      border: `1px solid ${isPlaying ? nv.color : '#374151'}`,
                    }}
                    title={`Play ${nv.name}`}
                  >
                    <svg className="w-3.5 h-3.5" fill={isPlaying ? nv.color : '#94a3b8'} viewBox="0 0 16 16">
                      <path d="M4 2l10 6-10 6V2z" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Beat ruler — aligned with the duration bar */}
          <div className="flex items-center gap-3 px-3">
            {/* Spacer matching symbol + name columns */}
            <div className="w-8 flex-shrink-0" />
            <div className="w-28 flex-shrink-0" />
            {/* 16 cells grouped into 4 beats */}
            <div className="flex-1 flex gap-px">
              {Array.from({ length: SUBS }).map((_, i) => {
                const isBeatStart = i % 4 === 0
                const beatNum = Math.floor(i / 4) + 1
                const isCursor = playingName !== null && i === activeSub

                return (
                  <div key={i} className="flex-1 text-center">
                    {isBeatStart && (
                      <div
                        className="text-[10px] font-mono transition-colors duration-75"
                        style={{
                          color: isCursor ? '#e2e8f0' : '#4b5563',
                          fontWeight: isCursor ? 700 : 400,
                        }}
                      >
                        {beatNum}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Spacer matching play button */}
            <div className="w-8 flex-shrink-0" />
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="mt-3 px-4 py-3 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg" style={{ color: selected.color }}>{selected.symbol}</span>
                <span className="text-sm font-semibold text-white">{selected.name}</span>
                <span className="ml-auto text-xs font-mono" style={{ color: selected.color }}>{selected.counting}</span>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">{selected.description}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'rests' && (
        <div className="px-5 pb-4 space-y-2">
          {REST_VALUES.map((r) => (
            <div key={r.name} className="flex items-start gap-4 px-3 py-3 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
              <span className="text-3xl w-8 text-center flex-shrink-0" style={{ color: themeAccent }}>{r.symbol}</span>
              <div>
                <div className="text-sm font-medium text-white">
                  {r.name}
                  <span className="text-[#6b7280] font-normal ml-2">
                    {r.beats >= 1 ? `${r.beats} beat${r.beats > 1 ? 's' : ''} of silence` : `${r.beats} beat of silence`}
                  </span>
                </div>
                <p className="text-xs text-[#6b7280] leading-relaxed mt-0.5">{r.description}</p>
              </div>
            </div>
          ))}

          <div className="px-3 py-2.5 rounded-xl border border-violet-500/10" style={{ background: '#161b22' }}>
            <p className="text-xs text-[#94a3b8]">
              <span className="font-medium text-white">Tip:</span> Rests are just as important as notes! Count through rests the same way you count through notes — never rush past silence.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
