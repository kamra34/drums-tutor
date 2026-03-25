import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getExerciseById, getModuleById } from '../data/curriculum'
import { useMetronomeStore } from '../stores/useMetronomeStore'
import { usePracticeStore, PracticeStatus } from '../stores/usePracticeStore'
import { useMidiStore } from '../stores/useMidiStore'
import { useUserStore } from '../stores/useUserStore'
import { useAiStore } from '../stores/useAiStore'
import { audioService } from '../services/audioService'
import { midiService } from '../services/midiService'
import { ScoringEngine } from '../services/scoringEngine'
import { aiService } from '../services/aiService'
import { AiFeedback } from '../types/ai'
import PatternGrid from '../components/shared/PatternGrid'
import StaffNotationDisplay from '../components/shared/StaffNotationDisplay'
import MetronomeControls from '../components/practice/MetronomeControls'
import JudgementFeedback from '../components/practice/JudgementFeedback'
import ResultsScreen from '../components/practice/ResultsScreen'

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

  // Reset all state when exercise changes (including navigating to next exercise)
  useEffect(() => {
    // Stop any running session
    audioService.stopMetronome()
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

  // Register MIDI listener
  useEffect(() => {
    const unsub = midiService.onNoteOn((event) => {
      if (practiceStore.status !== 'playing') return
      scoringEngineRef.current?.recordHit(event)

      const pad = midiService.resolvePad(event.note)
      if (pad) {
        useMidiStore.getState().padHit(pad, event.velocity)
        // Get judgement for display
        const score = scoringEngineRef.current?.getRealtimeScore()
        if (score) {
          practiceStore.updateScore(
            score.accuracy,
            score.hitCount,
            score.missCount,
            score.totalExpected
          )
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

    // Init scoring engine
    const engine = new ScoringEngine(exercise.patternData, bpm, drumMap)
    engine.setExerciseInfo(exercise.id, exercise.bars)
    scoringEngineRef.current = engine

    // Start metronome
    audioService.startMetronome(bpm, exercise.timeSignature, (beat) => {
      practiceStore.setCurrentBeat(beat)
    })

    startTimeRef.current = performance.now()
    engine.start()

    // Step tracker for grid highlight
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
    audioService.stopMetronome()
    practiceStore.setStatus('finished')
    setCurrentStep(-1)

    const result = scoringEngineRef.current?.finish()
    if (!result) return

    practiceStore.setResult(result)
    addExerciseResult(result)

    // Get AI feedback
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
    audioService.stopMetronome()
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioService.stopMetronome()
      clearInterval(stepIntervalRef.current!)
      clearInterval(countdownRef.current!)
    }
  }, [])

  if (!module || !exercise) {
    return (
      <div className="p-8 text-center text-[#6b7280]">
        Exercise not found.{' '}
        <Link to="/curriculum" className="text-violet-500 hover:underline">
          Back to curriculum
        </Link>
      </div>
    )
  }

  const status: PracticeStatus = practiceStore.status

  // Find next exercise
  const exIdx = module.exercises.findIndex((e) => e.id === exercise.id)
  const nextExercise = exIdx < module.exercises.length - 1 ? module.exercises[exIdx + 1] : undefined

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-6">
        <Link to="/curriculum" className="hover:text-violet-400">Curriculum</Link>
        <span>›</span>
        <Link to="/curriculum" state={{ expandModule: module.id }} className="text-[#6b7280] hover:text-violet-400 transition-colors">
          {module.name}
        </Link>
        <span>›</span>
        <span className="text-[#94a3b8]">{exercise.title}</span>
      </nav>

      {status === 'finished' && practiceStore.result ? (
        <div>
          <h1 className="text-2xl font-bold text-white mb-6">Results</h1>
          <ResultsScreen
            result={practiceStore.result}
            feedback={aiFeedback}
            feedbackLoading={feedbackLoading}
            onRetry={handleRetry}
            onNext={
              nextExercise
                ? () => navigate(`/exercise/${module.id}/${nextExercise.id}`)
                : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Left: pattern + controls */}
          <div className="col-span-2 space-y-5">
            {/* Exercise header */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{exercise.title}</h1>
              <p className="text-sm text-[#6b7280]">{exercise.description}</p>
              <div className="flex gap-4 mt-2 text-xs text-[#4b5563]">
                <span>🎵 {exercise.timeSignature.join('/')} time</span>
                <span>🥁 {exercise.bars} bar{exercise.bars > 1 ? 's' : ''}</span>
                <span>⚡ Difficulty {exercise.difficulty}/10</span>
              </div>
            </div>

            {/* Staff notation (primary) */}
            <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-4">
              <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-3">Notation</div>
              <StaffNotationDisplay
                pattern={exercise.patternData}
                currentStep={status === 'playing' ? currentStep : undefined}
                bpm={exercise.targetBpm}
                bars={exercise.bars}
              />
            </div>

            {/* Grid view is now included inside StaffNotationDisplay */}

            {/* Judgement + live stats */}
            <JudgementFeedback
              judgement={practiceStore.lastJudgement?.judgement ?? null}
              offsetMs={practiceStore.lastJudgement?.offsetMs}
              timestamp={practiceStore.lastJudgementTime}
            />

            {status === 'playing' && (
              <div className="flex gap-4 text-sm text-center">
                <div className="flex-1 bg-[#0d1117] border border-[#1e2433] rounded-lg py-2">
                  <div className="text-lg font-bold text-white">
                    {Math.round(practiceStore.accuracy * 100)}%
                  </div>
                  <div className="text-xs text-[#4b5563]">Accuracy</div>
                </div>
                <div className="flex-1 bg-[#0d1117] border border-[#1e2433] rounded-lg py-2">
                  <div className="text-lg font-bold text-green-400">{practiceStore.hitCount}</div>
                  <div className="text-xs text-[#4b5563]">Hits</div>
                </div>
                <div className="flex-1 bg-[#0d1117] border border-[#1e2433] rounded-lg py-2">
                  <div className="text-lg font-bold text-red-400">{practiceStore.missCount}</div>
                  <div className="text-xs text-[#4b5563]">Misses</div>
                </div>
              </div>
            )}

            {/* Start/Stop button */}
            <div>
              {status === 'idle' && (
                <>
                  {!isConnected && (
                    <div className="mb-3 text-xs text-yellow-600 bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-3 py-2">
                      No drum kit connected — connect your e-drum in{' '}
                      <Link to="/settings" className="underline">Settings</Link> to practice with MIDI scoring.
                      You can still listen to the metronome.
                    </div>
                  )}
                  <button
                    onClick={startCountdown}
                    className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-colors"
                  >
                    Start Practice
                  </button>
                </>
              )}

              {status === 'countdown' && (
                <div className="w-full py-3 text-center">
                  <div className="text-6xl font-bold text-violet-400 animate-pulse">{countdown}</div>
                  <div className="text-[#6b7280] text-sm mt-1">Get ready…</div>
                </div>
              )}

              {status === 'playing' && (
                <button
                  onClick={handleStop}
                  className="w-full py-3 rounded-xl bg-red-800/50 hover:bg-red-700/50 text-red-300 font-medium transition-colors border border-red-800/40"
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          {/* Right: metronome */}
          <div>
            <MetronomeControls
              disabled={status !== 'idle'}
              onBpmChange={setBpm}
            />
          </div>
        </div>
      )}
    </div>
  )
}
