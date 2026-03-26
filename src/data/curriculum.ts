import { DrumPad } from '../types/midi';
import {
  Module,
  Lesson,
  Exercise,
  LessonBlock,
} from '../types/curriculum';
import {
  PATTERN_FREE_HIT,
  PATTERN_KNOW_YOUR_KIT,
  PATTERN_QUARTER_SNARE,
  PATTERN_EIGHTH_SNARE,
  PATTERN_QUARTER_KICK,
  PATTERN_KICK_SNARE_ALT,
  PATTERN_HIHAT_EIGHTHS,
  PATTERN_KICK_HIHAT,
  PATTERN_SINGLE_STROKE_ROLL,
  PATTERN_BASIC_ROCK_BEAT,
  PATTERN_WHOLE_SNARE,
  PATTERN_HALF_SNARE,
  PATTERN_QUARTER_REST,
  PATTERN_EIGHTH_REST,
  PATTERN_ACCENT_SNARE,
  PATTERN_GHOST_SNARE,
  PATTERN_FULL_KIT_INTRO,
  PATTERN_TOM_FILL,
  PATTERN_SIXTEENTH_SNARE,
} from './patterns';

// ═══════════════════════════════════════════════════════════════════════════
//  MODULE 0 — GETTING STARTED
// ═══════════════════════════════════════════════════════════════════════════

// ── Lesson 0-1 ──────────────────────────────────────────────────────────────

const lesson_0_1_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# What Is a Drum Kit?

Welcome to your very first drum lesson! Before we start playing, let's take a tour of the instrument you'll be learning.

A standard drum kit is made up of **drums** and **cymbals**, each with a unique sound and purpose. Together they form the rhythmic backbone of nearly every genre of music — rock, pop, jazz, funk, hip-hop, and more.

---

## The Drums

### Kick Drum (Bass Drum)
The kick drum sits on the floor and is played with a **foot pedal**. It produces the deepest, most powerful sound on the kit. Think of it as the heartbeat of the music — it drives the groove and you'll feel it as much as hear it.

*Sound:* A deep, punchy **"boom"** or **"thud"**.

### Snare Drum
The snare sits right in front of you on a stand, between your knees. It has **snare wires** stretched across the bottom head that give it a distinctive bright, crackling sound. The snare is one of the most important drums — it's typically played on beats 2 and 4 and provides the **backbeat** that makes you want to clap along.

*Sound:* A sharp, crisp **"crack"** or **"pop"**.

### Toms
Most kits have two or three toms of different sizes:
- **High Tom** — the smallest, mounted on top of the kick drum. Bright and punchy.
- **Mid Tom** — slightly larger, also mounted above the kick. A bit deeper in pitch.
- **Floor Tom** — the largest tom, sitting on legs to your right. Deep and resonant.

Toms are used for **fills** — those exciting transitional phrases between sections of a song.

*Sound:* A warm, resonant **"bom"** that varies in pitch depending on size.

---

## The Cymbals

### Hi-Hat
The hi-hat is a pair of cymbals on a stand with a foot pedal. You can play it **closed** (crisp, tight "tss"), **open** (washy, sustained "tsshh"), or anywhere in between. The hi-hat is often the timekeeper, playing a steady pattern of eighth notes.

### Crash Cymbal
A larger, thinner cymbal that produces a loud, explosive sound. Crashes accent important moments — the start of a chorus, the end of a fill.

*Sound:* A loud, bright **"TSSHH"** that sustains and decays.

### Ride Cymbal
The ride is the largest cymbal and sits to your right. It has a clear, defined **"ping"** when struck on the bow and a bell sound on the raised centre. Like the hi-hat, the ride is often used to keep time — especially in jazz and quieter sections.

---

## Putting It All Together

When you sit behind a drum kit, everything is arranged so you can reach it comfortably:
- Kick pedal under your right foot
- Snare between your knees
- Hi-hat to your left (with pedal under your left foot)
- Toms above the kick
- Floor tom to your right
- Crash and ride cymbals up high

Don't worry about memorising all of this right now. As we work through the lessons and exercises, each piece of the kit will become second nature!`,
  },
  {
    type: 'quiz',
    question: 'Which drum is played with a foot pedal and produces the deepest sound?',
    options: ['Snare Drum', 'Floor Tom', 'Kick Drum', 'Hi-Hat'],
    correctIndex: 2,
    explanation:
      'The kick drum (also called the bass drum) sits on the floor and is played with a foot pedal. It produces the deepest, most powerful sound on the kit.',
  },
  {
    type: 'quiz',
    question: 'What gives the snare drum its distinctive crackling sound?',
    options: [
      'A microphone inside the drum',
      'Snare wires stretched across the bottom head',
      'A special type of drumstick',
      'Holes drilled in the drum shell',
    ],
    correctIndex: 1,
    explanation:
      'The snare drum has thin metal wires (called snare wires) stretched across its bottom head. When you strike the top head, the vibration causes the wires to rattle against the bottom head, creating that signature crisp, cracking sound.',
  },
];

// ── Lesson 0-2 ──────────────────────────────────────────────────────────────

const lesson_0_2_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# How to Sit and Hold Sticks

Good technique starts with good posture. Let's set you up for comfort and control.

---

## Sitting Position

1. **Adjust the throne (drum stool) height** so that your thighs slope slightly downward from your hips to your knees. Your feet should rest flat on the pedals without stretching.
2. **Sit up straight** but stay relaxed — no slumping, but no rigid military posture either. Think "tall and loose."
3. **Keep your elbows at roughly a 90-degree angle** when your sticks hover over the snare. If your arms are reaching too far, the kit needs adjusting, not your body.
4. **Both feet should rest comfortably** on their respective pedals — right foot on the kick pedal, left foot on the hi-hat pedal.

> **Tip:** If you feel strain in your back or shoulders after a few minutes, something needs adjusting. Drumming should feel natural!

---

## Holding the Sticks — Matched Grip

The most common grip for beginners is **matched grip**, where both hands hold the stick the same way.

### Finding the Fulcrum Point
1. Hold a stick loosely between your **thumb and index finger**, about one-third of the way from the butt end.
2. This pinch point is called the **fulcrum** — it's the pivot point that lets the stick bounce.
3. Wrap your remaining fingers **gently** around the stick. They guide and control; they don't squeeze.

### The Bounce Test
Hold the stick over the snare and let it drop. A good grip lets the stick bounce freely several times, like a basketball dribble. If it thuds and stops, you're gripping too tightly.

---

## Matched vs Traditional Grip

| | Matched Grip | Traditional Grip |
|---|---|---|
| **Hands** | Both hold the stick the same way | Left hand turns palm-up, stick rests in the web between thumb and index finger |
| **Used by** | Most rock, pop, and metal drummers | Jazz drummers, marching snare players |
| **Pros** | Symmetrical, easy to learn | Offers a different wrist angle, traditional feel |
| **Our recommendation** | **Start here!** | Explore later once you're comfortable |

---

## Key Takeaways

- Sit tall but relaxed. Adjust the throne, not your posture.
- Grip the stick at the fulcrum (about one-third from the butt end) with thumb and index finger.
- Let the other fingers wrap loosely — never squeeze.
- Use matched grip to start. Both hands mirror each other.`,
  },
  {
    type: 'quiz',
    question: 'Where on the drumstick is the fulcrum point?',
    options: [
      'At the very tip',
      'About one-third from the butt end',
      'Exactly in the middle',
      'At the butt end',
    ],
    correctIndex: 1,
    explanation:
      'The fulcrum is the pivot point where you pinch the stick between your thumb and index finger. It sits about one-third of the way from the butt (back) end of the stick, giving you the best balance of control and bounce.',
  },
];

// ── Lesson 0-3 ──────────────────────────────────────────────────────────────

const lesson_0_3_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Reading Drum Notation

Drum notation looks a lot like regular music notation, but instead of representing pitch, each line and space represents a **different drum or cymbal**.

---

## The Staff

Drum music is written on a standard **5-line staff** with a percussion clef (two vertical bars instead of a treble or bass clef).

### Where Each Drum Lives (PAS Standard)

Here's the standard layout from bottom to top:

| Position on Staff | Drum/Cymbal | Note Head |
|---|---|---|
| Below the bottom line | **Hi-Hat Pedal** (foot) | **x** note head |
| Space 1 (between lines 1-2) | **Kick Drum** | Oval note head |
| Space 2 (between lines 2-3) | **Floor Tom** | Oval note head |
| Space 3 (between lines 3-4) | **Snare Drum** | Oval note head |
| Line 4 | **Tom 2** (mid tom) | Oval note head |
| Space 4 (top space) | **Tom 1** (high tom) | Oval note head |
| Top line (line 5) | **Ride Cymbal** | **x** note head |
| Space above top line | **Hi-Hat** (closed/open) | **x** note head |
| 1st ledger line above | **Crash Cymbal** | **x** note head |

This is the standard used by Hal Leonard, Alfred's, and the Percussive Arts Society (PAS). When you see notation in any drum book, it will follow this layout.

> **Key insight:** Cymbals use **x-shaped** note heads, while drums use **regular oval** note heads. This makes it easy to tell them apart at a glance.

---

## Note Values

Each note value tells you how long to wait before the next hit:

### Whole Note (4 beats)
One hit that lasts an entire bar of 4/4 time. You play once, then wait for 4 full beats.

### Half Note (2 beats)
Two of these fill a bar. Play on beat 1, wait, play on beat 3, wait.

### Quarter Note (1 beat)
The "standard" note in 4/4 time. Four per bar — one per beat: **1, 2, 3, 4**.

### Eighth Note (½ beat)
Twice as fast as quarter notes. Eight per bar, counted: **1-and-2-and-3-and-4-and**.

They have a single flag or are connected by a single beam.

### Sixteenth Note (¼ beat)
Twice as fast again. Sixteen per bar, counted: **1-e-and-a-2-e-and-a-3-e-and-a-4-e-and-a**.

They have a double flag or double beam.

---

## Rests

Rests are silences — moments where you **don't** play. Each note value has a corresponding rest:
- Whole rest: silence for 4 beats
- Half rest: silence for 2 beats
- Quarter rest: silence for 1 beat
- Eighth rest: silence for ½ beat
- Sixteenth rest: silence for ¼ beat

---

## Reading a Simple Pattern

Let's look at a basic pattern: hi-hat on every eighth note, snare on beats 2 and 4, kick on beats 1 and 3.

On the staff you'd see:
- A row of **x** note heads on the hi-hat line (eight per bar)
- Regular note heads on the snare space on beats 2 and 4
- Regular note heads on the kick line on beats 1 and 3

Some of these notes happen at the same time — they're stacked vertically. For instance, on beat 1 you'd see the hi-hat **x** and the kick note head lined up.

Don't worry if this feels overwhelming. The app's **scrolling grid view** will show you exactly when to hit each pad, and you'll learn to read notation naturally over time.`,
  },
  {
    type: 'quiz',
    question: 'How are cymbal hits typically shown differently from drum hits in notation?',
    options: [
      'They are shown in a different colour',
      'They use x-shaped note heads instead of oval note heads',
      'They are written below the staff',
      'They are shown as triangles',
    ],
    correctIndex: 1,
    explanation:
      'Cymbals (hi-hat, crash, ride) use x-shaped note heads, while drums (kick, snare, toms) use regular oval note heads. This visual difference makes it easy to distinguish cymbals from drums at a glance.',
  },
  {
    type: 'quiz',
    question: 'How many eighth notes fit in one bar of 4/4 time?',
    options: ['4', '6', '8', '16'],
    correctIndex: 2,
    explanation:
      'In 4/4 time there are 4 beats per bar. Each beat can be divided into 2 eighth notes, so there are 4 x 2 = 8 eighth notes per bar.',
  },
];

// ── Lesson 0-4 ──────────────────────────────────────────────────────────────

const lesson_0_4_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Time Signatures

You've probably seen numbers stacked at the beginning of a piece of music — something like **4/4** or **3/4**. These are **time signatures**, and they're simpler than they look.

---

## What a Time Signature Tells You

A time signature has two numbers:

- **Top number** — How many beats are in each bar (measure).
- **Bottom number** — What type of note gets one beat.

### 4/4 Time (Common Time)

This is by far the most common time signature in popular music:
- **4** beats per bar
- The **quarter note** gets one beat

Count it: **1 — 2 — 3 — 4 | 1 — 2 — 3 — 4 | ...**

Almost every rock, pop, hip-hop, and funk song you know is in 4/4. That's why it's literally called "common time" and sometimes written as a large **C** instead of 4/4.

### 3/4 Time (Waltz Time)

- **3** beats per bar
- The quarter note gets one beat

Count it: **1 — 2 — 3 | 1 — 2 — 3 | ...**

Think of a waltz: **OOM-pah-pah, OOM-pah-pah**. Songs like "Amazing Grace" and many ballads use 3/4.

---

## Bars (Measures)

Music is divided into **bars** (also called **measures**) by vertical lines called bar lines. Each bar contains exactly the number of beats indicated by the time signature.

In 4/4 time, every bar has 4 beats. When you reach beat 4, the next beat is beat 1 of the next bar.

\`\`\`
| 1  2  3  4 | 1  2  3  4 | 1  2  3  4 |
   Bar 1         Bar 2         Bar 3
\`\`\`

---

## Why This Matters for Drumming

As a drummer, you are the band's **timekeeping engine**. Knowing the time signature helps you:

1. **Count correctly** — You always know where you are in the bar.
2. **Land your fills** — Fills often span specific beats and must resolve on beat 1 of the next bar.
3. **Lock in with other musicians** — Everyone shares the same grid.

For now, we'll focus entirely on **4/4 time**. Once you're comfortable, we'll explore other time signatures in later modules.`,
  },
  {
    type: 'quiz',
    question: 'In a 4/4 time signature, what does the top number represent?',
    options: [
      'The tempo in BPM',
      'How many beats in each bar',
      'How many bars in the song',
      'The type of note that gets one beat',
    ],
    correctIndex: 1,
    explanation:
      'The top number of a time signature tells you how many beats there are in each bar. In 4/4, there are 4 beats per bar.',
  },
];

// ── Lesson 0-5 ──────────────────────────────────────────────────────────────

const lesson_0_5_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Tempo and BPM

You know that music can feel fast or slow. The speed of a piece is called its **tempo**, and we measure it in **BPM** — beats per minute.

---

## What BPM Means

**BPM = Beats Per Minute.** It's simply how many beats occur in 60 seconds.

- **60 BPM** — One beat per second. Very slow, like a ticking clock.
- **80 BPM** — A relaxed ballad tempo.
- **100 BPM** — Moderate, comfortable walking speed.
- **120 BPM** — A standard pop/rock tempo. Two beats per second.
- **140 BPM** — Upbeat, energetic.
- **180+ BPM** — Fast punk, thrash, or drum-and-bass territory.

### Feel It in Your Body

Try this: tap your foot at a comfortable pace while counting "1, 2, 3, 4." That's probably somewhere around 100–120 BPM. Now try tapping at half that speed, then double speed. Notice how the music's energy changes dramatically.

---

## The Metronome — Your Best Friend

A **metronome** is a device (or app feature) that plays a steady click at a given BPM. It's the single most important practice tool for any drummer.

### Why Practice with a Metronome?

1. **Develops internal time feel** — Your brain learns to keep a steady pulse.
2. **Reveals timing problems** — If you drift ahead or behind, the click makes it obvious.
3. **Tracks progress** — You can measure improvement by increasing BPM over weeks.

> **Golden rule:** If you can't play a pattern cleanly at a slow tempo, you can't play it at a fast tempo. **Always start slow.**

---

## How We'll Use BPM in This App

Every exercise has a **target BPM**. When you practise:

1. The app plays a metronome click at the target tempo.
2. You play along on your e-drum kit.
3. The app measures how closely your hits line up with the beat.

As you improve, you can gradually increase the BPM. Speed comes naturally from accuracy — never the other way around.

---

## Quick Reference

| Tempo Marking | BPM Range | Feel |
|---|---|---|
| Largo | 40–60 | Very slow |
| Adagio | 60–80 | Slow, relaxed |
| Andante | 80–100 | Walking pace |
| Moderato | 100–120 | Moderate |
| Allegro | 120–160 | Fast, lively |
| Presto | 160–200 | Very fast |`,
  },
  {
    type: 'quiz',
    question: 'What does 120 BPM mean?',
    options: [
      '120 bars per minute',
      '120 beats per measure',
      '120 beats per minute',
      '120 bass-drum hits per minute',
    ],
    correctIndex: 2,
    explanation:
      'BPM stands for Beats Per Minute. 120 BPM means there are 120 evenly spaced beats in one minute, or 2 beats per second.',
  },
];

// ── Lesson 0-6 ──────────────────────────────────────────────────────────────

const lesson_0_6_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Connecting Your E-Drum Kit

Let's get your electronic drum kit talking to the app so we can start making music!

---

## What You Need

1. **An electronic drum kit** (e.g., Alesis Nitro Mesh, Roland TD-1, Yamaha DTX, etc.)
2. **A USB cable** — Most e-drum modules have a **USB-MIDI** port (USB Type-B). Connect this to your computer with a USB-A to USB-B cable (the same kind used for many printers).
3. **A computer** running this app in a modern browser (Chrome or Edge recommended).

> **Note:** Some older kits use a 5-pin DIN MIDI output instead of USB. In that case you'll need a **MIDI-to-USB adapter** (sometimes called a MIDI interface).

---

## Step-by-Step Setup

### 1. Connect the Cable
Plug the USB cable from your drum module into your computer. Turn the drum module on.

### 2. Allow MIDI Access
When you first open the practice screen, the browser will ask for permission to access MIDI devices. **Click "Allow."** The app uses the **Web MIDI API** to communicate with your kit — no extra software needed.

### 3. Select Your Device
If everything is connected, you'll see your drum module listed in the device selector. Choose it from the dropdown.

### 4. Choose Your Drum Map
Different e-drum kits send slightly different MIDI note numbers for the same pad. The app includes maps for:
- **General MIDI (GM)** — the default standard
- **Alesis** — for Alesis Nitro, Surge, and similar kits

Select the one that matches your kit. If hits are showing up on the wrong pads, try a different map.

### 5. Test Your Pads
Hit each pad on your kit and watch the screen. You should see the correct pad light up for each hit. If the kick drum shows as a tom, your drum map might need adjusting.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| No devices shown | Check the USB cable is plugged in, drum module is on, and try refreshing the page. |
| Browser doesn't ask for MIDI | Make sure you're using Chrome or Edge. Firefox has limited MIDI support. Safari does not support Web MIDI. |
| Hits register on the wrong pad | Try a different drum map in the settings. |
| Latency feels high | Close other browser tabs. Use a wired USB connection (not Bluetooth). |
| Some pads don't register | Check your drum module's MIDI settings — some modules let you disable MIDI for individual pads. |

---

## You're Ready!

Once your pads are lighting up correctly on screen, you're all set to start the exercises. Let's hit some drums!`,
  },
  {
    type: 'quiz',
    question: 'Which browser technology does this app use to communicate with your drum kit?',
    options: [
      'WebSocket API',
      'Web MIDI API',
      'Web Audio API',
      'Bluetooth API',
    ],
    correctIndex: 1,
    explanation:
      'The Web MIDI API is a browser standard (supported in Chrome and Edge) that lets web applications send and receive MIDI messages directly, with no plugins or drivers needed.',
  },
];

// ── Lesson 0-7 ──────────────────────────────────────────────────────────────

const lesson_0_7_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Rests: The Silence Between Beats

In music, silence is just as important as sound. A **rest** tells you *when not to play*. Every note value has a matching rest of the same duration — if you can read notes, you can read rests.

---

## Why Rests Matter

Imagine a drummer playing every single beat without stopping — it would sound like a wall of noise. Rests create **space**, give rhythms **shape**, and let other instruments breathe. A well-placed rest is the difference between a boring pattern and a great groove.

> **Key insight:** When you see a rest, you still count the beat — you just don't hit anything. Your internal clock keeps ticking.

---

## The Five Rest Symbols

### Whole Rest (4 beats of silence)
A filled rectangle that **hangs below** the 4th line of the staff (the second line from the top). It looks like a small black brick hanging from a ceiling.

**Memory trick:** "Whole rest hangs like a **hole** in the ground."

In 4/4 time, a whole rest means silence for the entire bar.

### Half Rest (2 beats of silence)
A filled rectangle that **sits on top of** the 3rd line (the middle line). Same shape as the whole rest, but sitting up instead of hanging down.

**Memory trick:** "Half rest sits like a **hat** on the line."

### Quarter Rest (1 beat of silence)
A distinctive zig-zag or lightning-bolt shape. It's the most recognisable rest and the one you'll see most often. One beat of silence.

### Eighth Rest (½ beat of silence)
Looks like a small "7" with a dot, or a flag with a filled circle. It represents half a beat of silence — the "and" between beats.

### Sixteenth Rest (¼ beat of silence)
Similar to the eighth rest but with **two** flags instead of one. A quarter of a beat of silence.

---

## Whole vs Half: The Tricky Pair

These two look almost identical — both are small black rectangles. The ONLY difference:

| Rest | Position | Memory Trick |
|---|---|---|
| **Whole rest** | Hangs **below** a line | Hole — falls down |
| **Half rest** | Sits **on top of** a line | Hat — sits up |

This is one of the most common things beginners confuse. Use the memory tricks!

---

## How to Count Through Rests

When you encounter a rest, you keep counting but **don't play**. For example, in 4/4 time:

- **♩ ♩ 𝄽 ♩** → Play beat 1, play beat 2, silence on beat 3, play beat 4
- Count aloud: "1, 2, (3), 4" — say "3" in your head but don't hit

Practice tip: when learning a new pattern with rests, **count out loud** and say the rest beats quietly or tap your foot but keep your sticks still.`,
  },
  {
    type: 'quiz',
    question: 'A small black rectangle HANGING below a staff line represents which rest?',
    options: ['Half rest', 'Whole rest', 'Quarter rest', 'Eighth rest'],
    correctIndex: 1,
    explanation:
      'The whole rest hangs below the line like a "hole" in the ground. The half rest looks the same but sits ON TOP of the line like a "hat."',
  },
  {
    type: 'quiz',
    question: 'When you see a rest in the music, what should you do?',
    options: [
      'Stop counting until the next note',
      'Keep counting but don\'t play',
      'Play very softly',
      'Skip ahead to the next note',
    ],
    correctIndex: 1,
    explanation:
      'Rests are silences, not pauses in counting. You always keep your internal clock going — you just don\'t hit anything during a rest. This keeps you locked in time.',
  },
];

// ── Lesson 0-8 ──────────────────────────────────────────────────────────────

const lesson_0_8_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Beams and Flags: How Notes Group Together

When you look at printed drum music, you'll notice that eighth notes and sixteenth notes don't always look like they do in textbooks. Their **flags** (the curvy lines on the stems) often get replaced by straight **beams** connecting multiple notes. This lesson explains why and how.

---

## Stems, Flags and Beams

Every note shorter than a quarter note has a **flag** attached to its stem:

- **Eighth note** → 1 flag (or 1 beam)
- **Sixteenth note** → 2 flags (or 2 beams)
- **Thirty-second note** → 3 flags (or 3 beams)

When two or more of these notes appear next to each other, their individual flags are replaced by **horizontal beams** connecting their stems. This makes the rhythm easier to read at a glance.

> **Important:** Flags and beams are purely visual — they mean **exactly the same thing** musically. A beamed eighth note is identical in sound and duration to a flagged eighth note.

---

## Why Beaming Exists

Without beaming, a bar of eighth notes would look like eight separate notes each with its own little flag. It's hard to see where the beats are.

With beaming, notes are grouped so you can instantly see each beat:

### In 4/4 time:
- **Eighth notes** beam in groups of **2** (= one beat per group)
- **Sixteenth notes** beam in groups of **4** (= one beat per group)

This grouping tells your eyes "here's one beat" at a glance — you don't have to count individual notes.

---

## Mixed Beaming

Sometimes you'll see eighth and sixteenth notes beamed together. The rule: the notes share as many beams as the shortest note type in the group.

For example, one eighth note followed by two sixteenths might share one beam across all three, with a second beam only on the two sixteenths.

---

## Beam Direction

- Notes **above the middle line** of the staff → stems go **down**, beams are below
- Notes **below the middle line** → stems go **up**, beams are above
- Notes **on the middle line** → either direction (often down)

In drum notation, hi-hat notes (above the staff) typically have stems going down, while kick notes (below the staff) have stems going up.

---

## Summary

| Element | What it means |
|---|---|
| **1 flag / 1 beam** | Eighth note (½ beat) |
| **2 flags / 2 beams** | Sixteenth note (¼ beat) |
| **3 flags / 3 beams** | Thirty-second note (⅛ beat) |
| **No flag, no beam** | Quarter note or longer |

Beaming = visual grouping. It never changes the sound or duration of a note.`,
  },
  {
    type: 'quiz',
    question: 'What does beaming do to notes?',
    options: [
      'Makes them louder',
      'Changes their duration',
      'Groups them visually — same sound, easier to read',
      'Connects them so they ring into each other',
    ],
    correctIndex: 2,
    explanation:
      'Beaming replaces individual flags with horizontal bars connecting the note stems. It\'s purely visual — beamed notes sound exactly the same as flagged notes. The grouping helps you see where each beat starts.',
  },
  {
    type: 'quiz',
    question: 'In 4/4 time, how are sixteenth notes typically beamed?',
    options: [
      'Groups of 2 (one per half-beat)',
      'Groups of 4 (one group per beat)',
      'Groups of 8 (two beats per group)',
      'All 16 connected across the entire bar',
    ],
    correctIndex: 1,
    explanation:
      'In 4/4 time, sixteenth notes are beamed in groups of 4, with each group representing one beat. This makes it easy to see the four beats in the bar at a glance.',
  },
];

// ── Lesson 0-9 ──────────────────────────────────────────────────────────────

const lesson_0_9_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Drum Notation Symbols Every Drummer Must Know

Beyond basic notes and rests, drum music uses a set of **special symbols** to tell you *how* to play — not just *when*. These symbols control your volume, technique, and expression.

---

## Technique Marks

### Accent  >
A small ">" mark above or below the notehead. It means **hit this note harder** than the notes around it. Accents add emphasis and shape to a groove.

### Ghost Note  ( )
The notehead is wrapped in **parentheses**. It means play **extremely softly** — barely touching the drum head. Ghost notes add subtle texture between louder hits. On the snare, they create the "feel" in funk and R&B grooves.

### Flam
A tiny **grace note** right before the main note. One hand taps lightly just before the other hand plays the full stroke. The result is a fatter, broader sound — like saying "flam" instead of "tam."

### Buzz Roll (Z)
A "Z" symbol on the note's stem, or three diagonal slashes through it. Press the stick into the head and let it **bounce rapidly**, creating a sustained buzzing sound.

---

## Cymbal Marks

### Closed Hi-Hat  +
A **"+"** symbol above an x notehead. Your left foot presses the pedal, clamping the two hi-hat cymbals together. The sound is tight and crisp: "tss."

### Open Hi-Hat  o
A small **circle "o"** above an x notehead. Your left foot lifts OFF the pedal, letting the cymbals ring. The sound is washy and sustains: "tsshh." When you see the next "+" mark, close it again.

### Hi-Hat Foot (Pedal)
An x notehead written **below the staff** (near the kick drum area). This means use your **left foot alone** — close the hi-hat cymbals without striking with a stick. It produces a soft "chick" sound.

### Ride Bell
A **diamond-shaped notehead** (◆) or a circled x on the ride cymbal line. Strike the raised bell in the centre of the ride for a loud, cutting "ping."

---

## Dynamics

Dynamics tell you **how loud or soft** to play. They're written below the staff in italic letters:

| Marking | Name | Meaning |
|---|---|---|
| **pp** | Pianissimo | Very soft |
| **p** | Piano | Soft |
| **mp** | Mezzo-piano | Moderately soft |
| **mf** | Mezzo-forte | Moderately loud (the "default") |
| **f** | Forte | Loud |
| **ff** | Fortissimo | Very loud |

### Crescendo and Decrescendo
- **Crescendo** ( < ) — gradually get louder. Looks like an opening angle stretching under several notes.
- **Decrescendo** ( > ) — gradually get softer. Also called "diminuendo."

---

## Structure and Navigation

### Repeat Signs  ||: :||
Double bar lines with two dots. Play the section between the signs **twice** (or more, if indicated). The dots face inward toward the repeated music.

### 1st and 2nd Endings
Bracketed sections above the staff labeled "1." and "2." First time through, play ending 1. On the repeat, skip to ending 2.

### D.S. / D.C. / Coda
- **D.S.** (Dal Segno) — go back to the 𝄋 sign
- **D.C.** (Da Capo) — go back to the very beginning
- **Coda** (⊕) — jump to the coda (ending section)

### Triplets  ³
A bracket with a **"3"** above a group of three notes. It means play **3 notes in the time of 2**. Eighth-note triplets give a rolling, shuffle feel.

---

## Don't Memorise Everything at Once

Focus on these three first — you'll see them in every drum pattern:
1. **Accents** (>) — they shape the groove
2. **Ghost notes** ( ) — they add the feel
3. **Open/closed hi-hat** (o / +) — they add dynamics to your time-keeping

Everything else will come naturally as you work through the exercises.`,
  },
  {
    type: 'quiz',
    question: 'What does a "+" above a hi-hat note mean?',
    options: [
      'Play the hi-hat louder',
      'Use the hi-hat pedal only (foot)',
      'The hi-hat is closed (foot pressed on pedal)',
      'Strike the edge of the hi-hat',
    ],
    correctIndex: 2,
    explanation:
      'The "+" symbol above an x notehead means the hi-hat is closed — your left foot is pressing the pedal, clamping the cymbals together. This gives a tight, crisp sound.',
  },
  {
    type: 'quiz',
    question: 'What are ghost notes?',
    options: [
      'Notes played so softly they are barely heard',
      'Notes that are completely silent (like rests)',
      'Accented notes played with maximum force',
      'Notes played behind the beat',
    ],
    correctIndex: 0,
    explanation:
      'Ghost notes (shown in parentheses) are played extremely softly — just barely touching the drum head. They add subtle texture and "feel" to a groove, especially on the snare in funk music.',
  },
];

// ── Module 0 Lessons ────────────────────────────────────────────────────────

const module0Lessons: Lesson[] = [
  {
    id: 'm0-l1',
    moduleId: 'module-0',
    title: 'What Is a Drum Kit?',
    order: 1,
    content: lesson_0_1_content,
    completed: false,
  },
  {
    id: 'm0-l2',
    moduleId: 'module-0',
    title: 'How to Sit and Hold Sticks',
    order: 2,
    content: lesson_0_2_content,
    completed: false,
  },
  {
    id: 'm0-l3',
    moduleId: 'module-0',
    title: 'Reading Drum Notation',
    order: 3,
    content: lesson_0_3_content,
    completed: false,
  },
  {
    id: 'm0-l4',
    moduleId: 'module-0',
    title: 'Time Signatures',
    order: 4,
    content: lesson_0_4_content,
    completed: false,
  },
  {
    id: 'm0-l5',
    moduleId: 'module-0',
    title: 'Tempo and BPM',
    order: 5,
    content: lesson_0_5_content,
    completed: false,
  },
  {
    id: 'm0-l6',
    moduleId: 'module-0',
    title: 'Connecting Your E-Drum Kit',
    order: 6,
    content: lesson_0_6_content,
    completed: false,
  },
  {
    id: 'm0-l7',
    moduleId: 'module-0',
    title: 'Rests: The Silence Between Beats',
    order: 7,
    content: lesson_0_7_content,
    completed: false,
  },
  {
    id: 'm0-l8',
    moduleId: 'module-0',
    title: 'Beams and Flags',
    order: 8,
    content: lesson_0_8_content,
    completed: false,
  },
  {
    id: 'm0-l9',
    moduleId: 'module-0',
    title: 'Drum Notation Symbols',
    order: 9,
    content: lesson_0_9_content,
    completed: false,
  },
];

// ── Module 0 Exercises ──────────────────────────────────────────────────────

const module0Exercises: Exercise[] = [
  {
    id: 'm0-e1',
    moduleId: 'module-0',
    title: 'Know Your Kit',
    description:
      'One hit on each instrument: kick, snare, tom, hi-hat. Listen to each sound and match it to the notation.',
    order: 1,
    patternData: PATTERN_KNOW_YOUR_KIT,
    targetBpm: 70,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 1,
  },
  {
    id: 'm0-e2',
    moduleId: 'module-0',
    title: 'Whole Notes on Snare',
    description:
      'Read and play a whole note — one snare hit per bar. Focus on reading the notation and waiting the full 4 beats.',
    order: 2,
    patternData: PATTERN_WHOLE_SNARE,
    targetBpm: 70,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 1,
  },
  {
    id: 'm0-e3',
    moduleId: 'module-0',
    title: 'Half Notes on Snare',
    description:
      'Two hits per bar — on beats 1 and 3. Read the half note symbols on the staff.',
    order: 3,
    patternData: PATTERN_HALF_SNARE,
    targetBpm: 75,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 1,
  },
  {
    id: 'm0-e4',
    moduleId: 'module-0',
    title: 'Quarter Notes with a Rest',
    description:
      'Snare on beats 1, 2, and 4 — beat 3 is a rest. Count through the silence!',
    order: 4,
    patternData: PATTERN_QUARTER_REST,
    targetBpm: 75,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 2,
  },
  {
    id: 'm0-e5',
    moduleId: 'module-0',
    title: 'Mixed Instruments',
    description:
      'Snare on beats and hi-hat on the "ands." Read two different instruments on the staff simultaneously.',
    order: 5,
    patternData: PATTERN_EIGHTH_REST,
    targetBpm: 80,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 2,
  },
  {
    id: 'm0-e6',
    moduleId: 'module-0',
    title: 'Accents: Loud and Soft',
    description:
      'Play accented notes (>) on beats 2 and 4, normal notes on 1 and 3. Read the accent marks on the staff.',
    order: 6,
    patternData: PATTERN_ACCENT_SNARE,
    targetBpm: 80,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 3,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
//  MODULE 1 — FOUNDATIONS
// ═══════════════════════════════════════════════════════════════════════════

// ── Lesson 1-1 ──────────────────────────────────────────────────────────────

const lesson_1_1_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Quarter Notes

Now that you know the parts of the kit, let's play our first rhythm!

---

## What Is a Quarter Note?

In 4/4 time, the **quarter note** gets **one beat**. There are exactly 4 quarter notes in a bar.

When you count **"1 — 2 — 3 — 4"**, each number is a quarter note.

### Counting Quarter Notes

\`\`\`
| 1   2   3   4 | 1   2   3   4 |
  ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓
\`\`\`

Each arrow is a hit. Evenly spaced, steady, like a heartbeat.

---

## Why Start Here?

Quarter notes are the **foundation** of all rhythms. Every pattern you'll ever play is built on the quarter-note grid. By mastering a steady, even quarter note, you're training the most important skill in drumming: **consistent time**.

---

## Practice Tips

1. **Use the metronome.** Line up your hits exactly with the click.
2. **Start slow.** 60–80 BPM is perfect. Speed comes later.
3. **Listen to the space between hits.** The silence should be equal — no speeding up, no slowing down.
4. **Relax.** Tension makes you rush. Breathe and let your sticks bounce.

> Try counting out loud: **"ONE, two, three, four"** — accent beat one to feel where the bar starts.

In the exercises section you'll play quarter notes on the snare, then on the kick. Let's go!`,
  },
  {
    type: 'notation',
    pattern: PATTERN_QUARTER_SNARE,
    description:
      'Four quarter notes on the snare drum — one on each beat: 1, 2, 3, 4.',
  },
  {
    type: 'quiz',
    question: 'How many quarter notes fit in one bar of 4/4 time?',
    options: ['2', '4', '8', '16'],
    correctIndex: 1,
    explanation:
      'In 4/4 time, a quarter note gets one beat and there are 4 beats per bar, so exactly 4 quarter notes fit in one bar.',
  },
];

// ── Lesson 1-2 ──────────────────────────────────────────────────────────────

const lesson_1_2_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Eighth Notes

Ready to double the speed? Eighth notes are **twice as fast** as quarter notes — there are **8** in a bar of 4/4.

---

## Counting Eighth Notes

We count eighth notes by adding **"and"** between each beat:

\`\`\`
| 1 + 2 + 3 + 4 + | 1 + 2 + 3 + 4 + |
  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓   ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓
\`\`\`

Read that as: **"one-and-two-and-three-and-four-and"**.

The numbers (1, 2, 3, 4) are called **downbeats**. The "ands" (+) are called **upbeats** or **offbeats**.

---

## What They Look Like in Notation

Eighth notes look like quarter notes with a **single flag** on the stem (or a **single beam** connecting a group of them).

---

## Why Eighth Notes Matter

Most drum beats are built on an eighth-note grid:
- The hi-hat typically plays **every eighth note** — that's what creates the driving "tss-tss-tss-tss" you hear in rock and pop.
- The snare and kick play on selected beats within that grid.

Mastering eighth notes is the key to unlocking real drum beats.

---

## Practice Tips

1. **Count out loud!** Saying "1-and-2-and-3-and-4-and" keeps your brain locked in.
2. **Keep it even.** The "and" should be exactly halfway between the beats. No swing yet — that comes later!
3. **Start at 60–70 BPM.** Each click of the metronome is one beat, and you play on the click AND halfway between clicks.
4. **Alternate hands.** Right on the beat, left on the "and" (or vice versa). This starts building your hand independence.`,
  },
  {
    type: 'notation',
    pattern: PATTERN_EIGHTH_SNARE,
    description:
      'Eight eighth notes on the snare — one on every beat and every "and".',
  },
  {
    type: 'quiz',
    question: 'How do you count eighth notes in 4/4 time?',
    options: [
      '1, 2, 3, 4, 5, 6, 7, 8',
      '1-and-2-and-3-and-4-and',
      '1-e-and-a-2-e-and-a',
      '1, 2, 3, 4',
    ],
    correctIndex: 1,
    explanation:
      'Eighth notes are counted "1-and-2-and-3-and-4-and" (often written 1+2+3+4+). The numbers are on the beats, and the "ands" fall exactly halfway between.',
  },
];

// ── Lesson 1-3 ──────────────────────────────────────────────────────────────

const lesson_1_3_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Counting Out Loud

This might feel silly at first, but **counting out loud** is one of the most powerful practice techniques for any drummer — beginner or professional.

---

## Why Count Out Loud?

### 1. It Locks Your Brain to the Beat
When you say "1-and-2-and-3-and-4-and" while playing, your brain has to process both the physical motion and the rhythmic structure at the same time. This builds a strong internal clock.

### 2. It Reveals Problems Instantly
If you can't count and play at the same time, it means the pattern isn't fully internalised yet. That's valuable information!

### 3. It Helps You Know Where You Are
Ever gotten lost in a song? Counting keeps you anchored. You always know which beat you're on.

---

## How to Count

### Quarter Notes
Simply say the beat numbers:
> **"ONE — two — three — four — ONE — two — three — four"**

Accent "one" slightly to mark the start of each bar.

### Eighth Notes
Add "and" between beats:
> **"ONE-and-two-and-three-and-four-and"**

### Sixteenth Notes (for later!)
Add "e" and "a":
> **"ONE-e-and-a-two-e-and-a-three-e-and-a-four-e-and-a"**

---

## Tips for Counting While Playing

1. **Start with just counting** — no sticks. Tap your foot on the beats and say the count.
2. **Add one limb at a time.** Count and play snare on beats. Then count and play kick on beats.
3. **Don't whisper — be confident!** The louder and clearer your count, the more it helps.
4. **It gets easier.** After a few weeks of practice, counting becomes automatic. Eventually you'll internalise it and won't need to count out loud — but you'll always be able to.

> **Pro tip:** Professional drummers still count during tricky passages and time-signature changes. There's no shame in counting — it's a sign of good musicianship!`,
  },
  {
    type: 'quiz',
    question: 'Why is counting out loud an important practice technique?',
    options: [
      'It makes the drums sound louder',
      'It impresses other musicians',
      'It locks your brain to the beat and helps you track where you are',
      'It is only useful for beginners and not needed later',
    ],
    correctIndex: 2,
    explanation:
      'Counting out loud forces your brain to process the rhythmic structure while playing, building a strong internal clock. It also reveals timing problems instantly and helps you always know which beat you\'re on. Even professional drummers count during difficult passages.',
  },
];

// ── Lesson 1-4 ──────────────────────────────────────────────────────────────

const lesson_1_4_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Dynamics — How Hard You Hit Matters

Music isn't just about *when* you hit the drum — it's also about **how hard**. The variation in volume (called **dynamics**) is what brings a beat to life and makes it feel human.

---

## Dynamic Levels

Musicians use Italian terms for dynamic levels:

| Symbol | Term | Meaning |
|---|---|---|
| **pp** | pianissimo | Very soft |
| **p** | piano | Soft |
| **mp** | mezzo-piano | Moderately soft |
| **mf** | mezzo-forte | Moderately loud |
| **f** | forte | Loud |
| **ff** | fortissimo | Very loud |

As a drummer, you control dynamics by how hard or soft you strike each pad.

---

## Ghost Notes

A **ghost note** is a very soft hit — so quiet it's almost felt rather than heard. On the snare drum, ghost notes add a subtle texture and groove that makes a beat feel funky and alive.

In notation, ghost notes are shown in **parentheses**: (o)

Ghost notes are typically played at about 20–30% of your normal striking force.

---

## Accents

An **accent** is the opposite — a deliberately louder, stronger hit. Accents create emphasis and drive.

In notation, accents are marked with a **>** symbol above the note.

Accents are typically played at about 150–200% of your normal striking force.

---

## Why Dynamics Matter

Listen to any great drummer — Stewart Copeland, Questlove, Jojo Mayer — and you'll notice that their playing breathes. It's not a flat, robotic stream of identical hits. Some notes leap out, others whisper, and the contrast creates the **groove**.

### The Dynamic Spectrum

Imagine your playing as a spectrum:

\`\`\`
Ghost Notes ←——————————————→ Accents
  (soft)        normal         (loud)
\`\`\`

A beginner plays everything at the same level. An intermediate player uses accents. An advanced player uses the **full spectrum**, mixing ghosts, normal hits, and accents to create musical expression.

---

## Practice Tips

1. **Play a simple quarter-note pattern** on the snare. First play all notes at the same volume.
2. **Now accent beat 1** while keeping 2, 3, 4 at a normal level. Feel the difference.
3. **Try ghost notes on 2 and 4** while accenting 1 and 3. Notice how the pattern feels completely different.
4. **Your e-drum kit measures velocity** (how hard you hit). The app will show you your dynamic range — aim for clear contrast between soft and loud.`,
  },
  {
    type: 'quiz',
    question: 'What is a ghost note?',
    options: [
      'A note that is played very loudly',
      'A note that is played very softly, almost felt rather than heard',
      'A note that is not played at all',
      'A note played on the rim of the snare',
    ],
    correctIndex: 1,
    explanation:
      'A ghost note is a very soft hit — so quiet it\'s almost felt rather than heard. Ghost notes add subtle texture and groove, especially on the snare drum. They\'re typically played at about 20-30% of normal striking force.',
  },
];

// ── Lesson 1-5 ──────────────────────────────────────────────────────────────

const lesson_1_5_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# What Are Rudiments?

If drums had an alphabet, **rudiments** would be the letters. They're the fundamental sticking patterns that form the building blocks of all drumming.

---

## The Concept

A rudiment is a specific pattern of **right (R)** and **left (L)** hand strokes. By combining and varying rudiments, you can create any drum pattern, fill, or solo.

Think of it like learning to type: first you learn individual keystrokes, then words, then sentences. Rudiments are your keystrokes.

---

## The 40 Essential Rudiments

The **Percussive Arts Society (PAS)** has defined 40 essential rudiments. Don't panic — you don't need to learn all 40 right now! We'll start with just two.

The rudiments fall into four categories:

### 1. Roll Rudiments
Sustained patterns of alternating or doubled strokes.
*Examples: Single Stroke Roll, Double Stroke Roll, Buzz Roll*

### 2. Diddle Rudiments
Patterns featuring double strokes (diddles).
*Examples: Paradiddle, Double Paradiddle*

### 3. Flam Rudiments
Patterns that include a grace note just before the main note.
*Examples: Flam, Flam Tap, Flam Accent*

### 4. Drag Rudiments
Patterns with two grace notes before the main note.
*Examples: Drag, Single Drag Tap*

---

## Why Rudiments Matter

1. **They build hand technique.** Each rudiment trains specific motions and muscle memory.
2. **They develop speed and control.** Practising rudiments with a metronome builds both.
3. **They're the vocabulary of fills and solos.** Once you know rudiments, you can apply them creatively across the kit.
4. **They improve independence.** Your hands learn to work independently and in coordination.

---

## Our Approach

We'll learn rudiments gradually, starting with the simplest and most useful:
1. **Single Stroke Roll** (this module)
2. **Double Stroke Roll** (this module)
3. More rudiments will be introduced in later modules

Each rudiment will be practised first on the snare, then applied across different drums to create musical patterns.

> **Remember:** Rudiments aren't just exercises — they're **musical tools**. Every fill and solo you'll ever play is built from rudiments.`,
  },
  {
    type: 'quiz',
    question: 'What are drum rudiments?',
    options: [
      'The different parts of a drum kit',
      'Fundamental sticking patterns that form the building blocks of all drumming',
      'The names of different cymbal techniques',
      'A type of drum notation',
    ],
    correctIndex: 1,
    explanation:
      'Rudiments are fundamental sticking patterns (sequences of right and left hand strokes) that serve as the building blocks of all drumming. The Percussive Arts Society has defined 40 essential rudiments.',
  },
];

// ── Lesson 1-6 ──────────────────────────────────────────────────────────────

const lesson_1_6_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Your First Rudiments

Let's learn the two most fundamental rudiments in drumming. These are the starting point for everything.

---

## 1. Single Stroke Roll

The single stroke roll is simply **alternating hands**: R L R L R L R L...

\`\`\`
R  L  R  L  R  L  R  L
1  +  2  +  3  +  4  +
\`\`\`

### How to Practice

1. Start at **60 BPM** playing eighth notes on the snare.
2. Right hand on the beats (1, 2, 3, 4), left hand on the "ands" (+).
3. Focus on **equal volume** from both hands. Your weaker hand will naturally be softer — that's normal. Work on matching the volume.
4. Focus on **equal spacing**. The gap between R and L should be the same as between L and R.
5. Gradually increase BPM as it becomes comfortable.

> **Common mistake:** Beginners often play louder with their dominant hand. Close your eyes and listen — both hands should sound identical.

---

## 2. Double Stroke Roll

The double stroke roll uses **two hits per hand**: R R L L R R L L...

\`\`\`
R  R  L  L  R  R  L  L
1  +  2  +  3  +  4  +
\`\`\`

### How to Practice

1. Start at **50–60 BPM** playing eighth notes.
2. The first stroke of each pair is controlled; the second is a **bounce**. Let the stick rebound naturally.
3. Think of it as "drop-bounce, drop-bounce" for each hand.
4. Both strokes in the pair should be the **same volume**. If the second hit is much quieter, you're not controlling the bounce well yet.

### The Bounce Technique

The key to the double stroke roll is learning to control the **natural bounce** of the stick:
1. Play a stroke and let the stick bounce freely. Count the bounces.
2. Now control it so the stick bounces exactly **once** — giving you two even hits.
3. This "controlled bounce" is the secret. It's a wrist stroke followed by a finger-controlled rebound.

---

## Comparing the Two

| | Single Stroke Roll | Double Stroke Roll |
|---|---|---|
| **Pattern** | R L R L | R R L L |
| **Each hand plays** | Every other note | Two notes in a row |
| **Speed** | Limited by hand alternation | Can reach higher speeds due to bounces |
| **Sound** | Smooth, even | Slightly different texture |
| **Use** | General-purpose sticking | Rolls, fills, speed patterns |

---

## Practice Plan

1. **Single strokes** — 5 minutes at 60 BPM, then 70, then 80.
2. **Double strokes** — 5 minutes at 50 BPM, then 60.
3. **Alternate between them** — 4 bars of singles, 4 bars of doubles. This trains your brain to switch patterns.

Be patient! These rudiments take weeks to months to truly master. The goal right now is to learn the patterns and start building muscle memory.`,
  },
  {
    type: 'notation',
    pattern: PATTERN_SINGLE_STROKE_ROLL,
    description:
      'Single stroke roll on snare: R L R L R L R L (eighth notes).',
  },
  {
    type: 'quiz',
    question: 'What is the sticking pattern for a double stroke roll?',
    options: [
      'R L R L R L R L',
      'R R L L R R L L',
      'R L L R R L L R',
      'R R R L L L',
    ],
    correctIndex: 1,
    explanation:
      'The double stroke roll alternates two hits per hand: R R L L R R L L. The key is controlling the bounce of the stick so both hits in each pair are even in volume.',
  },
];

// ── Lesson 1-7 ──────────────────────────────────────────────────────────────

const lesson_1_7_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Sixteenth Notes

You've mastered quarter notes (1 beat) and eighth notes (½ beat). Now let's go twice as fast again: **sixteenth notes** take up **¼ of a beat** each, meaning 16 fit inside one bar of 4/4 time.

---

## How to Count Sixteenth Notes

Each beat is divided into four equal parts. We count them using the syllables:

**1 - e - + - a - 2 - e - + - a - 3 - e - + - a - 4 - e - + - a**

- The **numbers** (1, 2, 3, 4) are the main beats
- The **"+"** (called "and") is the halfway point — the same as eighth notes
- The **"e"** and **"a"** are the new subdivisions between

Say it out loud slowly: "one-ee-and-uh, two-ee-and-uh, three-ee-and-uh, four-ee-and-uh."

---

## How Sixteenth Notes Look

### Individual (flagged)
A single sixteenth note has a filled notehead, a stem, and **two flags** on the stem. Compare this to an eighth note which has only one flag.

### Beamed (grouped)
In 4/4 time, sixteenth notes are beamed in groups of **4** — one group per beat. The four notes share **two horizontal beams** connecting their stems.

| Note type | Flags/beams | Per beat | Per bar (4/4) |
|---|---|---|---|
| Quarter | None | 1 | 4 |
| Eighth | 1 flag / 1 beam | 2 | 8 |
| **Sixteenth** | **2 flags / 2 beams** | **4** | **16** |

---

## Common Sixteenth-Note Patterns

Sixteenth notes rarely appear as a solid wall of 16 notes per bar (though they can!). More often you'll see **combinations**:

### The "1 e + a" pattern (all four sixteenths on one beat)
All four subdivisions played. Used in drum fills and snare rolls.

### The "1 + a" pattern (skip the "e")
Three of the four subdivisions. Creates a choppy, syncopated feel.

### The "1 e +" pattern (skip the "a")
Another three-note pattern with a different rhythmic shape.

---

## Speed Warning

Sixteenth notes at 120 BPM means 8 notes per second. That's fast! Always start slow:

1. Start at **60 BPM** — that's 4 notes per second, very manageable
2. Count "1-e-and-uh" with your metronome
3. Once clean and even, increase by 5 BPM
4. Build up gradually — speed comes from accuracy, never the other way

> **Tip:** If your sixteenth notes are uneven, slow down. It's better to play perfectly at 60 BPM than sloppily at 120 BPM.`,
  },
  {
    type: 'quiz',
    question: 'How do you count four sixteenth notes on beat 1?',
    options: [
      '1 and 2 and',
      '1 e + a',
      '1 2 3 4',
      '1 + 2 +',
    ],
    correctIndex: 1,
    explanation:
      'The four sixteenth-note subdivisions of a single beat are counted "1 e + a" (one-ee-and-uh). The number is the downbeat, "e" is the first sixteenth, "+" is the halfway point (like an eighth note), and "a" is the last sixteenth.',
  },
];

// ── Lesson 1-8 ──────────────────────────────────────────────────────────────

const lesson_1_8_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Dotted Notes and Ties

Sometimes a note's duration doesn't fit neatly into whole, half, quarter, eighth, or sixteenth. Music solves this with two tools: **dots** and **ties**.

---

## Dotted Notes

A **dot** placed to the right of a notehead adds **half of the note's original value** to its duration.

| Note | Normal duration | Dotted duration |
|---|---|---|
| **Dotted half note** | 2 beats | 2 + 1 = **3 beats** |
| **Dotted quarter note** | 1 beat | 1 + ½ = **1½ beats** |
| **Dotted eighth note** | ½ beat | ½ + ¼ = **¾ beat** |

### Dotted Half Note (3 beats)
Very common in 3/4 time (waltz) — it fills an entire bar.

### Dotted Quarter Note (1½ beats)
Extremely common in all time signatures. It "eats" the next eighth note, creating a rhythmic push. You'll hear this in countless pop and rock songs.

**How to count it:** A dotted quarter starting on beat 1 lasts through the "+" of beat 1 and all the way to the "+" of beat 2. The next note lands on the "+" of beat 2.

### Dotted Eighth Note (¾ beat)
Often paired with a sixteenth note to create a "long-short" pattern (dotted eighth + sixteenth). This rhythm is everywhere in marches, country music, and swing.

---

## Ties

A **tie** is a curved line connecting two notes **of the same pitch** (same drum). The second note is NOT played again — instead, the first note's duration extends by the second note's value.

### Example:
A quarter note **tied** to an eighth note = 1 + ½ = 1½ beats total (same as a dotted quarter!).

### Why use ties instead of dots?
- When a note's duration **crosses a bar line** (extends into the next bar)
- When a note's duration **crosses a beat boundary** and the composer wants to show the beat structure clearly
- When the duration can't be expressed with a single dot

> **In drumming:** ties are less common than in melodic instruments, but you'll see them — especially in notation for cymbal crashes that ring across bar lines.

---

## Dotted Rests

Dots work on rests too! A dotted quarter rest = 1½ beats of silence. Less common but important to recognise.

---

## Summary

| Symbol | Meaning |
|---|---|
| **Note with dot** | Duration × 1.5 |
| **Tie (curved line)** | Hold the first note for the combined duration — don't re-hit |
| **Dotted quarter** | 1½ beats — the most common dotted note you'll see |`,
  },
  {
    type: 'quiz',
    question: 'A dotted quarter note lasts how many beats?',
    options: ['1 beat', '1¼ beats', '1½ beats', '2 beats'],
    correctIndex: 2,
    explanation:
      'A dot adds half the note\'s value. A quarter note = 1 beat. Half of 1 = ½. So a dotted quarter = 1 + ½ = 1½ beats.',
  },
  {
    type: 'quiz',
    question: 'What does a tie between two notes tell you?',
    options: [
      'Play both notes normally',
      'Play the second note louder',
      'Hold the first note and don\'t re-hit the second',
      'Play both notes as ghost notes',
    ],
    correctIndex: 2,
    explanation:
      'A tie combines the durations of two notes of the same pitch into one long note. You play the first note and hold it (or let it ring) for the combined duration — you do NOT strike again on the second note.',
  },
];

// ── Lesson 1-9 ──────────────────────────────────────────────────────────────

const lesson_1_9_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Dynamics: Playing with Expression

A great drummer doesn't just play the right notes at the right time — they play with **dynamics**: controlled changes in volume that give the music shape and emotion.

---

## The Dynamic Scale

Music uses Italian terms for volume levels, written below the staff:

| Symbol | Name | Volume | Think of it as… |
|---|---|---|---|
| **pp** | Pianissimo | Very soft | Whispering |
| **p** | Piano | Soft | Speaking quietly |
| **mp** | Mezzo-piano | Moderately soft | Normal conversation |
| **mf** | Mezzo-forte | Moderately loud | Speaking up |
| **f** | Forte | Loud | Shouting |
| **ff** | Fortissimo | Very loud | Screaming |

**mf (mezzo-forte)** is considered the "default" — if a piece of music has no dynamic marking, assume mezzo-forte.

---

## Gradual Changes

### Crescendo (<)
Start soft, gradually get louder. Written as an opening angle ( < ) stretched under several notes, or as the word "cresc."

### Decrescendo / Diminuendo (>)
Start loud, gradually get softer. Written as a closing angle ( > ) or the abbreviation "dim."

These are called **hairpins** because they look like hairpin shapes.

---

## Dynamics on the Drum Kit

### How to control volume:
- **Stick height:** Raise sticks higher for louder, lower for softer
- **Grip pressure:** Relax for soft, firm up for loud
- **Stroke type:** Full stroke (loud) vs tap (soft) vs ghost note (barely audible)

### Where dynamics matter most:

**Hi-hat:** Playing the hi-hat at a consistent medium volume while accenting certain beats creates a "breathing" pattern.

**Snare:** The contrast between a loud backbeat (beats 2 and 4) and ghost notes (the quiet filler) is what makes funk and R&B grooves feel good.

**Kick:** Usually played at a consistent volume, but subtle dynamic changes help phrases breathe.

**Crashes:** By nature loud, but you can vary how hard you hit them.

---

## Accents vs Dynamics

- **Dynamics** (pp, p, f, ff) set the **overall volume** for a passage
- **Accents** (>) mark **individual notes** that should be louder than the current dynamic level

So if a passage is marked **p** (soft) and one note has an accent (>), you play that note at roughly **mf** — louder than the soft surroundings, but not at full volume.

---

## Practice Exercise

Try this at your kit:

1. Play a steady rock beat at **mf** for 4 bars
2. Drop to **p** (soft) for 4 bars — same beat, much quieter
3. **Crescendo** over 4 bars back up to **f**
4. Add **accents** on the snare beats 2 and 4 during the forte section

Notice how the *same exact rhythm* feels completely different at different volumes. That's the power of dynamics.

> **Remember:** Dynamics are what separate a drummer who plays notes from a drummer who plays music.`,
  },
  {
    type: 'quiz',
    question: 'What dynamic marking is considered the "default" volume level?',
    options: ['p (piano)', 'mp (mezzo-piano)', 'mf (mezzo-forte)', 'f (forte)'],
    correctIndex: 2,
    explanation:
      'Mezzo-forte (mf) is the standard "default" dynamic level — moderately loud. If a piece has no dynamic marking, mf is generally assumed.',
  },
  {
    type: 'quiz',
    question: 'An opening angle symbol ( < ) under a group of notes means:',
    options: [
      'Decrescendo — get softer',
      'Crescendo — get louder',
      'Play staccato — short and detached',
      'Accent every note in the group',
    ],
    correctIndex: 1,
    explanation:
      'The opening angle ( < ) is a crescendo — gradually increase in volume. It "opens" toward the louder end. The closing angle ( > ) is a decrescendo (get softer).',
  },
];

// ── Module 1 Lessons ────────────────────────────────────────────────────────

const module1Lessons: Lesson[] = [
  {
    id: 'm1-l1',
    moduleId: 'module-1',
    title: 'Quarter Notes',
    order: 1,
    content: lesson_1_1_content,
    completed: false,
  },
  {
    id: 'm1-l2',
    moduleId: 'module-1',
    title: 'Eighth Notes',
    order: 2,
    content: lesson_1_2_content,
    completed: false,
  },
  {
    id: 'm1-l3',
    moduleId: 'module-1',
    title: 'Counting Out Loud',
    order: 3,
    content: lesson_1_3_content,
    completed: false,
  },
  {
    id: 'm1-l4',
    moduleId: 'module-1',
    title: 'Dynamics',
    order: 4,
    content: lesson_1_4_content,
    completed: false,
  },
  {
    id: 'm1-l5',
    moduleId: 'module-1',
    title: 'What Are Rudiments?',
    order: 5,
    content: lesson_1_5_content,
    completed: false,
  },
  {
    id: 'm1-l6',
    moduleId: 'module-1',
    title: 'Your First Rudiments',
    order: 6,
    content: lesson_1_6_content,
    completed: false,
  },
  {
    id: 'm1-l7',
    moduleId: 'module-1',
    title: 'Sixteenth Notes',
    order: 7,
    content: lesson_1_7_content,
    completed: false,
  },
  {
    id: 'm1-l8',
    moduleId: 'module-1',
    title: 'Dotted Notes and Ties',
    order: 8,
    content: lesson_1_8_content,
    completed: false,
  },
  {
    id: 'm1-l9',
    moduleId: 'module-1',
    title: 'Dynamics: Playing with Expression',
    order: 9,
    content: lesson_1_9_content,
    completed: false,
  },
];

// ── Module 1 Exercises ──────────────────────────────────────────────────────

const module1Exercises: Exercise[] = [
  {
    id: 'm1-e1',
    moduleId: 'module-1',
    title: 'Quarter Notes on Snare',
    description:
      'Play the snare drum on every beat — 1, 2, 3, 4. Keep it steady and match the metronome click.',
    order: 1,
    patternData: PATTERN_QUARTER_SNARE,
    targetBpm: 80,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 1,
  },
  {
    id: 'm1-e2',
    moduleId: 'module-1',
    title: 'Eighth Notes on Snare',
    description:
      'Play the snare on every eighth note — 1-and-2-and-3-and-4-and. Twice as fast as quarter notes!',
    order: 2,
    patternData: PATTERN_EIGHTH_SNARE,
    targetBpm: 70,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 2,
  },
  {
    id: 'm1-e3',
    moduleId: 'module-1',
    title: 'Quarter Notes on Kick',
    description:
      'Now try it with your foot! Play the kick drum on every beat. Keep your heel on the pedal and use your ankle.',
    order: 3,
    patternData: PATTERN_QUARTER_KICK,
    targetBpm: 80,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 2,
  },
  {
    id: 'm1-e4',
    moduleId: 'module-1',
    title: 'Alternating Kick and Snare',
    description:
      'Kick on beats 1 and 3, snare on beats 2 and 4. This kick-snare pattern is the backbone of almost every groove.',
    order: 4,
    patternData: PATTERN_KICK_SNARE_ALT,
    targetBpm: 80,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 3,
  },
  {
    id: 'm1-e5',
    moduleId: 'module-1',
    title: 'Hi-Hat Eighths',
    description:
      'Play closed hi-hat on every eighth note. This steady "tss-tss-tss-tss" pattern is the timekeeper in most beats.',
    order: 5,
    patternData: PATTERN_HIHAT_EIGHTHS,
    targetBpm: 80,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 2,
  },
  {
    id: 'm1-e6',
    moduleId: 'module-1',
    title: 'Kick + Hi-Hat Together',
    description:
      'Combine hi-hat eighths with kick on beats 1 and 3. Your hands and feet now work together!',
    order: 6,
    patternData: PATTERN_KICK_HIHAT,
    targetBpm: 75,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 4,
  },
  {
    id: 'm1-e7',
    moduleId: 'module-1',
    title: 'Single Stroke Roll',
    description:
      'Alternate R-L-R-L on the snare at eighth-note speed. Focus on even volume and spacing between hands.',
    order: 7,
    patternData: PATTERN_SINGLE_STROKE_ROLL,
    targetBpm: 70,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 3,
  },
  {
    id: 'm1-e8',
    moduleId: 'module-1',
    title: 'Your First Beat',
    description:
      'The classic rock beat! Hi-hat eighths, snare on 2 and 4, kick on 1 and 3. This is the groove behind thousands of songs.',
    order: 8,
    patternData: PATTERN_BASIC_ROCK_BEAT,
    targetBpm: 75,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 5,
  },
  {
    id: 'm1-e9',
    moduleId: 'module-1',
    title: 'Sixteenth Notes on Snare',
    description:
      'Play all 16 subdivisions on the snare. Start slow! Read the double-beamed sixteenth notes.',
    order: 9,
    patternData: PATTERN_SIXTEENTH_SNARE,
    targetBpm: 60,
    timeSignature: [4, 4],
    bars: 2,
    difficulty: 5,
  },
  {
    id: 'm1-e10',
    moduleId: 'module-1',
    title: 'Ghost Note Groove',
    description:
      'Ghost notes (very soft) between accented backbeats on 2 and 4. Read the parentheses and > marks. Kick on 1 and 3.',
    order: 10,
    patternData: PATTERN_GHOST_SNARE,
    targetBpm: 75,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 6,
  },
  {
    id: 'm1-e11',
    moduleId: 'module-1',
    title: 'Tom Fill',
    description:
      'Descending tom fill: Tom 1 → Tom 2 → Floor Tom. Read the different drum positions on the staff.',
    order: 11,
    patternData: PATTERN_TOM_FILL,
    targetBpm: 80,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 4,
  },
  {
    id: 'm1-e12',
    moduleId: 'module-1',
    title: 'Full Kit with Crash',
    description:
      'Full kit beat: crash on 1, hi-hat eighths, snare backbeat, kick on 1 and 3. Read all voices on the staff.',
    order: 12,
    patternData: PATTERN_FULL_KIT_INTRO,
    targetBpm: 85,
    timeSignature: [4, 4],
    bars: 4,
    difficulty: 5,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
//  MODULE 2 — RHYTHM READING MASTERY
// ═══════════════════════════════════════════════════════════════════════════

const lesson_2_1_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# The Rhythm Cell Method

Here's a secret that professional sight-readers know: **you don't read individual notes — you read patterns.**

Just like you don't read words letter-by-letter (you see "drum" as one shape, not d-r-u-m), experienced musicians see groups of notes as single recognisable shapes. We call these shapes **rhythm cells**.

---

## What Is a Rhythm Cell?

A rhythm cell is **one beat's worth of rhythm** — whatever fills the space between two beat clicks. In 4/4 time, each bar has exactly 4 cells.

### The Building Blocks

There are a limited number of ways to fill one beat:

| Cell | What fills the beat | Number of attacks |
|---|---|---|
| Quarter note | One hit on the beat | 1 |
| Quarter rest | Silence for the whole beat | 0 |
| Two eighths | Hit on the beat AND the "and" | 2 |
| Four sixteenths | Hit on every subdivision | 4 |
| Dotted eighth + sixteenth | Long-short pattern | 2 |
| Eighth-note triplet | Three evenly-spaced hits | 3 |

Plus various combinations of these with rests.

---

## Why This Matters

When you see a bar of music, you're not reading 16 individual sixteenth-note slots. You're reading **4 cells**. Your brain processes 4 things instead of 16.

That Instagram video with 8 bars of increasing difficulty? Each bar is just 4 cells in a row. The difficulty comes from:
1. **More complex cells** (sixteenth patterns instead of quarters)
2. **Mixing different cell types** in one bar
3. **Adding rests** inside cells

---

## Our Approach

In this module, you'll learn to **instantly recognise** every common rhythm cell by:

1. **Seeing** its shape on the staff
2. **Hearing** how it sounds
3. **Counting** it out loud
4. **Playing** it at different tempos

Once you can identify each cell, reading any rhythm is like reading words — fast and automatic.`,
  },
  {
    type: 'quiz',
    question: 'In 4/4 time, how many rhythm cells are in one bar?',
    options: ['2', '4', '8', '16'],
    correctIndex: 1,
    explanation: 'In 4/4 time, there are 4 beats per bar. Each beat is one rhythm cell. A full bar = 4 cells in a row. Learning to read each cell as a single unit is the key to sight-reading.',
  },
];

const lesson_2_2_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Quarter Notes and Rests

The simplest rhythm cells. One sound (or one silence) per beat.

---

## The Quarter Note Cell

**Shape:** A filled oval notehead with a stem. No flags, no beams.

**Sound:** One hit, exactly on the beat.

**Count:** Just the beat number — "1" or "2" or "3" or "4."

This is your home base. Every other rhythm cell is defined in relation to this one.

---

## The Quarter Rest Cell

**Shape:** The distinctive zig-zag / lightning bolt symbol.

**Sound:** Silence. You count the beat in your head but don't play.

**Count:** "(1)" — say the number silently, or mouth it without playing.

### Why Rests Are Hard

Beginners think rests are easy because "you don't have to do anything." But rests are actually one of the hardest things in music! You must:
- Keep your internal clock running
- Resist the urge to fill the silence
- Enter on the exact next beat after the rest

> **Practice tip:** When you see a rest, keep your stick raised and ready. Physically hold still. Then drop it precisely on the next attack.

---

## Combining Them

A bar like: **♩  ♩  𝄽  ♩** (quarter, quarter, rest, quarter)

means: play on 1, play on 2, silence on 3, play on 4.

Count: "1 — 2 — (3) — 4"

The rest on beat 3 creates **tension**. Your ear expects a hit and doesn't get it. When beat 4 arrives, it feels like a resolution. This is how drummers create musical phrasing with silence.`,
  },
  {
    type: 'quiz',
    question: 'Why are rests considered difficult for beginners?',
    options: [
      'The rest symbol is hard to draw',
      'You must keep time internally without playing and re-enter precisely',
      'Rests make the music quieter',
      'You need a special technique to play rests',
    ],
    correctIndex: 1,
    explanation: 'Rests require you to maintain your internal pulse (keep counting) without the physical feedback of hitting the drum. Then you must re-enter exactly on the next note. This internal timekeeping is a core skill.',
  },
];

const lesson_2_3_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Eighth Note Cells

Now we split each beat in half. Two attacks per beat.

---

## Two Eighth Notes (the "1 +" cell)

**Shape:** Two noteheads connected by ONE horizontal beam.

**Sound:** Two evenly-spaced hits — one on the beat, one halfway between beats.

**Count:** "1 +" (one-and). The "+" is exactly halfway between beats.

This is the most common cell in drum music. Hi-hat patterns, ride patterns, and fills are built on eighth notes.

---

## Eighth + Rest (the "1 +" → "1" cell)

**Shape:** An eighth note (one flag or beam to nothing) + an eighth rest (small "7" shape).

**Sound:** Hit on the beat, silence on the "and."

**Count:** "1 (+)" — say "and" silently.

This creates a **short, punchy** feel. Common in funk and reggae.

---

## Rest + Eighth (the upbeat cell)

**Shape:** An eighth rest + an eighth note.

**Sound:** Silence on the beat, hit on the "and."

**Count:** "(1) +" — silence on the downbeat, play on the upbeat.

This is **syncopation** — hitting between beats. It creates forward momentum and is the foundation of groove in funk, hip-hop, and jazz.

> **This is where most beginners get confused.** The note comes AFTER the click, not on it. Practice this slowly with a metronome — the click is the silence, you play between clicks.

---

## Recognition Tips

| Shape | What you see | Count |
|---|---|---|
| ♫ (two beamed) | Two noteheads, one beam | 1 + |
| ♪ 𝄾 (note + rest) | Eighth note then gap | 1 (+) |
| 𝄾 ♪ (rest + note) | Gap then eighth note | (+) + |

Train yourself to see the BEAM as the clue. One beam = eighth notes. Two beams = sixteenths. No beam = quarter or longer.`,
  },
  {
    type: 'quiz',
    question: 'An eighth rest followed by an eighth note on the "and" creates what musical effect?',
    options: ['A strong downbeat', 'Syncopation — hitting between beats', 'A triplet feel', 'A slow tempo'],
    correctIndex: 1,
    explanation: 'Playing on the "and" (upbeat) while resting on the beat (downbeat) is called syncopation. It creates the forward momentum that makes funk, jazz, and hip-hop grooves feel good.',
  },
];

const lesson_2_4_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Sixteenth Note Cells

Four attacks per beat. This is where the vocabulary really expands.

---

## The Full Sixteenth Group: "1 e + a"

**Shape:** Four noteheads connected by TWO horizontal beams.

**Sound:** Four rapid, evenly-spaced hits within one beat.

**Count:** "1-e-and-a" (one-ee-and-uh)

At 100 BPM, that's ~6.7 hits per second. Start slow!

---

## The Key Partial Groups

Here's where it gets interesting. By replacing some sixteenths with rests or combining them with eighths, you get distinctive rhythmic shapes:

### Eighth + Two Sixteenths: "1   + a"
**Shape:** One beam for the first half, two beams for the second half. The first note is held longer (an eighth), then two quick sixteenths.

**Sound:** "DA-da-da" — long-short-short

**Common in:** Rock fills, marching patterns

### Two Sixteenths + Eighth: "1 e +"
**Shape:** Two beams on the first half, one beam on the second half. Two quick sixteenths, then a longer eighth note.

**Sound:** "da-da-DA" — short-short-long

**Common in:** Latin rhythms, lead-ins to a beat

### Sixteenth + Eighth + Sixteenth: "1 e   a"
**Shape:** The middle note is longer than the surrounding ones. Complex beaming.

**Sound:** "da-DA-da" — short-LONG-short. This creates a lopsided feel.

**Common in:** Funk ghost note patterns

---

## How to Practice

1. **Isolate one cell.** Pick "eighth + two sixteenths" and play ONLY that for 2 minutes.
2. **Count out loud.** Say "1...plus-a, 2...plus-a, 3...plus-a, 4...plus-a" while playing.
3. **Slow is smooth, smooth is fast.** 60 BPM feels stupid-slow but it's where you build accuracy.
4. **Mix two cells.** Play "two eighths" on beats 1-2 and "four sixteenths" on beats 3-4. This trains cell transitions.

---

## The Visual Trick

**Count the beams:**
- **0 beams (no beam)** = quarter note (or longer)
- **1 beam** = eighth notes
- **2 beams** = sixteenth notes
- **3 beams** = thirty-second notes (rare, don't worry yet)

Beams tell you SPEED. More beams = faster subdivisions.`,
  },
  {
    type: 'quiz',
    question: 'You see four noteheads connected by two beams. What are they?',
    options: ['Four quarter notes', 'Four eighth notes', 'Four sixteenth notes', 'A triplet'],
    correctIndex: 2,
    explanation: 'Two beams = sixteenth notes. One beam = eighth notes. No beam = quarter notes. The number of beams tells you the speed of the subdivision. Four sixteenths = 4 hits within one beat.',
  },
];

const lesson_2_5_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Dotted Rhythms and Triplets

These cells break the "even division" rule and create swing, shuffle, and groove.

---

## Dotted Eighth + Sixteenth: The "Long-Short"

**Shape:** A note with a dot + a single sixteenth note. The dot makes the eighth note 75% of the beat, leaving 25% for the short sixteenth.

**Sound:** "DAAH-da" — a long note followed by a quick one.

**Count:** "1.....a" — you hit on "1" and the next hit doesn't come until "a" (the last sixteenth).

**Where you hear it:** Marches, country music, swing at slower tempos. Think of the rhythm of the word "HUM-pty" (Humpty Dumpty).

---

## Sixteenth + Dotted Eighth: The "Short-Long"

**Shape:** A sixteenth note + a dotted eighth note. The opposite of above.

**Sound:** "da-DAAH" — a quick pickup into a long note.

**Count:** "1 e......" — hit on "1", quick hit on "e", then hold.

This creates an **anticipation** feel — like leaning forward.

---

## Eighth-Note Triplets: Three in the Time of Two

**Shape:** Three eighth notes under a bracket with a "3" above it.

**Sound:** Three evenly-spaced hits that fill one beat — but NOT aligned to the sixteenth grid. They create their own special grid that divides the beat into thirds.

**Count:** "1-trip-let" or "1-la-lee"

**Where you hear it everywhere:**
- **Blues shuffle** — the swing feel IS triplets
- **Jazz** — swing rhythm is based on triplets
- **Fill endings** — "ba-da-DUM" before a crash
- **12/8 time** — the entire groove is triplet-based

---

## Why Triplets Feel Different

Eighth notes divide the beat into **2 equal parts** (1 +).
Triplets divide it into **3 equal parts** (1 trip let).

Your brain has to shift from a binary (2-based) feel to a ternary (3-based) feel. This is a GEAR SHIFT. It takes practice.

### Practice method:
1. Clap steady quarter notes
2. Now subdivide each beat into 3 equal claps: "1-trip-let, 2-trip-let, 3-trip-let, 4-trip-let"
3. Alternate: 2 bars of eighth notes, then 2 bars of triplets
4. The transition between them is the skill you're building

---

## Putting It All Together

That Instagram image you saw? It mixes all of these cells:
- Bar 1: Eighths and quarters (easy cells)
- Bar 2: All-quarter cells (simple)
- Bar 3: Triplets mixed with eighths
- Bar 4: Sixteenth note groups
- Bar 5-8: Increasingly complex mixtures

The progression is: **learn each cell → combine them → increase speed → read anything.**`,
  },
  {
    type: 'quiz',
    question: 'Eighth-note triplets divide one beat into how many equal parts?',
    options: ['2 parts', '3 parts', '4 parts', '6 parts'],
    correctIndex: 1,
    explanation: 'Triplets divide the beat into 3 equal parts, counted "1-trip-let." This is different from eighth notes (2 parts) and sixteenths (4 parts). The "3" bracket above the notes tells you it\'s a triplet.',
  },
];

const lesson_2_6_content: LessonBlock[] = [
  {
    type: 'text',
    content: `# Reading Multi-Bar Rhythms

Now let's put cells together into bars and read full phrases.

---

## The 4-Cell Bar

Every bar of 4/4 is: **Cell 1 + Cell 2 + Cell 3 + Cell 4**

Example: ♫  ♩  𝅘𝅥𝅯𝅘𝅥𝅯𝅘𝅥𝅯𝅘𝅥𝅯  ♩

That's: two-eighths + quarter + four-sixteenths + quarter

Reading process:
1. **Scan the bar** — identify each cell before you play
2. **Count through** — "1-and, 2, 3-e-and-a, 4"
3. **Play** at slow tempo first

---

## Common Patterns Across Bars

### The "Groove Bar" (most rock/pop)
Cell 1: quarter (kick)
Cell 2: two-eighths (HH)
Cell 3: quarter (kick)
Cell 4: two-eighths (HH)

### The "Fill Bar" (leading to a chorus/section)
Cell 1-2: groove continues
Cell 3-4: sixteenth runs on snare/toms

### The "Syncopated Bar" (funk/R&B)
Cell 1: upbeat-eighth
Cell 2: two-eighths
Cell 3: dotted-eighth + sixteenth
Cell 4: quarter

---

## Multi-Bar Phrases

In real music, rhythms come in **2-bar, 4-bar, and 8-bar phrases**:

- **2-bar phrase:** A pattern that repeats every 2 bars (most grooves)
- **4-bar phrase:** Often 3 bars of groove + 1 bar of fill
- **8-bar phrase:** A full verse or chorus section

### How to practice reading:
1. **Preview the whole line** before playing — scan all bars
2. **Look ahead** while playing — your eyes should be 1-2 beats ahead of your hands
3. **Circle trouble spots** — if one cell is tricky, isolate and drill it
4. **Loop the phrase** — play it 4x in a row until it's automatic

---

## The Speed Ladder

For every new rhythm:
1. Start at **60 BPM** — painfully slow, but you nail every note
2. Increase by **5 BPM** when clean
3. Target: being able to read it at **100+ BPM** fluently

If you make mistakes, you went too fast. Drop back 10 BPM and rebuild.

> **The goal is not to play fast. The goal is to read instantly.** Speed is a byproduct of recognition speed, not hand speed.`,
  },
  {
    type: 'quiz',
    question: 'When reading a new rhythm, your eyes should be:',
    options: [
      'Looking at the note you are currently playing',
      '1-2 beats ahead of what you are currently playing',
      'At the end of the bar',
      'Closed — you should memorise it first',
    ],
    correctIndex: 1,
    explanation: 'Good sight-readers keep their eyes 1-2 beats ahead of their hands. This gives your brain time to process the next cell before you need to play it. Looking at what you\'re currently playing means you\'re always reacting instead of anticipating.',
  },
];

// ── Module 2 Lessons ──────────────────────────────────────────────────────────

const module2Lessons: Lesson[] = [
  { id: 'm2-l1', moduleId: 'module-2', title: 'The Rhythm Cell Method', order: 1, content: lesson_2_1_content, completed: false },
  { id: 'm2-l2', moduleId: 'module-2', title: 'Quarter Notes and Rests', order: 2, content: lesson_2_2_content, completed: false },
  { id: 'm2-l3', moduleId: 'module-2', title: 'Eighth Note Cells', order: 3, content: lesson_2_3_content, completed: false },
  { id: 'm2-l4', moduleId: 'module-2', title: 'Sixteenth Note Cells', order: 4, content: lesson_2_4_content, completed: false },
  { id: 'm2-l5', moduleId: 'module-2', title: 'Dotted Rhythms and Triplets', order: 5, content: lesson_2_5_content, completed: false },
  { id: 'm2-l6', moduleId: 'module-2', title: 'Reading Multi-Bar Rhythms', order: 6, content: lesson_2_6_content, completed: false },
];

// ── Module 2 Exercises ────────────────────────────────────────────────────────

const module2Exercises: Exercise[] = [
  {
    id: 'm2-e1', moduleId: 'module-2', title: 'Quarters and Rests',
    description: 'Simple quarter notes with a rest on beat 3. Read the cells: note-note-rest-note.',
    order: 1, patternData: PATTERN_QUARTER_REST, targetBpm: 80, timeSignature: [4, 4], bars: 4, difficulty: 2,
  },
  {
    id: 'm2-e2', moduleId: 'module-2', title: 'Eighth Note Reading',
    description: 'Read beamed eighth-note pairs on hi-hat with kick on beats.',
    order: 2, patternData: PATTERN_EIGHTH_REST, targetBpm: 85, timeSignature: [4, 4], bars: 4, difficulty: 3,
  },
  {
    id: 'm2-e3', moduleId: 'module-2', title: 'Sixteenth Note Group',
    description: 'All four sixteenths on every beat. Count "1-e-+-a" on each beat.',
    order: 3, patternData: PATTERN_SIXTEENTH_SNARE, targetBpm: 60, timeSignature: [4, 4], bars: 2, difficulty: 4,
  },
  {
    id: 'm2-e4', moduleId: 'module-2', title: 'Mixed Cell Reading',
    description: 'HH eighths + kick/snare quarters. Read three voices: two cell types.',
    order: 4, patternData: PATTERN_BASIC_ROCK_BEAT, targetBpm: 85, timeSignature: [4, 4], bars: 4, difficulty: 4,
  },
  {
    id: 'm2-e5', moduleId: 'module-2', title: 'Accents Within Cells',
    description: 'Same eighth cells but with accent marks. Read > and play louder on marked notes.',
    order: 5, patternData: PATTERN_ACCENT_SNARE, targetBpm: 80, timeSignature: [4, 4], bars: 4, difficulty: 4,
  },
  {
    id: 'm2-e6', moduleId: 'module-2', title: 'Ghost + Accent Cells',
    description: 'Ghost notes (soft) between accented backbeats. Full dynamic reading.',
    order: 6, patternData: PATTERN_GHOST_SNARE, targetBpm: 75, timeSignature: [4, 4], bars: 4, difficulty: 6,
  },
  {
    id: 'm2-e7', moduleId: 'module-2', title: 'Full Kit Multi-Bar',
    description: 'Crash + HH eighths + snare backbeat + kick. Read all voices at once across 4 bars.',
    order: 7, patternData: PATTERN_FULL_KIT_INTRO, targetBpm: 85, timeSignature: [4, 4], bars: 4, difficulty: 5,
  },
  {
    id: 'm2-e8', moduleId: 'module-2', title: 'Tom Fill Reading',
    description: 'Read a descending tom fill across T1, T2, Floor Tom. Three different staff positions.',
    order: 8, patternData: PATTERN_TOM_FILL, targetBpm: 80, timeSignature: [4, 4], bars: 4, difficulty: 4,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
//  EXPORTED MODULES
// ═══════════════════════════════════════════════════════════════════════════

export const MODULE_0: Module = {
  id: 'module-0',
  name: 'Getting Started',
  description:
    'Learn the drum kit, posture, grip, complete music notation (staff, notes, rests, beams, articulations, dynamics), time signatures, tempo, and MIDI setup.',
  order: 0,
  lessons: module0Lessons,
  exercises: module0Exercises,
  unlockRequirements: {},
};

export const MODULE_1: Module = {
  id: 'module-1',
  name: 'Foundations',
  description:
    'Master quarter, eighth, and sixteenth notes, counting, dynamics, ghost notes, accents, dotted notes, ties, rudiments, and play your first real drum beat.',
  order: 1,
  lessons: module1Lessons,
  exercises: module1Exercises,
  unlockRequirements: {
    requiredModuleComplete: 'module-0',
  },
};

export const MODULE_2: Module = {
  id: 'module-2',
  name: 'Rhythm Reading Mastery',
  description:
    'Master every rhythm cell: quarter/eighth/sixteenth combinations, rests, dotted rhythms, triplets. Read any rhythm on sight.',
  order: 2,
  lessons: module2Lessons,
  exercises: module2Exercises,
  unlockRequirements: {
    requiredModuleComplete: 'module-1',
  },
};

/**
 * Complete ordered list of all curriculum modules.
 */
export const CURRICULUM: Module[] = [MODULE_0, MODULE_1, MODULE_2];

/**
 * Look up a module by its ID.
 */
export function getModuleById(moduleId: string): Module | undefined {
  return CURRICULUM.find((m) => m.id === moduleId);
}

/**
 * Look up a lesson by its ID (across all modules).
 */
export function getLessonById(lessonId: string): Lesson | undefined {
  for (const mod of CURRICULUM) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}

/**
 * Look up an exercise by its ID (across all modules).
 */
export function getExerciseById(exerciseId: string): Exercise | undefined {
  for (const mod of CURRICULUM) {
    const ex = mod.exercises.find((e) => e.id === exerciseId);
    if (ex) return ex;
  }
  return undefined;
}
