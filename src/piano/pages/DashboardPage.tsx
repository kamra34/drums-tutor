import { Link } from 'react-router-dom'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'
import { CURRICULUM } from '@piano/data/curriculum'

export default function PianoDashboardPage() {
  const { progress, totalPracticeTime, practiceStreak } = usePianoProgressStore()

  const completedLessons = progress.completedLessons.length
  const totalLessons = CURRICULUM.reduce((n, m) => n + m.lessons.length, 0)
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Find current module (first incomplete one)
  const currentModule = CURRICULUM.find(m =>
    m.lessons.some(l => !progress.completedLessons.includes(l.id))
  ) ?? CURRICULUM[CURRICULUM.length - 1]

  const currentModuleLessons = currentModule.lessons.length
  const currentModuleDone = currentModule.lessons.filter(l => progress.completedLessons.includes(l.id)).length
  const currentModulePct = currentModuleLessons > 0 ? Math.round((currentModuleDone / currentModuleLessons) * 100) : 0

  // Next lesson to continue
  const nextLesson = currentModule.lessons
    .sort((a, b) => a.order - b.order)
    .find(l => !progress.completedLessons.includes(l.id))

  // Skill profile
  const sp = progress.skillProfile
  const skills = [
    { name: 'Note Reading', value: sp.noteReading, icon: '🎼' },
    { name: 'Rhythm', value: sp.rhythm, icon: '🥁' },
    { name: 'Technique', value: sp.technique, icon: '✋' },
    { name: 'Coordination', value: sp.handsCoordination, icon: '🤲' },
    { name: 'Musicality', value: sp.musicality, icon: '🎵' },
  ]

  const accent = '#a78bfa'
  const accentSec = '#8b5cf6'

  // Modules completed count
  const modulesCompleted = CURRICULUM.filter(m =>
    m.lessons.every(l => progress.completedLessons.includes(l.id))
  ).length

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto">

      {/* ── Hero ── */}
      <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(12,10,20,0.9) 0%, rgba(10,12,22,0.9) 50%, rgba(14,10,20,0.8) 100%)',
      }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none" style={{
          background: `radial-gradient(circle, ${accent}14 0%, transparent 70%)`,
        }} />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full pointer-events-none" style={{
          background: `radial-gradient(circle, ${accentSec}0a 0%, transparent 70%)`,
        }} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2 tracking-tight">
              {completedLessons === 0
                ? <>Ready to play<span style={{ color: accent }}>?</span></>
                : <>Welcome back<span style={{ color: accent }}>.</span></>
              }
            </h1>
            <p className="text-[#6b7280] text-sm sm:text-base lg:text-lg max-w-lg">
              {practiceStreak > 0
                ? `${practiceStreak}-day streak! Consistency is the key to mastery.`
                : completedLessons === 0
                ? "Your piano journey starts here. Let's learn your first notes."
                : "Pick up where you left off — every session counts."
              }
            </p>

            {/* Continue button */}
            {nextLesson && (
              <Link
                to={`/piano/lesson/${currentModule.id}/${nextLesson.id}`}
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accentSec})`, boxShadow: `0 4px 24px -4px ${accent}40` }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                </svg>
                {completedLessons === 0 ? 'Start First Lesson' : 'Continue Learning'}
              </Link>
            )}
          </div>

          {/* Progress ring */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <ProgressRing percent={progressPct} />
            <div>
              <div className="text-3xl font-extrabold text-white">{completedLessons}<span className="text-[#4b5563] text-lg font-medium">/{totalLessons}</span></div>
              <div className="text-xs text-[#4b5563]">lessons completed</div>
              <div className="text-xs text-[#374151] mt-0.5">{modulesCompleted}/{CURRICULUM.length} modules</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
        {[
          { label: 'Current Module', value: currentModule.name, sub: `${currentModuleDone}/${currentModuleLessons} lessons`, icon: '📖' },
          { label: 'Practice Time', value: totalPracticeTime > 60 ? `${Math.round(totalPracticeTime / 60)}h` : `${totalPracticeTime}m`, sub: 'total practice', icon: '⏱' },
          { label: 'Streak', value: `${practiceStreak}`, sub: practiceStreak === 1 ? 'day' : 'days', icon: '🔥' },
          { label: 'Progress', value: `${progressPct}%`, sub: 'curriculum', icon: '📈' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4 border border-white/[0.04] overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
          }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-[10px] uppercase tracking-wider text-[#4b5563] font-semibold">{stat.label}</span>
            </div>
            <div className="text-xl font-bold text-white truncate">{stat.value}</div>
            <div className="text-[11px] text-[#4b5563]">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: Current module progress + Quick links ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Current module progress */}
          <div className="rounded-2xl p-5 border border-white/[0.04]" style={{
            background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
          }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Current Module</h2>
              <Link to="/piano/curriculum" className="text-[10px] uppercase tracking-wider font-medium transition-colors" style={{ color: `${accent}99` }}>
                View all →
              </Link>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: `${accent}15`, color: accent }}>
                {currentModule.order}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{currentModule.name}</div>
                <div className="text-xs text-[#4b5563]">{currentModule.description}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{
                  width: `${currentModulePct}%`,
                  background: `linear-gradient(90deg, ${accent}, ${accentSec})`,
                }} />
              </div>
              <span className="text-xs text-[#4b5563] flex-shrink-0 tabular-nums font-medium">{currentModulePct}%</span>
            </div>

            {/* Lesson list (next 5) */}
            <div className="space-y-1">
              {currentModule.lessons.sort((a, b) => a.order - b.order).slice(0, 5).map(lesson => {
                const done = progress.completedLessons.includes(lesson.id)
                const isNext = lesson.id === nextLesson?.id
                return (
                  <Link
                    key={lesson.id}
                    to={`/piano/lesson/${currentModule.id}/${lesson.id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all group ${isNext ? '' : 'hover:bg-white/[0.03]'}`}
                    style={isNext ? { background: `${accent}10`, border: `1px solid ${accent}20` } : undefined}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
                      done ? 'bg-emerald-500/15 text-emerald-400'
                        : isNext ? 'text-white' : 'bg-white/[0.05] text-[#4b5563]'
                    }`}
                    style={isNext ? { background: `${accent}25`, color: accent } : undefined}
                    >
                      {done ? '✓' : lesson.order + 1}
                    </span>
                    <span className={`text-sm flex-1 truncate ${done ? 'text-[#4b5563] line-through' : isNext ? 'text-white font-medium' : 'text-[#94a3b8]'}`}>
                      {lesson.title}
                    </span>
                    {isNext && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${accent}20`, color: accent }}>
                        Next
                      </span>
                    )}
                  </Link>
                )
              })}
              {currentModule.lessons.length > 5 && (
                <Link to="/piano/curriculum" className="block text-center text-xs py-2 transition-colors" style={{ color: `${accent}80` }}>
                  +{currentModule.lessons.length - 5} more lessons
                </Link>
              )}
            </div>
          </div>

          {/* Quick access */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: '/piano/curriculum', icon: '📚', label: 'Curriculum', desc: `${completedLessons}/${totalLessons} lessons` },
              { to: '/piano/practice', icon: '🎹', label: 'Practice', desc: 'Scales & exercises' },
              { to: '/piano/chat', icon: '🤖', label: 'Ask Clara', desc: 'AI piano tutor' },
              { to: '/settings', icon: '⚙️', label: 'Settings', desc: 'API key & profile' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="group rounded-2xl p-4 border border-white/[0.04] transition-all hover:border-white/[0.08] hover:bg-white/[0.02]"
                style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.5) 0%, rgba(10,12,18,0.6) 100%)' }}
              >
                <span className="text-2xl block mb-2">{link.icon}</span>
                <div className="text-sm font-medium text-white">{link.label}</div>
                <div className="text-[10px] text-[#4b5563]">{link.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Right column: Skills + tips ── */}
        <div className="space-y-6">

          {/* Skill profile */}
          <div className="rounded-2xl p-5 border border-white/[0.04]" style={{
            background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
          }}>
            <h2 className="text-sm font-semibold text-white mb-4">Skill Profile</h2>
            <div className="space-y-3">
              {skills.map(skill => (
                <div key={skill.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#94a3b8] flex items-center gap-1.5">
                      <span>{skill.icon}</span>
                      {skill.name}
                    </span>
                    <span className="text-xs font-mono tabular-nums" style={{ color: skill.value > 0 ? accent : '#374151' }}>
                      {skill.value}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(skill.value, 2)}%`,
                        background: skill.value > 0 ? `linear-gradient(90deg, ${accent}, ${accentSec})` : '#1e2433',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {completedLessons === 0 && (
              <p className="text-[11px] text-[#374151] mt-4 text-center">
                Complete lessons and exercises to build your skill profile
              </p>
            )}
          </div>

          {/* Learning path overview */}
          <div className="rounded-2xl p-5 border border-white/[0.04]" style={{
            background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
          }}>
            <h2 className="text-sm font-semibold text-white mb-3">Learning Path</h2>
            <div className="space-y-2">
              {CURRICULUM.map(m => {
                const mDone = m.lessons.filter(l => progress.completedLessons.includes(l.id)).length
                const mTotal = m.lessons.length
                const complete = mDone === mTotal && mTotal > 0
                const isCurrent = m.id === currentModule.id
                return (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{
                        background: complete ? 'rgba(16,185,129,0.15)' : isCurrent ? `${accent}20` : '#1e2433',
                        color: complete ? '#34d399' : isCurrent ? accent : '#4b5563',
                      }}
                    >
                      {complete ? '✓' : m.order}
                    </span>
                    <span className={`text-xs flex-1 truncate ${complete ? 'text-[#4b5563] line-through' : isCurrent ? 'text-white' : 'text-[#4b5563]'}`}>
                      {m.name}
                    </span>
                    <span className="text-[10px] tabular-nums" style={{ color: complete ? '#34d399' : isCurrent ? accent : '#374151' }}>
                      {mDone}/{mTotal}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Progress ring ───────────────────────────────────────────────────────────

function ProgressRing({ percent }: { percent: number }) {
  const r = 28
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <div className="relative w-[72px] h-[72px]">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="url(#piano-dash-ring)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <defs>
          <linearGradient id="piano-dash-ring" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white">{percent}%</span>
      </div>
    </div>
  )
}
