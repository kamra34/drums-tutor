import { Link } from 'react-router-dom'

interface Props {
  title: string
  icon: string
  description: string
}

export default function PianoPlaceholderPage({ title, icon, description }: Props) {
  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto text-center" style={{ minHeight: '100vh' }}>
      <div className="pt-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center text-4xl" style={{
          background: 'rgba(167,139,250,0.08)',
          border: '1px solid rgba(167,139,250,0.15)',
        }}>
          {icon}
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-sm text-[#6b7280] mb-6 max-w-md mx-auto">{description}</p>
        <Link
          to="/piano"
          className="text-xs text-violet-400/70 hover:text-violet-400 transition-colors"
        >
          ← Back to Piano Dashboard
        </Link>
      </div>
    </div>
  )
}
