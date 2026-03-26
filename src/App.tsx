import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/useAuthStore'
import AppLayout from './components/layout/AppLayout'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import CurriculumPage from './pages/CurriculumPage'
import LessonPage from './pages/LessonPage'
import ExercisePage from './pages/ExercisePage'
import ChatPage from './pages/ChatPage'
import SettingsPage from './pages/SettingsPage'
import PracticeHubPage from './pages/PracticeHubPage'
import ReadingPracticePage from './pages/practice/ReadingPracticePage'
import BeatsPracticePage from './pages/practice/BeatsPracticePage'
import RudimentsPracticePage from './pages/practice/RudimentsPracticePage'
import FillsPracticePage from './pages/practice/FillsPracticePage'
import DailyPracticePage from './pages/practice/DailyPracticePage'
import FreePlayPage from './pages/practice/FreePlayPage'
import PracticePlayerPage from './pages/practice/PracticePlayerPage'
import PlaceholderPage from './pages/practice/PlaceholderPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => { checkAuth() }, [])

  // Show loading spinner while checking existing token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-pulse">🥁</div>
          <div className="text-[#6b7280] text-sm">Loading...</div>
        </div>
      </div>
    )
  }

  // Not authenticated — show login/register
  if (!isAuthenticated) {
    return <AuthPage />
  }

  // Authenticated — show app
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
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
            <PlaceholderPage title="Sight-Reading" icon="👁" description="Random notation appears on screen. Read and execute cold — the ultimate real-world skill test. Coming in a future update." />
          } />
          <Route path="practice/songs" element={
            <PlaceholderPage title="Song Charts" icon="📄" description="Full song structures with repeats, sections, dynamics, and roadmaps. Learn to play through a whole chart." />
          } />
          <Route path="chat" element={<ChatPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
