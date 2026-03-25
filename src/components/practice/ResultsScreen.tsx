import { ExerciseResult } from '../../types/curriculum'
import { AiFeedback } from '../../types/ai'
import StarRating from '../shared/StarRating'
import { DrumPad } from '../../types/midi'

const PAD_LABELS: Partial<Record<DrumPad, string>> = {
  [DrumPad.HiHatClosed]: 'Hi-Hat',
  [DrumPad.HiHatOpen]: 'Hi-Hat Open',
  [DrumPad.Snare]: 'Snare',
  [DrumPad.Kick]: 'Kick',
  [DrumPad.Tom1]: 'Tom 1',
  [DrumPad.Tom2]: 'Tom 2',
  [DrumPad.FloorTom]: 'Floor Tom',
  [DrumPad.CrashCymbal]: 'Crash',
  [DrumPad.RideCymbal]: 'Ride',
}

interface Props {
  result: ExerciseResult
  feedback: AiFeedback | null
  feedbackLoading: boolean
  onRetry: () => void
  onNext?: () => void
}

export default function ResultsScreen({ result, feedback, feedbackLoading, onRetry, onNext }: Props) {
  const scoreColor =
    result.score >= 85 ? 'text-green-400' : result.score >= 70 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-6 text-center">
        <div className={`text-6xl font-bold mb-1 ${scoreColor}`}>{result.score}</div>
        <div className="text-[#4b5563] text-sm mb-3">/ 100</div>
        <StarRating stars={result.stars} size="lg" />
        <div className="mt-3 text-sm text-[#6b7280]">
          {result.missedNotes === 0
            ? 'Perfect — no missed notes!'
            : `${result.missedNotes} missed note${result.missedNotes > 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Accuracy" value={`${(result.accuracy * 100).toFixed(1)}%`} />
        <Stat label="Tempo" value={`${result.bpm} BPM`} />
        {Object.entries(result.timingData).map(([pad, stats]) =>
          stats ? (
            <Stat
              key={pad}
              label={`${PAD_LABELS[pad as DrumPad] ?? pad} timing`}
              value={`±${stats.stdDev.toFixed(0)}ms`}
              sub={`avg ${stats.avgOffset > 0 ? '+' : ''}${stats.avgOffset.toFixed(0)}ms`}
            />
          ) : null
        )}
      </div>

      {/* AI Feedback */}
      <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5">
        <h3 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider mb-3">
          AI Feedback
        </h3>
        {feedbackLoading ? (
          <div className="text-[#4b5563] text-sm animate-pulse">Getting feedback from your AI tutor…</div>
        ) : feedback ? (
          <div className="space-y-3">
            <p className="text-[#e2e8f0]">{feedback.summary}</p>
            {feedback.tips.length > 0 && (
              <ul className="space-y-1.5">
                {feedback.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[#94a3b8]">
                    <span className="text-violet-500 flex-shrink-0">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            )}
            {feedback.encouragement && (
              <p className="text-violet-400 text-sm italic">{feedback.encouragement}</p>
            )}
          </div>
        ) : (
          <p className="text-[#4b5563] text-sm">
            Configure your Anthropic API key in Settings to get AI feedback.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 py-2.5 rounded-lg bg-[#1a1f2e] text-[#94a3b8] hover:text-white hover:bg-[#252b3b] transition-colors text-sm font-medium"
        >
          Try Again
        </button>
        {onNext && (
          <button
            onClick={onNext}
            className="flex-1 py-2.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors text-sm font-medium"
          >
            Next Exercise →
          </button>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-lg p-3">
      <div className="text-xs text-[#6b7280] mb-0.5">{label}</div>
      <div className="text-lg font-semibold text-[#e2e8f0]">{value}</div>
      {sub && <div className="text-xs text-[#4b5563]">{sub}</div>}
    </div>
  )
}
