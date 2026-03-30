import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMidiStore } from '@drums/stores/useMidiStore'
import { useUserStore } from '@shared/stores/useUserStore'
import { apiListExercises, DbExercise } from '@shared/services/apiClient'

interface PracticeMode {
  id: string
  title: string
  description: string
  icon: string
  to: string
  color: string
  ready: boolean
}

const MODES: PracticeMode[] = [
  {
    id: 'reading',
    title: 'Notation Reading',
    description: 'Read real drum notation on a staff and play along. Progressive difficulty from whole notes to sixteenths with accents.',
    icon: '🎼',
    to: '/drums/practice/reading',
    color: '#7c3aed',
    ready: true,
  },
  {
    id: 'beats',
    title: 'Play-Along Beats',
    description: 'Genre-organized grooves — rock, pop, funk, jazz, latin, metal. Learn real-world beats by difficulty level.',
    icon: '🎸',
    to: '/drums/practice/beats',
    color: '#2563eb',
    ready: true,
  },
  {
    id: 'rudiments',
    title: 'Rudiment Trainer',
    description: 'All PAS rudiments with tempo ladder. Start slow, nail it, speed up. Track your top BPM over time.',
    icon: '🥢',
    to: '/drums/practice/rudiments',
    color: '#059669',
    ready: true,
  },
  {
    id: 'fills',
    title: 'Fill Challenges',
    description: 'Play a groove, then nail the fill. From 1-beat fills to full-bar dynamic fills.',
    icon: '💥',
    to: '/drums/practice/fills',
    color: '#d97706',
    ready: true,
  },
  {
    id: 'ai-daily',
    title: 'AI Daily Practice',
    description: 'Claude analyzes your weak areas and generates a personalized warm-up + exercises for today.',
    icon: '🤖',
    to: '/drums/practice/daily',
    color: '#8b5cf6',
    ready: true,
  },
  {
    id: 'freeplay',
    title: 'Free Play',
    description: 'No target pattern — just play. Get real-time feedback on timing, dynamics, and tempo consistency.',
    icon: '🎯',
    to: '/drums/practice/freeplay',
    color: '#06b6d4',
    ready: true,
  },
  {
    id: 'sight-reading',
    title: 'Sight-Reading',
    description: 'Random notation appears. Read and execute cold — the ultimate real-world skill test.',
    icon: '👁',
    to: '/drums/practice/sight-reading',
    color: '#64748b',
    ready: false,
  },
  {
    id: 'songs',
    title: 'Song Charts',
    description: 'Full song structures with repeats, sections, and dynamics. Learn to play through a whole chart.',
    icon: '📄',
    to: '/drums/practice/songs',
    color: '#64748b',
    ready: false,
  },
]

/* SVG icons for each mode */
function ModeIcon({ id, color }: { id: string; color: string }) {
  const cls = "w-6 h-6"
  switch (id) {
    case 'reading':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
        </svg>
      )
    case 'beats':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 2" />
        </svg>
      )
    case 'rudiments':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h8" />
          <circle cx="18" cy="18" r="2" fill={color} opacity={0.5} />
        </svg>
      )
    case 'fills':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    case 'ai-daily':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5m-4.75-11.396c.251.023.501.05.75.082M12 3v2.25m0 0a2.25 2.25 0 002.25 2.25h1.5m-3.75 0A2.25 2.25 0 019.75 7.5h-1.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l3 3m0 0l3-3m-3 3v-7.5" />
        </svg>
      )
    case 'freeplay':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" fill={color} />
        </svg>
      )
    case 'sight-reading':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    case 'songs':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    default:
      return null
  }
}

export default function PracticeHubPage() {
  const { isConnected } = useMidiStore()
  const { progress } = useUserStore()
  const [myPatterns, setMyPatterns] = useState<DbExercise[]>([])

  useEffect(() => {
    apiListExercises({ category: 'studio' })
      .then(({ exercises }) => setMyPatterns(exercises))
      .catch(() => {})
  }, [])

  const totalResults = progress.exerciseResults.length

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto" style={{ background: '#06080d', minHeight: '100vh' }}>

      {/* ── Hero banner with ambient glow ── */}
      <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(15,12,8,0.9) 0%, rgba(10,14,22,0.9) 50%, rgba(15,12,8,0.8) 100%)',
      }}>
        {/* Ambient warm glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
        }} />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)',
        }} />

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2 tracking-tight">
            Practice Hub<span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">.</span>
          </h1>
          <p className="text-[#6b7280] text-sm sm:text-base lg:text-lg max-w-xl">
            Choose a practice mode. Every mode scores your playing via MIDI.
          </p>
        </div>
      </div>

      {/* ── MIDI Warning ── */}
      {!isConnected && (
        <div
          className="mb-8 rounded-2xl p-5 border border-amber-500/15 flex items-start gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}>
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-400 mb-0.5">No drum kit connected</p>
            <p className="text-sm text-[#6b7280]">
              Connect your e-drum in{' '}
              <Link to="/settings" className="text-amber-400/80 underline underline-offset-2 hover:text-amber-400 transition-colors">Settings</Link>{' '}
              for MIDI scoring. You can still browse and listen to patterns without a kit.
            </p>
          </div>
        </div>
      )}

      {/* ── Section label: Stats ── */}
      <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-3">Overview</div>

      {/* ── Quick stats as glass cards ── */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div
          className="rounded-2xl p-5 border border-white/[0.04] text-center"
          style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
        >
          <div className="text-3xl font-bold text-white mb-1">{totalResults}</div>
          <div className="text-xs text-[#4b5563]">Total exercises played</div>
        </div>
        <div
          className="rounded-2xl p-5 border border-white/[0.04] text-center"
          style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
        >
          <div className="text-3xl font-bold text-white mb-1">{progress.completedLessons.length}</div>
          <div className="text-xs text-[#4b5563]">Lessons completed</div>
        </div>
        <div
          className="rounded-2xl p-5 border border-white/[0.04] text-center"
          style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
        >
          <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-1">{progress.currentModule}</div>
          <div className="text-xs text-[#4b5563]">Current module</div>
        </div>
      </div>

      {/* ── Section label: Modes ── */}
      <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-3">Practice Modes</div>

      {/* ── Practice modes 2-column grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODES.map(mode => (
          <Link
            key={mode.id}
            to={mode.ready ? mode.to : '#'}
            className={`group relative rounded-2xl p-5 border transition-all duration-300 overflow-hidden ${
              mode.ready
                ? 'border-white/[0.04] hover:border-amber-500/15 hover:bg-white/[0.03] cursor-pointer'
                : 'border-white/[0.04] opacity-35 cursor-not-allowed'
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
            }}
            onClick={e => !mode.ready && e.preventDefault()}
          >
            {/* Left accent border */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl transition-opacity duration-300"
              style={{
                background: mode.color,
                opacity: mode.ready ? 0.5 : 0.15,
              }}
            />

            {/* Hover glow effect */}
            {mode.ready && (
              <div
                className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${mode.color}10 0%, transparent 70%)`,
                }}
              />
            )}

            <div className="relative flex items-start gap-4">
              {/* Icon badge */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: mode.color + '15', border: `1px solid ${mode.color}20` }}
              >
                <ModeIcon id={mode.id} color={mode.color} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-white font-semibold text-[15px]">{mode.title}</span>
                  {!mode.ready && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#4b5563] bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6b7280] leading-relaxed">{mode.description}</p>
              </div>

              {/* Arrow that slides in on hover */}
              {mode.ready && (
                <div className="flex items-center self-center ml-2">
                  <svg
                    className="w-5 h-5 text-[#374151] group-hover:text-amber-400 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ── My Patterns (from Studio) ── */}
      {myPatterns.length > 0 && (
        <>
          <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-3 mt-10 flex items-center justify-between">
            <span>My Patterns</span>
            <Link to="/drums/studio" className="text-violet-400/70 hover:text-violet-400 text-[10px] font-medium transition-colors">
              Open Studio →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myPatterns.map(ex => (
              <div
                key={ex.id}
                className="group relative rounded-2xl p-4 border border-white/[0.04] hover:border-violet-500/15 transition-all duration-300 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
              >
                {/* Left accent */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ background: '#7c3aed', opacity: 0.4 }} />

                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white truncate">{ex.title}</span>
                    <span className="text-[10px] text-violet-400/60 bg-violet-500/[0.06] border border-violet-500/10 px-1.5 py-0.5 rounded-md flex-shrink-0 ml-2">Studio</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-[#4b5563] mb-3">
                    <span>{(ex.timeSignature ?? [4, 4]).join('/')}</span>
                    <span>{ex.bars ?? 1} bar{(ex.bars ?? 1) > 1 ? 's' : ''}</span>
                    <span>{ex.bpm} bpm</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/drums/practice/play/studio:${ex.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors text-white hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Practice
                    </Link>
                    <Link
                      to={`/drums/studio/${ex.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
