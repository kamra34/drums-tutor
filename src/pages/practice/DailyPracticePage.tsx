import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUserStore } from '../../stores/useUserStore'
import { useAiStore } from '../../stores/useAiStore'
import { READING_EXERCISES, GENRE_BEATS, FILL_CHALLENGES, RUDIMENTS_LIBRARY, PracticeItem } from '../../data/practiceLibrary'

function generateDailyPlan(
  skillProfile: { [key: string]: number },
  completedCount: number,
): { warmup: PracticeItem[]; focus: PracticeItem[]; challenge: PracticeItem; tip: string } {
  // Simple heuristic-based recommendation (works without AI too)
  const weakest = Object.entries(skillProfile).sort(([,a], [,b]) => a - b)
  const weakestSkill = weakest[0]?.[0] ?? 'timing'

  // Determine level from completed exercises
  const level = completedCount < 5 ? 'beginner' : completedCount < 20 ? 'intermediate' : 'advanced'

  // Warmup: always start with fundamentals
  const warmup = READING_EXERCISES.filter(e => e.difficulty <= 3).slice(0, 2)

  // Focus area based on weakest skill
  let focus: PracticeItem[] = []
  let tip = ''

  switch (weakestSkill) {
    case 'timing':
      focus = READING_EXERCISES.filter(e => e.difficulty >= 3 && e.difficulty <= 6).slice(0, 3)
      tip = 'Your timing needs work. Focus on locking in with the metronome click — every hit should be exactly on the grid.'
      break
    case 'dynamics':
      focus = [...GENRE_BEATS.filter(e => e.tags.includes('ghost-notes')), ...READING_EXERCISES.filter(e => e.tags.includes('accents'))].slice(0, 3)
      tip = 'Work on your dynamic range. Practice the contrast between ghost notes (whisper soft) and accents (loud and clear).'
      break
    case 'independence':
      focus = GENRE_BEATS.filter(e => e.difficulty >= 4 && e.difficulty <= 7).slice(0, 3)
      tip = 'Your limb independence needs attention. Focus on keeping the hi-hat steady while your kick and snare do different things.'
      break
    case 'speed':
      focus = READING_EXERCISES.filter(e => e.tags.includes('sixteenth-notes')).concat(
        GENRE_BEATS.filter(e => e.bpm >= 120)
      ).slice(0, 3)
      tip = 'Speed comes from accuracy. Practice these patterns slowly first, then gradually increase the tempo.'
      break
    default:
      focus = GENRE_BEATS.filter(e => e.difficulty >= 3 && e.difficulty <= 5).slice(0, 3)
      tip = 'Well-rounded practice today. Focus on consistency and musical feel.'
  }

  // Challenge: something slightly above their level
  const targetDiff = level === 'beginner' ? 4 : level === 'intermediate' ? 6 : 8
  const challenge = [...GENRE_BEATS, ...FILL_CHALLENGES]
    .filter(e => e.difficulty >= targetDiff && e.difficulty <= targetDiff + 2)
    .sort(() => Math.random() - 0.5)[0] ?? FILL_CHALLENGES[0]

  return { warmup, focus, challenge, tip }
}

export default function DailyPracticePage() {
  const { progress } = useUserStore()
  const { isConfigured } = useAiStore()
  const navigate = useNavigate()

  const plan = generateDailyPlan(
    progress.skillProfile as unknown as { [key: string]: number },
    progress.exerciseResults.length,
  )

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-6">
        <Link to="/practice" className="text-amber-500/80 hover:text-amber-400 transition-colors">Practice</Link>
        <svg className="w-3.5 h-3.5 text-[#2d3748]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-[#94a3b8]">Daily Practice</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Today's Practice Plan</h1>
        <p className="text-sm text-[#6b7280]">
          {isConfigured
            ? 'Personalized based on your skill profile and practice history.'
            : 'Generated based on your skill profile. Add your Claude API key in Settings for AI-powered coaching.'}
        </p>
      </div>

      {/* Tip */}
      <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-2xl p-4 mb-6">
        <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest mb-1">Today's Focus</div>
        <p className="text-sm text-[#94a3b8]">{plan.tip}</p>
      </div>

      {/* Warmup */}
      <Section
        title="Warm-Up"
        subtitle="Get your hands and feet moving"
        items={plan.warmup}
        onPlay={id => navigate(`/practice/play/${id}`)}
      />

      {/* Focus */}
      <Section
        title="Focus Exercises"
        subtitle="Target your weak areas"
        items={plan.focus}
        onPlay={id => navigate(`/practice/play/${id}`)}
      />

      {/* Challenge */}
      <div className="mt-6">
        <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">Challenge</div>
        <button
          onClick={() => navigate(`/practice/play/${plan.challenge.id}`)}
          className="w-full p-4 rounded-2xl border border-amber-500/15 hover:border-amber-500/30 transition-all text-left group"
          style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 text-lg font-bold">!</div>
            <div className="flex-1">
              <div className="text-sm text-white font-medium">{plan.challenge.title}</div>
              <div className="text-xs text-[#6b7280] mt-0.5">{plan.challenge.description}</div>
              <div className="text-[10px] text-amber-400/70 mt-1">Difficulty {plan.challenge.difficulty}/10 · {plan.challenge.bpm} BPM</div>
            </div>
            <span className="text-amber-500/60 opacity-0 group-hover:opacity-100 transition-opacity text-lg">→</span>
          </div>
        </button>
      </div>
    </div>
  )
}

function Section({ title, subtitle, items, onPlay }: {
  title: string; subtitle: string; items: PracticeItem[]; onPlay: (id: string) => void
}) {
  return (
    <div className="mb-6">
      <div className="mb-2">
        <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">{title}</div>
        <div className="text-[10px] text-[#374151]">{subtitle}</div>
      </div>
      <div className="space-y-1.5">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onPlay(item.id)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-amber-500/20 hover:bg-white/[0.05] transition-all text-left group"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white">{item.title}</div>
              <div className="text-[10px] text-[#4b5563]">{item.bpm} BPM · {item.difficulty}/10</div>
            </div>
            <span className="text-amber-500/60 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}
