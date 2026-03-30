import type { Module, Lesson, Exercise } from '../types/curriculum'

// ═══════════════════════════════════════════════════════════════════════════════
// Piano Curriculum
// Based on Alfred's Basic Adult Piano Course with Faber Piano Adventures concepts
// ═══════════════════════════════════════════════════════════════════════════════

// ── Module 0: Introduction to the Piano ─────────────────────────────────────

const MODULE_0_LESSONS: Lesson[] = [
  {
    id: 'p0-l1',
    moduleId: 'piano-0',
    title: 'Welcome to the Piano',
    order: 0,
    completed: false,
    content: [
      {
        type: 'text',
        content: `The piano is one of the most versatile instruments in the world. It can play melody and harmony at the same time — something most instruments cannot do. Whether you want to play classical, jazz, pop, or just accompany yourself singing, the piano is the perfect starting point.

## Why Piano?

- **Complete instrument** — you can play bass, chords, and melody simultaneously
- **Visual layout** — notes are arranged in a clear, repeating pattern
- **Foundation for music theory** — nearly all theory is taught at the piano
- **No tuning needed** — press a key and the correct pitch sounds instantly

In this course, you will learn to read music, develop proper technique, and build a solid foundation that will serve you for years to come. Every concept is introduced step-by-step, with nothing assumed.

## What You Will Need

- A piano or keyboard with **at least 61 keys** (full-size recommended)
- Weighted or semi-weighted keys are ideal for building proper finger strength
- A comfortable bench or chair at the correct height`,
      },
      {
        type: 'quiz',
        question: 'What makes the piano unique compared to most other instruments?',
        options: [
          'It is the loudest instrument',
          'It can play melody and harmony at the same time',
          'It only plays in one key',
          'It requires no practice',
        ],
        correctIndex: 1,
        explanation: 'The piano can play multiple notes simultaneously, allowing you to play melody with one hand and harmony/bass with the other.',
      },
    ],
  },
  {
    id: 'p0-l2',
    moduleId: 'piano-0',
    title: 'The Keyboard Layout: White and Black Keys',
    order: 1,
    completed: false,
    content: [
      {
        type: 'text',
        content: `Look at the keyboard below. You will notice a pattern of **white keys** and **black keys**. The black keys are arranged in alternating groups of **two** and **three**.

## The Two-Three Pattern

This is the single most important visual landmark on the piano:

- **Group of 2 black keys** — then a gap
- **Group of 3 black keys** — then a gap
- This pattern repeats across the entire keyboard

Every piano, from a small 61-key to a full 88-key grand, uses this exact same pattern. Once you can spot the groups of 2 and 3, you can find any note instantly.

## White Keys

There are **7 white keys** in each repeating group, named after the first seven letters of the alphabet:

**A — B — C — D — E — F — G**

After G, the pattern starts over at A again.

## Black Keys

The black keys are named relative to the white keys next to them. We will learn their names (sharps and flats) in a later module. For now, just notice their grouping pattern.`,
      },
      {
        type: 'quiz',
        question: 'How are the black keys grouped on the piano?',
        options: [
          'Groups of 1 and 2',
          'Groups of 2 and 3',
          'Groups of 3 and 4',
          'They are evenly spaced',
        ],
        correctIndex: 1,
        explanation: 'The black keys alternate between groups of 2 and groups of 3, creating a visual pattern that repeats across the entire keyboard.',
      },
    ],
  },
  {
    id: 'p0-l3',
    moduleId: 'piano-0',
    title: 'Octaves and the Repeating Pattern',
    order: 2,
    completed: false,
    content: [
      {
        type: 'text',
        content: `## What Is an Octave?

An **octave** is the distance from one note to the next note with the same name. For example, from one C to the very next C (going right/higher) is one octave.

The word "octave" comes from the Latin *octo* meaning **eight** — because it spans 8 white keys (counting both the starting and ending note).

## The Repeating Pattern

The piano keyboard is simply the **same 12 keys repeated** over and over:

- 7 white keys (A B C D E F G)
- 5 black keys (in groups of 2 and 3)

Each repetition is one octave. A standard piano has **7 complete octaves** plus a few extra keys.

## Higher and Lower

- Moving **right** on the keyboard = **higher** pitch
- Moving **left** on the keyboard = **lower** pitch

The same note in a higher octave sounds "brighter" — it is the same note name, just at a higher frequency.

## Finding Octaves

Pick any key on the keyboard. Count 8 white keys to the right (including the one you started on). You have arrived at the same note, one octave higher. Try clicking different keys on the keyboard above to hear how octaves sound.`,
      },
      {
        type: 'quiz',
        question: 'How many white keys does one octave span (counting both endpoints)?',
        options: ['5', '7', '8', '12'],
        correctIndex: 2,
        explanation: 'An octave spans 8 white keys when you count both the starting and ending note — that is where the name "octave" (from Latin octo = 8) comes from.',
      },
    ],
  },
  {
    id: 'p0-l4',
    moduleId: 'piano-0',
    title: 'Sitting Posture and Hand Position',
    order: 3,
    completed: false,
    content: [
      {
        type: 'text',
        content: `Good posture is the foundation of good technique. Poor posture leads to tension, fatigue, and eventually injury. Let us set up correctly from the very beginning.

## Bench Position

1. Sit on the **front half** of the bench — do not lean against a backrest
2. Your feet should be **flat on the floor**, slightly apart
3. Sit at a height where your **forearms are roughly parallel** to the keyboard or slope very slightly downward
4. Position yourself so that **middle C** is approximately centered in front of your body

## Hand Shape

This is critical — the curved hand shape is the foundation of all piano technique:

1. Let your arms hang loosely at your sides
2. Notice the **natural curve** of your fingers — this is your playing shape
3. Place your hands on the keys maintaining this curve
4. Imagine holding a small ball or an egg under each hand
5. Your **fingertips** (not the flat pads) contact the keys
6. Keep your **knuckles slightly raised** — never let them collapse flat

## Common Mistakes to Avoid

- **Flat fingers** — collapsing the knuckle arch kills your control
- **Raised shoulders** — tension travels from shoulders to fingertips
- **Sitting too close or too far** — your elbows should be slightly in front of your body
- **Locked wrists** — wrists should be flexible, not rigid`,
      },
      {
        type: 'quiz',
        question: 'Where should you sit on the piano bench?',
        options: [
          'All the way back, leaning against the backrest',
          'On the front half of the bench',
          'Standing is preferred',
          'It does not matter',
        ],
        correctIndex: 1,
        explanation: 'Sit on the front half of the bench to allow free movement of your arms and to maintain proper posture. Leaning back restricts your reach and encourages tension.',
      },
    ],
  },
  {
    id: 'p0-l5',
    moduleId: 'piano-0',
    title: 'Finger Numbering for Both Hands',
    order: 4,
    completed: false,
    content: [
      {
        type: 'text',
        content: `Every piano method uses the same universal finger numbering system. Learning this now is essential — all sheet music and exercises reference these numbers.

## The System

Both hands use the **same numbering**:

| Finger | Number |
| ------ | ------ |
| Thumb | **1** |
| Index finger | **2** |
| Middle finger | **3** |
| Ring finger | **4** |
| Pinky | **5** |

The numbering is **mirrored** — on your right hand, finger 1 (thumb) is on the left side; on your left hand, finger 1 (thumb) is on the right side. Both thumbs are always "1".

## Why Fingering Matters

- **Efficiency** — correct fingering lets you play passages smoothly without awkward jumps
- **Consistency** — the same passage should always use the same fingers
- **Speed** — proper fingering is the foundation of playing fast
- **Injury prevention** — fighting against natural finger motion causes strain

In sheet music, you will see small numbers written above or below notes. These are **fingering suggestions** and you should follow them, especially as a beginner.

## Practice: Finger Taps

Place your right hand on a flat surface with curved fingers. Tap each finger one at a time while saying its number aloud: "1, 2, 3, 4, 5" then back "5, 4, 3, 2, 1". Repeat with your left hand.`,
      },
      {
        type: 'quiz',
        question: 'Which finger is always number 1 on both hands?',
        options: ['Pinky', 'Index finger', 'Thumb', 'Middle finger'],
        correctIndex: 2,
        explanation: 'The thumb is always finger 1 on both hands. This is universal across all piano methods worldwide.',
      },
    ],
  },
  {
    id: 'p0-l6',
    moduleId: 'piano-0',
    title: 'The Musical Alphabet',
    order: 5,
    completed: false,
    content: [
      {
        type: 'text',
        content: `## Seven Letters, Endlessly Repeated

The musical alphabet uses only the first **7 letters**: **A B C D E F G**

After G, it cycles back to A:

... E F G **A** B C D E F G **A** B C D ...

This cycle repeats across the entire keyboard. Each white key has one of these seven names.

## Finding C — Your Home Base

**C** is the most important note to find first. Here is how:

1. Look for a **group of 2 black keys**
2. The white key **immediately to the left** of the group of 2 is **C**

Every group of 2 black keys has a C to its left. There are multiple C notes across the keyboard — each one is in a different octave.

## Finding the Rest

Once you have found C, the other notes follow in order going right:

**C — D — E — F — G — A — B — C**

Here is another landmark: **F** is always the white key **immediately to the left** of the group of **3** black keys.

## Two Key Landmarks

| Landmark | How to find it |
| -------- | -------------- |
| **C** | Left of the 2 black keys |
| **F** | Left of the 3 black keys |

With these two landmarks, you can quickly find any note on the keyboard.`,
      },
      {
        type: 'quiz',
        question: 'How do you find the note C on the keyboard?',
        options: [
          'It is the first white key on the left',
          'It is to the left of the group of 3 black keys',
          'It is to the left of the group of 2 black keys',
          'It is between two black keys',
        ],
        correctIndex: 2,
        explanation: 'C is always the white key immediately to the left of a group of 2 black keys. This works everywhere on the keyboard.',
      },
    ],
  },
  {
    id: 'p0-l7',
    moduleId: 'piano-0',
    title: 'Finding C-D-E on the Keyboard',
    order: 6,
    completed: false,
    content: [
      {
        type: 'text',
        content: `Now let us put your knowledge into practice by finding and playing your first three notes: **C, D, and E**.

## Step by Step

1. Find a **group of 2 black keys** near the middle of your keyboard
2. The white key to the **left** of those 2 black keys is **C**
3. The white key **between** the 2 black keys is **D**
4. The white key to the **right** of the 2 black keys is **E**

## Keyboard Sizes and How to Find YOUR Middle C

Not all keyboards have the same number of keys. Here is how to find Middle C on each size:

| Keyboard | Keys | Octaves | Middle C location |
| -------- | ---- | ------- | ----------------- |
| **Full piano** | 88 | 7¼ | The **4th C** from the left (key 40) |
| **76-key** | 76 | 6⅓ | The **3rd C** from the left, roughly center |
| **61-key** | 61 | 5 | The **3rd C** from the left, exactly center |
| **49-key** | 49 | 4 | The **3rd C** from the left |

### Quick method for ANY keyboard:

1. Find the **exact center** of your keyboard
2. Look for the **group of 2 black keys** closest to center
3. The white key to the **left** of that group is **Middle C**

On an 88-key piano, Middle C is slightly left of center. On a 61-key keyboard, it is right in the middle. The important thing is: **Middle C is always C4** regardless of your keyboard size.

### How many octaves does your keyboard have?

Count the number of C keys (left of each group-of-2 black keys). The number of gaps between consecutive C keys is your number of octaves. A full piano has C1 through C8.

## Middle C

The C closest to the center of your keyboard is called **Middle C** (also written as **C4** in scientific notation). This is the most referenced note in all of piano music. It sits right in the middle — between where your left hand and right hand will typically play.

## Try It!

Click on the keyboard diagram above to find and hear C, D, and E. Then try it on your own piano:

1. Play C with your **right hand thumb (finger 1)**
2. Play D with your **right hand index finger (finger 2)**
3. Play E with your **right hand middle finger (finger 3)**

Play them slowly: C — D — E — D — C. Congratulations — you have just played your first notes!

## Naming Notes with Octave Numbers

Musicians label notes with both the letter name and an octave number:

- **C4** = Middle C (4th octave)
- **C5** = the C one octave higher
- **C3** = the C one octave lower

The number goes up each time you pass C going to the right.`,
      },
      {
        type: 'quiz',
        question: 'Where is Middle C located on the keyboard?',
        options: [
          'The very first key on the left',
          'To the left of a group of 3 black keys near the center',
          'To the left of a group of 2 black keys near the center',
          'The very last key on the right',
        ],
        correctIndex: 2,
        explanation: 'Middle C is the C nearest to the center of the keyboard — found to the left of a group of 2 black keys in the middle area. It is also called C4.',
      },
    ],
  },
  {
    id: 'p0-l8',
    moduleId: 'piano-0',
    title: 'Introduction to the Staff',
    order: 7,
    completed: false,
    content: [
      {
        type: 'text',
        content: `Written music uses a system of **five horizontal lines** called a **staff** (plural: staves). Notes are placed on these lines and in the spaces between them. The higher a note sits on the staff, the higher its pitch.

## The Treble Clef (G Clef) 𝄞

The **treble clef** marks the staff for higher-pitched notes — typically what your **right hand** plays.

The symbol curls around the second line from the bottom, marking it as the note **G**. That is why it is also called the G clef.

### Treble Clef Lines (bottom to top)

**E — G — B — D — F**

Memory trick: **E**very **G**ood **B**oy **D**oes **F**ine

### Treble Clef Spaces (bottom to top)

**F — A — C — E**

Memory trick: the spaces spell **FACE**

## The Bass Clef (F Clef) 𝄢

The **bass clef** marks the staff for lower-pitched notes — typically what your **left hand** plays.

The two dots sit on either side of the fourth line, marking it as the note **F**.

### Bass Clef Lines (bottom to top)

**G — B — D — F — A**

Memory trick: **G**ood **B**oys **D**o **F**ine **A**lways

### Bass Clef Spaces (bottom to top)

**A — C — E — G**

Memory trick: **A**ll **C**ows **E**at **G**rass`,
      },
      {
        type: 'quiz',
        question: 'What do the spaces of the treble clef spell?',
        options: ['EDGE', 'FACE', 'CAGE', 'BEAD'],
        correctIndex: 1,
        explanation: 'The four spaces of the treble clef, from bottom to top, spell F-A-C-E — "FACE".',
      },
    ],
  },
  {
    id: 'p0-l9',
    moduleId: 'piano-0',
    title: 'The Grand Staff: Treble and Bass Clef Together',
    order: 8,
    completed: false,
    content: [
      {
        type: 'text',
        content: `Piano music uses **two staves** joined together. This is called the **Grand Staff**.

## The Grand Staff

- The **top staff** has a **treble clef** → right hand
- The **bottom staff** has a **bass clef** → left hand
- They are connected by a **brace** { on the left side
- A **bar line** runs through both staves to keep them aligned

## Middle C — The Bridge

Remember Middle C? On the Grand Staff, it lives on a small **ledger line** — a short extra line that sits **between** the two staves.

- In the **treble clef**, Middle C is **below** the staff on the first ledger line below
- In the **bass clef**, Middle C is **above** the staff on the first ledger line above

Both positions represent the **exact same key** on the piano. Middle C is the connection point between your two hands.

## Ledger Lines

When notes go higher or lower than the 5 staff lines, small extra lines called **ledger lines** are added. Middle C is the most common example. You will encounter more ledger lines as your range expands.

## Reading Both Staves Simultaneously

This is what makes piano reading unique — you read **two staves at once**, one for each hand. It takes practice, but it becomes natural. In the beginning, we will focus on one hand at a time.

> The Grand Staff is your map. The treble clef shows where your right hand goes, the bass clef shows your left hand. Middle C is the meeting point.`,
      },
      {
        type: 'quiz',
        question: 'Where does Middle C appear on the Grand Staff?',
        options: [
          'On the top line of the treble clef',
          'On a ledger line between the two staves',
          'On the bottom line of the bass clef',
          'It is not shown on the staff',
        ],
        correctIndex: 1,
        explanation: 'Middle C sits on a ledger line between the treble and bass staves — it is the bridge between your right hand territory (treble) and left hand territory (bass).',
      },
    ],
  },
]

const MODULE_0_EXERCISES: Exercise[] = [
  {
    id: 'p0-e1',
    moduleId: 'piano-0',
    title: 'Find the Notes: C, D, E',
    description: 'Locate and play C, D, and E in different octaves across the keyboard.',
    order: 0,
    exerciseType: 'technique',
    difficulty: 1,
    handsRequired: 'right',
  },
  {
    id: 'p0-e2',
    moduleId: 'piano-0',
    title: 'Name All White Keys',
    description: 'Starting from the lowest C on your keyboard, name each white key going up one octave.',
    order: 1,
    exerciseType: 'technique',
    difficulty: 1,
    handsRequired: 'right',
  },
  {
    id: 'p0-e3',
    moduleId: 'piano-0',
    title: 'Finger Number Drill',
    description: 'Tap fingers 1-2-3-4-5 then 5-4-3-2-1 on a flat surface, saying numbers aloud. Both hands.',
    order: 2,
    exerciseType: 'technique',
    difficulty: 1,
    handsRequired: 'both',
  },
  {
    id: 'p0-e4',
    moduleId: 'piano-0',
    title: 'Staff Note Identification',
    description: 'Look at the staff guide and name each note position without checking the label.',
    order: 3,
    exerciseType: 'sight-reading',
    difficulty: 2,
    handsRequired: 'right',
  },
]

// ── Module 1: Playing Your First Notes ──────────────────────────────────────

const MODULE_1_LESSONS: Lesson[] = [
  {
    id: 'p1-l1',
    moduleId: 'piano-1',
    title: 'Right Hand C Position (C-D-E-F-G)',
    order: 0,
    completed: false,
    content: [
      {
        type: 'text',
        content: `The **C Position** is your home base for the first several lessons. It is the most fundamental hand position in all beginner piano methods (Alfred's, Faber, Bastien — all start here).

## Setting Up C Position — Right Hand

1. Find **Middle C** (to the left of the 2 black keys near the center)
2. Place your **right hand thumb (finger 1)** on Middle C
3. Place each remaining finger on the next white key:
   - Finger 1 → **C**
   - Finger 2 → **D**
   - Finger 3 → **E**
   - Finger 4 → **F**
   - Finger 5 → **G**

Each finger covers exactly one key. No stretching, no gaps.

## Important Checkpoints

- **Curved fingers** — maintain the "holding an egg" shape
- **Fingertips on keys** — not flat pads
- **Relaxed wrist** — not dropped below key level, not arched above
- **Thumb plays on its side** — the corner of the nail, not the flat pad

## Your First Five-Note Pattern

Play each note slowly, one at a time, going up and then back down:

**C — D — E — F — G — F — E — D — C**

Say the note names out loud as you play. This trains your brain to connect the finger movement with the note name.

> Practice this pattern 5 times, slowly and evenly. Speed is not the goal — evenness and correct fingers are.`,
      },
      {
        type: 'quiz',
        question: 'In Right Hand C Position, which finger plays the note F?',
        options: ['Finger 1 (thumb)', 'Finger 3 (middle)', 'Finger 4 (ring)', 'Finger 5 (pinky)'],
        correctIndex: 2,
        explanation: 'In C Position, finger 4 (ring finger) plays F. The pattern is: 1=C, 2=D, 3=E, 4=F, 5=G.',
      },
    ],
  },
  {
    id: 'p1-l2',
    moduleId: 'piano-1',
    title: 'Left Hand C Position',
    order: 1,
    completed: false,
    content: [
      {
        type: 'text',
        content: `Now let us set up the **C Position for your left hand**. The left hand C position is placed **one octave below** Middle C.

## Setting Up C Position — Left Hand

1. Find the **C one octave below Middle C** (this is C3)
2. Place your **left hand pinky (finger 5)** on this C
3. Place each remaining finger on the next white key going right:
   - Finger 5 → **C**
   - Finger 4 → **D**
   - Finger 3 → **E**
   - Finger 2 → **F**
   - Finger 1 (thumb) → **G**

Notice the **mirroring**: on the right hand, the thumb starts on C. On the left hand, the pinky starts on C. The finger numbers go in opposite directions, but the note names go the same way (C-D-E-F-G left to right).

## Left Hand Five-Note Pattern

Play the same pattern with your left hand:

**C — D — E — F — G — F — E — D — C**

Remember:
- Finger **5** plays C (pinky)
- Finger **4** plays D
- Finger **3** plays E
- Finger **2** plays F
- Finger **1** plays G (thumb)

## Common Left Hand Challenges

- The **ring finger (4) and pinky (5)** are naturally weaker — give them extra attention
- Maintain the **same curved shape** as your right hand
- The left hand will feel less coordinated at first — this is completely normal

> Practice the left hand five-note pattern 5 times, matching the same slow, even tempo you used for the right hand.`,
      },
      {
        type: 'quiz',
        question: 'In Left Hand C Position, which finger plays C?',
        options: ['Finger 1 (thumb)', 'Finger 2 (index)', 'Finger 4 (ring)', 'Finger 5 (pinky)'],
        correctIndex: 3,
        explanation: 'In the left hand C position, finger 5 (pinky) plays C. The fingers mirror the right hand: 5=C, 4=D, 3=E, 2=F, 1=G.',
      },
    ],
  },
  {
    id: 'p1-l3',
    moduleId: 'piano-1',
    title: 'Quarter Notes and Half Notes',
    order: 2,
    completed: false,
    content: [
      {
        type: 'text',
        content: `Now that you can find notes on the keyboard, you need to know **how long to hold them**. This is where **note values** come in.

## The Quarter Note 𝅘𝅥

- A **filled (black) oval** with a **stem**
- Duration: **1 beat**
- This is the basic unit of time in most music
- When you tap your foot to music, each tap is typically one beat = one quarter note

In 4/4 time, there are **4 quarter notes per measure**.

## The Half Note 𝅗𝅥

- An **open (white) oval** with a **stem**
- Duration: **2 beats**
- Hold it for **twice as long** as a quarter note
- In 4/4 time, there are **2 half notes per measure**

## How to Count

When practicing, count out loud:

- **Quarter notes**: "1, 2, 3, 4" (each number = one note)
- **Half notes**: "1—2, 3—4" (each note lasts for two counts)

## Stems

- Notes **below the middle line** of the staff have stems going **up** (on the right side)
- Notes **on or above the middle line** have stems going **down** (on the left side)

This is purely visual — it does not change the sound.

> Try playing C-D-E-F-G as quarter notes (1 beat each), then play C—E—G as half notes (2 beats each). Count "1-2" for each half note.`,
      },
      {
        type: 'quiz',
        question: 'How many beats does a half note last?',
        options: ['1 beat', '2 beats', '3 beats', '4 beats'],
        correctIndex: 1,
        explanation: 'A half note lasts 2 beats — exactly twice as long as a quarter note. It looks like an open (hollow) oval with a stem.',
      },
    ],
  },
  {
    id: 'p1-l4',
    moduleId: 'piano-1',
    title: 'Whole Notes and Counting',
    order: 3,
    completed: false,
    content: [
      {
        type: 'text',
        content: `## The Whole Note 𝅝

- An **open oval** with **no stem**
- Duration: **4 beats**
- In 4/4 time, one whole note fills an **entire measure**

## Note Value Summary

| Note | Symbol | Beats | How many in 4/4 |
| ---- | ------ | ----- | --------------- |
| Whole note | 𝅝 | 4 | 1 per measure |
| Half note | 𝅗𝅥 | 2 | 2 per measure |
| Quarter note | 𝅘𝅥 | 1 | 4 per measure |

## The Relationship

Notice the pattern:
- 1 whole note = **2** half notes = **4** quarter notes
- Each level **divides in half**

This mathematical relationship continues as we learn shorter notes (eighth notes, sixteenth notes) later.

## Counting Practice

Try this exercise on Middle C:

1. Play C as a **whole note** — count "1 — 2 — 3 — 4" (hold the key down for all 4 beats)
2. Play C as **half notes** — "1 — 2" (release), "3 — 4" (release)
3. Play C as **quarter notes** — "1" "2" "3" "4" (each played and released quickly)

> Always count out loud when learning rhythms. It trains your internal clock and makes everything else easier later.`,
      },
      {
        type: 'quiz',
        question: 'How many quarter notes equal one whole note?',
        options: ['2', '3', '4', '8'],
        correctIndex: 2,
        explanation: 'One whole note = 4 quarter notes. The whole note lasts 4 beats, and each quarter note lasts 1 beat.',
      },
    ],
  },
  {
    id: 'p1-l5',
    moduleId: 'piano-1',
    title: 'Time Signatures: 4/4 and 3/4',
    order: 4,
    completed: false,
    content: [
      {
        type: 'text',
        content: `## What Is a Time Signature?

At the beginning of every piece of music, you will see **two numbers stacked** at the start of the staff. This is the **time signature** — it tells you how to count.

## Reading a Time Signature

- **Top number** = how many beats per measure
- **Bottom number** = what kind of note gets one beat

## 4/4 Time (Common Time)

- **4** beats per measure
- A **quarter note** (4 = quarter) gets one beat
- This is the most common time signature in Western music
- Sometimes written as **C** (which stands for "Common time")

Count: **1 — 2 — 3 — 4 | 1 — 2 — 3 — 4 | ...**

## 3/4 Time (Waltz Time)

- **3** beats per measure
- A **quarter note** gets one beat
- Creates a "waltz" feel: **strong**-weak-weak
- Think of waltzes, many folk songs, and some ballads

Count: **1 — 2 — 3 | 1 — 2 — 3 | ...**

## Bar Lines and Measures

Vertical lines called **bar lines** divide music into **measures** (also called bars). Each measure contains exactly the number of beats specified by the time signature.

A **double bar line** marks the end of a section, and a **final bar line** (thin + thick) marks the end of the piece.

## Why It Matters

The time signature tells you the rhythmic "feel" of the music before you play a single note. Always check it first!`,
      },
      {
        type: 'quiz',
        question: 'In 3/4 time, how many beats are in each measure?',
        options: ['2', '3', '4', '6'],
        correctIndex: 1,
        explanation: 'The top number tells you how many beats per measure. In 3/4 time, there are 3 beats per measure, with a quarter note getting one beat.',
      },
    ],
  },
  {
    id: 'p1-l6',
    moduleId: 'piano-1',
    title: 'Reading Treble Clef Lines and Spaces',
    order: 5,
    completed: false,
    content: [
      {
        type: 'text',
        content: `Let us solidify your treble clef reading. Being able to instantly name notes on the staff is a skill that requires practice, but these mnemonics will help you get started.

## The Five Lines (bottom to top)

The notes on the **lines** of the treble clef are:

**E — G — B — D — F**

Mnemonic: **E**very **G**ood **B**oy **D**oes **F**ine

- Line 1 (bottom) = **E4** (the E above Middle C)
- Line 2 = **G4**
- Line 3 = **B4**
- Line 4 = **D5**
- Line 5 (top) = **F5**

## The Four Spaces (bottom to top)

The notes in the **spaces** spell a word:

**F — A — C — E**

Just remember: **FACE**

- Space 1 (bottom) = **F4**
- Space 2 = **A4** (this is the "tuning A" at 440 Hz)
- Space 3 = **C5**
- Space 4 (top) = **E5**

## Notes in C Position on the Staff

When you play in C Position (right hand), here is where each note lives:

| Note | Finger | Staff Position |
| ---- | ------ | -------------- |
| C4 (Middle C) | 1 | Ledger line below the staff |
| D4 | 2 | Below the staff (space) |
| E4 | 3 | First line |
| F4 | 4 | First space |
| G4 | 5 | Second line |

## Practice Strategy

Look at each note on the interactive staff above. Before checking the label, try to name it yourself. Speed will come with repetition.`,
      },
      {
        type: 'quiz',
        question: 'Which note sits on the first (bottom) line of the treble clef?',
        options: ['C', 'D', 'E', 'F'],
        correctIndex: 2,
        explanation: 'E sits on the first (bottom) line of the treble clef. Remember: Every Good Boy Does Fine — E is the first letter.',
      },
    ],
  },
  {
    id: 'p1-l7',
    moduleId: 'piano-1',
    title: 'Reading Bass Clef Lines and Spaces',
    order: 6,
    completed: false,
    content: [
      {
        type: 'text',
        content: `Now let us learn the bass clef — the territory of your left hand.

## The Five Lines (bottom to top)

**G — B — D — F — A**

Mnemonic: **G**ood **B**oys **D**o **F**ine **A**lways

- Line 1 (bottom) = **G2**
- Line 2 = **B2**
- Line 3 = **D3**
- Line 4 = **F3**
- Line 5 (top) = **A3**

## The Four Spaces (bottom to top)

**A — C — E — G**

Mnemonic: **A**ll **C**ows **E**at **G**rass

- Space 1 (bottom) = **A2**
- Space 2 = **C3**
- Space 3 = **E3**
- Space 4 (top) = **G3**

## Notes in Left Hand C Position on the Staff

| Note | Finger | Staff Position |
| ---- | ------ | -------------- |
| C3 | 5 | Second space |
| D3 | 4 | Third line |
| E3 | 3 | Third space |
| F3 | 2 | Fourth line |
| G3 | 1 | Fourth space |

## Connecting the Two Clefs

Notice how the bass clef notes continue downward from where the treble clef left off. Middle C sits on a ledger line between them — it belongs to both clefs:

- In treble clef: one ledger line **below**
- In bass clef: one ledger line **above**

> Go through the interactive staff above, switching between treble and bass views. Try to name each note before hovering to check.`,
      },
      {
        type: 'quiz',
        question: 'What mnemonic helps remember the bass clef spaces?',
        options: ['FACE', 'Every Good Boy Does Fine', 'All Cows Eat Grass', 'Good Boys Do Fine Always'],
        correctIndex: 2,
        explanation: 'All Cows Eat Grass (A-C-E-G) gives you the four spaces of the bass clef from bottom to top.',
      },
    ],
  },
  {
    id: 'p1-l8',
    moduleId: 'piano-1',
    title: 'Your First Right Hand Melody',
    order: 7,
    completed: false,
    content: [
      {
        type: 'text',
        content: `Time to combine everything you have learned into your first real melody! This is the moment where notes on a page become music under your fingers.

## "Ode to Joy" (Right Hand) — Beethoven

This famous melody uses only the notes in C Position (C-D-E-F-G) and is in 4/4 time. All notes are quarter notes unless marked otherwise.

### The Melody

Line 1:
**E E F G | G F E D | C C D E | E — D D —**

Line 2:
**E E F G | G F E D | C C D E | D — C C —**

The dashes indicate the note is held for 2 beats (half note).

## How to Practice

1. **Say the note names** first, without playing, while tapping the rhythm
2. **Play very slowly** — aim for about 60 BPM (1 note per second)
3. **Stop at each bar line** and check: are you using the correct fingers?
4. **Loop difficult measures** 3-5 times before moving on
5. **Connect the lines** once each is comfortable separately

## Finger Numbers for Reference

| Note | Finger |
| ---- | ------ |
| C | 1 |
| D | 2 |
| E | 3 |
| F | 4 |
| G | 5 |

> The goal is not speed — it is accuracy. Play slowly enough that you never make a mistake. Your brain learns what you repeat, so only repeat correct playing.`,
      },
      {
        type: 'quiz',
        question: 'What is the first note of "Ode to Joy"?',
        options: ['C', 'D', 'E', 'G'],
        correctIndex: 2,
        explanation: 'Ode to Joy begins on E — played with finger 3 (middle finger) in C Position.',
      },
    ],
  },
  {
    id: 'p1-l9',
    moduleId: 'piano-1',
    title: 'Your First Left Hand Melody',
    order: 8,
    completed: false,
    content: [
      {
        type: 'text',
        content: `Now let us give your left hand a turn with a simple melody in C Position.

## "Aura Lee" (Left Hand) — Simple Arrangement

This melody uses C, D, E, F, and G in the left hand C position (one octave below Middle C). All notes are quarter notes in 4/4 time.

### The Melody

Line 1:
**C D E F | G G G — | F E F G | E — E —**

Line 2:
**C D E F | G G G — | F E F D | C — C —**

## Left Hand Finger Reminders

| Note | Finger |
| ---- | ------ |
| C | 5 (pinky) |
| D | 4 (ring) |
| E | 3 (middle) |
| F | 2 (index) |
| G | 1 (thumb) |

## Practice Tips for Left Hand

The left hand is typically less coordinated for right-handed people. Here are specific tips:

1. **Practice each line separately** at least 5 times before connecting them
2. **Watch your ring finger (4)** — it tends to collapse or stick to the middle finger
3. **Keep your wrist level** — the left hand tends to drop or twist
4. **Match the tempo** you used for the right hand melody
5. **Do not rush** to play hands together yet — that comes in Module 2

## Challenge

Once you can play this melody smoothly, try playing the right hand "Ode to Joy" first, then immediately switch to the left hand "Aura Lee" without pausing. This trains your brain to switch between hands quickly.`,
      },
      {
        type: 'quiz',
        question: 'In Left Hand C Position, which finger plays G?',
        options: ['Finger 5 (pinky)', 'Finger 3 (middle)', 'Finger 2 (index)', 'Finger 1 (thumb)'],
        correctIndex: 3,
        explanation: 'In the left hand C position, finger 1 (thumb) plays G. The numbering goes: 5=C, 4=D, 3=E, 2=F, 1=G.',
      },
    ],
  },
  {
    id: 'p1-l10',
    moduleId: 'piano-1',
    title: 'Rests: The Silence Between Notes',
    order: 9,
    completed: false,
    content: [
      {
        type: 'text',
        content: `Music is not just about the notes you play — it is equally about the **silence between them**. Rests tell you when **not** to play.

## Rest Values

Every note value has a corresponding rest of the same duration:

| Note | Rest Symbol | Beats of Silence |
| ---- | ----------- | ---------------- |
| Whole note | 𝄻 (hangs from line 4) | 4 beats |
| Half note | 𝄼 (sits on line 3) | 2 beats |
| Quarter note | 𝄽 (zigzag shape) | 1 beat |

## Whole Rest vs Half Rest — The Classic Confusion

These two look very similar! Here is how to tell them apart:

- **Whole rest** 𝄻 — hangs **below** the line (think: it is so heavy it sinks down). Also: "**W**hole = goes **d**own" (W looks like it hangs down)
- **Half rest** 𝄼 — sits **on top** of the line (think: it is lighter, it floats). Also: "**H**alf = **h**at on a head"

## Why Rests Matter

- Rests create **rhythm and phrasing** — music without rests sounds like a wall of sound
- You must **count through rests** just like notes — never skip or rush past them
- Rests give your hands a moment to **reposition** for the next passage
- In many styles, the rests are what create the "groove"

## Practice: Counting with Rests

Clap this rhythm (in 4/4 time):

**Clap — Clap — Rest — Clap | Rest — Clap — Clap — Rest**

Count "1-2-3-4" steadily. Clap on beats 1, 2, 4 in the first measure, and beats 2, 3 in the second. Rest means hands stay still — but keep counting!

> Silence is not the absence of music. It is part of the music. Treat every rest with the same attention you give to notes.`,
      },
      {
        type: 'quiz',
        question: 'How can you tell a whole rest from a half rest?',
        options: [
          'The whole rest is larger',
          'The whole rest hangs below the line, the half rest sits on top',
          'They look identical',
          'The half rest has a dot',
        ],
        correctIndex: 1,
        explanation: 'The whole rest hangs below the fourth line (like it is heavy), while the half rest sits on top of the third line (like a hat). This is the most common visual confusion for beginners.',
      },
    ],
  },
]

const MODULE_1_EXERCISES: Exercise[] = [
  {
    id: 'p1-e1',
    moduleId: 'piano-1',
    title: 'RH C Position Scale',
    description: 'Play C-D-E-F-G-F-E-D-C with correct fingers, slowly and evenly.',
    order: 0,
    exerciseType: 'scale',
    difficulty: 1,
    handsRequired: 'right',
    keySignature: 'C',
    targetBpm: 60,
  },
  {
    id: 'p1-e2',
    moduleId: 'piano-1',
    title: 'LH C Position Scale',
    description: 'Play C-D-E-F-G-F-E-D-C with correct left hand fingers.',
    order: 1,
    exerciseType: 'scale',
    difficulty: 1,
    handsRequired: 'left',
    keySignature: 'C',
    targetBpm: 60,
  },
  {
    id: 'p1-e3',
    moduleId: 'piano-1',
    title: 'Ode to Joy (Right Hand)',
    description: 'Play the full right hand melody of Ode to Joy in C Position.',
    order: 2,
    exerciseType: 'melody',
    difficulty: 2,
    handsRequired: 'right',
    keySignature: 'C',
    timeSignature: [4, 4],
    targetBpm: 72,
  },
  {
    id: 'p1-e4',
    moduleId: 'piano-1',
    title: 'Aura Lee (Left Hand)',
    description: 'Play the full left hand melody of Aura Lee in C Position.',
    order: 3,
    exerciseType: 'melody',
    difficulty: 2,
    handsRequired: 'left',
    keySignature: 'C',
    timeSignature: [4, 4],
    targetBpm: 72,
  },
  {
    id: 'p1-e5',
    moduleId: 'piano-1',
    title: 'Note Reading: Treble Clef',
    description: 'Name treble clef notes as fast as you can — lines and spaces.',
    order: 4,
    exerciseType: 'sight-reading',
    difficulty: 2,
    handsRequired: 'right',
  },
  {
    id: 'p1-e6',
    moduleId: 'piano-1',
    title: 'Note Reading: Bass Clef',
    description: 'Name bass clef notes as fast as you can — lines and spaces.',
    order: 5,
    exerciseType: 'sight-reading',
    difficulty: 2,
    handsRequired: 'left',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// Module Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export const CURRICULUM: Module[] = [
  {
    id: 'piano-0',
    name: 'Introduction to the Piano',
    description: 'The keyboard layout, posture, finger numbers, the musical alphabet, and reading the staff.',
    order: 0,
    lessons: MODULE_0_LESSONS,
    exercises: MODULE_0_EXERCISES,
    unlockRequirements: {},
  },
  {
    id: 'piano-1',
    name: 'Playing Your First Notes',
    description: 'C Position for both hands, note values, time signatures, staff reading, and your first melodies.',
    order: 1,
    lessons: MODULE_1_LESSONS,
    exercises: MODULE_1_EXERCISES,
    unlockRequirements: { requiredModuleComplete: 'piano-0' },
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

export function getLessonById(lessonId: string): Lesson | undefined {
  for (const m of CURRICULUM) {
    const lesson = m.lessons.find((l) => l.id === lessonId)
    if (lesson) return lesson
  }
  return undefined
}

export function getModuleById(moduleId: string): Module | undefined {
  return CURRICULUM.find((m) => m.id === moduleId)
}

export function getExerciseById(exerciseId: string): Exercise | undefined {
  for (const m of CURRICULUM) {
    const exercise = m.exercises.find((e) => e.id === exerciseId)
    if (exercise) return exercise
  }
  return undefined
}
