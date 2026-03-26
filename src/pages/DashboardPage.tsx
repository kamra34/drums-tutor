import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../stores/useUserStore'
import { useAiStore } from '../stores/useAiStore'
import { useMidiStore } from '../stores/useMidiStore'
import { aiService } from '../services/aiService'
import { CURRICULUM } from '../data/curriculum'
import { SkillProfile } from '../types/curriculum'

export default function DashboardPage() {
  const { progress, totalPracticeTime, practiceStreak } = useUserStore()
  const { suggestion, setSuggestion, isConfigured } = useAiStore()
  const { isConnected } = useMidiStore()

  const currentModule = CURRICULUM.find((m) => m.id === progress.currentModule)
  const completedLessons = progress.completedLessons.length
  const totalLessons = CURRICULUM.reduce((n, m) => n + m.lessons.length, 0)
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  const recentResults = [...progress.exerciseResults].reverse().slice(0, 5)

  useEffect(() => {
    if (!isConfigured || suggestion) return
    aiService.getDailySuggestion(progress).then(setSuggestion)
  }, [isConfigured])

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">

      {/* ── Hero greeting with ambient glow ── */}
      <div className="relative mb-8 overflow-hidden rounded-3xl p-8 lg:p-10 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(15,12,8,0.9) 0%, rgba(10,14,22,0.9) 50%, rgba(15,12,8,0.8) 100%)',
      }}>
        {/* Ambient warm glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
        }} />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)',
        }} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-2 tracking-tight">
              Welcome back<span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">.</span>
            </h1>
            <p className="text-[#6b7280] text-base lg:text-lg">
              {practiceStreak > 0
                ? `You're on a ${practiceStreak}-day streak. Keep the rhythm going!`
                : "Ready to build your rhythm? Let's practice."}
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex gap-3">
            <Link
              to="/practice"
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                boxShadow: '0 4px 20px -4px rgba(245,158,11,0.35)',
              }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white">Start Practice</span>
            </Link>
            <Link
              to="/curriculum"
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.07] transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Lessons
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats ribbon ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <GlassStatCard
          icon={<FireIcon />}
          value={practiceStreak}
          unit="days"
          label="Streak"
          glow={practiceStreak > 0}
          glowColor="rgba(245,158,11,0.15)"
        />
        <GlassStatCard
          icon={<ClockIcon />}
          value={totalPracticeTime}
          unit="min"
          label="Total Practice"
        />
        <GlassStatCard
          icon={<BookIcon />}
          value={completedLessons}
          unit={`/ ${totalLessons}`}
          label="Lessons Done"
        />
        <GlassStatCard
          icon={<MidiIcon connected={isConnected} />}
          value={isConnected ? 'ON' : 'OFF'}
          unit=""
          label="MIDI Kit"
          glow={isConnected}
          glowColor="rgba(52,211,153,0.12)"
        />
      </div>

      {/* ── Main grid: 3 columns on large screens ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Column 1: Continue learning ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Current module progress */}
          {currentModule && (
            <GlassCard>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <SectionLabel>Continue Learning</SectionLabel>
                  <h3 className="text-lg font-bold text-white mt-1">{currentModule.name}</h3>
                  <p className="text-sm text-[#6b7280] mt-0.5">{currentModule.description}</p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <ProgressRing percent={progressPct} />
                </div>
              </div>

              <div className="space-y-1.5">
                {currentModule.lessons.slice(0, 4).map((lesson) => {
                  const done = progress.completedLessons.includes(lesson.id)
                  return (
                    <Link
                      key={lesson.id}
                      to={`/lesson/${currentModule.id}/${lesson.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all duration-200 group"
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${
                        done
                          ? 'bg-emerald-500/20 text-emerald-400'
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

              <Link
                to="/curriculum"
                className="flex items-center justify-center gap-1.5 mt-4 pt-4 border-t border-white/[0.04] text-xs font-medium text-[#6b7280] hover:text-amber-400 transition-colors"
              >
                View all modules
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </GlassCard>
          )}

          {/* Recent practice results */}
          {recentResults.length > 0 && (
            <GlassCard>
              <SectionLabel>Recent Practice</SectionLabel>
              <div className="mt-3 space-y-2">
                {recentResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-4 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold bg-gradient-to-b from-amber-400 to-orange-500 bg-clip-text text-transparent">{r.stars}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">
                        {r.exerciseId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </div>
                      <div className="text-xs text-[#4b5563]">{r.bpm} BPM</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-white">{r.score}%</div>
                      <div className="flex gap-0.5 justify-end">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} className={`w-3 h-3 ${s <= r.stars ? 'text-amber-400' : 'text-[#1e2433]'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* ── Column 2: Sidebar widgets ── */}
        <div className="space-y-6">

          {/* AI suggestion */}
          {isConfigured && (
            <GlassCard className="relative overflow-hidden">
              {/* Subtle gradient accent */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/60 via-orange-500/40 to-transparent" />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <SectionLabel>Today's Focus</SectionLabel>
              </div>
              {suggestion ? (
                <p className="text-sm text-[#94a3b8] leading-relaxed">{suggestion}</p>
              ) : (
                <div className="space-y-2">
                  <div className="h-3 bg-white/[0.04] rounded-full w-full animate-pulse" />
                  <div className="h-3 bg-white/[0.04] rounded-full w-3/4 animate-pulse" />
                </div>
              )}
              <Link
                to="/chat"
                className="flex items-center gap-1.5 mt-4 text-xs font-medium text-amber-500/80 hover:text-amber-400 transition-colors"
              >
                Ask your AI tutor
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </GlassCard>
          )}

          {/* Skill radar */}
          <GlassCard>
            <SectionLabel>Skill Profile</SectionLabel>
            <div className="mt-4">
              <SkillRadar profile={progress.skillProfile} />
            </div>
          </GlassCard>

          {/* Quick links */}
          <GlassCard>
            <SectionLabel>Quick Start</SectionLabel>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { to: '/practice/beats', label: 'Beats', icon: '🥁' },
                { to: '/practice/rudiments', label: 'Rudiments', icon: '🔄' },
                { to: '/practice/reading', label: 'Reading', icon: '👁' },
                { to: '/practice/freeplay', label: 'Free Play', icon: '🎵' },
              ].map(q => (
                <Link
                  key={q.to}
                  to={q.to}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-amber-500/[0.05] hover:border-amber-500/10 transition-all duration-200 group"
                >
                  <span className="text-xl">{q.icon}</span>
                  <span className="text-xs text-[#6b7280] group-hover:text-amber-400 transition-colors font-medium">{q.label}</span>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

// ── Shared components ─────────────────────────────────────────────────────────

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 border border-white/[0.04] ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
      }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">{children}</span>
  )
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 28
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <div className="relative w-16 h-16">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="url(#ring-grad)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white">{percent}%</span>
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function GlassStatCard({ icon, value, unit, label, glow, glowColor }: {
  icon: React.ReactNode; value: string | number; unit: string; label: string; glow?: boolean; glowColor?: string
}) {
  return (
    <div
      className="relative rounded-2xl p-4 border border-white/[0.04] overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
    >
      {glow && glowColor && (
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none" style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        }} />
      )}
      <div className="relative z-10">
        <div className="mb-3">{icon}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold text-white tracking-tight">{value}</span>
          {unit && <span className="text-sm text-[#4b5563] font-medium">{unit}</span>}
        </div>
        <div className="text-xs text-[#4b5563] mt-0.5 font-medium">{label}</div>
      </div>
    </div>
  )
}

// ── Skill radar chart (pure SVG) ──────────────────────────────────────────────

function SkillRadar({ profile }: { profile: SkillProfile }) {
  const skills = [
    { key: 'timing' as const, label: 'Timing', color: '#f59e0b' },
    { key: 'dynamics' as const, label: 'Dynamics', color: '#3b82f6' },
    { key: 'independence' as const, label: 'Indep.', color: '#06b6d4' },
    { key: 'speed' as const, label: 'Speed', color: '#10b981' },
    { key: 'musicality' as const, label: 'Music.', color: '#ec4899' },
  ]

  const cx = 80, cy = 80, maxR = 60
  const n = skills.length
  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2

  // Points for the data polygon
  const dataPoints = skills.map((s, i) => {
    const angle = startAngle + i * angleStep
    const r = (profile[s.key] / 100) * maxR
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  // Grid rings
  const rings = [20, 40, 60, 80, 100]

  return (
    <svg viewBox="0 0 160 170" className="w-full max-w-[220px] mx-auto">
      {/* Grid rings */}
      {rings.map(pct => {
        const r = (pct / 100) * maxR
        const pts = Array.from({ length: n }, (_, i) => {
          const angle = startAngle + i * angleStep
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
        }).join(' ')
        return <polygon key={pct} points={pts} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      })}

      {/* Axis lines */}
      {skills.map((_, i) => {
        const angle = startAngle + i * angleStep
        const x2 = cx + maxR * Math.cos(angle)
        const y2 = cy + maxR * Math.sin(angle)
        return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      })}

      {/* Data area */}
      <path d={dataPath} fill="url(#radar-fill)" stroke="url(#radar-stroke)" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={skills[i].color} stroke="#06080d" strokeWidth="1.5" />
      ))}

      {/* Labels */}
      {skills.map((s, i) => {
        const angle = startAngle + i * angleStep
        const labelR = maxR + 14
        const lx = cx + labelR * Math.cos(angle)
        const ly = cy + labelR * Math.sin(angle)
        return (
          <text key={s.key} x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
            fill="#6b7280" fontSize="8" fontWeight="500" fontFamily="system-ui">
            {s.label}
          </text>
        )
      })}

      <defs>
        <linearGradient id="radar-fill" x1="0" y1="0" x2="160" y2="160">
          <stop offset="0%" stopColor="rgba(245,158,11,0.15)" />
          <stop offset="100%" stopColor="rgba(234,88,12,0.08)" />
        </linearGradient>
        <linearGradient id="radar-stroke" x1="0" y1="0" x2="160" y2="160">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── Icon components ───────────────────────────────────────────────────────────

function FireIcon() {
  return (
    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
      </svg>
    </div>
  )
}

function ClockIcon() {
  return (
    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}

function BookIcon() {
  return (
    <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
      <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </div>
  )
}

function MidiIcon({ connected }: { connected: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${connected ? 'bg-emerald-500/10' : 'bg-white/[0.04]'}`}>
      <svg className={`w-4 h-4 ${connected ? 'text-emerald-400' : 'text-[#4b5563]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
  )
}
