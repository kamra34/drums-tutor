import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { PatternData, HitValue } from '@drums/types/curriculum'
import { DrumPad } from '@drums/types/midi'
import EditableGrid from '@drums/components/studio/EditableGrid'
import NotationInput from '@drums/components/studio/NotationInput'
import AiBuilderTab from '@drums/components/studio/AiBuilderTab'
import ScanTab from '@drums/components/studio/ScanTab'
import StaffNotationDisplay from '@drums/components/StaffNotationDisplay'
import { apiSaveExercise, apiUpdateExercise, apiGetExercise, apiListExercises, apiDeleteExercise, apiUploadBackingTrack, apiGetBackingTrack, apiDeleteBackingTrack, DbExercise } from '@shared/services/apiClient'
import { loadBackingTrack, setBackingTrack, clearBackingTrack, setBackingVolume, setBackingBpm as setServiceBackingBpm, setBackingOffset, playBackingPreview, getBackingPreviewElapsed, stopBackingPreview } from '@drums/services/drumSounds'

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
  { value: 1, label: 'Quarter' },
  { value: 2, label: '8th' },
  { value: 3, label: 'Triplet' },
  { value: 4, label: '16th' },
]

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b) }
function lcm(a: number, b: number): number { return (a * b) / gcd(a, b) }
function lcmArray(arr: number[]): number { return arr.reduce((a, b) => lcm(a, b), 1) }

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function makeEmptyPattern(beats: number, subdivisions: number, _bars: number): PatternData {
  return { beats, subdivisions, tracks: {} }
}

// ── Studio Page ──────────────────────────────────────────────────────────────

type StudioMode = 'create' | 'ai-builder' | 'scan' | null

export default function StudioPage() {
  const { id: editId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [mode, setMode] = useState<StudioMode>(null)

  // Pattern settings
  const [title, setTitle] = useState('')
  const [timeSig, setTimeSig] = useState<[number, number]>([4, 4])
  const [barSubdivisions, setBarSubdivisions] = useState<number[]>([1])
  const subdivisions = useMemo(() => lcmArray(barSubdivisions), [barSubdivisions])
  const [bars, setBars] = useState(1)
  const [bpm, setBpm] = useState(90)
  const [enabledPads, setEnabledPads] = useState<DrumPad[]>(DEFAULT_PADS)

  // Pattern data
  const [pattern, setPattern] = useState<PatternData>(() => makeEmptyPattern(4, 1, 1))

  // Save state
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)

  // Backing track
  const [backingLocked, setBackingLocked] = useState(false)
  const [backingFileName, setBackingFileName] = useState<string | null>(null)
  const [backingUrl, setBackingUrl] = useState<string | null>(null)
  const [backingBpm, setBackingBpm] = useState(120)
  const [backingVol, setBackingVol] = useState(0.7)
  const [backingLoading, setBackingLoading] = useState(false)
  const [backingSyncOffset, setBackingSyncOffset] = useState(0) // seconds
  const [syncMode, setSyncMode] = useState<'idle' | 'listening' | 'pick-bar'>('idle')
  const [syncTapTime, setSyncTapTime] = useState(0)
  const backingInputRef = useRef<HTMLInputElement>(null)
  const backingFileRef = useRef<File | null>(null)
  const hadBackingOnLoadRef = useRef(false)
  const audioPreviewRef = useRef<HTMLAudioElement>(null)
  const [previewPlaying, setPreviewPlaying] = useState(false)
  const [previewTime, setPreviewTime] = useState(0)
  const [previewDuration, setPreviewDuration] = useState(0)
  const previewAnimRef = useRef<number>(0)

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
      const loadedBars = exercise.bars ?? 1
      const savedBarSubs = (pd as any).barSubdivisions as number[] | undefined
      setBarSubdivisions(savedBarSubs && savedBarSubs.length === loadedBars
        ? savedBarSubs
        : new Array(loadedBars).fill(pd.subdivisions))
      setBars(loadedBars)
      setBpm(exercise.bpm ?? 90)
      // Internally pattern.beats = beats per bar, not total. Convert if needed.
      const ts = (exercise.timeSignature ?? [4, 4]) as [number, number]
      const internalPd = { ...pd, beats: ts[0] }
      setPattern(internalPd)
      setSavedId(exercise.id)

      // Derive enabled pads from pattern tracks
      const padsInUse = Object.keys(pd.tracks) as DrumPad[]
      const allPads = [...new Set([...DEFAULT_PADS, ...padsInUse])]
      setEnabledPads(allPads)
      setMode('create')

      // Load backing track metadata + audio if present
      if (exercise.backingTrackName) {
        hadBackingOnLoadRef.current = true
        setBackingLocked(true)
        setBackingLoading(true)
        setBackingFileName(exercise.backingTrackName)
        setBackingBpm(exercise.backingTrackBpm ?? exercise.bpm ?? 90)
        setServiceBackingBpm(exercise.backingTrackBpm ?? exercise.bpm ?? 90)
        setBackingSyncOffset(exercise.backingTrackOffset ?? 0)
        setBackingOffset(exercise.backingTrackOffset ?? 0)
        setBackingVol(exercise.backingTrackVolume ?? 0.7)
        setBackingVolume(exercise.backingTrackVolume ?? 0.7)
        // Fetch the actual audio data
        apiGetBackingTrack(exercise.id).then(blob => {
          if (!blob) { console.warn('No backing track blob returned'); setBackingLoading(false); return }
          console.log('Backing track blob:', blob.size, 'bytes, type:', blob.type)
          const url = URL.createObjectURL(blob)
          setBackingUrl(url)
          setPreviewDuration(0)
          const trackBpm = exercise.backingTrackBpm ?? exercise.bpm ?? 90
          // Decode for Web Audio playback
          const audioFile = new File([blob], exercise.backingTrackName || 'backing.mp3', { type: blob.type || 'audio/mpeg' })
          backingFileRef.current = audioFile
          loadBackingTrack(audioFile).then(({ buffer, duration }) => {
            setBackingTrack(buffer, trackBpm)
            setBackingOffset(exercise.backingTrackOffset ?? 0)
            setPreviewDuration(duration)
            setBackingLoading(false)
            console.log('Backing track loaded:', { duration, trackBpm, offset: exercise.backingTrackOffset })
          }).catch(err => { setBackingLoading(false); console.error('Failed to decode backing track:', err) })
        }).catch(err => { setBackingLoading(false); console.error('Failed to fetch backing track:', err) })
      }
    }).catch(() => {
      navigate('/drums/studio', { replace: true })
    }).finally(() => setLoadingEdit(false))
  }, [editId])

  // Resize pattern tracks when beats or bars change (preserve existing data)
  function handleResizePattern(newBeats: number, newMaxSub: number, newBars: number) {
    const newTotalSlots = newBeats * newMaxSub * newBars
    const newTracks: Partial<Record<DrumPad, HitValue[]>> = {}
    for (const [pad, oldTrack] of Object.entries(pattern.tracks) as [DrumPad, HitValue[]][]) {
      const newTrack: HitValue[] = new Array(newTotalSlots).fill(0)
      for (let i = 0; i < Math.min(oldTrack.length, newTotalSlots); i++) newTrack[i] = oldTrack[i]
      if (newTrack.some(v => v > 0)) newTracks[pad] = newTrack
    }
    setPattern({ beats: newBeats, subdivisions: newMaxSub, tracks: newTracks })
  }

  function handleTimeSigChange(ts: [number, number]) {
    setTimeSig(ts)
    handleResizePattern(ts[0], subdivisions, bars)
  }

  function handleBarsChange(b: number) {
    setBars(b)
    // Extend or shrink barSubdivisions array
    setBarSubdivisions(prev => {
      if (b > prev.length) return [...prev, ...new Array(b - prev.length).fill(1)]
      return prev.slice(0, b)
    })
    handleResizePattern(timeSig[0], subdivisions, b)
  }

  // Change resolution for the currently editing bar
  function handleBarResolutionChange(newSub: number) {
    const newBarSubs = [...barSubdivisions]
    const oldBarSub = newBarSubs[editingBar]
    newBarSubs[editingBar] = newSub
    const newMaxSub = lcmArray(newBarSubs)
    const oldMaxSub = subdivisions

    if (newMaxSub !== oldMaxSub) {
      // Re-map the entire pattern to the new max resolution
      const oldSlotsPerBar = timeSig[0] * oldMaxSub
      const newSlotsPerBar = timeSig[0] * newMaxSub
      const newTotalSlots = newSlotsPerBar * bars
      const newTracks: Partial<Record<DrumPad, HitValue[]>> = {}

      for (const [pad, oldTrack] of Object.entries(pattern.tracks) as [DrumPad, HitValue[]][]) {
        const newTrack: HitValue[] = new Array(newTotalSlots).fill(0)
        for (let barIdx = 0; barIdx < bars; barIdx++) {
          const bSub = barSubdivisions[barIdx] // old per-bar sub for reading
          for (let beat = 0; beat < timeSig[0]; beat++) {
            for (let s = 0; s < bSub; s++) {
              const oldSlot = barIdx * oldSlotsPerBar + beat * oldMaxSub + s * (oldMaxSub / bSub)
              const newSlot = barIdx * newSlotsPerBar + beat * newMaxSub + s * (newMaxSub / bSub)
              if (oldSlot < oldTrack.length) newTrack[newSlot] = oldTrack[oldSlot]
            }
          }
        }
        if (newTrack.some(v => v > 0)) newTracks[pad] = newTrack
      }
      setPattern({ beats: timeSig[0], subdivisions: newMaxSub, tracks: newTracks })
    }
    setBarSubdivisions(newBarSubs)
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

  // ── Bar reorder (drag & drop) ──
  const dragBarRef = useRef<number | null>(null)

  function handleMoveBar(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= bars || toIdx >= bars) return
    const slotsPerBar = timeSig[0] * subdivisions

    // Extract all bars as separate slices
    const barSlices: Partial<Record<DrumPad, HitValue[]>>[] = []
    for (let b = 0; b < bars; b++) {
      const start = b * slotsPerBar
      const slice: Partial<Record<DrumPad, HitValue[]>> = {}
      for (const [pad, track] of Object.entries(pattern.tracks) as [DrumPad, HitValue[]][]) {
        const barTrack = track.slice(start, start + slotsPerBar)
        if (barTrack.some(v => v > 0)) slice[pad] = barTrack
      }
      barSlices.push(slice)
    }

    // Reorder slices and barSubdivisions
    const newBarSubs = [...barSubdivisions]
    const [movedSlice] = barSlices.splice(fromIdx, 1)
    barSlices.splice(toIdx, 0, movedSlice)
    const [movedSub] = newBarSubs.splice(fromIdx, 1)
    newBarSubs.splice(toIdx, 0, movedSub)

    // Rebuild flat tracks
    const totalSlots = slotsPerBar * bars
    const newTracks: Partial<Record<DrumPad, HitValue[]>> = {}
    const allPads = new Set(barSlices.flatMap(s => Object.keys(s) as DrumPad[]))
    for (const pad of allPads) {
      const full: HitValue[] = new Array(totalSlots).fill(0)
      for (let b = 0; b < bars; b++) {
        const src = barSlices[b][pad]
        if (src) for (let i = 0; i < slotsPerBar; i++) full[b * slotsPerBar + i] = src[i] || 0
      }
      if (full.some(v => v > 0)) newTracks[pad] = full
    }

    setPattern({ beats: timeSig[0], subdivisions, tracks: newTracks })
    setBarSubdivisions(newBarSubs)
    setEditingBar(toIdx)
  }

  // ── Duplicate bar (insert copy after current) ──
  function handleDuplicateBar(barIdx: number) {
    if (bars >= 999) return
    const slotsPerBar = timeSig[0] * subdivisions
    const totalSlots = slotsPerBar * bars
    const barStart = barIdx * slotsPerBar

    // Build new tracks with the duplicated bar inserted
    const newTotalSlots = slotsPerBar * (bars + 1)
    const newTracks: Partial<Record<DrumPad, HitValue[]>> = {}
    const allPads = Object.keys(pattern.tracks) as DrumPad[]
    for (const pad of allPads) {
      const old = pattern.tracks[pad] || []
      const full: HitValue[] = new Array(newTotalSlots).fill(0)
      // Copy bars before and including the duplicated bar
      for (let i = 0; i < barStart + slotsPerBar; i++) full[i] = old[i] || 0
      // Insert the duplicate
      for (let i = 0; i < slotsPerBar; i++) full[barStart + slotsPerBar + i] = old[barStart + i] || 0
      // Copy remaining bars (shifted by one bar)
      for (let i = barStart + slotsPerBar; i < totalSlots; i++) full[i + slotsPerBar] = old[i] || 0
      if (full.some(v => v > 0)) newTracks[pad] = full
    }

    // Insert duplicated bar's subdivision
    const newBarSubs = [...barSubdivisions]
    newBarSubs.splice(barIdx + 1, 0, barSubdivisions[barIdx] ?? subdivisions)

    setBars(bars + 1)
    setBarSubdivisions(newBarSubs)
    setPattern({ beats: timeSig[0], subdivisions, tracks: newTracks })
    setEditingBar(barIdx + 1)
  }

  // ── Delete a bar ──
  function handleDeleteBar(barIdx: number) {
    if (bars <= 1) return // must keep at least 1 bar
    const slotsPerBar = timeSig[0] * subdivisions
    const totalSlots = slotsPerBar * bars
    const barStart = barIdx * slotsPerBar

    const newTotalSlots = slotsPerBar * (bars - 1)
    const newTracks: Partial<Record<DrumPad, HitValue[]>> = {}
    for (const pad of Object.keys(pattern.tracks) as DrumPad[]) {
      const old = pattern.tracks[pad] || []
      const full: HitValue[] = new Array(newTotalSlots).fill(0)
      // Copy bars before the deleted bar
      for (let i = 0; i < barStart; i++) full[i] = old[i] || 0
      // Copy bars after the deleted bar (shifted back)
      for (let i = barStart + slotsPerBar; i < totalSlots; i++) full[i - slotsPerBar] = old[i] || 0
      if (full.some(v => v > 0)) newTracks[pad] = full
    }

    const newBarSubs = [...barSubdivisions]
    newBarSubs.splice(barIdx, 1)

    const newBars = bars - 1
    setBars(newBars)
    setBarSubdivisions(newBarSubs)
    setPattern({ beats: timeSig[0], subdivisions, tracks: newTracks })
    setEditingBar(Math.min(editingBar, newBars - 1))
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    setSaveSuccess(false)
    try {
      const data = {
        title: title.trim(),
        description: `Custom pattern created in Studio`,
        patternData: { ...fullPattern, barSubdivisions },
        category: 'studio',
        difficulty: 5,
        bpm,
        timeSignature: timeSig,
        bars,
        tags: ['studio', 'custom'],
        isAiGenerated: false,
      }

      let exerciseId = savedId
      if (savedId) {
        await apiUpdateExercise(savedId, data)
      } else {
        const { exercise } = await apiSaveExercise(data)
        setSavedId(exercise.id)
        exerciseId = exercise.id
      }
      // Handle backing track: upload if present, delete if removed
      if (exerciseId) {
        if (backingFileRef.current && backingFileName) {
          try {
            await apiUploadBackingTrack(exerciseId, backingFileRef.current, {
              bpm: backingBpm, offset: backingSyncOffset, volume: backingVol,
            })
            hadBackingOnLoadRef.current = true
          } catch (e) { console.error('Backing track upload failed:', e) }
        } else if (!backingFileName && hadBackingOnLoadRef.current) {
          // Backing track was removed — delete from server
          try {
            await apiDeleteBackingTrack(exerciseId)
            hadBackingOnLoadRef.current = false
          } catch (e) { console.error('Backing track delete failed:', e) }
        }
      }
      setSaveSuccess(true)
      if (backingFileName) setBackingLocked(true)
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

  function resetPatternState() {
    setSavedId(null)
    setTitle('')
    setTimeSig([4, 4])
    setBarSubdivisions([1])
    setBars(1)
    setBpm(90)
    setEnabledPads(DEFAULT_PADS)
    setPattern(makeEmptyPattern(4, 1, 1))
    setEditingBar(0)
    clearBackingTrack()
    setBackingLocked(false)
    setBackingFileName(null)
    setBackingBpm(90)
    setBackingSyncOffset(0)
  }

  async function handleBackingUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBackingLoading(true)
    try {
      const { buffer, url, duration } = await loadBackingTrack(file)
      setBackingBpm(bpm)
      setServiceBackingBpm(bpm)
      setBackingTrack(buffer, bpm)
      setBackingFileName(file.name)
      setBackingUrl(url)
      setPreviewDuration(duration)
      backingFileRef.current = file
    } catch {
      setBackingFileName(null)
    } finally {
      setBackingLoading(false)
      if (backingInputRef.current) backingInputRef.current.value = ''
    }
  }

  function handleBackingBpmChange(newBpm: number) {
    setBackingBpm(newBpm)
    setServiceBackingBpm(newBpm)
  }

  function handleRemoveBacking() {
    if (audioPreviewRef.current) { audioPreviewRef.current.pause(); audioPreviewRef.current.src = '' }
    cancelAnimationFrame(previewAnimRef.current)
    clearBackingTrack()
    setBackingFileName(null)
    setBackingUrl(null)
    setBackingSyncOffset(0)
    setPreviewPlaying(false)
  }

  function handleSyncOffsetChange(sec: number) {
    setBackingSyncOffset(sec)
    setBackingOffset(sec)
  }

  // Mini-player controls
  function handlePreviewToggle() {
    const audio = audioPreviewRef.current
    if (!audio) return
    if (previewPlaying) {
      audio.pause()
      setPreviewPlaying(false)
      cancelAnimationFrame(previewAnimRef.current)
    } else {
      audio.play()
      setPreviewPlaying(true)
      const tick = () => {
        setPreviewTime(audio.currentTime)
        if (!audio.paused) previewAnimRef.current = requestAnimationFrame(tick)
      }
      previewAnimRef.current = requestAnimationFrame(tick)
    }
  }

  function handlePreviewSeek(time: number) {
    const audio = audioPreviewRef.current
    if (!audio) return
    audio.currentTime = time
    setPreviewTime(time)
  }

  // Compute offset: songTime (in original file) should align with barIdx in pattern
  function computeAndSetOffset(songTime: number, barIdx: number) {
    // barIdx starts at this many seconds of pattern time
    const barStartMusical = barIdx * timeSig[0] * (60 / bpm)
    // The offset = how far into the song file pattern's Bar 1 Beat 1 occurs
    // If bar 11 (idx=10) aligns with songTime, then Bar 1 is (songTime - barStartMusical) earlier in the song
    // But we need to account for playback rate difference
    const barStartInSong = barStartMusical * (backingBpm / bpm)
    const offset = songTime - barStartInSong
    handleSyncOffsetChange(offset)
  }

  // Tap-to-sync: plays song, user taps, then picks which bar
  function handleStartTapSync() {
    const audio = audioPreviewRef.current
    if (!audio) return
    audio.currentTime = 0
    audio.play()
    setPreviewPlaying(true)
    setSyncMode('listening')
    const tick = () => {
      setPreviewTime(audio.currentTime)
      if (!audio.paused) previewAnimRef.current = requestAnimationFrame(tick)
    }
    previewAnimRef.current = requestAnimationFrame(tick)
  }

  function handleSyncTap() {
    const audio = audioPreviewRef.current
    if (!audio) return
    setSyncTapTime(audio.currentTime)
    audio.pause()
    setPreviewPlaying(false)
    cancelAnimationFrame(previewAnimRef.current)
    setSyncMode('pick-bar')
  }

  function handleSyncPickBar(barIdx: number) {
    computeAndSetOffset(syncTapTime, barIdx)
    setSyncMode('idle')
  }

  function handleSyncCancel() {
    const audio = audioPreviewRef.current
    if (audio) { audio.pause() }
    setPreviewPlaying(false)
    cancelAnimationFrame(previewAnimRef.current)
    setSyncMode('idle')
  }

  function handleNewPattern() {
    resetPatternState()
    setMode(null)
    navigate('/drums/studio', { replace: true })
  }

  function handleStartNewCompose() {
    resetPatternState()
    setMode('create')
    navigate('/drums/studio', { replace: true })
  }

  // Bar-by-bar editing (Compose mode)
  const [editingBar, setEditingBar] = useState(0)

  // Selected bar for individual bar view in AI/Scan modes (null = none selected)
  const [selectedBar, setSelectedBar] = useState<number | null>(null)

  // Extract a bar's pattern at its own resolution (downsampled from maxSub)
  function getBarPattern(barIndex: number): PatternData {
    const maxSub = subdivisions
    const barSub = barSubdivisions[barIndex] ?? maxSub
    const storageSlotsPerBar = timeSig[0] * maxSub
    const editSlotsPerBar = timeSig[0] * barSub
    const ratio = maxSub / barSub // always integer (LCM guarantees)
    const barStart = barIndex * storageSlotsPerBar
    const barTracks: Partial<Record<DrumPad, HitValue[]>> = {}

    for (const [pad, track] of Object.entries(pattern.tracks) as [DrumPad, HitValue[]][]) {
      const editTrack: HitValue[] = new Array(editSlotsPerBar).fill(0)
      for (let i = 0; i < editSlotsPerBar; i++) {
        editTrack[i] = (track[barStart + i * ratio] || 0) as HitValue
      }
      if (editTrack.some(v => v > 0)) barTracks[pad] = editTrack
    }

    return { beats: timeSig[0], subdivisions: barSub, tracks: barTracks }
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

  // Reset selected bar when bars count changes, clamp editingBar
  useEffect(() => {
    setSelectedBar(null)
    setEditingBar(prev => Math.min(prev, bars - 1))
  }, [bars])

  // Current bar's pattern for editing — always recompute (no memo to avoid staleness)
  const currentBarSub = barSubdivisions[editingBar] ?? subdivisions
  const editingBarPattern = getBarPattern(editingBar)



  // Write a single bar's changes back (upsampling from barSub to maxSub)
  function handleBarChange(barData: PatternData) {
    const maxSub = subdivisions
    const barSub = barSubdivisions[editingBar] ?? maxSub
    const ratio = maxSub / barSub
    const storageSlotsPerBar = timeSig[0] * maxSub
    const totalSlots = storageSlotsPerBar * bars
    const barStart = editingBar * storageSlotsPerBar

    const allPads = new Set([
      ...Object.keys(pattern.tracks) as DrumPad[],
      ...Object.keys(barData.tracks) as DrumPad[],
    ])
    const newTracks: Partial<Record<DrumPad, HitValue[]>> = {}
    for (const pad of allPads) {
      const full = new Array(totalSlots).fill(0) as HitValue[]
      const existing = pattern.tracks[pad]
      if (existing) for (let i = 0; i < Math.min(existing.length, totalSlots); i++) full[i] = existing[i]
      // Clear this bar's range in storage
      for (let i = barStart; i < barStart + storageSlotsPerBar; i++) full[i] = 0
      // Write bar data upsampled
      const barTrack = barData.tracks[pad]
      if (barTrack) {
        for (let i = 0; i < barTrack.length; i++) {
          full[barStart + i * ratio] = barTrack[i]
        }
      }
      if (full.some(v => v > 0)) newTracks[pad] = full
    }
    setPattern({ beats: timeSig[0], subdivisions: maxSub, tracks: newTracks })
  }

  // When AI builder generates a pattern, load it into the Create tab and auto-switch
  function handleAiPatternGenerated(
    aiPattern: PatternData,
    aiTitle: string,
    cfg: { bpm: number; bars: number; timeSig: [number, number]; difficulty: number; isAi: boolean; barSubdivisions?: number[] }
  ) {
    setPattern(aiPattern)
    setTitle(aiTitle)
    setBpm(cfg.bpm)
    setBars(cfg.bars)
    setTimeSig(cfg.timeSig)
    setBarSubdivisions(cfg.barSubdivisions ?? new Array(cfg.bars).fill(aiPattern.subdivisions))
    setSavedId(null)

    // Derive enabled pads from the generated pattern
    const padsInUse = Object.keys(aiPattern.tracks) as DrumPad[]
    const allPads = [...new Set([...DEFAULT_PADS, ...padsInUse])]
    setEnabledPads(allPads)

    // Auto-switch to compose mode for editing
    setMode('create')
  }

  if (loadingEdit) {
    return (
      <div className="p-8 text-center text-[#6b7280]">Loading pattern...</div>
    )
  }

  // AI Builder gets its own full-page layout (no Studio header/sidebar)
  if (mode === 'ai-builder') {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto" style={{ background: '#06080d', minHeight: '100vh' }}>
        <AiBuilderTab
          onPatternGenerated={handleAiPatternGenerated}
          onBack={() => setMode(null)}
        />
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto" style={{ background: '#06080d', minHeight: '100vh' }}>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* STUDIO LANDING — shown when no mode is selected              */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {mode === null ? (
        <div>
          {/* Keyframe animations */}
          <style>{`
            @keyframes drumOrb1 { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.14; } 50% { transform: translateY(-22px) scale(1.07); opacity: 0.22; } }
            @keyframes drumOrb2 { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.08; } 50% { transform: translateY(18px) scale(1.05); opacity: 0.14; } }
            @keyframes drumOrb3 { 0%, 100% { transform: translate(0,0) scale(1); opacity: 0.05; } 50% { transform: translate(-12px,-14px) scale(1.1); opacity: 0.09; } }
            @keyframes drumPulseRing { 0% { transform: scale(1); opacity: 0.12; } 100% { transform: scale(1.8); opacity: 0; } }
            @keyframes drumShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
          `}</style>

          {/* ── Immersive Hero Section ── */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-8 sm:mb-10" style={{
            background: 'linear-gradient(160deg, rgba(120,53,15,0.14) 0%, rgba(245,158,11,0.07) 25%, rgba(124,58,237,0.05) 50%, rgba(6,8,13,0.97) 85%)',
            border: '1px solid rgba(245,158,11,0.1)',
          }}>
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute w-[500px] h-[500px] rounded-full" style={{
                top: '-12%', left: '3%',
                background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 60%)',
                animation: 'drumOrb1 8s ease-in-out infinite',
              }} />
              <div className="absolute w-[400px] h-[400px] rounded-full" style={{
                bottom: '-25%', right: '8%',
                background: 'radial-gradient(circle, rgba(234,88,12,0.15) 0%, transparent 60%)',
                animation: 'drumOrb2 10s ease-in-out infinite',
              }} />
              <div className="absolute w-[280px] h-[280px] rounded-full" style={{
                top: '25%', right: '22%',
                background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 55%)',
                animation: 'drumOrb3 12s ease-in-out infinite',
              }} />
              {/* Subtle grid overlay */}
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: 'linear-gradient(rgba(245,158,11,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.4) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }} />
            </div>

            <div className="relative px-6 py-14 sm:py-18 md:py-22 lg:py-28 text-center">
              {/* Studio badge */}
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-8" style={{
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.18)',
                backdropFilter: 'blur(12px)',
              }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#f59e0b' }} />
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: '#f59e0b' }}>Drum Studio</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-5 leading-[1.05]">
                <span className="text-white">Create Your</span>
                <br />
                <span className="bg-clip-text text-transparent" style={{
                  backgroundImage: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 25%, #ea580c 50%, #f97316 75%, #fbbf24 100%)',
                  backgroundSize: '200% auto',
                  animation: 'drumShimmer 6s linear infinite',
                }}>
                  Groove
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-[#8b95a5] max-w-2xl mx-auto leading-relaxed">
                Three powerful ways to craft drum patterns — grid editor, AI generation, or scan from sheet music.
                <br className="hidden sm:block" />
                Build, save, and practice your rhythms.
              </p>
            </div>
          </div>

          {/* ── Three Creation Pathway Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-10">

            {/* Card 1: Compose */}
            <button onClick={handleStartNewCompose}
              className="group relative rounded-2xl overflow-hidden text-left transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 cursor-pointer focus:outline-none"
              style={{
                background: 'linear-gradient(180deg, rgba(245,158,11,0.1) 0%, rgba(234,88,12,0.04) 40%, rgba(6,8,13,0.95) 100%)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}>
              {/* Hover glow overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.2) 0%, transparent 65%)' }} />
              {/* Top accent line on hover */}
              <div className="absolute top-0 left-[10%] right-[10%] h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }} />

              <div className="relative pt-10 pb-6 flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    boxShadow: '0 0 40px -10px rgba(245,158,11,0.3)',
                  }}>
                    {/* Grid + Staff dual icon */}
                    <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
                      <rect x="3" y="4" width="7" height="7" rx="1.5" fill="#f59e0b" opacity="0.7"/>
                      <rect x="12" y="4" width="7" height="7" rx="1.5" fill="#f59e0b" opacity="0.4"/>
                      <rect x="3" y="13" width="7" height="7" rx="1.5" fill="#f59e0b" opacity="0.3"/>
                      <rect x="12" y="13" width="7" height="7" rx="1.5" fill="#f59e0b" opacity="0.6"/>
                      <line x1="24" y1="6" x2="37" y2="6" stroke="#fbbf24" strokeWidth="1" opacity="0.5"/>
                      <line x1="24" y1="10" x2="37" y2="10" stroke="#fbbf24" strokeWidth="1" opacity="0.5"/>
                      <line x1="24" y1="14" x2="37" y2="14" stroke="#fbbf24" strokeWidth="1" opacity="0.5"/>
                      <line x1="24" y1="18" x2="37" y2="18" stroke="#fbbf24" strokeWidth="1" opacity="0.5"/>
                      <line x1="24" y1="22" x2="37" y2="22" stroke="#fbbf24" strokeWidth="1" opacity="0.5"/>
                      <circle cx="28" cy="10" r="2" fill="#fbbf24" opacity="0.9"/>
                      <circle cx="33" cy="14" r="2" fill="#fbbf24" opacity="0.9"/>
                      <path d="M8 28l2 6h6l-5 3.5 2 6-5-3.5-5 3.5 2-6-5-3.5h6l2-6z" fill="#f59e0b" opacity="0.15"/>
                    </svg>
                  </div>
                  {/* Pulse ring */}
                  <div className="absolute inset-0 rounded-2xl" style={{ animation: 'drumPulseRing 3s ease-out infinite', background: '#f59e0b' }} />
                </div>
              </div>

              <div className="relative px-6 pb-8">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white">Compose</h3>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider" style={{
                    background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b',
                  }}>Create</span>
                </div>
                <p className="text-[13px] text-[#6b7280] mb-5 leading-relaxed">
                  Build patterns your way — use the grid editor or place notes directly on the staff notation.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Grid + Staff', '10 Instruments', 'Multi-bar', 'Any Time Sig'].map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-full text-[9px] font-semibold" style={{
                      background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', color: '#8b95a5',
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </button>

            {/* Card 2: AI Builder */}
            <button onClick={() => setMode('ai-builder')}
              className="group relative rounded-2xl overflow-hidden text-left transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 cursor-pointer focus:outline-none"
              style={{
                background: 'linear-gradient(180deg, rgba(124,58,237,0.1) 0%, rgba(139,92,246,0.04) 40%, rgba(6,8,13,0.95) 100%)',
                border: '1px solid rgba(124,58,237,0.15)',
              }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 65%)' }} />
              <div className="absolute top-0 left-[10%] right-[10%] h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, transparent)' }} />

              <div className="relative pt-10 pb-6 flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{
                    background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.2)',
                    boxShadow: '0 0 40px -10px rgba(124,58,237,0.3)',
                  }}>
                    {/* Stars/sparkles icon */}
                    <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
                      <path d="M20 4l3 9h9l-7.5 5.5 3 9L20 22l-7.5 5.5 3-9L8 13h9l3-9z" fill="#a78bfa" opacity="0.9"/>
                      <path d="M10 28l1.5 4.5h4.5l-3.5 2.5 1.5 4.5-3.5-2.5L7 39.5l1.5-4.5L5 32.5h4.5L10 28z" fill="#c4b5fd" opacity="0.5"/>
                      <path d="M32 22l1 3h3l-2.5 2 1 3-2.5-2-2.5 2 1-3L28 25h3l1-3z" fill="#c4b5fd" opacity="0.4"/>
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-2xl" style={{ animation: 'drumPulseRing 3s ease-out infinite 0.5s', background: '#7c3aed' }} />
                </div>
              </div>

              <div className="relative px-6 pb-8">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white">AI Builder</h3>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider" style={{
                    background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa',
                  }}>AI</span>
                </div>
                <p className="text-[13px] text-[#6b7280] mb-5 leading-relaxed">
                  Describe a style or groove and let Max generate a drum pattern tailored to your level.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Any Style', 'Auto-generate', 'Difficulty Levels', 'Edit After'].map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-full text-[9px] font-semibold" style={{
                      background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)', color: '#8b95a5',
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </button>

            {/* Card 3: Scan */}
            <button onClick={() => setMode('scan')}
              className="group relative rounded-2xl overflow-hidden text-left transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 cursor-pointer focus:outline-none"
              style={{
                background: 'linear-gradient(180deg, rgba(6,182,212,0.1) 0%, rgba(34,211,238,0.04) 40%, rgba(6,8,13,0.95) 100%)',
                border: '1px solid rgba(6,182,212,0.15)',
              }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.2) 0%, transparent 65%)' }} />
              <div className="absolute top-0 left-[10%] right-[10%] h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)' }} />

              <div className="relative pt-10 pb-6 flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{
                    background: 'rgba(6,182,212,0.1)',
                    border: '1px solid rgba(6,182,212,0.2)',
                    boxShadow: '0 0 40px -10px rgba(6,182,212,0.3)',
                  }}>
                    {/* Camera/scan icon */}
                    <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
                      <rect x="5" y="10" width="30" height="22" rx="4" fill="#06b6d4" opacity="0.15" stroke="#06b6d4" strokeWidth="1.5" strokeOpacity="0.4"/>
                      <circle cx="20" cy="21" r="7" fill="#06b6d4" opacity="0.2" stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.6"/>
                      <circle cx="20" cy="21" r="3.5" fill="#22d3ee" opacity="0.7"/>
                      <rect x="14" y="6" width="12" height="6" rx="2" fill="#06b6d4" opacity="0.3"/>
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-2xl" style={{ animation: 'drumPulseRing 3s ease-out infinite 1s', background: '#06b6d4' }} />
                </div>
              </div>

              <div className="relative px-6 pb-8">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white">Scan</h3>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider" style={{
                    background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee',
                  }}>Import</span>
                </div>
                <p className="text-[13px] text-[#6b7280] mb-5 leading-relaxed">
                  Take a photo of drum notation and let AI convert it into an editable pattern instantly.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Photo Import', 'Sheet Music', 'Auto-detect', 'Quick Convert'].map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-full text-[9px] font-semibold" style={{
                      background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)', color: '#8b95a5',
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </button>
          </div>

          {/* ── Recent Creations ── */}
          {myPatterns.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(6,8,13,0.8) 0%, rgba(10,12,18,0.9) 100%)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-[#4b5563] uppercase tracking-[0.15em]">Recent Creations</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{
                    background: 'rgba(245,158,11,0.08)', color: '#f59e0b',
                  }}>{myPatterns.length}</span>
                </div>
              </div>
              <div className="p-4 flex gap-3 overflow-x-auto">
                {myPatterns.slice(0, 8).map(ex => (
                  <button key={ex.id} onClick={() => navigate(`/drums/studio/${ex.id}`)}
                    className="flex-shrink-0 w-[180px] p-3.5 rounded-xl text-left transition-all hover:bg-white/[0.04] cursor-pointer group"
                    style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="text-[12px] font-semibold text-[#c4c9d4] truncate group-hover:text-white transition-colors">{ex.title}</div>
                    <div className="flex gap-2 mt-1.5 text-[9px] text-[#4b5563]">
                      <span>{(ex.timeSignature ?? [4,4]).join('/')}</span>
                      <span>{ex.bars ?? 1} bar{(ex.bars ?? 1) > 1 ? 's' : ''}</span>
                      <span>{ex.bpm} bpm</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : mode === 'create' ? (

      /* ═══════════════════════════════════════════════════════════════════════ */
      /* COMPOSE — full-page layout, bar-by-bar editing                        */
      /* ═══════════════════════════════════════════════════════════════════════ */
      <div className="space-y-4">
        <style>{`
          @keyframes composeGlow { 0%, 100% { opacity: 0.06; } 50% { opacity: 0.12; } }
          @keyframes barGridPop { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>

        {/* ═══ COMPOSE HEADER — immersive hero bar ═══ */}
        <div className="relative rounded-2xl overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(120,53,15,0.12) 0%, rgba(245,158,11,0.06) 30%, rgba(6,8,13,0.95) 70%)',
          border: '1px solid rgba(245,158,11,0.1)',
        }}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute w-[400px] h-[400px] rounded-full" style={{
              top: '-40%', right: '-5%',
              background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 60%)',
              animation: 'composeGlow 6s ease-in-out infinite',
            }} />
          </div>
          <div className="relative z-10 px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-4">
            <button onClick={() => { setMode(null); navigate('/drums/studio', { replace: true }) }}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/[0.06] cursor-pointer flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex-1 min-w-0">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Untitled pattern..."
                className="w-full text-xl sm:text-2xl font-extrabold text-white bg-transparent border-none outline-none placeholder:text-[#2d3748] truncate" />
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Tempo */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => setBpm(Math.max(40, bpm - 5))} className="w-6 h-6 rounded-lg bg-white/[0.06] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer transition-colors text-xs font-bold">-</button>
                <input type="number" min={40} max={240} value={bpm}
                  onChange={e => { const v = parseInt(e.target.value); if (v >= 40 && v <= 240) setBpm(v) }}
                  className="w-10 bg-transparent text-white text-sm font-mono text-center outline-none" />
                <button onClick={() => setBpm(Math.min(240, bpm + 5))} className="w-6 h-6 rounded-lg bg-white/[0.06] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer transition-colors text-xs font-bold">+</button>
                <span className="text-[9px] text-[#4b5a6a] ml-0.5">BPM</span>
              </div>
              {/* Time signature */}
              <div className="flex gap-1">
                {TIME_SIGNATURES.map(ts => (
                  <button key={ts.join('/')} onClick={() => handleTimeSigChange(ts)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      timeSig[0] === ts[0] && timeSig[1] === ts[1]
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        : 'bg-white/[0.04] border border-white/[0.06] text-[#4b5a6a] hover:text-white'
                    }`}>{ts[0]}/{ts[1]}</button>
                ))}
              </div>
              {/* Save button */}
              <button onClick={handleSave} disabled={saving || !title.trim() || !hasNotes}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  saving || !title.trim() || !hasNotes
                    ? 'bg-white/[0.04] text-[#374151] border border-white/[0.04] cursor-not-allowed'
                    : 'text-white hover:brightness-110'
                }`}
                style={saving || !title.trim() || !hasNotes ? undefined : { background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
                {saving ? (
                  <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Saving</>
                ) : saveSuccess ? (
                  <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Saved!</>
                ) : savedId ? 'Update' : 'Save'}
              </button>
              {savedId && (
                <Link to={`/drums/practice/play/studio:${savedId}`}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  Practice
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ═══ COLLAPSIBLE SETTINGS + INSTRUMENTS + BACKING TRACK ═══ */}
        <div className="rounded-2xl border border-white/[0.04] overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
        }}>
          <button onClick={() => setShowPatterns(!showPatterns)}
            className="w-full flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold text-[#4b5563] uppercase tracking-widest">Settings & Instruments</span>
              <div className="flex items-center gap-2 text-[9px] text-[#374151]">
                <span>{enabledPads.length} instruments</span>
                <span>•</span>
                <span>{backingFileName ? '🎵 ' + backingFileName : 'No backing track'}</span>
              </div>
            </div>
            <svg className={`w-4 h-4 text-[#4b5a6a] transition-transform ${showPatterns ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPatterns && (
            <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              {/* Instruments */}
              <div className="pt-3">
                <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-1.5 block">Instruments</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_PADS.map(({ pad, label, group }) => (
                    <button key={pad} onClick={() => togglePad(pad)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                        enabledPads.includes(pad)
                          ? group === 'cymbal'
                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'bg-white/[0.03] border border-white/[0.04] text-[#374151] hover:text-[#6b7280]'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>

              {/* Backing Track */}
              <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#4b5a6a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                    <span className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">Backing Track</span>
                  </div>
                  {!backingFileName ? (
                    <div className="flex items-center gap-2">
                      <input ref={backingInputRef} type="file" accept="audio/*" onChange={handleBackingUpload} className="hidden" id="backing-upload" />
                      <button onClick={() => backingInputRef.current?.click()} disabled={backingLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] border border-white/[0.06] text-[#6b7280] hover:text-amber-400 hover:border-amber-500/20 transition-colors cursor-pointer disabled:opacity-50">
                        {backingLoading ? (<><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Loading...</>
                        ) : (<><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> Upload Audio</>)}
                      </button>
                      <span className="text-[9px] text-[#374151]">MP3, WAV, OGG</span>
                    </div>
                  ) : backingLocked ? (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/[0.04] border border-amber-500/10">
                        {backingLoading ? (<svg className="w-3 h-3 text-amber-400/60 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        ) : (<svg className="w-3 h-3 text-amber-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>)}
                        <span className="text-[11px] text-amber-400/80 font-medium truncate max-w-[150px]">{backingFileName}</span>
                        {backingLoading ? (<span className="text-[9px] text-amber-400/50 animate-pulse">Loading...</span>) : (<><span className="text-[9px] text-[#4b5a6a]">{backingBpm} BPM</span>{backingSyncOffset !== 0 && <span className="text-[9px] text-[#4b5a6a]">offset {backingSyncOffset > 0 ? '+' : ''}{backingSyncOffset.toFixed(2)}s</span>}</>)}
                      </div>
                      <button onClick={() => setBackingLocked(false)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium bg-white/[0.03] border border-white/[0.04] text-[#4b5a6a] hover:text-amber-400 hover:border-amber-500/20 transition-colors cursor-pointer">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg> Edit
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/15">
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13" /></svg>
                        <span className="text-[11px] text-amber-400 font-medium truncate max-w-[150px]">{backingFileName}</span>
                        <button onClick={handleRemoveBacking} className="text-[#4b5563] hover:text-rose-400 transition-colors cursor-pointer p-0.5" title="Remove backing track">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5"><span className="text-[9px] text-[#4b5a6a] uppercase tracking-wider">Track BPM</span><input type="number" min={30} max={300} value={backingBpm} onChange={e => { const v = parseInt(e.target.value); if (v >= 30 && v <= 300) handleBackingBpmChange(v) }} className="w-14 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-xs text-center font-mono focus:outline-none focus:border-amber-500/30" /></div>
                      <div className="flex items-center gap-1.5"><span className="text-[9px] text-[#4b5a6a] uppercase tracking-wider">Vol</span><input type="range" min={0} max={100} value={Math.round(backingVol * 100)} onChange={e => { const v = parseInt(e.target.value) / 100; setBackingVol(v); setBackingVolume(v) }} className="w-16 h-1 rounded-full cursor-pointer" style={{ accentColor: '#f59e0b' }} /></div>
                      <button onClick={() => setBackingLocked(true)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium bg-white/[0.03] border border-white/[0.04] text-[#4b5a6a] hover:text-amber-400 hover:border-amber-500/20 transition-colors cursor-pointer"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Lock</button>
                      <span className="text-[9px] text-[#374151]">Syncs at {bpm} BPM ({bpm !== backingBpm ? `${(bpm / backingBpm * 100).toFixed(0)}% speed` : 'original speed'})</span>
                    </>
                  )}
                </div>

                {backingFileName && backingUrl && !backingLocked && (
                  <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <audio ref={audioPreviewRef} src={backingUrl} preload="auto"
                      onEnded={() => { setPreviewPlaying(false); cancelAnimationFrame(previewAnimRef.current); if (syncMode === 'listening') setSyncMode('idle') }}
                      onLoadedMetadata={e => setPreviewDuration((e.target as HTMLAudioElement).duration)} />
                    <div className="flex items-center gap-3">
                      <button onClick={handlePreviewToggle} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors bg-white/[0.06] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.1]">
                        {previewPlaying ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg> : <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                      </button>
                      <input type="range" min={0} max={previewDuration || 1} step={0.1} value={previewTime} onChange={e => handlePreviewSeek(parseFloat(e.target.value))} className="flex-1 h-1.5 rounded-full cursor-pointer" style={{ accentColor: '#f59e0b' }} />
                      <span className="font-mono text-[10px] text-[#6b7280] w-20 text-right flex-shrink-0">{formatTime(previewTime)} / {formatTime(previewDuration)}</span>
                    </div>
                    {syncMode === 'idle' && (<div className="flex flex-wrap items-center gap-3"><button onClick={handleStartTapSync} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/15 transition-colors cursor-pointer"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg> Tap to Sync</button><span className="text-[9px] text-[#374151]">Plays the song — tap when you hear the drum entry</span></div>)}
                    {syncMode === 'listening' && (<div className="flex items-center gap-3"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /><span className="text-[11px] text-[#c4c9d4]">Listening at <span className="font-mono text-amber-400">{formatTime(previewTime)}</span> — tap when drums start</span></div><button onClick={handleSyncTap} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-all hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}>TAP</button><button onClick={handleSyncCancel} className="text-[10px] text-[#4b5a6a] hover:text-rose-400 cursor-pointer">Cancel</button></div>)}
                    {syncMode === 'pick-bar' && (<div className="space-y-2"><div className="text-[11px] text-[#c4c9d4]">Tapped at <span className="font-mono text-amber-400">{formatTime(syncTapTime)}</span> — which bar aligns?</div><div className="flex gap-1.5 flex-wrap">{Array.from({ length: bars }).map((_, i) => (<button key={i} onClick={() => handleSyncPickBar(i)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-amber-400 hover:border-amber-500/25 cursor-pointer transition-colors">Bar {i + 1}</button>))}<button onClick={handleSyncCancel} className="px-3 py-1.5 rounded-lg text-xs text-[#4b5a6a] hover:text-rose-400 cursor-pointer">Cancel</button></div></div>)}
                    {syncMode === 'idle' && (<div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-1.5"><span className="text-[9px] text-[#4b5a6a] uppercase tracking-wider">Offset</span><button onClick={() => handleSyncOffsetChange(backingSyncOffset - 0.05)} className="w-5 h-5 rounded bg-white/[0.04] border border-white/[0.06] text-[#6b7280] hover:text-white flex items-center justify-center cursor-pointer text-[10px]">-</button><span className="font-mono text-[10px] text-white w-14 text-center">{backingSyncOffset >= 0 ? '+' : ''}{backingSyncOffset.toFixed(2)}s</span><button onClick={() => handleSyncOffsetChange(backingSyncOffset + 0.05)} className="w-5 h-5 rounded bg-white/[0.04] border border-white/[0.06] text-[#6b7280] hover:text-white flex items-center justify-center cursor-pointer text-[10px]">+</button></div><div className="flex items-center gap-1"><span className="text-[9px] text-[#374151]">Fine:</span>{[-10, -1, 1, 10].map(ms => (<button key={ms} onClick={() => handleSyncOffsetChange(backingSyncOffset + ms / 1000)} className="px-1.5 py-0.5 rounded text-[9px] bg-white/[0.03] border border-white/[0.04] text-[#4b5a6a] hover:text-white cursor-pointer">{ms > 0 ? '+' : ''}{ms}ms</button>))}</div>{backingSyncOffset !== 0 && (<button onClick={() => handleSyncOffsetChange(0)} className="text-[9px] text-[#374151] hover:text-rose-400 cursor-pointer">Reset</button>)}{backingSyncOffset !== 0 && (<span className="text-[9px] text-[#374151]">Song {formatTime(Math.max(0, backingSyncOffset))} = Bar 1</span>)}</div>)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ BAR NAVIGATOR — grid layout for large bar counts ═══ */}
        <div className="rounded-2xl p-4 sm:p-5 border border-white/[0.04]" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
        }}>
          {/* Top row: title, jump input, add/clear */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-semibold text-[#4b5563] uppercase tracking-widest">
              Bars <span className="text-amber-400/70 font-bold">{bars}</span>
            </span>
            <span className="text-[9px] text-[#374151]">Editing bar {editingBar + 1}</span>

            {/* Jump-to-bar input */}
            {bars > 8 && (
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[9px] text-[#4b5a6a]">Go to</span>
                <input type="number" min={1} max={bars}
                  placeholder="#"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const v = parseInt((e.target as HTMLInputElement).value)
                      if (v >= 1 && v <= bars) { setEditingBar(v - 1); (e.target as HTMLInputElement).value = '' }
                    }
                  }}
                  className="w-12 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-[10px] text-center font-mono focus:outline-none focus:border-amber-500/30 placeholder:text-[#2d3748]"
                />
              </div>
            )}

            {/* Prev / Next buttons */}
            <div className="flex items-center gap-1">
              <button onClick={() => setEditingBar(Math.max(0, editingBar - 1))} disabled={editingBar === 0}
                className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => setEditingBar(Math.min(bars - 1, editingBar + 1))} disabled={editingBar === bars - 1}
                className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="w-px h-5 bg-white/[0.06]" />

            <button onClick={() => { handleBarsChange(bars + 1); setEditingBar(bars) }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer bg-white/[0.04] border border-dashed border-white/[0.08] text-[#4b5a6a] hover:text-amber-400 hover:border-amber-500/25">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Bar
            </button>
            <button onClick={handleClear}
              className="text-[10px] px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#4b5a6a] hover:text-rose-400 transition-colors cursor-pointer">
              Clear All
            </button>
          </div>

          {/* Bar grid — wrapping tiles for easy navigation with many bars */}
          <div className="flex flex-wrap gap-1" style={{ maxHeight: bars > 64 ? '240px' : undefined, overflowY: bars > 64 ? 'auto' : undefined }}>
            {Array.from({ length: bars }).map((_, i) => {
              const bp = getBarPattern(i)
              const has = Object.values(bp.tracks).some(t => t.some(v => v > 0))
              const bSub = barSubdivisions[i] ?? 4
              const subInfo = SUBDIVISIONS.find(s => s.value === bSub)
              const isDragOver = dragBarRef.current !== null && dragBarRef.current !== i
              const isActive = editingBar === i
              // Color for resolution indicator
              const resColors: Record<number, string> = { 1: '#22c55e', 2: '#3b82f6', 3: '#f59e0b', 4: '#ef4444' }
              return (
                <div key={i} className="relative"
                  style={{ animation: `barGridPop 0.15s ease-out ${Math.min(i * 0.01, 0.5)}s both` }}
                  draggable
                  onDragStart={() => { dragBarRef.current = i }}
                  onDragEnd={() => { dragBarRef.current = null }}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                  onDrop={e => { e.preventDefault(); if (dragBarRef.current !== null) { handleMoveBar(dragBarRef.current, i); dragBarRef.current = null } }}
                >
                  <button onClick={() => setEditingBar(i)}
                    className={`w-12 h-10 rounded-lg text-[10px] font-bold transition-all cursor-grab active:cursor-grabbing flex flex-col items-center justify-center gap-0 relative overflow-hidden ${
                      isActive
                        ? 'text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                        : has
                          ? 'text-[#c4c9d4] border-white/[0.08] hover:border-amber-500/20 hover:text-white'
                          : 'text-[#374151] border-white/[0.04] hover:text-[#6b7280] hover:border-white/[0.08]'
                    } ${isDragOver ? 'ring-1 ring-amber-500/40' : ''}`}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.08))'
                        : has ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${isActive ? 'rgba(245,158,11,0.4)' : has ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                    }}>
                    {/* Resolution indicator line at top */}
                    <div className="absolute top-0 left-1 right-1 h-[2px] rounded-full" style={{
                      background: resColors[bSub] || '#3b82f6',
                      opacity: isActive ? 0.8 : 0.3,
                    }} />
                    <span>{i + 1}</span>
                    {has && <span className="w-1 h-1 rounded-full bg-amber-400/60 absolute bottom-1 right-1" />}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Per-bar controls: resolution + duplicate + delete */}
          <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-[10px] text-amber-400 font-bold">Bar {editingBar + 1}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-[#4b5a6a]">Resolution</span>
              {SUBDIVISIONS.map(s => (
                <button key={s.value} onClick={() => handleBarResolutionChange(s.value)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                    (barSubdivisions[editingBar] ?? 4) === s.value
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      : 'bg-white/[0.03] border border-white/[0.04] text-[#4b5a6a] hover:text-white'
                  }`}>{s.label}</button>
              ))}
            </div>
            <div className="w-px h-4 bg-white/[0.06]" />
            <button onClick={() => handleDuplicateBar(editingBar)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer bg-white/[0.03] border border-white/[0.04] text-[#4b5a6a] hover:text-amber-400 hover:border-amber-500/20"
              title="Duplicate this bar">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" /></svg>
              Duplicate
            </button>
            <button onClick={() => handleDeleteBar(editingBar)} disabled={bars <= 1}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer bg-white/[0.03] border border-white/[0.04] text-[#4b5a6a] hover:text-rose-400 hover:border-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Delete this bar">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete
            </button>
          </div>
        </div>

        {/* ── Staff Notation Editor ── */}
        <div className="rounded-2xl p-5 border border-white/[0.06]" style={{
          background: 'linear-gradient(135deg, rgba(20,22,30,0.95) 0%, rgba(24,26,36,0.98) 100%)',
        }}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-[#6b7280]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><line x1="2" y1="3" x2="14" y2="3"/><line x1="2" y1="6" x2="14" y2="6"/><line x1="2" y1="9" x2="14" y2="9"/><line x1="2" y1="12" x2="14" y2="12"/><circle cx="5" cy="6" r="1.5" fill="currentColor"/><circle cx="10" cy="9" r="1.5" fill="currentColor"/></svg>
            <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">Staff Notation</span>
            <span className="text-[9px] text-[#374151]">Bar {editingBar + 1}</span>
          </div>
          <NotationInput
            key={`notation-${editingBar}-${currentBarSub}`}
            pattern={editingBarPattern}
            enabledPads={enabledPads}
            bars={1}
            onChange={handleBarChange}
          />
        </div>

        {/* ── Grid Editor ── */}
        <div className="rounded-2xl p-5 border border-white/[0.06]" style={{
          background: 'linear-gradient(135deg, rgba(20,22,30,0.95) 0%, rgba(24,26,36,0.98) 100%)',
        }}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-[#6b7280]" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1" opacity="0.7"/><rect x="9" y="1" width="6" height="6" rx="1" opacity="0.4"/><rect x="1" y="9" width="6" height="6" rx="1" opacity="0.4"/><rect x="9" y="9" width="6" height="6" rx="1" opacity="0.7"/></svg>
            <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">Grid Editor</span>
            <span className="text-[9px] text-[#374151]">Bar {editingBar + 1}</span>
          </div>
          <EditableGrid
            key={`grid-${editingBar}-${currentBarSub}`}
            pattern={editingBarPattern}
            enabledPads={enabledPads}
            bars={1}
            onChange={handleBarChange}
          />
        </div>

        {/* ── Full Pattern Preview ── */}
        {hasNotes && (
          <div className="rounded-2xl p-5 border border-white/[0.04]" style={{
            background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
          }}>
            <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-3">
              Full Pattern Preview <span className="text-[#374151] font-normal">({bars} bar{bars > 1 ? 's' : ''})</span>
            </div>
            <StaffNotationDisplay
              pattern={fullPattern}
              bpm={bpm}
              bars={1}
              beatsPerBar={timeSig[0]}
              onBpmChange={setBpm}
              barSubdivisions={barSubdivisions}
            />
          </div>
        )}
      </div>

      ) : (<>

      {/* Header */}
      <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(15,12,8,0.9) 0%, rgba(10,14,22,0.9) 50%, rgba(15,12,8,0.8) 100%)',
      }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
        }} />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)',
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => setMode(null)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/[0.06] cursor-pointer"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Studio<span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">.</span>
              </h1>
            </div>
          </div>
          <p className="text-[#6b7280] text-sm sm:text-base lg:text-lg max-w-xl ml-[52px]">
            Build drum patterns using the grid editor or notation staff. Preview, save, and practice your grooves.
          </p>
          {/* Mode tabs */}
          <div className="flex gap-2 mt-4">
            {([
              { id: 'create' as StudioMode, label: 'Compose', icon: '🎹', ready: true },
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
                    onClick={() => navigate(`/drums/studio/${ex.id}`)}
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

          {/* ═══ Scan mode ═══ */}
          {mode === 'scan' && (
            <ScanTab onPatternGenerated={handleAiPatternGenerated} />
          )}

          {/* ═══ Scan: save prompt when pattern generated ═══ */}
          {mode === 'scan' && hasNotes && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setMode('create') }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/15 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                Edit & Save in Compose
              </button>
              <span className="text-[11px] text-[#4b5563]">Switch to Compose mode to edit the grid, name it, and save</span>
            </div>
          )}
        </div>
      </div>
      </>)}
    </div>
  )
}
