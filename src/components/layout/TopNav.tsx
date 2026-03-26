import { NavLink } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useMidiStore } from '../../stores/useMidiStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { useGlobalMetronomeStore } from '../../stores/useGlobalMetronomeStore'
import { stopGlobalMetronome } from '../../services/globalMetronome'
import GlobalMetronomePopup from '../metronome/GlobalMetronomePopup'

const NAV = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true, adminOnly: false },
  { to: '/curriculum', label: 'Curriculum', icon: CurriculumIcon, end: false, adminOnly: false },
  { to: '/practice', label: 'Practice', icon: PracticeIcon, end: false, adminOnly: false },
  { to: '/studio', label: 'Studio', icon: StudioIcon, end: false, adminOnly: false },
  { to: '/chat', label: 'AI Tutor', icon: AiTutorIcon, end: false, adminOnly: false },
  { to: '/admin', label: 'Admin', icon: AdminIcon, end: false, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false, adminOnly: false },
]

export default function TopNav() {
  const { isConnected, deviceName } = useMidiStore()
  const { user, logout } = useAuthStore()
  const { isPlaying: metronomeRunning, bpm: metronomeBpm } = useGlobalMetronomeStore()
  const [metronomeOpen, setMetronomeOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [profileOpen])

  return (
    <header
      className="relative z-30 flex items-center h-16 px-6 border-b border-white/[0.04]"
      style={{
        background: 'linear-gradient(180deg, rgba(6,8,13,0.95) 0%, rgba(6,8,13,0.85) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2.5 mr-10 flex-shrink-0">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0" style={{ transform: 'rotate(-20deg)' }}>
            <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
              <line x1="14" y1="50" x2="44" y2="20" stroke="url(#nav-stick)" strokeWidth="5" strokeLinecap="round" />
              <circle cx="46" cy="18" r="5" fill="#f59e0b" />
              <defs>
                <linearGradient id="nav-stick" x1="14" y1="50" x2="44" y2="20">
                  <stop offset="0%" stopColor="#92400e" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="absolute inset-0" style={{ transform: 'scaleX(-1) rotate(-20deg)' }}>
            <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
              <line x1="14" y1="50" x2="44" y2="20" stroke="url(#nav-stick2)" strokeWidth="5" strokeLinecap="round" />
              <circle cx="46" cy="18" r="5" fill="#f59e0b" />
              <defs>
                <linearGradient id="nav-stick2" x1="14" y1="50" x2="44" y2="20">
                  <stop offset="0%" stopColor="#92400e" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <span className="text-lg font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">DRUM</span>
          <span className="text-white">TUTOR</span>
        </span>
      </NavLink>

      {/* Navigation pills */}
      <nav className="flex items-center gap-1 flex-1">
        {NAV.filter(n => !n.adminOnly || user?.role === 'admin').map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-[#6b7280] hover:text-white hover:bg-white/[0.04]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Right side: MIDI + Profile */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* MIDI indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-[#374151]'}`} />
          <span className="text-xs text-[#6b7280] max-w-[120px] truncate">
            {isConnected ? deviceName ?? 'Kit connected' : 'No kit'}
          </span>
        </div>

        {/* Metronome button */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setMetronomeOpen(true)}
            className={`relative flex items-center gap-2 py-1.5 rounded-lg border transition-all cursor-pointer ${
              metronomeRunning
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 pl-3 pr-2'
                : 'bg-white/[0.03] border-white/[0.04] text-[#6b7280] hover:text-white hover:border-white/[0.08] px-3'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L8.5 21h7L12 2z" />
              <path d="M12 8l5-3" />
              <line x1="7" y1="21" x2="17" y2="21" />
            </svg>
            {metronomeRunning && (
              <span className="text-[10px] font-mono font-bold tabular-nums">{metronomeBpm}</span>
            )}
          </button>
          {/* Inline stop button when running */}
          {metronomeRunning && (
            <button
              onClick={() => { stopGlobalMetronome(); useGlobalMetronomeStore.getState().setPlaying(false) }}
              className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#6b7280] hover:text-rose-400 hover:border-rose-500/20 flex items-center justify-center cursor-pointer transition-colors"
              title="Stop metronome"
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                <rect x="1" y="1" width="10" height="10" rx="1.5" />
              </svg>
            </button>
          )}
        </div>

        <GlobalMetronomePopup open={metronomeOpen} onClose={() => setMetronomeOpen(false)} />

        {/* Profile button */}
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(p => !p)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-amber-500/20">
                {user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <svg className="w-3.5 h-3.5 text-[#4b5563] group-hover:text-[#6b7280] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div
                className="absolute right-0 top-12 w-56 rounded-2xl border border-white/[0.06] p-1.5 shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 17, 23, 0.97) 0%, rgba(12, 16, 24, 0.98) 100%)',
                  backdropFilter: 'blur(40px)',
                }}
              >
                <div className="px-3 py-3 border-b border-white/[0.04] mb-1">
                  <div className="text-sm text-white font-medium truncate">{user.displayName}</div>
                  <div className="text-xs text-[#4b5563] truncate">{user.email}</div>
                </div>
                <NavLink
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#94a3b8] hover:bg-white/[0.04] hover:text-white transition-colors"
                >
                  <SettingsIcon active={false} />
                  Settings
                </NavLink>
                <button
                  onClick={() => { setProfileOpen(false); logout() }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#94a3b8] hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

// ── Nav icons (small SVGs) ──────────────────────────────────────────────────

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={active ? '#f59e0b' : 'currentColor'} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 7a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5zm-10-2a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5z" />
    </svg>
  )
}

function CurriculumIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={active ? '#f59e0b' : 'currentColor'} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function PracticeIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={active ? '#f59e0b' : 'currentColor'} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  )
}

function StudioIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={active ? '#f59e0b' : 'currentColor'} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm10.5 0A2.25 2.25 0 0116.5 3.75h1.5A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V6zm-10.5 10.5A2.25 2.25 0 016 14.25h2.25a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-1.5zm10.5 0a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v-1.5z" />
    </svg>
  )
}

function AiTutorIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={active ? '#f59e0b' : 'currentColor'} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  )
}

function AdminIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={active ? '#f59e0b' : 'currentColor'} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={active ? '#f59e0b' : 'currentColor'} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
