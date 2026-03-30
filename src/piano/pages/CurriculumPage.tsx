import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CURRICULUM } from '@piano/data/curriculum'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'
import { useAuthStore } from '@shared/stores/useAuthStore'
import type { Module } from '@piano/types/curriculum'

export default function CurriculumPage() {
  const { progress, getBestResult } = usePianoProgressStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const location = useLocation()
  const initialModule = (location.state as { expandModule?: string } | null)?.expandModule ?? null
  const [expandedModule, setExpandedModule] = useState<string | null>(initialModule)

  const totalLessons = CURRICULUM.reduce((n, m) => n + m.lessons.length, 0)
  const totalDone = progress.completedLessons.length
  const totalPct = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0

  const accent = '#a78bfa'

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-3xl p-8 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(12,10,18,0.9) 0%, rgba(10,12,20,0.9) 50%, rgba(12,10,18,0.8) 100%)',
      }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)',
        }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Piano Curriculum</h1>
            <p className="text-[#6b7280]">Your complete learning path — from first notes to playing songs.</p>
            {isAdmin && (
              <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-widest text-violet-400/70 bg-violet-500/10 px-2 py-0.5 rounded-md">
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
                    ? 'border-violet-500/15'
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                  isComplete
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : expanded
                      ? 'bg-violet-500/15 text-violet-400'
                      : 'bg-white/[0.04] text-[#4b5563] group-hover:text-violet-400 group-hover:bg-violet-500/10'
                }`}>
                  {isComplete ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : !isUnlocked ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : idx}
                </div>

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

                  {isUnlocked && module.lessons.length > 0 && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progressPct}%`,
                            background: isComplete
                              ? 'linear-gradient(90deg, #10b981, #34d399)'
                              : 'linear-gradient(90deg, #a78bfa, #8b5cf6)',
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-[#4b5563] flex-shrink-0 tabular-nums">
                        {lessonsDone}/{module.lessons.length}
                      </span>
                    </div>
                  )}
                </div>

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
                    {module.lessons.length > 0 && (
                      <div className="mb-5">
                        <SectionLabel>Lessons</SectionLabel>
                        <div className="mt-2 space-y-1">
                          {module.lessons.map((lesson) => {
                            const done = progress.completedLessons.includes(lesson.id)
                            return (
                              <Link
                                key={lesson.id}
                                to={`/piano/lesson/${module.id}/${lesson.id}`}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all group"
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${
                                  done
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-white/[0.05] text-[#4b5563] group-hover:text-violet-400 group-hover:bg-violet-500/10'
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
                                <svg className="w-4 h-4 text-[#2d3748] group-hover:text-violet-500/60 transition-all opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {module.exercises.length > 0 && (
                      <div>
                        <SectionLabel>Exercises</SectionLabel>
                        <div className="mt-2 space-y-2">
                          {module.exercises.map((exercise) => {
                            const best = getBestResult(exercise.id)
                            return (
                              <div
                                key={exercise.id}
                                className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.03] transition-all"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-[#e2e8f0] font-medium truncate">{exercise.title}</div>
                                  <div className="text-xs text-[#4b5563] mt-0.5 flex items-center gap-2">
                                    <span className="capitalize">{exercise.exerciseType.replace('-', ' ')}</span>
                                    <span className="w-1 h-1 rounded-full bg-[#2d3748]" />
                                    <span>{exercise.handsRequired === 'both' ? 'Both hands' : exercise.handsRequired === 'right' ? 'RH' : 'LH'}</span>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  {best ? (
                                    <span className="text-sm font-bold text-white">{best.score}%</span>
                                  ) : (
                                    <span className="text-xs text-[#2d3748]">Coming soon</span>
                                  )}
                                </div>
                              </div>
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

      {/* Sources disclaimer */}
      <div className="mt-8 px-5 py-4 rounded-2xl border border-white/[0.04]" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.5) 0%, rgba(10,12,18,0.6) 100%)' }}>
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 mt-0.5 text-[#4b5563] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <div>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              <span className="font-medium text-[#94a3b8]">Curriculum sources:</span>{' '}
              This curriculum follows the pedagogical structure and topic progression of{' '}
              <span className="text-[#94a3b8]">Alfred's Basic Adult Piano Course</span>{' '}
              (Palmer, Manus & Lethco) with supplementary concepts from{' '}
              <span className="text-[#94a3b8]">Faber's Adult Piano Adventures</span>.{' '}
              All lesson content, explanations, quizzes, and interactive visuals are original to HarmonyHub.
              These books are recommended as companion references for further study.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

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
        <circle cx="28" cy="28" r={r} fill="none" stroke="url(#piano-ring)" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <defs>
          <linearGradient id="piano-ring" x1="0" y1="0" x2="56" y2="56">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#8b5cf6" />
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
