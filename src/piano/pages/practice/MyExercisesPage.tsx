import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiListExercises, apiDeleteExercise, type DbExercise } from '@shared/services/apiClient'
import { useAuthStore } from '@shared/stores/useAuthStore'

const accent = '#a78bfa'

export default function MyExercisesPage() {
  const { user } = useAuthStore()
  const [exercises, setExercises] = useState<DbExercise[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    try {
      const res = await apiListExercises({ category: 'piano-studio', instrument: 'piano' })
      setExercises(res.exercises)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [user])

  const handleDelete = async (id: string) => {
    try { await apiDeleteExercise(id); setExercises(prev => prev.filter(e => e.id !== id)) } catch { /* ignore */ }
  }

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 max-w-[1800px] mx-auto">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Link to="/piano/practice" className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center transition-all">
          <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">My Exercises</h1>
          <p className="text-xs text-[#6b7280]">Custom and AI-generated exercises from the Studio</p>
        </div>
        <Link to="/piano/studio"
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/15 transition-colors">
          + Create New
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#4b5563] text-sm">Loading...</div>
      ) : exercises.length === 0 ? (
        <div className="rounded-xl border border-white/[0.04] p-8 sm:p-12 text-center" style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.5) 0%, rgba(10,12,18,0.6) 100%)' }}>
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-2">No exercises yet</h3>
          <p className="text-sm text-[#6b7280] mb-4">Create exercises in the Studio — they'll appear here for practice.</p>
          <Link to="/piano/studio" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: `linear-gradient(135deg, ${accent}, #8b5cf6)` }}>
            Go to Studio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {exercises.map(ex => (
            <div key={ex.id} className="rounded-xl border border-white/[0.04] p-4 transition-all hover:border-white/[0.08] group"
              style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-bold text-white truncate flex-1">{ex.title}</h3>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to={`/piano/studio/${ex.id}`}
                    className="w-6 h-6 rounded bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                    title="Edit">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </Link>
                  <button onClick={() => handleDelete(ex.id)}
                    className="w-6 h-6 rounded bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#6b7280] hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              {ex.description && <p className="text-[10px] text-[#4b5563] mb-3 line-clamp-2">{ex.description}</p>}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/[0.04] border border-white/[0.06] text-[#6b7280]">{ex.bpm} BPM</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/[0.04] border border-white/[0.06] text-[#6b7280]">{(ex.timeSignature || [4,4]).join('/')}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${ex.isAiGenerated ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  {ex.isAiGenerated ? 'AI' : 'Custom'}
                </span>
              </div>
              <Link to={`/piano/practice/my-exercises/${ex.id}`}
                className="block w-full py-2 rounded-lg text-center text-[11px] font-semibold transition-all hover:brightness-110"
                style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}>
                Practice
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
