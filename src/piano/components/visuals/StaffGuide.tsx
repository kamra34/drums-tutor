import { useState } from 'react'

// ── Note position data ───────────────────────────────────────────────────────

interface StaffNote {
  name: string
  label: string
  clef: 'treble' | 'bass'
  lineY: number         // Y position on staff (0 = top line)
  ledgerLines?: number  // extra lines needed (positive = below, negative = above)
  mnemonic?: string
  isSpace: boolean
}

const TREBLE_NOTES: StaffNote[] = [
  { name: 'F5', label: 'F', clef: 'treble', lineY: 0, isSpace: false, mnemonic: 'First line from top' },
  { name: 'E5', label: 'E', clef: 'treble', lineY: 5, isSpace: true },
  { name: 'D5', label: 'D', clef: 'treble', lineY: 10, isSpace: false },
  { name: 'C5', label: 'C', clef: 'treble', lineY: 15, isSpace: true },
  { name: 'B4', label: 'B', clef: 'treble', lineY: 20, isSpace: false },
  { name: 'A4', label: 'A', clef: 'treble', lineY: 25, isSpace: true },
  { name: 'G4', label: 'G', clef: 'treble', lineY: 30, isSpace: false },
  { name: 'F4', label: 'F', clef: 'treble', lineY: 35, isSpace: true },
  { name: 'E4', label: 'E', clef: 'treble', lineY: 40, isSpace: false, mnemonic: 'Bottom line' },
  { name: 'D4', label: 'D', clef: 'treble', lineY: 45, isSpace: true },
  { name: 'C4', label: 'C (Middle C)', clef: 'treble', lineY: 50, isSpace: false, ledgerLines: 1 },
]

const BASS_NOTES: StaffNote[] = [
  { name: 'A3', label: 'A', clef: 'bass', lineY: 0, isSpace: false, mnemonic: 'Top line' },
  { name: 'G3', label: 'G', clef: 'bass', lineY: 5, isSpace: true },
  { name: 'F3', label: 'F', clef: 'bass', lineY: 10, isSpace: false },
  { name: 'E3', label: 'E', clef: 'bass', lineY: 15, isSpace: true },
  { name: 'D3', label: 'D', clef: 'bass', lineY: 20, isSpace: false },
  { name: 'C3', label: 'C', clef: 'bass', lineY: 25, isSpace: true },
  { name: 'B2', label: 'B', clef: 'bass', lineY: 30, isSpace: false },
  { name: 'A2', label: 'A', clef: 'bass', lineY: 35, isSpace: true },
  { name: 'G2', label: 'G', clef: 'bass', lineY: 40, isSpace: false, mnemonic: 'Bottom line' },
]

type Tab = 'treble' | 'bass' | 'grand'

const MNEMONICS = {
  treble: {
    lines: 'Every Good Boy Does Fine (E-G-B-D-F)',
    spaces: 'F-A-C-E spells "FACE"',
  },
  bass: {
    lines: 'Good Boys Do Fine Always (G-B-D-F-A)',
    spaces: 'All Cows Eat Grass (A-C-E-G)',
  },
}

// ── Component ────────────────────────────────────────────────────────────────

export default function StaffGuide() {
  const [tab, setTab] = useState<Tab>('grand')
  const [hovered, setHovered] = useState<StaffNote | null>(null)

  const accent = '#a78bfa'
  const lineColor = '#374151'

  return (
    <div className="my-6 rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: '#0d1117' }}>
      <div className="px-5 pt-4 pb-2 flex items-center justify-between flex-wrap gap-2">
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accent }}>
          The Grand Staff
        </span>
        <div className="flex gap-1">
          {(['grand', 'treble', 'bass'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              style={{
                background: tab === t ? `${accent}20` : 'transparent',
                color: tab === t ? accent : '#6b7280',
                border: tab === t ? `1px solid ${accent}40` : '1px solid transparent',
              }}
            >
              {t === 'grand' ? 'Grand Staff' : t === 'treble' ? 'Treble Clef' : 'Bass Clef'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-2 overflow-x-auto">
        <svg
          viewBox={`0 0 520 ${tab === 'grand' ? 260 : 140}`}
          className="mx-auto w-full"
          style={{ maxWidth: 520, height: 'auto' }}
        >
          {(tab === 'treble' || tab === 'grand') && (
            <g transform={`translate(60, ${tab === 'grand' ? 20 : 20})`}>
              {/* Treble clef label */}
              <text x={-45} y={28} fill={accent} fontSize={36} fontFamily="serif" fontWeight={700}>𝄞</text>
              {/* Staff lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1={0} y1={i * 10} x2={420} y2={i * 10} stroke={lineColor} strokeWidth={0.8} />
              ))}
              {/* Notes */}
              {TREBLE_NOTES.map((n) => {
                const isActive = hovered?.name === n.name
                const noteX = 30 + TREBLE_NOTES.indexOf(n) * 37
                return (
                  <g
                    key={n.name}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Ledger line for middle C */}
                    {n.ledgerLines && (
                      <line x1={noteX - 12} y1={n.lineY} x2={noteX + 12} y2={n.lineY} stroke={lineColor} strokeWidth={0.8} />
                    )}
                    <ellipse
                      cx={noteX}
                      cy={n.lineY}
                      rx={6}
                      ry={4.5}
                      fill={isActive ? accent : n.isSpace ? '#6366f1' : '#94a3b8'}
                      opacity={isActive ? 1 : 0.8}
                      transform={`rotate(-15, ${noteX}, ${n.lineY})`}
                    />
                    <text
                      x={noteX}
                      y={n.lineY + (n.lineY < 20 ? -10 : 14)}
                      textAnchor="middle"
                      fill={isActive ? accent : '#6b7280'}
                      fontSize={9}
                      fontWeight={isActive ? 700 : 500}
                      fontFamily="system-ui"
                    >
                      {n.label}
                    </text>
                  </g>
                )
              })}
            </g>
          )}

          {(tab === 'bass' || tab === 'grand') && (
            <g transform={`translate(60, ${tab === 'grand' ? 150 : 20})`}>
              {/* Bass clef label */}
              <text x={-45} y={28} fill={accent} fontSize={32} fontFamily="serif" fontWeight={700}>𝄢</text>
              {/* Staff lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1={0} y1={i * 10} x2={420} y2={i * 10} stroke={lineColor} strokeWidth={0.8} />
              ))}
              {/* Notes */}
              {BASS_NOTES.map((n) => {
                const isActive = hovered?.name === n.name
                const noteX = 30 + BASS_NOTES.indexOf(n) * 46
                return (
                  <g
                    key={n.name}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <ellipse
                      cx={noteX}
                      cy={n.lineY}
                      rx={6}
                      ry={4.5}
                      fill={isActive ? accent : n.isSpace ? '#8b5cf6' : '#94a3b8'}
                      opacity={isActive ? 1 : 0.8}
                      transform={`rotate(-15, ${noteX}, ${n.lineY})`}
                    />
                    <text
                      x={noteX}
                      y={n.lineY + (n.lineY < 20 ? -10 : 14)}
                      textAnchor="middle"
                      fill={isActive ? accent : '#6b7280'}
                      fontSize={9}
                      fontWeight={isActive ? 700 : 500}
                      fontFamily="system-ui"
                    >
                      {n.label}
                    </text>
                  </g>
                )
              })}
            </g>
          )}

          {/* Grand staff brace */}
          {tab === 'grand' && (
            <g>
              <line x1={59} y1={20} x2={59} y2={190} stroke={lineColor} strokeWidth={2} />
              <text x={12} y={120} fill="#4b5563" fontSize={100} fontFamily="serif" opacity={0.3}>{'{'}</text>
            </g>
          )}
        </svg>
      </div>

      {/* Hovered note info */}
      {hovered && (
        <div className="mx-5 mb-3 px-4 py-2.5 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold" style={{ color: accent }}>{hovered.label}</span>
            <span className="text-xs text-[#6b7280]">
              {hovered.clef === 'treble' ? 'Treble' : 'Bass'} clef
              {' — '}
              {hovered.isSpace ? 'space note' : 'line note'}
            </span>
          </div>
          {hovered.mnemonic && (
            <p className="text-xs text-[#4b5563] mt-1">{hovered.mnemonic}</p>
          )}
        </div>
      )}

      {/* Mnemonics */}
      {(tab === 'treble' || tab === 'bass') && (
        <div className="mx-5 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="px-3 py-2.5 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
            <div className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1">Lines</div>
            <div className="text-xs text-[#94a3b8]">{MNEMONICS[tab].lines}</div>
          </div>
          <div className="px-3 py-2.5 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
            <div className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1">Spaces</div>
            <div className="text-xs text-[#94a3b8]">{MNEMONICS[tab].spaces}</div>
          </div>
        </div>
      )}

      {tab === 'grand' && (
        <div className="mx-5 mb-4 px-3 py-2.5 rounded-xl border border-white/[0.06]" style={{ background: '#161b22' }}>
          <div className="text-xs text-[#94a3b8]">
            <span className="font-medium text-white">Middle C</span> sits on a ledger line between the two staves — it connects treble (right hand) and bass (left hand).
          </div>
        </div>
      )}
    </div>
  )
}
