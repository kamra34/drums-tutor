import { useState, useRef, useCallback, useEffect } from 'react'
import { PatternData, HitValue } from '@drums/types/curriculum'
import { DrumPad } from '@drums/types/midi'
import { useAiStore } from '@shared/stores/useAiStore'
import { aiService } from '@drums/services/aiService'
import StaffNotationDisplay from '@drums/components/StaffNotationDisplay'

/** Extract first valid JSON object from a string that may contain extra text */
function extractJson(text: string): any | null {
  try { return JSON.parse(text.trim()) } catch {}
  const start = text.indexOf('{')
  if (start === -1) return null
  for (let end = text.lastIndexOf('}'); end > start; end = text.lastIndexOf('}', end - 1)) {
    try { return JSON.parse(text.substring(start, end + 1)) } catch { continue }
  }
  return null
}

interface Props {
  onPatternGenerated: (pattern: PatternData, title: string, config: {
    bpm: number; bars: number; timeSig: [number, number]; difficulty: number; isAi: boolean
  }) => void
}

export default function ScanTab({ onPatternGenerated }: Props) {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Detected / result state
  const [generatedPattern, setGeneratedPattern] = useState<PatternData | null>(null)
  const [generatedTitle, setGeneratedTitle] = useState('')
  const [detectedInfo, setDetectedInfo] = useState<{
    bpm: number; bars: number; timeSig: [number, number]; subdivisions: number; description: string
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isConfigured, apiKey } = useAiStore()

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, etc.)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large (max 10MB)')
      return
    }
    setError(null)
    setGeneratedPattern(null)
    setDetectedInfo(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageDataUri(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  // Listen for paste globally so Ctrl+V works anywhere on the page
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) handleFile(file)
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleFile])

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleScan() {
    if (!imageDataUri || !isConfigured || !apiKey) return
    setScanning(true)
    setError(null)
    try {
      aiService.setApiKey(apiKey)
      const text = await aiService.scanNotation(imageDataUri)

      const parsed = extractJson(text)
      if (!parsed) throw new Error('Could not extract notation from image')

      // Read AI-detected parameters
      const timeSig: [number, number] = Array.isArray(parsed.timeSignature) && parsed.timeSignature.length === 2
        ? parsed.timeSignature as [number, number]
        : [4, 4]
      const subdivisions = parsed.subdivisions === 2 || parsed.subdivisions === 4 ? parsed.subdivisions : 4
      const bars = typeof parsed.bars === 'number' && parsed.bars >= 1 ? parsed.bars : 1
      const bpm = typeof parsed.bpm === 'number' ? Math.max(30, Math.min(300, parsed.bpm)) : 90
      const beats = timeSig[0]
      const totalSlots = beats * subdivisions * bars

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
          if (arr.some(v => v > 0)) tracks[padId as DrumPad] = arr
        }
      }

      if (Object.keys(tracks).length === 0) {
        throw new Error('No notes detected in the image. Try a clearer photo.')
      }

      const title = parsed.title || 'Scanned Pattern'
      const description = parsed.description || ''
      const pattern: PatternData = { beats, subdivisions, tracks }

      setGeneratedPattern(pattern)
      setGeneratedTitle(title)
      setDetectedInfo({ bpm, bars, timeSig, subdivisions, description })
      onPatternGenerated(pattern, title, {
        bpm, bars, timeSig, difficulty: 5, isAi: true,
      })
    } catch (e: any) {
      console.error('Scan failed:', e)
      setError(e.message || 'Failed to scan notation from image')
    }
    setScanning(false)
  }

  function clearImage() {
    setImageDataUri(null)
    setGeneratedPattern(null)
    setGeneratedTitle('')
    setDetectedInfo(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Build full multi-bar display pattern
  const displayPattern = generatedPattern && detectedInfo && detectedInfo.bars > 1
    ? { beats: generatedPattern.beats * detectedInfo.bars, subdivisions: generatedPattern.subdivisions, tracks: generatedPattern.tracks }
    : generatedPattern

  return (
    <div className="space-y-5">
      {/* API key warning */}
      {!isConfigured && (
        <div className="rounded-xl p-4 border border-amber-500/15 bg-amber-500/[0.04] flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm text-amber-400 font-medium">API key required</p>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Scan uses Claude Vision to read sheet music. Add your Anthropic API key in Settings.
            </p>
          </div>
        </div>
      )}

      {/* ── Image upload area ── */}
      <div className="rounded-2xl border border-white/[0.04] overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
      }}>
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <span className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">Sheet Music Image</span>
        </div>

        <div className="p-5">
          {!imageDataUri ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-violet-500/50 bg-violet-500/[0.05]'
                  : 'border-white/[0.08] hover:border-violet-500/30 hover:bg-white/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/[0.08] border border-violet-500/15 flex items-center justify-center">
                  <svg className="w-8 h-8 text-violet-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Drop an image here or click to browse</p>
                  <p className="text-xs text-[#4b5563] mt-1">PNG, JPG, or paste from clipboard (Ctrl+V)</p>
                  <p className="text-xs text-[#374151] mt-2">AI will automatically detect time signature, bars, resolution, and instruments</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image preview */}
              <div className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-white">
                <img
                  src={imageDataUri}
                  alt="Sheet music"
                  className="w-full max-h-[400px] object-contain"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white/80 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scan button */}
              <button
                onClick={handleScan}
                disabled={scanning || !isConfigured}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 20px -4px rgba(124,58,237,0.4)' }}
              >
                {scanning ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Analyzing notation...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                    Scan with AI
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-3 border border-rose-500/15 bg-rose-500/[0.04] text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* ── Detected info chips ── */}
      {detectedInfo && (
        <div className="rounded-2xl p-4 border border-violet-500/10 bg-violet-500/[0.03]">
          <div className="text-[10px] font-semibold text-violet-400/60 uppercase tracking-widest mb-2">AI Detected</div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/[0.06] text-[#94a3b8]">
              {detectedInfo.timeSig.join('/')} time
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/[0.06] text-[#94a3b8]">
              {detectedInfo.bars} bar{detectedInfo.bars > 1 ? 's' : ''}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/[0.06] text-[#94a3b8]">
              {detectedInfo.subdivisions === 4 ? '16th note' : '8th note'} resolution
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/[0.06] text-[#94a3b8]">
              ~{detectedInfo.bpm} BPM
            </span>
            {detectedInfo.description && (
              <span className="px-2.5 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/[0.06] text-[#6b7280] italic">
                {detectedInfo.description}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Scanned result ── */}
      {displayPattern && detectedInfo && (
        <div className="rounded-2xl p-5 border border-white/[0.04]" style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
        }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">Scanned Result</span>
              {generatedTitle && (
                <span className="text-xs text-violet-400/70 font-medium">{generatedTitle}</span>
              )}
            </div>
          </div>
          <StaffNotationDisplay
            pattern={displayPattern}
            bpm={detectedInfo.bpm}
            bars={1}
            beatsPerBar={detectedInfo.timeSig[0]}
            onBpmChange={() => {}}
          />
        </div>
      )}
    </div>
  )
}
