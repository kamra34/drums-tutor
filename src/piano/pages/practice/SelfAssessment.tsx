import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'

interface Props {
  exerciseName: string
  sessionCount: number
  onDone: () => void
}

const RATINGS = [
  { stars: 1, label: 'Struggled', desc: 'Could not play through without many stops or errors.', color: '#ef4444', skillDelta: 1 },
  { stars: 2, label: 'Needs Work', desc: 'Played through but with several mistakes or hesitations.', color: '#f97316', skillDelta: 3 },
  { stars: 3, label: 'Okay', desc: 'Played it mostly correctly but not consistently smooth.', color: '#eab308', skillDelta: 5 },
  { stars: 4, label: 'Good', desc: 'Played correctly with only minor issues. Mostly even tempo.', color: '#22c55e', skillDelta: 8 },
  { stars: 5, label: 'Excellent', desc: 'Played perfectly 3+ times in a row. Even, smooth, confident.', color: '#a78bfa', skillDelta: 12 },
]

const SKILL_QUESTIONS = [
  { key: 'noteReading', question: 'How well did you read the notes?', icon: '🎼' },
  { key: 'rhythm', question: 'How steady was your rhythm?', icon: '🥁' },
  { key: 'technique', question: 'How was your finger technique?', icon: '✋' },
  { key: 'handsCoordination', question: 'How was your hand coordination?', icon: '🤲' },
]

const accent = '#a78bfa'

export default function SelfAssessment({ exerciseName, sessionCount, onDone }: Props) {
  const [overallRating, setOverallRating] = useState<number | null>(null)
  const [skillRatings, setSkillRatings] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const { addExerciseResult, updateSkillProfile, progress } = usePianoProgressStore()

  function handleSubmit() {
    if (overallRating === null) return

    const ratingDef = RATINGS[overallRating - 1]

    // Record exercise result
    addExerciseResult({
      exerciseId: `practice-${exerciseName.replace(/\s/g, '-').toLowerCase()}`,
      timestamp: Date.now(),
      score: overallRating * 20,
      stars: Math.min(3, Math.ceil(overallRating / 2)),
      accuracy: overallRating / 5,
    })

    // Update skill profile based on self-assessment
    const updates: Record<string, number> = {}
    for (const [key, value] of Object.entries(skillRatings)) {
      const currentVal = (progress.skillProfile as unknown as Record<string, number>)[key] ?? 0
      const delta = (value / 5) * ratingDef.skillDelta
      updates[key] = Math.min(100, currentVal + delta)
    }
    // Always bump musicality slightly for completing practice
    const currentMusicality = progress.skillProfile.musicality
    updates.musicality = Math.min(100, currentMusicality + ratingDef.skillDelta * 0.5)

    updateSkillProfile(updates as any)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="p-6 lg:p-8 max-w-[600px] mx-auto">
        <div className="rounded-2xl p-8 border border-white/[0.04] text-center" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
        }}>
          <div className="text-5xl mb-4">
            {overallRating! >= 4 ? '🎉' : overallRating! >= 3 ? '👍' : '💪'}
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {overallRating! >= 4 ? 'Great session!' : overallRating! >= 3 ? 'Good work!' : 'Keep practicing!'}
          </h2>
          <p className="text-sm text-[#6b7280] mb-6">
            {overallRating! >= 4
              ? 'Your skill profile has been updated. Try increasing the BPM or switching to a different scale.'
              : 'Every session counts. Try again at a slower tempo or review the curriculum lesson for this scale.'
            }
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={onDone}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white cursor-pointer transition-all hover:brightness-110"
              style={{ background: `linear-gradient(135deg, ${accent}, #8b5cf6)` }}>
              Practice Again
            </button>
            <Link to="/piano/practice"
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#94a3b8] border border-white/[0.06] hover:text-white hover:bg-white/[0.04] transition-all">
              Back to Practice
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-[600px] mx-auto">
      <div className="rounded-2xl p-6 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
      }}>
        <h2 className="text-lg font-bold text-white mb-1">How did you do?</h2>
        <p className="text-xs text-[#6b7280] mb-5">
          {exerciseName} · {sessionCount} run{sessionCount > 1 ? 's' : ''}
        </p>

        {/* Overall rating */}
        <div className="mb-6">
          <label className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold block mb-3">Overall Performance</label>
          <div className="grid grid-cols-5 gap-2">
            {RATINGS.map(r => {
              const isSelected = overallRating === r.stars
              return (
                <button key={r.stars} onClick={() => setOverallRating(r.stars)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: isSelected ? `${r.color}18` : '#161b22',
                    border: `1px solid ${isSelected ? `${r.color}50` : 'rgba(255,255,255,0.04)'}`,
                  }}>
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.stars }).map((_, i) => (
                      <svg key={i} className="w-3 h-3" fill={isSelected ? r.color : '#374151'} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: isSelected ? r.color : '#4b5563' }}>{r.label}</span>
                </button>
              )
            })}
          </div>
          {overallRating && (
            <p className="text-xs text-[#6b7280] mt-2 text-center">{RATINGS[overallRating - 1].desc}</p>
          )}
        </div>

        {/* Skill-specific ratings */}
        {overallRating && (
          <div className="mb-6">
            <label className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold block mb-3">Rate Each Skill</label>
            <div className="space-y-3">
              {SKILL_QUESTIONS.map(sq => {
                const val = skillRatings[sq.key] ?? 0
                return (
                  <div key={sq.key} className="flex items-center gap-3">
                    <span className="text-lg w-7 text-center">{sq.icon}</span>
                    <span className="text-xs text-[#94a3b8] w-40 flex-shrink-0">{sq.question}</span>
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button key={v} onClick={() => setSkillRatings(prev => ({ ...prev, [sq.key]: v }))}
                          className="w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          style={{
                            background: val >= v ? `${accent}25` : '#161b22',
                            border: `1px solid ${val >= v ? `${accent}40` : 'rgba(255,255,255,0.04)'}`,
                            color: val >= v ? accent : '#4b5563',
                          }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!overallRating}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-30"
          style={{ background: overallRating ? `linear-gradient(135deg, ${accent}, #8b5cf6)` : '#1e2433' }}>
          Save Assessment
        </button>
      </div>
    </div>
  )
}
