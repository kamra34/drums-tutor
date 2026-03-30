import type { Instrument } from '../types/instrument'

export interface InstrumentConfig {
  label: string
  icon: string
  tutorName: string
  tutorGreeting: string
  tutorDescription: string
  suggestions: string[]
  accentColor: string
  accentSecondary: string
  showMidi: boolean
  showMetronome: boolean
  navItems: { to: string; label: string }[]
}

const DRUMS_CONFIG: InstrumentConfig = {
  label: 'Drums',
  icon: '🥁',
  tutorName: 'Max',
  tutorGreeting: "Hey, I'm Max!",
  tutorDescription: 'Your AI drum tutor. Ask me anything about drumming — technique, theory, practice tips, or upload a photo for feedback.',
  suggestions: [
    'How do I hold drum sticks correctly?',
    'What is a paradiddle and when do I use it?',
    'How can I improve my timing consistency?',
    'Explain the basic rock beat step by step',
    'What is limb independence and how do I train it?',
    'Create a 15-minute warmup routine for me',
  ],
  accentColor: '#f59e0b',
  accentSecondary: '#ea580c',
  showMidi: true,
  showMetronome: true,
  navItems: [
    { to: '', label: 'Dashboard' },
    { to: 'curriculum', label: 'Curriculum' },
    { to: 'practice', label: 'Practice' },
    { to: 'studio', label: 'Studio' },
    { to: 'chat', label: 'AI Tutor' },
  ],
}

const PIANO_CONFIG: InstrumentConfig = {
  label: 'Piano',
  icon: '🎹',
  tutorName: 'Clara',
  tutorGreeting: "Hi, I'm Clara!",
  tutorDescription: 'Your AI piano tutor. Ask me about technique, scales, chords, music theory, or share a photo for feedback.',
  suggestions: [
    'What are the major scales and how do I practice them?',
    'Explain proper hand position for piano',
    'What is the circle of fifths?',
    'How do I read piano sheet music?',
    'What are the most common chord progressions?',
    'Create a beginner practice routine for me',
  ],
  accentColor: '#a78bfa',
  accentSecondary: '#8b5cf6',
  showMidi: false,
  showMetronome: true,
  navItems: [
    { to: '', label: 'Dashboard' },
    { to: 'curriculum', label: 'Curriculum' },
    { to: 'practice', label: 'Practice' },
    { to: 'chat', label: 'AI Tutor' },
  ],
}

const CONFIGS: Record<Instrument, InstrumentConfig> = {
  drums: DRUMS_CONFIG,
  piano: PIANO_CONFIG,
}

export function getInstrumentConfig(instrument: Instrument): InstrumentConfig {
  return CONFIGS[instrument]
}
