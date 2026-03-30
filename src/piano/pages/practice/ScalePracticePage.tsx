import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PracticePlayer from '@piano/components/PracticePlayer'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'
import SelfAssessment from './SelfAssessment'
import type { NoteEvent } from '@piano/types/curriculum'

// ── Scale data ──────────────────────────────────────────────────────────────

interface ScaleDef {
  name: string
  notes: string[]
  fingers: { rh: number[]; lh: number[] }
  category: string
}

const SCALES: ScaleDef[] = [
  // Major
  { name: 'C Major', notes: ['C4','D4','E4','F4','G4','A4','B4','C5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'major' },
  { name: 'G Major', notes: ['G4','A4','B4','C5','D5','E5','F#5','G5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'major' },
  { name: 'D Major', notes: ['D4','E4','F#4','G4','A4','B4','C#5','D5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'major' },
  { name: 'A Major', notes: ['A4','B4','C#5','D5','E5','F#5','G#5','A5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'major' },
  { name: 'E Major', notes: ['E4','F#4','G#4','A4','B4','C#5','D#5','E5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'major' },
  { name: 'F Major', notes: ['F4','G4','A4','Bb4','C5','D5','E5','F5'], fingers: { rh: [1,2,3,4,1,2,3,4], lh: [5,4,3,2,1,3,2,1] }, category: 'major' },
  { name: 'Bb Major', notes: ['Bb3','C4','D4','Eb4','F4','G4','A4','Bb4'], fingers: { rh: [4,1,2,3,1,2,3,4], lh: [3,2,1,4,3,2,1,3] }, category: 'major' },
  // Natural minor
  { name: 'A Natural Minor', notes: ['A4','B4','C5','D5','E5','F5','G5','A5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'minor' },
  { name: 'D Natural Minor', notes: ['D4','E4','F4','G4','A4','Bb4','C5','D5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'minor' },
  { name: 'E Natural Minor', notes: ['E4','F#4','G4','A4','B4','C5','D5','E5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'minor' },
  { name: 'G Natural Minor', notes: ['G4','A4','Bb4','C5','D5','Eb5','F5','G5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'minor' },
  // Harmonic minor
  { name: 'A Harmonic Minor', notes: ['A4','B4','C5','D5','E5','F5','G#5','A5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'harmonic' },
  { name: 'D Harmonic Minor', notes: ['D4','E4','F4','G4','A4','Bb4','C#5','D5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'harmonic' },
  { name: 'E Harmonic Minor', notes: ['E4','F#4','G4','A4','B4','C5','D#5','E5'], fingers: { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] }, category: 'harmonic' },
  // Chromatic
  { name: 'Chromatic', notes: ['C4','C#4','D4','Eb4','E4','F4','F#4','G4','Ab4','A4','Bb4','B4','C5'], fingers: { rh: [1,3,1,3,1,1,3,1,3,1,3,1,1], lh: [1,3,1,3,1,1,3,1,3,1,3,1,1] }, category: 'chromatic' },
]

const CATEGORIES = ['all', 'major', 'minor', 'harmonic', 'chromatic']
const accent = '#a78bfa'

export default function ScalePracticePage() {
  const [category, setCategory] = useState('all')
  const [selectedScale, setSelectedScale] = useState<ScaleDef>(SCALES[0])
  const [hand, setHand] = useState<'rh' | 'lh'>('rh')
  const [direction, setDirection] = useState<'asc' | 'both'>('both')
  const [sessionCount, setSessionCount] = useState(0)
  const [showAssessment, setShowAssessment] = useState(false)
  const { addPracticeTime } = usePianoProgressStore()

  const filtered = category === 'all' ? SCALES : SCALES.filter(s => s.category === category)

  // Build note events from selected scale + options
  const noteEvents: NoteEvent[] = useMemo(() => {
    const s = selectedScale
    const f = hand === 'rh' ? s.fingers.rh : s.fingers.lh
    const noteSeq = direction === 'both'
      ? [...s.notes, ...s.notes.slice(0, -1).reverse()]
      : s.notes
    const fingerSeq = direction === 'both'
      ? [...f, ...f.slice(0, -1).reverse()]
      : f
    return noteSeq.map((note, i) => ({ note, duration: 1, finger: fingerSeq[i] }))
  }, [selectedScale, hand, direction])

  if (showAssessment) {
    return <SelfAssessment exerciseName={`${selectedScale.name} (${hand === 'rh' ? 'RH' : 'LH'})`} sessionCount={sessionCount}
      onDone={() => { setShowAssessment(false); setSessionCount(0) }} />
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link to="/piano/practice" className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center transition-all">
          <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Scale Trainer</h1>
          <p className="text-xs text-[#6b7280]">15 scales with fingering — pick, play, repeat</p>
        </div>
        {sessionCount >= 1 && (
          <button onClick={() => { addPracticeTime(Math.max(1, sessionCount)); setShowAssessment(true) }}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all cursor-pointer">
            Self-Assess ({sessionCount}x)
          </button>
        )}
      </div>

      {/* Selector panel */}
      <div className="rounded-2xl border border-white/[0.04] p-4 mb-4" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
        <div className="flex flex-wrap gap-4 items-start">
          {/* Scale category + picker */}
          <div className="flex-1 min-w-[200px]">
            <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold mb-2">Scale</div>
            {/* Category tabs */}
            <div className="flex gap-1 mb-2">
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
            {/* Scale list */}
            <div className="flex flex-wrap gap-1.5">
              {filtered.map(s => (
                <button key={s.name} onClick={() => setSelectedScale(s)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                  style={{
                    background: selectedScale.name === s.name ? `${accent}15` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedScale.name === s.name ? `${accent}30` : 'rgba(255,255,255,0.04)'}`,
                    color: selectedScale.name === s.name ? '#fff' : '#6b7280',
                  }}>{s.name}</button>
              ))}
            </div>
          </div>

          {/* Hand + direction */}
          <div className="flex gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold mb-2">Hand</div>
              <div className="flex gap-1">
                {(['rh', 'lh'] as const).map(h => (
                  <button key={h} onClick={() => setHand(h)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                    style={{
                      background: hand === h ? `${accent}15` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${hand === h ? `${accent}30` : 'rgba(255,255,255,0.04)'}`,
                      color: hand === h ? '#fff' : '#6b7280',
                    }}>{h === 'rh' ? 'Right' : 'Left'}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold mb-2">Direction</div>
              <div className="flex gap-1">
                {([['both', 'Up & Down'], ['asc', 'Up only']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setDirection(v as 'asc' | 'both')}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                    style={{
                      background: direction === v ? `${accent}15` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${direction === v ? `${accent}30` : 'rgba(255,255,255,0.04)'}`,
                      color: direction === v ? '#fff' : '#6b7280',
                    }}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player */}
      <PracticePlayer
        notes={noteEvents}
        defaultBpm={72}
        timeSignature={[4, 4]}
        resetKey={`${selectedScale.name}-${hand}-${direction}`}
        onSessionComplete={() => setSessionCount(c => c + 1)}
      />
    </div>
  )
}
