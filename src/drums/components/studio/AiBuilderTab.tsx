import { useState, useCallback, useMemo } from 'react'
import { PatternData, HitValue } from '@drums/types/curriculum'
import { DrumPad } from '@drums/types/midi'
import {
  ExerciseConfig, InstrumentSet, NoteValueSet,
  generateExercise,
} from '@drums/services/notationExerciseGenerator'
import { useAiStore } from '@shared/stores/useAiStore'
import { aiService } from '@drums/services/aiService'

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractJson(text: string): any | null {
  try { return JSON.parse(text.trim()) } catch {}
  const start = text.indexOf('{')
  if (start === -1) return null
  for (let end = text.lastIndexOf('}'); end > start; end = text.lastIndexOf('}', end - 1)) {
    try { return JSON.parse(text.substring(start, end + 1)) } catch { continue }
  }
  return null
}

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b) }
function lcm(a: number, b: number): number { return (a * b) / gcd(a, b) }
function lcmArray(arr: number[]): number { return arr.reduce((a, b) => lcm(a, b), 1) }

// ── Data ─────────────────────────────────────────────────────────────────────

const GENRES: { id: string; label: string; icon: string; color: string; prompt: string; desc: string }[] = [
  { id: 'rock', label: 'Rock', icon: '🎸', color: '#ef4444', prompt: 'Standard rock groove with driving kick and snare backbeat, steady hi-hat eighths', desc: 'Driving backbeat grooves' },
  { id: 'funk', label: 'Funk', icon: '🎷', color: '#f97316', prompt: 'Funky groove with ghost notes on snare, syncopated kick, tight hi-hat with occasional open accents', desc: 'Ghost notes & syncopation' },
  { id: 'jazz', label: 'Jazz', icon: '🎺', color: '#eab308', prompt: 'Jazz swing feel with ride cymbal timekeeping, cross-stick snare comping, kick feathering on all 4 beats', desc: 'Swing feel & ride patterns' },
  { id: 'latin', label: 'Latin', icon: '🪘', color: '#22c55e', prompt: 'Latin rhythm with tumbao bass pattern, cascara on ride or hi-hat, strong clave-based feel', desc: 'Clave-based rhythms' },
  { id: 'metal', label: 'Metal', icon: '🤘', color: '#64748b', prompt: 'Heavy double kick pattern with fast hi-hat or ride, powerful snare hits, aggressive dynamics', desc: 'Double kick intensity' },
  { id: 'hiphop', label: 'Hip-Hop', icon: '🎤', color: '#8b5cf6', prompt: 'Laid-back hip-hop beat with boom-bap feel, open hi-hat accents, slightly behind the beat kick', desc: 'Boom-bap & trap feels' },
  { id: 'shuffle', label: 'Shuffle', icon: '🔀', color: '#06b6d4', prompt: 'Blues shuffle with triplet feel on hi-hat, walking bass drum, snare on 2 and 4', desc: 'Triplet-based swing' },
  { id: 'reggae', label: 'Reggae', icon: '🏝️', color: '#10b981', prompt: 'One drop reggae groove — kick on 2 and 4, cross-stick, hi-hat on offbeats, spacious feel', desc: 'One drop & offbeat' },
  { id: 'afrobeat', label: 'Afrobeat', icon: '🌍', color: '#f59e0b', prompt: 'Afrobeat groove with 12/8 feel layered over 4/4, open hi-hat accents, syncopated kick pattern inspired by Tony Allen', desc: '12/8 polyrhythmic feel' },
  { id: 'gospel', label: 'Gospel', icon: '🎵', color: '#ec4899', prompt: 'Gospel chops with linear patterns, ghost notes cascading across the kit, dynamic snare/kick interplay', desc: 'Linear chops & fills' },
  { id: 'dnb', label: 'Drum & Bass', icon: '⚡', color: '#7c3aed', prompt: 'Drum and bass breakbeat pattern at high tempo with syncopated snare, fast hi-hats, rolling kick pattern', desc: 'Breakbeat & fast rolls' },
  { id: 'prog', label: 'Progressive', icon: '🌀', color: '#0ea5e9', prompt: 'Progressive rock/metal pattern with odd time signature feel, dynamic shifts, creative use of toms and cymbals', desc: 'Odd times & complexity' },
  { id: 'country', label: 'Country', icon: '🤠', color: '#d97706', prompt: 'Country two-step or train beat with steady kick on 1 and 3, snare on 2 and 4, ride bell or closed hi-hat', desc: 'Train beat & two-step' },
  { id: 'world', label: 'World', icon: '🥁', color: '#14b8a6', prompt: 'World percussion groove blending tom patterns with hi-hat/ride, polyrhythmic layers, minimal kick', desc: 'Tom-heavy polyrhythms' },
]

const INSTRUMENT_INFO: { key: keyof InstrumentSet; pad: string; label: string; group: 'cymbal' | 'drum'; icon: string }[] = [
  { key: 'hihatClosed', pad: 'hihat_closed', label: 'Hi-Hat', group: 'cymbal', icon: '🔔' },
  { key: 'hihatOpen', pad: 'hihat_open', label: 'HH Open', group: 'cymbal', icon: '🔕' },
  { key: 'ride', pad: 'ride', label: 'Ride', group: 'cymbal', icon: '🥇' },
  { key: 'crash', pad: 'crash', label: 'Crash', group: 'cymbal', icon: '💥' },
  { key: 'hihatPedal', pad: 'hihat_pedal', label: 'HH Pedal', group: 'cymbal', icon: '🦶' },
  { key: 'snare', pad: 'snare', label: 'Snare', group: 'drum', icon: '🪘' },
  { key: 'kick', pad: 'kick', label: 'Kick', group: 'drum', icon: '🦵' },
  { key: 'tom1', pad: 'tom1', label: 'Tom 1', group: 'drum', icon: '🥁' },
  { key: 'tom2', pad: 'tom2', label: 'Tom 2', group: 'drum', icon: '🥁' },
  { key: 'floorTom', pad: 'floor_tom', label: 'Floor Tom', group: 'drum', icon: '🥁' },
]

const RESOLUTIONS: { value: number; label: string; shortLabel: string; color: string }[] = [
  { value: 1, label: 'Quarter Notes', shortLabel: '♩', color: '#22c55e' },
  { value: 2, label: 'Eighth Notes', shortLabel: '♪', color: '#3b82f6' },
  { value: 3, label: 'Triplets', shortLabel: '³', color: '#f59e0b' },
  { value: 4, label: 'Sixteenth Notes', shortLabel: '𝅘𝅥𝅯', color: '#ef4444' },
]

const TIME_SIGNATURES: [number, number][] = [[4, 4], [3, 4], [6, 8], [5, 4], [7, 8]]

const CONCEPTS: { key: 'includeRests' | 'includeSyncopation' | 'includeDynamics'; label: string; desc: string; icon: string }[] = [
  { key: 'includeRests', label: 'Rests', desc: 'Intentional gaps to count through', icon: '⏸' },
  { key: 'includeSyncopation', label: 'Syncopation', desc: 'Offbeat accents & "e" / "a" hits', icon: '⚡' },
  { key: 'includeDynamics', label: 'Dynamics', desc: 'Accents (>) and ghost notes (o)', icon: '📊' },
]

const KIT_PRESETS: { label: string; pads: (keyof InstrumentSet)[] }[] = [
  { label: 'Minimal', pads: ['kick', 'snare', 'hihatClosed'] },
  { label: 'Standard', pads: ['kick', 'snare', 'hihatClosed', 'hihatOpen', 'crash'] },
  { label: 'Full Kit', pads: ['kick', 'snare', 'hihatClosed', 'hihatOpen', 'ride', 'crash', 'tom1', 'tom2', 'floorTom'] },
  { label: 'Jazz Kit', pads: ['kick', 'snare', 'ride', 'hihatClosed', 'hihatPedal'] },
]

function diffColor(d: number): string {
  if (d <= 3) return '#22c55e'
  if (d <= 6) return '#eab308'
  return '#ef4444'
}

function diffLabel(d: number): string {
  if (d <= 2) return 'Beginner'
  if (d <= 4) return 'Easy'
  if (d <= 6) return 'Intermediate'
  if (d <= 8) return 'Advanced'
  return 'Expert'
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  onPatternGenerated: (pattern: PatternData, title: string, config: {
    bpm: number; bars: number; timeSig: [number, number]; difficulty: number; isAi: boolean;
    barSubdivisions: number[]
  }) => void
  onBack: () => void
}

export default function AiBuilderTab({ onPatternGenerated, onBack }: Props) {
  // Genre & style
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')

  // Structure
  const [bars, setBars] = useState(4)
  const [bpm, setBpm] = useState(100)
  const [timeSig, setTimeSig] = useState<[number, number]>([4, 4])
  const [difficulty, setDifficulty] = useState(5)

  // Per-bar resolution
  const [barSubdivisions, setBarSubdivisions] = useState<number[]>([2, 2, 2, 2])
  const [aiDecideResolution, setAiDecideResolution] = useState(true)
  const [allowedResolutions, setAllowedResolutions] = useState<Record<number, boolean>>({
    1: true,   // quarter
    2: true,   // eighth
    3: false,  // triplet (disabled by default)
    4: true,   // sixteenth
  })

  // Instruments
  const [instruments, setInstruments] = useState<InstrumentSet>({
    kick: true, snare: true, hihatClosed: true, hihatOpen: false,
    ride: false, crash: false, tom1: false, tom2: false, floorTom: false, hihatPedal: false,
  })

  // Concepts
  const [includeRests, setIncludeRests] = useState(false)
  const [includeSyncopation, setIncludeSyncopation] = useState(false)
  const [includeDynamics, setIncludeDynamics] = useState(false)

  // Generation state
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { isConfigured, apiKey } = useAiStore()

  // Enabled resolutions list for AI mode
  const enabledResolutions = RESOLUTIONS.filter(r => allowedResolutions[r.value])

  // Ensure barSubdivisions length matches bars
  function handleBarsChange(newBars: number) {
    const clamped = Math.max(1, Math.min(32, newBars))
    setBars(clamped)
    setBarSubdivisions(prev => {
      if (clamped > prev.length) return [...prev, ...new Array(clamped - prev.length).fill(2)]
      return prev.slice(0, clamped)
    })
  }

  function handleBarResolution(barIdx: number, res: number) {
    setBarSubdivisions(prev => {
      const next = [...prev]
      next[barIdx] = res
      return next
    })
  }

  function setAllBarsResolution(res: number) {
    setBarSubdivisions(new Array(bars).fill(res))
  }

  function toggleInstrument(key: keyof InstrumentSet) {
    setInstruments(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function applyKitPreset(pads: (keyof InstrumentSet)[]) {
    const newInst: InstrumentSet = {
      kick: false, snare: false, hihatClosed: false, hihatOpen: false,
      ride: false, crash: false, tom1: false, tom2: false, floorTom: false, hihatPedal: false,
    }
    for (const p of pads) newInst[p] = true
    setInstruments(newInst)
  }

  function applyGenre(genre: typeof GENRES[number]) {
    setSelectedGenre(genre.id)
    setCustomPrompt(genre.prompt)
  }

  // Compute the LCM resolution for storage
  const maxSub = useMemo(() => lcmArray(barSubdivisions), [barSubdivisions])

  // Effective bar subdivisions for prompt: if AI decides, use max allowed; otherwise use manual
  const effectiveBarSubs = aiDecideResolution
    ? new Array(bars).fill(Math.max(...enabledResolutions.map(r => r.value), 2))
    : barSubdivisions

  const effectiveMaxSub = useMemo(() => lcmArray(effectiveBarSubs), [effectiveBarSubs])

  // Build the AI-ready config (for algorithmic fallback)
  function buildConfig(): ExerciseConfig {
    const noteValues: NoteValueSet = {
      whole: false, half: false,
      quarter: effectiveMaxSub >= 1,
      eighth: effectiveMaxSub >= 2,
      triplet: effectiveBarSubs.includes(3),
      sixteenth: effectiveMaxSub >= 4,
    }
    return {
      noteValues,
      includeRests,
      includeSyncopation,
      includeDynamics,
      instruments,
      timeSignature: timeSig,
      bars,
      bpm,
      difficulty,
      aiPrompt: customPrompt || undefined,
    }
  }

  // ── Build a purpose-built, musically rich prompt ──
  function buildFullPrompt(): string {
    const beats = timeSig[0]
    const slotsPerBar = beats * effectiveMaxSub
    const totalSlots = slotsPerBar * bars

    const enabledInstruments = Object.entries(instruments).filter(([, v]) => v).map(([k]) => k)
    const padKeyMap: Record<string, string> = {
      kick: 'kick', snare: 'snare', hihatClosed: 'hihat_closed',
      hihatOpen: 'hihat_open', ride: 'ride', crash: 'crash',
      tom1: 'tom1', tom2: 'tom2', floorTom: 'floor_tom', hihatPedal: 'hihat_pedal',
    }

    // Genre context
    const genre = selectedGenre ? GENRES.find(g => g.id === selectedGenre) : null
    const genreSection = genre
      ? `\n## Style: ${genre.label}\n${genre.prompt}\nEmbrace this style fully — the groove must FEEL like authentic ${genre.label}. Think of iconic ${genre.label} drummers and their signature patterns.`
      : ''

    // Difficulty guide with concrete musical examples
    let diffGuide: string
    if (difficulty <= 2) {
      diffGuide = `BEGINNER (${difficulty}/10): Keep it VERY simple.
- Hi-hat: steady on every beat or every eighth note, all normal hits
- Kick: beats 1 and 3 only
- Snare: beats 2 and 4 only (classic backbeat)
- NO syncopation, NO ghost notes, NO offbeat kicks
- Example groove (8ths, 4/4): HH: [1,1,1,1,1,1,1,1] K: [1,0,0,0,1,0,0,0] S: [0,0,0,0,1,0,0,0] (with snare on beat 3 in a simple pattern)`
    } else if (difficulty <= 4) {
      diffGuide = `EASY (${difficulty}/10): Basic but musical.
- Hi-hat: steady eighth notes throughout
- Kick: on beat 1, sometimes beat 3, occasional "and" of 2 or 4
- Snare: solid on 2 and 4, maybe a pickup note before beat 1 in last bar
- Minimal variation — the groove should be steady and predictable
- Example: Rock beat with kick on 1 and "and-of-2", snare on 2 and 4`
    } else if (difficulty <= 6) {
      diffGuide = `INTERMEDIATE (${difficulty}/10): Groovy and interesting.
- Hi-hat: can mix closed/open, maybe 16th-note bursts
- Kick: syncopated patterns — "and" of beats, displaced patterns
- Snare: backbeat with ghost notes between main hits (e.g., ghost on the "e" and "a" before beat 2)
- Add musical variation: bars 1-2 establish the groove, bar 3 slight variation, bar 4 a small fill
- Think Garibaldi (funk), Copeland (police), Bonham (Zeppelin) — musical complexity without chaos`
    } else if (difficulty <= 8) {
      diffGuide = `ADVANCED (${difficulty}/10): Complex, expressive drumming.
- Dense ghost note patterns on snare (value 3), accented notes (value 2) for dynamics
- Kick: highly syncopated, 16th-note displacement, not just on downbeats
- Hi-hat: open/closed interplay, pedal work if enabled
- Linear patterns (no two limbs hitting at the same slot) work well here
- Tom fills in the final bar or transitional bars
- Think Porcaro (Rosanna), Dennis Chambers, Jojo Mayer — total control`
    } else {
      diffGuide = `EXPERT (${difficulty}/10): Virtuosic drumming.
- Maximum independence: kick, snare, and hi-hat all doing different syncopated patterns
- Ghost note cascades (3,3,1,3,3 type patterns on snare)
- Polyrhythmic feels, displaced accents, metric modulation vibes
- 16th-note kick patterns with syncopation throughout
- Every bar should have content that challenges reading AND playing
- Think Vinnie Colaiuta, Chris Dave, Mark Guiliana — boundary-pushing`
    }

    // Instrument role descriptions
    const instrumentRoles: string[] = []
    if (instruments.kick) instrumentRoles.push(`"kick": Bass drum — the rhythmic foundation. In rock: 1 and 3. In funk: syncopated 16th patterns. In jazz: feathered quarter notes. NEVER leave kick empty in any bar.`)
    if (instruments.snare) instrumentRoles.push(`"snare": Backbeat and expression. Main hits on 2 and 4 (most styles). Ghost notes (3) between main hits add groove. Accents (2) on main backbeats.${includeDynamics ? ' USE ghost notes (3) liberally between backbeats for groove depth.' : ''}`)
    if (instruments.hihatClosed) instrumentRoles.push(`"hihat_closed": Timekeeping — the pulse the listener locks onto. Must be CONSISTENT throughout — typically steady 8ths or 16ths. When hi-hat open is also enabled, close the hi-hat on beats where open is NOT playing.`)
    if (instruments.hihatOpen) instrumentRoles.push(`"hihat_open": Color/accent — use on specific "and" beats for emphasis. In the same slot as an open hi-hat, the closed hi-hat should be 0. Typical placement: "and" of 2 or "and" of 4.`)
    if (instruments.ride) instrumentRoles.push(`"ride": Alternative timekeeping. Jazz: quarter notes or swing pattern. Rock: can replace hi-hat for chorus/bridge. Bell hits (accent 2) on downbeats.`)
    if (instruments.crash) instrumentRoles.push(`"crash": ONLY on beat 1 of bar 1 (paired with kick), or the downbeat of the last bar for a fill ending. Maximum 1-2 crash hits in the entire pattern. Do NOT use as timekeeping.`)
    if (instruments.tom1) instrumentRoles.push(`"tom1": High tom — fills only. Typically descending runs: tom1→tom2→floor_tom. Keep empty except in fill bars.`)
    if (instruments.tom2) instrumentRoles.push(`"tom2": Mid tom — used in fills alongside tom1. Tom-based grooves only in world/fusion styles.`)
    if (instruments.floorTom) instrumentRoles.push(`"floor_tom": Low tom — end of fill descents, or occasional groove accent in place of kick.`)
    if (instruments.hihatPedal) instrumentRoles.push(`"hihat_pedal": Hi-hat foot — plays on beats 2 and 4 while hands play ride. Jazz/funk independence.`)

    // Per-bar resolution section
    let resolutionSection = ''
    const resLabels: Record<number, string> = { 1: 'quarter', 2: 'eighth', 3: 'triplet', 4: 'sixteenth' }
    const resSlotLabels: Record<number, string> = { 1: '1 slot/beat', 2: '2 slots/beat', 3: '3 slots/beat', 4: '4 slots/beat' }

    if (aiDecideResolution) {
      const allowedList = enabledResolutions.map(r => `"${resLabels[r.value]}" (${r.value})`).join(', ')
      resolutionSection = `
## Per-Bar Resolution (YOU DECIDE)
Choose the best resolution for each bar from: ${allowedList}
Your response MUST include a "barResolutions" array with ${bars} numbers, one per bar.
Each number must be one of: ${enabledResolutions.map(r => r.value).join(', ')}

Musical guidelines for resolution choice:
- Use QUARTER (1) for simple, spacious grooves — half-time feels, sparse patterns
- Use EIGHTH (2) for standard grooves — rock, pop, most styles. This is the most common.
- Use TRIPLET (3) for shuffle, swing, 12/8 feels, jazz — gives that "bounce"
- Use SIXTEENTH (4) for dense, busy bars — fills, funk, double-time, ghost note patterns

Create a musical arc: maybe simpler resolution for groove bars and denser resolution for fill/climax bars.
The grid uses a SINGLE resolution for the whole pattern (the LCM of all bar resolutions), so if you choose bars with resolution 2 and 4, the grid will be 4 slots/beat for ALL bars. In "quarter" bars, only place hits on slots [0, 4, 8, 12...] (every 4th). In "eighth" bars, only on [0, 2, 4, 6...] (every 2nd). In "sixteenth" bars, any slot is fair game.`
    } else {
      const hasVaryingRes = new Set(barSubdivisions).size > 1
      if (hasVaryingRes) {
        const barResInfo = barSubdivisions.map((sub, i) =>
          `  Bar ${i + 1}: ${resLabels[sub] || 'eighth'} (${resSlotLabels[sub] || '2 slots/beat'})`
        ).join('\n')
        resolutionSection = `
## Per-Bar Resolution (FIXED)
The user has set specific resolutions:
${barResInfo}

The grid has ${effectiveMaxSub} slots per beat (LCM of all bar resolutions).
- In quarter-resolution bars: only use slots at multiples of ${effectiveMaxSub} within each beat
- In eighth-resolution bars: only use slots at multiples of ${effectiveMaxSub / 2}
- In triplet-resolution bars: only use slots at multiples of ${effectiveMaxSub / 3}
- In sixteenth-resolution bars: use any slot`
      } else {
        const sub = barSubdivisions[0] || 2
        resolutionSection = `
## Resolution
All bars use ${resLabels[sub]} note resolution (${sub} slots per beat, ${slotsPerBar} slots per bar, ${totalSlots} total).`
      }
    }

    // Concepts
    const conceptNotes: string[] = []
    if (includeRests) conceptNotes.push('RESTS: Include intentional rests — NOT every beat needs a hit. Space creates groove. A rest on beat 3 can make a kick pattern feel syncopated.')
    if (includeSyncopation) conceptNotes.push('SYNCOPATION: Place hits on offbeats — the "and", "e", and "a" subdivisions. Displace expected hits to create rhythmic tension. The kick or snare should have syncopated elements.')
    if (includeDynamics) conceptNotes.push('DYNAMICS: Use the FULL value range. Ghost notes (3) should be scattered between main hits for texture. Accents (2) on backbeats and specific emphasis points. A snare pattern like [0,3,3,0,2,0,3,0] has far more groove than [0,0,0,0,1,0,0,0].')
    if (!includeDynamics) conceptNotes.push('DYNAMICS OFF: Only use values 0 (rest) and 1 (hit). No accents (2) or ghost notes (3).')

    // Slot position guide for the AI
    const slotGuide = Array.from({ length: slotsPerBar }, (_, i) => {
      const beat = Math.floor(i / effectiveMaxSub) + 1
      const subPos = i % effectiveMaxSub
      let label = `Beat ${beat}`
      if (effectiveMaxSub === 2) label += subPos === 0 ? '' : ' &'
      else if (effectiveMaxSub === 3) label += subPos === 0 ? '' : subPos === 1 ? ' trip' : ' let'
      else if (effectiveMaxSub === 4) label += subPos === 0 ? '' : subPos === 1 ? ' e' : subPos === 2 ? ' &' : ' a'
      return `${i}: ${label}`
    }).join(', ')

    // Template showing bar boundaries
    const barTemplate = enabledInstruments.map(i => {
      const key = padKeyMap[i] || i
      const barSlots = Array.from({ length: bars }, () =>
        Array(slotsPerBar).fill('0').join(',')
      ).join(', ')
      return `    "${key}": [${barSlots}]`
    }).join(',\n')

    return `You are a world-class session drummer and drum pattern programmer. Generate a drum pattern that sounds MUSICAL, GROOVY, and AUTHENTIC — like something from a real recording, not random data.

## CRITICAL RULES FOR GOOD MUSIC
1. **TIMEKEEPING IS SACRED**: The cymbal pattern (hi-hat or ride) must be CONSISTENT and STEADY throughout ALL bars. It's the backbone. Listeners lock onto it. Never leave it sparse or random.
2. **KICK + SNARE = THE GROOVE**: These two together define the feel. They must interlock musically. The kick provides the low-end pulse, the snare the backbeat. Together they should make you nod your head.
3. **EVERY BAR MUST GROOVE**: Don't front-load content in bar 1 and leave the rest empty. The groove must flow through ALL ${bars} bars.
4. **VARIATION WITH PURPOSE**: If you have ${bars} bars, create a 2-bar or 4-bar phrase. Bars 1-2 (or 1-3): main groove. Final bar: subtle variation or short fill for musical interest. The variation should be SMALL — change 1-2 kicks, add a ghost note, not a completely different pattern.
5. **FILLS ARE SHORT**: A fill is 1-2 beats at most (typically the last beat of the last bar), not an entire bar of random tom hits.
${genreSection}

## Parameters
- Time signature: ${timeSig[0]}/${timeSig[1]}
- Tempo: ${bpm} BPM
- Length: ${bars} bar${bars > 1 ? 's' : ''}
- Beats per bar: ${beats}
- Grid: ${effectiveMaxSub} slots per beat = ${slotsPerBar} slots per bar = ${totalSlots} total slots
- Slot positions in one bar: ${slotGuide}

## Difficulty
${diffGuide}
${resolutionSection}

## Instruments (ONLY use these JSON keys)
${instrumentRoles.join('\n')}

## Musical Concepts
${conceptNotes.length > 0 ? conceptNotes.join('\n') : 'Standard groove — normal hits only.'}

## Values
- 0 = rest/silence
- 1 = normal hit
${includeDynamics ? '- 2 = accent (louder, emphasized)\n- 3 = ghost note (quiet, subtle texture)' : '- Do NOT use 2 or 3'}
${customPrompt ? `\n## Additional Instructions\n${customPrompt}` : ''}

## Output Format
Return ONLY valid JSON — no markdown, no explanation, no text before or after.
Each instrument array must have EXACTLY ${totalSlots} values.
Bars are concatenated: slots [0..${slotsPerBar - 1}] = bar 1, [${slotsPerBar}..${slotsPerBar * 2 - 1}] = bar 2, etc.

{
  "title": "creative 3-6 word title describing the groove feel",${aiDecideResolution ? `\n  "barResolutions": [array of ${bars} numbers, one per bar, from ${enabledResolutions.map(r => r.value).join('/')}],` : ''}
  "tracks": {
${barTemplate}
  }
}`
  }

  // Generation
  const generateAlgorithmic = useCallback(() => {
    const config = buildConfig()
    const seed = Math.floor(Math.random() * 999999)
    const p = generateExercise(config, seed)
    setError(null)
    onPatternGenerated(p, `Pattern #${seed % 1000}`, {
      bpm, bars, timeSig, difficulty, isAi: false,
      barSubdivisions: aiDecideResolution ? effectiveBarSubs : barSubdivisions,
    })
  }, [bars, bpm, timeSig, difficulty, barSubdivisions, effectiveBarSubs, aiDecideResolution, instruments, includeRests, includeSyncopation, includeDynamics, customPrompt, effectiveMaxSub])

  async function generateWithAi() {
    if (!isConfigured || !apiKey) {
      generateAlgorithmic()
      return
    }
    setAiLoading(true)
    setError(null)
    try {
      aiService.setApiKey(apiKey)
      const prompt = buildFullPrompt()
      const text = await aiService.generateExercise(prompt)

      const parsed = extractJson(text)
      if (!parsed) throw new Error('AI returned no valid JSON')

      // Parse AI-decided bar resolutions if applicable
      let finalBarSubs = aiDecideResolution ? effectiveBarSubs : barSubdivisions
      if (aiDecideResolution && Array.isArray(parsed.barResolutions) && parsed.barResolutions.length === bars) {
        const allowedVals = enabledResolutions.map(r => r.value)
        const defaultRes = allowedVals.includes(2) ? 2 : allowedVals[0] || 2
        finalBarSubs = (parsed.barResolutions as number[]).map(v =>
          allowedVals.includes(v) ? v : defaultRes
        )
      }
      const finalMaxSub = lcmArray(finalBarSubs)

      const beats = timeSig[0]
      const totalSlots = beats * finalMaxSub * bars

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
          const arr = (values as number[]).slice(0, totalSlots).map(v =>
            Math.min(3, Math.max(0, v))
          ) as HitValue[]
          while (arr.length < totalSlots) arr.push(0)
          tracks[padId as DrumPad] = arr
        }
      }

      const aiPattern: PatternData = { beats, subdivisions: finalMaxSub, tracks }
      const title = parsed.title || 'AI Groove'
      onPatternGenerated(aiPattern, title, {
        bpm, bars, timeSig, difficulty, isAi: true, barSubdivisions: finalBarSubs,
      })
    } catch (e: any) {
      console.error('AI generation failed:', e)
      setError(e.message || 'AI generation failed — falling back to algorithmic')
      generateAlgorithmic()
    }
    setAiLoading(false)
  }

  const enabledCount = Object.values(instruments).filter(Boolean).length

  return (
    <div className="min-h-screen" style={{ background: '#06080d' }}>
      {/* Keyframe animations */}
      <style>{`
        @keyframes aiOrb1 { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.12; } 50% { transform: translateY(-30px) scale(1.08); opacity: 0.2; } }
        @keyframes aiOrb2 { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.06; } 50% { transform: translateY(20px) scale(1.06); opacity: 0.12; } }
        @keyframes aiOrb3 { 0%, 100% { transform: translate(0,0) scale(1); opacity: 0.04; } 50% { transform: translate(-15px,-18px) scale(1.12); opacity: 0.08; } }
        @keyframes aiShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes aiPulse { 0%, 100% { box-shadow: 0 0 30px -8px rgba(124,58,237,0.3); } 50% { box-shadow: 0 0 50px -4px rgba(124,58,237,0.5); } }
        @keyframes aiFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes barChipPop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO HEADER                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-8" style={{
        background: 'linear-gradient(160deg, rgba(88,28,185,0.15) 0%, rgba(124,58,237,0.08) 25%, rgba(168,85,247,0.04) 50%, rgba(6,8,13,0.97) 85%)',
        border: '1px solid rgba(124,58,237,0.12)',
      }}>
        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full" style={{
            top: '-15%', right: '-8%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)',
            animation: 'aiOrb1 8s ease-in-out infinite',
          }} />
          <div className="absolute w-[400px] h-[400px] rounded-full" style={{
            bottom: '-20%', left: '-5%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, rgba(124,58,237,0.03) 50%, transparent 70%)',
            animation: 'aiOrb2 10s ease-in-out infinite 2s',
          }} />
          <div className="absolute w-[300px] h-[300px] rounded-full" style={{
            top: '30%', left: '40%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 60%)',
            animation: 'aiOrb3 12s ease-in-out infinite 4s',
          }} />
        </div>

        <div className="relative z-10 px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={onBack}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/[0.06] cursor-pointer"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight" style={{
                background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 30%, #7c3aed 60%, #f59e0b 100%)',
                backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
                backgroundSize: '200% 100%', animation: 'aiShimmer 6s ease-in-out infinite',
              }}>
                AI Builder
              </h1>
            </div>
          </div>
          <p className="text-[#8b95a5] text-sm sm:text-base lg:text-lg max-w-2xl ml-[52px]">
            Describe your groove and let AI craft the perfect drum pattern. Set the style, complexity, kit, and structure — then fine-tune every bar.
          </p>
          {!isConfigured && (
            <div className="ml-[52px] mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#f59e0b',
            }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              No API key — will use algorithmic generation. Add key in Settings for AI.
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CONFIGURATION SECTIONS                                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-5 sm:space-y-6" style={{ animation: 'aiFadeIn 0.5s ease-out' }}>

        {/* ── Section 1: Genre & Style ── */}
        <section className="rounded-2xl p-5 sm:p-6 border border-white/[0.04]" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
        }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{
              background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
            }}>🎶</div>
            <div>
              <h2 className="text-sm font-bold text-white">Genre & Style</h2>
              <p className="text-[10px] text-[#4b5a6a]">Choose a musical style to shape the AI's output</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
            {GENRES.map(g => (
              <button key={g.id} onClick={() => applyGenre(g)}
                className={`group relative rounded-xl p-3 text-left transition-all duration-200 cursor-pointer ${
                  selectedGenre === g.id
                    ? 'ring-1 scale-[1.02]'
                    : 'hover:scale-[1.02]'
                }`}
                style={{
                  background: selectedGenre === g.id
                    ? `linear-gradient(135deg, ${g.color}15, ${g.color}08)`
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selectedGenre === g.id ? g.color + '40' : 'rgba(255,255,255,0.04)'}`,
                  boxShadow: selectedGenre === g.id ? `0 0 12px -4px ${g.color}40` : undefined,
                }}>
                <div className="text-lg mb-1">{g.icon}</div>
                <div className="text-xs font-semibold text-white">{g.label}</div>
                <div className="text-[9px] text-[#4b5a6a] mt-0.5 leading-tight">{g.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Section 2: Structure (Bars, Tempo, Time Sig) ── */}
        <section className="rounded-2xl p-5 sm:p-6 border border-white/[0.04]" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
        }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
            }}>📐</div>
            <div>
              <h2 className="text-sm font-bold text-white">Structure</h2>
              <p className="text-[10px] text-[#4b5a6a]">Define the rhythmic framework</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Bars */}
            <div>
              <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-2 block font-semibold">
                Bars <span className="text-white font-bold ml-1">{bars}</span>
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={32} value={bars}
                  onChange={e => handleBarsChange(parseInt(e.target.value))}
                  className="flex-1 accent-violet-500 cursor-pointer h-2" />
                <input type="number" min={1} max={32} value={bars}
                  onChange={e => handleBarsChange(parseInt(e.target.value) || 1)}
                  className="w-14 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-violet-500/40"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 4, 8, 16].map(b => (
                  <button key={b} onClick={() => handleBarsChange(b)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      bars === b
                        ? 'bg-violet-500/15 text-violet-400 border-violet-500/25'
                        : 'bg-white/[0.03] border-white/[0.06] text-[#4b5a6a] hover:text-white'
                    }`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Tempo */}
            <div>
              <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-2 block font-semibold">
                Tempo <span className="text-white font-bold ml-1">{bpm} BPM</span>
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min={40} max={220} value={bpm}
                  onChange={e => setBpm(parseInt(e.target.value))}
                  className="flex-1 accent-violet-500 cursor-pointer h-2" />
                <input type="number" min={40} max={220} value={bpm}
                  onChange={e => setBpm(Math.max(40, Math.min(220, parseInt(e.target.value) || 40)))}
                  className="w-14 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-violet-500/40"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[60, 80, 100, 120, 140, 180].map(t => (
                  <button key={t} onClick={() => setBpm(t)}
                    className={`text-[10px] px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                      bpm === t
                        ? 'bg-violet-500/15 text-violet-400 border-violet-500/25'
                        : 'bg-white/[0.03] border-white/[0.06] text-[#4b5a6a] hover:text-white'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Signature */}
            <div>
              <label className="text-[10px] text-[#4b5a6a] uppercase tracking-wider mb-2 block font-semibold">
                Time Signature
              </label>
              <div className="flex gap-2 flex-wrap">
                {TIME_SIGNATURES.map(ts => (
                  <button key={ts.join('/')} onClick={() => setTimeSig(ts)}
                    className={`text-sm px-4 py-2.5 rounded-xl border transition-all cursor-pointer font-mono font-bold ${
                      timeSig[0] === ts[0] && timeSig[1] === ts[1]
                        ? 'bg-violet-500/15 text-violet-400 border-violet-500/25 shadow-[0_0_15px_-4px_rgba(124,58,237,0.3)]'
                        : 'bg-white/[0.03] border-white/[0.06] text-[#6b7280] hover:text-white hover:bg-white/[0.05]'
                    }`}>
                    {ts[0]}/{ts[1]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: Per-Bar Resolution ── */}
        <section className="rounded-2xl p-5 sm:p-6 border border-white/[0.04]" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
              }}>🎼</div>
              <div>
                <h2 className="text-sm font-bold text-white">Per-Bar Resolution</h2>
                <p className="text-[10px] text-[#4b5a6a]">Control the rhythmic density of each bar</p>
              </div>
            </div>
            {/* AI decides toggle */}
            <button onClick={() => setAiDecideResolution(!aiDecideResolution)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                aiDecideResolution
                  ? 'bg-violet-500/15 text-violet-400 border-violet-500/25'
                  : 'bg-white/[0.03] border-white/[0.06] text-[#6b7280] hover:text-white'
              }`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              AI Decides
            </button>
          </div>

          {/* Allowed resolutions (shown when AI decides) */}
          {aiDecideResolution && (
            <div className="mb-4 p-3 rounded-xl border border-violet-500/10 bg-violet-500/[0.03]">
              <div className="text-[10px] text-violet-400/80 font-semibold uppercase tracking-wider mb-2">
                Allowed resolutions for AI
              </div>
              <div className="flex gap-2">
                {RESOLUTIONS.map(r => (
                  <button key={r.value}
                    onClick={() => {
                      // Don't allow disabling all resolutions
                      const newAllowed = { ...allowedResolutions, [r.value]: !allowedResolutions[r.value] }
                      if (Object.values(newAllowed).some(Boolean)) setAllowedResolutions(newAllowed)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                      allowedResolutions[r.value]
                        ? 'border-opacity-40 text-white'
                        : 'border-white/[0.06] text-[#374151] opacity-50 hover:opacity-70'
                    }`}
                    style={{
                      background: allowedResolutions[r.value] ? `${r.color}15` : 'rgba(255,255,255,0.02)',
                      borderColor: allowedResolutions[r.value] ? `${r.color}40` : undefined,
                    }}>
                    <span className="text-sm font-bold" style={{ color: allowedResolutions[r.value] ? r.color : undefined }}>{r.shortLabel}</span>
                    <span className="text-[10px]">{r.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-[#4b5a6a] mt-2">
                AI will pick the best resolution per bar from the enabled options to create musical variety.
              </p>
            </div>
          )}

          {/* Manual bar chips (shown when NOT AI decides) */}
          {!aiDecideResolution && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#4b5a6a]">Click each bar to cycle resolution, or set all:</span>
                <div className="flex gap-1.5">
                  {RESOLUTIONS.map(r => (
                    <button key={r.value} onClick={() => setAllBarsResolution(r.value)}
                      className="text-[9px] px-2 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-[#6b7280] hover:text-white transition-colors cursor-pointer"
                      title={`Set all bars to ${r.label}`}>
                      All {r.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {barSubdivisions.map((sub, idx) => {
                  const res = RESOLUTIONS.find(r => r.value === sub) || RESOLUTIONS[1]
                  return (
                    <div key={idx} className="group relative" style={{ animation: `barChipPop 0.2s ease-out ${idx * 0.02}s both` }}>
                      <button
                        onClick={() => {
                          const currentIdx = RESOLUTIONS.findIndex(r => r.value === sub)
                          const nextIdx = (currentIdx + 1) % RESOLUTIONS.length
                          handleBarResolution(idx, RESOLUTIONS[nextIdx].value)
                        }}
                        className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border transition-all cursor-pointer hover:scale-105"
                        style={{
                          background: `${res.color}10`,
                          borderColor: `${res.color}30`,
                        }}
                        title={`Bar ${idx + 1}: ${res.label} — click to cycle`}
                      >
                        <span className="text-[8px] text-[#4b5a6a] font-medium">{idx + 1}</span>
                        <span className="text-sm font-bold" style={{ color: res.color }}>{res.shortLabel}</span>
                      </button>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none group-hover:pointer-events-auto">
                        <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-1 flex gap-0.5 shadow-xl mt-1">
                          {RESOLUTIONS.map(r => (
                            <button key={r.value} onClick={(e) => { e.stopPropagation(); handleBarResolution(idx, r.value) }}
                              className={`text-[9px] px-1.5 py-1 rounded transition-colors cursor-pointer ${
                                sub === r.value ? 'text-white font-bold' : 'text-[#6b7280] hover:text-white'
                              }`}
                              style={{ background: sub === r.value ? `${r.color}20` : undefined }}>
                              {r.shortLabel}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Legend */}
          <div className="flex gap-3 mt-3">
            {RESOLUTIONS.map(r => (
              <div key={r.value} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                <span className="text-[9px] text-[#4b5a6a]">{r.shortLabel} {r.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 4: Difficulty ── */}
        <section className="rounded-2xl p-5 sm:p-6 border border-white/[0.04]" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
        }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{
              background: `${diffColor(difficulty)}15`, border: `1px solid ${diffColor(difficulty)}30`,
            }}>🎯</div>
            <div>
              <h2 className="text-sm font-bold text-white">Difficulty</h2>
              <p className="text-[10px] text-[#4b5a6a]">Controls pattern complexity, density, and musical vocabulary</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-2xl font-black font-mono" style={{ color: diffColor(difficulty) }}>{difficulty}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: diffColor(difficulty) }}>
                {diffLabel(difficulty)}
              </span>
            </div>
          </div>

          <div className="relative">
            <input type="range" min={1} max={10} value={difficulty}
              onChange={e => setDifficulty(parseInt(e.target.value))}
              className="w-full h-3 cursor-pointer accent-violet-500" />
            <div className="flex justify-between mt-1">
              {Array.from({ length: 10 }, (_, i) => (
                <button key={i} onClick={() => setDifficulty(i + 1)}
                  className="w-6 h-6 rounded-full text-[9px] font-bold transition-all cursor-pointer flex items-center justify-center"
                  style={{
                    background: i + 1 === difficulty ? diffColor(difficulty) + '30' : 'transparent',
                    color: i + 1 <= difficulty ? diffColor(difficulty) : '#374151',
                  }}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Concepts */}
          <div className="flex gap-2 mt-4">
            {CONCEPTS.map(c => {
              const checked = c.key === 'includeRests' ? includeRests : c.key === 'includeSyncopation' ? includeSyncopation : includeDynamics
              const toggle = c.key === 'includeRests' ? setIncludeRests : c.key === 'includeSyncopation' ? setIncludeSyncopation : setIncludeDynamics
              return (
                <button key={c.key} onClick={() => toggle(!checked)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                    checked
                      ? 'bg-violet-500/10 border-violet-500/25 text-violet-300'
                      : 'bg-white/[0.02] border-white/[0.06] text-[#4b5a6a] hover:text-white hover:bg-white/[0.04]'
                  }`}>
                  <span className="text-sm">{c.icon}</span>
                  <div className="text-left">
                    <div className="text-xs font-semibold">{c.label}</div>
                    <div className="text-[8px] opacity-60">{c.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Section 5: Kit Builder ── */}
        <section className="rounded-2xl p-5 sm:p-6 border border-white/[0.04]" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{
                background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
              }}>🥁</div>
              <div>
                <h2 className="text-sm font-bold text-white">Kit Builder</h2>
                <p className="text-[10px] text-[#4b5a6a]">
                  Select instruments — <span className="text-white font-medium">{enabledCount}</span> active
                </p>
              </div>
            </div>
            {/* Presets */}
            <div className="flex gap-1.5">
              {KIT_PRESETS.map(kp => (
                <button key={kp.label} onClick={() => applyKitPreset(kp.pads)}
                  className="text-[10px] px-2.5 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-[#6b7280] hover:text-white transition-colors cursor-pointer">
                  {kp.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Cymbals */}
            <div>
              <div className="text-[9px] text-cyan-400/60 uppercase tracking-wider font-semibold mb-2">Cymbals</div>
              <div className="space-y-1.5">
                {INSTRUMENT_INFO.filter(i => i.group === 'cymbal').map(inst => (
                  <button key={inst.key} onClick={() => toggleInstrument(inst.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all cursor-pointer text-left ${
                      instruments[inst.key]
                        ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
                        : 'bg-white/[0.02] border-white/[0.04] text-[#374151] hover:text-[#6b7280] hover:bg-white/[0.03]'
                    }`}>
                    <span className="text-base">{inst.icon}</span>
                    <span className="text-xs font-medium">{inst.label}</span>
                    {instruments[inst.key] && (
                      <svg className="w-3.5 h-3.5 ml-auto text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {/* Drums */}
            <div>
              <div className="text-[9px] text-amber-400/60 uppercase tracking-wider font-semibold mb-2">Drums</div>
              <div className="space-y-1.5">
                {INSTRUMENT_INFO.filter(i => i.group === 'drum').map(inst => (
                  <button key={inst.key} onClick={() => toggleInstrument(inst.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all cursor-pointer text-left ${
                      instruments[inst.key]
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                        : 'bg-white/[0.02] border-white/[0.04] text-[#374151] hover:text-[#6b7280] hover:bg-white/[0.03]'
                    }`}>
                    <span className="text-base">{inst.icon}</span>
                    <span className="text-xs font-medium">{inst.label}</span>
                    {instruments[inst.key] && (
                      <svg className="w-3.5 h-3.5 ml-auto text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 6: AI Instructions (collapsible advanced) ── */}
        <section className="rounded-2xl p-5 sm:p-6 border border-white/[0.04]" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
        }}>
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
              }}>💬</div>
              <div className="text-left">
                <h2 className="text-sm font-bold text-white">Custom Instructions</h2>
                <p className="text-[10px] text-[#4b5a6a]">Add specific directions for the AI (optional)</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-[#4b5a6a] transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-3" style={{ animation: 'aiFadeIn 0.3s ease-out' }}>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="e.g., 'Add a four-on-the-floor kick pattern with syncopated ghost notes on snare, building intensity through the bars...'"
                rows={3}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-[#2d3748] focus:outline-none focus:border-violet-500/30 transition-colors resize-none"
              />
              {selectedGenre && (
                <div className="text-[10px] text-[#4b5a6a]">
                  <span className="text-violet-400 font-medium">
                    {GENRES.find(g => g.id === selectedGenre)?.label}
                  </span> style context will be combined with your instructions.
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Error ── */}
        {error && (
          <div className="rounded-xl p-3 border border-rose-500/15 bg-rose-500/[0.04] text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* GENERATE BUTTON                                                      */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={generateWithAi}
            disabled={aiLoading || enabledCount === 0}
            className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold text-base transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #581c87, #7c3aed, #a855f7)',
              boxShadow: '0 8px 40px -8px rgba(124,58,237,0.5)',
              animation: aiLoading ? undefined : 'aiPulse 3s ease-in-out infinite',
            }}
          >
            {aiLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating your groove...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                {isConfigured ? 'Generate with AI' : 'Generate Pattern'}
              </>
            )}
          </button>
          <button
            onClick={generateAlgorithmic}
            disabled={aiLoading || enabledCount === 0}
            className="px-6 py-4 rounded-2xl text-sm font-medium bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🎲 Shuffle
          </button>
        </div>

        {/* Config summary bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3 border-t border-white/[0.06]" style={{
          background: 'linear-gradient(180deg, rgba(6,8,13,0.95) 0%, rgba(6,8,13,0.99) 100%)',
          backdropFilter: 'blur(12px)',
        }}>
          <div className="max-w-[1800px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] text-[#4b5a6a]">
              {selectedGenre && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{
                  background: `${GENRES.find(g => g.id === selectedGenre)?.color}10`,
                  border: `1px solid ${GENRES.find(g => g.id === selectedGenre)?.color}25`,
                  color: GENRES.find(g => g.id === selectedGenre)?.color,
                }}>
                  {GENRES.find(g => g.id === selectedGenre)?.icon} {GENRES.find(g => g.id === selectedGenre)?.label}
                </span>
              )}
              <span>{bars} bar{bars > 1 ? 's' : ''}</span>
              <span>{bpm} BPM</span>
              <span>{timeSig[0]}/{timeSig[1]}</span>
              <span style={{ color: diffColor(difficulty) }}>Lvl {difficulty}</span>
              <span>{enabledCount} instruments</span>
              {aiDecideResolution ? (
                <span className="text-violet-400">AI resolution</span>
              ) : new Set(barSubdivisions).size > 1 ? (
                <span className="text-blue-400">Mixed resolution</span>
              ) : null}
            </div>
            <button
              onClick={generateWithAi}
              disabled={aiLoading || enabledCount === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
            >
              {aiLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              )}
              Generate
            </button>
          </div>
        </div>

        {/* Bottom spacer for fixed bar */}
        <div className="h-16" />
      </div>
    </div>
  )
}
