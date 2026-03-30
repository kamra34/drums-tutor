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

// ── Module 2: Hands Together & Rhythm ────────────────────────────────────────

const MODULE_2_LESSONS: Lesson[] = [
  {
    id: 'p2-l1', moduleId: 'piano-2', title: 'Hands Together: First Steps', order: 0, completed: false,
    content: [
      { type: 'text', content: `Playing with both hands simultaneously is the defining challenge of piano. Do not worry if it feels impossible at first — **everyone** struggles with this. Your brain needs time to develop independent control of each hand.

## The Golden Rule

**Never** try to play both hands together until each hand can play its part **perfectly alone**. If you cannot play the right hand from memory without looking, you are not ready for hands together.

## Starting Exercise: Mirror Motion

Both hands play the same notes at the same time (called **parallel motion**):

1. Place both hands in C Position (RH on C4-G4, LH on C3-G3)
2. Play C with both hands simultaneously (RH finger 1 + LH finger 5)
3. Play D with both hands (RH finger 2 + LH finger 4)
4. Continue up: E, F, G... then back down: G, F, E, D, C

This is the easiest way to start because both hands do the same thing.

## Practice Method: The Slow-Add Technique

1. Play RH alone 5 times, slowly
2. Play LH alone 5 times, at the same tempo
3. Play JUST the first measure with both hands — very slowly
4. Add one measure at a time
5. Never speed up until you can play it perfectly slow` },
      { type: 'quiz', question: 'What should you do before attempting to play hands together?', options: ['Start very fast and slow down', 'Play each hand perfectly alone first', 'Only practice the right hand', 'Skip to the hardest section'], correctIndex: 1, explanation: 'Each hand must be able to play its part perfectly alone before combining them. This is the most efficient path — trying to learn both at once is slower.' },
    ],
  },
  {
    id: 'p2-l2', moduleId: 'piano-2', title: 'Parallel Motion in C Position', order: 1, completed: false,
    content: [
      { type: 'text', content: `**Parallel motion** means both hands move in the same direction at the same time. In C Position, this means both hands play C-D-E-F-G together, going up, then back down.

## Why Parallel Motion First?

It is the easiest type of hands-together playing because:
- Both hands move the **same direction**
- Both hands play at the **same time**
- You only need to think about **one line** of music

## Exercise 1: C Position Parallel Scale

Both hands in C Position. Play together, slowly:

**C — D — E — F — G — F — E — D — C**

RH: 1 — 2 — 3 — 4 — 5 — 4 — 3 — 2 — 1
LH: 5 — 4 — 3 — 2 — 1 — 2 — 3 — 4 — 5

## Exercise 2: Parallel Thirds

Play notes a third apart in each hand (skip one white key):

**C+E — D+F — E+G** (ascending) then back down

This introduces playing different notes in each hand while still moving in parallel.

## Common Issues

- **One hand rushes ahead** — slow down until both stay perfectly together
- **One hand plays louder** — listen carefully and match the volume
- **Tension in shoulders** — relax! Drop your shoulders every few bars` },
      { type: 'quiz', question: 'In parallel motion, both hands move in...', options: ['Opposite directions', 'The same direction at the same time', 'Different rhythms', 'Random directions'], correctIndex: 1, explanation: 'Parallel motion means both hands move in the same direction simultaneously — both go up together, both go down together.' },
    ],
  },
  {
    id: 'p2-l3', moduleId: 'piano-2', title: 'Contrary Motion Basics', order: 2, completed: false,
    content: [
      { type: 'text', content: `**Contrary motion** means the hands move in **opposite directions** — one goes up while the other goes down. This is harder than parallel motion because each hand does something different.

## Why Learn Contrary Motion?

- It appears constantly in real piano music
- It develops **hand independence** — the core piano skill
- It strengthens the weaker connections between your brain and fingers

## Exercise: C Position Contrary Motion

Start with both thumbs on the same note area, then move outward:

RH starts on C4 going up: **C — D — E — F — G**
LH starts on C4 going down: **C — B3 — A3 — G3 — F3**

Then reverse — hands move inward back to C.

## Tips for Contrary Motion

1. **Start extremely slowly** — half the speed you think you need
2. **Focus on the thumbs** — they are the pivot point
3. **Look at both hands equally** — do not fixate on one
4. **Count out loud** — "1, 2, 3, 4" to keep hands synchronized
5. The motion should feel **symmetrical** — like opening and closing a book` },
      { type: 'quiz', question: 'In contrary motion, the hands...', options: ['Play the same notes', 'Move in opposite directions', 'Play at different tempos', 'Always play chords'], correctIndex: 1, explanation: 'Contrary motion means the hands move in opposite directions — when one goes up, the other goes down. Like opening a book.' },
    ],
  },
  {
    id: 'p2-l4', moduleId: 'piano-2', title: 'Dotted Half Notes and Ties', order: 3, completed: false,
    content: [
      { type: 'text', content: `## The Dotted Half Note 𝅗𝅥.

A **dot** after any note adds **half of that note's value** to it:

- Half note = 2 beats
- Dot adds half of 2 = 1 beat
- **Dotted half note = 3 beats**

This is the most common dotted note for beginners. It fills a complete measure of **3/4 time** (waltz time).

## The Dot Rule (applies to ALL notes)

| Original note | Beats | + Dot (half the value) | Total |
| ------------- | ----- | ---------------------- | ----- |
| Whole note | 4 | + 2 | 6 beats |
| Half note | 2 | + 1 | **3 beats** |
| Quarter note | 1 | + 0.5 | 1.5 beats |

## Ties

A **tie** is a curved line connecting two notes of the **same pitch**. You play the first note and **hold it** for the combined duration of both notes. Do not strike the second note.

Example: A half note (2) tied to a quarter note (1) = hold for **3 beats total**.

### Tie vs Slur

- **Tie**: connects two notes of the **same pitch** — hold the note
- **Slur**: connects notes of **different pitches** — play them legato (smoothly connected)

They look similar (both are curved lines), but ties always connect the same note.` },
      { type: 'quiz', question: 'How many beats does a dotted half note last?', options: ['2 beats', '2.5 beats', '3 beats', '4 beats'], correctIndex: 2, explanation: 'A half note = 2 beats. The dot adds half its value (1 beat). So a dotted half note = 2 + 1 = 3 beats.' },
    ],
  },
  {
    id: 'p2-l5', moduleId: 'piano-2', title: 'Slurs and Legato Playing', order: 4, completed: false,
    content: [
      { type: 'text', content: `**Legato** (Italian for "tied" or "bound") means playing notes **smoothly connected** with no gaps between them. This is the default way to play piano — unless marked otherwise.

## How to Play Legato

The technique is simple in concept, tricky in practice:

1. Press the first key
2. Press the next key while **still holding** the first
3. Release the first key **at the exact moment** the second key goes down
4. There should be the tiniest overlap — never a gap

Think of it like walking: one foot is always on the ground before the other lifts.

## Slurs in Sheet Music

A **slur** is a curved line over or under a group of notes. It means:
- Play all the notes within the slur **legato**
- **Lift slightly** at the end of the slur before the next phrase
- The first note of a slur is often slightly emphasized
- The last note is often slightly shortened

Slurs define **musical phrases** — like sentences in speech.

## Practice: Legato Five-Finger Pattern

Play C-D-E-F-G very slowly in C Position. Listen for:
- Is there a gap between notes? (bad — practice slower)
- Can you hear both notes sounding at once? (brief overlap is correct)
- Is the volume even? (each note should be the same loudness)

> Legato is the foundation of beautiful piano tone. Invest time here — it pays off in everything you play later.` },
      { type: 'quiz', question: 'What does legato mean?', options: ['Play short and detached', 'Play smoothly connected with no gaps', 'Play very loudly', 'Play with the pedal'], correctIndex: 1, explanation: 'Legato means playing smoothly connected — each note flows into the next with no silence between them. It is the default playing style on piano.' },
    ],
  },
  {
    id: 'p2-l6', moduleId: 'piano-2', title: 'Dynamics: Piano, Mezzo Forte, Forte', order: 5, completed: false,
    content: [
      { type: 'text', content: `**Dynamics** are the volume levels in music. They are written in Italian abbreviations and tell you how loud or soft to play.

## The Three Essential Dynamics

| Symbol | Name | Meaning | How to achieve it |
| ------ | ---- | ------- | ----------------- |
| **p** | *piano* | Soft | Use less arm weight, lighter finger touch |
| **mf** | *mezzo forte* | Moderately loud | Natural, comfortable playing weight |
| **f** | *forte* | Loud | More arm weight, firm fingers, deeper key press |

## Important: Volume Comes from ARM WEIGHT, Not Finger Force

This is the most common beginner mistake. To play louder:
- **Do**: Let the weight of your arm drop into the keys through firm fingertips
- **Do NOT**: Press harder with your fingers while keeping your arm tense

Think of your arm as a weight hanging from your shoulder. To play loud, let more of that weight fall into the keys. To play soft, support more of the weight with your shoulder.

## Gradual Changes

- **Crescendo** (cresc. or <) — gradually get louder
- **Diminuendo** (dim. or >) — gradually get softer

These are more expressive than sudden dynamic changes and appear constantly in music.

## Practice: Dynamic Control

Play the C Position scale (C-D-E-F-G-F-E-D-C):
1. First time: all **p** (soft)
2. Second time: all **f** (loud)
3. Third time: **crescendo** from p to f going up, **diminuendo** from f to p going down

Listen to the difference. Can you make the soft notes still sound clear? Can you make the loud notes sound full without banging?` },
      { type: 'quiz', question: 'What does "mf" mean?', options: ['Very soft', 'Moderately soft', 'Moderately loud', 'Very loud'], correctIndex: 2, explanation: 'mf stands for "mezzo forte" — moderately loud. It is the default dynamic level when no marking is given.' },
    ],
  },
  {
    id: 'p2-l7', moduleId: 'piano-2', title: 'Eighth Notes', order: 6, completed: false,
    content: [
      { type: 'text', content: `## The Eighth Note 𝅘𝅥𝅮

An eighth note lasts **half a beat** — two eighth notes fill the space of one quarter note.

### How to Recognize Them

- Single eighth note: filled oval + stem + **one flag**
- Paired eighth notes: filled ovals + stems + **one beam** connecting them

When eighth notes appear in pairs or groups, their flags are replaced by a **beam** (a thick line connecting the stems). This makes them easier to read.

## Counting Eighth Notes

Use "and" between the beat numbers:

**"1 and 2 and 3 and 4 and"**

Written as: **1 & 2 & 3 & 4 &**

Each number AND each "and" is one eighth note.

## Mixing Quarter and Eighth Notes

This is where rhythm gets interesting:

| Beat | 1 | & | 2 | & | 3 | & | 4 | & |
| ---- | - | - | - | - | - | - | - | - |
| Pattern 1 | ♩ | | ♩ | | ♫ | ♫ | ♩ | |
| Counting | 1 | | 2 | | 3 | & | 4 | |

Pattern 1 has: quarter, quarter, two eighths, quarter.

## Practice

Clap this rhythm while counting:

**1 — 2 — 3 & 4 —** (quarter, quarter, eighth-eighth, quarter)

Then play it on C in your right hand. The eighth notes should feel exactly twice as fast as the quarter notes.` },
      { type: 'quiz', question: 'How many eighth notes fit in one quarter note?', options: ['1', '2', '3', '4'], correctIndex: 1, explanation: 'Two eighth notes equal one quarter note. Each eighth note lasts half a beat.' },
    ],
  },
  {
    id: 'p2-l8', moduleId: 'piano-2', title: 'Your First Chords: C and G7', order: 7, completed: false,
    content: [
      { type: 'text', content: `A **chord** is three or more notes played simultaneously. Chords provide the **harmony** — the supporting backdrop for melodies. Learning chords is one of the most rewarding steps because suddenly you can accompany songs.

## C Major Chord

The simplest chord, built from three notes of the C major scale:

- **C** (root) — finger 1
- **E** (third) — finger 3
- **G** (fifth) — finger 5

Play all three notes at exactly the same time. The sound should be bright, stable, and resolved — like "home."

## G7 Chord (G Dominant Seventh)

The chord that pulls you back to C:

- **G** — finger 1 (or 5 in LH)
- **B** — finger 2 (or 3 in LH)
- **D** — finger 3 (or 2 in LH)
- **F** — finger 5 (or 1 in LH)

G7 has a feeling of **tension** — it wants to resolve to C. This C → G7 → C movement is the most fundamental progression in all Western music.

## Playing Chords: Technique

- Press all notes **simultaneously** — not rolled/arpeggiated
- Use **arm weight** to push down evenly
- Keep fingers **curved and firm** — do not collapse
- Listen: are all notes equally loud? No note should stick out

## Left Hand Accompaniment Pattern

Try this simple pattern:
1. LH plays C chord (C3-E3-G3) — hold for 4 beats
2. LH plays G7 chord (G2-B2-D3-F3) — hold for 4 beats
3. Back to C chord
4. Repeat

This is the basis of thousands of songs!` },
      { type: 'quiz', question: 'What notes make up the C major chord?', options: ['C-D-E', 'C-E-G', 'C-F-G', 'C-D-G'], correctIndex: 1, explanation: 'The C major chord is built from the 1st (C), 3rd (E), and 5th (G) notes of the C major scale.' },
    ],
  },
  {
    id: 'p2-l9', moduleId: 'piano-2', title: 'Key of C Major', order: 8, completed: false,
    content: [
      { type: 'text', content: `## What Is a Key?

A **key** defines which set of notes a piece of music uses. The **key of C major** uses only the white keys — no sharps or flats. That is why it is the easiest key to learn first.

## The C Major Scale

The C major scale is the sequence of all white keys from C to C:

**C — D — E — F — G — A — B — C**

This pattern of **whole steps and half steps** is what defines a major scale:

**W — W — H — W — W — W — H**

Where W = whole step (skip one key) and H = half step (very next key).

The two half steps occur between **E-F** and **B-C** — these are the only pairs of white keys with no black key between them.

## Key Signature

The key of C major has **no sharps and no flats** in its key signature. In sheet music, you will see an empty space between the clef and the time signature — that means C major (or its relative minor, A minor).

## Why Keys Matter

When you see "Key of C Major" at the start of a piece:
- You know the scale is C-D-E-F-G-A-B
- The primary chords are C (I), F (IV), G7 (V7)
- The "home base" note and chord is C
- No black keys are needed (unless marked with accidentals)

## The Three Primary Chords in C

| Chord | Roman numeral | Notes | Function |
| ----- | ------------- | ----- | -------- |
| **C** | I | C-E-G | Home (tonic) |
| **F** | IV | F-A-C | Departure (subdominant) |
| **G7** | V7 | G-B-D-F | Tension (dominant) |

These three chords can accompany a huge number of songs. Try playing: **C — F — G7 — C**. Hear how it creates a journey that returns home?` },
      { type: 'quiz', question: 'How many sharps or flats does the key of C major have?', options: ['1 sharp', '1 flat', '2 sharps', 'None — all white keys'], correctIndex: 3, explanation: 'C major is the only major key with no sharps or flats. Its key signature is empty, and it uses only the white keys.' },
    ],
  },
]

const MODULE_2_EXERCISES: Exercise[] = [
  { id: 'p2-e1', moduleId: 'piano-2', title: 'Parallel Motion Scale', description: 'Play C-D-E-F-G and back with both hands in parallel, slowly and evenly.', order: 0, exerciseType: 'technique', difficulty: 3, handsRequired: 'both', keySignature: 'C', targetBpm: 60 },
  { id: 'p2-e2', moduleId: 'piano-2', title: 'Contrary Motion Scale', description: 'Both hands start on C, move outward to G/F, then return to C.', order: 1, exerciseType: 'technique', difficulty: 3, handsRequired: 'both', keySignature: 'C', targetBpm: 56 },
  { id: 'p2-e3', moduleId: 'piano-2', title: 'Eighth Note Rhythm', description: 'Clap and play: quarter-quarter-eighth-eighth-quarter. Count 1-2-3&4.', order: 2, exerciseType: 'technique', difficulty: 2, handsRequired: 'right', keySignature: 'C', targetBpm: 72 },
  { id: 'p2-e4', moduleId: 'piano-2', title: 'C Major Chord Practice', description: 'Play the C major chord (C-E-G) with both hands. Hold for 4 beats, release, repeat.', order: 3, exerciseType: 'chord-progression', difficulty: 2, handsRequired: 'both', keySignature: 'C' },
  { id: 'p2-e5', moduleId: 'piano-2', title: 'G7 Chord Practice', description: 'Play G7 (G-B-D-F) with the left hand. Hold, release, repeat.', order: 4, exerciseType: 'chord-progression', difficulty: 2, handsRequired: 'left', keySignature: 'C' },
  { id: 'p2-e6', moduleId: 'piano-2', title: 'C — G7 — C Progression', description: 'Alternate between C major and G7 chords. 4 beats each. Feel the tension and resolution.', order: 5, exerciseType: 'chord-progression', difficulty: 3, handsRequired: 'both', keySignature: 'C', targetBpm: 60 },
]

// ── Module 3: Expanding Range & Technique ───────────────────────────────────

const MODULE_3_LESSONS: Lesson[] = [
  {
    id: 'p3-l1', moduleId: 'piano-3', title: 'G Position: Right Hand', order: 0, completed: false,
    content: [
      { type: 'text', content: `You have mastered C Position. Now it is time to move to **G Position** — your second home on the keyboard. This expands your range and introduces a new set of notes.

## Setting Up G Position — Right Hand

1. Move your right hand up so **finger 1 (thumb)** is on **G4**
2. Place each finger on the next white key:
   - Finger 1 → **G**
   - Finger 2 → **A**
   - Finger 3 → **B**
   - Finger 4 → **C** (C5 — one octave above Middle C)
   - Finger 5 → **D** (D5)

## New Notes: A and B

You already know C, D, E, F, G from C Position. G Position introduces:
- **A** — between G and B on the keyboard
- **B** — the white key just left of the group of 3 black keys (from above)

## On the Staff

In treble clef G Position:
| Note | Staff position |
| ---- | -------------- |
| G4 | Second line |
| A4 | Second space |
| B4 | Third line |
| C5 | Third space |
| D5 | Fourth line |

## Practice

Play the G Position five-finger pattern: **G — A — B — C — D — C — B — A — G**

Then play the C Position pattern followed immediately by the G Position pattern. Practice the **shift** — sliding your hand from one position to the other smoothly.` },
      { type: 'quiz', question: 'In G Position (right hand), which note does finger 1 play?', options: ['C', 'D', 'G', 'A'], correctIndex: 2, explanation: 'In G Position, finger 1 (thumb) plays G. The five notes are G-A-B-C-D.' },
    ],
  },
  {
    id: 'p3-l2', moduleId: 'piano-3', title: 'G Position: Left Hand', order: 1, completed: false,
    content: [
      { type: 'text', content: `## Setting Up G Position — Left Hand

1. Place **finger 5 (pinky)** on **G2** (or G3 depending on the piece)
2. Each finger on the next white key going right:
   - Finger 5 → **G**
   - Finger 4 → **A**
   - Finger 3 → **B**
   - Finger 2 → **C**
   - Finger 1 → **D**

## Bass Clef G Position

In bass clef:
| Note | Finger | Staff position |
| ---- | ------ | -------------- |
| G2 | 5 | Bottom line |
| A2 | 4 | Bottom space |
| B2 | 3 | Second line |
| C3 | 2 | Second space |
| D3 | 1 | Third line |

## Switching Between C and G Position

This is a critical skill. Practice:
1. Play C Position LH: C-D-E-F-G (5-4-3-2-1)
2. Shift to G Position: G-A-B-C-D (5-4-3-2-1)
3. Back to C Position

The shift should be smooth — lift the hand slightly, move to the new position, and place fingers without looking down. Eventually this should feel as natural as moving your hand on a keyboard while typing.

## Both Hands in G Position

Try the parallel motion exercise from Module 2, but in G Position:

**G — A — B — C — D — C — B — A — G**

RH: 1-2-3-4-5-4-3-2-1
LH: 5-4-3-2-1-2-3-4-5` },
      { type: 'quiz', question: 'In Left Hand G Position, which finger plays G?', options: ['Finger 1', 'Finger 3', 'Finger 5', 'Finger 2'], correctIndex: 2, explanation: 'In the left hand G Position, finger 5 (pinky) plays G — the same finger-to-lowest-note pattern as C Position.' },
    ],
  },
  {
    id: 'p3-l3', moduleId: 'piano-3', title: 'Sharps, Flats, and Naturals', order: 2, completed: false,
    content: [
      { type: 'text', content: `Now we introduce the **black keys** and the symbols that refer to them.

## Sharp (♯)

A **sharp** raises a note by one **half step** (the very next key to the right, whether black or white).

- C♯ = the black key to the right of C
- F♯ = the black key to the right of F
- E♯ = F (because E to F is already a half step — no black key between them)

## Flat (♭)

A **flat** lowers a note by one **half step** (the very next key to the left).

- B♭ = the black key to the left of B
- E♭ = the black key to the left of E
- C♭ = B (because B to C is already a half step)

## Natural (♮)

A **natural** cancels a sharp or flat, returning the note to its original white key.

## Enharmonic Equivalents

The same black key can have two names:
- C♯ = D♭ (same key!)
- F♯ = G♭ (same key!)
- G♯ = A♭ (same key!)

Which name is used depends on the musical context (the key signature).

## How Accidentals Work in Sheet Music

- An accidental applies to **that note for the rest of the measure**
- It is cancelled by a bar line (new measure = reset)
- A natural sign cancels it earlier if needed
- Key signature accidentals apply to **every occurrence** of that note throughout the piece` },
      { type: 'quiz', question: 'What does a sharp do to a note?', options: ['Lowers it by one half step', 'Raises it by one half step', 'Makes it louder', 'Holds it longer'], correctIndex: 1, explanation: 'A sharp raises a note by one half step — moving to the very next key to the right on the keyboard.' },
    ],
  },
  {
    id: 'p3-l4', moduleId: 'piano-3', title: 'Half Steps and Whole Steps', order: 3, completed: false,
    content: [
      { type: 'text', content: `Understanding **half steps** and **whole steps** is essential for scales, chords, and all of music theory. These are the two smallest building blocks of Western music.

## Half Step (Semitone)

A **half step** is the distance from one key to the **very next key** — including black keys. It is the smallest interval on the piano.

Examples:
- C to C♯ = half step
- E to F = half step (no black key between them!)
- B to C = half step (no black key between them!)

## Whole Step (Tone)

A **whole step** = two half steps. Skip one key.

Examples:
- C to D = whole step (skips C♯)
- E to F♯ = whole step (skips F)
- A to B = whole step (skips A♯/B♭)

## The Major Scale Formula

Every major scale follows the same pattern of whole and half steps:

**W — W — H — W — W — W — H**

Applied to C major:
- C →(W)→ D →(W)→ E →(H)→ F →(W)→ G →(W)→ A →(W)→ B →(H)→ C

The half steps always fall between notes **3-4** and **7-8** of the scale.

## Why This Matters

This formula lets you build a major scale starting on **any note**. Want G major? Start on G, apply W-W-H-W-W-W-H, and you get G-A-B-C-D-E-F♯-G. The F♯ is required to maintain the pattern!` },
      { type: 'quiz', question: 'Which pairs of white keys are a half step apart (no black key between them)?', options: ['C-D and F-G', 'E-F and B-C', 'D-E and A-B', 'All white keys are whole steps'], correctIndex: 1, explanation: 'E-F and B-C are the only pairs of white keys with no black key between them — they are natural half steps.' },
    ],
  },
  {
    id: 'p3-l5', moduleId: 'piano-3', title: 'The Damper Pedal', order: 4, completed: false,
    content: [
      { type: 'text', content: `The **damper pedal** (also called the sustain pedal) is the rightmost pedal on the piano. It is the most frequently used pedal and transforms the sound of the instrument.

## What It Does

When you press the damper pedal:
1. All the **dampers** lift off the strings
2. Notes continue to ring **after you release the keys**
3. Other strings **vibrate sympathetically**, creating a richer sound
4. The overall sound becomes warmer and more connected

## When to Use It

- To connect notes that your fingers cannot reach (e.g., wide jumps)
- To create a sustained, resonant sound for slow passages
- To blend harmonies together
- To add warmth and depth to the tone

## When NOT to Use It

- Fast passages with changing harmonies — everything blurs together
- When the music requires a dry, crisp articulation
- As a crutch for bad legato technique

## Pedal Markings in Sheet Music

- **Ped.** or **⌐** = press the pedal
- ***** or **꜔** = release the pedal
- A bracket line under the staff shows pedal duration

## Your First Pedal Exercise

1. Play a C major chord (C-E-G)
2. Press the pedal **after** striking the chord
3. Release the keys — the chord keeps ringing
4. Play a G7 chord (G-B-D-F)
5. **Lift and re-press** the pedal quickly (legato pedaling)
6. The old chord clears and the new chord sustains

This lift-and-re-press technique is called **legato pedaling** and is the most important pedal skill to learn.` },
      { type: 'quiz', question: 'What happens when you press the damper pedal?', options: ['Notes play louder', 'Notes continue to ring after you release the keys', 'The piano plays softer', 'It changes the pitch'], correctIndex: 1, explanation: 'The damper pedal lifts all dampers, allowing strings to vibrate freely. Notes sustain even after you release the keys.' },
    ],
  },
  {
    id: 'p3-l6', moduleId: 'piano-3', title: 'Eighth Note Patterns and Counting', order: 5, completed: false,
    content: [
      { type: 'text', content: `Now let us develop fluency with eighth notes by learning common patterns that appear in real music.

## Pattern 1: Steady Eighths

All eighth notes, counted evenly:

**1 & 2 & 3 & 4 &** (8 equal notes per measure)

Play C-D-E-F-G-F-E-D as steady eighth notes. Every note should be exactly the same length.

## Pattern 2: Quarter + Eighth Pairs

Alternating quarter and eighth-note pairs:

**1 — 2 & 3 — 4 &**

This is: quarter, eighth-eighth, quarter, eighth-eighth.

## Pattern 3: Pickup Eighths

Eighth notes leading into a strong beat:

**— — — & | 1 — 2 — 3 — 4 —**

The "& " before beat 1 is called an **anacrusis** or **pickup**. It creates a sense of forward momentum.

## Counting Tips

- **Never rush eighth notes** — they should be exactly half a beat, not faster
- **Tap your foot on the beat** (1, 2, 3, 4) and say "and" between taps
- The "and" should fall exactly halfway between foot taps
- If you cannot count it, you cannot play it — always count first, play second

## Common Mistake: The "Gallop"

Beginners often play eighth notes unevenly — the first eighth is long and the second is short, like a horse galloping. They should be **perfectly equal**. Record yourself and listen back to check.` },
      { type: 'quiz', question: 'How should two consecutive eighth notes sound?', options: ['First long, second short', 'First short, second long', 'Perfectly equal in length', 'Random lengths'], correctIndex: 2, explanation: 'Eighth notes should be perfectly equal — each one exactly half a beat. Uneven eighths (the "gallop") is a common beginner mistake.' },
    ],
  },
  {
    id: 'p3-l7', moduleId: 'piano-3', title: 'New Time Signature: 6/8', order: 6, completed: false,
    content: [
      { type: 'text', content: `## 6/8 Time

- **6** eighth notes per measure
- An **eighth note** gets one beat

But here is the key: 6/8 does **not** feel like 6 equal beats. It feels like **2 groups of 3**:

**ONE** two three **FOUR** five six

This creates a lilting, swaying feel — think of a jig, a lullaby, or a gentle waltz.

## 6/8 vs 3/4

Both have 6 eighth notes per measure, but they feel completely different:
- **3/4**: THREE groups of TWO — **ONE** two **THREE** four **FIVE** six
- **6/8**: TWO groups of THREE — **ONE** two three **FOUR** five six

The grouping changes which beats are strong, creating a different rhythmic feel.

## Counting 6/8

Count: **1** 2 3 **4** 5 6

Beats 1 and 4 are the strong beats. Conduct it like a slow 2 — two big beats with three subdivisions each.

## Common Note Values in 6/8

| Note | Duration in 6/8 |
| ---- | --------------- |
| Dotted half note | Entire measure (6 eighth notes) |
| Dotted quarter note | Half a measure (3 eighth notes) |
| Quarter note | 2 eighth notes |
| Eighth note | 1 beat |

Notice: the **dotted quarter note** becomes very important in 6/8 — it fills exactly one "big beat" (one group of 3).` },
      { type: 'quiz', question: 'How does 6/8 time feel?', options: ['6 equal beats', '3 groups of 2', '2 groups of 3', '1 group of 6'], correctIndex: 2, explanation: '6/8 time feels like 2 big beats, each divided into 3 — giving it that characteristic lilting, swaying quality.' },
    ],
  },
  {
    id: 'p3-l8', moduleId: 'piano-3', title: 'Review: C Position vs G Position', order: 7, completed: false,
    content: [
      { type: 'text', content: `Let us consolidate everything by comparing your two hand positions and practicing switching between them.

## C Position vs G Position

| | C Position | G Position |
| ---- | ---------- | ---------- |
| **RH notes** | C-D-E-F-G | G-A-B-C-D |
| **RH fingers** | 1-2-3-4-5 | 1-2-3-4-5 |
| **LH notes** | C-D-E-F-G | G-A-B-C-D |
| **LH fingers** | 5-4-3-2-1 | 5-4-3-2-1 |
| **New notes** | — | A, B |
| **Shared notes** | C, D, E, F, G | G, C, D |

## Position Shifting Exercise

Play this sequence without stopping:

1. **C Position RH**: C-D-E-F-G (quarter notes)
2. **Shift** to G Position (lift, move, place)
3. **G Position RH**: G-A-B-C-D (quarter notes)
4. **Shift** back to C Position
5. **C Position RH**: G-F-E-D-C (descending)

The shift should take **no extra time** — the music does not pause while you move. Practice the physical motion of shifting until it is automatic.

## What You Have Learned So Far

By completing Modules 0-3, you can now:
- Read treble and bass clef
- Play in two positions (C and G)
- Play hands together (parallel and contrary motion)
- Read quarter, half, whole, dotted half, and eighth notes
- Understand time signatures (4/4, 3/4, 6/8)
- Play basic chords (C, G7)
- Use dynamics (p, mf, f)
- Use the damper pedal
- Understand sharps, flats, and half/whole steps

**You are no longer a complete beginner.** Module 4 will introduce scales, key signatures, and the circle of fifths — the gateway to playing in any key.` },
      { type: 'quiz', question: 'What notes overlap between C Position and G Position?', options: ['Only C', 'C, D, and G', 'G, C, and D', 'All seven notes'], correctIndex: 2, explanation: 'G appears in both positions, and C and D appear in G Position as fingers 4-5. The shared notes are G, C, and D.' },
    ],
  },
]

const MODULE_3_EXERCISES: Exercise[] = [
  { id: 'p3-e1', moduleId: 'piano-3', title: 'G Position RH Scale', description: 'Play G-A-B-C-D-C-B-A-G with correct right hand fingers.', order: 0, exerciseType: 'scale', difficulty: 2, handsRequired: 'right', keySignature: 'G', targetBpm: 66 },
  { id: 'p3-e2', moduleId: 'piano-3', title: 'G Position LH Scale', description: 'Play G-A-B-C-D-C-B-A-G with correct left hand fingers.', order: 1, exerciseType: 'scale', difficulty: 2, handsRequired: 'left', keySignature: 'G', targetBpm: 66 },
  { id: 'p3-e3', moduleId: 'piano-3', title: 'Position Shift: C to G', description: 'Play C Position scale, shift smoothly to G Position scale, no pause.', order: 2, exerciseType: 'technique', difficulty: 3, handsRequired: 'right', targetBpm: 60 },
  { id: 'p3-e4', moduleId: 'piano-3', title: 'Accidentals Practice', description: 'Play C-C#-D-Eb-E-F-F#-G on the keyboard, naming each note aloud.', order: 3, exerciseType: 'technique', difficulty: 2, handsRequired: 'right' },
  { id: 'p3-e5', moduleId: 'piano-3', title: 'Damper Pedal Exercise', description: 'Play C chord, pedal, play G7, legato pedal change. Repeat 5 times.', order: 4, exerciseType: 'technique', difficulty: 3, handsRequired: 'both' },
  { id: 'p3-e6', moduleId: 'piano-3', title: '6/8 Rhythm Clapping', description: 'Clap the pattern: dotted-quarter, dotted-quarter in 6/8. Feel the two big beats.', order: 5, exerciseType: 'technique', difficulty: 2, handsRequired: 'right' },
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
  {
    id: 'piano-2',
    name: 'Hands Together & Rhythm',
    description: 'Parallel and contrary motion, dotted notes, ties, dynamics, eighth notes, first chords, and the key of C major.',
    order: 2,
    lessons: MODULE_2_LESSONS,
    exercises: MODULE_2_EXERCISES,
    unlockRequirements: { requiredModuleComplete: 'piano-1' },
  },
  {
    id: 'piano-3',
    name: 'Expanding Range & Technique',
    description: 'G Position, sharps, flats, half/whole steps, the damper pedal, eighth note patterns, and 6/8 time.',
    order: 3,
    lessons: MODULE_3_LESSONS,
    exercises: MODULE_3_EXERCISES,
    unlockRequirements: { requiredModuleComplete: 'piano-2' },
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
