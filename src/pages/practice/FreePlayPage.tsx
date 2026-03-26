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
        <Link to="/practice" className="text-amber-500/80 hover:text-amber-400 transition-colors">Practice</Link>
        <svg className="w-3.5 h-3.5 text-[#2d3748]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-[#94a3b8]">Free Play</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Free Play</h1>
        <p className="text-sm text-[#6b7280]">
          No rules, no scoring — just play. Use the metronome to keep time and watch your live stats.
        </p>
      </div>

      {!isConnected && (
        <div className="mb-6 text-sm text-amber-400/80 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl px-4 py-3">
          Connect your drum kit in <Link to="/settings" className="text-amber-500/80 hover:text-amber-400 underline transition-colors">Settings</Link> to start free play.
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: pad activity + stats */}
        <div className="col-span-2 space-y-5">
          {/* Pad activity grid */}
          <div className="rounded-2xl p-5 border border-white/[0.04]" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
            <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-3">Pad Activity</div>
            <div className="grid grid-cols-3 gap-2">
              {padNames.map(pad => {
                const isActive = activePads[pad as keyof typeof activePads] !== undefined
                const isRecent = recentPads.has(pad)
                const hitCount = hitLog.filter(h => h.pad === pad).length
                return (
                  <div
                    key={pad}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isActive
                        ? 'border-amber-500/40 bg-amber-500/10 scale-105'
                        : isRecent
                        ? 'border-white/[0.06] bg-white/[0.04]'
                        : 'border-white/[0.04] bg-white/[0.02]'
                    }`}
                  >
                    <div className={`text-xs font-medium ${isActive ? 'text-amber-400' : 'text-[#6b7280]'}`}>
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
            <div className="flex-1 rounded-2xl p-4 border border-white/[0.04] text-center" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
              <div className="text-2xl font-bold text-white">{stats.totalHits}</div>
              <div className="text-[10px] text-[#4b5563] uppercase tracking-wider">Total Hits</div>
            </div>
            <div className="flex-1 rounded-2xl p-4 border border-white/[0.04] text-center" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
              <div className="text-2xl font-bold text-amber-400">{stats.avgVelocity}</div>
              <div className="text-[10px] text-[#4b5563] uppercase tracking-wider">Avg Velocity</div>
            </div>
            <div className="flex-1 rounded-2xl p-4 border border-white/[0.04] text-center" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
              <div className="text-2xl font-bold text-emerald-400">{stats.hitRate}</div>
              <div className="text-[10px] text-[#4b5563] uppercase tracking-wider">Hits/min</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={toggleMetronome}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                metronomeOn
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/15'
                  : 'text-white'
              }`}
              style={!metronomeOn ? { background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 20px -4px rgba(245,158,11,0.35)' } : undefined}
            >
              {metronomeOn ? '■ Stop Metronome' : '▶ Start Metronome'}
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.07] transition-colors"
            >
              Reset Stats
            </button>
          </div>

          {/* Recent hits log */}
          <div className="rounded-2xl p-5 border border-white/[0.04]" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
            <div className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">Recent Hits</div>
            <div className="flex gap-1 flex-wrap">
              {hitLog.slice(-30).map((h, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-[#94a3b8]"
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
