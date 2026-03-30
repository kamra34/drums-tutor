import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAiStore } from '@shared/stores/useAiStore'
import PracticePlayer from '@piano/components/PracticePlayer'
import { generatePiece, type GenerationParams, type GeneratedPiece } from '@piano/services/studioAiService'

const accent = '#a78bfa'
const KEYS = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Am', 'Dm', 'Em', 'Gm']
const TIME_SIGS: [number, number][] = [[4, 4], [3, 4], [6, 8]]
const EXERCISE_TYPES = ['scale', 'chord-progression', 'melody', 'technique', 'sight-reading'] as const

type Mode = 'exercise' | 'song' | 'style'

export default function PianoStudioPage() {
  const { apiKey, isConfigured } = useAiStore()

  const [mode, setMode] = useState<Mode>('exercise')
  const [difficulty, setDifficulty] = useState(3)
  const [key, setKey] = useState('C')
  const [hands, setHands] = useState<'right' | 'left' | 'both'>('right')
  const [timeSig, setTimeSig] = useState<[number, number]>([4, 4])
  const [bpm, setBpm] = useState(80)
  const [bars, setBars] = useState(8)
  const [exerciseType, setExerciseType] = useState<typeof EXERCISE_TYPES[number]>('melody')
  const [songName, setSongName] = useState('')
  const [stylePrompt, setStylePrompt] = useState('')

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [piece, setPiece] = useState<GeneratedPiece | null>(null)
  const [history, setHistory] = useState<GeneratedPiece[]>([])
  const [pieceKey, setPieceKey] = useState(0)

  const handleGenerate = async () => {
    if (!isConfigured) { setError('Set your Anthropic API key in Settings first.'); return }
    setGenerating(true); setError(''); setPiece(null)

    const params: GenerationParams = {
      mode, difficulty, key, hands, timeSignature: timeSig, bpm, bars,
      exerciseType: mode === 'exercise' ? exerciseType : undefined,
      songName: mode === 'song' ? songName : undefined,
      stylePrompt: mode === 'style' ? stylePrompt : undefined,
    }

    try {
      const result = await generatePiece(apiKey, params)
      setPiece(result)
      setPieceKey(k => k + 1)
      setHistory(h => [result, ...h].slice(0, 20))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden mb-6" style={{
        background: 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(139,92,246,0.04) 50%, rgba(12,14,20,0.8) 100%)',
        border: '1px solid rgba(167,139,250,0.12)',
      }}>
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
        <div className="relative p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
              ✨
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">Piano Studio</h1>
              <p className="text-xs text-[#6b7280]">AI-powered exercise and arrangement generator</p>
            </div>
          </div>
        </div>
      </div>

      {/* API key warning */}
      {!isConfigured && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 text-xs text-amber-400/80">
          Set your Anthropic API key in <Link to="/settings" className="underline hover:text-amber-300">Settings</Link> to use the Studio.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        {/* ── Left Panel: Controls ── */}
        <div className="space-y-4">
          {/* Mode selector */}
          <div className="rounded-2xl border border-white/[0.04] p-4" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
            <Label>Mode</Label>
            <div className="flex gap-1.5 mb-4">
              {([['exercise', 'Exercise'], ['song', 'Song'], ['style', 'Free Prompt']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setMode(v)}
                  className="flex-1 px-2 py-2 rounded-lg text-[11px] font-medium text-center transition-all cursor-pointer"
                  style={{
                    background: mode === v ? `${accent}15` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${mode === v ? `${accent}30` : 'rgba(255,255,255,0.04)'}`,
                    color: mode === v ? '#fff' : '#6b7280',
                  }}>{l}</button>
              ))}
            </div>

            {/* Mode-specific input */}
            {mode === 'exercise' && (<>
              <Label>Exercise Type</Label>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {EXERCISE_TYPES.map(t => (
                  <button key={t} onClick={() => setExerciseType(t)}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium capitalize transition-all cursor-pointer"
                    style={{
                      background: exerciseType === t ? `${accent}15` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${exerciseType === t ? `${accent}30` : 'rgba(255,255,255,0.04)'}`,
                      color: exerciseType === t ? '#fff' : '#6b7280',
                    }}>{t.replace('-', ' ')}</button>
                ))}
              </div>
            </>)}

            {mode === 'song' && (<>
              <Label>Song Name</Label>
              <input value={songName} onChange={e => setSongName(e.target.value)}
                placeholder="e.g. Yesterday, Imagine, Fur Elise..."
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-[#4b5563] mb-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', outline: 'none' }} />
            </>)}

            {mode === 'style' && (<>
              <Label>Describe what you want</Label>
              <textarea value={stylePrompt} onChange={e => setStylePrompt(e.target.value)}
                placeholder="e.g. A gentle waltz in minor key, or Jazz walking bass with RH comping..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-[#4b5563] resize-none mb-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', outline: 'none' }} />
            </>)}

            {/* Shared parameters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Key</Label>
                <div className="flex flex-wrap gap-1">
                  {KEYS.map(k => (
                    <button key={k} onClick={() => setKey(k)}
                      className="px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer"
                      style={{
                        background: key === k ? `${accent}15` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${key === k ? `${accent}25` : 'rgba(255,255,255,0.03)'}`,
                        color: key === k ? '#fff' : '#4b5563',
                      }}>{k}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Hands</Label>
                <div className="flex gap-1">
                  {(['right', 'left', 'both'] as const).map(h => (
                    <button key={h} onClick={() => setHands(h)}
                      className="flex-1 px-1 py-1.5 rounded text-[10px] font-medium capitalize transition-all cursor-pointer"
                      style={{
                        background: hands === h ? `${accent}15` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${hands === h ? `${accent}25` : 'rgba(255,255,255,0.03)'}`,
                        color: hands === h ? '#fff' : '#4b5563',
                      }}>{h === 'right' ? 'RH' : h === 'left' ? 'LH' : 'Both'}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <Label>Difficulty</Label>
                <div className="flex items-center gap-1">
                  <input type="range" min={1} max={7} value={difficulty} onChange={e => setDifficulty(parseInt(e.target.value))}
                    className="flex-1 h-1 rounded-full cursor-pointer" style={{ accentColor: accent }} />
                  <span className="text-xs font-bold text-white w-4 text-right">{difficulty}</span>
                </div>
              </div>
              <div>
                <Label>BPM</Label>
                <input type="number" value={bpm} onChange={e => setBpm(Math.max(30, Math.min(200, parseInt(e.target.value) || 80)))}
                  className="w-full px-2 py-1.5 rounded text-xs text-white text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', outline: 'none' }} />
              </div>
              <div>
                <Label>Bars</Label>
                <div className="flex gap-1">
                  {[4, 8, 16].map(b => (
                    <button key={b} onClick={() => setBars(b)}
                      className="flex-1 px-1 py-1.5 rounded text-[10px] font-medium transition-all cursor-pointer"
                      style={{
                        background: bars === b ? `${accent}15` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${bars === b ? `${accent}25` : 'rgba(255,255,255,0.03)'}`,
                        color: bars === b ? '#fff' : '#4b5563',
                      }}>{b}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <Label>Time Sig</Label>
              <div className="flex gap-1">
                {TIME_SIGS.map(ts => (
                  <button key={ts.join('/')} onClick={() => setTimeSig(ts)}
                    className="px-3 py-1.5 rounded text-[10px] font-medium transition-all cursor-pointer"
                    style={{
                      background: timeSig[0] === ts[0] && timeSig[1] === ts[1] ? `${accent}15` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${timeSig[0] === ts[0] && timeSig[1] === ts[1] ? `${accent}25` : 'rgba(255,255,255,0.03)'}`,
                      color: timeSig[0] === ts[0] && timeSig[1] === ts[1] ? '#fff' : '#4b5563',
                    }}>{ts[0]}/{ts[1]}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button onClick={handleGenerate} disabled={generating || !isConfigured || (mode === 'song' && !songName.trim())}
            className="w-full py-3.5 rounded-xl text-white font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${accent}, #8b5cf6)`, boxShadow: `0 4px 20px -4px rgba(167,139,250,0.4)` }}>
            {generating ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : (
              <><span className="text-lg">✨</span> Generate</>
            )}
          </button>

          {error && (
            <div className="px-3 py-2.5 rounded-lg text-xs text-rose-400 bg-rose-500/[0.06] border border-rose-500/15">{error}</div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-2xl border border-white/[0.04] p-4" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
              <Label>Recent ({history.length})</Label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {history.map((h, i) => (
                  <button key={i} onClick={() => { setPiece(h); setPieceKey(k => k + 1) }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-all cursor-pointer"
                    style={{ border: piece === h ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.03)' }}>
                    <div className="text-[11px] font-medium text-[#e2e8f0] truncate">{h.title}</div>
                    <div className="text-[9px] text-[#4b5563] truncate">{h.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel: Player ── */}
        <div>
          {piece ? (
            <div>
              {/* Piece info */}
              <div className="mb-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white truncate">{piece.title}</h2>
                  <p className="text-xs text-[#6b7280]">{piece.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Tag>Key: {piece.keySignature}</Tag>
                    <Tag>{piece.timeSignature[0]}/{piece.timeSignature[1]}</Tag>
                    <Tag>{piece.targetBpm} BPM</Tag>
                    <Tag>{piece.hands === 'both' ? 'Both hands' : piece.hands === 'right' ? 'RH' : 'LH'}</Tag>
                    <Tag>Lvl {piece.difficulty}</Tag>
                  </div>
                </div>
              </div>

              <PracticePlayer
                notes={piece.notes.length > 0 ? piece.notes : undefined}
                notesLeft={piece.notesLeft}
                chordsLeft={piece.chordsLeft}
                defaultBpm={piece.targetBpm}
                timeSignature={piece.timeSignature}
                resetKey={`studio-${pieceKey}`}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.04] p-12 lg:p-16 text-center" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.5) 0%, rgba(10,12,18,0.6) 100%)' }}>
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-lg font-bold text-white mb-2">Create Something</h3>
              <p className="text-sm text-[#6b7280] max-w-md mx-auto leading-relaxed">
                Choose a mode, set your parameters, and let Clara generate a custom piano piece for you.
                {!isConfigured && <><br /><br /><span className="text-amber-400">Add your API key in Settings to get started.</span></>}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[9px] uppercase tracking-widest text-[#4b5563] font-semibold mb-1.5">{children}</div>
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-0.5 rounded text-[9px] font-medium" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#6b7280' }}>{children}</span>
}
