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
import StudioPage from './pages/studio/StudioPage'

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => { checkAuth() }, [])

  // Show loading spinner while checking existing token
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#06080d] flex items-center justify-center" style={{ zIndex: 50 }}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-amber-500/40 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 64 64" fill="none" className="w-8 h-8">
                <line x1="18" y1="46" x2="40" y2="18" stroke="url(#lg)" strokeWidth="4" strokeLinecap="round" />
                <circle cx="42" cy="16" r="4" fill="#f59e0b" />
                <line x1="46" y1="46" x2="24" y2="18" stroke="url(#lg)" strokeWidth="4" strokeLinecap="round" />
                <circle cx="22" cy="16" r="4" fill="#f59e0b" />
                <defs><linearGradient id="lg" x1="0" y1="46" x2="0" y2="18"><stop offset="0%" stopColor="#92400e" /><stop offset="100%" stopColor="#d97706" /></linearGradient></defs>
              </svg>
            </div>
          </div>
          <div className="text-[#6b7280] text-sm tracking-wide">Loading...</div>
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
          <Route path="studio" element={<StudioPage />} />
          <Route path="studio/:id" element={<StudioPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
