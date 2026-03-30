import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAiStore } from '@shared/stores/useAiStore'
import { useAuthStore } from '@shared/stores/useAuthStore'
import { apiListExercises, apiSaveExercise, apiUpdateExercise, apiDeleteExercise, apiGetExercise, type DbExercise } from '@shared/services/apiClient'
import PracticePlayer from '@piano/components/PracticePlayer'
import { generatePiece, type GenerationParams, type GeneratedPiece } from '@piano/services/studioAiService'
import { playPianoNote } from '@piano/services/pianoSounds'
import type { NoteEvent } from '@piano/types/curriculum'

const accent = '#a78bfa'
const KEYS = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Am', 'Dm', 'Em', 'Gm']
const TIME_SIGS: [number, number][] = [[4, 4], [3, 4], [6, 8]]
const EXERCISE_TYPES = ['scale', 'chord-progression', 'melody', 'technique', 'sight-reading'] as const
const GENRES = ['Classical', 'Jazz', 'Blues', 'Pop', 'Latin', 'Film / Cinematic'] as const
const LENGTHS = [
  { value: 'short' as const, label: 'Short', desc: '~8-12 notes' },
  { value: 'medium' as const, label: 'Medium', desc: '~16-24 notes' },
  { value: 'long' as const, label: 'Long', desc: '~28-40 notes' },
]

const DURATIONS = [
  { value: 4, label: 'Whole', short: 'W' },
  { value: 3, label: 'Dot Half', short: 'H.' },
  { value: 2, label: 'Half', short: 'H' },
  { value: 1.5, label: 'Dot Qtr', short: 'Q.' },
  { value: 1, label: 'Quarter', short: 'Q' },
  { value: 0.5, label: 'Eighth', short: '8th' },
  { value: 0.25, label: '16th', short: '16th' },
]

// Builder keyboard: C3 to C6 (3 octaves)
const BUILDER_WHITES = ['C','D','E','F','G','A','B']
const BUILDER_BLACKS: Record<string, string> = { C:'Db', D:'Eb', F:'Gb', G:'Ab', A:'Bb' }
function buildOctaves(start: number, count: number) {
  const whites: string[] = [], blacks: { note: string; afterWhite: string }[] = []
  for (let o = start; o < start + count; o++) {
    for (const w of BUILDER_WHITES) {
      whites.push(`${w}${o}`)
      if (BUILDER_BLACKS[w]) blacks.push({ note: `${BUILDER_BLACKS[w]}${o}`, afterWhite: `${w}${o}` })
    }
  }
  whites.push(`C${start + count}`) // top C
  return { whites, blacks }
}
const KB = buildOctaves(3, 3)

type Mode = 'exercise' | 'custom'

export default function PianoStudioPage() {
  const { apiKey, isConfigured } = useAiStore()
  const { user } = useAuthStore()
  const { id: editId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('exercise')

  // Exercise state
  const [exerciseType, setExerciseType] = useState<typeof EXERCISE_TYPES[number]>('melody')
  const [genre, setGenre] = useState<typeof GENRES[number]>('Classical')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [key, setKey] = useState('C')
  const [hands, setHands] = useState<'right' | 'left' | 'both'>('right')
  const [timeSig, setTimeSig] = useState<[number, number]>([4, 4])
  const [difficulty, setDifficulty] = useState(3)

  // Custom builder state
  const [builderNotes, setBuilderNotes] = useState<NoteEvent[]>([])
  const [activeDuration, setActiveDuration] = useState(1)
  const [activeFinger, setActiveFinger] = useState<number | undefined>(undefined)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [builderBpm, setBuilderBpm] = useState(80)
  const [builderTimeSig, setBuilderTimeSig] = useState<[number, number]>([4, 4])
  const timelineRef = useRef<HTMLDivElement>(null)

  // Save/load state
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [exerciseTitle, setExerciseTitle] = useState('')
  const [myPatterns, setMyPatterns] = useState<DbExercise[]>([])

  // Shared state
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [piece, setPiece] = useState<GeneratedPiece | null>(null)
  const [history, setHistory] = useState<GeneratedPiece[]>([])
  const [pieceKey, setPieceKey] = useState(0)

  // ── Load saved patterns ──
  const loadPatterns = useCallback(async () => {
    if (!user) return
    try {
      const res = await apiListExercises({ category: 'piano-studio', instrument: 'piano' })
      setMyPatterns(res.exercises)
    } catch { /* ignore */ }
  }, [user])

  useEffect(() => { loadPatterns() }, [loadPatterns])

  // ── Load exercise for editing ──
  useEffect(() => {
    if (!editId) return
    (async () => {
      try {
        const res = await apiGetExercise(editId)
        const ex = res.exercise
        setSavedId(ex.id)
        setExerciseTitle(ex.title)
        const pd = ex.patternData as any
        const p: GeneratedPiece = {
          title: ex.title,
          description: ex.description,
          notes: pd.notes || [],
          notesLeft: pd.notesLeft,
          chordsLeft: pd.chordsLeft,
          keySignature: pd.keySignature || 'C',
          timeSignature: (ex.timeSignature as [number, number]) || [4, 4],
          targetBpm: ex.bpm || 80,
          difficulty: ex.difficulty || 1,
          hands: pd.hands || 'right',
        }
        setPiece(p); setPieceKey(k => k + 1)
        // If custom builder exercise, load notes into builder
        if (!ex.isAiGenerated && pd.notes?.length > 0) {
          setMode('custom')
          setBuilderNotes(pd.notes)
          setBuilderBpm(ex.bpm || 80)
          setBuilderTimeSig((ex.timeSignature as [number, number]) || [4, 4])
        }
      } catch { setError('Failed to load exercise') }
    })()
  }, [editId])

  // ── Save handler ──
  const handleSave = useCallback(async () => {
    // Auto-build piece from builder notes if not yet previewed
    let savePiece = piece
    if (!savePiece && mode === 'custom' && builderNotes.length > 0) {
      savePiece = {
        title: exerciseTitle.trim() || `Custom Exercise (${builderNotes.length} notes)`,
        description: `${builderBpm} BPM, ${builderTimeSig[0]}/${builderTimeSig[1]} time`,
        notes: builderNotes, keySignature: 'C', timeSignature: builderTimeSig,
        targetBpm: builderBpm, difficulty: 1, hands: 'right',
      }
      setPiece(savePiece); setPieceKey(k => k + 1)
    }
    if (!savePiece || !exerciseTitle.trim()) return
    setSaving(true); setSaveSuccess(false)
    const data = {
      title: exerciseTitle.trim(),
      description: savePiece.description || `${savePiece.notes.length} notes, ${savePiece.targetBpm} BPM`,
      patternData: { notes: savePiece.notes, notesLeft: savePiece.notesLeft, chordsLeft: savePiece.chordsLeft, keySignature: savePiece.keySignature, hands: savePiece.hands },
      category: 'piano-studio',
      instrument: 'piano',
      difficulty: savePiece.difficulty,
      bpm: savePiece.targetBpm,
      timeSignature: [savePiece.timeSignature[0], savePiece.timeSignature[1]],
      bars: Math.max(1, Math.ceil(savePiece.notes.reduce((s, n) => s + n.duration, 0) / savePiece.timeSignature[0])),
      tags: ['piano', 'studio'],
      isAiGenerated: mode === 'exercise',
    }
    try {
      const res = savedId
        ? await apiUpdateExercise(savedId, data)
        : await apiSaveExercise(data)
      setSavedId(res.exercise.id)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      loadPatterns()
    } catch { setError('Failed to save') }
    finally { setSaving(false) }
  }, [piece, exerciseTitle, savedId, mode, builderNotes, builderBpm, builderTimeSig, loadPatterns])

  // ── Delete handler ──
  const handleDelete = useCallback(async (id: string) => {
    try {
      await apiDeleteExercise(id)
      if (savedId === id) { setSavedId(null); setExerciseTitle(''); setPiece(null) }
      loadPatterns()
      if (editId === id) navigate('/piano/studio')
    } catch { setError('Failed to delete') }
  }, [savedId, editId, navigate, loadPatterns])

  const handleNewPattern = useCallback(() => {
    setSavedId(null); setExerciseTitle(''); setPiece(null); setBuilderNotes([]); setSelectedIdx(null)
    navigate('/piano/studio')
  }, [navigate])

  // ── Builder actions ──
  const addNote = useCallback((note: string) => {
    playPianoNote(note, 0.6, activeDuration * (60 / builderBpm))
    setBuilderNotes(prev => [...prev, { note, duration: activeDuration, finger: activeFinger }])
    setSelectedIdx(null)
  }, [activeDuration, activeFinger, builderBpm])

  const removeNote = useCallback((idx: number) => {
    setBuilderNotes(prev => prev.filter((_, i) => i !== idx))
    if (selectedIdx === idx) setSelectedIdx(null)
    else if (selectedIdx !== null && selectedIdx > idx) setSelectedIdx(selectedIdx - 1)
  }, [selectedIdx])

  const updateNote = useCallback((idx: number, patch: Partial<NoteEvent>) => {
    setBuilderNotes(prev => prev.map((n, i) => i === idx ? { ...n, ...patch } : n))
  }, [])

  const moveNote = useCallback((fromIdx: number, dir: -1 | 1) => {
    const toIdx = fromIdx + dir
    setBuilderNotes(prev => {
      if (toIdx < 0 || toIdx >= prev.length) return prev
      const arr = [...prev]; [arr[fromIdx], arr[toIdx]] = [arr[toIdx], arr[fromIdx]]; return arr
    })
    setSelectedIdx(fromIdx + dir)
  }, [])

  useEffect(() => {
    if (timelineRef.current) timelineRef.current.scrollLeft = timelineRef.current.scrollWidth
  }, [builderNotes.length])

  const handlePreview = useCallback(() => {
    if (builderNotes.length === 0) return
    const p: GeneratedPiece = {
      title: `Custom Exercise (${builderNotes.length} notes)`,
      description: `${builderBpm} BPM, ${builderTimeSig[0]}/${builderTimeSig[1]} time`,
      notes: builderNotes, keySignature: 'C', timeSignature: builderTimeSig,
      targetBpm: builderBpm, difficulty: 1, hands: 'right',
    }
    setPiece(p); setPieceKey(k => k + 1); setHistory(h => [p, ...h].slice(0, 20))
  }, [builderNotes, builderBpm, builderTimeSig])

  const totalBeats = builderNotes.reduce((s, n) => s + n.duration, 0)

  // ── AI Exercise generation ──
  const handleGenerate = async () => {
    if (!isConfigured) { setError('Set your Anthropic API key in Settings first.'); return }
    setGenerating(true); setError(''); setPiece(null)
    try {
      const result = await generatePiece(apiKey, {
        mode: 'exercise', exerciseType, genre, length, difficulty, key, hands,
        timeSignature: timeSig, bpm: 80, bars: 8,
      })
      setPiece(result); setPieceKey(k => k + 1); setHistory(h => [result, ...h].slice(0, 20))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally { setGenerating(false) }
  }

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="relative rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6" style={{
        background: 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(139,92,246,0.04) 50%, rgba(12,14,20,0.8) 100%)',
        border: '1px solid rgba(167,139,250,0.12)',
      }}>
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
        <div className="relative p-3 sm:p-4 md:p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
              ✨
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white tracking-tight">Piano Studio</h1>
              <p className="text-xs text-[#6b7280]">Create and generate piano exercises</p>
            </div>
          </div>
          {/* Mode tabs in header — like drum studio */}
          <div className="flex gap-2">
            {([
              { id: 'exercise' as Mode, label: 'AI Exercise', icon: '✨' },
              { id: 'custom' as Mode, label: 'Custom Builder', icon: '🎹' },
            ]).map(tab => (
              <button key={tab.id} onClick={() => setMode(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  mode === tab.id
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25 font-semibold'
                    : 'text-[#6b7280] bg-white/[0.03] border border-white/[0.04] hover:text-white hover:bg-white/[0.05]'
                }`}>
                <span className="mr-1">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-4 sm:gap-5">
      {/* ── My Patterns sidebar ── */}
      <div className="hidden xl:block">
        <Panel>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">My Patterns</span>
            <button onClick={handleNewPattern}
              className="text-[10px] px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/15 transition-colors cursor-pointer">
              + New
            </button>
          </div>
          <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
            {myPatterns.length === 0 ? (
              <div className="text-center text-[11px] text-[#4b5563] py-6">No saved patterns yet</div>
            ) : myPatterns.map(ex => (
              <div key={ex.id}
                className={`px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${savedId === ex.id ? 'bg-violet-500/[0.08]' : 'hover:bg-white/[0.03]'}`}
                onClick={() => navigate(`/piano/studio/${ex.id}`)}>
                <div className="flex items-center justify-between">
                  <span className={`text-[12px] font-medium truncate ${savedId === ex.id ? 'text-violet-400' : 'text-[#c4c9d4]'}`}>{ex.title}</span>
                  <button onClick={e => { e.stopPropagation(); handleDelete(ex.id) }}
                    className="text-[#374151] hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 p-0.5 cursor-pointer flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div className="flex gap-2 mt-0.5 text-[9px] text-[#4b5563]">
                  <span>{(ex.timeSignature ?? [4,4]).join('/')}</span>
                  <span>{ex.bpm} bpm</span>
                  <span>{ex.isAiGenerated ? 'AI' : 'Custom'}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── Main content area ── */}
      <div className="min-w-0">

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* AI EXERCISE MODE — two-column layout                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {mode === 'exercise' && (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] gap-3 sm:gap-4 md:gap-6">
          <div className="space-y-4">
            {!isConfigured && (
              <div className="px-4 py-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 text-xs text-amber-400/80">
                Set your Anthropic API key in <Link to="/settings" className="underline hover:text-amber-300">Settings</Link> to use AI generation.
              </div>
            )}
            <Panel>
              <Label>Exercise Type</Label>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {EXERCISE_TYPES.map(t => <Pill key={t} active={exerciseType === t} onClick={() => setExerciseType(t)}>{t.replace('-', ' ')}</Pill>)}
              </div>
              <Label>Genre</Label>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {GENRES.map(g => <Pill key={g} active={genre === g} onClick={() => setGenre(g)}>{g}</Pill>)}
              </div>
              <Label>Length</Label>
              <div className="flex gap-1.5 mb-4">
                {LENGTHS.map(l => (
                  <button key={l.value} onClick={() => setLength(l.value)} className="flex-1 px-2 py-2 rounded-lg text-center transition-all cursor-pointer"
                    style={{ background: length === l.value ? `${accent}15` : 'rgba(255,255,255,0.02)', border: `1px solid ${length === l.value ? `${accent}30` : 'rgba(255,255,255,0.04)'}` }}>
                    <div className={`text-[11px] font-medium ${length === l.value ? 'text-white' : 'text-[#6b7280]'}`}>{l.label}</div>
                    <div className="text-[9px] text-[#4b5563]">{l.desc}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Key</Label><div className="flex flex-wrap gap-1">{KEYS.map(k => <MiniPill key={k} active={key === k} onClick={() => setKey(k)}>{k}</MiniPill>)}</div></div>
                <div><Label>Hands</Label><div className="flex gap-1">{(['right','left','both'] as const).map(h => <MiniPill key={h} active={hands === h} onClick={() => setHands(h)} className="flex-1 text-center">{h === 'right' ? 'RH' : h === 'left' ? 'LH' : 'Both'}</MiniPill>)}</div></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label>Time Sig</Label><div className="flex gap-1">{TIME_SIGS.map(ts => <MiniPill key={ts.join('/')} active={timeSig[0]===ts[0]&&timeSig[1]===ts[1]} onClick={() => setTimeSig(ts)}>{ts[0]}/{ts[1]}</MiniPill>)}</div></div>
                <div><Label>Difficulty</Label><div className="flex items-center gap-1.5"><input type="range" min={1} max={7} value={difficulty} onChange={e => setDifficulty(parseInt(e.target.value))} className="flex-1 h-1 rounded-full cursor-pointer" style={{ accentColor: accent }} /><span className="text-xs font-bold text-white w-4 text-right">{difficulty}</span></div></div>
              </div>
            </Panel>
            <GradientButton onClick={handleGenerate} disabled={!isConfigured || generating}>
              {generating ? <><Spinner /> Generating...</> : <><span className="text-lg">✨</span> Generate</>}
            </GradientButton>
            {error && <div className="px-3 py-2.5 rounded-lg text-xs text-rose-400 bg-rose-500/[0.06] border border-rose-500/15">{error}</div>}
            <HistoryList history={history} piece={piece} onSelect={(h) => { setPiece(h); setPieceKey(k => k + 1) }} />
          </div>
          <div className="min-w-0 space-y-4">
            {piece && <SaveBar title={exerciseTitle} onTitleChange={setExerciseTitle} onSave={handleSave}
              saving={saving} saveSuccess={saveSuccess} savedId={savedId} disabled={!piece || !user} notLoggedIn={!user} />}
            {piece ? <PiecePlayer piece={piece} pieceKey={pieceKey} /> : (
              <EmptyState icon="✨" title="Generate an Exercise" text={isConfigured ? 'Pick an exercise type, genre, and length — Clara will generate a custom exercise for you.' : 'Add your API key in Settings to get started.'} />
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CUSTOM BUILDER MODE — full-width layout like drum studio               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {mode === 'custom' && (<>
        {/* Settings bar — full width */}
        <Panel>
          <div className="flex flex-wrap items-end gap-4 sm:gap-6">
            <div>
              <Label>Tempo</Label>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setBuilderBpm(b => Math.max(30, b - 5))} className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer transition-colors text-sm font-bold">-</button>
                <span className="font-mono text-white text-sm w-8 text-center">{builderBpm}</span>
                <button onClick={() => setBuilderBpm(b => Math.min(200, b + 5))} className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer transition-colors text-sm font-bold">+</button>
                <span className="text-[10px] text-[#4b5563]">BPM</span>
              </div>
            </div>
            <div>
              <Label>Time Sig</Label>
              <div className="flex gap-1">
                {TIME_SIGS.map(ts => <MiniPill key={ts.join('/')} active={builderTimeSig[0]===ts[0]&&builderTimeSig[1]===ts[1]} onClick={() => setBuilderTimeSig(ts)}>{ts[0]}/{ts[1]}</MiniPill>)}
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Note Duration</Label>
              <div className="flex flex-wrap gap-1">
                {DURATIONS.map(d => <MiniPill key={d.value} active={activeDuration === d.value} onClick={() => setActiveDuration(d.value)}>{d.short}</MiniPill>)}
              </div>
            </div>
            <div>
              <Label>Finger</Label>
              <div className="flex gap-1">
                <MiniPill active={activeFinger === undefined} onClick={() => setActiveFinger(undefined)}>—</MiniPill>
                {[1,2,3,4,5].map(f => <MiniPill key={f} active={activeFinger === f} onClick={() => setActiveFinger(f)}>{f}</MiniPill>)}
              </div>
            </div>
          </div>
        </Panel>

        {/* Keyboard — large, full width */}
        <div className="mt-4">
          <Panel>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">Click keys to add notes</span>
              <span className="text-[10px] text-[#374151]">C3 — C6 (3 octaves)</span>
            </div>
            <div className="overflow-x-auto rounded-lg pb-1">
              <LargeKeyboard onClickNote={addNote} highlightNote={selectedIdx !== null && selectedIdx < builderNotes.length ? builderNotes[selectedIdx].note : null} />
            </div>
          </Panel>
        </div>

        {/* Note sequence — full width grid */}
        <div className="mt-4">
          <Panel>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">
                {builderNotes.length > 0
                  ? `${builderNotes.length} notes — ${totalBeats} beats — ${Math.ceil(totalBeats / builderTimeSig[0]) || 0} bars`
                  : 'Note Sequence'}
              </span>
              <div className="flex items-center gap-2">
                {builderNotes.length > 0 && (
                  <button onClick={() => { setBuilderNotes([]); setSelectedIdx(null); setPiece(null) }}
                    className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#4b5563] hover:text-rose-400 transition-colors cursor-pointer">
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {builderNotes.length === 0 ? (
              <div className="text-center py-10 text-[#374151] text-sm">
                Click a key on the keyboard above to start building your exercise
              </div>
            ) : (
              <>
                <div ref={timelineRef} className="overflow-x-auto pb-2" style={{ scrollBehavior: 'smooth' }}>
                  <div className="flex gap-1.5 min-w-min">
                    {builderNotes.map((n, i) => {
                      const isSelected = selectedIdx === i
                      const w = Math.max(44, n.duration * 52)
                      const beatsBefore = builderNotes.slice(0, i).reduce((s, x) => s + x.duration, 0)
                      const isBarStart = i > 0 && Math.abs(beatsBefore % builderTimeSig[0]) < 0.01
                      return (
                        <div key={i} className="flex-shrink-0 flex items-stretch">
                          {isBarStart && <div className="w-0.5 rounded-full self-stretch mx-0.5" style={{ background: `${accent}25` }} />}
                          <button
                            onClick={() => { setSelectedIdx(isSelected ? null : i); playPianoNote(n.note, 0.5) }}
                            className="relative rounded-xl text-center transition-all cursor-pointer group flex flex-col items-center justify-center py-2.5"
                            style={{
                              width: w, minHeight: 64,
                              background: isSelected ? `${accent}18` : 'rgba(255,255,255,0.03)',
                              border: `1.5px solid ${isSelected ? accent : 'rgba(255,255,255,0.06)'}`,
                              boxShadow: isSelected ? `0 0 16px -4px ${accent}40` : 'none',
                            }}>
                            <div className="text-xs font-bold text-white leading-none">{n.note}</div>
                            <div className="text-[9px] text-[#4b5563] mt-1">{DURATIONS.find(d => d.value === n.duration)?.short || n.duration}</div>
                            {n.finger && <div className="text-[9px] font-bold mt-0.5" style={{ color: `${accent}` }}>{n.finger}</div>}
                            <button onClick={e => { e.stopPropagation(); removeNote(i) }}
                              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500/90 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-rose-600">✕</button>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Selected note editor bar */}
                {selectedIdx !== null && selectedIdx < builderNotes.length && (() => {
                  const n = builderNotes[selectedIdx]
                  return (
                    <div className="mt-3 p-3 rounded-xl flex flex-wrap items-center gap-3" style={{ background: `${accent}08`, border: `1px solid ${accent}18` }}>
                      <span className="text-xs text-white font-bold">{n.note}</span>
                      <div className="w-px h-6 bg-white/[0.06]" />
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-[#4b5563] uppercase tracking-wider mr-1">Dur:</span>
                        {DURATIONS.map(d => <MiniPill key={d.value} active={n.duration === d.value} onClick={() => updateNote(selectedIdx, { duration: d.value })}>{d.short}</MiniPill>)}
                      </div>
                      <div className="w-px h-6 bg-white/[0.06]" />
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-[#4b5563] uppercase tracking-wider mr-1">Finger:</span>
                        <MiniPill active={!n.finger} onClick={() => updateNote(selectedIdx, { finger: undefined })}>—</MiniPill>
                        {[1,2,3,4,5].map(f => <MiniPill key={f} active={n.finger === f} onClick={() => updateNote(selectedIdx, { finger: f })}>{f}</MiniPill>)}
                      </div>
                      <div className="w-px h-6 bg-white/[0.06]" />
                      <button onClick={() => moveNote(selectedIdx, -1)} disabled={selectedIdx === 0}
                        className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#6b7280] hover:text-white disabled:opacity-30 cursor-pointer flex items-center justify-center text-xs">&#8592;</button>
                      <button onClick={() => moveNote(selectedIdx, 1)} disabled={selectedIdx >= builderNotes.length - 1}
                        className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#6b7280] hover:text-white disabled:opacity-30 cursor-pointer flex items-center justify-center text-xs">&#8594;</button>
                      <button onClick={() => removeNote(selectedIdx)}
                        className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 cursor-pointer flex items-center justify-center text-xs">✕</button>
                    </div>
                  )
                })()}
              </>
            )}
          </Panel>
        </div>

        {/* Actions: Preview + Save */}
        {builderNotes.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <GradientButton onClick={handlePreview} disabled={builderNotes.length === 0}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                {piece ? 'Update Preview' : 'Preview'} ({builderNotes.length} notes)
              </GradientButton>
              <HistoryList history={history} piece={piece} onSelect={(h) => { setPiece(h); setPieceKey(k => k + 1) }} />
            </div>
            <SaveBar title={exerciseTitle} onTitleChange={setExerciseTitle}
              onSave={handleSave}
              saving={saving} saveSuccess={saveSuccess} savedId={savedId}
              disabled={builderNotes.length === 0 || !user} notLoggedIn={!user} />
          </div>
        )}

        {/* Player */}
        {piece && (
          <div className="mt-4">
            <PiecePlayer piece={piece} pieceKey={pieceKey} />
          </div>
        )}
      </>)}

      </div>{/* end main content area */}
      </div>{/* end grid with sidebar */}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Large Keyboard — full-width 3-octave keyboard for note input
// ═══════════════════════════════════════════════════════════════════════════════

function LargeKeyboard({ onClickNote, highlightNote }: { onClickNote: (note: string) => void; highlightNote: string | null }) {
  const kw = 36, kh = 120, bw = 22, bh = 74, gap = 1.5
  const whites = KB.whites
  const totalW = whites.length * (kw + gap) - gap + 4
  const svgH = kh + 4

  const whiteIdxMap: Record<string, number> = {}
  whites.forEach((n, i) => { whiteIdxMap[n] = i })

  return (
    <svg viewBox={`0 0 ${totalW} ${svgH}`} width={totalW} height={svgH} className="block cursor-pointer" style={{ minHeight: 100 }}>
      {/* White keys */}
      {whites.map((note, i) => {
        const x = 2 + i * (kw + gap)
        const isHL = highlightNote === note
        return (
          <g key={note} onClick={() => onClickNote(note)}>
            <rect x={x} y={2} width={kw} height={kh} rx={4}
              fill={isHL ? '#a78bfa' : '#e2e8f0'} stroke="#1e293b" strokeWidth={0.5}
              className="hover:fill-[#c4b5fd] transition-colors" />
            <text x={x + kw/2} y={kh - 8} textAnchor="middle" fontSize={9} fill={isHL ? '#fff' : '#6b7280'} fontWeight={600}>{note}</text>
          </g>
        )
      })}
      {/* Black keys */}
      {KB.blacks.map(({ note, afterWhite }) => {
        const wIdx = whiteIdxMap[afterWhite]
        if (wIdx === undefined) return null
        const x = 2 + wIdx * (kw + gap) + kw - bw/2 + gap/2
        const isHL = highlightNote === note
        return (
          <g key={note} onClick={() => onClickNote(note)}>
            <rect x={x} y={2} width={bw} height={bh} rx={3}
              fill={isHL ? '#8b5cf6' : '#1e293b'} stroke="#0f1117" strokeWidth={0.5}
              className="hover:fill-[#7c3aed] transition-colors" />
            <text x={x + bw/2} y={bh - 6} textAnchor="middle" fontSize={8} fill={isHL ? '#fff' : '#6b7280'} fontWeight={600}>{note.replace(/\d/, '')}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared components
// ═══════════════════════════════════════════════════════════════════════════════

function PiecePlayer({ piece, pieceKey }: { piece: GeneratedPiece; pieceKey: number }) {
  return (
    <div>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-white truncate">{piece.title}</h2>
          <p className="text-xs text-[#6b7280]">{piece.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Tag>Key: {piece.keySignature}</Tag>
            <Tag>{piece.timeSignature[0]}/{piece.timeSignature[1]}</Tag>
            <Tag>{piece.targetBpm} BPM</Tag>
            <Tag>{piece.hands === 'both' ? 'Both hands' : piece.hands === 'right' ? 'RH' : 'LH'}</Tag>
          </div>
        </div>
      </div>
      <PracticePlayer
        notes={piece.notes.length > 0 ? piece.notes : undefined}
        notesLeft={piece.notesLeft} chordsLeft={piece.chordsLeft}
        defaultBpm={piece.targetBpm} timeSignature={piece.timeSignature}
        resetKey={`studio-${pieceKey}`}
      />
    </div>
  )
}

function HistoryList({ history, piece, onSelect }: { history: GeneratedPiece[]; piece: GeneratedPiece | null; onSelect: (h: GeneratedPiece) => void }) {
  if (history.length === 0) return null
  return (
    <div className="rounded-xl sm:rounded-2xl border border-white/[0.04] p-3 sm:p-4 flex-1 min-w-0" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
      <Label>Recent ({history.length})</Label>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {history.map((h, i) => (
          <button key={i} onClick={() => onSelect(h)}
            className="flex-shrink-0 text-left px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-all cursor-pointer max-w-[200px]"
            style={{ border: piece === h ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.03)' }}>
            <div className="text-[11px] font-medium text-[#e2e8f0] truncate">{h.title}</div>
            <div className="text-[9px] text-[#4b5563] truncate">{h.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function SaveBar({ title, onTitleChange, onSave, saving, saveSuccess, savedId, disabled, notLoggedIn }: {
  title: string; onTitleChange: (v: string) => void; onSave: () => void
  saving: boolean; saveSuccess: boolean; savedId: string | null; disabled: boolean; notLoggedIn?: boolean
}) {
  return (
    <div className="rounded-xl border border-violet-500/15 p-3 sm:p-4" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.04) 0%, rgba(12,14,20,0.7) 100%)' }}>
      <div className="text-[10px] uppercase tracking-widest text-[#4b5563] font-semibold mb-2">
        {savedId ? 'Update Exercise' : 'Save Exercise'}
      </div>
      {notLoggedIn ? (
        <div className="text-xs text-amber-400/80">
          <Link to="/settings" className="underline hover:text-amber-300">Log in</Link> to save exercises.
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <input value={title} onChange={e => onTitleChange(e.target.value)}
            placeholder="Give it a name..."
            className="flex-1 min-w-[150px] px-3 py-2.5 rounded-lg text-sm text-white placeholder-[#4b5563] bg-white/[0.04] border border-white/[0.06] focus:border-violet-500/30 outline-none transition-colors" />
          <button onClick={onSave} disabled={disabled || saving || !title.trim()}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            style={disabled || saving || !title.trim() ? { background: 'rgba(255,255,255,0.04)', color: '#374151' } : { background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff' }}>
            {saving ? <><Spinner /> Saving...</> : saveSuccess ? (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Saved!</>
            ) : savedId ? <>Update</> : <>Save</>}
          </button>
          {savedId && (
            <Link to={`/piano/practice/my-exercises/${savedId}`}
              className="px-4 py-2.5 rounded-lg text-[11px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/15 transition-colors">
              Practice this
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-white/[0.04] p-6 sm:p-8 md:p-12 lg:p-16 text-center" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.5) 0%, rgba(10,12,18,0.6) 100%)' }}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-base sm:text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#6b7280] max-w-md mx-auto leading-relaxed">{text}</p>
    </div>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-white/[0.04] p-4 sm:p-5" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
      {children}
    </div>
  )
}

function GradientButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="py-3.5 px-8 rounded-xl text-white font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2"
      style={{ background: `linear-gradient(135deg, ${accent}, #8b5cf6)`, boxShadow: `0 4px 20px -4px rgba(167,139,250,0.4)` }}>
      {children}
    </button>
  )
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[9px] uppercase tracking-widest text-[#4b5563] font-semibold mb-1.5">{children}</div>
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-0.5 rounded text-[9px] font-medium" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#6b7280' }}>{children}</span>
}

function Pill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="px-3 py-2 rounded-lg text-[11px] font-medium capitalize transition-all cursor-pointer"
      style={{ background: active ? `${accent}15` : 'rgba(255,255,255,0.02)', border: `1px solid ${active ? `${accent}30` : 'rgba(255,255,255,0.04)'}`, color: active ? '#fff' : '#6b7280' }}>
      {children}
    </button>
  )
}

function MiniPill({ children, active, onClick, className = '' }: { children: React.ReactNode; active: boolean; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick}
      className={`px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${className}`}
      style={{ background: active ? `${accent}15` : 'rgba(255,255,255,0.02)', border: `1px solid ${active ? `${accent}25` : 'rgba(255,255,255,0.03)'}`, color: active ? '#fff' : '#4b5563' }}>
      {children}
    </button>
  )
}
