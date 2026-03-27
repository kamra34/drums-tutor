import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

const LAST_INSTRUMENT_KEY = 'music-tutor-last-instrument'

export default function LandingPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Set tab title for landing page
  useEffect(() => {
    document.title = 'HarmonyHub'
    const link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
    if (link) link.href = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="56" font-size="56">🎵</text></svg>')}`
  }, [])

  // Auto-redirect to last instrument ONLY on fresh page load (not when user clicks "Switch")
  useEffect(() => {
    const cameFromSwitch = (location.state as any)?.fromSwitch
    if (cameFromSwitch) return
    const last = localStorage.getItem(LAST_INSTRUMENT_KEY)
    if (last === 'drums' || last === 'piano') {
      navigate(`/${last}`, { replace: true })
    }
  }, [navigate, location.state])

  function selectInstrument(instrument: 'drums' | 'piano') {
    localStorage.setItem(LAST_INSTRUMENT_KEY, instrument)
    navigate(`/${instrument}`)
  }

  return (
    <div className="fixed inset-0 bg-[#06080d] flex items-center justify-center overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 60%)',
      }} />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%)',
      }} />

      <div className="relative z-10 text-center px-6">
        {/* Logo */}
        <div className="mb-3">
          <span className="text-5xl">🎵</span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight">
          Harmony<span className="bg-gradient-to-r from-amber-400 via-orange-400 to-indigo-400 bg-clip-text text-transparent">Hub</span>
        </h1>
        <p className="text-[#6b7280] text-base lg:text-lg mb-12 max-w-md mx-auto">
          AI-powered music learning. Choose your instrument to get started.
        </p>

        {/* Instrument cards */}
        <div className="flex gap-6 justify-center flex-wrap">
          {/* Drums */}
          <button
            onClick={() => selectInstrument('drums')}
            className="group relative w-64 rounded-3xl p-8 border border-white/[0.04] hover:border-amber-500/20 transition-all duration-300 cursor-pointer overflow-hidden"
            style={{ background: 'linear-gradient(150deg, rgba(15,12,8,0.9) 0%, rgba(10,12,18,0.95) 100%)' }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
              background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
            }} />
            <div className="relative">
              <div className="text-6xl mb-4">🥁</div>
              <h2 className="text-xl font-bold text-white mb-2">Drums</h2>
              <p className="text-xs text-[#6b7280] leading-relaxed">
                MIDI-powered practice with real-time scoring, notation reading, and AI feedback.
              </p>
              <div className="mt-4 flex items-center justify-center gap-1.5 text-amber-400/70 text-xs font-medium group-hover:text-amber-400 transition-colors">
                Start playing
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </button>

          {/* Piano */}
          <button
            onClick={() => selectInstrument('piano')}
            className="group relative w-64 rounded-3xl p-8 border border-white/[0.04] hover:border-indigo-500/20 transition-all duration-300 cursor-pointer overflow-hidden"
            style={{ background: 'linear-gradient(150deg, rgba(10,10,18,0.9) 0%, rgba(8,10,20,0.95) 100%)' }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            }} />
            <div className="relative">
              <div className="text-6xl mb-4">🎹</div>
              <h2 className="text-xl font-bold text-white mb-2">Piano</h2>
              <p className="text-xs text-[#6b7280] leading-relaxed">
                Scales, chords, sight-reading, and ear training with AI guidance.
              </p>
              <div className="mt-4 flex items-center justify-center gap-1.5 text-indigo-400/70 text-xs font-medium group-hover:text-indigo-400 transition-colors">
                Start playing
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
