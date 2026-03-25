import { useMetronomeStore } from '../../stores/useMetronomeStore'

interface Props {
  disabled?: boolean
  onBpmChange?: (bpm: number) => void
}

export default function MetronomeControls({ disabled, onBpmChange }: Props) {
  const { bpm, setBpm, incrementBpm, volume, setVolume } = useMetronomeStore()

  function handleBpm(val: number) {
    setBpm(val)
    onBpmChange?.(val)
  }

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider">Metronome</h3>

      {/* BPM display + nudge */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => handleBpm(bpm - 5)}
          disabled={disabled}
          className="w-8 h-8 rounded-lg bg-[#1a1f2e] text-[#94a3b8] hover:text-white hover:bg-[#252b3b] transition-colors disabled:opacity-40 text-lg"
        >
          −
        </button>
        <div className="text-center">
          <div className="text-4xl font-bold text-white tabular-nums">{bpm}</div>
          <div className="text-xs text-[#4b5563]">BPM</div>
        </div>
        <button
          onClick={() => handleBpm(bpm + 5)}
          disabled={disabled}
          className="w-8 h-8 rounded-lg bg-[#1a1f2e] text-[#94a3b8] hover:text-white hover:bg-[#252b3b] transition-colors disabled:opacity-40 text-lg"
        >
          +
        </button>
      </div>

      {/* BPM slider */}
      <input
        type="range"
        min={40}
        max={240}
        value={bpm}
        disabled={disabled}
        onChange={(e) => handleBpm(Number(e.target.value))}
        className="w-full accent-violet-500 disabled:opacity-40"
      />
      <div className="flex justify-between text-xs text-[#374151]">
        <span>40</span>
        <span>BPM</span>
        <span>240</span>
      </div>

      {/* Fine nudge buttons */}
      <div className="flex gap-2">
        {[-10, -5, -1, +1, +5, +10].map((d) => (
          <button
            key={d}
            onClick={() => handleBpm(bpm + d)}
            disabled={disabled}
            className="flex-1 py-1 text-xs rounded bg-[#1a1f2e] text-[#6b7280] hover:text-white hover:bg-[#252b3b] transition-colors disabled:opacity-40"
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#4b5563]">Vol</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 accent-violet-500"
        />
        <span className="text-xs text-[#4b5563] w-8 text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  )
}
