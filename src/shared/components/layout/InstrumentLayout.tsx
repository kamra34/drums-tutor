import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import InstrumentContext from '@shared/contexts/InstrumentContext'
import { getTheme } from '@shared/styles/themes'
import { getInstrumentConfig } from '@shared/config/instrumentConfig'
import type { Instrument } from '@shared/types/instrument'

const FAVICON_SVGS: Record<Instrument, string> = {
  drums: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="56" font-size="56">🥁</text></svg>`,
  piano: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="56" font-size="56">🎹</text></svg>`,
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
