import { PatternData, HitValue } from '../../types/curriculum'
import { DrumPad } from '../../types/midi'

const PAD_LABELS: Partial<Record<DrumPad, string>> = {
  [DrumPad.HiHatClosed]: 'HH',
  [DrumPad.HiHatOpen]: 'HH Open',
  [DrumPad.Snare]: 'Snare',
  [DrumPad.Kick]: 'Kick',
  [DrumPad.Tom1]: 'Tom 1',
  [DrumPad.Tom2]: 'Tom 2',
  [DrumPad.FloorTom]: 'Floor',
  [DrumPad.CrashCymbal]: 'Crash',
  [DrumPad.RideCymbal]: 'Ride',
  [DrumPad.HiHatPedal]: 'HH Ped',
}

// Row order matches standard staff positions (top of staff → bottom)
// Per PAS / Hal Leonard: crash → hi-hat → ride → toms → snare → floor tom → kick → HH pedal
const PAD_ORDER: DrumPad[] = [
  DrumPad.CrashCymbal,    // ledger line above staff
  DrumPad.HiHatOpen,      // space above top line (with "o")
  DrumPad.HiHatClosed,    // space above top line (with "+")
  DrumPad.RideCymbal,     // ON top line (line 5)
  DrumPad.Tom1,           // top space (space 4)
  DrumPad.Tom2,           // 4th line
  DrumPad.Snare,          // 3rd space
  DrumPad.FloorTom,       // 2nd space
  DrumPad.Kick,           // 1st space
  DrumPad.HiHatPedal,     // below bottom line
]

const HIT_COLORS: Record<HitValue, string> = {
  0: 'bg-[#1a1f2e]',
  1: 'bg-violet-600',
  2: 'bg-yellow-400',
  3: 'bg-violet-900',
}

interface Props {
  pattern: PatternData
  currentStep?: number
  activePads?: Partial<Record<DrumPad, { velocity: number; timestamp: number }>>
  compact?: boolean
}

export default function PatternGrid({ pattern, currentStep, activePads, compact = false }: Props) {
  const { beats, subdivisions, tracks } = pattern
  const totalSteps = beats * subdivisions

  // Only show pads that have notes in this pattern
  const activePadOrder = PAD_ORDER.filter(
    (pad) => tracks[pad] && tracks[pad]!.some((v) => v > 0)
  )

  const cellSize = compact ? 'w-6 h-5' : 'w-8 h-7'
  const labelWidth = compact ? 'w-14' : 'w-16'

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Beat numbers */}
        <div className={`flex mb-1 ${labelWidth}`}>
          <div className={labelWidth} />
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`${cellSize} flex-shrink-0 text-center text-[10px] text-[#374151] ${
                i % subdivisions === 0 ? 'text-[#6b7280]' : ''
              }`}
            >
              {i % subdivisions === 0 ? i / subdivisions + 1 : '·'}
            </div>
          ))}
        </div>

        {/* Rows */}
        {activePadOrder.map((pad) => {
          const steps = tracks[pad] ?? Array(totalSteps).fill(0)
          const isActive = activePads?.[pad] !== undefined

          return (
            <div key={pad} className="flex items-center mb-0.5">
              {/* Pad label */}
              <div
                className={`${labelWidth} flex-shrink-0 text-xs pr-2 text-right truncate transition-colors ${
                  isActive ? 'text-violet-400 font-medium' : 'text-[#6b7280]'
                }`}
              >
                {PAD_LABELS[pad] ?? pad}
              </div>

              {/* Steps */}
              {Array.from({ length: totalSteps }).map((_, stepIndex) => {
                const hitValue = steps[stepIndex] as HitValue
                const isCurrent = currentStep === stepIndex
                const isBarLine = stepIndex > 0 && stepIndex % subdivisions === 0

                return (
                  <div
                    key={stepIndex}
                    className={`${cellSize} flex-shrink-0 mx-px rounded-sm transition-all ${
                      HIT_COLORS[hitValue]
                    } ${isCurrent ? 'ring-1 ring-white/50 brightness-125' : ''} ${
                      isBarLine ? 'ml-0.5' : ''
                    }`}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
