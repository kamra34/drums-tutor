/**
 * Converts drum PatternData to MusicXML for rendering with OSMD.
 *
 * Single-voice drum notation (all stems up) — the standard for professional
 * drum charts. Beamed per beat. Short patterns get repeat bar lines.
 */

import { PatternData, HitValue } from '@drums/types/curriculum'
import { DrumPad } from '@drums/types/midi'

// ── Drum pad → MusicXML staff position ──────────────────────────────────────

interface DrumXmlMapping {
  instrumentId: string
  instrumentName: string
  midiUnpitched: number
  displayStep: string
  displayOctave: number
  notehead: 'x' | 'normal' | 'diamond' | 'circle-x'
}

const DRUM_MAP: Partial<Record<DrumPad, DrumXmlMapping>> = {
  [DrumPad.CrashCymbal]: { instrumentId: 'I-CR', instrumentName: 'Crash Cymbal',  midiUnpitched: 49, displayStep: 'A', displayOctave: 5, notehead: 'x' },
  [DrumPad.HiHatOpen]:   { instrumentId: 'I-HO', instrumentName: 'Open Hi-Hat',   midiUnpitched: 46, displayStep: 'G', displayOctave: 5, notehead: 'circle-x' },
  [DrumPad.HiHatClosed]: { instrumentId: 'I-HH', instrumentName: 'Closed Hi-Hat', midiUnpitched: 42, displayStep: 'G', displayOctave: 5, notehead: 'x' },
  [DrumPad.RideCymbal]:  { instrumentId: 'I-RD', instrumentName: 'Ride Cymbal',   midiUnpitched: 51, displayStep: 'F', displayOctave: 5, notehead: 'x' },
  [DrumPad.RideBell]:    { instrumentId: 'I-RB', instrumentName: 'Ride Bell',     midiUnpitched: 53, displayStep: 'F', displayOctave: 5, notehead: 'diamond' },
  [DrumPad.Tom1]:        { instrumentId: 'I-T1', instrumentName: 'High Tom',      midiUnpitched: 48, displayStep: 'E', displayOctave: 5, notehead: 'normal' },
  [DrumPad.Tom2]:        { instrumentId: 'I-T2', instrumentName: 'Mid Tom',       midiUnpitched: 45, displayStep: 'D', displayOctave: 5, notehead: 'normal' },
  [DrumPad.Snare]:       { instrumentId: 'I-SN', instrumentName: 'Snare Drum',    midiUnpitched: 38, displayStep: 'C', displayOctave: 5, notehead: 'normal' },
  [DrumPad.SnareRim]:    { instrumentId: 'I-SR', instrumentName: 'Snare Rim',     midiUnpitched: 37, displayStep: 'C', displayOctave: 5, notehead: 'x' },
  [DrumPad.FloorTom]:    { instrumentId: 'I-FT', instrumentName: 'Floor Tom',     midiUnpitched: 41, displayStep: 'A', displayOctave: 4, notehead: 'normal' },
  [DrumPad.Kick]:        { instrumentId: 'I-BD', instrumentName: 'Bass Drum',     midiUnpitched: 36, displayStep: 'F', displayOctave: 4, notehead: 'normal' },
  [DrumPad.HiHatPedal]:  { instrumentId: 'I-HP', instrumentName: 'Hi-Hat Pedal',  midiUnpitched: 44, displayStep: 'D', displayOctave: 4, notehead: 'x' },
}

function noteTypeForSub(sub: number): string {
  if (sub >= 4) return '16th'
  if (sub >= 2) return 'eighth'
  return 'quarter'
}

// ── Main converter ───────────────────────────────────────────────────────────

export interface MusicXmlResult {
  xml: string
  /** Absolute slot index where each MusicXML note starts (in order). Length = total MusicXML notes. */
  noteSlots: number[]
}

export function patternToMusicXml(
  pattern: PatternData,
  beatsPerBar?: number,
  title?: string,
  barSubdivisions?: number[],
): MusicXmlResult {
  const { beats, subdivisions, tracks } = pattern
  const bpb = beatsPerBar ?? beats
  const slotsPerBar = bpb * subdivisions
  const totalSlots = beats * subdivisions
  const numBars = Math.ceil(totalSlots / slotsPerBar)
  const divisions = subdivisions
  const noteType = noteTypeForSub(subdivisions)
  const isTriplet = subdivisions === 3

  // Track which absolute slot each MusicXML note corresponds to
  const noteSlots: number[] = []

  // Which pads are used?
  const usedPads = (Object.keys(tracks) as DrumPad[]).filter(
    pad => DRUM_MAP[pad] && tracks[pad]?.some(v => v > 0)
  )

  // Instrument definitions
  const scoreInstruments = usedPads.map(p => {
    const m = DRUM_MAP[p]!
    return `      <score-instrument id="${m.instrumentId}"><instrument-name>${m.instrumentName}</instrument-name></score-instrument>`
  }).join('\n')
  const midiInstruments = usedPads.map(p => {
    const m = DRUM_MAP[p]!
    return `      <midi-instrument id="${m.instrumentId}"><midi-channel>10</midi-channel><midi-program>1</midi-program><midi-unpitched>${m.midiUnpitched}</midi-unpitched></midi-instrument>`
  }).join('\n')

  const measures: string[] = []

  for (let bar = 0; bar < numBars; bar++) {
    const barStart = bar * slotsPerBar
    let xml = ''

    // First measure: attributes
    if (bar === 0) {
      xml += `\n      <attributes><divisions>${divisions}</divisions><time><beats>${bpb}</beats><beat-type>4</beat-type></time><clef><sign>percussion</sign></clef></attributes>`
    }

    // Force a new line every 4 bars
    if (bar > 0 && bar % 4 === 0) {
      xml += `\n      <print new-system="yes"/>`
    }

    // Collect hits per slot
    let hasAnyHit = false
    const slotHits: { pad: DrumPad; hv: HitValue }[][] = []
    for (let s = 0; s < slotsPerBar; s++) {
      const abs = barStart + s
      const hits: { pad: DrumPad; hv: HitValue }[] = []
      for (const pad of usedPads) {
        const hv = (tracks[pad]?.[abs] ?? 0) as HitValue
        if (hv > 0) hits.push({ pad, hv })
      }
      slotHits.push(hits)
      if (hits.length > 0) hasAnyHit = true
    }

    // Empty bar → one quarter rest per beat
    // Add invisible direction to prevent OSMD from consolidating consecutive rest bars
    if (!hasAnyHit) {
      xml += `\n      <direction><direction-type><words font-size="0"> </words></direction-type></direction>`
      for (let b = 0; b < bpb; b++) {
        noteSlots.push(barStart + b * subdivisions)
        xml += `\n      <note><rest/><duration>${subdivisions}</duration><voice>1</voice><type>quarter</type></note>`
      }
    } else {
      // Per-beat adaptive step detection
      // Uses authoritative barSubdivisions when available, falls back to GCD
      function _gcd(a: number, b: number): number { return b === 0 ? a : _gcd(b, a % b) }

      function beatMinStep(beatStart: number): number {
        // If we have per-bar subdivision info, use it (authoritative)
        if (barSubdivisions && barSubdivisions.length > 0) {
          const barIdx = Math.floor((barStart + beatStart) / slotsPerBar)
          const barSub = barSubdivisions[barIdx] ?? subdivisions
          return subdivisions / barSub // e.g., maxSub=6, barSub=3 → step=2
        }
        // Fallback: GCD of hit positions
        let hitGcd = 0
        for (let s = 1; s < subdivisions; s++) {
          if ((beatStart + s) < slotsPerBar && slotHits[beatStart + s]?.length > 0) {
            hitGcd = hitGcd === 0 ? s : _gcd(hitGcd, s)
          }
        }
        return hitGcd === 0 ? subdivisions : hitGcd
      }

      function noteTypeForStep(step: number): string {
        if (step >= subdivisions) return 'quarter'
        if (step * 2 >= subdivisions) return 'eighth'
        return noteType
      }

      const beamMap = buildBeamMap(slotHits, subdivisions, slotsPerBar)
      let restAccum = 0
      let restStartSlot = 0

      for (let beatIdx = 0; beatIdx < slotsPerBar / subdivisions; beatIdx++) {
        const beatStart = beatIdx * subdivisions
        const step = beatMinStep(beatStart)

        if (step >= subdivisions) {
          // Quarter note — one note for the whole beat
          const hits = slotHits[beatStart]
          if (hits.length === 0) {
            if (restAccum === 0) restStartSlot = barStart + beatStart
            restAccum += subdivisions
          } else {
            if (restAccum > 0) {
              const restNotes = Math.ceil(restAccum / subdivisions)
              for (let r = 0; r < restNotes; r++) noteSlots.push(restStartSlot + r * subdivisions)
              xml += writeRests(restAccum, subdivisions, noteType)
              restAccum = 0
            }
            noteSlots.push(barStart + beatStart)
            xml += writeHits(hits, subdivisions, 'quarter', false, '')
          }
        } else {
          // Sub-beat resolution at the detected step size
          const stepNoteType = noteTypeForStep(step)
          const beatIsTriplet = subdivisions % 3 === 0 && step === subdivisions / 3

          // Collect note positions within this beat for inline beam generation
          const beatNotePositions: number[] = []
          for (let s = beatStart; s < beatStart + subdivisions; s += step) {
            if (slotHits[s]?.length > 0) beatNotePositions.push(s)
          }

          // Flush any accumulated rests before this beat
          if (restAccum > 0) {
            while (restAccum >= subdivisions) {
              noteSlots.push(restStartSlot)
              xml += `\n      <note><rest/><duration>${subdivisions}</duration><voice>1</voice><type>quarter</type></note>`
              restStartSlot += subdivisions
              restAccum -= subdivisions
            }
            while (restAccum >= step) {
              noteSlots.push(restStartSlot)
              xml += `\n      <note><rest/><duration>${step}</duration><voice>1</voice><type>${stepNoteType}</type></note>`
              restStartSlot += step
              restAccum -= step
            }
            restAccum = 0
          }

          for (let s = beatStart; s < beatStart + subdivisions; s += step) {
            const hits = slotHits[s]
            if (hits.length === 0) {
              // Rest within the beat
              noteSlots.push(barStart + s)
              xml += `\n      <note><rest/><duration>${step}</duration><voice>1</voice><type>${stepNoteType}</type>`
              if (beatIsTriplet) {
                xml += `<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>`
                // Tuplet bracket on first/last slot of triplet beat (even rests)
                if (s === beatStart) xml += `<notations><tuplet type="start" bracket="yes" number="1" show-number="actual"/></notations>`
                else if (s === beatStart + subdivisions - step) xml += `<notations><tuplet type="stop" number="1"/></notations>`
              }
              xml += `</note>`
              continue
            }

            // Generate beam tag based on position among notes in this beat
            let beamTag = ''
            if (beatNotePositions.length >= 2) {
              const posIdx = beatNotePositions.indexOf(s)
              if (posIdx === 0) beamTag = `<beam number="1">begin</beam>`
              else if (posIdx === beatNotePositions.length - 1) beamTag = `<beam number="1">end</beam>`
              else beamTag = `<beam number="1">continue</beam>`
            }

            // Tuplet start/stop on first/last SLOT of each triplet beat
            let tupletTag = ''
            if (beatIsTriplet) {
              if (s === beatStart) tupletTag = `<tuplet type="start" bracket="yes" number="1" show-number="actual"/>`
              else if (s === beatStart + subdivisions - step) tupletTag = `<tuplet type="stop" number="1"/>`
            }

            noteSlots.push(barStart + s)
            xml += writeHits(hits, step, stepNoteType, beatIsTriplet, beamTag, tupletTag)
          }
        }
      }

      if (restAccum > 0) {
        while (restAccum >= subdivisions) {
          noteSlots.push(restStartSlot)
          xml += `\n      <note><rest/><duration>${subdivisions}</duration><voice>1</voice><type>quarter</type></note>`
          restStartSlot += subdivisions
          restAccum -= subdivisions
        }
        while (restAccum > 0) {
          noteSlots.push(restStartSlot)
          xml += `\n      <note><rest/><duration>1</duration><voice>1</voice><type>${noteType}</type></note>`
          restStartSlot += 1
          restAccum -= 1
        }
      }
    }

    // Final barline
    if (bar === numBars - 1) {
      xml += `\n      <barline location="right"><bar-style>light-heavy</bar-style></barline>`
    }

    measures.push(`    <measure number="${bar + 1}">${xml}\n    </measure>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  ${title ? `<work><work-title>${esc(title)}</work-title></work>` : ''}
  <part-list>
    <score-part id="P1">
      <part-name>Drums</part-name>
${scoreInstruments}
${midiInstruments}
    </score-part>
  </part-list>
  <part id="P1">
${measures.join('\n')}
  </part>
</score-partwise>`

  return { xml, noteSlots }
}

// ── Beam map builder ─────────────────────────────────────────────────────────
// Groups consecutive notes within each beat and assigns beam begin/continue/end.
// For subdivisions >= 4 (sixteenths), adds beam number="2" for the inner grouping.

function writeHits(
  hits: { pad: DrumPad; hv: HitValue }[],
  duration: number,
  type: string,
  isTriplet: boolean,
  beamTag: string,
  tupletTag: string = '',
): string {
  let xml = ''

  // Sort: highest staff position first
  const sorted = [...hits].sort((a, b) => {
    const ma = DRUM_MAP[a.pad]!, mb = DRUM_MAP[b.pad]!
    return (mb.displayOctave * 10 + 'CDEFGAB'.indexOf(mb.displayStep[0]))
         - (ma.displayOctave * 10 + 'CDEFGAB'.indexOf(ma.displayStep[0]))
  })

  // Build notations: accent + tuplet combined
  function buildNotations(hv: HitValue, isPrimary: boolean): string {
    const parts: string[] = []
    if (hv === 2) parts.push('<articulations><accent/></articulations>')
    if (isPrimary && tupletTag) parts.push(tupletTag)
    return parts.length > 0 ? `<notations>${parts.join('')}</notations>` : ''
  }

  // Primary note
  const primary = sorted[0]
  const pm = DRUM_MAP[primary.pad]!
  xml += `\n      <note>`
  xml += `<unpitched><display-step>${pm.displayStep}</display-step><display-octave>${pm.displayOctave}</display-octave></unpitched>`
  xml += `<duration>${duration}</duration>`
  xml += `<instrument id="${pm.instrumentId}"/>`
  xml += `<voice>1</voice>`
  xml += `<type>${type}</type>`
  if (isTriplet) xml += `<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>`
  xml += `<stem>up</stem>`
  if (pm.notehead !== 'normal') xml += `<notehead>${pm.notehead}</notehead>`
  if (primary.hv === 3) xml += `<notehead parentheses="yes">normal</notehead>`
  const primaryNotations = buildNotations(primary.hv, true)
  if (primaryNotations) xml += primaryNotations
  if (beamTag) xml += beamTag
  xml += `</note>`

  // Chord notes
  for (let i = 1; i < sorted.length; i++) {
    const h = sorted[i]
    const hm = DRUM_MAP[h.pad]!
    xml += `\n      <note><chord/>`
    xml += `<unpitched><display-step>${hm.displayStep}</display-step><display-octave>${hm.displayOctave}</display-octave></unpitched>`
    xml += `<duration>${duration}</duration>`
    xml += `<instrument id="${hm.instrumentId}"/>`
    xml += `<voice>1</voice>`
    xml += `<type>${type}</type>`
    if (isTriplet) xml += `<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>`
    xml += `<stem>up</stem>`
    if (hm.notehead !== 'normal') xml += `<notehead>${hm.notehead}</notehead>`
    if (h.hv === 2) xml += `<notations><articulations><accent/></articulations></notations>`
    if (h.hv === 3) xml += `<notehead parentheses="yes">normal</notehead>`
    xml += `</note>`
  }

  return xml
}

function buildBeamMap(
  slotHits: { pad: DrumPad; hv: HitValue }[][],
  subdivisions: number,
  slotsPerBar: number,
): Record<number, string> {
  if (subdivisions <= 1) return {} // quarter notes — no beaming

  const map: Record<number, string> = {}
  const numBeats = slotsPerBar / subdivisions

  for (let beat = 0; beat < numBeats; beat++) {
    const beatStart = beat * subdivisions
    const beatEnd = beatStart + subdivisions

    // Find slots with notes in this beat
    const noteSlots: number[] = []
    for (let s = beatStart; s < beatEnd; s++) {
      if (slotHits[s]?.length > 0) noteSlots.push(s)
    }

    // Need at least 2 notes to beam
    if (noteSlots.length < 2) continue

    // Beam level 1 (eighth-note level): spans all notes in the beat
    for (let i = 0; i < noteSlots.length; i++) {
      const s = noteSlots[i]
      if (i === 0) map[s] = '<beam number="1">begin</beam>'
      else if (i === noteSlots.length - 1) map[s] = '<beam number="1">end</beam>'
      else map[s] = '<beam number="1">continue</beam>'
    }

    // Beam level 2 (sixteenth-note level): for subdivisions >= 4,
    // connect consecutive sixteenth notes within each eighth-note pair
    if (subdivisions >= 4) {
      for (let i = 0; i < noteSlots.length; i++) {
        const s = noteSlots[i]
        const posInBeat = s - beatStart
        const nextS = noteSlots[i + 1]
        const prevS = noteSlots[i - 1]

        // Two consecutive slots = sixteenth pair
        const hasNext = nextS !== undefined && nextS === s + 1 && nextS < beatEnd
        const hasPrev = prevS !== undefined && prevS === s - 1 && prevS >= beatStart

        if (hasNext && !hasPrev) {
          map[s] += '<beam number="2">begin</beam>'
        } else if (hasPrev && !hasNext) {
          map[s] += '<beam number="2">end</beam>'
        } else if (hasPrev && hasNext) {
          map[s] += '<beam number="2">continue</beam>'
        }
        // If neither — single note at this sub-level, no beam 2 (gets a hook/partial)
      }
    }
  }

  return map
}

// ── Write rests ──────────────────────────────────────────────────────────────

function writeRests(slots: number, subdivisions: number, noteType: string): string {
  let xml = ''
  let rem = slots
  while (rem > 0) {
    if (rem >= subdivisions) {
      xml += `\n      <note><rest/><duration>${subdivisions}</duration><voice>1</voice><type>quarter</type></note>`
      rem -= subdivisions
    } else {
      xml += `\n      <note><rest/><duration>1</duration><voice>1</voice><type>${noteType}</type></note>`
      rem -= 1
    }
  }
  return xml
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
