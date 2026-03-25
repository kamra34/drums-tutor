import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CURRICULUM } from '../data/curriculum'
import { useUserStore } from '../stores/useUserStore'
import StarRating from '../components/shared/StarRating'
import { Module } from '../types/curriculum'

export default function CurriculumPage() {
  const { progress, getBestResult } = useUserStore()
  const location = useLocation()
  // Allow breadcrumb links to pass which module to expand
  const initialModule = (location.state as { expandModule?: string } | null)?.expandModule
    ?? progress.currentModule
  const [expandedModule, setExpandedModule] = useState<string | null>(initialModule)

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Curriculum</h1>
        <p className="text-[#6b7280]">Your complete learning path from beginner to advanced.</p>
      </div>

      <div className="space-y-4">
        {CURRICULUM.map((module, idx) => {
          const isUnlocked = isModuleUnlocked(module, progress.completedLessons, CURRICULUM)
          const expanded = expandedModule === module.id
          const lessonsDone = module.lessons.filter((l) =>
            progress.completedLessons.includes(l.id)
          ).length
          const progressPct = module.lessons.length > 0
            ? Math.round((lessonsDone / module.lessons.length) * 100)
            : 0

          return (
            <div
              key={module.id}
              className={`rounded-xl border overflow-hidden ${
                !isUnlocked
                  ? 'opacity-50 border-[#1e2433]'
                  : 'border-[#1e2433] hover:border-[#2d3748]'
              }`}
            >
              {/* Module header */}
              <button
                onClick={() => isUnlocked && setExpandedModule(expanded ? null : module.id)}
                disabled={!isUnlocked}
                className="w-full flex items-center gap-4 p-4 bg-[#0d1117] text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-[#1a1030] flex items-center justify-center text-violet-500 font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-semibold truncate">{module.name}</span>
                    {!isUnlocked && <span className="text-xs text-[#4b5563]">🔒 Locked</span>}
                    {isUnlocked && lessonsDone === module.lessons.length && module.lessons.length > 0 && (
                      <span className="text-xs text-green-500">✓ Complete</span>
                    )}
                  </div>
                  <div className="text-sm text-[#6b7280] truncate">{module.description}</div>
                  {isUnlocked && module.lessons.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-[#1e2433] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-600 rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#4b5563] flex-shrink-0">
                        {lessonsDone}/{module.lessons.length} lessons
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[#4b5563] text-sm">{expanded ? '▲' : '▼'}</span>
              </button>

              {/* Expanded content */}
              {expanded && isUnlocked && (
                <div className="border-t border-[#1e2433] divide-y divide-[#1e2433]">
                  {module.lessons.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-medium text-[#4b5563] uppercase tracking-wider mb-3">
                        Lessons
                      </h3>
                      <div className="space-y-1">
                        {module.lessons.map((lesson) => {
                          const done = progress.completedLessons.includes(lesson.id)
                          return (
                            <Link
                              key={lesson.id}
                              to={`/lesson/${module.id}/${lesson.id}`}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#13101e] transition-colors group"
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${done ? 'bg-violet-600 text-white' : 'bg-[#1e2433] text-[#4b5563] group-hover:bg-[#2d3748]'}`}>
                                {done ? '✓' : lesson.order + 1}
                              </span>
                              <span className={`text-sm flex-1 ${done ? 'text-[#4b5563] line-through' : 'text-[#e2e8f0]'}`}>
                                {lesson.title}
                              </span>
                              <span className="text-[#374151] text-xs opacity-0 group-hover:opacity-100">→</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {module.exercises.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-medium text-[#4b5563] uppercase tracking-wider mb-3">
                        Exercises
                      </h3>
                      <div className="space-y-2">
                        {module.exercises.map((exercise) => {
                          const best = getBestResult(exercise.id)
                          return (
                            <Link
                              key={exercise.id}
                              to={`/exercise/${module.id}/${exercise.id}`}
                              className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] hover:bg-[#13101e] border border-[#1e2433] hover:border-violet-900/50 transition-all group"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-[#e2e8f0] font-medium truncate">
                                  {exercise.title}
                                </div>
                                <div className="text-xs text-[#6b7280] mt-0.5">
                                  {exercise.targetBpm} BPM · {exercise.timeSignature.join('/')} · {exercise.bars} bar{exercise.bars > 1 ? 's' : ''}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {best ? (
                                  <>
                                    <div className="text-sm font-semibold text-white">{best.score}</div>
                                    <StarRating stars={best.stars} size="sm" />
                                  </>
                                ) : (
                                  <span className="text-xs text-[#374151]">Not tried</span>
                                )}
                              </div>
                              <span className="text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
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

  const allLessonsDone = requiredModule.lessons.every((l) =>
    completedLessons.includes(l.id)
  )
  return allLessonsDone
}
