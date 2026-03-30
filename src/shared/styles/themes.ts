import type { Instrument } from '../types/instrument'

export interface InstrumentTheme {
  '--accent': string
  '--accent-secondary': string
  '--accent-bg': string
  '--accent-glow': string
  '--accent-text': string
  '--accent-border': string
}

const DRUM_THEME: InstrumentTheme = {
  '--accent': '#f59e0b',
  '--accent-secondary': '#ea580c',
  '--accent-bg': 'rgba(245,158,11,0.1)',
  '--accent-glow': 'rgba(245,158,11,0.15)',
  '--accent-text': '#fbbf24',
  '--accent-border': 'rgba(245,158,11,0.2)',
}

const PIANO_THEME: InstrumentTheme = {
  '--accent': '#a78bfa',
  '--accent-secondary': '#8b5cf6',
  '--accent-bg': 'rgba(167,139,250,0.1)',
  '--accent-glow': 'rgba(167,139,250,0.15)',
  '--accent-text': '#c4b5fd',
  '--accent-border': 'rgba(167,139,250,0.2)',
}

const THEMES: Record<Instrument, InstrumentTheme> = {
  drums: DRUM_THEME,
  piano: PIANO_THEME,
}

export function getTheme(instrument: Instrument): InstrumentTheme {
  return THEMES[instrument]
}
