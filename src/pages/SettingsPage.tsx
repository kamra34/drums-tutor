import { useState, useEffect } from 'react'
import { useAiStore } from '../stores/useAiStore'
import { useMidiStore } from '../stores/useMidiStore'
import { useAuthStore } from '../stores/useAuthStore'
import { midiService } from '../services/midiService'
import { aiService } from '../services/aiService'
// Admin is set up manually via backend — no UI button
import { GM_DRUM_MAP, ALESIS_DRUM_MAP } from '../types/midi'

const DRUM_MAPS = [
  { id: 'gm', label: 'General MIDI (GM)', map: GM_DRUM_MAP },
  { id: 'alesis', label: 'Alesis', map: ALESIS_DRUM_MAP },
]

export default function SettingsPage() {
  const { apiKey, setApiKey, isConfigured } = useAiStore()
  const { isConnected, isSupported, deviceName, setConnected, setSupported, setDrumMap } = useMidiStore()

  const [keyInput, setKeyInput] = useState(apiKey)
  const [keySaved, setKeySaved] = useState(false)
  const [keyVisible, setKeyVisible] = useState(false)

  const [midiDevices, setMidiDevices] = useState<{ id: string; name: string; manufacturer: string }[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [selectedMap, setSelectedMap] = useState('alesis')
  const [midiError, setMidiError] = useState<string | null>(null)

  // Init MIDI
  async function handleConnectMidi() {
    setMidiError(null)
    const ok = await midiService.requestMidiAccess()
    if (!ok) {
      setMidiError('Could not access MIDI. Use Chrome or Edge and allow MIDI permissions.')
      setSupported(false)
      return
    }
    setSupported(true)
    const devices = midiService.getInputDevices()
    setMidiDevices(devices)
    if (devices.length === 0) {
      setMidiError('No MIDI devices found. Make sure your drum kit is connected via USB.')
    }
  }

  function handleDeviceConnect() {
    if (!selectedDevice) return
    const drumMap = DRUM_MAPS.find((m) => m.id === selectedMap)?.map ?? GM_DRUM_MAP
    midiService.setDrumMap(drumMap)
    setDrumMap(drumMap)

    const ok = midiService.connectToDevice(selectedDevice)
    if (ok) {
      const device = midiDevices.find((d) => d.id === selectedDevice)
      setConnected(true, device?.name, selectedDevice)
    } else {
      setMidiError('Failed to connect to device.')
    }
  }

  function handleDisconnect() {
    midiService.disconnectDevice()
    setConnected(false)
  }

  function handleSaveKey() {
    const trimmed = keyInput.trim()
    setApiKey(trimmed)
    aiService.setApiKey(trimmed)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  return (
    <div className="min-h-screen" style={{ background: '#06080d' }}>
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Hero header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-[#6b7280] text-sm mt-1">Configure your tutor, kit, and preferences.</p>
        </div>

        <div className="space-y-6">
          {/* AI Tutor Card */}
          <GlassCard>
            <SectionLabel>AI Tutor</SectionLabel>
            <p className="text-sm text-[#6b7280] mb-4">Enter your Anthropic API key to enable AI feedback and chat.</p>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={keyVisible ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-[#2d3748] focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.05] transition-all text-sm pr-20"
                />
                <button
                  onClick={() => setKeyVisible((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#4b5563] hover:text-[#94a3b8] transition-colors"
                >
                  {keyVisible ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveKey}
                  className="px-5 py-2.5 text-white text-sm rounded-xl transition-all font-medium"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    boxShadow: '0 4px 20px -4px rgba(245,158,11,0.35)',
                  }}
                >
                  {keySaved ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Saved
                    </span>
                  ) : (
                    'Save API Key'
                  )}
                </button>
                {isConfigured && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    API key configured
                  </span>
                )}
              </div>
              <p className="text-xs text-[#4b5563]">
                Your key is stored locally in your browser and never sent anywhere except Anthropic's API.
                Get a key at{' '}
                <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-amber-500/80 hover:text-amber-400 transition-colors">
                  console.anthropic.com
                </a>
                .
              </p>
            </div>
          </GlassCard>

          {/* MIDI Card */}
          <GlassCard>
            <SectionLabel>Drum Kit (MIDI)</SectionLabel>
            <p className="text-sm text-[#6b7280] mb-4">Connect your electronic drum kit via USB. Chrome and Edge support Web MIDI.</p>

            {isConnected ? (
              <div className="space-y-3">
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      background: '#34d399',
                      boxShadow: '0 0 8px 2px rgba(52, 211, 153, 0.4)',
                    }}
                  />
                  <div>
                    <div className="text-sm text-emerald-300 font-medium">{deviceName ?? 'Kit connected'}</div>
                    <div className="text-xs text-[#4b5563]">Receiving MIDI input</div>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.07] text-sm rounded-xl transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {midiError && (
                  <div className="rounded-xl px-4 py-3 text-sm text-rose-300" style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                    {midiError}
                  </div>
                )}

                <button
                  onClick={handleConnectMidi}
                  className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.07] text-sm rounded-xl transition-all"
                >
                  Scan for MIDI Devices
                </button>

                {midiDevices.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-1.5 block">Device</label>
                      <select
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.05] transition-all"
                      >
                        <option value="">Select a device...</option>
                        {midiDevices.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} {d.manufacturer ? `(${d.manufacturer})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-1.5 block">Drum Map</label>
                      <select
                        value={selectedMap}
                        onChange={(e) => setSelectedMap(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.05] transition-all"
                      >
                        {DRUM_MAPS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[#4b5563] mt-1.5">
                        Choose the mapping that matches your kit. If unsure, try General MIDI first.
                      </p>
                    </div>

                    <button
                      onClick={handleDeviceConnect}
                      disabled={!selectedDevice}
                      className="px-5 py-2.5 text-white text-sm rounded-xl transition-all font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                        boxShadow: '0 4px 20px -4px rgba(245,158,11,0.35)',
                      }}
                    >
                      Connect
                    </button>
                  </div>
                )}
              </div>
            )}
          </GlassCard>

          {/* About Card */}
          <GlassCard>
            <SectionLabel>About</SectionLabel>
            <div className="text-sm text-[#4b5563] space-y-1.5">
              <p>DrumTutor — AI-powered drum learning</p>
              <p>Requires Chrome or Edge for MIDI support.</p>
              <p>Curriculum: beginner to advanced with theory, exercises, and AI feedback.</p>
            </div>
          </GlassCard>

          {/* Admin Card */}
          <AdminSection />
        </div>
      </div>
    </div>
  )
}

function AdminSection() {
  const { user } = useAuthStore()
  if (!user) return null

  if (user.role === 'admin') {
    return (
      <GlassCard>
        <SectionLabel>Admin</SectionLabel>
        <p className="text-sm text-[#6b7280] mb-4">You have admin privileges.</p>
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-emerald-400"
          style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
          }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Logged in as admin: {user.displayName} ({user.email})
        </div>
      </GlassCard>
    )
  }

  // Non-admins see nothing — admin is set up manually via the backend
  return null
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 border border-white/[0.04]"
      style={{
        background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
      }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-3">
      {children}
    </h2>
  )
}
