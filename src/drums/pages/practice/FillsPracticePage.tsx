import { Link, useNavigate } from 'react-router-dom'
import { FILL_CHALLENGES } from '@drums/data/practiceLibrary'
import { useUserStore } from '@shared/stores/useUserStore'
import StarRating from '@shared/components/StarRating'

export default function FillsPracticePage() {
  const { getBestResult } = useUserStore()
  const navigate = useNavigate()

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-6">
        <Link to="/practice" className="text-amber-500/80 hover:text-amber-400 transition-colors">Practice</Link>
        <svg className="w-3.5 h-3.5 text-[#2d3748]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-[#94a3b8]">Fill Challenges</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Fill Challenges</h1>
        <p className="text-sm text-[#6b7280] leading-relaxed">
          Groove for a few bars, then nail the fill. Builds your ability to transition smoothly.
          Start with short fills and work up to full-bar dynamic fills.
        </p>
      </div>

      {/* Fill list */}
      <div className="space-y-2">
        {FILL_CHALLENGES.map((fill, i) => {
          const best = getBestResult(fill.id)
          return (
            <button
              key={fill.id}
              onClick={() => navigate(`/practice/play/${fill.id}`)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border border-white/[0.04] hover:border-amber-500/15 hover:bg-white/[0.03] transition-all text-left group"
              style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium">{fill.title}</div>
                <div className="text-xs text-[#6b7280] mt-0.5">{fill.description}</div>
                <div className="flex gap-3 mt-1.5 text-[10px] text-[#4b5563]">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    {fill.difficulty}/10
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                    {fill.bpm} BPM
                  </span>
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
              <span className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
