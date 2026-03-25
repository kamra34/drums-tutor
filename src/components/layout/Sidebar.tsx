import { NavLink } from 'react-router-dom'
import { useMidiStore } from '../../stores/useMidiStore'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⬡', end: true },
  { to: '/curriculum', label: 'Curriculum', icon: '📚', end: false },
  { to: '/practice', label: 'Practice', icon: '🥁', end: false },
  { to: '/chat', label: 'AI Tutor', icon: '🤖', end: false },
  { to: '/settings', label: 'Settings', icon: '⚙', end: false },
]

export default function Sidebar() {
  const { isConnected, deviceName } = useMidiStore()

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
        {NAV.map(({ to, label, icon, end }) => (
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
      <div className="px-4 py-4 border-t border-[#1e2433]">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isConnected ? 'bg-green-400' : 'bg-[#374151]'
            }`}
          />
          <span className="text-xs text-[#6b7280] truncate">
            {isConnected ? deviceName ?? 'Kit connected' : 'No kit connected'}
          </span>
        </div>
      </div>
    </aside>
  )
}
