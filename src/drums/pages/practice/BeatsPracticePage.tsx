import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GENRE_BEATS, PracticeCategory } from '@drums/data/practiceLibrary'
import { useUserStore } from '@shared/stores/useUserStore'
import StarRating from '@shared/components/StarRating'

const GENRES: { id: PracticeCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🎵' },
  { id: 'rock', label: 'Rock', icon: '🎸' },
  { id: 'pop', label: 'Pop', icon: '🎤' },
  { id: 'funk', label: 'Funk', icon: '🕺' },
  { id: 'jazz', label: 'Jazz', icon: '🎷' },
  { id: 'latin', label: 'Latin', icon: '💃' },
  { id: 'metal', label: 'Metal', icon: '🤘' },
]

export default function BeatsPracticePage() {
  const [genre, setGenre] = useState<string>('all')
  const { getBestResult } = useUserStore()
  const navigate = useNavigate()

  const beats = genre === 'all'
    ? GENRE_BEATS
    : GENRE_BEATS.filter(b => b.category === genre)

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-6">
        <Link to="/practice" className="text-amber-500/80 hover:text-amber-400 transition-colors">Practice</Link>
        <svg className="w-3.5 h-3.5 text-[#2d3748]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-[#94a3b8]">Play-Along Beats</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Play-Along Beats</h1>
        <p className="text-sm text-[#6b7280] leading-relaxed">
          Real-world grooves organized by genre. Learn the beats behind every style of music.
        </p>
      </div>

      {/* Genre filter */}
      <div className="mb-6">
        <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-3">Genre</div>
        <div className="flex gap-2 flex-wrap">
          {GENRES.map(g => (
            <button
              key={g.id}
              onClick={() => setGenre(g.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                genre === g.id
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-white/[0.03] border border-white/[0.06] text-[#6b7280] hover:text-white'
              }`}
            >
              {g.icon} {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Beat list */}
      <div className="space-y-2">
        {beats.map(beat => {
          const best = getBestResult(beat.id)
          return (
            <button
              key={beat.id}
              onClick={() => navigate(`/practice/play/${beat.id}`)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border border-white/[0.04] hover:border-amber-500/15 hover:bg-white/[0.03] transition-all text-left group"
              style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm text-white font-medium">{beat.title}</span>
                  <span className="text-[10px] text-[#4b5563] bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded capitalize">{beat.category}</span>
                </div>
                <div className="text-xs text-[#6b7280]">{beat.description}</div>
                <div className="flex gap-3 mt-1.5 text-[10px] text-[#4b5563]">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    {beat.difficulty}/10
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                    {beat.bpm} BPM
                  </span>
                  <span>{beat.bars} bar{beat.bars > 1 ? 's' : ''}</span>
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
