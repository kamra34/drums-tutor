import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../stores/useUserStore'
import { useAiStore } from '../stores/useAiStore'
import { useMidiStore } from '../stores/useMidiStore'
import { aiService } from '../services/aiService'
import { CURRICULUM } from '../data/curriculum'
import SkillBars from '../components/shared/SkillBars'
import StarRating from '../components/shared/StarRating'

export default function DashboardPage() {
  const { progress, totalPracticeTime, practiceStreak } = useUserStore()
  const { suggestion, setSuggestion, isConfigured } = useAiStore()
  const { isConnected, deviceName } = useMidiStore()

  const currentModule = CURRICULUM.find((m) => m.id === progress.currentModule)
  const completedLessons = progress.completedLessons.length
  const totalLessons = CURRICULUM.reduce((n, m) => n + m.lessons.length, 0)
  const recentResults = [...progress.exerciseResults].reverse().slice(0, 5)

  // Load daily suggestion
  useEffect(() => {
    if (!isConfigured || suggestion) return
    aiService.getDailySuggestion(progress).then(setSuggestion)
  }, [isConfigured])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Welcome back!</h1>
        <p className="text-[#6b7280]">Ready to practice today?</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          icon="🔥"
          value={practiceStreak}
          label="Day streak"
          highlight={practiceStreak > 0}
        />
        <StatCard icon="⏱" value={`${totalPracticeTime}m`} label="Total practice" />
        <StatCard
          icon="📖"
          value={`${completedLessons}/${totalLessons}`}
          label="Lessons done"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Current module */}
          {currentModule && (
            <Section title="Continue Learning">
              <div className="bg-[#13101e] border border-violet-900/40 rounded-xl p-4">
                <div className="text-xs text-violet-500 uppercase tracking-wider mb-1">
                  Module {currentModule.order + 1}
                </div>
                <div className="text-white font-semibold mb-1">{currentModule.name}</div>
                <div className="text-sm text-[#6b7280] mb-4">{currentModule.description}</div>

                <div className="space-y-2">
                  {currentModule.lessons.slice(0, 3).map((lesson) => {
                    const done = progress.completedLessons.includes(lesson.id)
                    return (
                      <Link
                        key={lesson.id}
                        to={`/lesson/${currentModule.id}/${lesson.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1030] transition-colors"
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${done ? 'bg-violet-600 text-white' : 'bg-[#1e2433] text-[#4b5563]'}`}>
                          {done ? '✓' : lesson.order + 1}
                        </span>
                        <span className={`text-sm ${done ? 'text-[#6b7280] line-through' : 'text-[#e2e8f0]'}`}>
                          {lesson.title}
                        </span>
                      </Link>
                    )
                  })}
                  <Link
                    to="/curriculum"
                    className="block text-center text-xs text-violet-500 hover:text-violet-400 pt-1"
                  >
                    View all modules →
                  </Link>
                </div>
              </div>
            </Section>
          )}

          {/* MIDI status */}
          <Section title="Drum Kit">
            <div className={`rounded-xl border p-4 flex items-center gap-3 ${isConnected ? 'bg-green-900/10 border-green-800/40' : 'bg-[#0d1117] border-[#1e2433]'}`}>
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-400' : 'bg-[#374151]'}`} />
              <div>
                <div className={`text-sm font-medium ${isConnected ? 'text-green-300' : 'text-[#6b7280]'}`}>
                  {isConnected ? deviceName ?? 'Kit connected' : 'No kit connected'}
                </div>
                {!isConnected && (
                  <div className="text-xs text-[#4b5563] mt-0.5">
                    Connect your e-drum via USB, then go to{' '}
                    <Link to="/settings" className="text-violet-500 hover:underline">Settings</Link>
                  </div>
                )}
              </div>
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* AI suggestion */}
          {isConfigured && (
            <Section title="Today's Focus">
              <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-4">
                <div className="flex gap-2 mb-2">
                  <span className="text-violet-500">🤖</span>
                  <span className="text-xs text-[#6b7280]">AI Tutor</span>
                </div>
                {suggestion ? (
                  <p className="text-sm text-[#94a3b8] leading-relaxed">{suggestion}</p>
                ) : (
                  <p className="text-sm text-[#4b5563] animate-pulse">Loading suggestion…</p>
                )}
                <Link
                  to="/chat"
                  className="block mt-3 text-xs text-violet-500 hover:text-violet-400"
                >
                  Ask your tutor a question →
                </Link>
              </div>
            </Section>
          )}

          {/* Skill profile */}
          <Section title="Skill Profile">
            <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-4">
              <SkillBars profile={progress.skillProfile} />
            </div>
          </Section>

          {/* Recent results */}
          {recentResults.length > 0 && (
            <Section title="Recent Practice">
              <div className="space-y-2">
                {recentResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#0d1117] border border-[#1e2433] rounded-lg px-3 py-2">
                    <div>
                      <div className="text-xs text-[#94a3b8]">{r.exerciseId.replace(/-/g, ' ')}</div>
                      <div className="text-xs text-[#4b5563]">{r.bpm} BPM</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{r.score}</div>
                      <StarRating stars={r.stars} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  highlight,
}: {
  icon: string
  value: string | number
  label: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'bg-[#13101e] border-violet-900/40' : 'bg-[#0d1117] border-[#1e2433]'}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-[#6b7280]">{label}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-medium text-[#4b5563] uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  )
}
