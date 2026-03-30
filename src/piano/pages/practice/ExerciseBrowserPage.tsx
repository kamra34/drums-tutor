import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CURRICULUM } from '@piano/data/curriculum'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'
import { useAuthStore } from '@shared/stores/useAuthStore'
import type { Module, Exercise } from '@piano/types/curriculum'

const accent = '#a78bfa'

function isModuleUnlocked(module: Module, completedLessons: string[], curriculum: Module[]): boolean {
  const req = module.unlockRequirements
  if (!req.requiredModuleComplete) return true
  const requiredModule = curriculum.find(m => m.id === req.requiredModuleComplete)
  if (!requiredModule) return true
  return requiredModule.lessons.every(l => completedLessons.includes(l.id))
}

const TYPE_ICONS: Record<string, string> = {
  'scale': '🎼',
  'chord-progression': '🎹',
  'melody': '🎵',
  'technique': '✋',
  'sight-reading': '👁',
}

const DIFF_COLORS = ['', '#22c55e', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ef4444', '#dc2626', '#dc2626']

export default function ExerciseBrowserPage() {
  const { progress, getBestResult } = usePianoProgressStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const [filter, setFilter] = useState<string>('all')
  const [expandedModule, setExpandedModule] = useState<string | null>(null)

  const allExercises = CURRICULUM.flatMap(m => m.exercises)
  const completedCount = allExercises.filter(e => getBestResult(e.id)).length

  // Filter types
  const types = ['all', 'scale', 'chord-progression', 'melody', 'technique', 'sight-reading']

  return (
    <div className="p-4 lg:p-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link to="/piano/practice" className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center transition-all">
          <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Curriculum Exercises</h1>
          <p className="text-xs text-[#6b7280]">{completedCount}/{allExercises.length} completed</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer"
            style={{
              background: filter === t ? `${accent}15` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${filter === t ? `${accent}30` : 'rgba(255,255,255,0.04)'}`,
              color: filter === t ? accent : '#6b7280',
            }}>
            {t === 'all' ? 'All types' : `${TYPE_ICONS[t] || ''} ${t.replace('-', ' ')}`}
          </button>
        ))}
      </div>

      {/* Modules */}
      <div className="space-y-3">
        {CURRICULUM.map(module => {
          const unlocked = isAdmin || isModuleUnlocked(module, progress.completedLessons, CURRICULUM)
          const exercises = filter === 'all'
            ? module.exercises
            : module.exercises.filter(e => e.exerciseType === filter)
          if (exercises.length === 0) return null

          const expanded = expandedModule === module.id
          const completedInModule = module.exercises.filter(e => getBestResult(e.id)).length
          const lessonsDone = module.lessons.filter(l => progress.completedLessons.includes(l.id)).length
          const moduleComplete = lessonsDone === module.lessons.length

          return (
            <div key={module.id} className="rounded-xl border border-white/[0.04] overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
              {/* Module header */}
              <button onClick={() => setExpandedModule(expanded ? null : module.id)}
                className="w-full px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] transition-all">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{
                    background: unlocked ? `${accent}12` : 'rgba(255,255,255,0.03)',
                    color: unlocked ? accent : '#374151',
                    border: `1px solid ${unlocked ? `${accent}20` : 'rgba(255,255,255,0.04)'}`,
                  }}>
                  {unlocked ? module.order : '🔒'}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{module.name}</div>
                  <div className="text-[10px] text-[#4b5563]">
                    {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                    {completedInModule > 0 && ` · ${completedInModule} done`}
                  </div>
                </div>
                {/* Progress */}
                {unlocked && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${module.exercises.length > 0 ? (completedInModule / module.exercises.length) * 100 : 0}%`,
                        background: accent,
                      }} />
                    </div>
                  </div>
                )}
                <svg className={`w-4 h-4 text-[#4b5563] transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Exercise list */}
              {expanded && (
                <div className="border-t border-white/[0.04] px-2 py-2 space-y-1">
                  {!unlocked && (
                    <div className="px-3 py-4 text-center">
                      <div className="text-2xl mb-2">🔒</div>
                      <div className="text-sm text-[#6b7280]">Complete <span className="text-[#94a3b8] font-medium">{module.name}</span> lessons to unlock</div>
                      <Link to="/piano/curriculum" className="text-[11px] font-medium mt-2 inline-block" style={{ color: accent }}>
                        Go to curriculum →
                      </Link>
                    </div>
                  )}
                  {unlocked && exercises.map(exercise => {
                    const best = getBestResult(exercise.id)
                    const dc = DIFF_COLORS[exercise.difficulty] || '#6b7280'
                    return (
                      <Link key={exercise.id}
                        to={`/piano/exercise/${module.id}/${exercise.id}?from=practice`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-all">
                        <span className="text-lg w-7 text-center">{TYPE_ICONS[exercise.exerciseType] || '🎵'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] text-[#e2e8f0] font-medium truncate">{exercise.title}</div>
                          <div className="text-[10px] text-[#4b5563] flex items-center gap-1.5 mt-0.5">
                            <span className="capitalize">{exercise.exerciseType.replace('-', ' ')}</span>
                            <span className="w-1 h-1 rounded-full bg-[#2d3748]" />
                            <span>{exercise.handsRequired === 'both' ? 'Both' : exercise.handsRequired === 'right' ? 'RH' : 'LH'}</span>
                            <span className="w-1 h-1 rounded-full bg-[#2d3748]" />
                            <span style={{ color: dc }}>Lvl {exercise.difficulty}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {best ? (
                            <span className="text-xs font-bold" style={{ color: best.score >= 80 ? '#22c55e' : best.score >= 60 ? '#eab308' : '#f97316' }}>
                              {best.score}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#374151]">New</span>
                          )}
                          <svg className="w-3.5 h-3.5 text-[#374151]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
