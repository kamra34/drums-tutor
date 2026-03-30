import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PracticePlayer from '@piano/components/PracticePlayer'
import type { NoteEvent } from '@piano/types/curriculum'

const EASY_NOTES = ['C4','D4','E4','F4','G4','A4','B4','C5']
const MEDIUM_NOTES = ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5']
const HARD_NOTES = ['A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5']
const DURATIONS = [0.5, 1, 1, 1, 2]

function generatePassage(difficulty: number, length: number): NoteEvent[] {
  const pool = difficulty <= 1 ? EASY_NOTES : difficulty <= 2 ? MEDIUM_NOTES : HARD_NOTES
  const notes: NoteEvent[] = []
  let prevIdx = Math.floor(pool.length / 2)
  for (let i = 0; i < length; i++) {
    const step = Math.random() < 0.7 ? (Math.random() < 0.5 ? -1 : 1) : (Math.random() < 0.5 ? -2 : 2)
    prevIdx = Math.max(0, Math.min(pool.length - 1, prevIdx + step))
    notes.push({ note: pool[prevIdx], duration: DURATIONS[Math.floor(Math.random() * DURATIONS.length)] })
  }
  return notes
}

const accent = '#a78bfa'

export default function SightReadingPage() {
  const [difficulty, setDifficulty] = useState(1)
  const [length, setLength] = useState(12)
  const [passage, setPassage] = useState<NoteEvent[] | null>(null)
  const [passageKey, setPassageKey] = useState(0)

  const handleGenerate = () => {
    setPassage(generatePassage(difficulty, length))
    setPassageKey(k => k + 1)
  }

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 max-w-[1800px] mx-auto">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
        <Link to="/piano/practice" className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center transition-all">
          <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">Sight Reading</h1>
          <p className="text-xs text-[#6b7280]">Random passages — preview, then play without stopping</p>
        </div>
      </div>

      {/* Settings + generate */}
      <div className="rounded-xl sm:rounded-2xl border border-white/[0.04] p-3 sm:p-4 mb-3 sm:mb-4" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
        <div className="flex flex-wrap gap-3 sm:gap-5 items-end">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold mb-2">Difficulty</div>
            <div className="flex gap-1">
              {[{ v:1, l:'Easy' }, { v:2, l:'Medium' }, { v:3, l:'Hard' }].map(d => (
                <button key={d.v} onClick={() => setDifficulty(d.v)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                  style={{ background: difficulty===d.v ? `${accent}15` : 'rgba(255,255,255,0.02)', border: `1px solid ${difficulty===d.v ? `${accent}30` : 'rgba(255,255,255,0.04)'}`, color: difficulty===d.v ? '#fff' : '#6b7280' }}>{d.l}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold mb-2">Length</div>
            <div className="flex gap-1">
              {[8,12,16,20].map(n => (
                <button key={n} onClick={() => setLength(n)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                  style={{ background: length===n ? `${accent}15` : 'rgba(255,255,255,0.02)', border: `1px solid ${length===n ? `${accent}30` : 'rgba(255,255,255,0.04)'}`, color: length===n ? '#fff' : '#6b7280' }}>{n}</button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${accent}, #8b5cf6)` }}>
            {passage ? 'New Passage' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Player */}
      {passage && (
        <PracticePlayer
          notes={passage}
          defaultBpm={60}
          timeSignature={[4, 4]}
          resetKey={`sr-${passageKey}`}
        />
      )}

      {!passage && (
        <div className="rounded-xl sm:rounded-2xl border border-white/[0.04] p-6 sm:p-8 md:p-12 text-center" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.5) 0%, rgba(10,12,18,0.6) 100%)' }}>
          <div className="text-3xl mb-3">👁</div>
          <p className="text-sm text-[#6b7280]">Generate a passage to start sight-reading</p>
        </div>
      )}
    </div>
  )
}
