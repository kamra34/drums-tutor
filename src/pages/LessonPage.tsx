import { useParams, Link, useNavigate } from 'react-router-dom'
import { getLessonById, getModuleById } from '../data/curriculum'
import { useUserStore } from '../stores/useUserStore'
import LessonBlockRenderer from '../components/curriculum/LessonBlockRenderer'

export default function LessonPage() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>()
  const navigate = useNavigate()
  const { completeLesson, isLessonCompleted } = useUserStore()

  const module = moduleId ? getModuleById(moduleId) : undefined
  const lesson = lessonId ? getLessonById(lessonId) : undefined

  if (!module || !lesson) {
    return (
      <div className="p-8 text-center text-[#6b7280]">
        Lesson not found.{' '}
        <Link to="/curriculum" className="text-violet-500 hover:underline">
          Back to curriculum
        </Link>
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
    <div className="p-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-8">
        <Link to="/curriculum" className="hover:text-violet-400">Curriculum</Link>
        <span>›</span>
        <Link to="/curriculum" state={{ expandModule: module.id }} className="text-[#6b7280] hover:text-violet-400 transition-colors">
          {module.name}
        </Link>
        <span>›</span>
        <span className="text-[#94a3b8]">{lesson.title}</span>
      </nav>

      {/* Lesson header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {isCompleted && (
            <span className="bg-violet-900/50 text-violet-300 text-xs px-2 py-0.5 rounded-full border border-violet-800/50">
              ✓ Completed
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-white">{lesson.title}</h1>
      </div>

      {/* Lesson content */}
      <div className="mb-10">
        <LessonBlockRenderer blocks={lesson.content} lessonId={lesson.id} />
      </div>

      {/* Navigation footer */}
      <div className="border-t border-[#1e2433] pt-6 flex items-center justify-between">
        <div>
          {prevLesson && (
            <Link
              to={`/lesson/${module.id}/${prevLesson.id}`}
              className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#94a3b8] transition-colors"
            >
              <span>←</span>
              <span>{prevLesson.title}</span>
            </Link>
          )}
        </div>

        <button
          onClick={handleComplete}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isCompleted
              ? 'bg-[#1a1f2e] text-[#94a3b8] hover:bg-[#252b3b]'
              : 'bg-violet-600 text-white hover:bg-violet-500'
          }`}
        >
          {isCompleted
            ? nextLesson
              ? 'Next lesson →'
              : firstExercise
              ? 'Go to exercises →'
              : 'Back to curriculum'
            : nextLesson
            ? 'Mark complete & continue →'
            : firstExercise
            ? 'Mark complete & practice →'
            : 'Mark as complete'}
        </button>
      </div>
    </div>
  )
}
