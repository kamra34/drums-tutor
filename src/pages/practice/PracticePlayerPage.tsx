import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPracticeItemById } from '../../data/practiceLibrary'
import { useMetronomeStore } from '../../stores/useMetronomeStore'
import { usePracticeStore, PracticeStatus } from '../../stores/usePracticeStore'
import { useMidiStore } from '../../stores/useMidiStore'
import { useUserStore } from '../../stores/useUserStore'
import { audioService } from '../../services/audioService'
import { midiService } from '../../services/midiService'
import { ScoringEngine } from '../../services/scoringEngine'
import PatternGrid from '../../components/shared/PatternGrid'
import StaffNotationDisplay from '../../components/shared/StaffNotationDisplay'
import MetronomeControls from '../../components/practice/MetronomeControls'
import JudgementFeedback from '../../components/practice/JudgementFeedback'
import ResultsScreen from '../../components/practice/ResultsScreen'

export default function PracticePlayerPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const item = itemId ? getPracticeItemById(itemId) : undefined

  const { bpm, setBpm } = useMetronomeStore()
  const practiceStore = usePracticeStore()
  const { isConnected, drumMap, activePads } = useMidiStore()
  const { addExerciseResult } = useUserStore()

  const [countdown, setCountdown] = useState(0)
  const [currentStep, setCurrentStep] = useState(-1)

  const scoringEngineRef = useRef<ScoringEngine | null>(null)
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset on item change
  useEffect(() => {
    audioService.stopMetronome()
    clearInterval(stepIntervalRef.current!)
    clearInterval(countdownRef.current!)
    scoringEngineRef.current = null
    if (item) setBpm(item.bpm)
    practiceStore.reset()
    setCurrentStep(-1)
    setCountdown(0)
  }, [item?.id])

  // MIDI listener
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
    if (!item) return
    practiceStore.setStatus('playing')
    practiceStore.reset()

    const engine = new ScoringEngine(item.patternData, bpm, drumMap)
    engine.setExerciseInfo(item.id, item.bars)
    scoringEngineRef.current = engine

    audioService.startMetronome(bpm, item.timeSignature, (beat) => {
      practiceStore.setCurrentBeat(beat)
    })

    engine.start()

    const stepDurationMs = (60000 / bpm) / item.patternData.subdivisions
    const totalSteps = item.patternData.beats * item.patternData.subdivisions * item.bars
    let step = 0

    stepIntervalRef.current = setInterval(() => {
      const gridStep = step % (item.patternData.beats * item.patternData.subdivisions)
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
  }, [item])

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
    practiceStore.reset()
  }

  useEffect(() => {
    return () => {
      audioService.stopMetronome()
      clearInterval(stepIntervalRef.current!)
      clearInterval(countdownRef.current!)
    }
  }, [])

  if (!item) {
    return (
      <div className="p-8 text-center text-[#6b7280]">
        Exercise not found.{' '}
        <Link to="/practice" className="text-violet-500 hover:underline">Back to Practice</Link>
      </div>
    )
  }

  const status: PracticeStatus = practiceStore.status

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-6">
        <Link to="/practice" className="hover:text-violet-400">Practice</Link>
        <span>›</span>
        <span className="text-[#94a3b8]">{item.title}</span>
      </nav>

      {status === 'finished' && practiceStore.result ? (
        <div>
          <h1 className="text-2xl font-bold text-white mb-6">Results</h1>
          <ResultsScreen
            result={practiceStore.result}
            feedback={null}
            feedbackLoading={false}
            onRetry={handleRetry}
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{item.title}</h1>
              <p className="text-sm text-[#6b7280]">{item.description}</p>
              <div className="flex gap-4 mt-2 text-xs text-[#4b5563]">
                <span>🎵 {item.timeSignature.join('/')}</span>
                <span>🥁 {item.bars} bar{item.bars > 1 ? 's' : ''}</span>
                <span>⚡ {item.difficulty}/10</span>
                <span className="capitalize bg-[#1e2433] px-1.5 py-0.5 rounded">{item.category}</span>
              </div>
            </div>

            {/* Staff notation (primary view) */}
            <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-4">
              <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-3">Notation</div>
              <StaffNotationDisplay
                pattern={item.patternData}
                currentStep={status === 'playing' ? currentStep : undefined}
                bpm={item.bpm}
                bars={item.bars}
              />
            </div>

            {/* Grid view is now included inside StaffNotationDisplay */}

            <JudgementFeedback
              judgement={practiceStore.lastJudgement?.judgement ?? null}
              offsetMs={practiceStore.lastJudgement?.offsetMs}
              timestamp={practiceStore.lastJudgementTime}
            />

            {status === 'playing' && (
              <div className="flex gap-4 text-sm text-center">
                <div className="flex-1 bg-[#0d1117] border border-[#1e2433] rounded-lg py-2">
                  <div className="text-lg font-bold text-white">{Math.round(practiceStore.accuracy * 100)}%</div>
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

            <div>
              {status === 'idle' && (
                <>
                  {!isConnected && (
                    <div className="mb-3 text-xs text-yellow-600 bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-3 py-2">
                      No drum kit connected — <Link to="/settings" className="underline">Settings</Link>
                    </div>
                  )}
                  <button onClick={startCountdown}
                    className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-colors">
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
                <button onClick={handleStop}
                  className="w-full py-3 rounded-xl bg-red-800/50 hover:bg-red-700/50 text-red-300 font-medium transition-colors border border-red-800/40">
                  Stop
                </button>
              )}
            </div>
          </div>

          <div>
            <MetronomeControls disabled={status !== 'idle'} onBpmChange={setBpm} />
          </div>
        </div>
      )}
    </div>
  )
}
