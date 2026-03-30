import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ExerciseConfig, InstrumentSet, NoteValueSet, PRESETS,
  generateExercise, buildAiExercisePrompt,
} from '@drums/services/notationExerciseGenerator'
import { PatternData } from '@drums/types/curriculum'
import { useAiStore } from '@shared/stores/useAiStore'
import { aiService } from '@drums/services/aiService'
import { apiSaveExercise, apiUpdateExercise, apiListExercises, apiDeleteExercise, DbExercise } from '@shared/services/apiClient'
import StaffNotationDisplay from '@drums/components/StaffNotationDisplay'
import MetronomeWidget from '@drums/components/MetronomeWidget'

function extractJsonFromAi(text: string): any | null {
  try { return JSON.parse(text.trim()) } catch {}
  const start = text.indexOf('{')
  if (start === -1) return null
  for (let end = text.lastIndexOf('}'); end > start; end = text.lastIndexOf('}', end - 1)) {
    try { return JSON.parse(text.substring(start, end + 1)) } catch { continue }
  }
  return null
}

// ── Persist last active exercise ID ──────────────────────────────────────────

const ACTIVE_KEY = 'drum-tutor-active-exercise'
function persistActiveId(id: string | null): void {
  try { if (id) localStorage.setItem(ACTIVE_KEY, id); else localStorage.removeItem(ACTIVE_KEY) } catch {}
}
function loadActiveId(): string | null {
  try { return localStorage.getItem(ACTIVE_KEY) } catch { return null }
}

// ── Default config ──────────────────────────────────────────────────────────

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
  bpm: 85,
  difficulty: 3,
}

// ── Instrument display info ─────────────────────────────────────────────────

const INSTRUMENT_INFO: { key: keyof InstrumentSet; label: string; group: 'cymbal' | 'drum' }[] = [
  { key: 'hihatClosed', label: 'Hi-Hat (closed)', group: 'cymbal' },
  { key: 'hihatOpen', label: 'Hi-Hat (open)', group: 'cymbal' },
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

// ── Main page ───────────────────────────────────────────────────────────────

export default function ReadingPracticePage() {
  const [config, setConfig] = useState<ExerciseConfig>(DEFAULT_CONFIG)
  const [pattern, setPattern] = useState<PatternData | null>(null)
  const [seed, setSeed] = useState(1)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [nameSuggesting, setNameSuggesting] = useState(false)
  const [savedExercises, setSavedExercises] = useState<DbExercise[]>([])

  // Load saved exercises from DB on mount + restore last active
  const [dbLoaded, setDbLoaded] = useState(false)
  useEffect(() => {
    async function loadFromDb() {
      try {
        const { exercises } = await apiListExercises({ category: 'reading' })
        const userExercises = exercises.filter(e => !e.isBuiltin)
        console.log('[ReadingPractice] Loaded', userExercises.length, 'saved exercises from DB')
        setSavedExercises(userExercises)
        // Restore last active
        const lastId = loadActiveId()
        if (lastId) {
          const ex = userExercises.find(e => e.id === lastId)
          if (ex) {
            console.log('[ReadingPractice] Restoring active exercise:', ex.title, ex.id)
            if (ex.config) setConfig(ex.config as ExerciseConfig)
            setPattern(ex.patternData as PatternData)
            setActiveSavedId(ex.id)
            // Restore preset selection if this was saved from a preset
            const savedPresetId = (ex.config as any)?.presetId
            setActivePreset(savedPresetId ?? null)
          }
        }
      } catch (err: any) {
        console.error('[ReadingPractice] Failed to load from DB:', err.message)
      }
      setDbLoaded(true)
    }
    loadFromDb()
  }, [])

  // Persist active ID whenever it changes
  useEffect(() => { persistActiveId(activeSavedId) }, [activeSavedId])

  // Build a map: presetId → DB exercise (for overrides)
  function getPresetOverride(presetId: string): DbExercise | undefined {
    return savedExercises.find(e => (e.config as any)?.presetId === presetId)
  }

  // Save click handler
  function handleSaveClick() {
    if (!pattern) return
    // If viewing a saved exercise, update it in place
    if (activeSavedId) {
      const existing = savedExercises.find(e => e.id === activeSavedId)
      doSave(existing?.title ?? 'Saved Exercise')
      return
    }
    // If from a preset, save/update the override for this preset
    if (activePreset) {
      const presetName = PRESETS.find(p => p.id === activePreset)?.name ?? 'Exercise'
      const existingOverride = getPresetOverride(activePreset)
      if (existingOverride) {
        // Update existing override
        setActiveSavedId(existingOverride.id)
        doSave(presetName)
      } else {
        doSave(presetName)
      }
      return
    }
    // Custom: show naming dialog + suggest AI name
    setShowSaveDialog(true)
    setSaveName('')
    suggestName()
  }

  async function suggestName() {
    if (!isConfigured || !apiKey) {
      setSaveName(`Custom Exercise #${seed}`)
      return
    }
    setNameSuggesting(true)
    try {
      aiService.setApiKey(apiKey)
      const name = await aiService.suggestExerciseName({
        noteValues: { ...config.noteValues },
        instruments: { ...config.instruments },
        difficulty: config.difficulty,
        bpm: config.bpm,
        timeSignature: config.timeSignature,
        aiPrompt: aiPrompt || undefined,
      })
      setSaveName(name)
    } catch {
      setSaveName(`Custom Exercise #${seed}`)
    }
    setNameSuggesting(false)
  }

  async function doSave(title: string) {
    if (!pattern) return
    setSaving(true)
    setSaveMsg(null)

    const exerciseData = {
      title,
      description: `Generated exercise — difficulty ${config.difficulty}/10`,
      patternData: pattern,
      config: { ...config, presetId: activePreset ?? undefined } as any,
      category: 'reading',
      difficulty: config.difficulty,
      bpm: config.bpm,
      timeSignature: config.timeSignature,
      bars: config.bars,
      tags: ['generated'],
      isAiGenerated: !!aiPrompt,
    }

    try {
      let saved: DbExercise
      if (activeSavedId) {
        // Update existing exercise in DB
        const res = await apiUpdateExercise(activeSavedId, exerciseData)
        saved = res.exercise
        setSavedExercises(prev => prev.map(e => e.id === saved.id ? saved : e))
      } else {
        // Create new exercise in DB
        const res = await apiSaveExercise(exerciseData)
        saved = res.exercise
        setSavedExercises(prev => [saved, ...prev])
      }
      setActiveSavedId(saved.id)
      setSaveMsg('Saved!')
      setShowSaveDialog(false)
      setTimeout(() => setSaveMsg(null), 2000)
    } catch (e: any) {
      setSaveMsg(e.message || 'Failed to save — is the server running?')
      setTimeout(() => setSaveMsg(null), 4000)
    }
    setSaving(false)
  }

  async function deleteSaved(id: string) {
    try {
      await apiDeleteExercise(id)
    } catch {} // best effort
    setSavedExercises(prev => prev.filter(e => e.id !== id))
    if (activeSavedId === id) {
      setActiveSavedId(null)
      setPattern(null)
    }
  }

  function loadSaved(ex: DbExercise) {
    if (ex.config) setConfig(ex.config as ExerciseConfig)
    setPattern(ex.patternData as PatternData)
    setActivePreset(null)
    setActiveSavedId(ex.id)
  }
  const [showBuilder, setShowBuilder] = useState(false)
  const { isConfigured, apiKey } = useAiStore()

  // Generate pattern from config
  const generate = useCallback((cfg: ExerciseConfig, s?: number) => {
    const useSeed = s ?? seed
    const p = generateExercise(cfg, useSeed)
    setPattern(p)
  }, [seed])

  // New random exercise with same config (shuffle)
  // Keep activeSavedId so next save updates the same DB record
  function regenerate() {
    const newSeed = Math.floor(Math.random() * 999999)
    setSeed(newSeed)
    generate(config, newSeed)
  }

  // Load a preset — use saved override from DB if available
  function loadPreset(presetId: string) {
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset) return
    setActivePreset(presetId)

    // Check if user has a saved version of this preset in DB
    const override = getPresetOverride(presetId)
    if (override) {
      if (override.config) setConfig(override.config as ExerciseConfig)
      else setConfig(preset.config)
      setPattern(override.patternData as PatternData)
      setActiveSavedId(override.id)
    } else {
      setConfig(preset.config)
      setActiveSavedId(null)
      generate(preset.config)
    }
  }

  // Update config field
  function updateConfig<K extends keyof ExerciseConfig>(key: K, value: ExerciseConfig[K]) {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    // Don't auto-generate on every toggle — wait for "Generate" click
  }

  function toggleInstrument(key: keyof InstrumentSet) {
    const inst = { ...config.instruments, [key]: !config.instruments[key] }
    updateConfig('instruments', inst)
  }

  function toggleNoteValue(key: keyof NoteValueSet) {
    const nv = { ...config.noteValues, [key]: !config.noteValues[key] }
    updateConfig('noteValues', nv)
  }

  // AI generation — uses centralized aiService with expert system prompt
  async function generateWithAi() {
    if (!isConfigured || !apiKey) return
    setAiLoading(true)
    try {
      aiService.setApiKey(apiKey)
      const cfgWithPrompt = { ...config, aiPrompt }
      const prompt = buildAiExercisePrompt(cfgWithPrompt)
      const text = await aiService.generateExercise(prompt)
      // Extract JSON from response
      const parsed = extractJsonFromAi(text)
      if (parsed) {
        // Build PatternData from AI response
        const subdivisions = config.noteValues.sixteenth ? 4 : config.noteValues.eighth ? 2 : 1
        const beats = config.timeSignature[0]
        const totalSlots = beats * subdivisions * config.bars
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
            const arr = (values as number[]).slice(0, totalSlots).map(v => Math.min(3, Math.max(0, v))) as import('../../types/curriculum').HitValue[]
            while (arr.length < totalSlots) arr.push(0)
            tracks[padId as import('../../types/midi').DrumPad] = arr
          }
        }
        const aiPattern = { beats, subdivisions, tracks }
        setPattern(aiPattern)
      }
    } catch (e) {
      console.error('AI generation failed:', e)
      // Fallback to algorithmic
      generate(config)
    }
    setAiLoading(false)
  }

  // Difficulty colors
  function diffColor(d: number): string {
    if (d <= 3) return '#22c55e'
    if (d <= 6) return '#eab308'
    return '#ef4444'
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-[1800px] mx-auto">
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-5">
        <Link to="/practice" className="text-amber-500/80 hover:text-amber-400 transition-colors">Practice</Link>
        <svg className="w-3.5 h-3.5 text-[#2d3748]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-[#94a3b8]">Notation Reading</span>
      </nav>

      <div className="mb-5">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Notation Reading Studio</h1>
        <p className="text-sm text-[#6b7280]">
          Choose a preset or build your own exercise. Click <strong className="text-white">Generate</strong> to create a new pattern, then <strong className="text-white">Listen</strong> to hear how it sounds.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* ── Left: Presets ── */}
        <div className="col-span-3 space-y-2">
          <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">Presets</div>
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                activePreset === preset.id
                  ? 'border-amber-500/20 bg-amber-500/10'
                  : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]'
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base">{preset.icon}</span>
                <span className={`text-sm font-medium ${activePreset === preset.id ? 'text-amber-400' : 'text-white'}`}>{preset.name}</span>
              </div>
              <div className="text-[10px] text-[#4b5563] leading-relaxed">{preset.description}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: diffColor(preset.config.difficulty) + '22', color: diffColor(preset.config.difficulty) }}>
                  Lvl {preset.config.difficulty}
                </span>
                <span className="text-[9px] text-[#374151]">{preset.config.bpm} BPM</span>
              </div>
            </button>
          ))}

          {/* Saved exercises */}
          {savedExercises.length > 0 && (
            <>
              <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mt-5 mb-2">Saved</div>
              {savedExercises.map(ex => (
                <div
                  key={ex.id}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    activeSavedId === ex.id
                      ? 'border-emerald-500/20 bg-emerald-500/10'
                      : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]'
                  }`}
                >
                  <button onClick={() => loadSaved(ex)} className="w-full text-left cursor-pointer">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-medium truncate ${activeSavedId === ex.id ? 'text-emerald-400' : 'text-white'}`}>{ex.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: diffColor(ex.difficulty) + '22', color: diffColor(ex.difficulty) }}>
                        Lvl {ex.difficulty}
                      </span>
                      <span className="text-[9px] text-[#374151]">{ex.bpm} BPM</span>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteSaved(ex.id)}
                    className="mt-1.5 text-[9px] text-rose-400/50 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── Right: Builder + Display ── */}
        <div className="col-span-9 space-y-4">

          {/* Builder toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowBuilder(v => !v)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                showBuilder ? 'border-amber-500/20 text-amber-400 bg-amber-500/10' : 'border-white/[0.06] text-[#6b7280] hover:text-amber-400'
              }`}
            >
              {showBuilder ? '▼ Custom Builder' : '▶ Custom Builder'}
            </button>
            <div className="flex gap-2">
              <button onClick={regenerate}
                className="text-xs px-4 py-1.5 rounded-lg text-white font-medium transition-colors"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 20px -4px rgba(245,158,11,0.35)' }}>
                Generate New
              </button>
              {isConfigured && (
                <button onClick={generateWithAi} disabled={aiLoading}
                  className="text-xs px-4 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.07] font-medium transition-colors disabled:opacity-50">
                  {aiLoading ? 'Generating...' : 'AI Generate'}
                </button>
              )}
            </div>
          </div>

          {/* Custom builder panel */}
          {showBuilder && (
            <div className="rounded-2xl p-5 border border-white/[0.04] space-y-4" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
              {/* Row 1: Note values + Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">Note Values</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {NOTE_VALUE_INFO.map(nv => (
                      <button key={nv.key} onClick={() => toggleNoteValue(nv.key)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                          config.noteValues[nv.key]
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-white/[0.03] border-white/[0.06] text-[#6b7280] hover:text-white'
                        }`}>
                        <span className="mr-1">{nv.symbol}</span>{nv.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">
                    Difficulty: <span className="font-bold" style={{ color: diffColor(config.difficulty) }}>{config.difficulty}/10</span>
                  </div>
                  <input type="range" min={1} max={10} value={config.difficulty}
                    onChange={e => updateConfig('difficulty', parseInt(e.target.value))}
                    className="w-full accent-amber-500" />
                </div>
              </div>

              {/* Row 2: Instruments */}
              <div>
                <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">Instruments</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-[#374151] mb-1.5">Cymbals</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {INSTRUMENT_INFO.filter(i => i.group === 'cymbal').map(inst => (
                        <button key={inst.key} onClick={() => toggleInstrument(inst.key)}
                          className={`text-[11px] px-2 py-1 rounded-lg border transition-colors ${
                            config.instruments[inst.key]
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-white/[0.03] border-white/[0.06] text-[#6b7280] hover:text-white'
                          }`}>
                          {inst.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#374151] mb-1.5">Drums</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {INSTRUMENT_INFO.filter(i => i.group === 'drum').map(inst => (
                        <button key={inst.key} onClick={() => toggleInstrument(inst.key)}
                          className={`text-[11px] px-2 py-1 rounded-lg border transition-colors ${
                            config.instruments[inst.key]
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-white/[0.03] border-white/[0.06] text-[#6b7280] hover:text-white'
                          }`}>
                          {inst.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Concepts + BPM + Bars */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">Concepts</div>
                  <div className="space-y-1.5">
                    {[
                      { key: 'includeRests' as const, label: 'Include Rests' },
                      { key: 'includeSyncopation' as const, label: 'Syncopation' },
                      { key: 'includeDynamics' as const, label: 'Accents & Ghosts' },
                    ].map(opt => (
                      <label key={opt.key} className="flex items-center gap-2 cursor-pointer text-xs text-[#94a3b8]">
                        <input type="checkbox" checked={config[opt.key]}
                          onChange={() => updateConfig(opt.key, !config[opt.key])}
                          className="accent-amber-500 rounded" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">Tempo</div>
                  <div className="flex items-center gap-2">
                    <input type="range" min={40} max={180} value={config.bpm}
                      onChange={e => updateConfig('bpm', parseInt(e.target.value))}
                      className="flex-1 accent-amber-500" />
                    <span className="text-sm text-white font-mono w-10 text-right">{config.bpm}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">Bars</div>
                  <div className="flex gap-1.5">
                    {[1, 2, 4, 8].map(b => (
                      <button key={b} onClick={() => updateConfig('bars', b)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          config.bars === b
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-white/[0.03] border-white/[0.06] text-[#6b7280] hover:text-white'
                        }`}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI prompt */}
              {isConfigured && (
                <div>
                  <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">AI Instruction (optional)</div>
                  <input
                    type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g. 'Make it sound like a James Brown groove' or 'Focus on kick syncopation'"
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-[#2d3748] focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.05]"
                  />
                </div>
              )}

              {/* Generate button in builder */}
              <button onClick={regenerate}
                className="w-full py-2.5 rounded-xl text-white font-medium text-sm transition-colors"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 20px -4px rgba(245,158,11,0.35)' }}>
                Generate Exercise
              </button>
            </div>
          )}

          {/* ── Notation display ── */}
          {pattern ? (
            <div className="rounded-2xl p-5 border border-white/[0.04]" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">Generated Exercise</div>
                  <button onClick={handleSaveClick} disabled={saving}
                    className="text-[10px] px-2.5 py-1 rounded-lg border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50 cursor-pointer">
                    {saving ? 'Saving...' : 'Save to Library'}
                  </button>
                  {saveMsg && <span className="text-[10px] text-emerald-400">{saveMsg}</span>}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#4b5563]">
                  <span>{config.bpm} BPM</span>
                  <span>{config.timeSignature.join('/')}</span>
                  <span>{config.bars} bar{config.bars > 1 ? 's' : ''}</span>
                  <span style={{ color: diffColor(config.difficulty) }}>Lvl {config.difficulty}</span>
                </div>
              </div>

              {/* Save dialog for custom exercises */}
              {showSaveDialog && (
                <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest mb-2">Name your exercise</div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={saveName}
                        onChange={e => setSaveName(e.target.value)}
                        placeholder={nameSuggesting ? 'AI is thinking...' : 'Exercise name'}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#374151] focus:outline-none focus:border-emerald-500/40"
                        onKeyDown={e => { if (e.key === 'Enter' && saveName.trim()) doSave(saveName.trim()) }}
                        autoFocus
                      />
                      {nameSuggesting && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => saveName.trim() && doSave(saveName.trim())}
                      disabled={saving || !saveName.trim()}
                      className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-40 cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="px-3 py-2 rounded-lg text-xs text-[#6b7280] hover:text-white bg-white/[0.04] border border-white/[0.06] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  {isConfigured && !nameSuggesting && (
                    <button onClick={suggestName} className="mt-2 text-[10px] text-emerald-400/60 hover:text-emerald-400 transition-colors cursor-pointer">
                      Suggest another name with AI
                    </button>
                  )}
                </div>
              )}
              <StaffNotationDisplay
                pattern={pattern}
                bpm={config.bpm}
                bars={config.bars}
                beatsPerBar={config.timeSignature[0]}
                onBpmChange={(newBpm) => updateConfig('bpm', newBpm)}
                metronomeSlot={<MetronomeWidget />}
              />
            </div>
          ) : (
            <div className="rounded-2xl p-12 border border-white/[0.04] text-center" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
              <div className="text-[#6b7280] text-sm mb-4">
                Choose a preset from the left, or open the custom builder to configure your own exercise.
              </div>
              <button onClick={regenerate}
                className="px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-colors"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 20px -4px rgba(245,158,11,0.35)' }}>
                Generate Exercise
              </button>
            </div>
          )}

          {/* Quick regenerate bar */}
          {pattern && (
            <div className="flex items-center justify-between rounded-2xl border border-white/[0.04] px-4 py-3" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
              <div className="text-xs text-[#4b5563]">
                Not quite right? Generate another with the same settings.
              </div>
              <div className="flex gap-2">
                <button onClick={regenerate}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.07] transition-colors">
                  Shuffle
                </button>
                {isConfigured && (
                  <button onClick={generateWithAi} disabled={aiLoading}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.07] transition-colors disabled:opacity-50">
                    {aiLoading ? '...' : 'AI Remix'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
