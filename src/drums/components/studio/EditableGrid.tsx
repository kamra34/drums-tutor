import { PatternData, HitValue } from '@drums/types/curriculum'
import { DrumPad } from '@drums/types/midi'

// ── Pad ordering & labels (same as StaffNotationDisplay) ─────────────────

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

const GRID_PAD_COLOR: Partial<Record<DrumPad, string>> = {
  [DrumPad.CrashCymbal]: '#3b82f6',
  [DrumPad.RideCymbal]:  '#3b82f6',
  [DrumPad.HiHatOpen]:   '#06b6d4',
  [DrumPad.HiHatClosed]: '#06b6d4',
  [DrumPad.Tom1]:        '#10b981',
  [DrumPad.Tom2]:        '#10b981',
  [DrumPad.Snare]:       '#f59e0b',
  [DrumPad.FloorTom]:    '#10b981',
  [DrumPad.Kick]:        '#ef4444',
  [DrumPad.HiHatPedal]:  '#06b6d4',
}

const ROW_H = 32
const LABEL_W = 64

interface Props {
  pattern: PatternData
  enabledPads: DrumPad[]
  bars: number
  onChange: (pattern: PatternData) => void
}

/**
 * Interactive drum grid editor. Click cells to cycle: empty → normal → accent → ghost → empty.
 * Supports multi-bar patterns (renders bar separators).
 */
export default function EditableGrid({ pattern, enabledPads, bars, onChange }: Props) {
  const { beats, subdivisions, tracks } = pattern
  const slotsPerBar = beats * subdivisions
  const totalSlots = slotsPerBar * bars

  // Only show rows for enabled pads, in canonical order
  const visiblePads = GRID_PAD_ORDER.filter(p => enabledPads.includes(p))

  function handleCellClick(pad: DrumPad, slotIndex: number) {
    const currentTrack = tracks[pad] ?? new Array(totalSlots).fill(0)
    // Ensure track is long enough for multi-bar
    const track = [...currentTrack]
    while (track.length < totalSlots) track.push(0)

    const current = (track[slotIndex] ?? 0) as HitValue
    // Cycle: 0 → 1 → 2 → 3 → 0
    const next: HitValue = ((current + 1) % 4) as HitValue

    track[slotIndex] = next

    const newTracks = { ...tracks, [pad]: track }
    // Remove track if all zeros
    if (track.every(v => v === 0)) delete newTracks[pad]

    onChange({ ...pattern, tracks: newTracks })
  }

  function handleCellRightClick(pad: DrumPad, slotIndex: number, e: React.MouseEvent) {
    e.preventDefault()
    const currentTrack = tracks[pad] ?? new Array(totalSlots).fill(0)
    const track = [...currentTrack]
    while (track.length < totalSlots) track.push(0)
    // Right-click: clear cell
    track[slotIndex] = 0
    const newTracks = { ...tracks, [pad]: track }
    if (track.every(v => v === 0)) delete newTracks[pad]
    onChange({ ...pattern, tracks: newTracks })
  }

  return (
    <div className="w-full select-none">
      {/* Bar + beat numbers */}
      <div className="flex" style={{ paddingLeft: LABEL_W }}>
        {Array.from({ length: bars }).map((_, bar) => (
          <div key={bar} className="flex flex-1" style={{ borderLeft: bar > 0 ? '2px solid rgba(245,158,11,0.2)' : undefined }}>
            {Array.from({ length: beats }).map((_, b) => (
              <div key={b} className="text-center text-xs text-[#4b5a6a] font-medium" style={{ flex: subdivisions }}>
                {bar > 0 || b > 0 ? '' : ''}{b + 1}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      {visiblePads.map((pad) => {
        const color = GRID_PAD_COLOR[pad] ?? '#6b7280'
        const trackData = tracks[pad] ?? []

        return (
          <div key={pad} className="flex items-center" style={{ height: ROW_H }}>
            {/* Label */}
            <div className="text-[11px] font-medium text-right pr-3 flex-shrink-0" style={{ width: LABEL_W, color }}>
              {GRID_PAD_LABEL[pad] ?? pad}
            </div>

            {/* Cells */}
            <div className="flex gap-[2px] flex-1 min-w-0">
              {Array.from({ length: totalSlots }).map((_, si) => {
                const hv = (trackData[si] ?? 0) as number
                const isBeatStart = si % subdivisions === 0
                const isBarStart = si % slotsPerBar === 0 && si > 0

                let bg = 'rgba(255,255,255,0.03)'
                let opacity = 1
                let boxShadow = 'none'
                let label = ''

                if (hv === 1) { bg = color; opacity = 0.7 }
                else if (hv === 2) { bg = color; opacity = 1; boxShadow = `0 0 6px ${color}40`; label = '>' }
                else if (hv === 3) { bg = color; opacity = 0.3; label = 'g' }

                return (
                  <div
                    key={si}
                    onClick={() => handleCellClick(pad, si)}
                    onContextMenu={(e) => handleCellRightClick(pad, si, e)}
                    className="rounded-[3px] flex-1 flex items-center justify-center cursor-pointer transition-all duration-75 hover:brightness-125 hover:ring-1 hover:ring-white/20"
                    style={{
                      height: ROW_H - 4,
                      background: bg,
                      opacity,
                      boxShadow,
                      borderLeft: isBarStart ? '2px solid rgba(245,158,11,0.2)' : isBeatStart && si > 0 ? '2px solid rgba(255,255,255,0.04)' : undefined,
                    }}
                    title={hv === 0 ? 'Click to add hit' : hv === 1 ? 'Normal hit (click: accent)' : hv === 2 ? 'Accent (click: ghost)' : 'Ghost (click: clear)'}
                  >
                    {label && <span className="text-[8px] font-bold text-white/60">{label}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-[#4b5a6a] mt-3 flex-wrap items-center">
        <span>Left-click: cycle (empty → hit → accent → ghost)</span>
        <span className="text-[#2d3748]">|</span>
        <span>Right-click: clear</span>
        <span className="text-[#2d3748]">|</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#f59e0b] inline-block opacity-70" /> Normal</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#f59e0b] inline-block" /> <span className="text-[#fbbf24]">Accent (&gt;)</span></span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#f59e0b] inline-block opacity-30" /> Ghost (g)</span>
      </div>
    </div>
  )
}
