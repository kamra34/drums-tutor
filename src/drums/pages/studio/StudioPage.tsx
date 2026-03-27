import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { PatternData, HitValue } from '@drums/types/curriculum'
import { DrumPad } from '@drums/types/midi'
import EditableGrid from '@drums/components/studio/EditableGrid'
import AiBuilderTab from '@drums/components/studio/AiBuilderTab'
import ScanTab from '@drums/components/studio/ScanTab'
import StaffNotationDisplay from '@drums/components/StaffNotationDisplay'
import { apiSaveExercise, apiUpdateExercise, apiGetExercise, apiListExercises, apiDeleteExercise, DbExercise } from '@shared/services/apiClient'

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_PADS: { pad: DrumPad; label: string; group: 'cymbal' | 'drum' }[] = [
  { pad: DrumPad.HiHatClosed, label: 'Hi-Hat', group: 'cymbal' },
  { pad: DrumPad.HiHatOpen, label: 'HH Open', group: 'cymbal' },
  { pad: DrumPad.RideCymbal, label: 'Ride', group: 'cymbal' },
  { pad: DrumPad.CrashCymbal, label: 'Crash', group: 'cymbal' },
  { pad: DrumPad.HiHatPedal, label: 'HH Pedal', group: 'cymbal' },
  { pad: DrumPad.Snare, label: 'Snare', group: 'drum' },
  { pad: DrumPad.Kick, label: 'Kick', group: 'drum' },
  { pad: DrumPad.Tom1, label: 'Tom 1', group: 'drum' },
  { pad: DrumPad.Tom2, label: 'Tom 2', group: 'drum' },
  { pad: DrumPad.FloorTom, label: 'Floor Tom', group: 'drum' },
]

const DEFAULT_PADS = [DrumPad.HiHatClosed, DrumPad.Snare, DrumPad.Kick]

const TIME_SIGNATURES: [number, number][] = [[4, 4], [3, 4], [6, 8], [5, 4], [7, 8]]
const SUBDIVISIONS = [
  { value: 2, label: '8th notes' },
  { value: 4, label: '16th notes' },
]
const BAR_OPTIONS = [1, 2, 4, 8]

function makeEmptyPattern(beats: number, subdivisions: number, bars: number): PatternData {
  return { beats, subdivisions, tracks: {} }
}

// ── Studio Page ──────────────────────────────────────────────────────────────

type StudioMode = 'create' | 'ai-builder' | 'scan'

export default function StudioPage() {
  const { id: editId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [mode, setMode] = useState<StudioMode>('create')

  // Pattern settings
  const [title, setTitle] = useState('')
  const [timeSig, setTimeSig] = useState<[number, number]>([4, 4])
  const [subdivisions, setSubdivisions] = useState(4)
  const [bars, setBars] = useState(1)
  const [bpm, setBpm] = useState(90)
  const [enabledPads, setEnabledPads] = useState<DrumPad[]>(DEFAULT_PADS)

  // Pattern data
  const [pattern, setPattern] = useState<PatternData>(() => makeEmptyPattern(4, 4, 1))

  // Save state
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)

  // My patterns sidebar
  const [myPatterns, setMyPatterns] = useState<DbExercise[]>([])
  const [showPatterns, setShowPatterns] = useState(true)

  // Load saved patterns list
  const loadPatterns = useCallback(async () => {
    try {
      const { exercises } = await apiListExercises({ category: 'studio' })
      setMyPatterns(exercises)
    } catch { /* server may be down */ }
  }, [])

  useEffect(() => { loadPatterns() }, [loadPatterns])

  // Load existing pattern for editing
  useEffect(() => {
    if (!editId) return
    setLoadingEdit(true)
    apiGetExercise(editId).then(({ exercise }) => {
      const pd = exercise.patternData as PatternData
      setTitle(exercise.title)
      setTimeSig((exercise.timeSignature ?? [4, 4]) as [number, number])
      setSubdivisions(pd.subdivisions)
      setBars(exercise.bars ?? 1)
      setBpm(exercise.bpm ?? 90)
      setPattern(pd)
      setSavedId(exercise.id)

      // Derive enabled pads from pattern tracks
      const padsInUse = Object.keys(pd.tracks) as DrumPad[]
      const allPads = [...new Set([...DEFAULT_PADS, ...padsInUse])]
      setEnabledPads(allPads)
    }).catch(() => {
      navigate('/studio', { replace: true })
    }).finally(() => setLoadingEdit(false))
  }, [editId])

  // Update pattern dimensions when settings change (preserve existing data where possible)
  function handleSettingsChange(newBeats: number, newSubs: number, newBars: number) {
    const newTotalSlots = newBeats * newSubs * newBars
    const newTracks: Partial<Record<DrumPad, HitValue[]>> = {}

    for (const [pad, oldTrack] of Object.entries(pattern.tracks) as [DrumPad, HitValue[]][]) {
      const newTrack: HitValue[] = new Array(newTotalSlots).fill(0)
      // Copy what fits
      for (let i = 0; i < Math.min(oldTrack.length, newTotalSlots); i++) {
        newTrack[i] = oldTrack[i]
      }
      if (newTrack.some(v => v > 0)) newTracks[pad] = newTrack
    }

    setPattern({ beats: newBeats, subdivisions: newSubs, tracks: newTracks })
  }

  function handleTimeSigChange(ts: [number, number]) {
    setTimeSig(ts)
    handleSettingsChange(ts[0], subdivisions, bars)
  }

  function handleSubdivisionsChange(s: number) {
    setSubdivisions(s)
    handleSettingsChange(timeSig[0], s, bars)
  }

  function handleBarsChange(b: number) {
    setBars(b)
    handleSettingsChange(timeSig[0], subdivisions, b)
  }

  function togglePad(pad: DrumPad) {
    setEnabledPads(prev =>
      prev.includes(pad)
        ? prev.filter(p => p !== pad)
        : [...prev, pad]
    )
  }

  function handleClear() {
    setPattern(makeEmptyPattern(timeSig[0], subdivisions, bars))
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    setSaveSuccess(false)
    try {
      const data = {
        title: title.trim(),
        description: `Custom pattern created in Studio`,
        patternData: pattern,
        category: 'studio',
        difficulty: 5,
        bpm,
        timeSignature: timeSig,
        bars,
        tags: ['studio', 'custom'],
        isAiGenerated: false,
      }

      if (savedId) {
        await apiUpdateExercise(savedId, data)
      } else {
        const { exercise } = await apiSaveExercise(data)
        setSavedId(exercise.id)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      loadPatterns()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDeleteExercise(id)
      if (savedId === id) {
        setSavedId(null)
        setTitle('')
        handleClear()
      }
      loadPatterns()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  function handleNewPattern() {
    setSavedId(null)
    setTitle('')
    setTimeSig([4, 4])
    setSubdivisions(4)
    setBars(1)
    setBpm(90)
    setEnabledPads(DEFAULT_PADS)
    setPattern(makeEmptyPattern(4, 4, 1))
    if (editId) navigate('/studio', { replace: true })
  }

  // Selected bar for individual bar view (null = none selected)
  const [selectedBar, setSelectedBar] = useState<number | null>(null)

  // Build per-bar pattern for individual bar preview
  function getBarPattern(barIndex: number): PatternData {
    const slotsPerBar = timeSig[0] * subdivisions
    const barTracks: Partial<Record<DrumPad, HitValue[]>> = {}

    for (const [pad, track] of Object.entries(pattern.tracks) as [DrumPad, HitValue[]][]) {
      const start = barIndex * slotsPerBar
      const slice = track.slice(start, start + slotsPerBar)
      if (slice.some(v => v > 0)) barTracks[pad] = slice
    }

    return { beats: timeSig[0], subdivisions, tracks: barTracks }
  }

  // Build full multi-bar pattern: StaffNotationDisplay expects a single-bar PatternData,
  // so for the full view we concatenate all bars into one long pattern
  const fullPattern = useMemo<PatternData>(() => {
    const totalBeats = timeSig[0] * bars
    const totalSlots = totalBeats * subdivisions
    const fullTracks: Partial<Record<DrumPad, HitValue[]>> = {}

    for (const [pad, track] of Object.entries(pattern.tracks) as [DrumPad, HitValue[]][]) {
      const padTrack: HitValue[] = new Array(totalSlots).fill(0)
      for (let i = 0; i < Math.min(track.length, totalSlots); i++) {
        padTrack[i] = track[i]
      }
      if (padTrack.some(v => v > 0)) fullTracks[pad] = padTrack
    }

    return { beats: totalBeats, subdivisions, tracks: fullTracks }
  }, [pattern, timeSig, bars, subdivisions])

  const hasNotes = Object.values(pattern.tracks).some(t => t.some(v => v > 0))

  // Reset selected bar when bars count changes
  useEffect(() => { setSelectedBar(null) }, [bars])

  // When AI builder generates a pattern, load it into the Create tab
  function handleAiPatternGenerated(
    aiPattern: PatternData,
    aiTitle: string,
    cfg: { bpm: number; bars: number; timeSig: [number, number]; difficulty: number; isAi: boolean }
  ) {
    setPattern(aiPattern)
    setTitle(aiTitle)
    setBpm(cfg.bpm)
    setBars(cfg.bars)
    setTimeSig(cfg.timeSig)
    setSubdivisions(aiPattern.subdivisions)
    setSavedId(null)

    // Derive enabled pads from the generated pattern
    const padsInUse = Object.keys(aiPattern.tracks) as DrumPad[]
    const allPads = [...new Set([...DEFAULT_PADS, ...padsInUse])]
    setEnabledPads(allPads)
  }

  if (loadingEdit) {
    return (
      <div className="p-8 text-center text-[#6b7280]">Loading pattern...</div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto" style={{ background: '#06080d', minHeight: '100vh' }}>
      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-3xl p-8 lg:p-10 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(15,12,8,0.9) 0%, rgba(10,14,22,0.9) 50%, rgba(15,12,8,0.8) 100%)',
      }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
        }} />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)',
        }} />
        <div className="relative z-10">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-2 tracking-tight">
            Studio<span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">.</span>
          </h1>
          <p className="text-[#6b7280] text-base lg:text-lg max-w-xl">
            Create drum patterns from scratch. Click the grid to place hits, preview the notation, and save for practice.
          </p>
          {/* Mode tabs */}
          <div className="flex gap-2 mt-4">
            {([
              { id: 'create' as StudioMode, label: 'Create', icon: '🎹', ready: true },
              { id: 'ai-builder' as StudioMode, label: 'AI Builder', icon: '✨', ready: true },
              { id: 'scan' as StudioMode, label: 'Scan', icon: '📷', ready: true },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => tab.ready && setMode(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mode === tab.id
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25 font-semibold'
                    : tab.ready
                      ? 'text-[#6b7280] bg-white/[0.03] border border-white/[0.04] hover:text-white hover:bg-white/[0.05] cursor-pointer'
                      : 'text-[#4b5563] bg-white/[0.03] border border-white/[0.04] cursor-not-allowed opacity-50'
                }`}
                disabled={!tab.ready}
                title={!tab.ready ? 'Coming soon' : undefined}
              >
                <span className="mr-1">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* ── Left: My Patterns sidebar ── */}
        <div className="col-span-3">
          <div className="rounded-2xl border border-white/[0.04] overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
          }}>
            <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">My Patterns</span>
              <button
                onClick={handleNewPattern}
                className="text-[10px] px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/15 transition-colors cursor-pointer"
              >
                + New
              </button>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {myPatterns.length === 0 ? (
                <div className="px-4 py-8 text-center text-[11px] text-[#4b5563]">
                  No saved patterns yet.<br />Create one and save it!
                </div>
              ) : (
                myPatterns.map(ex => (
                  <div
                    key={ex.id}
                    className={`px-4 py-3 border-b border-white/[0.02] cursor-pointer transition-colors group ${
                      savedId === ex.id ? 'bg-violet-500/[0.06]' : 'hover:bg-white/[0.02]'
                    }`}
                    onClick={() => navigate(`/studio/${ex.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium truncate ${savedId === ex.id ? 'text-violet-400' : 'text-[#c4c9d4]'}`}>
                        {ex.title}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(ex.id) }}
                        className="text-[#374151] hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 p-1 cursor-pointer"
                        title="Delete pattern"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex gap-2 mt-1 text-[10px] text-[#4b5563]">
                      <span>{(ex.timeSignature ?? [4, 4]).join('/')}</span>
                      <span>{ex.bars ?? 1} bar{(ex.bars ?? 1) > 1 ? 's' : ''}</span>
                      <span>{ex.bpm} bpm</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Editor area ── */}
        <div className="col-span-9 space-y-5">

          {/* ═══ AI Builder mode ═══ */}
          {mode === 'ai-builder' && (
            <AiBuilderTab onPatternGenerated={handleAiPatternGenerated} />
          )}

          {/* ═══ Scan mode ═══ */}
          {mode === 'scan' && (
            <ScanTab onPatternGenerated={handleAiPatternGenerated} />
          )}

          {/* ═══ Create mode ═══ */}
          {mode === 'create' && (<>
          {/* ── Settings bar ── */}
          <div className="rounded-2xl p-5 border border-white/[0.04]" style={{
            background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
          }}>
            <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-4">Pattern Settings</div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pattern name */}
              <div className="col-span-2">
                <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-1 block">Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="My pattern name..."
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-sm placeholder:text-[#374151] focus:outline-none focus:border-violet-500/30 transition-colors"
                />
              </div>

              {/* Time signature */}
              <div>
                <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-1 block">Time Sig</label>
                <div className="flex gap-1">
                  {TIME_SIGNATURES.map(ts => (
                    <button
                      key={ts.join('/')}
                      onClick={() => handleTimeSigChange(ts)}
                      className={`px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        timeSig[0] === ts[0] && timeSig[1] === ts[1]
                          ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                          : 'bg-white/[0.04] border border-white/[0.06] text-[#4b5a6a] hover:text-white'
                      }`}
                    >
                      {ts[0]}/{ts[1]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subdivisions */}
              <div>
                <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-1 block">Resolution</label>
                <div className="flex gap-1">
                  {SUBDIVISIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleSubdivisionsChange(s.value)}
                      className={`px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        subdivisions === s.value
                          ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                          : 'bg-white/[0.04] border border-white/[0.06] text-[#4b5a6a] hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bars */}
              <div>
                <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-1 block">Bars</label>
                <div className="flex gap-1">
                  {BAR_OPTIONS.map(b => (
                    <button
                      key={b}
                      onClick={() => handleBarsChange(b)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        bars === b
                          ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                          : 'bg-white/[0.04] border border-white/[0.06] text-[#4b5a6a] hover:text-white'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* BPM */}
              <div>
                <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-1 block">Tempo</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setBpm(Math.max(40, bpm - 5))} className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer transition-colors text-sm">-</button>
                  <span className="font-mono text-white text-sm w-8 text-center">{bpm}</span>
                  <button onClick={() => setBpm(Math.min(200, bpm + 5))} className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer transition-colors text-sm">+</button>
                  <span className="text-[10px] text-[#4b5a6a]">BPM</span>
                </div>
              </div>

              {/* Instruments */}
              <div className="col-span-2 lg:col-span-4">
                <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-2 block">Instruments</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_PADS.map(({ pad, label, group }) => (
                    <button
                      key={pad}
                      onClick={() => togglePad(pad)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                        enabledPads.includes(pad)
                          ? group === 'cymbal'
                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'bg-white/[0.03] border border-white/[0.04] text-[#374151] hover:text-[#6b7280]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Grid editor ── */}
          <div className="rounded-2xl p-5 border border-white/[0.04]" style={{
            background: 'linear-gradient(135deg, rgba(6,8,13,0.95) 0%, rgba(8,10,16,0.98) 100%)',
          }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">Grid Editor</span>
              <button
                onClick={handleClear}
                className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#4b5a6a] hover:text-rose-400 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
            <EditableGrid
              pattern={pattern}
              enabledPads={enabledPads}
              bars={bars}
              onChange={setPattern}
            />
          </div>

          {/* ── Full pattern preview ── */}
          {hasNotes && (
            <div className="rounded-2xl p-5 border border-white/[0.04]" style={{
              background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
            }}>
              <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-3">
                Full Pattern {bars > 1 && <span className="text-[#374151] font-normal">({bars} bars)</span>}
              </div>
              <StaffNotationDisplay
                pattern={fullPattern}
                bpm={bpm}
                bars={1}
                beatsPerBar={timeSig[0]}
                onBpmChange={setBpm}
              />
            </div>
          )}

          {/* ── Individual bar selector (only when multi-bar) ── */}
          {hasNotes && bars > 1 && (
            <div className="rounded-2xl p-5 border border-white/[0.04]" style={{
              background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
            }}>
              <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-3">Individual Bars</div>

              {/* Bar tiles */}
              <div className="flex gap-2 mb-4">
                {Array.from({ length: bars }).map((_, barIdx) => {
                  const barPattern = getBarPattern(barIdx)
                  const barHasNotes = Object.values(barPattern.tracks).some(t => t.some(v => v > 0))
                  const isSelected = selectedBar === barIdx

                  return (
                    <button
                      key={barIdx}
                      onClick={() => setSelectedBar(isSelected ? null : barIdx)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30 shadow-lg shadow-violet-500/10'
                          : barHasNotes
                            ? 'bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.06]'
                            : 'bg-white/[0.02] border border-white/[0.03] text-[#374151] cursor-default'
                      }`}
                      disabled={!barHasNotes}
                    >
                      Bar {barIdx + 1}
                      {!barHasNotes && <span className="text-[9px] ml-1 text-[#2d3748]">(empty)</span>}
                    </button>
                  )
                })}
              </div>

              {/* Selected bar notation */}
              {selectedBar !== null && (() => {
                const barPattern = getBarPattern(selectedBar)
                const barHasNotes = Object.values(barPattern.tracks).some(t => t.some(v => v > 0))
                if (!barHasNotes) return null
                return (
                  <StaffNotationDisplay
                    pattern={barPattern}
                    bpm={bpm}
                    bars={1}
                    onBpmChange={setBpm}
                  />
                )
              })()}

              {selectedBar === null && (
                <div className="text-[11px] text-[#4b5563] text-center py-4">
                  Select a bar above to view and play it individually
                </div>
              )}
            </div>
          )}

          {/* ── Save bar ── */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !title.trim() || !hasNotes}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                saving || !title.trim() || !hasNotes
                  ? 'bg-white/[0.04] text-[#374151] border border-white/[0.04] cursor-not-allowed'
                  : 'text-white hover:brightness-110'
              }`}
              style={saving || !title.trim() || !hasNotes ? undefined : { background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Saved!
                </>
              ) : savedId ? 'Update Pattern' : 'Save Pattern'}
            </button>

            {savedId && (
              <Link
                to={`/practice/play/studio:${savedId}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Practice This
              </Link>
            )}

            {!title.trim() && hasNotes && (
              <span className="text-[11px] text-amber-400/60">Give your pattern a name to save it</span>
            )}
          </div>
          </>)}

          {/* ═══ AI Builder / Scan: save prompt when pattern generated ═══ */}
          {(mode === 'ai-builder' || mode === 'scan') && hasNotes && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setMode('create') }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/15 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                Edit & Save in Create
              </button>
              <span className="text-[11px] text-[#4b5563]">Switch to Create mode to edit the grid, name it, and save</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
