import { useState, useEffect } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { apiGetExercise } from '@shared/services/apiClient'
import PracticePlayer from '@piano/components/PracticePlayer'
import type { NoteEvent, ChordEvent } from '@piano/types/curriculum'

export default function MyExercisePlayerPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState<NoteEvent[]>([])
  const [notesLeft, setNotesLeft] = useState<NoteEvent[] | undefined>()
  const [chordsLeft, setChordsLeft] = useState<ChordEvent[] | undefined>()
  const [bpm, setBpm] = useState(80)
  const [timeSig, setTimeSig] = useState<[number, number]>([4, 4])
  const [keySig, setKeySig] = useState('C')
  const [hands, setHands] = useState<string>('right')
  const [isAi, setIsAi] = useState(false)

  useEffect(() => {
    if (!exerciseId) return
    ;(async () => {
      try {
        const res = await apiGetExercise(exerciseId)
        const ex = res.exercise
        const pd = ex.patternData as any
        setTitle(ex.title)
        setDescription(ex.description)
        setNotes(pd.notes || [])
        setNotesLeft(pd.notesLeft)
        setChordsLeft(pd.chordsLeft)
        setBpm(ex.bpm || 80)
        setTimeSig((ex.timeSignature as [number, number]) || [4, 4])
        setKeySig(pd.keySignature || 'C')
        setHands(pd.hands || 'right')
        setIsAi(ex.isAiGenerated)
      } catch {
        setError('Exercise not found')
      } finally {
        setLoading(false)
      }
    })()
  }, [exerciseId])

  if (!exerciseId) return <Navigate to="/piano/practice/my-exercises" replace />

  if (loading) return <div className="p-8 text-center text-[#4b5563]">Loading...</div>
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-rose-400 text-sm mb-3">{error}</p>
      <Link to="/piano/practice/my-exercises" className="text-violet-400 text-sm hover:underline">Back to My Exercises</Link>
    </div>
  )

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 max-w-[1800px] mx-auto">
      <nav className="flex items-center gap-1.5 text-xs text-[#4b5563] mb-3 sm:mb-5">
        <Link to="/piano/practice" className="hover:text-[#a78bfa] transition-colors">Practice</Link>
        <Chev />
        <Link to="/piano/practice/my-exercises" className="hover:text-[#a78bfa] transition-colors">My Exercises</Link>
        <Chev />
        <span className="text-[#94a3b8] truncate">{title}</span>
      </nav>

      <div className="relative rounded-xl sm:rounded-2xl overflow-hidden mb-4" style={{
        background: 'linear-gradient(135deg, rgba(167,139,250,0.06) 0%, rgba(139,92,246,0.03) 50%, rgba(12,14,20,0.8) 100%)',
        border: '1px solid rgba(167,139,250,0.1)',
      }}>
        <div className="relative p-3 sm:p-4 md:p-5 lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white tracking-tight">{title}</h1>
              {description && <p className="text-xs text-[#6b7280] mt-1">{description}</p>}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Tag>Key: {keySig}</Tag>
                <Tag>{timeSig[0]}/{timeSig[1]}</Tag>
                <Tag>{bpm} BPM</Tag>
                <Tag>{hands === 'both' ? 'Both hands' : hands === 'right' ? 'RH' : 'LH'}</Tag>
                <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${isAi ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  {isAi ? 'AI Generated' : 'Custom Built'}
                </span>
              </div>
            </div>
            <Link to={`/piano/studio/${exerciseId}`}
              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-[#6b7280] border border-white/[0.06] hover:text-white hover:bg-white/[0.04] transition-colors flex-shrink-0">
              Edit in Studio
            </Link>
          </div>
        </div>
      </div>

      <PracticePlayer
        notes={notes.length > 0 ? notes : undefined}
        notesLeft={notesLeft}
        chordsLeft={chordsLeft}
        defaultBpm={bpm}
        timeSignature={timeSig}
        resetKey={`my-${exerciseId}`}
      />
    </div>
  )
}

function Chev() { return <svg className="w-3 h-3 text-[#2d3748] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg> }
function Tag({ children }: { children: React.ReactNode }) { return <span className="px-2 py-0.5 rounded text-[9px] font-medium" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#6b7280' }}>{children}</span> }
