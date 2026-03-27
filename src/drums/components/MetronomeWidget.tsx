import { useState, useEffect } from 'react'
import { setClickEnabled, getClickEnabled, setClickVolume, getClickVolume } from '@drums/services/drumSounds'

/**
 * Minimal metronome toggle + volume control.
 * The click is played in perfect sync by the pattern playback engine —
 * this widget only controls on/off and volume.
 */
export default function MetronomeWidget() {
  const [enabled, setEnabled] = useState(() => getClickEnabled())
  const [volume, setVolume] = useState(() => {
    try {
      const stored = localStorage.getItem('drum-tutor-click-vol')
      if (stored) {
        const v = Number(stored)
        setClickVolume(v)
        return v
      }
    } catch {}
    return getClickVolume()
  })
  const [showVol, setShowVol] = useState(false)

  function toggle() {
    const next = !enabled
    setEnabled(next)
    setClickEnabled(next)
  }

  function handleVolume(v: number) {
    setVolume(v)
    setClickVolume(v)
    try { localStorage.setItem('drum-tutor-click-vol', String(v)) } catch {}
  }

  // Sync on mount
  useEffect(() => {
    setClickEnabled(enabled)
    setClickVolume(volume)
  }, [])

  return (
    <div className="inline-flex items-center gap-1.5">
      {/* Click toggle */}
      <button
        onClick={toggle}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
          enabled
            ? 'bg-amber-500/12 border-amber-500/25 text-amber-400'
            : 'bg-white/[0.03] border-white/[0.06] text-[#4b5563] hover:text-[#94a3b8] hover:border-white/[0.12]'
        }`}
        title={enabled ? 'Click on — synced with playback' : 'Click off'}
      >
        {/* Metronome icon */}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L8.5 21h7L12 2z" />
          <path d="M12 8l5-3" />
          <line x1="7" y1="21" x2="17" y2="21" />
        </svg>
        <span>{enabled ? 'Click' : 'Click'}</span>
      </button>

      {/* Volume */}
      <div className="relative">
        <button
          onClick={() => setShowVol(v => !v)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
            showVol
              ? 'bg-white/[0.06] border-white/[0.1] text-[#94a3b8]'
              : 'border-transparent text-[#374151] hover:text-[#6b7280]'
          }`}
          title="Click volume"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            {volume > 0 && <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072" />}
            {volume > 0.5 && <path strokeLinecap="round" strokeLinejoin="round" d="M17.07 6.93a8 8 0 010 10.14" />}
          </svg>
        </button>

        {showVol && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-[#0d1117]/95 backdrop-blur-md shadow-xl z-50" style={{ minWidth: 130 }}>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={e => handleVolume(Number(e.target.value))}
                className="flex-1 accent-amber-500 h-1 cursor-pointer"
              />
              <span className="text-[10px] text-[#6b7280] font-mono w-7 text-right tabular-nums">
                {Math.round(volume * 100)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
