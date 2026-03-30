import { useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { playPianoNote, preloadSamples } from '@piano/services/pianoSounds'

// ── Interval data ───────────────────────────────────────────────────────────

interface IntervalDef {
  name: string
  semitones: number
  example: string
}

const INTERVALS: IntervalDef[] = [
  { name: 'Minor 2nd', semitones: 1, example: 'Jaws theme' },
  { name: 'Major 2nd', semitones: 2, example: 'Happy Birthday (first 2 notes)' },
  { name: 'Minor 3rd', semitones: 3, example: 'Greensleeves' },
  { name: 'Major 3rd', semitones: 4, example: 'When the Saints' },
  { name: 'Perfect 4th', semitones: 5, example: 'Here Comes the Bride' },
  { name: 'Tritone', semitones: 6, example: 'The Simpsons theme' },
  { name: 'Perfect 5th', semitones: 7, example: 'Star Wars' },
  { name: 'Minor 6th', semitones: 8, example: 'The Entertainer' },
  { name: 'Major 6th', semitones: 9, example: 'My Bonnie' },
  { name: 'Minor 7th', semitones: 10, example: 'Somewhere (West Side Story)' },
  { name: 'Major 7th', semitones: 11, example: 'Take On Me' },
  { name: 'Octave', semitones: 12, example: 'Somewhere Over the Rainbow' },
]

// Map semitone offset from C4 to note names
const CHROMATIC = ['C4','Db4','D4','Eb4','E4','F4','Gb4','G4','Ab4','A4','Bb4','B4','C5','Db5','D5','Eb5','E5','F5','Gb5','G5']

function noteAtSemitone(base: number, offset: number): string {
  return CHROMATIC[Math.min(base + offset, CHROMATIC.length - 1)]
}

// Chord types for chord identification
interface ChordTypeDef { name: string; intervals: number[]; label: string }
const CHORD_TYPES: ChordTypeDef[] = [
  { name: 'Major', intervals: [0, 4, 7], label: 'Bright, happy' },
  { name: 'Minor', intervals: [0, 3, 7], label: 'Sad, dark' },
  { name: 'Diminished', intervals: [0, 3, 6], label: 'Tense, unstable' },
  { name: 'Augmented', intervals: [0, 4, 8], label: 'Dreamy, floating' },
  { name: 'Major 7th', intervals: [0, 4, 7, 11], label: 'Smooth, jazz' },
  { name: 'Dominant 7th', intervals: [0, 4, 7, 10], label: 'Bluesy, tension' },
  { name: 'Minor 7th', intervals: [0, 3, 7, 10], label: 'Smooth, mellow' },
]

const accent = '#a78bfa'

type Mode = 'intervals' | 'chords'
type Phase = 'setup' | 'listen' | 'answer' | 'result'

export default function EarTrainingPage() {
  const [mode, setMode] = useState<Mode>('intervals')
  const [difficulty, setDifficulty] = useState(1) // 1=easy (up to P5), 2=medium (all), 3=hard (chords)
  const [phase, setPhase] = useState<Phase>('setup')
  const [currentQuestion, setCurrentQuestion] = useState<{ answer: string; notes: string[] }>({ answer: '', notes: [] })
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [streak, setStreak] = useState(0)

  const preloaded = useRef(false)
  if (!preloaded.current) { preloadSamples(CHROMATIC); preloaded.current = true }

  const availableIntervals = difficulty <= 1
    ? INTERVALS.filter(i => i.semitones <= 7)
    : INTERVALS

  const generateQuestion = useCallback(() => {
    if (mode === 'intervals') {
      const pool = difficulty <= 1 ? INTERVALS.filter(i => i.semitones <= 7) : INTERVALS
      const interval = pool[Math.floor(Math.random() * pool.length)]
      const baseIdx = Math.floor(Math.random() * 6) // C4 to F4
      const n1 = CHROMATIC[baseIdx]
      const n2 = noteAtSemitone(baseIdx, interval.semitones)
      setCurrentQuestion({ answer: interval.name, notes: [n1, n2] })
    } else {
      const pool = difficulty <= 1 ? CHORD_TYPES.slice(0, 3) : difficulty <= 2 ? CHORD_TYPES.slice(0, 4) : CHORD_TYPES
      const chord = pool[Math.floor(Math.random() * pool.length)]
      const baseIdx = Math.floor(Math.random() * 5)
      const notes = chord.intervals.map(i => noteAtSemitone(baseIdx, i))
      setCurrentQuestion({ answer: chord.name, notes })
    }
    setSelectedAnswer(null)
    setPhase('listen')
  }, [mode, difficulty])

  const playQuestion = useCallback(() => {
    const ctx = new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    ctx.close()

    if (mode === 'intervals') {
      // Play melodically: first note, then second
      playPianoNote(currentQuestion.notes[0], 0.7, 1)
      setTimeout(() => playPianoNote(currentQuestion.notes[1], 0.7, 1.5), 700)
    } else {
      // Play chord: all notes together
      currentQuestion.notes.forEach((n, i) => {
        setTimeout(() => playPianoNote(n, 0.6, 2), i * 40)
      })
    }
  }, [mode, currentQuestion])

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer)
    const correct = answer === currentQuestion.answer
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    setStreak(correct ? streak + 1 : 0)
    setPhase('result')
  }

  const options = mode === 'intervals'
    ? (difficulty <= 1 ? INTERVALS.filter(i => i.semitones <= 7) : INTERVALS).map(i => i.name)
    : (difficulty <= 1 ? CHORD_TYPES.slice(0, 3) : difficulty <= 2 ? CHORD_TYPES.slice(0, 4) : CHORD_TYPES).map(c => c.name)

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
        <Link to="/piano/practice" className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center transition-all">
          <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">Ear Training</h1>
          <p className="text-xs text-[#6b7280]">Listen and identify what you hear</p>
        </div>
        {score.total > 0 && (
          <div className="text-right">
            <div className="text-sm font-bold text-white">{score.correct}/{score.total}</div>
            <div className="text-[9px] text-[#4b5563]">{streak > 0 ? `${streak} streak` : 'Score'}</div>
          </div>
        )}
      </div>

      {/* Setup */}
      {phase === 'setup' && (
        <div className="space-y-3 sm:space-y-5">
          <div className="rounded-xl sm:rounded-2xl border border-white/[0.04] p-3 sm:p-4 md:p-5" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
            {/* Mode */}
            <label className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold block mb-3">What to identify</label>
            <div className="flex gap-2 mb-5">
              {(['intervals', 'chords'] as Mode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all cursor-pointer"
                  style={{
                    background: mode === m ? `${accent}15` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${mode === m ? `${accent}30` : 'rgba(255,255,255,0.04)'}`,
                    color: mode === m ? accent : '#6b7280',
                  }}>{m}</button>
              ))}
            </div>
            {/* Difficulty */}
            <label className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold block mb-3">Difficulty</label>
            <div className="flex gap-2">
              {[{ v: 1, l: 'Easy' }, { v: 2, l: 'Medium' }, { v: 3, l: 'Hard' }].map(d => (
                <button key={d.v} onClick={() => setDifficulty(d.v)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                  style={{
                    background: difficulty === d.v ? `${accent}15` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${difficulty === d.v ? `${accent}30` : 'rgba(255,255,255,0.04)'}`,
                    color: difficulty === d.v ? accent : '#6b7280',
                  }}>{d.l}</button>
              ))}
            </div>
            <p className="text-[10px] text-[#4b5563] mt-3">
              {mode === 'intervals'
                ? difficulty <= 1 ? 'Unison to Perfect 5th (7 intervals)' : 'All intervals up to Octave (12 intervals)'
                : difficulty <= 1 ? 'Major, Minor, Diminished' : difficulty <= 2 ? '+ Augmented' : 'All 7 chord types including 7ths'}
            </p>
          </div>
          <button onClick={generateQuestion}
            className="w-full py-3.5 rounded-xl text-white font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${accent}, #8b5cf6)`, boxShadow: `0 4px 20px -4px rgba(167,139,250,0.4)` }}>
            Start Training
          </button>
        </div>
      )}

      {/* Listen */}
      {phase === 'listen' && (
        <div className="space-y-5">
          <div className="rounded-xl sm:rounded-2xl border border-white/[0.04] p-5 sm:p-6 md:p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
            <button onClick={playQuestion}
              className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer mb-4"
              style={{ background: `linear-gradient(135deg, ${accent}, #8b5cf6)`, boxShadow: `0 4px 24px -4px rgba(167,139,250,0.4)` }}>
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </button>
            <p className="text-sm text-[#6b7280]">Click to play again</p>
          </div>

          <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold mb-2">What do you hear?</div>
          <div className="grid grid-cols-2 gap-2">
            {options.map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)}
                className="px-4 py-3 rounded-xl text-sm font-medium text-[#94a3b8] border border-white/[0.06] hover:bg-white/[0.04] hover:text-white transition-all cursor-pointer text-left">
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {phase === 'result' && (
        <div className="space-y-5">
          <div className="rounded-xl sm:rounded-2xl border border-white/[0.04] p-4 sm:p-5 md:p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
            {selectedAnswer === currentQuestion.answer ? (
              <>
                <div className="text-4xl mb-2">✅</div>
                <h2 className="text-lg font-bold text-emerald-400">Correct!</h2>
                <p className="text-sm text-[#6b7280] mt-1">
                  {currentQuestion.answer}
                  {mode === 'intervals' && (() => {
                    const def = INTERVALS.find(i => i.name === currentQuestion.answer)
                    return def ? ` — "${def.example}"` : ''
                  })()}
                </p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">❌</div>
                <h2 className="text-lg font-bold text-rose-400">Not quite</h2>
                <p className="text-sm text-[#6b7280] mt-1">
                  It was <span className="text-white font-medium">{currentQuestion.answer}</span>
                  {mode === 'intervals' && (() => {
                    const def = INTERVALS.find(i => i.name === currentQuestion.answer)
                    return def ? ` — "${def.example}"` : ''
                  })()}
                </p>
                <p className="text-xs text-[#4b5563] mt-1">You guessed: {selectedAnswer}</p>
              </>
            )}
            <button onClick={playQuestion} className="text-xs mt-3 cursor-pointer" style={{ color: accent }}>
              Hear it again
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={generateQuestion}
              className="flex-1 py-3 rounded-xl text-white font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${accent}, #8b5cf6)` }}>
              Next Question
            </button>
            <button onClick={() => { setPhase('setup'); setScore({ correct: 0, total: 0 }); setStreak(0) }}
              className="px-5 py-3 rounded-xl text-[#94a3b8] font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer">
              Settings
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
