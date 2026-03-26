import { useState, useCallback } from 'react'
import { PatternData, HitValue } from '../../types/curriculum'
import { DrumPad } from '../../types/midi'
import {
  ExerciseConfig, InstrumentSet, NoteValueSet,
  generateExercise, buildAiExercisePrompt,
} from '../../services/notationExerciseGenerator'
import { useAiStore } from '../../stores/useAiStore'
import { aiService } from '../../services/aiService'
import StaffNotationDisplay from '../shared/StaffNotationDisplay'

// ── Display info ─────────────────────────────────────────────────────────────

const INSTRUMENT_INFO: { key: keyof InstrumentSet; label: string; group: 'cymbal' | 'drum' }[] = [
  { key: 'hihatClosed', label: 'Hi-Hat', group: 'cymbal' },
  { key: 'hihatOpen', label: 'HH Open', group: 'cymbal' },
  { key: 'ride', label: 'Ride', group: 'cymbal' },
  { key: 'crash', label: 'Crash', group: 'cymbal' },
  { key: 'hihatPedal', label: 'HH Pedal', group: 'cymbal' },
  { key: 'snare', label: 'Snare', group: 'drum' },
  { key: 'kick', label: 'Kick', group: 'drum' },
  { key: 'tom1', label: 'Tom 1', group: 'drum' },
  { key: 'tom2', label: 'Tom 2', group: 'drum' },
  { key: 'floorTom', label: 'Floor Tom', group: 'drum' },
]

const NOTE_VALUE_INFO: { key: keyof NoteValueSet; label: string; symbol: string }[] = [
  { key: 'whole', label: 'Whole', symbol: '𝅝' },
  { key: 'half', label: 'Half', symbol: '𝅗𝅥' },
  { key: 'quarter', label: 'Quarter', symbol: '♩' },
  { key: 'eighth', label: 'Eighth', symbol: '♪' },
  { key: 'sixteenth', label: '16th', symbol: '𝅘𝅥𝅯' },
  { key: 'triplet', label: 'Triplet', symbol: '³' },
]

const STYLE_PRESETS = [
  { label: 'Rock', prompt: 'Standard rock groove with driving kick and snare backbeat' },
  { label: 'Funk', prompt: 'Funky groove with ghost notes, syncopated kick, tight hi-hat' },
  { label: 'Jazz', prompt: 'Jazz swing feel with ride cymbal, cross-stick, and kick comping' },
  { label: 'Latin', prompt: 'Latin rhythm with tumbao bass pattern and cascara on ride' },
  { label: 'Metal', prompt: 'Heavy double kick pattern with fast hi-hat and powerful snare' },
  { label: 'Hip-Hop', prompt: 'Laid-back hip-hop beat with boom-bap feel and open hi-hat accents' },
  { label: 'Shuffle', prompt: 'Blues shuffle with triplet feel on hi-hat and walking bass drum' },
  { label: 'Reggae', prompt: 'One drop reggae groove, kick on 2 and 4, cross-stick, hi-hat on offbeats' },
]

const BAR_OPTIONS = [1, 2, 4, 8]

const DEFAULT_CONFIG: ExerciseConfig = {
  noteValues: { whole: false, half: false, quarter: true, eighth: true, sixteenth: false, triplet: false },
  includeRests: false,
  includeSyncopation: false,
  includeDynamics: false,
  instruments: {
    kick: true, snare: true, hihatClosed: true, hihatOpen: false,
    ride: false, crash: false, tom1: false, tom2: false, floorTom: false, hihatPedal: false,
  },
  timeSignature: [4, 4] as [number, number],
  bars: 2,
  bpm: 90,
  difficulty: 4,
}

function diffColor(d: number): string {
  if (d <= 3) return '#22c55e'
  if (d <= 6) return '#eab308'
  return '#ef4444'
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  onPatternGenerated: (pattern: PatternData, title: string, config: {
    bpm: number; bars: number; timeSig: [number, number]; difficulty: number; isAi: boolean
  }) => void
}

export default function AiBuilderTab({ onPatternGenerated }: Props) {
  const [config, setConfig] = useState<ExerciseConfig>(DEFAULT_CONFIG)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [generatedPattern, setGeneratedPattern] = useState<PatternData | null>(null)
  const [generatedTitle, setGeneratedTitle] = useState('')
  const [seed, setSeed] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const { isConfigured, apiKey } = useAiStore()

  function updateConfig<K extends keyof ExerciseConfig>(key: K, value: ExerciseConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  function toggleInstrument(key: keyof InstrumentSet) {
    setConfig(prev => ({
      ...prev,
      instruments: { ...prev.instruments, [key]: !prev.instruments[key] },
    }))
  }

  function toggleNoteValue(key: keyof NoteValueSet) {
    setConfig(prev => ({
      ...prev,
      noteValues: { ...prev.noteValues, [key]: !prev.noteValues[key] },
    }))
  }

  // Algorithmic generation
  const generateAlgorithmic = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 999999)
    setSeed(newSeed)
    const p = generateExercise(config, newSeed)
    setGeneratedPattern(p)
    setGeneratedTitle(`Generated #${newSeed % 1000}`)
    setError(null)
    onPatternGenerated(p, `Generated #${newSeed % 1000}`, {
      bpm: config.bpm, bars: config.bars,
      timeSig: config.timeSignature, difficulty: config.difficulty, isAi: false,
    })
  }, [config, onPatternGenerated])

  // AI generation
  async function generateWithAi() {
    if (!isConfigured || !apiKey) {
      generateAlgorithmic()
      return
    }
    setAiLoading(true)
    setError(null)
    try {
      aiService.setApiKey(apiKey)
      const cfgWithPrompt = { ...config, aiPrompt }
      const prompt = buildAiExercisePrompt(cfgWithPrompt)
      const text = await aiService.generateExercise(prompt)
      console.log('[AI Builder] Raw AI response length:', text.length)
      console.log('[AI Builder] Raw AI response:', text.substring(0, 500))

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('AI returned no valid JSON')

      const parsed = JSON.parse(jsonMatch[0])
      const subdivisions = config.noteValues.sixteenth ? 4 : config.noteValues.eighth ? 2 : 1
      const beats = config.timeSignature[0]
      const totalSlots = beats * subdivisions * config.bars
      console.log('[AI Builder] Expected totalSlots:', totalSlots, '(beats:', beats, 'subs:', subdivisions, 'bars:', config.bars, ')')

      const tracks: PatternData['tracks'] = {}

      const padMap: Record<string, string> = {
        kick: 'kick', snare: 'snare', hihat_closed: 'hihat_closed',
        hihat_open: 'hihat_open', ride: 'ride', crash: 'crash',
        tom1: 'tom1', tom2: 'tom2', floor_tom: 'floor_tom',
        hihat_pedal: 'hihat_pedal',
      }

      for (const [key, values] of Object.entries(parsed.tracks ?? {})) {
        const padId = padMap[key]
        if (padId && Array.isArray(values)) {
          console.log(`[AI Builder] Track "${key}" received ${(values as number[]).length} slots, non-zero:`, (values as number[]).filter(v => v > 0).length)
          const arr = (values as number[]).slice(0, totalSlots).map(v =>
            Math.min(3, Math.max(0, v))
          ) as HitValue[]
          while (arr.length < totalSlots) arr.push(0)
          tracks[padId as DrumPad] = arr
        }
      }

      const aiPattern: PatternData = { beats, subdivisions, tracks }
      console.log('[AI Builder] Final pattern beats:', aiPattern.beats, 'subdivisions:', aiPattern.subdivisions, 'tracks:', Object.keys(aiPattern.tracks).length)
      const title = parsed.title || 'AI Pattern'
      setGeneratedPattern(aiPattern)
      setGeneratedTitle(title)
      onPatternGenerated(aiPattern, title, {
        bpm: config.bpm, bars: config.bars,
        timeSig: config.timeSignature, difficulty: config.difficulty, isAi: true,
      })
    } catch (e: any) {
      console.error('AI generation failed:', e)
      setError(e.message || 'AI generation failed — try again or use algorithmic generation')
      generateAlgorithmic()
    }
    setAiLoading(false)
  }

  function applyStylePreset(prompt: string) {
    setAiPrompt(prompt)
  }

  // Build full multi-bar pattern for display
  const displayPattern = generatedPattern && config.bars > 1
    ? { beats: generatedPattern.beats * config.bars, subdivisions: generatedPattern.subdivisions, tracks: generatedPattern.tracks }
    : generatedPattern

  return (
    <div className="space-y-5">
      {/* AI status banner */}
      {!isConfigured && (
        <div className="rounded-xl p-4 border border-amber-500/15 bg-amber-500/[0.04] flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm text-amber-400 font-medium">API key not configured</p>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Add your Anthropic API key in Settings to use AI generation. Algorithmic generation still works without it.
            </p>
          </div>
        </div>
      )}

      {/* ── Config panel ── */}
      <div className="rounded-2xl p-5 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
      }}>
        <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-4">Builder Settings</div>

        <div className="space-y-4">
          {/* Row 1: Note values + Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-2 block">Note Values</label>
              <div className="flex gap-1.5 flex-wrap">
                {NOTE_VALUE_INFO.map(nv => (
                  <button key={nv.key} onClick={() => toggleNoteValue(nv.key)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      config.noteValues[nv.key]
                        ? 'bg-violet-500/15 text-violet-400 border-violet-500/25'
                        : 'bg-white/[0.03] border-white/[0.06] text-[#4b5a6a] hover:text-white'
                    }`}>
                    <span className="mr-1">{nv.symbol}</span>{nv.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-2 block">
                Difficulty: <span className="font-bold" style={{ color: diffColor(config.difficulty) }}>{config.difficulty}/10</span>
              </label>
              <input type="range" min={1} max={10} value={config.difficulty}
                onChange={e => updateConfig('difficulty', parseInt(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer" />
            </div>
          </div>

          {/* Row 2: Instruments */}
          <div>
            <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-2 block">Instruments</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[9px] text-[#374151] uppercase tracking-wider mb-1.5">Cymbals</div>
                <div className="flex gap-1.5 flex-wrap">
                  {INSTRUMENT_INFO.filter(i => i.group === 'cymbal').map(inst => (
                    <button key={inst.key} onClick={() => toggleInstrument(inst.key)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        config.instruments[inst.key]
                          ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25'
                          : 'bg-white/[0.03] border-white/[0.06] text-[#374151] hover:text-[#6b7280]'
                      }`}>
                      {inst.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-[#374151] uppercase tracking-wider mb-1.5">Drums</div>
                <div className="flex gap-1.5 flex-wrap">
                  {INSTRUMENT_INFO.filter(i => i.group === 'drum').map(inst => (
                    <button key={inst.key} onClick={() => toggleInstrument(inst.key)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        config.instruments[inst.key]
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                          : 'bg-white/[0.03] border-white/[0.06] text-[#374151] hover:text-[#6b7280]'
                      }`}>
                      {inst.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Concepts + Tempo + Bars */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-2 block">Concepts</label>
              <div className="space-y-1.5">
                {([
                  { key: 'includeRests' as const, label: 'Include Rests' },
                  { key: 'includeSyncopation' as const, label: 'Syncopation' },
                  { key: 'includeDynamics' as const, label: 'Accents & Ghosts' },
                ] as const).map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer text-xs text-[#94a3b8]">
                    <input type="checkbox" checked={config[opt.key]}
                      onChange={() => updateConfig(opt.key, !config[opt.key])}
                      className="accent-violet-500 rounded cursor-pointer" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-2 block">Tempo</label>
              <div className="flex items-center gap-2">
                <input type="range" min={40} max={200} value={config.bpm}
                  onChange={e => updateConfig('bpm', parseInt(e.target.value))}
                  className="flex-1 accent-violet-500 cursor-pointer" />
                <span className="text-sm text-white font-mono w-10 text-right">{config.bpm}</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-2 block">Bars</label>
              <div className="flex gap-1.5">
                {BAR_OPTIONS.map(b => (
                  <button key={b} onClick={() => updateConfig('bars', b)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      config.bars === b
                        ? 'bg-violet-500/15 text-violet-400 border-violet-500/25'
                        : 'bg-white/[0.04] border-white/[0.06] text-[#4b5a6a] hover:text-white'
                    }`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Style presets ── */}
          <div>
            <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-2 block">Style Presets</label>
            <div className="flex gap-1.5 flex-wrap">
              {STYLE_PRESETS.map(sp => (
                <button
                  key={sp.label}
                  onClick={() => applyStylePreset(sp.prompt)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    aiPrompt === sp.prompt
                      ? 'bg-violet-500/15 text-violet-400 border-violet-500/25'
                      : 'bg-white/[0.03] border-white/[0.06] text-[#4b5a6a] hover:text-white'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── AI instruction ── */}
          <div>
            <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-2 block">
              AI Instruction {!isConfigured && <span className="text-[#374151]">(requires API key)</span>}
            </label>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Describe what you want... e.g. 'Funky groove with ghost notes on the snare and syncopated kick pattern'"
              rows={2}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-[#2d3748] focus:outline-none focus:border-violet-500/30 transition-colors resize-none"
            />
          </div>

          {/* ── Generate buttons ── */}
          <div className="flex gap-3">
            <button
              onClick={generateWithAi}
              disabled={aiLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 20px -4px rgba(124,58,237,0.4)' }}
            >
              {aiLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  AI Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  {isConfigured ? 'Generate with AI' : 'Generate (Algorithmic)'}
                </>
              )}
            </button>
            <button
              onClick={generateAlgorithmic}
              className="px-5 py-3 rounded-xl text-sm font-medium bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-3 border border-rose-500/15 bg-rose-500/[0.04] text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* ── Generated pattern preview ── */}
      {displayPattern && (
        <div className="rounded-2xl p-5 border border-white/[0.04]" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
        }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">Generated Pattern</span>
              {generatedTitle && (
                <span className="text-xs text-violet-400/70 font-medium">{generatedTitle}</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#4b5563]">
              <span>{config.bpm} BPM</span>
              <span>{config.timeSignature.join('/')}</span>
              <span>{config.bars} bar{config.bars > 1 ? 's' : ''}</span>
              <span style={{ color: diffColor(config.difficulty) }}>Lvl {config.difficulty}</span>
            </div>
          </div>
          <StaffNotationDisplay
            pattern={displayPattern}
            bpm={config.bpm}
            bars={1}
            onBpmChange={(newBpm) => updateConfig('bpm', newBpm)}
          />
        </div>
      )}
    </div>
  )
}
