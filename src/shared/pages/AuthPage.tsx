import { useState, useEffect } from 'react'
import { useAuthStore } from '@shared/stores/useAuthStore'

// Animated concentric rings — like sound waves radiating from a drum hit
function PulseRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className="absolute rounded-full border opacity-0"
          style={{
            width: `${i * 220}px`,
            height: `${i * 220}px`,
            borderColor: i <= 2 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.04)',
            animation: `pulse-ring ${4 + i * 0.8}s ease-out ${i * 0.6}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// Floating particles that drift upward like embers
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8,
    size: 2 + Math.random() * 3,
    opacity: 0.15 + Math.random() * 0.25,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `rgba(245, 158, 11, ${p.opacity})`,
            animation: `float-up ${p.duration}s ease-in ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// Drumstick SVG icon
function DrumstickIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      {/* Stick body */}
      <line x1="14" y1="50" x2="44" y2="20" stroke="url(#stick-grad)" strokeWidth="4" strokeLinecap="round" />
      {/* Tip */}
      <circle cx="46" cy="18" r="5" fill="url(#tip-grad)" />
      <defs>
        <linearGradient id="stick-grad" x1="14" y1="50" x2="44" y2="20">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="tip-grad" x1="41" y1="23" x2="51" y2="13">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [mounted, setMounted] = useState(false)
  const { login, register, isLoading, error, clearError } = useAuthStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, displayName)
      }
    } catch {
      // error is set in store
    }
  }

  function switchMode() {
    setMode(m => m === 'login' ? 'register' : 'login')
    clearError()
  }

  return (
    <div className="fixed inset-0 bg-[#06080d] flex items-center justify-center p-4 overflow-hidden" style={{ zIndex: 50 }}>
      {/* CSS animations */}
      <style>{`
        @keyframes pulse-ring {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.4); }
        }
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Background layers */}
      <PulseRings />
      <FloatingParticles />

      {/* Warm ambient glow behind card */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)',
          animation: 'glow-pulse 4s ease-in-out infinite',
        }}
      />

      {/* Main content */}
      <div
        className="relative z-10 w-full max-w-[420px]"
        style={{
          animation: mounted ? 'slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none',
          opacity: mounted ? undefined : 0,
        }}
      >
        {/* Logo section */}
        <div className="text-center mb-10">
          {/* Music icon */}
          <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
            <span className="text-5xl">🎵</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-indigo-400 bg-clip-text text-transparent">
              HARMONY
            </span>
            <span className="text-white">HUB</span>
          </h1>
          <p className="text-[#6b7280] text-sm mt-2 tracking-wide">
            Master rhythm. Feel the beat.
          </p>
        </div>

        {/* Glass card */}
        <div
          className="relative rounded-3xl p-8 border border-white/[0.06]"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 17, 23, 0.9) 0%, rgba(12, 16, 24, 0.95) 100%)',
            backdropFilter: 'blur(40px)',
            boxShadow: '0 0 80px -20px rgba(245, 158, 11, 0.1), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Subtle top border glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent rounded-t-3xl" />

          <h2 className="text-xl font-semibold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-[#4b5563] mb-7">
            {mode === 'login' ? 'Sign in to continue your practice' : 'Start your music learning journey'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="group">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest font-medium block mb-2">Name</label>
                <input
                  type="text" value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-[#2d3748] focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.05] transition-all duration-300 text-[15px]"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] text-[#6b7280] uppercase tracking-widest font-medium block mb-2">Email</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-[#2d3748] focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.05] transition-all duration-300 text-[15px]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#6b7280] uppercase tracking-widest font-medium block mb-2">Password</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Min 6 characters' : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                required
                minLength={mode === 'register' ? 6 : undefined}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-[#2d3748] focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.05] transition-all duration-300 text-[15px]"
              />
            </div>

            {error && (
              <div className="text-sm text-rose-300 bg-rose-500/[0.08] border border-rose-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-300 disabled:opacity-40 relative overflow-hidden group cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                boxShadow: '0 4px 24px -4px rgba(245, 158, 11, 0.3)',
              }}
            >
              {/* Hover shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative text-white">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : mode === 'login' ? 'Sign In' : 'Create Account'}
              </span>
            </button>
          </form>

          <div className="mt-7 text-center">
            <button onClick={switchMode} className="text-sm text-[#4b5563] hover:text-amber-400 transition-colors duration-300 cursor-pointer">
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#2d3748] mt-8 tracking-wide">
          Your progress and practice history are saved securely.
        </p>
      </div>
    </div>
  )
}
