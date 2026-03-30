import { useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { getRepertoirePiece } from '@piano/data/repertoire'
import PracticePlayer from '@piano/components/PracticePlayer'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'
import SelfAssessment from './SelfAssessment'

const DIFF_COLORS = ['', '#22c55e', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444']

export default function RepertoirePlayerPage() {
  const { pieceId } = useParams<{ pieceId: string }>()
  const piece = pieceId ? getRepertoirePiece(pieceId) : undefined
  const { addPracticeTime } = usePianoProgressStore()
  const [sessionCount, setSessionCount] = useState(0)
  const [showAssessment, setShowAssessment] = useState(false)

  if (!piece) return <Navigate to="/piano/practice/songs" replace />

  if (showAssessment) {
    return <SelfAssessment exerciseName={piece.title} sessionCount={sessionCount}
      onDone={() => { setShowAssessment(false); setSessionCount(0) }} />
  }

  const dc = DIFF_COLORS[piece.difficulty] || '#6b7280'

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#4b5563] mb-5">
        <Link to="/piano/practice" className="hover:text-[#a78bfa] transition-colors">Practice</Link>
        <Chev />
        <Link to="/piano/practice/songs" className="hover:text-[#a78bfa] transition-colors">Songs</Link>
        <Chev />
        <span className="text-[#94a3b8] truncate">{piece.title}</span>
      </nav>

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden mb-5" style={{
        background: 'linear-gradient(135deg, rgba(167,139,250,0.06) 0%, rgba(139,92,246,0.03) 50%, rgba(12,14,20,0.8) 100%)',
        border: '1px solid rgba(167,139,250,0.1)',
      }}>
        <div className="relative p-5 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">{piece.title}</h1>
              <p className="text-sm text-[#6b7280] mt-0.5">{piece.composer}</p>
              <p className="text-xs text-[#4b5563] mt-1">{piece.description}</p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black"
                style={{ background: `${dc}15`, border: `1px solid ${dc}30`, color: dc }}>{piece.difficulty}</div>
              <span className="text-[9px] uppercase tracking-wider text-[#4b5563]">Level</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Tag>Key: {piece.keySignature}</Tag>
            <Tag>{piece.timeSignature[0]}/{piece.timeSignature[1]} time</Tag>
            <Tag>{piece.handsRequired === 'right' ? 'Right hand' : piece.handsRequired === 'left' ? 'Left hand' : 'Both hands'}</Tag>
            <Tag capitalize>{piece.category}</Tag>
          </div>
          {sessionCount >= 1 && (
            <button onClick={() => { addPracticeTime(Math.max(1, sessionCount)); setShowAssessment(true) }}
              className="mt-3 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all cursor-pointer">
              Self-Assess ({sessionCount}x done)
            </button>
          )}
        </div>
      </div>

      {/* Player */}
      <PracticePlayer
        notes={piece.notes}
        notesLeft={piece.notesLeft}
        chordsLeft={piece.chordsLeft}
        defaultBpm={piece.targetBpm}
        timeSignature={piece.timeSignature}
        resetKey={piece.id}
        onSessionComplete={() => setSessionCount(c => c + 1)}
      />
    </div>
  )
}

function Chev() { return <svg className="w-3 h-3 text-[#2d3748] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg> }
function Tag({ children, capitalize }: { children: React.ReactNode; capitalize?: boolean }) { return <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium ${capitalize ? 'capitalize' : ''}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#6b7280' }}>{children}</span> }
