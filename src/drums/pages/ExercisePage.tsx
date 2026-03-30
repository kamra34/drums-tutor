import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getExerciseById, getModuleById } from '@drums/data/curriculum'
import { useMetronomeStore } from '@drums/stores/useMetronomeStore'
import { usePracticeStore, PracticeStatus } from '@drums/stores/usePracticeStore'
import { useMidiStore } from '@drums/stores/useMidiStore'
import { useUserStore } from '@shared/stores/useUserStore'
import { useAiStore } from '@shared/stores/useAiStore'
import { midiService } from '@drums/services/midiService'
import { ScoringEngine } from '@drums/services/scoringEngine'
import { aiService } from '@drums/services/aiService'
import { AiFeedback } from '@shared/types/ai'
import PatternGrid from '@drums/components/PatternGrid'
import StaffNotationDisplay from '@drums/components/StaffNotationDisplay'
import MetronomeWidget from '@drums/components/MetronomeWidget'
import JudgementFeedback from '@drums/components/practice/JudgementFeedback'
import ResultsScreen from '@drums/components/practice/ResultsScreen'

export default function ExercisePage() {
  const { moduleId, exerciseId } = useParams<{ moduleId: string; exerciseId: string }>()
  const navigate = useNavigate()

  const module = moduleId ? getModuleById(moduleId) : undefined
  const exercise = exerciseId ? getExerciseById(exerciseId) : undefined

  const { bpm, setBpm } = useMetronomeStore()
  const practiceStore = usePracticeStore()
  const { isConnected, drumMap, activePads } = useMidiStore()
  const { addExerciseResult, progress } = useUserStore()
  const { apiKey, isConfigured } = useAiStore()

  const [countdown, setCountdown] = useState(0)
  const [currentStep, setCurrentStep] = useState(-1)
  const [aiFeedback, setAiFeedback] = useState<AiFeedback | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const scoringEngineRef = useRef<ScoringEngine | null>(null)
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    clearInterval(stepIntervalRef.current!)
    clearInterval(countdownRef.current!)
    scoringEngineRef.current = null

    if (exercise) setBpm(exercise.targetBpm)
    practiceStore.reset()
    setAiFeedback(null)
    setFeedbackLoading(false)
    setCurrentStep(-1)
    setCountdown(0)
  }, [exercise?.id])

  useEffect(() => {
    const unsub = midiService.onNoteOn((event) => {
      if (practiceStore.status !== 'playing') return
      scoringEngineRef.current?.recordHit(event)

      const pad = midiService.resolvePad(event.note)
      if (pad) {
        useMidiStore.getState().padHit(pad, event.velocity)
        const score = scoringEngineRef.current?.getRealtimeScore()
        if (score) {
          practiceStore.updateScore(score.accuracy, score.hitCount, score.missCount, score.totalExpected)
        }
      }
    })
    return unsub
  }, [])

  function startCountdown() {
    practiceStore.setStatus('countdown')
    setCountdown(3)
    let count = 3
    countdownRef.current = setInterval(() => {
      count--
      setCountdown(count)
      if (count === 0) {
        clearInterval(countdownRef.current!)
        startPractice()
      }
    }, 1000)
  }

  function startPractice() {
    if (!exercise) return
    practiceStore.setStatus('playing')
    practiceStore.reset()

    const engine = new ScoringEngine(exercise.patternData, bpm, drumMap)
    engine.setExerciseInfo(exercise.id, exercise.bars)
    scoringEngineRef.current = engine

    startTimeRef.current = performance.now()
    engine.start()

    const stepDurationMs = (60000 / bpm) / exercise.patternData.subdivisions
    const totalSteps = exercise.patternData.beats * exercise.patternData.subdivisions * exercise.bars
    let step = 0

    stepIntervalRef.current = setInterval(() => {
      const gridStep = step % (exercise.patternData.beats * exercise.patternData.subdivisions)
      setCurrentStep(gridStep)
      step++
      if (step >= totalSteps) {
        clearInterval(stepIntervalRef.current!)
        finishPractice()
      }
    }, stepDurationMs)
  }

  const finishPractice = useCallback(() => {
    practiceStore.setStatus('finished')
    setCurrentStep(-1)

    const result = scoringEngineRef.current?.finish()
    if (!result) return

    practiceStore.setResult(result)
    addExerciseResult(result)

    if (isConfigured) {
      setFeedbackLoading(true)
      aiService.setApiKey(apiKey)
      const avgSkill = Object.values(progress.skillProfile).reduce((a, b) => a + b, 0) / 5
      aiService
        .getExerciseFeedback(result, {
          studentLevel: avgSkill >= 75 ? 'advanced' : avgSkill >= 45 ? 'intermediate' : 'beginner',
          currentModule: progress.currentModule,
          exerciseName: exercise?.title,
        })
        .then((fb) => setAiFeedback(fb))
        .finally(() => setFeedbackLoading(false))
    }
  }, [exercise, isConfigured, apiKey, progress])

  function handleStop() {
    clearInterval(stepIntervalRef.current!)
    clearInterval(countdownRef.current!)
    practiceStore.reset()
    setCurrentStep(-1)
    setCountdown(0)
    scoringEngineRef.current = null
  }

  function handleRetry() {
    handleStop()
    setAiFeedback(null)
    practiceStore.reset()
  }

  useEffect(() => {
    return () => {
      clearInterval(stepIntervalRef.current!)
      clearInterval(countdownRef.current!)
    }
  }, [])

  if (!module || !exercise) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="rounded-2xl border border-white/[0.04] p-8 text-center" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
        }}>
          <p className="text-[#6b7280] mb-3">Exercise not found.</p>
          <Link to="/drums/curriculum" className="text-amber-500/80 hover:text-amber-400 text-sm font-medium transition-colors">
            Back to curriculum
          </Link>
        </div>
      </div>
    )
  }

  const status: PracticeStatus = practiceStore.status
  const exIdx = module.exercises.findIndex((e) => e.id === exercise.id)
  const nextExercise = exIdx < module.exercises.length - 1 ? module.exercises[exIdx + 1] : undefined

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-[1800px] mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-4 sm:mb-6">
        <Link to="/drums/curriculum" className="hover:text-amber-400 transition-colors">Curriculum</Link>
        <svg className="w-3.5 h-3.5 text-[#2d3748]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link to="/drums/curriculum" state={{ expandModule: module.id }} className="text-[#6b7280] hover:text-amber-400 transition-colors">
          {module.name}
        </Link>
        <svg className="w-3.5 h-3.5 text-[#2d3748]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[#94a3b8]">{exercise.title}</span>
      </nav>

      {status === 'finished' && practiceStore.result ? (
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-6 tracking-tight">Results</h1>
          <ResultsScreen
            result={practiceStore.result}
            feedback={aiFeedback}
            feedbackLoading={feedbackLoading}
            onRetry={handleRetry}
            onNext={
              nextExercise
                ? () => navigate(`/drums/exercise/${module.id}/${nextExercise.id}`)
                : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-5">
            {/* Exercise header */}
            <div>
              <h1 className="text-2xl font-extrabold text-white mb-1 tracking-tight">{exercise.title}</h1>
              <p className="text-sm text-[#6b7280]">{exercise.description}</p>
              <div className="flex gap-4 mt-3 text-xs text-[#4b5563]">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                  </svg>
                  {exercise.timeSignature.join('/')} time
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  {exercise.bars} bar{exercise.bars > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Difficulty {exercise.difficulty}/10
                </span>
              </div>
            </div>

            {/* Staff notation */}
            <div className="rounded-2xl border border-white/[0.04] p-5" style={{
              background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
            }}>
              <span className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">Notation</span>
              <div className="mt-3">
                <StaffNotationDisplay
                  pattern={exercise.patternData}
                  currentStep={status === 'playing' ? currentStep : undefined}
                  bpm={bpm}
                  bars={exercise.bars}
                  onBpmChange={setBpm}
                  metronomeSlot={<MetronomeWidget />}
                />
              </div>
            </div>

            {/* Judgement feedback */}
            <JudgementFeedback
              judgement={practiceStore.lastJudgement?.judgement ?? null}
              offsetMs={practiceStore.lastJudgement?.offsetMs}
              timestamp={practiceStore.lastJudgementTime}
            />

            {/* Live stats */}
            {status === 'playing' && (
              <div className="flex gap-3 text-sm text-center">
                <div className="flex-1 rounded-xl border border-white/[0.04] py-3" style={{
                  background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
                }}>
                  <div className="text-xl font-extrabold text-white">{Math.round(practiceStore.accuracy * 100)}%</div>
                  <div className="text-[11px] text-[#4b5563] font-medium mt-0.5">Accuracy</div>
                </div>
                <div className="flex-1 rounded-xl border border-white/[0.04] py-3" style={{
                  background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
                }}>
                  <div className="text-xl font-extrabold text-emerald-400">{practiceStore.hitCount}</div>
                  <div className="text-[11px] text-[#4b5563] font-medium mt-0.5">Hits</div>
                </div>
                <div className="flex-1 rounded-xl border border-white/[0.04] py-3" style={{
                  background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
                }}>
                  <div className="text-xl font-extrabold text-rose-400">{practiceStore.missCount}</div>
                  <div className="text-[11px] text-[#4b5563] font-medium mt-0.5">Misses</div>
                </div>
              </div>
            )}

            {/* Start/Stop/Countdown */}
            <div>
              {status === 'idle' && (
                <>
                  {!isConnected && (
                    <div className="mb-3 text-xs text-amber-400/80 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl px-4 py-2.5">
                      No drum kit connected — connect your e-drum in{' '}
                      <Link to="/settings" className="underline hover:text-amber-300 transition-colors">Settings</Link>{' '}
                      for MIDI scoring. You can still listen to the metronome.
                    </div>
                  )}
                  <button
                    onClick={startCountdown}
                    className="w-full py-3.5 rounded-xl text-white font-semibold text-lg transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                      boxShadow: '0 4px 20px -4px rgba(245,158,11,0.35)',
                    }}
                  >
                    Start Practice
                  </button>
                </>
              )}

              {status === 'countdown' && (
                <div className="w-full py-6 text-center">
                  <div className="text-7xl font-extrabold bg-gradient-to-b from-amber-400 to-orange-500 bg-clip-text text-transparent animate-pulse">{countdown}</div>
                  <div className="text-[#6b7280] text-sm mt-2">Get ready...</div>
                </div>
              )}

              {status === 'playing' && (
                <button
                  onClick={handleStop}
                  className="w-full py-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 font-medium transition-colors border border-rose-500/20 cursor-pointer"
                >
                  Stop
                </button>
              )}
            </div>
        </div>
      )}
    </div>
  )
}
