/**
 * Maps lesson IDs to visual component IDs that should be injected at specific
 * positions within the lesson. `afterBlock` is the 0-based index of the block
 * AFTER which the visual is inserted (-1 = before the first block).
 */
export interface LessonVisualEntry {
  component:
    | 'drum-kit-diagram'
    | 'sitting-posture'
    | 'stick-grip'
    | 'note-values'
    | 'time-signature'
    | 'bpm-meter'
    | 'drum-staff'
    | 'rest-values'
    | 'beaming-guide'
    | 'drum-articulations'
    | 'counting-guide'
    | 'rudiments-visual'
    | 'dotted-notes-visual'
  afterBlock: number
}

export const LESSON_VISUALS: Record<string, LessonVisualEntry[]> = {
  // ═══ MODULE 0 — GETTING STARTED ═══

  // "What Is a Drum Kit?" — interactive kit diagram after text
  'm0-l1': [{ component: 'drum-kit-diagram', afterBlock: 0 }],

  // "How to Sit and Hold Sticks" — posture checklist + grip guide before quiz
  'm0-l2': [
    { component: 'sitting-posture', afterBlock: 0 },
    { component: 'stick-grip', afterBlock: 0 },
  ],

  // "Reading Drum Notation" — drum staff + note values after text
  'm0-l3': [
    { component: 'drum-staff', afterBlock: 0 },
    { component: 'note-values', afterBlock: 0 },
  ],

  // "Time Signatures" — interactive beat circles
  'm0-l4': [{ component: 'time-signature', afterBlock: 0 }],

  // "Tempo and BPM" — interactive BPM dial + tap tempo
  'm0-l5': [{ component: 'bpm-meter', afterBlock: 0 }],

  // "Connecting Your E-Drum Kit" — no visual needed (text-only setup guide)

  // "Rests: The Silence Between Beats" — rest values chart with mini staves
  'm0-l7': [{ component: 'rest-values', afterBlock: 0 }],

  // "Beams and Flags" — interactive flag vs beam comparison
  'm0-l8': [{ component: 'beaming-guide', afterBlock: 0 }],

  // "Drum Notation Symbols" — complete articulations reference + staff diagram
  'm0-l9': [
    { component: 'drum-articulations', afterBlock: 0 },
    { component: 'drum-staff', afterBlock: 0 },
  ],

  // ═══ MODULE 1 — FOUNDATIONS ═══

  // "Quarter Notes" — note values chart (quarter row highlighted)
  'm1-l1': [
    { component: 'note-values', afterBlock: 0 },
    { component: 'counting-guide', afterBlock: 0 },
  ],

  // "Eighth Notes" — note values + counting guide
  'm1-l2': [
    { component: 'note-values', afterBlock: 0 },
    { component: 'counting-guide', afterBlock: 0 },
  ],

  // "Counting Out Loud" — counting guide with all subdivisions + audio
  'm1-l3': [{ component: 'counting-guide', afterBlock: 0 }],

  // "Dynamics" — articulations guide (technique + dynamics tabs)
  'm1-l4': [{ component: 'drum-articulations', afterBlock: 0 }],

  // "What Are Rudiments?" — rudiments visual with sticking patterns
  'm1-l5': [{ component: 'rudiments-visual', afterBlock: 0 }],

  // "Your First Rudiments" — rudiments visual + notation block
  'm1-l6': [{ component: 'rudiments-visual', afterBlock: 0 }],

  // "Sixteenth Notes" — note values + beaming guide
  'm1-l7': [
    { component: 'note-values', afterBlock: 0 },
    { component: 'beaming-guide', afterBlock: 0 },
  ],

  // "Dotted Notes and Ties" — dotted notes visual with audio comparison
  'm1-l8': [{ component: 'dotted-notes-visual', afterBlock: 0 }],

  // "Dynamics: Playing with Expression" — articulations guide (dynamics tab)
  'm1-l9': [{ component: 'drum-articulations', afterBlock: 0 }],
}
