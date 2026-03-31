import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { PatternData, HitValue } from '@drums/types/curriculum'
import { DrumPad } from '@drums/types/midi'
import { playPattern, playPatternFromSlot, stopPatternPlayback, pausePatternPlayback, resumePatternPlayback, isPatternPaused, ensureAudioReady } from '@drums/services/drumSounds'
import { patternToMusicXml } from '@drums/services/drumMusicXml'
import { subdivisionLabel, isDownbeat } from '@drums/utils/beatLabels'
import OsmdNotation, { type OsmdNotationHandle } from '@drums/components/OsmdNotation'
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

  // Per-beat: find minimum step size for a voice using GCD of hit positions
  function _gcd(a: number, b: number): number { return b === 0 ? a : _gcd(b, a % b) }

  function beatMinStepForVoice(beatStartSlot: number, voice: 'up' | 'down'): number {
    let hitGcd = 0
    for (let s = 1; s < subdivisions; s++) {
      const slot = beatStartSlot + s
      if (slot >= totalSlots) break
      for (const [pad, vals] of Object.entries(tracks) as [DrumPad, HitValue[]][]) {
        const mapping = PAD_TO_VEX[pad]
        if (!mapping || mapping.voice !== voice) continue
        if ((vals[slot] ?? 0) > 0) { hitGcd = hitGcd === 0 ? s : _gcd(hitGcd, s); break }
      }
    }
    return hitGcd === 0 ? subdivisions : hitGcd
  }

  function durForStep(step: number): string {
    if (step >= subdivisions) return 'q'
    if (step * 2 >= subdivisions) return '8'
    return subDur
  }

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

  // Build notes for a voice — per-beat adaptive resolution
  // Beats with only on-beat hits use quarter notes; beats with off-beat hits use subDur
  function buildVoice(
    voice: 'up' | 'down',
    notes: (StaveNote | GhostNote)[], beamGroups: (StaveNote | GhostNote)[][],
    stemDir: number, showRests: boolean,
  ) {
    const otherVoice = voice === 'up' ? 'down' : 'up'
    let currentGroup: (StaveNote | GhostNote)[] = []

    // Walk beat by beat, deciding resolution per beat via GCD
    for (let beatStart = 0; beatStart < totalSlots; beatStart += subdivisions) {
      const step = beatMinStepForVoice(beatStart, voice)
      const dur = durForStep(step)

      for (let slot = beatStart; slot < beatStart + subdivisions; slot += step) {
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
          const otherHasNote = slotHasHit(slot, otherVoice)
          if (showRests && !otherHasNote) {
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
      }

      // Break beam groups at beat boundaries
      if (currentGroup.length >= 2) beamGroups.push(currentGroup)
      currentGroup = []
    }

    if (currentGroup.length >= 2) beamGroups.push(currentGroup)
  }

  // Upper voice (cymbals) is primary — shows visible rests when both voices are silent
  // Lower voice (drums) uses ghost notes to avoid clutter
  buildVoice('up', upNotes, upBeamGroups, 1, true)
  buildVoice('down', downNotes, downBeamGroups, -1, false)

  return { upNotes, downNotes, upBeamGroups, downBeamGroups }
}

// ── VexFlow Notation Renderer (multi-line, measure-by-measure) ───────────
//
// Renders drum notation like professional sheet music:
// - Multiple bars per line, wrapping to new lines
// - Connected staves with bar lines
// - Clef + time sig on first line only
// - Scaled down for clean, readable proportions

const VEX_SCALE = 0.75  // scale factor for cleaner, smaller notation
const LINE_H = 90       // vertical space per staff line (in VexFlow coords)
const STAVE_Y_OFFSET = 15

function VexNotation({ pattern, width, beatsPerBar }: {
  pattern: PatternData; width: number; beatsPerBar?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const render = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''

    const { beats, subdivisions, tracks } = pattern
    const bpb = beatsPerBar ?? beats
    const slotsPerBar = bpb * subdivisions
    const totalSlots = beats * subdivisions
    const numBars = Math.ceil(totalSlots / slotsPerBar)

    // How many bars fit per line at this scale?
    // Work in VexFlow internal coordinates (before scale)
    const internalWidth = width / VEX_SCALE
    const clefSpace = 70 // clef + time sig
    const margin = 20

    // Target ~200px internal per bar for eighths, ~280px for sixteenths
    const idealBarW = slotsPerBar >= 16 ? 280 : slotsPerBar >= 8 ? 200 : 160
    const maxBarsPerLine = Math.max(1, Math.floor((internalWidth - margin * 2) / idealBarW))
    const barsPerLine = Math.min(maxBarsPerLine, numBars)
    const numLines = Math.ceil(numBars / barsPerLine)

    // Internal SVG dimensions (before scale)
    const internalH = STAVE_Y_OFFSET + numLines * LINE_H + 30

    const renderer = new Renderer(container, Renderer.Backends.SVG)
    renderer.resize(internalWidth, internalH)
    const context = renderer.getContext()
    context.scale(1, 1) // we'll apply scale via SVG viewBox

    // Split tracks into per-bar slices
    function barSlice(barIdx: number): PatternData {
      const start = barIdx * slotsPerBar
      const end = Math.min(start + slotsPerBar, totalSlots)
      const barTracks: Partial<Record<DrumPad, HitValue[]>> = {}
      for (const [pad, vals] of Object.entries(tracks) as [DrumPad, HitValue[]][]) {
        barTracks[pad] = (vals as HitValue[]).slice(start, end)
        while (barTracks[pad]!.length < slotsPerBar) barTracks[pad]!.push(0 as HitValue)
      }
      return { beats: bpb, subdivisions, tracks: barTracks }
    }

    for (let line = 0; line < numLines; line++) {
      const firstBar = line * barsPerLine
      const lastBar = Math.min(firstBar + barsPerLine, numBars)
      const barsOnLine = lastBar - firstBar
      const y = STAVE_Y_OFFSET + line * LINE_H
      const isFirstLine = line === 0

      // First bar on each line may have clef
      const firstBarExtra = isFirstLine ? clefSpace : 0
      const lineUsable = internalWidth - margin * 2 - firstBarExtra
      const barW = Math.floor(lineUsable / barsOnLine)

      let xCursor = margin

      for (let b = 0; b < barsOnLine; b++) {
        const barIdx = firstBar + b
        const isFirst = b === 0
        const isLast = barIdx === numBars - 1
        const w = (isFirst ? firstBarExtra : 0) + barW

        const stave = new Stave(xCursor, y, w)

        if (isFirst && isFirstLine) {
          stave.addClef('percussion')
          stave.addTimeSignature(`${bpb}/4`)
        }

        if (isLast) {
          stave.setEndBarType(6) // final double bar
        }

        stave.setContext(context).draw()

        // Render notes — give formatter slightly less than stave width
        // to avoid notes bleeding past the bar line
        const noteSpace = w - (isFirst && isFirstLine ? clefSpace + 10 : 15)
        renderBarNotes(context, stave, barSlice(barIdx), bpb, Math.max(noteSpace, 50))

        xCursor += w
      }
    }

    // Apply scale via viewBox — this is the key to clean rendering
    // VexFlow draws at full size internally, we shrink via SVG scaling
    const svgEl = container.querySelector('svg')
    if (svgEl) {
      const displayW = Math.round(internalWidth * VEX_SCALE)
      const displayH = Math.round(internalH * VEX_SCALE)
      svgEl.setAttribute('viewBox', `0 0 ${internalWidth} ${internalH}`)
      svgEl.setAttribute('width', String(displayW))
      svgEl.setAttribute('height', String(displayH))
      svgEl.style.display = 'block'
    }
  }, [pattern, width, beatsPerBar])

  useEffect(() => { render() }, [render])

  return (
    <div ref={containerRef} className="overflow-x-auto" style={{ minHeight: 80 }} />
  )
}

/** Render notes for a single bar into a stave */
function renderBarNotes(
  context: RenderContext, stave: Stave, barPattern: PatternData,
  bpb: number, formatWidth: number,
) {
  const { tracks } = barPattern

  const hasCymbals = Object.entries(tracks).some(([pad, vals]) =>
    CYM.has(pad as DrumPad) && (vals as HitValue[]).some(v => v > 0)
  )
  const hasDrums = Object.entries(tracks).some(([pad, vals]) =>
    !CYM.has(pad as DrumPad) && (vals as HitValue[]).some(v => v > 0)
  )

  const { upNotes, downNotes, upBeamGroups, downBeamGroups } = patternToVexNotes(barPattern)
  if (upNotes.length === 0 && downNotes.length === 0) return

  try {
    const voices: Voice[] = []

    if (hasCymbals) {
      const v = new Voice({ numBeats: bpb, beatValue: 4 }).setStrict(false)
      v.addTickables(upNotes)
      voices.push(v)
    }
    if (hasDrums) {
      const v = new Voice({ numBeats: bpb, beatValue: 4 }).setStrict(false)
      v.addTickables(downNotes)
      voices.push(v)
    }

    const formatter = new Formatter()
    for (const v of voices) formatter.joinVoices([v])
    formatter.format(voices, Math.max(formatWidth, 50))
    voices.forEach(v => v.draw(context, stave))

    // Draw beams
    for (const groups of [hasCymbals ? upBeamGroups : [], hasDrums ? downBeamGroups : []]) {
      for (const group of groups) {
        const beamable = group.filter((n): n is StaveNote => n instanceof StaveNote)
        if (beamable.length >= 2) {
          try { new Beam(beamable).setContext(context).draw() } catch {}
        }
      }
    }
  } catch (err) {
    console.warn('VexFlow bar render error:', err)
  }
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

function GridView({ pattern, highlightSlot = -1, onSlotClick, barSubdivisions, beatsPerBar, barsPerLine = 4, focusBar, scale = 1 }: {
  pattern: PatternData; highlightSlot?: number; onSlotClick?: (slot: number) => void;
  barSubdivisions?: number[]; beatsPerBar?: number; barsPerLine?: number;
  /** If set, visually emphasize this bar index (0-based) */
  focusBar?: number;
  /** Scale factor for row height/font (1 = normal, >1 = enlarged) */
  scale?: number;
}) {
  const { beats, subdivisions, tracks } = pattern
  const totalSlots = beats * subdivisions
  const activePads = GRID_PAD_ORDER.filter(p => tracks[p]?.some(v => v > 0))

  const bpb = beatsPerBar ?? beats
  const numBars = Math.max(1, Math.ceil(beats / bpb))
  const slotsPerBar = bpb * subdivisions

  function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b) }

  function beatStep(beatStart: number): number {
    if (barSubdivisions && barSubdivisions.length > 0) {
      const barIdx = Math.floor(beatStart / slotsPerBar)
      const barSub = barSubdivisions[barIdx] ?? subdivisions
      return subdivisions / barSub
    }
    let hitGcd = 0
    for (let s = 1; s < subdivisions; s++) {
      const slot = beatStart + s
      if (slot >= totalSlots) break
      let hasHit = false
      for (const pad of activePads) {
        if (((tracks[pad]?.[slot]) ?? 0) > 0) { hasHit = true; break }
      }
      if (hasHit) hitGcd = hitGcd === 0 ? s : gcd(hitGcd, s)
    }
    return hitGcd === 0 ? subdivisions : hitGcd
  }

  // Build visibility map
  const slotVisible: boolean[] = new Array(totalSlots).fill(false)
  const slotSpan: number[] = new Array(totalSlots).fill(1)
  for (let beatStart = 0; beatStart < totalSlots; beatStart += subdivisions) {
    const step = beatStep(beatStart)
    for (let s = 0; s < subdivisions; s += step) {
      slotVisible[beatStart + s] = true
      slotSpan[beatStart + s] = step
    }
  }

  const visibleSlots = slotVisible.map((v, i) => v ? i : -1).filter(i => i >= 0)

  // Split bars into lines
  const effectiveBarsPerLine = Math.min(barsPerLine, numBars)
  const numLines = Math.ceil(numBars / effectiveBarsPerLine)
  const rowH = Math.round(ROW_H * scale)
  const labelW = Math.round(LABEL_W * scale)
  const fontSize = Math.round(11 * scale)

  function renderGridLine(lineIdx: number) {
    const startBar = lineIdx * effectiveBarsPerLine
    const endBar = Math.min(startBar + effectiveBarsPerLine, numBars)
    const startSlot = startBar * slotsPerBar
    const endSlot = Math.min(endBar * slotsPerBar, totalSlots)
    const lineSlots = visibleSlots.filter(si => si >= startSlot && si < endSlot)

    return (
      <div key={lineIdx} className={numLines > 1 ? 'mb-3' : ''}>
        {/* Bar numbers + beat labels */}
        <div className="flex" style={{ paddingLeft: labelW }}>
          {lineSlots.map(si => {
            const span = slotSpan[si]
            const barIdx = Math.floor(si / slotsPerBar)
            const isBarStart = si % slotsPerBar === 0
            const isFocused = focusBar !== undefined && barIdx === focusBar
            return (
              <div
                key={si}
                onClick={onSlotClick ? () => onSlotClick(si) : undefined}
                className={`text-center ${onSlotClick ? 'cursor-pointer hover:text-amber-400' : ''} ${
                  isBarStart ? 'text-[#4b5a6a] font-bold' : si % subdivisions === 0 ? 'text-[#4b5a6a] font-medium' : 'text-[#2d3748]'
                } ${isFocused ? 'text-amber-400/80' : ''}`}
                style={{ flex: span, fontSize: Math.round(10 * scale) }}
              >
                {isBarStart ? `${barIdx + 1}` : subdivisionLabel(si % slotsPerBar, subdivisions)}
              </div>
            )
          })}
        </div>

        {/* Grid rows */}
        {activePads.map((pad) => {
          const steps = tracks[pad] ?? []
          const color = GRID_PAD_COLOR[pad] ?? '#6b7280'
          return (
            <div key={pad} className="flex items-center" style={{ height: rowH }}>
              <div className="font-medium text-right pr-2 flex-shrink-0" style={{ width: labelW, color, fontSize }}>
                {GRID_PAD_LABEL[pad] ?? pad}
              </div>
              <div className="flex gap-[2px] flex-1 min-w-0">
                {lineSlots.map(si => {
                  const span = slotSpan[si]
                  const hv = (steps[si] ?? 0) as number
                  const isHl = highlightSlot >= si && highlightSlot < si + span
                  const isBeatStart = si % subdivisions === 0
                  const isBarBoundary = si % slotsPerBar === 0
                  const barIdx = Math.floor(si / slotsPerBar)
                  const isFocused = focusBar !== undefined && barIdx === focusBar

                  let bg = 'rgba(255,255,255,0.02)'
                  if (hv === 1 || hv === 2 || hv === 3) bg = color
                  const opacity = hv === 0 ? 1 : hv === 3 ? 0.3 : hv === 2 ? 1 : 0.7

                  return (
                    <div
                      key={si}
                      className={`rounded-[3px] transition-all duration-75 ${onSlotClick ? 'cursor-pointer hover:brightness-125' : ''}`}
                      onClick={onSlotClick ? () => onSlotClick(si) : undefined}
                      style={{
                        flex: span,
                        height: rowH - 4,
                        background: hv > 0 ? bg : isHl ? 'rgba(245,158,11,0.06)' : isFocused ? 'rgba(245,158,11,0.03)' : 'rgba(255,255,255,0.02)',
                        opacity: hv > 0 ? opacity : 1,
                        borderLeft: isBarBoundary && si > startSlot ? `2px solid rgba(245,158,11,0.15)` : isBeatStart && si > startSlot ? '2px solid rgba(255,255,255,0.04)' : undefined,
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

  return (
    <div className="w-full">
      {Array.from({ length: numLines }, (_, i) => renderGridLine(i))}
    </div>
  )
}

// ── Play controls (PULSE theme) ─────────────────────────────────────────────

function PlayBar({ playing, paused, bpm, loops, onPlay, onPause, onStop, onBpmChange, onLoopsChange }: {
  playing: boolean; paused: boolean; bpm: number; loops: number
  onPlay: () => void; onPause: () => void; onStop: () => void
  onBpmChange: (b: number) => void; onLoopsChange: (l: number) => void
}) {
  return <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
    {/* Play / Pause */}
    <button onClick={playing ? onPause : onPlay}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
        playing
          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15'
          : paused
            ? 'text-white hover:brightness-110'
            : 'text-white hover:brightness-110'
      }`}
      style={playing ? undefined : { background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
      {playing ? '⏸ Pause' : paused ? '▶ Resume' : '▶ Listen'}
    </button>
    {/* Stop (only when playing or paused) */}
    {(playing || paused) && (
      <button onClick={onStop}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/15 transition-all cursor-pointer">
        ■ Stop
      </button>
    )}
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
  /** Per-bar subdivisions for mixed-resolution patterns (from Studio Compose) */
  barSubdivisions?: number[]
}

export default function StaffNotationDisplay({ pattern, currentStep, bpm = 90, bars = 1, beatsPerBar, metronomeSlot, onBpmChange, barSubdivisions }: Props) {
  const [localBpm, setLocalBpm] = useState(bpm)
  const [loops, setLoops] = useState(bars)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [demoSlot, setDemoSlot] = useState(-1)
  const [demoLoop, setDemoLoop] = useState(0)
  const [containerWidth, setContainerWidth] = useState(800)
  const [fullscreen, setFullscreen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const prevSlotRef = useRef(-1)
  const cursorAtFirstNoteRef = useRef(false)
  const osmdRef = useRef<OsmdNotationHandle>(null)

  // Sync localBpm when parent bpm prop changes
  useEffect(() => { setLocalBpm(bpm) }, [bpm])

  function handleBpmChange(newBpm: number) {
    setLocalBpm(newBpm)
    onBpmChange?.(newBpm)
  }

  // Preload audio samples on mount so first play has no delay
  useEffect(() => { ensureAudioReady() }, [])

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

  // Authoritative set of slots where each MusicXML note starts.
  // Computed synchronously from the same function that generates the MusicXML,
  // so it's always in perfect sync — no async timing issues.
  const cursorSlotSet = useMemo(() => {
    const { noteSlots } = patternToMusicXml(pattern, beatsPerBar, undefined, barSubdivisions)
    return new Set(noteSlots)
  }, [pattern, beatsPerBar])

  const stepCb = useCallback((s: number) => {
    setDemoSlot(s)
    if (s === 0 && prevSlotRef.current > 0) {
      // Loop restart
      osmdRef.current?.cursorReset()
      osmdRef.current?.cursorShow()
      cursorAtFirstNoteRef.current = true
    } else if (cursorSlotSet.has(s)) {
      if (cursorAtFirstNoteRef.current) {
        // Cursor was just positioned at note 0 by cursorShow — skip this advance
        cursorAtFirstNoteRef.current = false
      } else {
        osmdRef.current?.cursorNext()
      }
    }
  }, [cursorSlotSet])

  const finishCb = useCallback(() => {
    setPlaying(false); setPaused(false); setDemoSlot(-1); setDemoLoop(0)
    osmdRef.current?.cursorHide()
  }, [])

  function handlePlay() {
    if (paused) {
      // Resume from paused position — cursor is already positioned
      setPlaying(true); setPaused(false)
      cursorAtFirstNoteRef.current = true
      resumePatternPlayback()
      return
    }
    // Fresh play from start
    setPlaying(true); setPaused(false); setDemoLoop(0); setDemoSlot(0)
    osmdRef.current?.cursorShow()
    cursorAtFirstNoteRef.current = true
    const effectiveLoops = loops === 0 ? 99 : loops
    playPattern(pattern, localBpm, effectiveLoops, stepCb, finishCb)
  }

  function handlePause() {
    pausePatternPlayback()
    setPlaying(false); setPaused(true)
  }

  function handleStop() {
    stopPatternPlayback()
    osmdRef.current?.cursorHide()
    setPlaying(false); setPaused(false); setDemoSlot(-1); setDemoLoop(0)
  }

  function handleSeek(slot: number) {
    // Start playing from the clicked slot
    setPlaying(true); setPaused(false); setDemoSlot(slot)

    // Position cursor at the correct note for this slot
    osmdRef.current?.cursorReset()
    osmdRef.current?.cursorShow()
    // Advance cursor to the note matching this slot
    const sortedNoteSlots = [...cursorSlotSet].sort((a, b) => a - b)
    const advances = sortedNoteSlots.filter(ns => ns < slot).length
    for (let i = 0; i < advances; i++) osmdRef.current?.cursorNext()
    cursorAtFirstNoteRef.current = true

    const effectiveLoops = loops === 0 ? 99 : loops
    playPatternFromSlot(pattern, localBpm, effectiveLoops, slot, stepCb, finishCb)
  }

  useEffect(() => {
    if (playing && demoSlot === 0 && prevSlotRef.current > 0) setDemoLoop(l => l + 1)
    prevSlotRef.current = demoSlot
  }, [demoSlot, playing])

  useEffect(() => () => { stopPatternPlayback(); osmdRef.current?.cursorHide() }, []) // eslint-disable-line

  const activeSlot = currentStep !== undefined ? currentStep : playing ? demoSlot : -1
  const bpb = beatsPerBar ?? pattern.beats
  const numBars = Math.max(1, Math.ceil(pattern.beats / bpb))
  const slotsPerBar = bpb * pattern.subdivisions

  // Current bar during playback (for fullscreen focus)
  const activeBar = activeSlot >= 0 ? Math.floor(activeSlot / slotsPerBar) : 0

  // Build a focused window pattern: extract bars [focusStart..focusEnd) for fullscreen
  const FOCUS_CONTEXT = 2 // bars before and after
  const focusStart = Math.max(0, activeBar - FOCUS_CONTEXT)
  const focusEnd = Math.min(numBars, activeBar + FOCUS_CONTEXT + 1)

  const focusPattern = useMemo<PatternData>(() => {
    const startSlot = focusStart * slotsPerBar
    const endSlot = focusEnd * slotsPerBar
    const focusBeats = (focusEnd - focusStart) * bpb
    const focusTracks: Partial<Record<DrumPad, HitValue[]>> = {}
    for (const [pad, track] of Object.entries(pattern.tracks) as [DrumPad, HitValue[]][]) {
      const slice = track.slice(startSlot, endSlot)
      if (slice.some(v => v > 0)) focusTracks[pad] = slice
    }
    return { beats: focusBeats, subdivisions: pattern.subdivisions, tracks: focusTracks }
  }, [pattern, focusStart, focusEnd, bpb, slotsPerBar])

  const focusBarSubs = barSubdivisions?.slice(focusStart, focusEnd)
  const focusHighlightSlot = activeSlot >= 0 ? activeSlot - focusStart * slotsPerBar : -1
  const focusActiveBarInWindow = activeBar - focusStart

  // Normal view content
  const normalContent = () => (
    <>
      {metronomeSlot}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PlayBar playing={playing} paused={paused} bpm={localBpm} loops={loops} onPlay={handlePlay} onPause={handlePause} onStop={handleStop} onBpmChange={handleBpmChange} onLoopsChange={setLoops} />
        <button
          onClick={() => setFullscreen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.08]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Fullscreen
        </button>
      </div>

      {/* Notation (OSMD) */}
      <div className="rounded-2xl overflow-hidden border border-[#e0e0e0]">
        <div className="px-4 py-2 border-b border-[#e8e8e8]" style={{ background: '#f8f8f8' }}>
          <span className="text-[10px] font-semibold text-[#888] uppercase tracking-widest">Notation</span>
        </div>
        <OsmdNotation
          ref={osmdRef}
          pattern={pattern}
          beatsPerBar={beatsPerBar}
          barSubdivisions={barSubdivisions}
          width={containerWidth - 16}
        />
      </div>

      {/* Grid view — with line breaks every 4 bars */}
      <div className="rounded-2xl border border-white/[0.04] p-4" style={{
        background: 'linear-gradient(135deg, rgba(6,8,13,0.95) 0%, rgba(8,10,16,0.98) 100%)',
      }}>
        <div className="mb-3">
          <span className="text-[10px] font-semibold text-[#3d4d5d] uppercase tracking-widest">Grid</span>
        </div>
        <GridView pattern={pattern} highlightSlot={activeSlot} onSlotClick={handleSeek} barSubdivisions={barSubdivisions} beatsPerBar={beatsPerBar} barsPerLine={4} />
      </div>

      <Legend />
    </>
  )

  return (
    <div ref={wrapperRef} className="space-y-4">
      {normalContent()}

      {/* ═══ FULLSCREEN PRACTICE MODE ═══ */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#04060a' }} onClick={() => { handleStop(); setFullscreen(false) }}>
          <div className="flex flex-col h-full" onClick={e => e.stopPropagation()}>
            {/* Top bar: controls + bar indicator + close */}
            <div className="flex items-center justify-between px-6 py-3 flex-shrink-0" style={{
              background: 'linear-gradient(180deg, rgba(6,8,13,0.98) 0%, rgba(4,6,10,0.95) 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <PlayBar playing={playing} paused={paused} bpm={localBpm} loops={loops} onPlay={handlePlay} onPause={handlePause} onStop={handleStop} onBpmChange={handleBpmChange} onLoopsChange={setLoops} />

              {/* Bar position indicator */}
              <div className="flex items-center gap-3">
                {numBars > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#4b5a6a] uppercase tracking-wider">Bar</span>
                    <span className="text-lg font-black text-amber-400 font-mono">{activeBar + 1}</span>
                    <span className="text-[10px] text-[#374151]">/ {numBars}</span>
                    {/* Mini progress bar */}
                    <div className="w-24 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-200" style={{
                        width: `${((activeBar + 1) / numBars) * 100}%`,
                        background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                      }} />
                    </div>
                  </div>
                )}
                <button
                  onClick={() => { handleStop(); setFullscreen(false) }}
                  className="text-[#4b5a6a] hover:text-white transition-colors cursor-pointer p-2 ml-4"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main content: focused notation + grid */}
            <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-4">

              {/* Full notation (OSMD) — scrollable, shows all bars */}
              <div className="rounded-2xl overflow-hidden border border-[#e0e0e0] flex-shrink-0" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                <div className="px-4 py-1.5 border-b border-[#e8e8e8] flex items-center justify-between" style={{ background: '#f8f8f8' }}>
                  <span className="text-[10px] font-semibold text-[#888] uppercase tracking-widest">Full Score</span>
                  <span className="text-[9px] text-[#aaa]">{numBars} bars</span>
                </div>
                <OsmdNotation
                  ref={osmdRef}
                  pattern={pattern}
                  beatsPerBar={beatsPerBar}
                  barSubdivisions={barSubdivisions}
                  width={window.innerWidth - 80}
                />
              </div>

              {/* Focused Grid — shows current bar ± context, enlarged */}
              <div className="rounded-2xl border border-white/[0.04] p-5 flex-1 min-h-0 overflow-y-auto" style={{
                background: 'linear-gradient(135deg, rgba(6,8,13,0.98) 0%, rgba(8,10,16,0.99) 100%)',
              }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-semibold text-[#3d4d5d] uppercase tracking-widest">Focus Grid</span>
                  <span className="text-[10px] text-[#374151]">
                    Bars {focusStart + 1}–{focusEnd}
                    {focusStart > 0 && <span className="text-amber-400/40 ml-1">← more</span>}
                    {focusEnd < numBars && <span className="text-amber-400/40 ml-1">more →</span>}
                  </span>
                </div>
                <GridView
                  pattern={focusPattern}
                  highlightSlot={focusHighlightSlot}
                  onSlotClick={slot => handleSeek(slot + focusStart * slotsPerBar)}
                  barSubdivisions={focusBarSubs}
                  beatsPerBar={beatsPerBar}
                  barsPerLine={focusEnd - focusStart}
                  focusBar={focusActiveBarInWindow}
                  scale={1.3}
                />
              </div>
            </div>

            {/* Bottom legend */}
            <div className="flex-shrink-0 px-6 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <Legend />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
