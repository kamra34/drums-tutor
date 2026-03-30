import { Link } from 'react-router-dom'

interface Props {
  title: string
  icon: string
  description: string
}

export default function PlaceholderPage({ title, icon, description }: Props) {
  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-5xl mx-auto text-center">
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-12 justify-center">
        <Link to="/practice" className="hover:text-amber-400 transition-colors">Practice</Link>
        <svg className="w-3.5 h-3.5 text-[#2d3748]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[#94a3b8]">{title}</span>
      </nav>

      <div className="text-6xl mb-4">{icon}</div>
      <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">{title}</h1>
      <p className="text-[#6b7280] mb-8 max-w-md mx-auto">{description}</p>

      <div className="rounded-2xl border border-white/[0.04] p-6 inline-block" style={{
        background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)',
      }}>
        <div className="text-amber-400 text-sm font-semibold mb-1">Coming Soon</div>
        <p className="text-xs text-[#4b5563]">
          This mode is planned for a future update. Check back soon!
        </p>
      </div>

      <div className="mt-8">
        <Link to="/practice" className="text-sm text-amber-500/80 hover:text-amber-400 transition-colors">
          ← Back to Practice Hub
        </Link>
      </div>
    </div>
  )
}
