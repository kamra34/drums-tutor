import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPracticeItemById, PracticeItem } from '@drums/data/practiceLibrary'
import { useMetronomeStore } from '@drums/stores/useMetronomeStore'
import { usePracticeStore, PracticeStatus } from '@drums/stores/usePracticeStore'
import { useMidiStore } from '@drums/stores/useMidiStore'
import { useUserStore } from '@shared/stores/useUserStore'
import { midiService } from '@drums/services/midiService'
import { ScoringEngine } from '@drums/services/scoringEngine'
import { apiGetExercise } from '@shared/services/apiClient'
import PatternGrid from '@drums/components/PatternGrid'
import StaffNotationDisplay from '@drums/components/StaffNotationDisplay'
import MetronomeWidget from '@drums/components/MetronomeWidget'
import JudgementFeedback from '@drums/components/practice/JudgementFeedback'
import ResultsScreen from '@drums/components/practice/ResultsScreen'

export default function PracticePlayerPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()

  // Support studio patterns via "studio:<dbId>" prefix
  const isStudioPattern = itemId?.startsWith('studio:')
  const libraryItem = !isStudioPattern && itemId ? getPracticeItemById(itemId) : undefined

  const [studioItem, setStudioItem] = useState<PracticeItem | null>(null)
  const [studioLoading, setStudioLoading] = useState(false)

  useEffect(() => {
    if (!isStudioPattern || !itemId) return
    const dbId = itemId.replace('studio:', '')
    setStudioLoading(true)
    apiGetExercise(dbId).then(({ exercise }) => {
      setStudioItem({
        id: exercise.id,
        title: exercise.title,
        description: exercise.description || 'Custom pattern from Studio',
        category: 'reading',
        difficulty: exercise.difficulty ?? 5,
        bpm: exercise.bpm ?? 90,
        timeSignature: (exercise.timeSignature ?? [4, 4]) as [number, number],
        bars: exercise.bars ?? 1,
        patternData: exercise.patternData,
        tags: exercise.tags ?? ['studio'],
      })
    }).catch(() => setStudioItem(null))
      .finally(() => setStudioLoading(false))
  }, [itemId, isStudioPattern])

  const item = libraryItem ?? studioItem ?? undefined

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
    engine.setExerciseInfo(item.id, 1)
    scoringEngineRef.current = engine

    engine.start()

    const stepDurationMs = (60000 / bpm) / item.patternData.subdivisions
    const totalSteps = item.patternData.beats * item.patternData.subdivisions
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
      clearInterval(stepIntervalRef.current!)
      clearInterval(countdownRef.current!)
    }
  }, [])

  // Ensure beats reflects total beats across all bars
  // (older saves may have beats = beatsPerBar instead of total)
  const displayPattern = useMemo(() => {
    if (!item) return undefined
    const pd = item.patternData
    const expectedTotal = item.timeSignature[0] * item.bars
    if (pd.beats < expectedTotal) {
      return { ...pd, beats: expectedTotal }
    }
    return pd
  }, [item])

  if (studioLoading) {
    return <div className="p-8 text-center text-[#6b7280]">Loading pattern...</div>
  }

  if (!item) {
    return (
      <div className="p-8 text-center text-[#6b7280]">
        Exercise not found.{' '}
        <Link to="/drums/practice" className="text-amber-500/80 hover:text-amber-400 transition-colors">Back to Practice</Link>
      </div>
    )
  }

  const status: PracticeStatus = practiceStore.status

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto">
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-6">
        <Link to={isStudioPattern ? '/drums/studio' : '/drums/practice'} className="text-amber-500/80 hover:text-amber-400 transition-colors">
          {isStudioPattern ? 'Studio' : 'Practice'}
        </Link>
        <svg className="w-3.5 h-3.5 text-[#2d3748]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-[#94a3b8]">{item.title}</span>
      </nav>

      {status === 'finished' && practiceStore.result ? (
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-6">Results</h1>
          <ResultsScreen
            result={practiceStore.result}
            feedback={null}
            feedbackLoading={false}
            onRetry={handleRetry}
          />
        </div>
      ) : (
        <div className="space-y-5">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">{item.title}</h1>
              <p className="text-sm text-[#6b7280]">{item.description}</p>
              <div className="flex gap-3 mt-2.5 text-xs text-[#6b7280]">
                <span className="px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">{item.timeSignature.join('/')}</span>
                <span className="px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">{Math.ceil(item.patternData.beats / item.timeSignature[0])} bar{Math.ceil(item.patternData.beats / item.timeSignature[0]) > 1 ? 's' : ''}</span>
                <span className="px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">{item.difficulty}/10</span>
                <span className="capitalize px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">{item.category}</span>
              </div>
            </div>

            {/* Metronome */}
            {/* Staff notation (primary view) */}
            <div className="rounded-2xl p-5 border border-white/[0.04]" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
              <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-3">Notation</div>
              <StaffNotationDisplay
                pattern={displayPattern!}
                currentStep={status === 'playing' ? currentStep : undefined}
                bpm={bpm}
                bars={1}
                beatsPerBar={item.timeSignature[0]}
                onBpmChange={setBpm}
                metronomeSlot={<MetronomeWidget />}
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
                <div className="flex-1 rounded-2xl py-3 border border-white/[0.04]" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
                  <div className="text-lg font-bold text-white">{Math.round(practiceStore.accuracy * 100)}%</div>
                  <div className="text-[10px] text-[#4b5563] uppercase tracking-wider">Accuracy</div>
                </div>
                <div className="flex-1 rounded-2xl py-3 border border-white/[0.04]" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
                  <div className="text-lg font-bold text-emerald-400">{practiceStore.hitCount}</div>
                  <div className="text-[10px] text-[#4b5563] uppercase tracking-wider">Hits</div>
                </div>
                <div className="flex-1 rounded-2xl py-3 border border-white/[0.04]" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
                  <div className="text-lg font-bold text-rose-400">{practiceStore.missCount}</div>
                  <div className="text-[10px] text-[#4b5563] uppercase tracking-wider">Misses</div>
                </div>
              </div>
            )}

            <div>
              {status === 'idle' && (
                <>
                  {!isConnected && (
                    <div className="mb-3 text-xs text-amber-400/80 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl px-3 py-2">
                      No drum kit connected — <Link to="/settings" className="text-amber-500/80 hover:text-amber-400 underline transition-colors">Settings</Link>
                    </div>
                  )}
                  <button onClick={startCountdown}
                    className="w-full py-3 rounded-xl text-white font-semibold text-lg transition-colors"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 20px -4px rgba(245,158,11,0.35)' }}>
                    Start Practice
                  </button>
                </>
              )}
              {status === 'countdown' && (
                <div className="w-full py-3 text-center">
                  <div className="text-6xl font-bold text-amber-400 animate-pulse">{countdown}</div>
                  <div className="text-[#6b7280] text-sm mt-1">Get ready…</div>
                </div>
              )}
              {status === 'playing' && (
                <button onClick={handleStop}
                  className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 font-medium transition-colors border border-rose-500/20">
                  Stop
                </button>
              )}
            </div>
        </div>
      )}
    </div>
  )
}
