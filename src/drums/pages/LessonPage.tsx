import { useParams, Link, useNavigate } from 'react-router-dom'
import { getLessonById, getModuleById } from '@drums/data/curriculum'
import { useUserStore } from '@shared/stores/useUserStore'
import LessonBlockRenderer from '@drums/components/curriculum/LessonBlockRenderer'

export default function LessonPage() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>()
  const navigate = useNavigate()
  const { completeLesson, isLessonCompleted } = useUserStore()

  const module = moduleId ? getModuleById(moduleId) : undefined
  const lesson = lessonId ? getLessonById(lessonId) : undefined

  if (!module || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#06080d' }}>
        <div
          className="rounded-2xl p-8 border border-white/[0.04] text-center max-w-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
          }}
        >
          <svg className="w-10 h-10 mx-auto mb-4 text-[#4b5563]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-[#6b7280] text-sm mb-3">Lesson not found.</p>
          <Link to="/curriculum" className="text-amber-500/80 hover:text-amber-400 text-sm transition-colors">
            Back to curriculum
          </Link>
        </div>
      </div>
    )
  }

  const isCompleted = isLessonCompleted(lesson.id)

  // Find prev/next lesson in module
  const sorted = [...module.lessons].sort((a, b) => a.order - b.order)
  const idx = sorted.findIndex((l) => l.id === lesson.id)
  const prevLesson = idx > 0 ? sorted[idx - 1] : null
  const nextLesson = idx < sorted.length - 1 ? sorted[idx + 1] : null

  // First exercise in this module
  const firstExercise = module.exercises[0]

  function handleComplete() {
    completeLesson(lesson!.id)
    if (nextLesson) {
      navigate(`/lesson/${module!.id}/${nextLesson.id}`)
    } else if (firstExercise) {
      navigate(`/exercise/${module!.id}/${firstExercise.id}`)
    } else {
      navigate('/curriculum')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#06080d' }}>
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#4b5563] mb-8">
          <Link to="/curriculum" className="text-[#6b7280] hover:text-amber-400 transition-colors">
            Curriculum
          </Link>
          <svg className="w-3.5 h-3.5 text-[#4b5563]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <Link
            to="/curriculum"
            state={{ expandModule: module.id }}
            className="text-[#6b7280] hover:text-amber-400 transition-colors"
          >
            {module.name}
          </Link>
          <svg className="w-3.5 h-3.5 text-[#4b5563]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#94a3b8]">{lesson.title}</span>
        </nav>

        {/* Lesson header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {isCompleted && (
              <span
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium text-emerald-400"
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Completed
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{lesson.title}</h1>
        </div>

        {/* Lesson content */}
        <div className="mb-10">
          <LessonBlockRenderer blocks={lesson.content} lessonId={lesson.id} />
        </div>

        {/* Navigation footer */}
        <div className="border-t border-white/[0.04] pt-6 flex items-center justify-between">
          <div>
            {prevLesson && (
              <Link
                to={`/lesson/${module.id}/${prevLesson.id}`}
                className="group flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#94a3b8] transition-colors"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>{prevLesson.title}</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleComplete}
              className={`group flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isCompleted
                  ? 'bg-white/[0.04] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.07]'
                  : 'text-white'
              }`}
              style={
                !isCompleted
                  ? {
                      background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                      boxShadow: '0 4px 20px -4px rgba(245,158,11,0.35)',
                    }
                  : undefined
              }
            >
              <span>
                {isCompleted
                  ? nextLesson
                    ? 'Next lesson'
                    : firstExercise
                    ? 'Go to exercises'
                    : 'Back to curriculum'
                  : nextLesson
                  ? 'Mark complete & continue'
                  : firstExercise
                  ? 'Mark complete & practice'
                  : 'Mark as complete'}
              </span>
              {(nextLesson || firstExercise || isCompleted) && (
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
