import { useAuthStore } from '../stores/useAuthStore'
import { Navigate } from 'react-router-dom'

export default function AdminPage() {
  const { user } = useAuthStore()

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-700/30 text-yellow-400 border border-yellow-700/40 font-medium">
            Admin
          </span>
        </div>
        <p className="text-[#6b7280]">Manage users, content, and application settings.</p>
      </div>

      {/* Admin info card */}
      <div className="bg-green-900/10 border border-green-800/30 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-900/40 flex items-center justify-center text-green-400 text-lg">
            ✓
          </div>
          <div>
            <div className="text-white font-medium">{user.displayName}</div>
            <div className="text-xs text-[#6b7280]">{user.email} · Admin since account creation</div>
          </div>
        </div>
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-2 gap-4">
        <AdminCard
          title="User Management"
          description="View all users, promote/demote admins, reset passwords."
          icon="👥"
          status="Coming soon"
        />
        <AdminCard
          title="Content Management"
          description="Edit curriculum, manage exercises, review AI-generated content."
          icon="📝"
          status="Coming soon"
        />
        <AdminCard
          title="Analytics"
          description="Practice stats, user progress, popular exercises, engagement metrics."
          icon="📊"
          status="Coming soon"
        />
        <AdminCard
          title="System Settings"
          description="API keys, feature flags, deployment config, CORS settings."
          icon="🔧"
          status="Coming soon"
        />
      </div>
    </div>
  )
}

function AdminCard({ title, description, icon, status }: {
  title: string; description: string; icon: string; status: string
}) {
  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-medium text-sm">{title}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e2433] text-[#4b5563]">{status}</span>
          </div>
          <p className="text-xs text-[#6b7280] leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}
