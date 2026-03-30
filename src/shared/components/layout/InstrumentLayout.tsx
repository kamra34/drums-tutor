import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import InstrumentContext from '@shared/contexts/InstrumentContext'
import { getTheme } from '@shared/styles/themes'
import { getInstrumentConfig } from '@shared/config/instrumentConfig'
import type { Instrument } from '@shared/types/instrument'

const FAVICON_SVGS: Record<Instrument, string> = {
  drums: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#0c1018"/><circle cx="16" cy="16" r="15" fill="none" stroke="#f59e0b" stroke-opacity="0.2" stroke-width="0.5"/><line x1="9" y1="24" x2="20" y2="10" stroke="url(#s1)" stroke-width="2.5" stroke-linecap="round"/><circle cx="21" cy="9" r="2.5" fill="#fbbf24"/><line x1="23" y1="24" x2="12" y2="10" stroke="url(#s2)" stroke-width="2.5" stroke-linecap="round"/><circle cx="11" cy="9" r="2.5" fill="#fbbf24"/><defs><linearGradient id="s1" x1="9" y1="24" x2="20" y2="10"><stop offset="0%" stop-color="#92400e"/><stop offset="100%" stop-color="#d97706"/></linearGradient><linearGradient id="s2" x1="23" y1="24" x2="12" y2="10"><stop offset="0%" stop-color="#92400e"/><stop offset="100%" stop-color="#d97706"/></linearGradient></defs></svg>`,
  piano: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#0c1018"/><circle cx="16" cy="16" r="15" fill="none" stroke="#a78bfa" stroke-opacity="0.2" stroke-width="0.5"/><rect x="6" y="9" width="20" height="14" rx="1.5" fill="#f8fafc" stroke="#334155" stroke-width="0.5"/><rect x="10.5" y="9" width="3" height="9" rx="0.5" fill="#1e293b"/><rect x="15.5" y="9" width="3" height="9" rx="0.5" fill="#1e293b"/><rect x="20.5" y="9" width="3" height="9" rx="0.5" fill="#1e293b"/></svg>`,
}

export default function InstrumentLayout() {
  const { pathname } = useLocation()
  const inst: Instrument = pathname.startsWith('/piano') ? 'piano' : 'drums'
  const theme = getTheme(inst)
  const config = getInstrumentConfig(inst)

  // Update browser tab title and favicon
  useEffect(() => {
    document.title = `${config.label} Tutor`
    const link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
    if (link) {
      link.href = `data:image/svg+xml,${encodeURIComponent(FAVICON_SVGS[inst])}`
    }
  }, [inst, config.label])

  return (
    <InstrumentContext.Provider value={inst}>
      <div style={theme as React.CSSProperties}>
        <Outlet />
      </div>
    </InstrumentContext.Provider>
  )
}
