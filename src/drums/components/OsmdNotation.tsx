/**
 * Renders drum notation using OpenSheetMusicDisplay (OSMD).
 * Converts PatternData → MusicXML → OSMD rendering.
 * Custom cursor overlay for playback highlighting.
 */

import { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react'
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'
import { PatternData } from '@drums/types/curriculum'
import { patternToMusicXml } from '@drums/services/drumMusicXml'

export interface OsmdNotationHandle {
  cursorShow: () => void
  cursorNext: () => void
  cursorReset: () => void
  cursorHide: () => void
  /** Absolute slot indices where each MusicXML note starts */
  noteSlots: number[]
}

interface Props {
  pattern: PatternData
  beatsPerBar?: number
  title?: string
  width?: number
  barSubdivisions?: number[]
}

const OsmdNotation = forwardRef<OsmdNotationHandle, Props>(
  ({ pattern, beatsPerBar, title, width, barSubdivisions }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null)
  const noteSlotsRef = useRef<number[]>([])
  const cursorRef = useRef<HTMLDivElement>(null)
  const barHighlightRef = useRef<HTMLDivElement>(null)
  const notePositionsRef = useRef<{ x: number; y: number; staffH: number; measureX: number; measureW: number }[]>([])
  const cursorIdxRef = useRef(-1)
  const [error, setError] = useState<string | null>(null)

  // Build a map of note X/Y positions + measure bounds from OSMD's graphical data
  function buildNotePositions() {
    const osmd = osmdRef.current
    if (!osmd?.GraphicSheet) return

    const positions: { x: number; y: number; staffH: number; measureX: number; measureW: number }[] = []

    try {
      for (const musicSystem of osmd.GraphicSheet.MusicPages[0]?.MusicSystems ?? []) {
        for (const staffLine of musicSystem.StaffLines) {
          const staffY = staffLine.PositionAndShape.AbsolutePosition.y * 10
          const staffH = staffLine.PositionAndShape.Size.height * 10

          for (const measure of staffLine.Measures) {
            const measureX = measure.PositionAndShape.AbsolutePosition.x * 10
            const measureW = measure.PositionAndShape.Size.width * 10

            for (const entry of measure.staffEntries) {
              const x = entry.PositionAndShape.AbsolutePosition.x * 10
              const y = staffY
              positions.push({ x, y, staffH, measureX, measureW })
            }
          }
        }
      }
    } catch {}

    notePositionsRef.current = positions
  }

  function updateCursorPosition(idx: number) {
    const cursor = cursorRef.current
    const barHL = barHighlightRef.current
    if (!cursor) return

    const pos = notePositionsRef.current[idx]
    if (!pos) {
      cursor.style.display = 'none'
      if (barHL) barHL.style.display = 'none'
      return
    }

    // Beat cursor (narrow)
    cursor.style.display = 'block'
    cursor.style.left = `${pos.x - 10}px`
    cursor.style.top = `${pos.y - 8}px`
    cursor.style.height = `${pos.staffH + 16}px`

    // Bar highlight (wide, covers entire measure)
    if (barHL) {
      barHL.style.display = 'block'
      barHL.style.left = `${pos.measureX - 2}px`
      barHL.style.top = `${pos.y - 10}px`
      barHL.style.width = `${pos.measureW + 4}px`
      barHL.style.height = `${pos.staffH + 20}px`
    }

    // Auto-scroll: keep cursor visible within scrollable ancestor
    // Find the nearest scrollable ancestor
    let scrollParent: HTMLElement | null = containerRef.current?.parentElement ?? null
    while (scrollParent && scrollParent.scrollHeight <= scrollParent.clientHeight + 1) {
      scrollParent = scrollParent.parentElement
    }
    if (scrollParent && cursor.style.display === 'block') {
      // cursor.style.top is relative to the OSMD container (position: relative)
      // We need the cursor position relative to the scroll parent
      const cursorRect = cursor.getBoundingClientRect()
      const scrollRect = scrollParent.getBoundingClientRect()
      const cursorInScroll = cursorRect.top - scrollRect.top + scrollParent.scrollTop

      const viewTop = scrollParent.scrollTop
      const viewBottom = viewTop + scrollParent.clientHeight
      const safeZone = scrollParent.clientHeight * 0.25 // scroll when cursor is in bottom 25%

      if (cursorInScroll + cursorRect.height > viewBottom - safeZone) {
        // Cursor approaching bottom — scroll so cursor is at top 30%
        scrollParent.scrollTo({ top: cursorInScroll - scrollParent.clientHeight * 0.3, behavior: 'smooth' })
      } else if (cursorInScroll < viewTop + 10) {
        // Cursor above view — scroll up
        scrollParent.scrollTo({ top: Math.max(0, cursorInScroll - 20), behavior: 'smooth' })
      }
    }
  }

  useImperativeHandle(ref, () => ({
    cursorShow: () => {
      cursorIdxRef.current = 0
      updateCursorPosition(0)
    },
    cursorNext: () => {
      cursorIdxRef.current++
      updateCursorPosition(cursorIdxRef.current)
    },
    cursorReset: () => {
      cursorIdxRef.current = 0
      updateCursorPosition(0)
    },
    cursorHide: () => {
      cursorIdxRef.current = -1
      if (cursorRef.current) cursorRef.current.style.display = 'none'
      if (barHighlightRef.current) barHighlightRef.current.style.display = 'none'
    },
    get noteSlots() { return noteSlotsRef.current },
  }), [])

  const render = useCallback(async () => {
    if (!containerRef.current) return

    try {
      setError(null)
      const result = patternToMusicXml(pattern, beatsPerBar, title, barSubdivisions)
      noteSlotsRef.current = result.noteSlots

      if (!osmdRef.current) {
        const osmd = new OpenSheetMusicDisplay(containerRef.current, {
          autoResize: false,
          backend: 'svg',
          drawTitle: false,
          drawSubtitle: false,
          drawComposer: false,
          drawLyricist: false,
          drawPartNames: false,
          drawPartAbbreviations: false,
          drawCredits: false,
          drawMetronomeMarks: false,
          percussionOneLineCutoff: 0,
        })

        osmd.EngravingRules.FlatBeams = true
        osmd.EngravingRules.FlatBeamOffset = 20
        osmd.EngravingRules.FlatBeamOffsetPerBeam = 10
        osmd.EngravingRules.StretchLastSystemLine = true
        osmd.EngravingRules.NewSystemAtXMLNewSystemAttribute = true
        osmd.EngravingRules.SystemLeftMargin = 4

        osmdRef.current = osmd
      }

      await osmdRef.current.load(result.xml)
      osmdRef.current.render()

      // Build note position map for our custom cursor
      buildNotePositions()

      if (containerRef.current) centerSvg(containerRef.current)
    } catch (err) {
      console.warn('OSMD render error:', err)
      setError('Notation render failed')
    }
  }, [pattern, beatsPerBar, title])

  useEffect(() => { render() }, [render])

  useEffect(() => {
    if (osmdRef.current && width) {
      try {
        osmdRef.current.render()
        buildNotePositions()
        if (containerRef.current) centerSvg(containerRef.current)
      } catch {}
    }
  }, [width])

  if (error) {
    return <div className="text-xs text-[#4b5563] italic p-4">{error}</div>
  }

  return (
    <div
      className="osmd-notation-container"
      style={{
        minHeight: 80,
        background: '#ffffff',
        borderRadius: 8,
        padding: '12px 8px',
        position: 'relative',
      }}
    >
      <div ref={containerRef} />
      {/* Bar highlight — wide, covers entire current measure */}
      <div
        ref={barHighlightRef}
        style={{
          display: 'none',
          position: 'absolute',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.12)',
          borderRadius: 6,
          pointerEvents: 'none',
          zIndex: 5,
          transition: 'left 0.12s ease-out, top 0.12s ease-out, width 0.12s ease-out',
        }}
      />
      {/* Beat cursor — narrow, highlights specific note position */}
      <div
        ref={cursorRef}
        style={{
          display: 'none',
          position: 'absolute',
          width: 22,
          background: 'linear-gradient(90deg, rgba(245,158,11,0.0) 0%, rgba(245,158,11,0.3) 30%, rgba(245,158,11,0.45) 50%, rgba(245,158,11,0.3) 70%, rgba(245,158,11,0.0) 100%)',
          borderRadius: 4,
          pointerEvents: 'none',
          zIndex: 10,
          transition: 'left 0.06s ease-out, top 0.06s ease-out',
          boxShadow: '0 0 14px 3px rgba(245,158,11,0.2)',
        }}
      />
    </div>
  )
})

OsmdNotation.displayName = 'OsmdNotation'
export default OsmdNotation

/** Center the rendered notation if it's narrower than the container */
function centerSvg(container: HTMLElement) {
  const svg = container.querySelector('svg')
  if (!svg) return

  const bbox = svg.getBBox()
  if (!bbox || bbox.width <= 0) return

  const svgW = svg.clientWidth || svg.getBoundingClientRect().width
  const contentRight = bbox.x + bbox.width
  const unusedSpace = svgW - contentRight

  if (unusedSpace > svgW * 0.15) {
    const offset = Math.floor(unusedSpace / 2)
    const vb = svg.getAttribute('viewBox')
    if (vb) {
      const parts = vb.split(/\s+/)
      if (parts.length === 4) {
        const newX = parseFloat(parts[0]) - offset
        svg.setAttribute('viewBox', `${newX} ${parts[1]} ${parts[2]} ${parts[3]}`)
      }
    }
  }
}
