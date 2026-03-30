export interface LessonVisualEntry {
  component: string
  afterBlock: number  // -1 = before all blocks, 0+ = after block at that index
  props?: Record<string, unknown>
}

export const LESSON_VISUALS: Record<string, LessonVisualEntry[]> = {
  // ── Module 0: Introduction to the Piano ──────────────────────────────────

  // Welcome to the Piano
  'p0-l1': [
    { component: 'keyboard-diagram', afterBlock: 0 },
  ],
  // The Keyboard Layout
  'p0-l2': [
    { component: 'keyboard-diagram', afterBlock: 0 },
  ],
  // Octaves and the Repeating Pattern
  'p0-l3': [
    { component: 'keyboard-diagram', afterBlock: 0 },
  ],
  // Sitting Posture and Hand Position
  'p0-l4': [
    { component: 'hand-position-guide', afterBlock: 0 },
  ],
  // Finger Numbering
  'p0-l5': [
    { component: 'hand-position-guide', afterBlock: 0 },
  ],
  // The Musical Alphabet
  'p0-l6': [
    { component: 'keyboard-diagram', afterBlock: 0 },
  ],
  // Finding C-D-E on the Keyboard
  'p0-l7': [
    { component: 'keyboard-diagram', afterBlock: 0 },
  ],
  // Introduction to the Staff
  'p0-l8': [
    { component: 'staff-guide', afterBlock: 0 },
  ],
  // The Grand Staff
  'p0-l9': [
    { component: 'staff-guide', afterBlock: 0 },
  ],

  // ── Module 1: Playing Your First Notes ───────────────────────────────────

  // Right Hand C Position
  'p1-l1': [
    { component: 'keyboard-diagram', afterBlock: 0 },
  ],
  // Left Hand C Position
  'p1-l2': [
    { component: 'keyboard-diagram', afterBlock: 0 },
  ],
  // Quarter Notes and Half Notes
  'p1-l3': [
    { component: 'note-values-chart', afterBlock: 0 },
  ],
  // Whole Notes
  'p1-l4': [
    { component: 'note-values-chart', afterBlock: 0 },
  ],
  // Time Signatures
  'p1-l5': [
    { component: 'note-values-chart', afterBlock: 0 },
  ],
  // Treble Clef Lines and Spaces
  'p1-l6': [
    { component: 'staff-guide', afterBlock: 0 },
  ],
  // Bass Clef Lines and Spaces
  'p1-l7': [
    { component: 'staff-guide', afterBlock: 0 },
  ],
  // First Right Hand Melody
  'p1-l8': [
    { component: 'melody-player', afterBlock: 0, props: {
      title: 'Ode to Joy — Beethoven',
      hand: 'right',
      startOctave: 4,
      bpm: 80,
      melody: [
        // Line 1: E E F G | G F E D | C C D E | E- D D-
        { note: 'E4', beats: 1, finger: 3 }, { note: 'E4', beats: 1, finger: 3 },
        { note: 'F4', beats: 1, finger: 4 }, { note: 'G4', beats: 1, finger: 5 },
        { note: 'G4', beats: 1, finger: 5 }, { note: 'F4', beats: 1, finger: 4 },
        { note: 'E4', beats: 1, finger: 3 }, { note: 'D4', beats: 1, finger: 2 },
        { note: 'C4', beats: 1, finger: 1 }, { note: 'C4', beats: 1, finger: 1 },
        { note: 'D4', beats: 1, finger: 2 }, { note: 'E4', beats: 1, finger: 3 },
        { note: 'E4', beats: 2, finger: 3 }, { note: 'D4', beats: 2, finger: 2 },
        // Line 2: E E F G | G F E D | C C D E | D- C C-
        { note: 'E4', beats: 1, finger: 3 }, { note: 'E4', beats: 1, finger: 3 },
        { note: 'F4', beats: 1, finger: 4 }, { note: 'G4', beats: 1, finger: 5 },
        { note: 'G4', beats: 1, finger: 5 }, { note: 'F4', beats: 1, finger: 4 },
        { note: 'E4', beats: 1, finger: 3 }, { note: 'D4', beats: 1, finger: 2 },
        { note: 'C4', beats: 1, finger: 1 }, { note: 'C4', beats: 1, finger: 1 },
        { note: 'D4', beats: 1, finger: 2 }, { note: 'E4', beats: 1, finger: 3 },
        { note: 'D4', beats: 2, finger: 2 }, { note: 'C4', beats: 2, finger: 1 },
      ],
    }},
  ],
  // First Left Hand Melody
  'p1-l9': [
    { component: 'melody-player', afterBlock: 0, props: {
      title: 'Aura Lee — Simple Arrangement',
      hand: 'left',
      startOctave: 3,
      bpm: 76,
      melody: [
        // Line 1: C D E F | G G G- | F E F G | E- E-
        { note: 'C3', beats: 1, finger: 5 }, { note: 'D3', beats: 1, finger: 4 },
        { note: 'E3', beats: 1, finger: 3 }, { note: 'F3', beats: 1, finger: 2 },
        { note: 'G3', beats: 1, finger: 1 }, { note: 'G3', beats: 1, finger: 1 },
        { note: 'G3', beats: 2, finger: 1 },
        { note: 'F3', beats: 1, finger: 2 }, { note: 'E3', beats: 1, finger: 3 },
        { note: 'F3', beats: 1, finger: 2 }, { note: 'G3', beats: 1, finger: 1 },
        { note: 'E3', beats: 2, finger: 3 }, { note: 'E3', beats: 2, finger: 3 },
        // Line 2: C D E F | G G G- | F E F D | C- C-
        { note: 'C3', beats: 1, finger: 5 }, { note: 'D3', beats: 1, finger: 4 },
        { note: 'E3', beats: 1, finger: 3 }, { note: 'F3', beats: 1, finger: 2 },
        { note: 'G3', beats: 1, finger: 1 }, { note: 'G3', beats: 1, finger: 1 },
        { note: 'G3', beats: 2, finger: 1 },
        { note: 'F3', beats: 1, finger: 2 }, { note: 'E3', beats: 1, finger: 3 },
        { note: 'F3', beats: 1, finger: 2 }, { note: 'D3', beats: 1, finger: 4 },
        { note: 'C3', beats: 2, finger: 5 }, { note: 'C3', beats: 2, finger: 5 },
      ],
    }},
  ],
  // Rests
  'p1-l10': [
    { component: 'note-values-chart', afterBlock: 0 },
  ],

  // ── Module 2: Hands Together & Rhythm ──────────────────────────────────

  'p2-l1': [
    { component: 'keyboard-diagram', afterBlock: 0 },
  ],
  'p2-l2': [
    { component: 'keyboard-diagram', afterBlock: 0 },
  ],
  'p2-l3': [
    { component: 'keyboard-diagram', afterBlock: 0 },
  ],
  'p2-l4': [
    { component: 'note-values-chart', afterBlock: 0 },
  ],
  'p2-l5': [
    { component: 'dynamics-guide', afterBlock: 0 },
  ],
  'p2-l6': [
    { component: 'dynamics-guide', afterBlock: 0 },
  ],
  'p2-l7': [
    { component: 'note-values-chart', afterBlock: 0 },
  ],
  'p2-l8': [
    { component: 'chord-diagram', afterBlock: 0 },
  ],
  'p2-l9': [
    { component: 'chord-diagram', afterBlock: 0 },
  ],

  // ── Module 3: Expanding Range & Technique ──────────────────────────────

  'p3-l1': [
    { component: 'keyboard-diagram', afterBlock: 0 },
  ],
  'p3-l2': [
    { component: 'keyboard-diagram', afterBlock: 0 },
  ],
  'p3-l3': [
    { component: 'keyboard-diagram', afterBlock: 0 },
    { component: 'interval-chart', afterBlock: 1 },
  ],
  'p3-l4': [
    { component: 'interval-chart', afterBlock: 0 },
  ],
  'p3-l5': [
    { component: 'pedal-guide', afterBlock: 0 },
  ],
  'p3-l6': [
    { component: 'note-values-chart', afterBlock: 0 },
  ],
  'p3-l7': [
    { component: 'note-values-chart', afterBlock: 0 },
  ],
  'p3-l8': [
    { component: 'keyboard-diagram', afterBlock: 0 },
  ],
}
