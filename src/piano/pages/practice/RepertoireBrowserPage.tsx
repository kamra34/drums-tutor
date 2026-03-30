import { useState } from 'react'
import { Link } from 'react-router-dom'
import { REPERTOIRE } from '@piano/data/repertoire'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'

const accent = '#a78bfa'
const CATEGORIES = ['all', 'beginner', 'easy', 'intermediate'] as const
const DIFF_COLORS = ['', '#22c55e', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444']

export default function RepertoireBrowserPage() {
  const [category, setCategory] = useState<string>('all')
  const { getBestResult } = usePianoProgressStore()

  const filtered = category === 'all' ? REPERTOIRE : REPERTOIRE.filter(p => p.category === category)

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
          <h1 className="text-xl font-extrabold text-white tracking-tight">Play Songs</h1>
          <p className="text-xs text-[#6b7280]">{REPERTOIRE.length} pieces from beginner to intermediate</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 mb-5">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all cursor-pointer"
            style={{
              background: category === c ? `${accent}15` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${category === c ? `${accent}30` : 'rgba(255,255,255,0.04)'}`,
              color: category === c ? accent : '#6b7280',
            }}>
            {c === 'all' ? 'All levels' : c}
          </button>
        ))}
      </div>

      {/* Songs grid */}
      <div className="space-y-2">
        {filtered.map(piece => {
          const best = getBestResult(piece.id)
          const dc = DIFF_COLORS[piece.difficulty] || '#6b7280'
          return (
            <Link key={piece.id} to={`/piano/practice/songs/${piece.id}`}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02] transition-all"
              style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
              {/* Difficulty badge */}
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: `${dc}15`, border: `1px solid ${dc}30`, color: dc }}>
                {piece.difficulty}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#e2e8f0] font-semibold truncate">{piece.title}</div>
                <div className="text-[10px] text-[#4b5563] mt-0.5 flex items-center gap-1.5">
                  <span>{piece.composer}</span>
                  <span className="w-1 h-1 rounded-full bg-[#2d3748]" />
                  <span>Key: {piece.keySignature}</span>
                  <span className="w-1 h-1 rounded-full bg-[#2d3748]" />
                  <span>{piece.handsRequired === 'both' ? 'Both hands' : piece.handsRequired === 'right' ? 'RH' : 'LH'}</span>
                </div>
              </div>
              {/* Score / badge */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded capitalize"
                  style={{ background: `${dc}10`, color: dc }}>{piece.category}</span>
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
    </div>
  )
}
