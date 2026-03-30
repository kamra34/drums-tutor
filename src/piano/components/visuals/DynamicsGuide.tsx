import { useState } from 'react'

// ── Data ─────────────────────────────────────────────────────────────────────

interface DynamicMark {
  symbol: string
  name: string
  meaning: string
  level: number     // 1 (softest) to 7 (loudest)
  description: string
}

const DYNAMICS: DynamicMark[] = [
  { symbol: 'pp', name: 'Pianissimo', meaning: 'Very soft', level: 1, description: 'As quiet as possible while still being audible. Used for intimate, delicate passages. Requires excellent finger control.' },
  { symbol: 'p', name: 'Piano', meaning: 'Soft', level: 2, description: 'Soft and gentle. The default "quiet" dynamic. Think of a lullaby or a whispered conversation.' },
  { symbol: 'mp', name: 'Mezzo piano', meaning: 'Moderately soft', level: 3, description: 'Slightly softer than medium. A comfortable, relaxed volume — like normal conversation.' },
  { symbol: 'mf', name: 'Mezzo forte', meaning: 'Moderately loud', level: 4, description: 'The default dynamic when no marking is given. Clear, present, but not forceful.' },
  { symbol: 'f', name: 'Forte', meaning: 'Loud', level: 5, description: 'Strong and confident. Project the sound fully. Use arm weight, not just finger force.' },
  { symbol: 'ff', name: 'Fortissimo', meaning: 'Very loud', level: 6, description: 'Powerful and commanding. Full arm weight with firm fingers. Never bang — the tone should still be musical.' },
]

type Tab = 'dynamics' | 'tempo' | 'articulation'

interface TempoMark {
  term: string
  meaning: string
  bpmRange: string
}

const TEMPOS: TempoMark[] = [
  { term: 'Largo', meaning: 'Very slow and broad', bpmRange: '40-60' },
  { term: 'Adagio', meaning: 'Slow and expressive', bpmRange: '60-76' },
  { term: 'Andante', meaning: 'Walking pace', bpmRange: '76-108' },
  { term: 'Moderato', meaning: 'Moderate speed', bpmRange: '108-120' },
  { term: 'Allegro', meaning: 'Fast and lively', bpmRange: '120-156' },
  { term: 'Vivace', meaning: 'Very fast and vivid', bpmRange: '156-176' },
  { term: 'Presto', meaning: 'Extremely fast', bpmRange: '176-200' },
]

interface ArticulationMark {
  symbol: string
  name: string
  description: string
}

const ARTICULATIONS: ArticulationMark[] = [
  { symbol: '—', name: 'Legato (slur)', description: 'Connect notes smoothly with no gap between them. Hold each key until the next one is pressed. Like singing a phrase in one breath.' },
  { symbol: '·', name: 'Staccato', description: 'Short and detached. Release the key quickly — about half the written duration. Like raindrops or a bouncing ball.' },
  { symbol: '>', name: 'Accent', description: 'Play this note louder than surrounding notes. A brief emphasis — not a full dynamic change.' },
  { symbol: '𝄐', name: 'Fermata', description: 'Hold this note longer than its written value. The performer decides how long. Creates a moment of pause or suspense.' },
  { symbol: 'rit.', name: 'Ritardando', description: 'Gradually slow down. Often used approaching the end of a piece or section for an expressive conclusion.' },
  { symbol: 'cresc.', name: 'Crescendo', description: 'Gradually get louder. Often shown as a long hairpin opening to the right: < ' },
  { symbol: 'dim.', name: 'Diminuendo', description: 'Gradually get softer. Often shown as a hairpin closing to the right: >' },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function DynamicsGuide() {
  const [tab, setTab] = useState<Tab>('dynamics')
  const [hoveredDynamic, setHoveredDynamic] = useState<DynamicMark | null>(null)

  const accent = '#a78bfa'

  return (
    <div className="my-6 rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: '#0d1117' }}>
      <div className="px-5 pt-4 pb-2 flex items-center justify-between flex-wrap gap-2">
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accent }}>
          Musical Expression
        </span>
        <div className="flex gap-1">
          {(['dynamics', 'tempo', 'articulation'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize"
              style={{
                background: tab === t ? `${accent}20` : 'transparent',
                color: tab === t ? accent : '#6b7280',
                border: tab === t ? `1px solid ${accent}40` : '1px solid transparent',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'dynamics' && (
        <div className="px-5 pb-4">
          {/* Visual volume bar */}
          <div className="flex items-end gap-1 mb-4 h-24 px-2">
            {DYNAMICS.map((d) => {
              const isHovered = hoveredDynamic?.symbol === d.symbol
              const height = `${(d.level / 7) * 100}%`
              return (
                <div
                  key={d.symbol}
                  className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                  onMouseEnter={() => setHoveredDynamic(d)}
                  onMouseLeave={() => setHoveredDynamic(null)}
                >
                  <div className="w-full relative flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg transition-all duration-200"
                      style={{
                        height,
                        background: isHovered
                          ? `linear-gradient(180deg, ${accent}, ${accent}60)`
                          : `linear-gradient(180deg, ${accent}${Math.round(30 + d.level * 10).toString(16)}, ${accent}15)`,
                        boxShadow: isHovered ? `0 0 12px ${accent}40` : 'none',
                      }}
                    />
                  </div>
                  <span
                    className="text-sm font-bold font-serif italic transition-colors"
                    style={{ color: isHovered ? accent : '#6b7280' }}
                  >
                    {d.symbol}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between px-2 text-[10px] text-[#4b5563] mb-3">
            <span>Softest</span>
            <span>Loudest</span>
          </div>

          {/* Detail */}
          {hoveredDynamic && (
            <div className="px-4 py-3 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold font-serif italic" style={{ color: accent }}>{hoveredDynamic.symbol}</span>
                <span className="text-sm font-semibold text-white">{hoveredDynamic.name}</span>
                <span className="text-xs text-[#6b7280]">— {hoveredDynamic.meaning}</span>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">{hoveredDynamic.description}</p>
            </div>
          )}

          {!hoveredDynamic && (
            <div className="px-4 py-3 rounded-xl border border-white/[0.06] text-center" style={{ background: '#161b22' }}>
              <p className="text-xs text-[#4b5563]">Hover over a dynamic marking to see details</p>
            </div>
          )}
        </div>
      )}

      {tab === 'tempo' && (
        <div className="px-5 pb-4 space-y-1.5">
          {TEMPOS.map((t, i) => (
            <div key={t.term} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
              <div className="w-20 flex-shrink-0">
                <span className="text-sm font-semibold font-serif italic text-white">{t.term}</span>
              </div>
              <div className="flex-1">
                <span className="text-xs text-[#94a3b8]">{t.meaning}</span>
              </div>
              <div className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: `${accent}15`, color: accent }}>
                {t.bpmRange} BPM
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'articulation' && (
        <div className="px-5 pb-4 space-y-1.5">
          {ARTICULATIONS.map((a) => (
            <div key={a.name} className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
              <span className="text-xl w-8 text-center flex-shrink-0 font-serif" style={{ color: accent }}>{a.symbol}</span>
              <div>
                <span className="text-sm font-semibold text-white">{a.name}</span>
                <p className="text-xs text-[#6b7280] leading-relaxed mt-0.5">{a.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
