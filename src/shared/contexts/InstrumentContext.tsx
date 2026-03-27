import { createContext, useContext } from 'react'
import type { Instrument } from '../types/instrument'

const InstrumentContext = createContext<Instrument>('drums')

export function useInstrument(): Instrument {
  return useContext(InstrumentContext)
}

export default InstrumentContext
