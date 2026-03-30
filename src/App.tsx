import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@shared/stores/useAuthStore'
import AppLayout from '@shared/components/layout/AppLayout'
import InstrumentLayout from '@shared/components/layout/InstrumentLayout'
import AuthPage from '@shared/pages/AuthPage'
import LandingPage from '@shared/pages/LandingPage'
import SettingsPage from '@shared/pages/SettingsPage'
import AdminPage from '@shared/pages/AdminPage'

// ── Drum pages ───────────────────────────────────────────────────────────────
import DrumDashboard from '@drums/pages/DashboardPage'
import CurriculumPage from '@drums/pages/CurriculumPage'
import LessonPage from '@drums/pages/LessonPage'
import ExercisePage from '@drums/pages/ExercisePage'
import DrumChatPage from '@drums/pages/ChatPage'
import PracticeHubPage from '@drums/pages/PracticeHubPage'
import ReadingPracticePage from '@drums/pages/practice/ReadingPracticePage'
import BeatsPracticePage from '@drums/pages/practice/BeatsPracticePage'
import RudimentsPracticePage from '@drums/pages/practice/RudimentsPracticePage'
import FillsPracticePage from '@drums/pages/practice/FillsPracticePage'
import DailyPracticePage from '@drums/pages/practice/DailyPracticePage'
import FreePlayPage from '@drums/pages/practice/FreePlayPage'
import PracticePlayerPage from '@drums/pages/practice/PracticePlayerPage'
import DrumPlaceholderPage from '@drums/pages/practice/PlaceholderPage'
import StudioPage from '@drums/pages/studio/StudioPage'

// ── Piano pages ──────────────────────────────────────────────────────────────
import PianoDashboard from '@piano/pages/DashboardPage'
import PianoCurriculumPage from '@piano/pages/CurriculumPage'
import PianoLessonPage from '@piano/pages/LessonPage'
import PianoPracticeHubPage from '@piano/pages/PracticeHubPage'
import ScalePracticePage from '@piano/pages/practice/ScalePracticePage'
import ChordPracticePage from '@piano/pages/practice/ChordPracticePage'
import ExerciseBrowserPage from '@piano/pages/practice/ExerciseBrowserPage'
import RepertoireBrowserPage from '@piano/pages/practice/RepertoireBrowserPage'
import RepertoirePlayerPage from '@piano/pages/practice/RepertoirePlayerPage'
import SightReadingPage from '@piano/pages/practice/SightReadingPage'
import EarTrainingPage from '@piano/pages/practice/EarTrainingPage'
import PianoStudioPage from '@piano/pages/StudioPage'
import PianoExercisePage from '@piano/pages/ExercisePage'
import MyExercisesPage from '@piano/pages/practice/MyExercisesPage'
import MyExercisePlayerPage from '@piano/pages/practice/MyExercisePlayerPage'

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => { checkAuth() }, [])

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#06080d] flex items-center justify-center" style={{ zIndex: 50 }}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-amber-500/40 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🎵</span>
            </div>
          </div>
          <div className="text-[#6b7280] text-sm tracking-wide">Loading...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing — instrument selector */}
        <Route index element={<LandingPage />} />

        {/* ── Drums ── */}
        <Route path="drums" element={<InstrumentLayout />}>
          <Route element={<AppLayout />}>
            <Route index element={<DrumDashboard />} />
            <Route path="curriculum" element={<CurriculumPage />} />
            <Route path="lesson/:moduleId/:lessonId" element={<LessonPage />} />
            <Route path="exercise/:moduleId/:exerciseId" element={<ExercisePage />} />
            <Route path="practice" element={<PracticeHubPage />} />
            <Route path="practice/reading" element={<ReadingPracticePage />} />
            <Route path="practice/beats" element={<BeatsPracticePage />} />
            <Route path="practice/rudiments" element={<RudimentsPracticePage />} />
            <Route path="practice/fills" element={<FillsPracticePage />} />
            <Route path="practice/daily" element={<DailyPracticePage />} />
            <Route path="practice/freeplay" element={<FreePlayPage />} />
            <Route path="practice/play/:itemId" element={<PracticePlayerPage />} />
            <Route path="practice/sight-reading" element={
              <DrumPlaceholderPage title="Sight-Reading" icon="👁" description="Random notation appears on screen. Read and execute cold — the ultimate real-world skill test." />
            } />
            <Route path="practice/songs" element={
              <DrumPlaceholderPage title="Song Charts" icon="📄" description="Full song structures with repeats, sections, dynamics, and roadmaps." />
            } />
            <Route path="studio" element={<StudioPage />} />
            <Route path="studio/:id" element={<StudioPage />} />
            <Route path="chat" element={<DrumChatPage />} />
          </Route>
        </Route>

        {/* ── Piano ── */}
        <Route path="piano" element={<InstrumentLayout />}>
          <Route element={<AppLayout />}>
            <Route index element={<PianoDashboard />} />
            <Route path="curriculum" element={<PianoCurriculumPage />} />
            <Route path="lesson/:moduleId/:lessonId" element={<PianoLessonPage />} />
            <Route path="exercise/:moduleId/:exerciseId" element={<PianoExercisePage />} />
            <Route path="practice" element={<PianoPracticeHubPage />} />
            <Route path="practice/exercises" element={<ExerciseBrowserPage />} />
            <Route path="practice/songs" element={<RepertoireBrowserPage />} />
            <Route path="practice/songs/:pieceId" element={<RepertoirePlayerPage />} />
            <Route path="practice/scales" element={<ScalePracticePage />} />
            <Route path="practice/chords" element={<ChordPracticePage />} />
            <Route path="practice/sight-reading" element={<SightReadingPage />} />
            <Route path="practice/ear-training" element={<EarTrainingPage />} />
            <Route path="studio" element={<PianoStudioPage />} />
            <Route path="studio/:id" element={<PianoStudioPage />} />
            <Route path="practice/my-exercises" element={<MyExercisesPage />} />
            <Route path="practice/my-exercises/:exerciseId" element={<MyExercisePlayerPage />} />
            <Route path="chat" element={<DrumChatPage />} />
          </Route>
        </Route>

        {/* ── Shared routes ── */}
        <Route element={<AppLayout />}>
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>

        {/* ── Backward compatibility redirects ── */}
        <Route path="curriculum" element={<Navigate to="/drums/curriculum" replace />} />
        <Route path="practice/*" element={<Navigate to="/drums/practice" replace />} />
        <Route path="studio/*" element={<Navigate to="/drums/studio" replace />} />
        <Route path="chat" element={<Navigate to="/drums/chat" replace />} />
        <Route path="lesson/*" element={<Navigate to="/drums" replace />} />
        <Route path="exercise/*" element={<Navigate to="/drums" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
