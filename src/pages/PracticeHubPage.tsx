import { Link } from 'react-router-dom'
import { useMidiStore } from '../stores/useMidiStore'
import { useUserStore } from '../stores/useUserStore'

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
    to: '/practice/reading',
    color: '#7c3aed',
    ready: true,
  },
  {
    id: 'beats',
    title: 'Play-Along Beats',
    description: 'Genre-organized grooves — rock, pop, funk, jazz, latin, metal. Learn real-world beats by difficulty level.',
    icon: '🎸',
    to: '/practice/beats',
    color: '#2563eb',
    ready: true,
  },
  {
    id: 'rudiments',
    title: 'Rudiment Trainer',
    description: 'All PAS rudiments with tempo ladder. Start slow, nail it, speed up. Track your top BPM over time.',
    icon: '🥢',
    to: '/practice/rudiments',
    color: '#059669',
    ready: true,
  },
  {
    id: 'fills',
    title: 'Fill Challenges',
    description: 'Play a groove, then nail the fill. From 1-beat fills to full-bar dynamic fills.',
    icon: '💥',
    to: '/practice/fills',
    color: '#d97706',
    ready: true,
  },
  {
    id: 'ai-daily',
    title: 'AI Daily Practice',
    description: 'Claude analyzes your weak areas and generates a personalized warm-up + exercises for today.',
    icon: '🤖',
    to: '/practice/daily',
    color: '#8b5cf6',
    ready: true,
  },
  {
    id: 'freeplay',
    title: 'Free Play',
    description: 'No target pattern — just play. Get real-time feedback on timing, dynamics, and tempo consistency.',
    icon: '🎯',
    to: '/practice/freeplay',
    color: '#06b6d4',
    ready: true,
  },
  {
    id: 'sight-reading',
    title: 'Sight-Reading',
    description: 'Random notation appears. Read and execute cold — the ultimate real-world skill test.',
    icon: '👁',
    to: '/practice/sight-reading',
    color: '#64748b',
    ready: false,
  },
  {
    id: 'songs',
    title: 'Song Charts',
    description: 'Full song structures with repeats, sections, and dynamics. Learn to play through a whole chart.',
    icon: '📄',
    to: '/practice/songs',
    color: '#64748b',
    ready: false,
  },
]

export default function PracticeHubPage() {
  const { isConnected } = useMidiStore()
  const { progress } = useUserStore()

  const totalResults = progress.exerciseResults.length

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Practice</h1>
        <p className="text-[#6b7280]">Choose a practice mode. Every mode scores your playing via MIDI.</p>
      </div>

      {!isConnected && (
        <div className="mb-6 text-sm text-yellow-600 bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-4 py-3">
          No drum kit connected — connect your e-drum in{' '}
          <Link to="/settings" className="underline">Settings</Link> for MIDI scoring.
          You can still browse and listen to patterns without a kit.
        </div>
      )}

      {/* Quick stats */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 bg-[#0d1117] border border-[#1e2433] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalResults}</div>
          <div className="text-xs text-[#4b5563]">Total exercises played</div>
        </div>
        <div className="flex-1 bg-[#0d1117] border border-[#1e2433] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{progress.completedLessons.length}</div>
          <div className="text-xs text-[#4b5563]">Lessons completed</div>
        </div>
        <div className="flex-1 bg-[#0d1117] border border-[#1e2433] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-violet-400">{progress.currentModule}</div>
          <div className="text-xs text-[#4b5563]">Current module</div>
        </div>
      </div>

      {/* Practice modes grid */}
      <div className="grid grid-cols-2 gap-4">
        {MODES.map(mode => (
          <Link
            key={mode.id}
            to={mode.ready ? mode.to : '#'}
            className={`rounded-xl border p-5 transition-all group ${
              mode.ready
                ? 'border-[#1e2433] hover:border-violet-800/50 bg-[#0d1117] hover:bg-[#13101e]'
                : 'border-[#1e2433] opacity-40 cursor-not-allowed bg-[#0d1117]'
            }`}
            onClick={e => !mode.ready && e.preventDefault()}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: mode.color + '22' }}
              >
                {mode.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold">{mode.title}</span>
                  {!mode.ready && (
                    <span className="text-[10px] text-[#4b5563] bg-[#1e2433] px-1.5 py-0.5 rounded">Coming soon</span>
                  )}
                </div>
                <p className="text-xs text-[#6b7280] leading-relaxed">{mode.description}</p>
              </div>
              {mode.ready && (
                <span className="text-[#374151] group-hover:text-violet-500 transition-colors text-lg mt-1">→</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
