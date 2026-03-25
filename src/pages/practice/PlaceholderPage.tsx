import { Link } from 'react-router-dom'

interface Props {
  title: string
  icon: string
  description: string
}

export default function PlaceholderPage({ title, icon, description }: Props) {
  return (
    <div className="p-8 max-w-2xl mx-auto text-center">
      <nav className="flex items-center gap-2 text-sm text-[#4b5563] mb-12 justify-center">
        <Link to="/practice" className="hover:text-violet-400">Practice</Link>
        <span>›</span>
        <span className="text-[#94a3b8]">{title}</span>
      </nav>

      <div className="text-6xl mb-4">{icon}</div>
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-[#6b7280] mb-8 max-w-md mx-auto">{description}</p>

      <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-6 inline-block">
        <div className="text-violet-400 text-sm font-medium mb-1">Coming Soon</div>
        <p className="text-xs text-[#4b5563]">
          This mode is planned for a future update. Check back soon!
        </p>
      </div>

      <div className="mt-8">
        <Link to="/practice" className="text-sm text-violet-500 hover:underline">
          ← Back to Practice Hub
        </Link>
      </div>
    </div>
  )
}
