import { Link, useNavigate } from 'react-router-dom'
import { FILL_CHALLENGES } from '../../data/practiceLibrary'
import { useUserStore } from '../../stores/useUserStore'
import StarRating from '../../components/shared/StarRating'

export default function FillsPracticePage() {
  const { getBestResult } = useUserStore()
  const navigate = useNavigate()

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-6">
        <Link to="/practice" className="hover:text-violet-400">Practice</Link>
        <span>›</span>
        <span className="text-[#94a3b8]">Fill Challenges</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">💥 Fill Challenges</h1>
        <p className="text-sm text-[#6b7280]">
          Groove for a few bars, then nail the fill. Builds your ability to transition smoothly.
          Start with short fills and work up to full-bar dynamic fills.
        </p>
      </div>

      <div className="space-y-2">
        {FILL_CHALLENGES.map((fill, i) => {
          const best = getBestResult(fill.id)
          return (
            <button
              key={fill.id}
              onClick={() => navigate(`/practice/play/${fill.id}`)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#0d1117] border border-[#1e2433] hover:border-violet-900/50 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-yellow-900/30 flex items-center justify-center text-yellow-400 font-bold text-sm flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium">{fill.title}</div>
                <div className="text-xs text-[#6b7280] mt-0.5">{fill.description}</div>
                <div className="flex gap-3 mt-1.5 text-[10px] text-[#4b5563]">
                  <span>⚡ {fill.difficulty}/10</span>
                  <span>🎵 {fill.bpm} BPM</span>
                  <span>{fill.tags.join(' · ')}</span>
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
            </button>
          )
        })}
      </div>
    </div>
  )
}
