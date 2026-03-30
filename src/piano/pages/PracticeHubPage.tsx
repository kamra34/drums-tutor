import { Link } from 'react-router-dom'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'

interface PracticeMode {
  id: string
  title: string
  description: string
  icon: string
  to: string
  color: string
}

const MODES: PracticeMode[] = [
  {
    id: 'scales',
    title: 'Scale Practice',
    description: 'Play along with animated scales at your own tempo. Major, minor, and chromatic with visual guidance.',
    icon: '🎼',
    to: '/piano/practice/scales',
    color: '#a78bfa',
  },
  {
    id: 'chords',
    title: 'Chord Drills',
    description: 'Practice chord progressions with animated keyboard. I-IV-V, ii-V-I, pop progressions and inversions.',
    icon: '🎹',
    to: '/piano/practice/chords',
    color: '#8b5cf6',
  },
  {
    id: 'sight-reading',
    title: 'Sight Reading',
    description: 'Read and play short passages. Progressive difficulty from single hand to hands together.',
    icon: '👁',
    to: '/piano/practice/sight-reading',
    color: '#7c3aed',
  },
  {
    id: 'ear-training',
    title: 'Ear Training',
    description: 'Identify intervals, chords, and melodies by ear. Build your musical listening skills.',
    icon: '👂',
    to: '/piano/practice/ear-training',
    color: '#6d28d9',
  },
]

const accent = '#a78bfa'

export default function PracticeHubPage() {
  const { progress, totalPracticeTime, practiceStreak } = usePianoProgressStore()

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-3xl p-8 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(12,10,20,0.9) 0%, rgba(10,12,22,0.9) 50%, rgba(14,10,20,0.8) 100%)',
      }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none" style={{
          background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`,
        }} />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Practice</h1>
          <p className="text-[#6b7280] max-w-lg">
            Guided practice sessions with visual feedback. Play along on your piano — no MIDI needed.
          </p>

          {/* Stats */}
          <div className="flex gap-6 mt-5">
            <div>
              <div className="text-lg font-bold text-white">{totalPracticeTime}<span className="text-sm text-[#4b5563]">m</span></div>
              <div className="text-[10px] text-[#4b5563] uppercase tracking-wider">Practice time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{practiceStreak}</div>
              <div className="text-[10px] text-[#4b5563] uppercase tracking-wider">Day streak</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{progress.exerciseResults.length}</div>
              <div className="text-[10px] text-[#4b5563] uppercase tracking-wider">Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Practice modes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {MODES.map(mode => {
          const isReady = mode.id === 'scales' || mode.id === 'chords'
          return (
            <Link
              key={mode.id}
              to={isReady ? mode.to : '#'}
              className={`group relative rounded-2xl p-6 border border-white/[0.04] overflow-hidden transition-all ${
                isReady ? 'hover:border-white/[0.08] cursor-pointer' : 'opacity-50 cursor-default'
              }`}
              style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
              onClick={e => { if (!isReady) e.preventDefault() }}
            >
              {/* Accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ background: mode.color, opacity: 0.5 }} />

              {/* Hover glow */}
              {isReady && (
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{
                  background: `radial-gradient(circle, ${mode.color}15 0%, transparent 70%)`,
                }} />
              )}

              <div className="relative flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{
                  background: `${mode.color}12`,
                  border: `1px solid ${mode.color}20`,
                }}>
                  {mode.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-base">{mode.title}</h3>
                    {!isReady && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#374151] uppercase tracking-wider">Soon</span>
                    )}
                  </div>
                  <p className="text-xs text-[#6b7280] leading-relaxed mt-1">{mode.description}</p>
                  {isReady && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: `${mode.color}99` }}>
                      Start practicing
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* How it works */}
      <div className="rounded-2xl p-5 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(12,14,20,0.5) 0%, rgba(10,12,18,0.6) 100%)',
      }}>
        <h2 className="text-sm font-semibold text-white mb-3">How Practice Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Watch & Listen', desc: 'See the notes animated on the keyboard with finger numbers. Hear the correct sound at your chosen tempo.' },
            { step: '2', title: 'Play Along', desc: 'Play on your physical piano while following the visual guide. No cable or MIDI needed.' },
            { step: '3', title: 'Self-Assess', desc: 'Rate your performance after each session. Your skill profile updates based on your honest self-assessment.' },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${accent}15`, color: accent }}>
                {item.step}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{item.title}</div>
                <p className="text-[11px] text-[#6b7280] leading-relaxed mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
