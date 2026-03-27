import { Link } from 'react-router-dom'

export default function PianoDashboardPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto" style={{ background: '#06080d', minHeight: '100vh' }}>
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-3xl p-8 lg:p-10 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(10,10,18,0.9) 0%, rgba(8,10,20,0.9) 50%, rgba(10,10,18,0.8) 100%)',
      }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }} />
        <div className="relative z-10">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-2 tracking-tight">
            Piano<span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">.</span>
          </h1>
          <p className="text-[#6b7280] text-base lg:text-lg max-w-xl">
            Welcome to your piano learning journey. Modules are being built — stay tuned.
          </p>
        </div>
      </div>

      {/* Coming soon cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: '🎼', title: 'Scales & Chords', desc: 'Practice major, minor, and pentatonic scales. Learn chord voicings and progressions.' },
          { icon: '👁', title: 'Sight Reading', desc: 'Read piano sheet music in treble and bass clef. Progressive difficulty.' },
          { icon: '👂', title: 'Ear Training', desc: 'Identify intervals, chords, and melodies by ear. Play back what you hear.' },
          { icon: '🤖', title: 'AI Tutor', desc: 'Chat with Clara, your AI piano instructor. Get personalized guidance.', to: 'chat' },
        ].map(card => (
          <div
            key={card.title}
            className="group relative rounded-2xl p-5 border border-white/[0.04] overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ background: '#6366f1', opacity: 0.4 }} />
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl" style={{ backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                {card.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-[15px] mb-1">{card.title}</h3>
                <p className="text-xs text-[#6b7280] leading-relaxed">{card.desc}</p>
                {card.to ? (
                  <Link to={card.to} className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400/70 hover:text-indigo-400 transition-colors">
                    Open →
                  </Link>
                ) : (
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-[#374151]">Coming soon</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
