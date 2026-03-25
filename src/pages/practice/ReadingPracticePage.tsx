import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ExerciseConfig, InstrumentSet, NoteValueSet, PRESETS,
  generateExercise, buildAiExercisePrompt,
} from '../../services/notationExerciseGenerator'
import { PatternData } from '../../types/curriculum'
import { useAiStore } from '../../stores/useAiStore'
import StaffNotationDisplay from '../../components/shared/StaffNotationDisplay'

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
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showBuilder, setShowBuilder] = useState(false)
  const { isConfigured, apiKey } = useAiStore()

  // Generate pattern from config
  const generate = useCallback((cfg: ExerciseConfig, s?: number) => {
    const useSeed = s ?? seed
    const p = generateExercise(cfg, useSeed)
    setPattern(p)
  }, [seed])

  // New random exercise with same config
  function regenerate() {
    const newSeed = Math.floor(Math.random() * 999999)
    setSeed(newSeed)
    generate(config, newSeed)
  }

  // Load a preset
  function loadPreset(presetId: string) {
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset) return
    setConfig(preset.config)
    setActivePreset(presetId)
    generate(preset.config)
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

  // AI generation
  async function generateWithAi() {
    if (!isConfigured || !apiKey) return
    setAiLoading(true)
    try {
      const cfgWithPrompt = { ...config, aiPrompt }
      const prompt = buildAiExercisePrompt(cfgWithPrompt)
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      const text = data?.content?.[0]?.text ?? ''
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        // Build PatternData from AI response
        const subdivisions = config.noteValues.sixteenth ? 4 : config.noteValues.eighth ? 2 : 1
        const beats = config.timeSignature[0]
        const totalSlots = beats * subdivisions
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
    <div className="p-6 max-w-5xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-5">
        <Link to="/practice" className="hover:text-violet-400">Practice</Link>
        <span>›</span>
        <span className="text-[#94a3b8]">Notation Reading</span>
      </nav>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white mb-1">Notation Reading Studio</h1>
        <p className="text-sm text-[#6b7280]">
          Choose a preset or build your own exercise. Click <strong className="text-white">Generate</strong> to create a new pattern, then <strong className="text-white">Listen</strong> to hear how it sounds.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* ── Left: Presets ── */}
        <div className="col-span-3 space-y-2">
          <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-2">Presets</div>
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                activePreset === preset.id
                  ? 'border-violet-700 bg-[#13101e]'
                  : 'border-[#1e2433] bg-[#0d1117] hover:border-[#2d3748]'
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base">{preset.icon}</span>
                <span className="text-sm text-white font-medium">{preset.name}</span>
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
        </div>

        {/* ── Right: Builder + Display ── */}
        <div className="col-span-9 space-y-4">

          {/* Builder toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowBuilder(v => !v)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                showBuilder ? 'border-violet-700 text-violet-300 bg-violet-900/20' : 'border-[#2d3748] text-[#6b7280] hover:text-violet-400'
              }`}
            >
              {showBuilder ? '▼ Custom Builder' : '▶ Custom Builder'}
            </button>
            <div className="flex gap-2">
              <button onClick={regenerate}
                className="text-xs px-4 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium">
                Generate New
              </button>
              {isConfigured && (
                <button onClick={generateWithAi} disabled={aiLoading}
                  className="text-xs px-4 py-1.5 rounded-lg bg-cyan-700 text-white hover:bg-cyan-600 transition-colors font-medium disabled:opacity-50">
                  {aiLoading ? 'Generating...' : 'AI Generate'}
                </button>
              )}
            </div>
          </div>

          {/* Custom builder panel */}
          {showBuilder && (
            <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 space-y-4">
              {/* Row 1: Note values + Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-2">Note Values</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {NOTE_VALUE_INFO.map(nv => (
                      <button key={nv.key} onClick={() => toggleNoteValue(nv.key)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                          config.noteValues[nv.key]
                            ? 'border-violet-600 bg-violet-900/30 text-violet-300'
                            : 'border-[#1e2433] text-[#4b5563] hover:border-[#2d3748]'
                        }`}>
                        <span className="mr-1">{nv.symbol}</span>{nv.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-2">
                    Difficulty: <span className="font-bold" style={{ color: diffColor(config.difficulty) }}>{config.difficulty}/10</span>
                  </div>
                  <input type="range" min={1} max={10} value={config.difficulty}
                    onChange={e => updateConfig('difficulty', parseInt(e.target.value))}
                    className="w-full accent-violet-600" />
                </div>
              </div>

              {/* Row 2: Instruments */}
              <div>
                <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-2">Instruments</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-[#374151] mb-1.5">Cymbals</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {INSTRUMENT_INFO.filter(i => i.group === 'cymbal').map(inst => (
                        <button key={inst.key} onClick={() => toggleInstrument(inst.key)}
                          className={`text-[11px] px-2 py-1 rounded-lg border transition-colors ${
                            config.instruments[inst.key]
                              ? 'border-green-700 bg-green-900/20 text-green-300'
                              : 'border-[#1e2433] text-[#4b5563] hover:border-[#2d3748]'
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
                              ? 'border-blue-700 bg-blue-900/20 text-blue-300'
                              : 'border-[#1e2433] text-[#4b5563] hover:border-[#2d3748]'
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
                  <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-2">Concepts</div>
                  <div className="space-y-1.5">
                    {[
                      { key: 'includeRests' as const, label: 'Include Rests' },
                      { key: 'includeSyncopation' as const, label: 'Syncopation' },
                      { key: 'includeDynamics' as const, label: 'Accents & Ghosts' },
                    ].map(opt => (
                      <label key={opt.key} className="flex items-center gap-2 cursor-pointer text-xs text-[#94a3b8]">
                        <input type="checkbox" checked={config[opt.key]}
                          onChange={() => updateConfig(opt.key, !config[opt.key])}
                          className="accent-violet-600 rounded" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-2">Tempo</div>
                  <div className="flex items-center gap-2">
                    <input type="range" min={40} max={180} value={config.bpm}
                      onChange={e => updateConfig('bpm', parseInt(e.target.value))}
                      className="flex-1 accent-violet-600" />
                    <span className="text-sm text-white font-mono w-10 text-right">{config.bpm}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-2">Bars</div>
                  <div className="flex gap-1.5">
                    {[1, 2, 4, 8].map(b => (
                      <button key={b} onClick={() => updateConfig('bars', b)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          config.bars === b
                            ? 'border-violet-600 bg-violet-900/30 text-violet-300'
                            : 'border-[#1e2433] text-[#4b5563] hover:border-[#2d3748]'
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
                  <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-2">AI Instruction (optional)</div>
                  <input
                    type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g. 'Make it sound like a James Brown groove' or 'Focus on kick syncopation'"
                    className="w-full bg-[#0a0c13] border border-[#1e2433] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#374151] focus:outline-none focus:border-violet-700"
                  />
                </div>
              )}

              {/* Generate button in builder */}
              <button onClick={regenerate}
                className="w-full py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium text-sm">
                Generate Exercise
              </button>
            </div>
          )}

          {/* ── Notation display ── */}
          {pattern ? (
            <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-[#4b5563] uppercase tracking-wider">Generated Exercise</div>
                <div className="flex items-center gap-3 text-[10px] text-[#4b5563]">
                  <span>{config.bpm} BPM</span>
                  <span>{config.timeSignature.join('/')}</span>
                  <span>{config.bars} bar{config.bars > 1 ? 's' : ''}</span>
                  <span style={{ color: diffColor(config.difficulty) }}>Lvl {config.difficulty}</span>
                </div>
              </div>
              <StaffNotationDisplay pattern={pattern} bpm={config.bpm} bars={config.bars} />
            </div>
          ) : (
            <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-12 text-center">
              <div className="text-4xl mb-3">🎼</div>
              <div className="text-[#6b7280] text-sm mb-4">
                Choose a preset from the left, or open the custom builder to configure your own exercise.
              </div>
              <button onClick={regenerate}
                className="px-6 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors font-medium text-sm">
                Generate Exercise
              </button>
            </div>
          )}

          {/* Quick regenerate bar */}
          {pattern && (
            <div className="flex items-center justify-between bg-[#0a0c13] border border-[#1e2433] rounded-xl px-4 py-3">
              <div className="text-xs text-[#4b5563]">
                Not quite right? Generate another with the same settings.
              </div>
              <div className="flex gap-2">
                <button onClick={regenerate}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#2d3748] text-[#94a3b8] hover:text-white hover:border-violet-700 transition-colors">
                  Shuffle
                </button>
                {isConfigured && (
                  <button onClick={generateWithAi} disabled={aiLoading}
                    className="text-xs px-3 py-1.5 rounded-lg border border-cyan-800 text-cyan-400 hover:text-white hover:border-cyan-600 transition-colors disabled:opacity-50">
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
