import { useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { getExerciseById, getModuleById } from '@piano/data/curriculum'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'
import PracticePlayer from '@piano/components/PracticePlayer'
import SelfAssessment from './practice/SelfAssessment'

export default function PianoExercisePage() {
  const { moduleId, exerciseId } = useParams<{ moduleId: string; exerciseId: string }>()
  const [searchParams] = useSearchParams()
  const fromPractice = searchParams.get('from') === 'practice'
  const module = moduleId ? getModuleById(moduleId) : undefined
  const exercise = exerciseId ? getExerciseById(exerciseId) : undefined
  const { addPracticeTime } = usePianoProgressStore()

  const [showAssessment, setShowAssessment] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [instructionsOpen, setInstructionsOpen] = useState(false)

  if (!module || !exercise) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="rounded-2xl border border-white/[0.04] p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
          <p className="text-[#6b7280] mb-3">Exercise not found.</p>
          <Link to="/piano/curriculum" className="text-[#a78bfa] hover:text-[#c4b5fd] text-sm font-medium transition-colors">Back to curriculum</Link>
        </div>
      </div>
    )
  }

  if (showAssessment) {
    return <SelfAssessment exerciseName={exercise.title} sessionCount={sessionCount} onDone={() => { setShowAssessment(false); setSessionCount(0) }} />
  }

  const exIdx = module.exercises.findIndex(e => e.id === exercise.id)
  const nextExercise = exIdx < module.exercises.length - 1 ? module.exercises[exIdx + 1] : undefined
  const prevExercise = exIdx > 0 ? module.exercises[exIdx - 1] : undefined
  const timeSig: [number, number] = exercise.timeSignature ?? [4, 4]
  const difficultyColor = exercise.difficulty <= 2 ? '#22c55e' : exercise.difficulty <= 4 ? '#eab308' : exercise.difficulty <= 6 ? '#f97316' : '#ef4444'
  const hasBothHands = !!(exercise.notesLeft?.length || exercise.chordsLeft?.length)

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 max-w-[1800px] mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#4b5563] mb-3 sm:mb-5">
        {fromPractice ? (<>
          <Link to="/piano/practice" className="hover:text-[#a78bfa] transition-colors">Practice</Link>
          <Chev />
          <Link to="/piano/practice/exercises" className="hover:text-[#a78bfa] transition-colors">Exercises</Link>
        </>) : (<>
          <Link to="/piano/curriculum" className="hover:text-[#a78bfa] transition-colors">Curriculum</Link>
          <Chev />
          <Link to="/piano/curriculum" state={{ expandModule: module.id }} className="hover:text-[#a78bfa] transition-colors truncate max-w-[150px]">{module.name}</Link>
        </>)}
        <Chev />
        <span className="text-[#94a3b8] truncate">{exercise.title}</span>
      </nav>

      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden mb-3 sm:mb-5" style={{
        background: 'linear-gradient(135deg, rgba(167,139,250,0.06) 0%, rgba(139,92,246,0.03) 50%, rgba(12,14,20,0.8) 100%)',
        border: '1px solid rgba(167,139,250,0.1)',
      }}>
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
        <div className="relative p-3 sm:p-5 lg:p-6">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white tracking-tight leading-tight">{exercise.title}</h1>
              <p className="text-sm text-[#6b7280] mt-1 leading-relaxed">{exercise.description}</p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black"
                style={{ background: `${difficultyColor}15`, border: `1px solid ${difficultyColor}30`, color: difficultyColor }}>{exercise.difficulty}</div>
              <span className="text-[9px] uppercase tracking-wider text-[#4b5563]">Level</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2.5 sm:mt-3.5">
            <Tag>{exercise.exerciseType.replace('-', ' ')}</Tag>
            <Tag>{exercise.handsRequired === 'both' ? 'Both hands' : exercise.handsRequired === 'right' ? 'Right hand' : 'Left hand'}</Tag>
            {exercise.keySignature && <Tag>Key: {exercise.keySignature}</Tag>}
            <Tag>{timeSig[0]}/{timeSig[1]} time</Tag>
            {hasBothHands && <span className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Grand Staff</span>}
          </div>
          {sessionCount >= 1 && (
            <button onClick={() => { addPracticeTime(Math.max(1, sessionCount)); setShowAssessment(true) }}
              className="mt-3 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all cursor-pointer">
              Self-Assess ({sessionCount}x done)
            </button>
          )}
        </div>
      </div>

      {/* Instructions (collapsible) */}
      {exercise.instructions && exercise.instructions.length > 0 && (
        <button onClick={() => setInstructionsOpen(!instructionsOpen)}
          className="w-full mb-3 sm:mb-4 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 transition-all cursor-pointer"
          style={{
            background: instructionsOpen ? 'rgba(167,139,250,0.04)' : 'rgba(255,255,255,0.01)',
            border: `1px solid ${instructionsOpen ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)'}`,
          }}>
          <svg className={`w-4 h-4 text-[#a78bfa] transition-transform ${instructionsOpen ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider flex-1 text-left">Instructions</span>
          <span className="text-[10px] text-[#4b5563]">{exercise.instructions.length} steps</span>
        </button>
      )}
      {instructionsOpen && exercise.instructions && (
        <div className="mb-3 sm:mb-5 rounded-xl border border-white/[0.04] p-3 sm:p-4 space-y-2" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.5) 0%, rgba(10,12,18,0.6) 100%)' }}>
          {exercise.instructions.map((inst, i) => (
            <div key={i} className="flex gap-2 sm:gap-3 text-sm">
              <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
                style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>{i + 1}</span>
              <span className="text-[#94a3b8] leading-relaxed">{inst}</span>
            </div>
          ))}
        </div>
      )}

      {/* Playback — shared PracticePlayer with both-hands support */}
      <PracticePlayer
        notes={exercise.notes}
        chords={exercise.chords}
        notesLeft={exercise.notesLeft}
        chordsLeft={exercise.chordsLeft}
        defaultBpm={exercise.targetBpm ?? 72}
        timeSignature={exercise.timeSignature}
        resetKey={exercise.id}
        onSessionComplete={() => setSessionCount(c => c + 1)}
      />

      {/* Nav footer */}
      <div className="flex items-center justify-between mt-4">
        <div>{prevExercise && (
          <Link to={`/piano/exercise/${module.id}/${prevExercise.id}${fromPractice ? '?from=practice' : ''}`} className="flex items-center gap-1.5 text-xs text-[#4b5563] hover:text-[#94a3b8] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Previous
          </Link>
        )}</div>
        <Link to={fromPractice ? '/piano/practice/exercises' : '/piano/curriculum'} state={fromPractice ? undefined : { expandModule: module.id }}
          className="text-xs text-[#4b5563] hover:text-[#94a3b8] transition-colors">All exercises</Link>
        <div>{nextExercise && (
          <Link to={`/piano/exercise/${module.id}/${nextExercise.id}${fromPractice ? '?from=practice' : ''}`} className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: '#a78bfa' }}>
            Next<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        )}</div>
      </div>
    </div>
  )
}

function Chev() {
  return <svg className="w-3 h-3 text-[#2d3748] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="px-2.5 py-1 rounded-md text-[10px] font-medium capitalize" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#6b7280' }}>{children}</span>
}
