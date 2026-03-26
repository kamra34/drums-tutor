import { NavLink } from 'react-router-dom'
import { useMidiStore } from '../../stores/useMidiStore'
import { useAuthStore } from '../../stores/useAuthStore'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⬡', end: true, adminOnly: false },
  { to: '/curriculum', label: 'Curriculum', icon: '📚', end: false, adminOnly: false },
  { to: '/practice', label: 'Practice', icon: '🥁', end: false, adminOnly: false },
  { to: '/chat', label: 'AI Tutor', icon: '🤖', end: false, adminOnly: false },
  { to: '/admin', label: 'Admin', icon: '🛡', end: false, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: '⚙', end: false, adminOnly: false },
]

export default function Sidebar() {
  const { isConnected, deviceName } = useMidiStore()
  const { user, logout } = useAuthStore()

  return (
    <aside className="w-56 min-h-screen bg-[#0a0c13] border-r border-[#1e2433] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1e2433]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥁</span>
          <div>
            <div className="text-white font-bold text-base leading-tight">DrumTutor</div>
            <div className="text-[#4b5563] text-xs">AI-Powered Learning</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.filter(n => !n.adminOnly || user?.role === 'admin').map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#1e1030] text-violet-400 font-medium'
                  : 'text-[#6b7280] hover:text-[#c4b5fd] hover:bg-[#13101e]'
              }`
            }
          >
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* MIDI status */}
      <div className="px-4 py-3 border-t border-[#1e2433]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-400' : 'bg-[#374151]'}`} />
          <span className="text-xs text-[#6b7280] truncate">
            {isConnected ? deviceName ?? 'Kit connected' : 'No kit connected'}
          </span>
        </div>
      </div>

      {/* User info + logout */}
      {user && (
        <div className="px-4 py-3 border-t border-[#1e2433]">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs text-white font-medium truncate">{user.displayName}</div>
              <div className="text-[10px] text-[#4b5563] truncate">{user.email}</div>
            </div>
            <button
              onClick={logout}
              className="text-[10px] text-[#4b5563] hover:text-red-400 transition-colors flex-shrink-0 ml-2"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
