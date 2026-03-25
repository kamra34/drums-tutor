import { useState, useEffect } from 'react'
import { useAiStore } from '../stores/useAiStore'
import { useMidiStore } from '../stores/useMidiStore'
import { midiService } from '../services/midiService'
import { aiService } from '../services/aiService'
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
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      {/* AI API Key */}
      <Section title="AI Tutor" description="Enter your Anthropic API key to enable AI feedback and chat.">
        <div className="space-y-3">
          <div className="relative">
            <input
              type={keyVisible ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-[#0d1117] border border-[#1e2433] focus:border-violet-700 rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#374151] outline-none transition-colors pr-20"
            />
            <button
              onClick={() => setKeyVisible((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#4b5563] hover:text-[#94a3b8] px-2"
            >
              {keyVisible ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveKey}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors font-medium"
            >
              {keySaved ? '✓ Saved' : 'Save API Key'}
            </button>
            {isConfigured && (
              <span className="text-xs text-green-400">✓ API key configured</span>
            )}
          </div>
          <p className="text-xs text-[#4b5563]">
            Your key is stored locally in your browser and never sent anywhere except Anthropic's API.
            Get a key at console.anthropic.com.
          </p>
        </div>
      </Section>

      <Divider />

      {/* MIDI Setup */}
      <Section
        title="Drum Kit (MIDI)"
        description="Connect your electronic drum kit via USB. Chrome and Edge support Web MIDI."
      >
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-green-900/10 border border-green-800/40 rounded-lg px-4 py-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />
              <div>
                <div className="text-sm text-green-300 font-medium">{deviceName ?? 'Kit connected'}</div>
                <div className="text-xs text-[#4b5563]">Receiving MIDI input</div>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-[#1a1f2e] hover:bg-[#252b3b] text-[#94a3b8] text-sm rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {midiError && (
              <div className="bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2 text-sm text-red-400">
                {midiError}
              </div>
            )}

            <button
              onClick={handleConnectMidi}
              className="px-4 py-2 bg-[#1a1f2e] hover:bg-[#252b3b] text-[#94a3b8] hover:text-white text-sm rounded-lg transition-colors"
            >
              Scan for MIDI Devices
            </button>

            {midiDevices.length > 0 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Device</label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#1e2433] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] outline-none"
                  >
                    <option value="">Select a device…</option>
                    {midiDevices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.manufacturer ? `(${d.manufacturer})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Drum Map</label>
                  <select
                    value={selectedMap}
                    onChange={(e) => setSelectedMap(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#1e2433] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] outline-none"
                  >
                    {DRUM_MAPS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[#374151] mt-1">
                    Choose the mapping that matches your kit. If unsure, try General MIDI first.
                  </p>
                </div>

                <button
                  onClick={handleDeviceConnect}
                  disabled={!selectedDevice}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm rounded-lg transition-colors font-medium"
                >
                  Connect
                </button>
              </div>
            )}
          </div>
        )}
      </Section>

      <Divider />

      {/* About */}
      <Section title="About" description="">
        <div className="text-sm text-[#4b5563] space-y-1">
          <p>DrumTutor — AI-powered drum learning</p>
          <p>Requires Chrome or Edge for MIDI support.</p>
          <p>Curriculum: beginner to advanced with theory, exercises, and AI feedback.</p>
        </div>
      </Section>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <h2 className="text-white font-semibold mb-0.5">{title}</h2>
      {description && <p className="text-sm text-[#6b7280] mb-4">{description}</p>}
      {children}
    </div>
  )
}

function Divider() {
  return <hr className="border-[#1e2433] my-8" />
}
