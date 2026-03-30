import { useAuthStore } from '@shared/stores/useAuthStore'
import { Navigate } from 'react-router-dom'

export default function AdminPage() {
  const { user } = useAuthStore()

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-3xl p-8 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(15,12,8,0.9) 0%, rgba(10,14,22,0.9) 50%, rgba(15,12,8,0.8) 100%)',
      }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Panel</h1>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
              Admin
            </span>
          </div>
          <p className="text-[#6b7280]">Manage users, content, and application settings.</p>
        </div>
      </div>

      {/* Admin info card */}
      <div className="rounded-2xl border border-emerald-500/15 p-5 mb-6" style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(12,14,20,0.7) 100%)',
      }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="text-white font-semibold">{user.displayName}</div>
            <div className="text-xs text-[#6b7280]">{user.email} · Admin since account creation</div>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-4">
        <AdminCard
          title="User Management"
          description="View all users, promote/demote admins, reset passwords."
          icon={<UsersIcon />}
          status="Coming soon"
        />
        <AdminCard
          title="Content Management"
          description="Edit curriculum, manage exercises, review AI-generated content."
          icon={<ContentIcon />}
          status="Coming soon"
        />
        <AdminCard
          title="Analytics"
          description="Practice stats, user progress, popular exercises, engagement metrics."
          icon={<AnalyticsIcon />}
          status="Coming soon"
        />
        <AdminCard
          title="System Settings"
          description="API keys, feature flags, deployment config, CORS settings."
          icon={<SystemIcon />}
          status="Coming soon"
        />
      </div>
    </div>
  )
}

function AdminCard({ title, description, icon, status }: {
  title: string; description: string; icon: React.ReactNode; status: string
}) {
  return (
    <div className="rounded-2xl border border-white/[0.04] p-5 group" style={{
      background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
    }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-semibold text-sm">{title}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] text-[#4b5563]">{status}</span>
          </div>
          <p className="text-xs text-[#6b7280] leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}

function UsersIcon() {
  return (
    <svg className="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function ContentIcon() {
  return (
    <svg className="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function AnalyticsIcon() {
  return (
    <svg className="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg className="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
