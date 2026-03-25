import { useState, useEffect, useRef } from 'react'
import { playAccentClick, playNormalClick, playSnare, playHiHat } from '../../services/clickSounds'

interface NoteType {
  id: string
  name: string
  americanName: string
  beats: number
  count: string[]
  symbol: string
  color: string
  subdivisions: number // how many fit in a 4/4 bar
}

const NOTES: NoteType[] = [
  {
    id: 'whole',
    name: 'Whole Note',
    americanName: 'Semibreve',
    beats: 4,
    count: ['1', '2', '3', '4'],
    symbol: '𝅝',
    color: '#7c3aed',
    subdivisions: 1,
  },
  {
    id: 'half',
    name: 'Half Note',
    americanName: 'Minim',
    beats: 2,
    count: ['1', '3'],
    symbol: '𝅗𝅥',
    color: '#2563eb',
    subdivisions: 2,
  },
  {
    id: 'quarter',
    name: 'Quarter Note',
    americanName: 'Crotchet',
    beats: 1,
    count: ['1', '2', '3', '4'],
    symbol: '♩',
    color: '#059669',
    subdivisions: 4,
  },
  {
    id: 'eighth',
    name: 'Eighth Note',
    americanName: 'Quaver',
    beats: 0.5,
    count: ['1', '+', '2', '+', '3', '+', '4', '+'],
    symbol: '♪',
    color: '#d97706',
    subdivisions: 8,
  },
  {
    id: 'sixteenth',
    name: 'Sixteenth Note',
    americanName: 'Semiquaver',
    beats: 0.25,
    count: ['1', 'e', '+', 'a', '2', 'e', '+', 'a', '3', 'e', '+', 'a', '4', 'e', '+', 'a'],
    symbol: '𝅘𝅥𝅯',
    color: '#dc2626',
    subdivisions: 16,
  },
]

/** Play a sound appropriate for each note type and step position */
function playSoundForNote(note: NoteType, step: number): void {
  const isOnBeat = step % (16 / note.subdivisions * note.subdivisions / 4) === 0

  switch (note.id) {
    case 'whole':
    case 'half':
      playAccentClick()
      playSnare(0.35)
      break
    case 'quarter':
      if (step % 4 === 0) { playAccentClick(); playSnare(0.25) }
      else playSnare(0.4)
      break
    case 'eighth':
      // On-beat: snare with click, off-beat ("and"): hi-hat
      if (step % 2 === 0) { playNormalClick(); if (step === 0) playSnare(0.2) }
      else playHiHat(0.4)
      break
    case 'sixteenth':
      // Beat subdivisions: 1=click, e/a=hi-hat, +=softer click
      if (step % 4 === 0) playAccentClick()
      else if (step % 2 === 0) playNormalClick(0.2)
      else playHiHat(0.25)
      break
    default:
      if (isOnBeat) playNormalClick()
  }
}

export default function NoteValuesChart() {
  const [selected, setSelected] = useState<string | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const [currentSubdiv, setCurrentSubdiv] = useState(-1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedNote = NOTES.find((n) => n.id === selected)

  function playNote(note: NoteType) {
    if (playing === note.id) {
      stopPlay()
      return
    }
    stopPlay()
    setPlaying(note.id)
    setSelected(note.id)
    setCurrentSubdiv(0)

    // Play first step sound immediately
    playSoundForNote(note, 0)

    const beatMs = 500 // 120 BPM
    const subdivMs = beatMs / (note.subdivisions / 4)

    let step = 0
    intervalRef.current = setInterval(() => {
      step++
      if (step >= note.subdivisions) {
        step = 0
      }
      setCurrentSubdiv(step)
      playSoundForNote(note, step)
    }, subdivMs)

    // Stop after 2 repetitions
    setTimeout(() => stopPlay(), subdivMs * note.subdivisions * 2)
  }

  function stopPlay() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPlaying(null)
    setCurrentSubdiv(-1)
  }

  useEffect(() => () => stopPlay(), [])

  const totalCols = 16 // sixteenth note grid

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-6 space-y-5">
      <div className="text-xs text-[#4b5563] uppercase tracking-wider">Note Values — Interactive Chart</div>

      <p className="text-sm text-[#6b7280]">
        Each row shows how many of that note type fit inside one measure of 4/4 time.
        Click ▶ to animate the counting pattern.
      </p>

      {/* Grid */}
      <div className="space-y-2 overflow-x-auto">
        {NOTES.map((note) => {
          const cellsPerNote = totalCols / note.subdivisions
          const isSelected = selected === note.id
          const isPlaying = playing === note.id

          return (
            <div
              key={note.id}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-[#13101e]' : 'hover:bg-[#0f1117]'
              }`}
              onClick={() => setSelected(isSelected && !isPlaying ? null : note.id)}
            >
              {/* Play button */}
              <button
                onClick={(e) => { e.stopPropagation(); playNote(note) }}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  backgroundColor: isPlaying ? note.color : note.color + '22',
                  color: isPlaying ? 'white' : note.color,
                }}
              >
                {isPlaying ? '■' : '▶'}
              </button>

              {/* Note name */}
              <div className="w-32 flex-shrink-0">
                <div className="text-xs font-medium" style={{ color: note.color }}>{note.name}</div>
                <div className="text-[10px] text-[#4b5563]">{note.beats} beat{note.beats !== 1 ? 's' : ''}</div>
              </div>

              {/* Grid cells */}
              <div className="flex gap-0.5 flex-1">
                {Array.from({ length: note.subdivisions }).map((_, i) => {
                  const isActive = isPlaying && currentSubdiv === i
                  const isBeat = i % (totalCols / 4 / note.subdivisions * note.subdivisions) === 0 ||
                    note.id === 'whole'
                  return (
                    <div
                      key={i}
                      className="flex-1 h-7 rounded-sm transition-all"
                      style={{
                        backgroundColor: isActive
                          ? note.color
                          : isSelected
                          ? note.color + '55'
                          : note.color + '33',
                        boxShadow: isActive ? `0 0 8px ${note.color}` : 'none',
                        minWidth: `${100 / note.subdivisions}%`,
                        maxWidth: `${cellsPerNote * (100 / totalCols)}%`,
                      }}
                    />
                  )
                })}
              </div>

              {/* Count label */}
              <div className="w-16 text-right text-xs text-[#4b5563] flex-shrink-0">
                ×{note.subdivisions}/bar
              </div>
            </div>
          )
        })}

        {/* Beat number ruler */}
        <div className="flex items-center gap-3 pl-2 mt-1">
          <div className="w-7 flex-shrink-0" />
          <div className="w-32 flex-shrink-0" />
          <div className="flex flex-1 text-[10px] text-[#374151]">
            {['1', '', '', '', '2', '', '', '', '3', '', '', '', '4', '', '', ''].map((n, i) => (
              <div key={i} className="flex-1 text-center">{n}</div>
            ))}
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Selected note detail */}
      {selectedNote && (
        <div className="border-t border-[#1e2433] pt-4">
          <div className="flex gap-8 flex-wrap">
            <div>
              <div className="text-xs text-[#4b5563]">Name</div>
              <div className="text-white font-semibold">{selectedNote.name}</div>
              <div className="text-xs text-[#4b5563]">{selectedNote.americanName}</div>
            </div>
            <div>
              <div className="text-xs text-[#4b5563]">Duration</div>
              <div className="text-white font-semibold">{selectedNote.beats} beat{selectedNote.beats !== 1 ? 's' : ''}</div>
            </div>
            <div>
              <div className="text-xs text-[#4b5563]">Count aloud</div>
              <div className="flex gap-1 mt-1 flex-wrap">
                {selectedNote.count.map((c, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded text-xs font-mono font-bold"
                    style={{
                      backgroundColor: selectedNote.color + '33',
                      color: selectedNote.color,
                      border: `1px solid ${selectedNote.color}55`,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
