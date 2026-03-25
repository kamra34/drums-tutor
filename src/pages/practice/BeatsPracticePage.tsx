import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GENRE_BEATS, PracticeCategory } from '../../data/practiceLibrary'
import { useUserStore } from '../../stores/useUserStore'
import StarRating from '../../components/shared/StarRating'

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
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-6">
        <Link to="/practice" className="hover:text-violet-400">Practice</Link>
        <span>›</span>
        <span className="text-[#94a3b8]">Play-Along Beats</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">🎸 Play-Along Beats</h1>
        <p className="text-sm text-[#6b7280]">
          Real-world grooves organized by genre. Learn the beats behind every style of music.
        </p>
      </div>

      {/* Genre filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {GENRES.map(g => (
          <button
            key={g.id}
            onClick={() => setGenre(g.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              genre === g.id
                ? 'border-violet-700 text-violet-300 bg-violet-900/20'
                : 'border-[#2d3748] text-[#6b7280] hover:text-violet-400'
            }`}
          >
            {g.icon} {g.label}
          </button>
        ))}
      </div>

      {/* Beat list */}
      <div className="space-y-2">
        {beats.map(beat => {
          const best = getBestResult(beat.id)
          return (
            <button
              key={beat.id}
              onClick={() => navigate(`/practice/play/${beat.id}`)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#0d1117] border border-[#1e2433] hover:border-violet-900/50 transition-all text-left group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm text-white font-medium">{beat.title}</span>
                  <span className="text-[10px] text-[#4b5563] bg-[#1e2433] px-1.5 py-0.5 rounded capitalize">{beat.category}</span>
                </div>
                <div className="text-xs text-[#6b7280]">{beat.description}</div>
                <div className="flex gap-3 mt-1.5 text-[10px] text-[#4b5563]">
                  <span>⚡ {beat.difficulty}/10</span>
                  <span>🎵 {beat.bpm} BPM</span>
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
              <span className="text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
