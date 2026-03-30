import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PracticePlayer from '@piano/components/PracticePlayer'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'
import SelfAssessment from './SelfAssessment'
import type { ChordEvent } from '@piano/types/curriculum'

// ── Progression data ────────────────────────────────────────────────────────

interface ChordStep { name: string; notes: string[]; fingers: number[]; beats: number }
interface ProgressionDef { name: string; description: string; key: string; category: string; chords: ChordStep[] }

const PROGRESSIONS: ProgressionDef[] = [
  { name: 'I-IV-V7-I in C', description: 'The foundation of Western harmony.', key: 'C', category: 'primary',
    chords: [{ name:'C', notes:['C3','E3','G3'], fingers:[5,3,1], beats:4 }, { name:'F', notes:['F3','A3','C4'], fingers:[5,3,1], beats:4 }, { name:'G7', notes:['G3','B3','D4','F4'], fingers:[5,3,2,1], beats:4 }, { name:'C', notes:['C3','E3','G3'], fingers:[5,3,1], beats:4 }] },
  { name: 'I-IV-V7-I in G', description: 'Primary chords in G major.', key: 'G', category: 'primary',
    chords: [{ name:'G', notes:['G3','B3','D4'], fingers:[5,3,1], beats:4 }, { name:'C', notes:['C3','E3','G3'], fingers:[5,3,1], beats:4 }, { name:'D7', notes:['D3','F#3','A3','C4'], fingers:[5,3,2,1], beats:4 }, { name:'G', notes:['G3','B3','D4'], fingers:[5,3,1], beats:4 }] },
  { name: 'I-IV-V7-I in F', description: 'Primary chords in F major.', key: 'F', category: 'primary',
    chords: [{ name:'F', notes:['F3','A3','C4'], fingers:[5,3,1], beats:4 }, { name:'Bb', notes:['Bb3','D4','F4'], fingers:[5,3,1], beats:4 }, { name:'C7', notes:['C3','E3','G3','Bb3'], fingers:[5,3,2,1], beats:4 }, { name:'F', notes:['F3','A3','C4'], fingers:[5,3,1], beats:4 }] },
  { name: 'I-V-vi-IV (Pop)', description: 'The most used progression in pop music.', key: 'C', category: 'pop',
    chords: [{ name:'C', notes:['C3','E3','G3'], fingers:[5,3,1], beats:4 }, { name:'G', notes:['G3','B3','D4'], fingers:[5,3,1], beats:4 }, { name:'Am', notes:['A3','C4','E4'], fingers:[5,3,1], beats:4 }, { name:'F', notes:['F3','A3','C4'], fingers:[5,3,1], beats:4 }] },
  { name: 'vi-IV-I-V (Axis)', description: 'Am-F-C-G — used in countless hits.', key: 'C', category: 'pop',
    chords: [{ name:'Am', notes:['A3','C4','E4'], fingers:[5,3,1], beats:4 }, { name:'F', notes:['F3','A3','C4'], fingers:[5,3,1], beats:4 }, { name:'C', notes:['C3','E3','G3'], fingers:[5,3,1], beats:4 }, { name:'G', notes:['G3','B3','D4'], fingers:[5,3,1], beats:4 }] },
  { name: 'I-vi-IV-V (50s)', description: 'The classic 1950s doo-wop progression.', key: 'C', category: 'pop',
    chords: [{ name:'C', notes:['C3','E3','G3'], fingers:[5,3,1], beats:4 }, { name:'Am', notes:['A3','C4','E4'], fingers:[5,3,1], beats:4 }, { name:'F', notes:['F3','A3','C4'], fingers:[5,3,1], beats:4 }, { name:'G', notes:['G3','B3','D4'], fingers:[5,3,1], beats:4 }] },
  { name: 'ii-V-I in C (Jazz)', description: 'The foundation of jazz harmony.', key: 'C', category: 'jazz',
    chords: [{ name:'Dm', notes:['D3','F3','A3'], fingers:[5,3,1], beats:4 }, { name:'G7', notes:['G3','B3','D4','F4'], fingers:[5,3,2,1], beats:4 }, { name:'C', notes:['C3','E3','G3'], fingers:[5,3,1], beats:4 }, { name:'C', notes:['C3','E3','G3'], fingers:[5,3,1], beats:4 }] },
  { name: 'ii-V-I in G', description: 'Jazz turnaround in G major.', key: 'G', category: 'jazz',
    chords: [{ name:'Am', notes:['A3','C4','E4'], fingers:[5,3,1], beats:4 }, { name:'D7', notes:['D3','F#3','A3','C4'], fingers:[5,3,2,1], beats:4 }, { name:'G', notes:['G3','B3','D4'], fingers:[5,3,1], beats:4 }, { name:'G', notes:['G3','B3','D4'], fingers:[5,3,1], beats:4 }] },
  { name: 'ii-V-I in F', description: 'Jazz turnaround in F major.', key: 'F', category: 'jazz',
    chords: [{ name:'Gm', notes:['G3','Bb3','D4'], fingers:[5,3,1], beats:4 }, { name:'C7', notes:['C3','E3','G3','Bb3'], fingers:[5,3,2,1], beats:4 }, { name:'F', notes:['F3','A3','C4'], fingers:[5,3,1], beats:4 }, { name:'F', notes:['F3','A3','C4'], fingers:[5,3,1], beats:4 }] },
  { name: 'C Inversions', description: 'Root, 1st, and 2nd inversion of C major.', key: 'C', category: 'technique',
    chords: [{ name:'C (root)', notes:['C4','E4','G4'], fingers:[1,3,5], beats:4 }, { name:'C (1st)', notes:['E4','G4','C5'], fingers:[1,3,5], beats:4 }, { name:'C (2nd)', notes:['G4','C5','E5'], fingers:[1,3,5], beats:4 }, { name:'C (root)', notes:['C4','E4','G4'], fingers:[1,3,5], beats:4 }] },
  { name: 'Seventh Chords', description: 'Cmaj7, C7, Cm7 — hear the difference.', key: 'C', category: 'technique',
    chords: [{ name:'Cmaj7', notes:['C3','E3','G3','B3'], fingers:[5,3,2,1], beats:4 }, { name:'C7', notes:['C3','E3','G3','Bb3'], fingers:[5,3,2,1], beats:4 }, { name:'Cm7', notes:['C3','Eb3','G3','Bb3'], fingers:[5,3,2,1], beats:4 }, { name:'Cmaj7', notes:['C3','E3','G3','B3'], fingers:[5,3,2,1], beats:4 }] },
]

const CATEGORIES = ['all', 'primary', 'pop', 'jazz', 'technique']
const accent = '#a78bfa'

export default function ChordPracticePage() {
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<ProgressionDef>(PROGRESSIONS[0])
  const [sessionCount, setSessionCount] = useState(0)
  const [showAssessment, setShowAssessment] = useState(false)
  const { addPracticeTime } = usePianoProgressStore()

  const filtered = category === 'all' ? PROGRESSIONS : PROGRESSIONS.filter(p => p.category === category)

  const chordEvents: ChordEvent[] = useMemo(() =>
    selected.chords.map(c => ({ name: c.name, notes: c.notes, duration: c.beats, fingers: c.fingers })),
    [selected]
  )

  if (showAssessment) {
    return <SelfAssessment exerciseName={selected.name} sessionCount={sessionCount}
      onDone={() => { setShowAssessment(false); setSessionCount(0) }} />
  }

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
        <Link to="/piano/practice" className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center transition-all">
          <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">Chord Lab</h1>
          <p className="text-xs text-[#6b7280]">{PROGRESSIONS.length} progressions — primary, pop, jazz, technique</p>
        </div>
        {sessionCount >= 1 && (
          <button onClick={() => { addPracticeTime(Math.max(1, sessionCount)); setShowAssessment(true) }}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all cursor-pointer">
            Self-Assess ({sessionCount}x)
          </button>
        )}
      </div>

      {/* Selector */}
      <div className="rounded-2xl border border-white/[0.04] p-3 sm:p-4 mb-3 sm:mb-4" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
        {/* Category tabs */}
        <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold mb-2">Progression</div>
        <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className="px-2 py-1 rounded-md text-[10px] font-medium capitalize transition-all cursor-pointer"
              style={{
                background: category === c ? `${accent}12` : 'transparent',
                color: category === c ? accent : '#4b5563',
                border: `1px solid ${category === c ? `${accent}20` : 'transparent'}`,
              }}>{c}</button>
          ))}
        </div>
        {/* Progression list */}
        <div className="space-y-1.5">
          {filtered.map(p => (
            <button key={p.name} onClick={() => setSelected(p)}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-3"
              style={{
                background: selected.name === p.name ? `${accent}10` : 'rgba(255,255,255,0.01)',
                border: `1px solid ${selected.name === p.name ? `${accent}25` : 'rgba(255,255,255,0.03)'}`,
              }}>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate" style={{ color: selected.name === p.name ? '#fff' : '#94a3b8' }}>{p.name}</div>
                <div className="text-[10px] text-[#4b5563] truncate">{p.description}</div>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded capitalize flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.03)', color: '#4b5563' }}>Key: {p.key}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Player */}
      <PracticePlayer
        chords={chordEvents}
        defaultBpm={60}
        timeSignature={[4, 4]}
        resetKey={selected.name}
        onSessionComplete={() => setSessionCount(c => c + 1)}
      />
    </div>
  )
}
