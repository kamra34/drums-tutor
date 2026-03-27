import React, { useState, useEffect, useRef, useCallback } from 'react'
import { PatternData, HitValue } from '@drums/types/curriculum'
import { DrumPad } from '@drums/types/midi'
import { playPattern, stopPatternPlayback } from '@drums/services/drumSounds'
import {
  Renderer, Stave, StaveNote, Voice, Formatter, Beam,
  GhostNote, Articulation, RenderContext,
} from 'vexflow'

// ═══════════════════════════════════════════════════════════════════════════
//  STAFF NOTATION DISPLAY v5 — VexFlow notation + custom grid
// ═══════════════════════════════════════════════════════════════════════════

// ── Drum pad → VexFlow key mapping ─────────────────────────────────────────
// VexFlow drum notation uses specific keys for staff positions

interface DrumVoiceNote {
  keys: string[]
  duration: string
  stemDirection: number // 1=up, -1=down
  type: 'note' | 'ghost' | 'rest'
  isAccent: boolean
  noteType?: string
}

// Maps drum pads to VexFlow keys (staff position) and voice (up=cymbal, down=drum)
// Cymbal pads (stem-up voice)
const CYM = new Set<string>([DrumPad.HiHatClosed, DrumPad.HiHatOpen, DrumPad.HiHatPedal, DrumPad.CrashCymbal, DrumPad.RideCymbal, DrumPad.RideBell])

const PAD_TO_VEX: Partial<Record<DrumPad, { key: string; voice: 'up' | 'down'; noteHead?: string }>> = {
  [DrumPad.CrashCymbal]: { key: 'a/5', voice: 'up', noteHead: 'x2' },
  [DrumPad.HiHatClosed]: { key: 'g/5', voice: 'up', noteHead: 'x2' },
  [DrumPad.HiHatOpen]:   { key: 'g/5', voice: 'up', noteHead: 'x2' },
  [DrumPad.RideCymbal]:  { key: 'f/5', voice: 'up', noteHead: 'x2' },
  [DrumPad.RideBell]:    { key: 'f/5', voice: 'up', noteHead: 'x2' },
  [DrumPad.Tom1]:        { key: 'e/5', voice: 'down' },
  [DrumPad.Tom2]:        { key: 'd/5', voice: 'down' },
  [DrumPad.Snare]:       { key: 'c/5', voice: 'down' },
  [DrumPad.SnareRim]:    { key: 'c/5', voice: 'down', noteHead: 'x2' },
  [DrumPad.FloorTom]:    { key: 'a/4', voice: 'down' },
  [DrumPad.Kick]:        { key: 'f/4', voice: 'down' },
  [DrumPad.HiHatPedal]:  { key: 'e/4', voice: 'down', noteHead: 'x2' },
}

// ── Build VexFlow notes from pattern data ──────────────────────────────────

function patternToVexNotes(pattern: PatternData): { upNotes: (StaveNote | GhostNote)[]; downNotes: (StaveNote | GhostNote)[]; upBeamGroups: (StaveNote | GhostNote)[][]; downBeamGroups: (StaveNote | GhostNote)[][] } {
  const { beats, subdivisions, tracks } = pattern
  const totalSlots = beats * subdivisions

  // Base duration from subdivision
  const subDur = subdivisions >= 4 ? '16' : subdivisions >= 2 ? '8' : 'q'

  // Pre-scan: check if each voice has any off-beat hits
  // If a voice ONLY hits on beat boundaries, it can use quarter notes
  function voiceHasOffBeats(voice: 'up' | 'down'): boolean {
    for (let slot = 0; slot < totalSlots; slot++) {
      if (slot % subdivisions === 0) continue // on-beat, skip
      for (const [pad, vals] of Object.entries(tracks) as [DrumPad, HitValue[]][]) {
        const mapping = PAD_TO_VEX[pad]
        if (!mapping || mapping.voice !== voice) continue
        if ((vals[slot] ?? 0) > 0) return true
      }
    }
    return false
  }

  const upHasOffBeats = voiceHasOffBeats('up')
  const downHasOffBeats = voiceHasOffBeats('down')

  // Duration for each voice: use quarter notes if all hits are on beats
  const upDur = upHasOffBeats ? subDur : 'q'
  const downDur = downHasOffBeats ? subDur : 'q'

  // Step size: how many slots per note for each voice
  const upStep = upHasOffBeats ? 1 : subdivisions
  const downStep = downHasOffBeats ? 1 : subdivisions

  const upNotes: (StaveNote | GhostNote)[] = []
  const downNotes: (StaveNote | GhostNote)[] = []
  const upBeamGroups: (StaveNote | GhostNote)[][] = []
  const downBeamGroups: (StaveNote | GhostNote)[][] = []

  // Pre-compute: does slot have a hit in a given voice?
  function slotHasHit(slot: number, voice: 'up' | 'down'): boolean {
    for (const [pad, vals] of Object.entries(tracks) as [DrumPad, HitValue[]][]) {
      const mapping = PAD_TO_VEX[pad]
      if (!mapping || mapping.voice !== voice) continue
      if ((vals[slot] ?? 0) > 0) return true
    }
    return false
  }

  // Check if ANY voice has a hit at this slot
  function slotHasAnyHit(slot: number): boolean {
    return slotHasHit(slot, 'up') || slotHasHit(slot, 'down')
  }

  // Build notes for a voice
  // showRests: if true, empty slots where the OTHER voice is also empty get a visible rest
  function buildVoice(
    voice: 'up' | 'down', dur: string, step: number,
    notes: (StaveNote | GhostNote)[], beamGroups: (StaveNote | GhostNote)[][],
    stemDir: number, showRests: boolean,
  ) {
    const otherVoice = voice === 'up' ? 'down' : 'up'
    let currentGroup: (StaveNote | GhostNote)[] = []

    for (let slot = 0; slot < totalSlots; slot += step) {
      const keys: string[] = []
      const noteHeads: Record<number, string> = {}
      let accent = false
      let ghost = false

      for (const [pad, vals] of Object.entries(tracks) as [DrumPad, HitValue[]][]) {
        const mapping = PAD_TO_VEX[pad]
        if (!mapping || mapping.voice !== voice) continue
        const hv = vals[slot] ?? 0
        if (hv === 0) continue

        const idx = keys.length
        const fullKey = mapping.noteHead ? `${mapping.key}/${mapping.noteHead}` : mapping.key
        keys.push(fullKey)
        if (mapping.noteHead) noteHeads[idx] = mapping.noteHead
        if (hv === 2) accent = true
        if (hv === 3) ghost = true
      }

      if (keys.length > 0) {
        const note = new StaveNote({
          keys, duration: dur, stemDirection: stemDir, clef: 'percussion',
        })
        for (const [idx] of Object.entries(noteHeads)) {
          note.setKeyStyle(Number(idx), { fillStyle: ghost ? '#999' : '#000' })
        }
        if (accent) {
          try { note.addModifier(new Articulation('a>').setPosition(stemDir === 1 ? 3 : 4)) } catch {}
        }
        notes.push(note)
        currentGroup.push(note)
      } else {
        // Empty slot: show a visible rest if this is the primary voice
        // and the other voice also has no note here
        const otherHasNote = slotHasHit(slot, otherVoice)
        if (showRests && !otherHasNote) {
          // Visible rest — VexFlow uses 'r' suffix on duration
          const rest = new StaveNote({
            keys: ['b/4'],
            duration: dur + 'r',
            stemDirection: stemDir,
            clef: 'percussion',
          })
          rest.setStyle({ fillStyle: '#4b5563', strokeStyle: '#4b5563' })
          notes.push(rest)
        } else {
          notes.push(new GhostNote({ duration: dur }))
        }
        if (currentGroup.length >= 2) beamGroups.push(currentGroup)
        currentGroup = []
      }

      // Break beam groups at beat boundaries
      const nextSlot = slot + step
      if (nextSlot % subdivisions === 0 || nextSlot >= totalSlots) {
        if (currentGroup.length >= 2) beamGroups.push(currentGroup)
        currentGroup = []
      }
    }

    if (currentGroup.length >= 2) beamGroups.push(currentGroup)
  }

  // Upper voice (cymbals) is primary — shows visible rests when both voices are silent
  // Lower voice (drums) uses ghost notes to avoid clutter
  buildVoice('up', upDur, upStep, upNotes, upBeamGroups, 1, true)
  buildVoice('down', downDur, downStep, downNotes, downBeamGroups, -1, false)

  return { upNotes, downNotes, upBeamGroups, downBeamGroups }
}

// ── VexFlow Notation Renderer ──────────────────────────────────────────────

function VexNotation({ pattern, width, beatsPerBar }: {
  pattern: PatternData; width: number; beatsPerBar?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const render = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''

    const { beats, subdivisions, tracks } = pattern
    const totalSlots = beats * subdivisions

    // Check which voice groups have content
    const hasCymbals = Object.entries(tracks).some(([pad, vals]) =>
      CYM.has(pad as DrumPad) && (vals as HitValue[]).some(v => v > 0)
    )
    const hasDrums = Object.entries(tracks).some(([pad, vals]) =>
      !CYM.has(pad as DrumPad) && (vals as HitValue[]).some(v => v > 0)
    )

    // Adaptive spacing: more slots → narrower per-slot width, with a minimum
    const minPerSlot = totalSlots <= 8 ? 55 : totalSlots <= 16 ? 40 : 30
    const staveWidth = Math.max(width - 50, totalSlots * minPerSlot)
    const staveY = 40
    const svgHeight = 200

    const renderer = new Renderer(container, Renderer.Backends.SVG)
    renderer.resize(staveWidth + 50, svgHeight)
    const context = renderer.getContext()

    // Create stave — show per-bar time signature, not total beats
    const displayTimeSigBeats = beatsPerBar ?? pattern.beats
    const stave = new Stave(15, staveY, staveWidth)
    stave.addClef('percussion')
    stave.addTimeSignature(`${displayTimeSigBeats}/4`)
    stave.setContext(context).draw()

    const { upNotes, downNotes, upBeamGroups, downBeamGroups } = patternToVexNotes(pattern)
    if (upNotes.length === 0 && downNotes.length === 0) return

    try {
      // Only create voices that have real content
      const voices: Voice[] = []

      if (hasCymbals) {
        const upVoice = new Voice({ numBeats: beats, beatValue: 4 }).setStrict(false)
        upVoice.addTickables(upNotes)
        voices.push(upVoice)
      }

      if (hasDrums) {
        const downVoice = new Voice({ numBeats: beats, beatValue: 4 }).setStrict(false)
        downVoice.addTickables(downNotes)
        voices.push(downVoice)
      }

      // Join each voice separately so VexFlow treats them as independent
      // layers on the same staff — this prevents stem/notehead collisions
      const formatter = new Formatter()
      for (const v of voices) {
        formatter.joinVoices([v])
      }
      formatter.format(voices, staveWidth - 80, { alignRests: false })

      voices.forEach(v => v.draw(context, stave))

      // Draw beams
      const allGroups = hasCymbals ? upBeamGroups : []
      const allGroups2 = hasDrums ? downBeamGroups : []
      for (const groups of [allGroups, allGroups2]) {
        for (const group of groups) {
          const beamable = group.filter((n): n is StaveNote => n instanceof StaveNote)
          if (beamable.length >= 2) {
            try { new Beam(beamable).setContext(context).draw() } catch {}
          }
        }
      }
    } catch (err) {
      console.warn('VexFlow render error:', err)
    }

    // Set viewBox so SVG scales to fit container without blowing up note size
    const svgEl = container.querySelector('svg')
    if (svgEl) {
      const internalW = staveWidth + 50
      const internalH = svgHeight
      // Scale modestly: 1.15 for simple patterns, 1.0 (no upscale) for dense ones
      const scale = totalSlots <= 8 ? 1.15 : 1.0
      const scaledW = Math.round(internalW * scale)
      const scaledH = Math.round(internalH * scale)
      svgEl.setAttribute('viewBox', `0 0 ${internalW} ${internalH}`)
      svgEl.setAttribute('width', String(scaledW))
      svgEl.setAttribute('height', String(scaledH))
      svgEl.style.display = 'block'
    }
  }, [pattern, width])

  useEffect(() => { render() }, [render])

  return (
    <div ref={containerRef} className="overflow-x-auto" style={{ minHeight: 210 }} />
  )
}

// ── Grid View (improved, PULSE-themed) ─────────────────────────────────────

const GRID_PAD_ORDER: DrumPad[] = [
  DrumPad.CrashCymbal, DrumPad.RideCymbal, DrumPad.HiHatOpen, DrumPad.HiHatClosed,
  DrumPad.Tom1, DrumPad.Tom2, DrumPad.Snare, DrumPad.FloorTom, DrumPad.Kick, DrumPad.HiHatPedal,
]

const GRID_PAD_LABEL: Partial<Record<DrumPad, string>> = {
  [DrumPad.HiHatClosed]: 'HH', [DrumPad.HiHatOpen]: 'HH ○', [DrumPad.Snare]: 'Snare',
  [DrumPad.Kick]: 'Kick', [DrumPad.Tom1]: 'Tom 1', [DrumPad.Tom2]: 'Tom 2',
  [DrumPad.FloorTom]: 'Floor', [DrumPad.CrashCymbal]: 'Crash', [DrumPad.RideCymbal]: 'Ride',
  [DrumPad.HiHatPedal]: 'HH Ped',
}

// Color groups for instruments
const GRID_PAD_COLOR: Partial<Record<DrumPad, string>> = {
  [DrumPad.CrashCymbal]: '#3b82f6', // blue
  [DrumPad.RideCymbal]:  '#3b82f6',
  [DrumPad.HiHatOpen]:   '#06b6d4', // cyan
  [DrumPad.HiHatClosed]: '#06b6d4',
  [DrumPad.Tom1]:        '#10b981', // green
  [DrumPad.Tom2]:        '#10b981',
  [DrumPad.Snare]:       '#f59e0b', // amber
  [DrumPad.FloorTom]:    '#10b981',
  [DrumPad.Kick]:        '#ef4444', // red
  [DrumPad.HiHatPedal]:  '#06b6d4',
}

const ROW_H = 28
const LABEL_W = 60

function GridView({ pattern, highlightSlot = -1 }: {
  pattern: PatternData; highlightSlot?: number
}) {
  const { beats, subdivisions, tracks } = pattern
  const totalSlots = beats * subdivisions
  const activePads = GRID_PAD_ORDER.filter(p => tracks[p]?.some(v => v > 0))

  return (
    <div className="w-full">
      {/* Beat numbers */}
      <div className="flex" style={{ paddingLeft: LABEL_W }}>
        {Array.from({ length: beats }).map((_, b) => (
          <div key={b} className="text-center text-xs text-[#4b5a6a] font-medium" style={{ flex: subdivisions }}>
            {b + 1}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      {activePads.map((pad) => {
        const steps = tracks[pad] ?? []
        const color = GRID_PAD_COLOR[pad] ?? '#6b7280'

        return (
          <div key={pad} className="flex items-center" style={{ height: ROW_H }}>
            {/* Label */}
            <div className="text-[11px] font-medium text-right pr-3 flex-shrink-0" style={{ width: LABEL_W, color }}>
              {GRID_PAD_LABEL[pad] ?? pad}
            </div>

            {/* Cells — fluid, each cell grows equally */}
            <div className="flex gap-[2px] flex-1 min-w-0">
              {Array.from({ length: totalSlots }).map((_, si) => {
                const hv = (steps[si] ?? 0) as number
                const isHl = highlightSlot === si
                const isBeatStart = si % subdivisions === 0

                let bg = 'rgba(255,255,255,0.02)'
                if (hv === 1) bg = color
                else if (hv === 2) bg = color
                else if (hv === 3) bg = color

                const opacity = hv === 0 ? 1 : hv === 3 ? 0.3 : hv === 2 ? 1 : 0.7

                return (
                  <div
                    key={si}
                    className="rounded-[3px] transition-all duration-75 flex-1"
                    style={{
                      height: ROW_H - 4,
                      background: hv > 0 ? bg : isHl ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
                      opacity: hv > 0 ? opacity : 1,
                      borderLeft: isBeatStart && si > 0 ? '2px solid rgba(255,255,255,0.04)' : undefined,
                      boxShadow: isHl && hv > 0 ? `0 0 8px ${color}40` : hv === 2 ? `0 0 6px ${color}30` : 'none',
                      outline: isHl ? '1.5px solid rgba(245,158,11,0.3)' : 'none',
                    }}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Play controls (PULSE theme) ─────────────────────────────────────────────

function PlayBar({ playing, bpm, loops, onToggle, onBpmChange, onLoopsChange }: {
  playing: boolean; bpm: number; loops: number
  onToggle: () => void; onBpmChange: (b: number) => void; onLoopsChange: (l: number) => void
}) {
  return <div className="flex items-center gap-4 flex-wrap">
    <button onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
        playing
          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/15'
          : 'text-white hover:brightness-110'
      }`}
      style={playing ? undefined : { background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
      {playing ? '■  Stop' : '▶  Listen'}
    </button>
    <div className="flex items-center gap-2 text-xs">
      <button onClick={() => onBpmChange(Math.max(40, bpm - 5))} className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer transition-colors">−</button>
      <span className="font-mono text-white w-8 text-center">{bpm}</span>
      <button onClick={() => onBpmChange(Math.min(200, bpm + 5))} className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer transition-colors">+</button>
      <span className="text-[#4b5a6a]">BPM</span>
    </div>
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-[#4b5a6a]">Repeat:</span>
      {[1, 2, 4, 8].map(n =>
        <button key={n} onClick={() => onLoopsChange(n)}
          className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${loops === n ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-white/[0.04] border border-white/[0.06] text-[#4b5a6a] hover:text-white'}`}>
          {n}×
        </button>
      )}
      <button onClick={() => onLoopsChange(0)}
        className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${loops === 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-white/[0.04] border border-white/[0.06] text-[#4b5a6a] hover:text-white'}`}>
        ∞
      </button>
    </div>
  </div>
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return <div className="flex gap-4 text-[10px] text-[#4b5a6a] flex-wrap items-center">
    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#06b6d4] inline-block opacity-70" /> Cymbals</span>
    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#f59e0b] inline-block opacity-70" /> Snare</span>
    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#10b981] inline-block opacity-70" /> Toms</span>
    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#ef4444] inline-block opacity-70" /> Kick</span>
    <span className="text-[#2d3748]">|</span>
    <span className="text-[#6b7280]">Bright = normal</span>
    <span className="text-[#4b5563]">Dim = ghost</span>
    <span className="text-[#fbbf24]">Glow = accent</span>
  </div>
}

// ── Main component ──────────────────────────────────────────────────────────

interface Props {
  pattern: PatternData
  currentStep?: number
  bpm?: number
  bars?: number
  /** Beats per bar for time signature display (e.g. 4 for 4/4). If omitted, uses pattern.beats */
  beatsPerBar?: number
  /** Optional slot rendered above notation in both normal and fullscreen views */
  metronomeSlot?: React.ReactNode
  /** Called when BPM changes via PlayBar controls */
  onBpmChange?: (bpm: number) => void
}

export default function StaffNotationDisplay({ pattern, currentStep, bpm = 90, bars = 1, beatsPerBar, metronomeSlot, onBpmChange }: Props) {
  const [localBpm, setLocalBpm] = useState(bpm)
  const [loops, setLoops] = useState(bars)
  const [playing, setPlaying] = useState(false)
  const [demoSlot, setDemoSlot] = useState(-1)
  const [demoLoop, setDemoLoop] = useState(0)
  const [containerWidth, setContainerWidth] = useState(800)
  const [fullscreen, setFullscreen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const prevSlotRef = useRef(-1)

  // Sync localBpm when parent bpm prop changes
  useEffect(() => { setLocalBpm(bpm) }, [bpm])

  function handleBpmChange(newBpm: number) {
    setLocalBpm(newBpm)
    onBpmChange?.(newBpm)
  }

  // Measure container width
  useEffect(() => {
    if (!wrapperRef.current) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [])

  function toggle() {
    if (playing) { stopPatternPlayback(); setPlaying(false); setDemoSlot(-1); setDemoLoop(0); return }
    setPlaying(true); setDemoLoop(0); setDemoSlot(0)
    const effectiveLoops = loops === 0 ? 99 : loops
    playPattern(pattern, localBpm, effectiveLoops,
      (s) => setDemoSlot(s),
      () => { setPlaying(false); setDemoSlot(-1); setDemoLoop(0) }
    )
  }

  useEffect(() => {
    if (playing && demoSlot === 0 && prevSlotRef.current > 0) setDemoLoop(l => l + 1)
    prevSlotRef.current = demoSlot
  }, [demoSlot, playing])

  useEffect(() => () => { stopPatternPlayback() }, [])

  const activeSlot = currentStep !== undefined ? currentStep : playing ? demoSlot : -1

  // Shared content for both normal and fullscreen
  const notationContent = (isFullscreen: boolean) => (
    <>
      {/* Metronome (visible in both normal and fullscreen) */}
      {metronomeSlot}

      {/* Controls + Fullscreen button row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PlayBar playing={playing} bpm={localBpm} loops={loops} onToggle={toggle} onBpmChange={handleBpmChange} onLoopsChange={setLoops} />
        {!isFullscreen && (
          <button
            onClick={() => setFullscreen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.08]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Fullscreen
          </button>
        )}
      </div>

      {/* Notation (VexFlow) — white background like real sheet music */}
      <div className="rounded-2xl overflow-hidden border border-[#e0e0e0]" style={{ background: '#ffffff' }}>
        <div className="px-4 py-2 border-b border-[#e8e8e8]" style={{ background: '#f8f8f8' }}>
          <span className="text-[10px] font-semibold text-[#888] uppercase tracking-widest">Notation</span>
        </div>
        <VexNotation
          pattern={pattern}
          width={isFullscreen ? window.innerWidth - 80 : containerWidth - 16}
          beatsPerBar={beatsPerBar}
        />
      </div>

      {/* Grid view — dark, full width */}
      <div className="rounded-2xl border border-white/[0.04] p-4" style={{
        background: 'linear-gradient(135deg, rgba(6,8,13,0.95) 0%, rgba(8,10,16,0.98) 100%)',
      }}>
        <div className="mb-3">
          <span className="text-[10px] font-semibold text-[#3d4d5d] uppercase tracking-widest">Grid</span>
        </div>
        <GridView pattern={pattern} highlightSlot={activeSlot} />
      </div>

      {/* Legend */}
      <Legend />
    </>
  )

  return (
    <div ref={wrapperRef} className="space-y-4">
      {notationContent(false)}

      {/* Fullscreen modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-[#06080d]/95 backdrop-blur-md flex flex-col overflow-y-auto" onClick={() => { stopPatternPlayback(); setPlaying(false); setDemoSlot(-1); setFullscreen(false) }}>
          <div className="w-full px-8 py-6 space-y-4" onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <div className="flex justify-end">
              <button
                onClick={() => { stopPatternPlayback(); setPlaying(false); setDemoSlot(-1); setFullscreen(false) }}
                className="text-[#4b5a6a] hover:text-white transition-colors cursor-pointer p-2"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {notationContent(true)}
          </div>
        </div>
      )}
    </div>
  )
}
