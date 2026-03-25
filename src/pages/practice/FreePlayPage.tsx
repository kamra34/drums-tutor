import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useMidiStore } from '../../stores/useMidiStore'
import { useMetronomeStore } from '../../stores/useMetronomeStore'
import { midiService } from '../../services/midiService'
import { audioService } from '../../services/audioService'
import MetronomeControls from '../../components/practice/MetronomeControls'

interface HitLog {
  pad: string
  velocity: number
  timestamp: number
}

export default function FreePlayPage() {
  const { isConnected, activePads } = useMidiStore()
  const { bpm, setBpm } = useMetronomeStore()
  const [metronomeOn, setMetronomeOn] = useState(false)
  const [hitLog, setHitLog] = useState<HitLog[]>([])
  const [stats, setStats] = useState({ totalHits: 0, avgVelocity: 0, hitRate: 0 })
  const startTimeRef = useRef(0)
  const hitsRef = useRef<HitLog[]>([])

  // Listen for MIDI hits
  useEffect(() => {
    const unsub = midiService.onNoteOn((event) => {
      const pad = midiService.resolvePad(event.note)
      if (!pad) return

      useMidiStore.getState().padHit(pad, event.velocity)

      const hit: HitLog = {
        pad,
        velocity: event.velocity,
        timestamp: Date.now(),
      }

      hitsRef.current = [...hitsRef.current.slice(-99), hit]
      setHitLog(hitsRef.current)

      // Update stats
      const hits = hitsRef.current
      const totalHits = hits.length
      const avgVelocity = Math.round(hits.reduce((s, h) => s + h.velocity, 0) / totalHits)
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const hitRate = elapsed > 0 ? Math.round((totalHits / elapsed) * 60) : 0

      setStats({ totalHits, avgVelocity, hitRate })
    })
    return unsub
  }, [])

  function toggleMetronome() {
    if (metronomeOn) {
      audioService.stopMetronome()
      setMetronomeOn(false)
    } else {
      audioService.startMetronome(bpm, [4, 4], () => {})
      setMetronomeOn(true)
      startTimeRef.current = Date.now()
    }
  }

  function reset() {
    hitsRef.current = []
    setHitLog([])
    setStats({ totalHits: 0, avgVelocity: 0, hitRate: 0 })
    startTimeRef.current = Date.now()
  }

  useEffect(() => {
    startTimeRef.current = Date.now()
    return () => { audioService.stopMetronome() }
  }, [])

  // Pad activity display
  const padNames = ['kick', 'snare', 'hihat_closed', 'hihat_open', 'tom1', 'tom2', 'floor_tom', 'crash', 'ride']
  const recentPads = new Set(hitLog.slice(-20).map(h => h.pad))

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-6">
        <Link to="/practice" className="hover:text-violet-400">Practice</Link>
        <span>›</span>
        <span className="text-[#94a3b8]">Free Play</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">🎯 Free Play</h1>
        <p className="text-sm text-[#6b7280]">
          No rules, no scoring — just play. Use the metronome to keep time and watch your live stats.
        </p>
      </div>

      {!isConnected && (
        <div className="mb-6 text-sm text-yellow-600 bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-4 py-3">
          Connect your drum kit in <Link to="/settings" className="underline">Settings</Link> to start free play.
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: pad activity + stats */}
        <div className="col-span-2 space-y-5">
          {/* Pad activity grid */}
          <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5">
            <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-3">Pad Activity</div>
            <div className="grid grid-cols-3 gap-2">
              {padNames.map(pad => {
                const isActive = activePads[pad as keyof typeof activePads] !== undefined
                const isRecent = recentPads.has(pad)
                const hitCount = hitLog.filter(h => h.pad === pad).length
                return (
                  <div
                    key={pad}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      isActive
                        ? 'border-violet-600 bg-violet-900/30 scale-105'
                        : isRecent
                        ? 'border-[#2d3748] bg-[#13101e]'
                        : 'border-[#1e2433] bg-[#0a0c13]'
                    }`}
                  >
                    <div className={`text-xs font-medium ${isActive ? 'text-violet-400' : 'text-[#6b7280]'}`}>
                      {pad.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    <div className="text-lg font-bold text-white mt-1">{hitCount}</div>
                    <div className="text-[10px] text-[#4b5563]">hits</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live stats */}
          <div className="flex gap-4">
            <div className="flex-1 bg-[#0d1117] border border-[#1e2433] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalHits}</div>
              <div className="text-xs text-[#4b5563]">Total Hits</div>
            </div>
            <div className="flex-1 bg-[#0d1117] border border-[#1e2433] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-violet-400">{stats.avgVelocity}</div>
              <div className="text-xs text-[#4b5563]">Avg Velocity</div>
            </div>
            <div className="flex-1 bg-[#0d1117] border border-[#1e2433] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.hitRate}</div>
              <div className="text-xs text-[#4b5563]">Hits/min</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={toggleMetronome}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                metronomeOn
                  ? 'bg-red-800/50 text-red-300 border border-red-800/40'
                  : 'bg-violet-600 text-white hover:bg-violet-500'
              }`}
            >
              {metronomeOn ? '■ Stop Metronome' : '▶ Start Metronome'}
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 rounded-xl bg-[#1e2433] text-[#94a3b8] hover:text-white transition-colors"
            >
              Reset Stats
            </button>
          </div>

          {/* Recent hits log */}
          <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-4">
            <div className="text-xs text-[#4b5563] uppercase tracking-wider mb-2">Recent Hits</div>
            <div className="flex gap-1 flex-wrap">
              {hitLog.slice(-30).map((h, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2433] text-[#94a3b8]"
                  style={{ opacity: 0.4 + (i / 30) * 0.6 }}
                >
                  {h.pad.replace(/_/g, '').slice(0, 4)}
                </span>
              ))}
              {hitLog.length === 0 && <span className="text-xs text-[#374151]">Hit a pad to see activity here…</span>}
            </div>
          </div>
        </div>

        {/* Right: metronome */}
        <div>
          <MetronomeControls
            disabled={metronomeOn}
            onBpmChange={setBpm}
          />
        </div>
      </div>
    </div>
  )
}
