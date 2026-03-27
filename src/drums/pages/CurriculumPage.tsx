import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CURRICULUM } from '@drums/data/curriculum'
import { useUserStore } from '@shared/stores/useUserStore'
import { useAuthStore } from '@shared/stores/useAuthStore'
import { Module } from '@drums/types/curriculum'

export default function CurriculumPage() {
  const { progress, getBestResult } = useUserStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const location = useLocation()
  const initialModule = (location.state as { expandModule?: string } | null)?.expandModule ?? null
  const [expandedModule, setExpandedModule] = useState<string | null>(initialModule)

  const totalLessons = CURRICULUM.reduce((n, m) => n + m.lessons.length, 0)
  const totalDone = progress.completedLessons.length
  const totalPct = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-3xl p-8 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(15,12,8,0.9) 0%, rgba(10,14,22,0.9) 50%, rgba(15,12,8,0.8) 100%)',
      }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
        }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Curriculum</h1>
            <p className="text-[#6b7280]">Your complete learning path from beginner to advanced.</p>
            {isAdmin && (
              <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-widest text-amber-500/70 bg-amber-500/10 px-2 py-0.5 rounded-md">
                Admin — all unlocked
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <MiniProgressRing percent={totalPct} />
            <div>
              <div className="text-2xl font-extrabold text-white">{totalDone}<span className="text-[#4b5563] text-base font-medium">/{totalLessons}</span></div>
              <div className="text-xs text-[#4b5563]">lessons completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Module list */}
      <div className="space-y-3">
        {CURRICULUM.map((module, idx) => {
          const isUnlocked = isAdmin || isModuleUnlocked(module, progress.completedLessons, CURRICULUM)
          const expanded = expandedModule === module.id
          const lessonsDone = module.lessons.filter(l => progress.completedLessons.includes(l.id)).length
          const isComplete = lessonsDone === module.lessons.length && module.lessons.length > 0
          const progressPct = module.lessons.length > 0 ? Math.round((lessonsDone / module.lessons.length) * 100) : 0

          return (
            <div
              key={module.id}
              className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                !isUnlocked
                  ? 'opacity-40 border-white/[0.03]'
                  : expanded
                    ? 'border-amber-500/15'
                    : 'border-white/[0.04] hover:border-white/[0.08]'
              }`}
              style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
            >
              {/* Module header */}
              <button
                onClick={() => isUnlocked && setExpandedModule(expanded ? null : module.id)}
                disabled={!isUnlocked}
                className="w-full flex items-center gap-4 p-5 text-left cursor-pointer group"
              >
                {/* Number badge */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                  isComplete
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : expanded
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-white/[0.04] text-[#4b5563] group-hover:text-amber-400 group-hover:bg-amber-500/10'
                }`}>
                  {isComplete ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : !isUnlocked ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : idx + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-semibold truncate">{module.name}</span>
                    {isComplete && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Complete
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[#6b7280] truncate">{module.description}</div>

                  {/* Progress bar */}
                  {isUnlocked && module.lessons.length > 0 && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progressPct}%`,
                            background: isComplete
                              ? 'linear-gradient(90deg, #10b981, #34d399)'
                              : 'linear-gradient(90deg, #f59e0b, #ea580c)',
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-[#4b5563] flex-shrink-0 tabular-nums">
                        {lessonsDone}/{module.lessons.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Chevron */}
                {isUnlocked && (
                  <svg
                    className={`w-5 h-5 text-[#374151] flex-shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Expanded content */}
              {expanded && isUnlocked && (
                <div className="px-5 pb-5 pt-0">
                  <div className="border-t border-white/[0.04] pt-4">

                    {/* Lessons */}
                    {module.lessons.length > 0 && (
                      <div className="mb-5">
                        <SectionLabel>Lessons</SectionLabel>
                        <div className="mt-2 space-y-1">
                          {module.lessons.map((lesson) => {
                            const done = progress.completedLessons.includes(lesson.id)
                            return (
                              <Link
                                key={lesson.id}
                                to={`/lesson/${module.id}/${lesson.id}`}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all group"
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${
                                  done
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-white/[0.05] text-[#4b5563] group-hover:text-amber-400 group-hover:bg-amber-500/10'
                                }`}>
                                  {done ? (
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : lesson.order + 1}
                                </span>
                                <span className={`text-sm flex-1 ${done ? 'text-[#4b5563] line-through' : 'text-[#e2e8f0]'}`}>
                                  {lesson.title}
                                </span>
                                <svg className="w-4 h-4 text-[#2d3748] group-hover:text-amber-500/60 transition-all opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Exercises */}
                    {module.exercises.length > 0 && (
                      <div>
                        <SectionLabel>Exercises</SectionLabel>
                        <div className="mt-2 space-y-2">
                          {module.exercises.map((exercise) => {
                            const best = getBestResult(exercise.id)
                            return (
                              <Link
                                key={exercise.id}
                                to={`/exercise/${module.id}/${exercise.id}`}
                                className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-amber-500/15 hover:bg-amber-500/[0.03] transition-all group"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-[#e2e8f0] font-medium truncate">{exercise.title}</div>
                                  <div className="text-xs text-[#4b5563] mt-0.5 flex items-center gap-2">
                                    <span>{exercise.targetBpm} BPM</span>
                                    <span className="w-1 h-1 rounded-full bg-[#2d3748]" />
                                    <span>{exercise.timeSignature.join('/')}</span>
                                    <span className="w-1 h-1 rounded-full bg-[#2d3748]" />
                                    <span>{exercise.bars} bar{exercise.bars > 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  {best ? (
                                    <div className="flex items-center gap-2">
                                      <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map(s => (
                                          <svg key={s} className={`w-3 h-3 ${s <= best.stars ? 'text-amber-400' : 'text-[#1e2433]'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                        ))}
                                      </div>
                                      <span className="text-sm font-bold text-white">{best.score}%</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-[#2d3748] group-hover:text-[#4b5563] transition-colors">Not tried</span>
                                  )}
                                </div>
                                <svg className="w-4 h-4 text-[#2d3748] group-hover:text-amber-500/60 transition-all opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">{children}</span>
}

function MiniProgressRing({ percent }: { percent: number }) {
  const r = 24
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <div className="relative w-14 h-14">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3.5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="url(#curr-ring)" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <defs>
          <linearGradient id="curr-ring" x1="0" y1="0" x2="56" y2="56">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{percent}%</span>
      </div>
    </div>
  )
}

function isModuleUnlocked(
  module: Module,
  completedLessons: string[],
  curriculum: Module[]
): boolean {
  const req = module.unlockRequirements
  if (!req.requiredModuleComplete) return true
  const requiredModule = curriculum.find((m) => m.id === req.requiredModuleComplete)
  if (!requiredModule) return true
  return requiredModule.lessons.every((l) => completedLessons.includes(l.id))
}
