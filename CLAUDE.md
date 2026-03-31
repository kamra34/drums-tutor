# HarmonyHub — Project Guide for Claude Code

## Overview

HarmonyHub is a multi-instrument AI-powered music learning web app. Supports **Drums** (fully built) and **Piano** (fully built). Users sign up, choose an instrument, and get a structured curriculum with interactive lessons, practice modes, an AI tutor chatbot, and a pattern studio (drums).

**GitHub**: kamra34/harmony_hub
**Live frontend**: Vercel (deploys from `main` branch) — drums-tutor.vercel.app
**Live backend**: Railway (deploys from `main` branch) — drums-tutor-production.up.railway.app
**Database**: PostgreSQL on Railway (shared by local dev and production)

## Architecture

```
harmony_hub/
├── src/                        # Frontend (React + Vite + TypeScript + Tailwind v4)
│   ├── shared/                 # Shared across instruments
│   │   ├── components/layout/  # AppLayout, InstrumentLayout, Sidebar, TopNav
│   │   ├── config/             # instrumentConfig.ts (tutor names, colors, nav items)
│   │   ├── contexts/           # InstrumentContext (React context for current instrument)
│   │   ├── pages/              # AuthPage, LandingPage, SettingsPage, AdminPage
│   │   ├── services/           # apiClient, audioService, audioUnlock, globalMetronome, storageService, tutorPersonas
│   │   ├── stores/             # useAuthStore, useAiStore, useUserStore (drums), storeUtils
│   │   ├── styles/             # themes.ts (per-instrument CSS variables)
│   │   └── types/              # ai.ts, instrument.ts
│   ├── drums/                  # Drum tutor (complete)
│   │   ├── components/         # curriculum/, metronome/, practice/, studio/, visuals/ (14 visual components), OsmdNotation
│   │   ├── data/               # curriculum.ts (~2500 lines), drumMaps, patterns, practiceLibrary, lessonVisuals
│   │   ├── pages/              # DashboardPage, CurriculumPage, LessonPage, ExercisePage, ChatPage, PracticeHubPage, studio/
│   │   │   └── practice/       # ReadingPracticePage, BeatsPracticePage, FillsPracticePage, ExerciseLibraryPage, etc.
│   │   ├── services/           # aiService, midiService, scoringEngine, drumSounds, clickSounds, drumMusicXml
│   │   ├── stores/             # useGlobalMetronomeStore, useMetronomeStore, useMidiStore, usePracticeStore
│   │   ├── types/              # curriculum.ts, midi.ts
│   │   └── utils/              # beatLabels.ts (subdivision-aware counting labels)
│   └── piano/                  # Piano tutor (complete)
│       ├── components/
│       │   ├── curriculum/     # LessonBlockRenderer, QuizBlock
│       │   ├── visuals/        # 12 interactive visual components (see below)
│       │   └── PracticePlayer.tsx  # Shared playback component (notation+grid+keyboard+controls)
│       ├── data/               # curriculum.ts (Modules 0-3), curriculum-modules-4-7.ts, lessonVisuals.ts, repertoire.ts
│       ├── pages/              # DashboardPage, CurriculumPage, LessonPage, ExercisePage, PracticeHubPage, StudioPage, PlaceholderPage
│       │   └── practice/       # ScalePracticePage, ChordPracticePage, ExerciseBrowserPage, RepertoireBrowserPage, RepertoirePlayerPage, SightReadingPage, EarTrainingPage, SelfAssessment
│       ├── services/           # pianoSounds.ts (real sample playback + caching), studioAiService.ts (AI generation)
│       ├── stores/             # usePianoProgressStore (separate from drums)
│       └── types/              # curriculum.ts
├── server/                     # Backend (Express + Prisma + PostgreSQL)
│   ├── src/
│   │   ├── index.ts            # Express app entry point (CORS, routes, health check)
│   │   ├── middleware/         # auth.ts (JWT authentication)
│   │   └── routes/             # auth.ts, exercises.ts, sessions.ts, progress.ts, chats.ts
│   ├── prisma/
│   │   └── schema.prisma       # Database schema — READ THIS before any DB changes
│   ├── Dockerfile              # ⚠️ Railway uses this, NOT package.json scripts
│   └── package.json
├── public/
│   ├── audio/piano/            # 37 MP3 piano samples C3-C6 (Salamander Grand Piano, CC BY 3.0)
│   ├── favicon.svg             # HarmonyHub icon (beamed notes, amber-to-indigo gradient)
│   └── icons.svg
├── CLAUDE.md                   # This file — auto-read by Claude Code
├── package.json                # Frontend dependencies
├── vite.config.ts              # Vite config with path aliases
└── tsconfig.app.json           # TypeScript config with path aliases
```

## Critical Deployment Details

### Frontend (Vercel)
- Deploys from `main` branch automatically
- Free tier: can ONLY deploy from `main` (not `dev`)
- Build command: `npm run build` → `tsc -b && vite build`
- **Vercel uses stricter TypeScript than local** — always test with `npx tsc --noEmit` before pushing
- Common Vercel-only failures: `useRef()` needs explicit `undefined` arg, type casts may need `unknown` intermediate

### Backend (Railway)
- **⚠️ Uses `server/Dockerfile`** — NOT `server/package.json` scripts
- The Dockerfile defines a multi-stage build (builder → runtime) AND the CMD
- Any changes to build/start process MUST be made in `server/Dockerfile`
- Current CMD: `sh -c "npx prisma db push --skip-generate && node dist/index.js"`
- `prisma db push` runs at container start to sync schema with DB automatically
- Environment variables set in Railway dashboard: `DATABASE_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `FRONTEND_URL`, `PORT`

### Database
- PostgreSQL hosted on Railway
- **⚠️ Same database for local dev and production** — be careful with destructive operations
- Schema defined in `server/prisma/schema.prisma`
- After schema changes: Railway auto-applies via `prisma db push` in Dockerfile CMD on next deploy
- For local: run `cd server && npx prisma generate` then `npx prisma db push`

## Frontend Structure

### Path Aliases (configured in tsconfig.app.json + vite.config.ts)
- `@shared/*` → `src/shared/*`
- `@drums/*` → `src/drums/*`
- `@piano/*` → `src/piano/*`

### Routing (src/App.tsx)
All instrument pages are nested under their prefix inside `<InstrumentLayout>`:
- `/` — Landing page (instrument selector, auto-redirects to last used instrument)
- `/drums/*` — All drum tutor pages (wrapped in InstrumentLayout → AppLayout)
- `/piano/*` — All piano tutor pages (wrapped in InstrumentLayout → AppLayout)
- `/settings`, `/admin` — Shared pages (wrapped in AppLayout only)

**⚠️ CRITICAL ROUTING RULE**: All `Link to=` and `navigate()` calls inside drum pages MUST use `/drums/` prefix. Same for piano with `/piano/`. This was a major bug during restructure — ~40 routes broke when drums moved from `/` to `/drums/`.

### Piano Routes
```
/piano                          → PianoDashboard
/piano/curriculum               → PianoCurriculumPage
/piano/lesson/:moduleId/:lessonId → PianoLessonPage
/piano/exercise/:moduleId/:exerciseId → PianoExercisePage (?from=practice for breadcrumb)
/piano/practice                 → PracticeHubPage (6 sections)
/piano/practice/exercises       → ExerciseBrowserPage (all 48 curriculum exercises)
/piano/practice/songs           → RepertoireBrowserPage (18 pieces, 11 both-hands)
/piano/practice/songs/:pieceId  → RepertoirePlayerPage (song player)
/piano/practice/scales          → ScalePracticePage (15 scales + PracticePlayer)
/piano/practice/chords          → ChordPracticePage (11 progressions + PracticePlayer)
/piano/practice/sight-reading   → SightReadingPage (random passage generator + PracticePlayer)
/piano/practice/ear-training    → EarTrainingPage (interval + chord identification)
/piano/studio                   → PianoStudioPage (AI-powered exercise/song generator)
/piano/chat                     → ChatPage (shared, reads instrument from context)
```

### InstrumentLayout (src/shared/components/layout/InstrumentLayout.tsx)
Wraps each instrument's pages. Provides:
- `InstrumentContext` — React context with current instrument ('drums' | 'piano')
- CSS custom properties for theming (--accent, --accent-bg, --accent-glow, etc.)
- Browser tab title and favicon per instrument
- Use `useInstrument()` hook to read current instrument in any child component

### Theming
- Drums: amber/orange (`#f59e0b`, secondary `#ea580c`)
- Piano: soft lavender/violet (`#a78bfa`, secondary `#8b5cf6`)
- Theme CSS vars defined in `src/shared/styles/themes.ts`
- Instrument config (tutor name, colors, nav items) in `src/shared/config/instrumentConfig.ts`

### State Management (Zustand with persist)
- `useAuthStore` — authentication, JWT token (shared)
- `useUserStore` — drum progress, practice time, streak (persist key: `"drum-tutor-user"`)
- `usePianoProgressStore` — piano progress, practice time, streak (persist key: `"piano-tutor-user"`)
- `useAiStore` — AI chat state, conversations, API key (persist key: `"harmony-hub-ai"`)
  - Tracks `currentInstrument` — clears conversations when switching instruments
  - `loadConversations(instrument)` and `newConversation(instrument)` filter by instrument
- `useMidiStore` — MIDI device connection (drums only)
- `useGlobalMetronomeStore` — metronome state (drums only)

## AI Tutor System

### Two Separate Tutors
- **Max** (drums) — world-class drum instructor persona
- **Clara** (piano) — world-class piano instructor persona
- System prompts defined in `src/shared/services/tutorPersonas.ts`
- `getTutorPersona(instrument)` returns the appropriate persona

### How It Works
- ChatPage (`src/drums/pages/ChatPage.tsx`) is shared by both instruments
- Reads instrument from `useInstrument()` context
- Uses `getInstrumentConfig(instrument)` for tutor name, greeting, suggestions, accent color
- Conversations are scoped per-instrument in both frontend store and backend DB
- Backend `GET /api/chats?instrument=drums` filters by instrument
- Backend `POST /api/chats` accepts `instrument` in body

### AI Service (src/drums/services/aiService.ts)
- Uses Anthropic API directly (client-side, API key stored in settings)
- Model: `claude-sonnet-4-6` for chat, generates follow-up suggestions
- `context.instrument` determines which persona (Max/Clara) is used
- Skill profile context is generic — works for both drum and piano skill fields
- Also generates conversation titles and daily suggestions

## Piano Curriculum System

Based on **Alfred's Basic Adult Piano Course** with Faber's Piano Adventures concepts.

### Complete: 8 modules, 68 lessons, 48 interactive exercises (7 both-hands)

| Module | Title | Lessons | Exercises | Both Hands |
|--------|-------|---------|-----------|------------|
| 0 | Introduction to the Piano | 9 | 4 | 1 (Finger Drill) |
| 1 | Playing Your First Notes | 10 | 6 | No |
| 2 | Hands Together & Rhythm | 9 | 6 | 3 (Parallel, Contrary, Chords) |
| 3 | Expanding Range & Technique | 8 | 6 | No |
| 4 | Scales & Key Signatures | 8 | 8 | 1 (C Major HT) |
| 5 | Chords & Harmony | 8 | 7 | 1 (When the Saints) |
| 6 | Expression & Musicality | 8 | 5 | No |
| 7 | Early Intermediate Foundations | 8 | 6 | 1 (Comprehensive Review) |

### Milestone Checkpoints
Rendered between modules in CurriculumPage to guide practice vs. theory:
- After Module 1: "Ready to Play!" — practice exercises
- After Module 3: "Hands-Together Player" — learn real pieces
- After Module 5: "Song Player" — build repertoire

### Curriculum Data
- Modules 0-3: `src/piano/data/curriculum.ts` (~2400 lines)
- Modules 4-7: `src/piano/data/curriculum-modules-4-7.ts` (~800 lines)
- Imported and combined in curriculum.ts via `MODULES_4_7` spread
- Helper functions: `getLessonById()`, `getModuleById()`, `getExerciseById()`

### Exercise Data Model (src/piano/types/curriculum.ts)
All 48 exercises contain real musical content (not just metadata):
- `NoteEvent` — `{ note: string, duration: number, finger?: number }` for scales, melodies, technique
- `ChordEvent` — `{ name: string, notes: string[], duration: number, fingers?: number[] }` for chord progressions
- `Exercise.notes` — RH note sequences with fingering (e.g., Ode to Joy, C major scale)
- `Exercise.chords` — RH chord sequences (used as main events if no notes)
- `Exercise.notesLeft` — LH note sequences for both-hands exercises (parallel to RH)
- `Exercise.chordsLeft` — LH chord accompaniment for both-hands exercises
- `Exercise.instructions` — step-by-step pedagogical guidance (5 steps per exercise)
- Duration is in beats (1 = quarter, 0.5 = eighth, 0.25 = sixteenth, 2 = half, 4 = whole)
- Exercises with only `chords` play as chord events; exercises with `notes` play as note sequences
- Both-hands exercises use `notesLeft`/`chordsLeft` for the LH part, played simultaneously with RH
- Convention: `notes`/`chords` = RH, `notesLeft`/`chordsLeft` = LH

### Visual Components (src/piano/components/visuals/) — 12 total
| Component | Purpose |
|-----------|---------|
| `KeyboardDiagram` | Interactive SVG keyboard, click-to-play real samples, highlight keys, finger numbers |
| `StaffGuide` | Grand staff with treble/bass clef tabs, hover note info, mnemonics |
| `HandPositionGuide` | RH/LH finger numbering, posture tips |
| `NoteValuesChart` | Note durations with animated playback, warm sustained demo tone, beat ruler |
| `MelodyPlayer` | Animated keyboard + note sequence for melody playback (Ode to Joy, Aura Lee) |
| `ChordDiagram` | Interactive chord selector, click to hear, shows notes + fingering on keyboard |
| `DynamicsGuide` | Volume bars (pp→ff), tempo markings, articulation reference (3 tabs) |
| `IntervalChart` | Half-step ruler, play intervals melodically then harmonically |
| `PedalGuide` | Foot position SVG diagram, legato pedaling technique, common mistakes |
| `ScaleVisual` | Scale on keyboard + playback, RH/LH fingering, multiple scale types |
| `CircleOfFifths` | Interactive SVG circle, click key to see signature + relative minor + chords |
| `KeySignatureChart` | Sharp/flat key lists, order mnemonics, quick identification tricks |
| `FingeringGuide` | Scale/chord/technique fingering patterns with tips |

### Lesson Visual Injection System
- `src/piano/data/lessonVisuals.ts` maps lesson IDs to visual component entries
- Each entry: `{ component: string, afterBlock: number, props?: Record<string, unknown> }`
- `LessonBlockRenderer` inserts visuals at specified positions between content blocks
- Props support allows passing data (e.g., melody notes to MelodyPlayer)

### Piano Audio (src/piano/services/pianoSounds.ts)
- 37 real MP3 piano samples in `public/audio/piano/` (C3-C6, ~868KB total)
- Source: Salamander Grand Piano via midi-js-soundfonts (MIT license)
- `playPianoNote(note, velocity?, duration?)` — loads, caches, and plays samples
- `preloadSamples(notes[])` / `preloadOctaves(startOctave, count)` — warm cache on mount
- Falls back to triangle wave synthesis if sample unavailable
- NoteValuesChart uses a separate warm sustained demo tone (not samples) for pedagogical clarity

## Piano Exercise System (src/piano/pages/ExercisePage.tsx)

Interactive exercise player for all 48 curriculum exercises. Accessible from CurriculumPage (exercises are clickable links) and via direct URL `/piano/exercise/:moduleId/:exerciseId`.

### Layout
Everything visible on load — no multi-step wizard. Top-to-bottom:
1. **Hero header** — title, description, difficulty badge (color-coded 1-10), tags (type, hands, key, time sig)
2. **Collapsible instructions** — 5-step pedagogical guidance per exercise
3. **Control bar** — play/pause/stop, BPM, repeat count, metronome toggle + volume, session counter, fullscreen
4. **Notation + Grid panel** — SVG staff notation with aligned clickable grid cells below
5. **Keyboard panel** — interactive SVG piano with active note highlighting
6. **Navigation footer** — previous/next exercise links

### Playback Engine
- **Tick-based** using `requestAnimationFrame` — notes and metronome clicks fire in real-time (not pre-scheduled), enabling true stop/pause at any point
- **Play/Pause/Resume/Stop** — pause stores elapsed time, resume picks up exactly where paused
- **Metronome** — toggle on/off mid-playback (uses refs for live state), volume slider controls metronome-to-notes ratio
- **BPM** — auto-set from `exercise.targetBpm`, adjustable with +/- buttons (disabled during playback)
- **Repeat selector** — 1x/2x/3x/4x, builds extended schedule for N repetitions
- **Click-to-play-from** — click any grid cell to start playback from that note through the end

### Notation Rendering (NotationWithGrid)
- Single SVG containing both staff notation and aligned grid cells
- **Treble/bass clef** auto-selected based on average note octave
- **Chord rendering** — all notes in a chord rendered as stacked noteheads sharing one stem (not just the root)
- **Note shapes** — whole (open, no stem), half (open + stem), quarter (filled + stem), eighth (+ flag), sixteenth (+ double flag)
- **Accidentals** — flat/sharp symbols rendered per-notehead
- **Ledger lines** — computed across all notes in an event
- **Dotted notes** — dot rendered for 1.5 and 3 beat durations
- **Finger numbers** — below the staff
- **Chord names** — above the staff (e.g., "C", "G7", "Dm")
- **Grid cells** — aligned on same X as notation notes, clickable to start playback, active cell glows
- **Alignment connector** — dashed line between active notation note and its grid cell

### Fullscreen Mode
- Fixed overlay (`z-50`) with top control bar + notation/grid + keyboard stacked vertically
- Larger sizing (`large` prop) for all SVG components
- Same controls: play/pause/stop, BPM, repeats, metronome, session counter
- Close button returns to normal view

### Self-Assessment Flow
- After 1+ playback sessions, "Self-Assess" button appears
- Opens `SelfAssessment` component (shared with practice mode)
- Records `ExerciseResult` to `usePianoProgressStore`

## Piano Practice Mode

### Shared PracticePlayer (src/piano/components/PracticePlayer.tsx)
Reusable component providing the unified playback experience across ALL piano pages:
- Accepts `notes?`, `chords?` (RH), `notesLeft?`, `chordsLeft?` (LH), `defaultBpm`, `timeSignature`, `resetKey`
- **Both-hands support**: builds two parallel event schedules (RH + LH), plays simultaneously
- **Grand staff notation**: treble (RH, purple) + bass (LH, teal) when both hands present, single staff otherwise
- **Time-based alignment**: LH notes positioned at the RH column matching their beat time (not array index). A 4-beat LH chord aligns with the RH note at beat 0, not at a separate column.
- **Two-color keyboard**: RH = purple (#a78bfa), LH = teal (#2dd4bf), both = deeper purple; separate finger bubbles per hand
- **Large grid cells**: 58px spacing (68 fullscreen), 48px height (56 fullscreen), 13-14px font, bright lavender text (#c4b5fd), thick borders, rx=8 rounded corners
- **Auto-scroll**: notation+grid container auto-scrolls to keep active note visible during playback. Smooth scroll, positions active note at ~1/3 from left edge.
- Control bar: play/pause/stop, BPM, repeats 1-4x, metronome toggle + volume, fullscreen, "Both Hands" badge
- Click-to-play-from-any-note on grid cells
- Fullscreen mode with larger sizing
- `onSessionComplete` callback for parent to track session counts
- Used by: ExercisePage, ScalePracticePage, ChordPracticePage, RepertoirePlayerPage, SightReadingPage

### Practice Hub (src/piano/pages/PracticeHubPage.tsx)
- 6 practice sections as cards: Curriculum Exercises, Play Songs, Scale Trainer, Chord Lab, Sight Reading, Ear Training
- Stats header: practice time, streak, exercises completed, modules unlocked
- "How it works" guide

### Curriculum Exercises Browser (src/piano/pages/practice/ExerciseBrowserPage.tsx)
- All 48 exercises from modules 0-7 grouped by module (expandable accordion)
- Filter by exercise type (scale, chord-progression, melody, technique, sight-reading)
- Lock/unlock based on curriculum lesson completion (same logic as CurriculumPage)
- Progress bar per module, best score per exercise
- Links to ExercisePage with `?from=practice` for proper breadcrumb navigation back

### Play Songs (src/piano/pages/practice/RepertoireBrowserPage.tsx + RepertoirePlayerPage.tsx)
- 18 pieces in `src/piano/data/repertoire.ts` with full note data (11 both-hands)
- 3 difficulty levels: Beginner (7, 3 both-hands), Easy (5, 3 both-hands), Intermediate (6, 5 both-hands)
- Both-hands pieces include: Twinkle (chords), Jingle Bells (chords), Lavender's Blue (waltz chords), Lightly Row (open 5ths), Canon in D (bass line), Scarborough Fair (minor chords), Amazing Grace (hymn chords), Moonlight Sonata (octave bass), Prelude in C (bass notes), The Entertainer (ragtime stride), Morning Mood (flowing arpeggios)
- Pieces: Twinkle Twinkle, Mary Had a Little Lamb, Happy Birthday, Jingle Bells, London Bridge, Fur Elise, Canon in D, Minuet in G, Scarborough Fair, Amazing Grace, Moonlight Sonata, Prelude in C, River Flows in You, The Entertainer, Clair de Lune
- Browser with difficulty filter → player using PracticePlayer component
- Self-assessment flow after practice sessions

### Scale Trainer (src/piano/pages/practice/ScalePracticePage.tsx)
- 15 scales: 7 major (C,G,D,A,E,F,Bb), 4 natural minor, 3 harmonic minor, 1 chromatic
- Category filter tabs + scale pill selector
- Hand toggle (RH/LH) + direction (Up & Down / Up only)
- Feeds selected scale into PracticePlayer (unified notation + keyboard view)
- Session counter → self-assessment

### Chord Lab (src/piano/pages/practice/ChordPracticePage.tsx)
- 11 progressions across 4 categories: Primary (I-IV-V7 in C/G/F), Pop (I-V-vi-IV, vi-IV-I-V, 50s), Jazz (ii-V-I in C/G/F), Technique (inversions, seventh chords)
- Category filter + progression list with descriptions
- Feeds into PracticePlayer for unified view

### Sight Reading (src/piano/pages/practice/SightReadingPage.tsx)
- Random passage generator with difficulty (Easy/Medium/Hard) and length (8-20 notes)
- Stepwise motion with occasional leaps, mixed durations
- Generated passage feeds into PracticePlayer for full notation + keyboard experience
- "New Passage" button to regenerate

### Ear Training (src/piano/pages/practice/EarTrainingPage.tsx)
- Two modes: Intervals (12 intervals, Minor 2nd to Octave) and Chords (7 types including 7ths)
- Difficulty levels: Easy (up to P5 / 3 chord types), Medium (all intervals / 4 chords), Hard (all 7)
- Listen → select answer → correct/incorrect with song reference examples
- Score tracking + streak counter
- Uses its own listen-and-answer UI (not PracticePlayer)

### Self-Assessment (src/piano/pages/practice/SelfAssessment.tsx)
- 5-star overall rating (Struggled → Excellent) with descriptions
- Per-skill ratings: Note Reading, Rhythm, Technique, Coordination (1-5 each)
- Updates `usePianoProgressStore.skillProfile` based on ratings
- Records `ExerciseResult` for progress tracking
- Encouraging completion screen

## Piano Studio (src/piano/pages/StudioPage.tsx)

Three-mode creative workspace with an immersive landing page.

### Landing Page
- Animated hero with gradient orbs, shimmering title
- Three pathway cards: AI Composer, Note Builder, Templates
- Recent Creations strip showing saved exercises
- Back arrow in each mode returns to landing; "Compose" card always opens fresh empty state

### Three Modes
- **AI Composer** — Generate exercises with type (scale, chord-progression, melody, technique, sight-reading), genre (Classical, Jazz, Blues, Pop, Latin, Film/Cinematic), length (short/medium/long), key, hands, time sig, difficulty
- **Note Builder** — Full-width layout: click notes on a 3-octave keyboard (C3-C6) to build exercises manually. Duration selector, finger numbers, visual note timeline with measure bars, reorder/edit/delete per note.
- **Templates** — 6 curated exercise templates (C Major Scale, Five Finger Pattern, Broken Chords, Morning Theme, Blues Scale, Rhythm Mix) with pre-built note data. Click to load into player, save to customize.

### AI Service (src/piano/services/studioAiService.ts)
- Uses Anthropic API directly (same pattern as drum aiService)
- Model: `claude-sonnet-4-6` with structured JSON system prompt
- Only supports `mode: 'exercise'` — song/free prompt modes removed (LLMs can't reproduce melodies)
- Validates response: checks note format, duration, array structure
- Falls back gracefully on parse errors with user-friendly messages

### Save/Load/Edit/Delete
- Exercises saved to backend via `/api/exercises` with `category: 'piano-studio'`, `instrument: 'piano'`
- **My Patterns sidebar** (xl screens) — lists saved exercises, click to edit (`/piano/studio/:id`), delete on hover
- **Save bar** — appears after generating/previewing with name input + Save/Update button
- Backend `patternData` stores `{ notes, notesLeft, chordsLeft, keySignature, hands }` (relaxed Zod schema — accepts both drum and piano formats)

### Practice Integration
- **My Exercises** section in Practice Hub → `/piano/practice/my-exercises` (MyExercisesPage.tsx)
- Browse saved exercises with edit/delete/practice actions
- Play page: `/piano/practice/my-exercises/:exerciseId` (MyExercisePlayerPage.tsx) loads from API, renders with PracticePlayer
- "Practice this" link appears in Studio after saving

### Routes
- `/piano/studio` — Studio (new exercise)
- `/piano/studio/:id` — Studio (edit existing)
- `/piano/practice/my-exercises` — Browse saved exercises
- `/piano/practice/my-exercises/:exerciseId` — Play saved exercise

## Responsive Design

### Breakpoint Strategy
All pages use progressive responsive classes: `p-2 sm:p-3 md:p-4 lg:p-6` for padding, `text-lg sm:text-xl lg:text-2xl` for text scaling.

### TopNav
- **Mobile (<768px)**: Hamburger menu + slide-out drawer with all nav items, user profile, switch instrument, MIDI/metronome access. Body scroll locked when open.
- **Tablet (768-1024px)**: Icon-only nav pills, compact spacing
- **Desktop (>1024px)**: Full layout with icons + labels
- Drawer auto-closes on route change, animation via CSS `@keyframes slideInLeft`

### Page Max Widths
- Dashboard/Hub/Studio/Exercise pages: `max-w-[1800px]` — fills large monitors
- Curriculum/Admin: `max-w-[1600px]`
- Browsers/Practice sub-pages: `max-w-[1400px]`
- Lessons/Settings: `max-w-5xl` (1024px) — reading-focused, narrower is better
- Auth form: `max-w-[420px]` — intentionally compact

### PracticePlayer Responsive
- Control bar: `flex-wrap` with responsive gaps, separators hidden on mobile, button text hidden on small screens
- Notation: `overflow-x-auto` with `min-w-0` on all parent containers to prevent CSS Grid overflow
- Keyboard: `width="100%"` SVG, `maxHeight: 300px` fullscreen / `180px` inline
- Fullscreen: keyboard anchored to bottom (`items-end`), full width (no max-w constraint)

## Piano Dashboard (src/piano/pages/DashboardPage.tsx)
- Dynamic hero greeting based on progress/streak
- Continue Learning button → next unfinished lesson
- Progress ring (curriculum completion %)
- Stats row: current module, practice time, streak, progress
- Current module card with lesson list + progress bar
- Quick access grid: Curriculum, Practice, Ask Clara, Settings
- Skill profile with 5 piano skills + progress bars
- Learning path overview showing all 8 modules

## Drum Tutor (Complete)

### Features
- Full curriculum (3 modules, 24 lessons, 22 exercises) with 14 visual components
- Real-time MIDI input from electronic drum kits (Web MIDI API)
- Practice modes: Notation Reading, Beats, Rudiments, Fills, Daily, Free Play, Play-along
- Studio: Immersive landing page with 3 pathway cards (Compose, AI Builder, Scan). **Compose mode**: immersive hero header with inline title editing, tempo, time sig, save — all in one bar. Collapsible settings panel for instruments + backing track (collapses to save space). Bar navigator uses wrapping grid tiles (not horizontal scroll) for easy navigation with 100+ bars — color-coded resolution indicators, drag-drop reorder, jump-to-bar input, prev/next arrows. No bar count limit (removed 32 cap). Bar-by-bar editing with per-bar resolution, dual editors (grid + notation staff), full pattern preview with pause/resume/seek playback, backing track upload with tempo sync. **AI Builder**: full-page immersive experience (separate from Studio header/sidebar) with 14 genre cards, per-bar resolution with "AI Decides" mode (allowed resolutions: quarter/eighth/sixteenth enabled, triplet disabled by default), difficulty 1-10, kit builder presets, custom instructions, and groove-focused AI prompt. After generation, auto-switches to Compose mode for bar-by-bar editing.
- AI Tutor "Max" with drum-specific persona and context
- Global metronome with BPM control and visual indicator

### Key Drum Files
- `src/drums/data/curriculum.ts` — All lesson content (~2500 lines)
- `src/drums/data/lessonVisuals.ts` — Visual component mapping for lessons
- `src/drums/services/aiService.ts` — Anthropic API calls (chat, feedback, title gen, suggestions)
- `src/drums/services/midiService.ts` — Web MIDI API connection + note parsing
- `src/drums/services/scoringEngine.ts` — Real-time hit detection + accuracy scoring
- `src/drums/services/drumSounds.ts` — Drum sample playback
- `src/drums/services/drumMusicXml.ts` — PatternData → MusicXML with per-beat adaptive note types
- `src/drums/components/studio/NotationInput.tsx` — Interactive SVG percussion staff editor (click to place notes)
- `src/drums/pages/ChatPage.tsx` — **Shared chat UI** used by both drums and piano

## Backend Structure

### API Routes (all prefixed with /api/)
- `POST /api/auth/register`, `POST /api/auth/login` — JWT authentication
- `GET/POST/PUT/DELETE /api/exercises` — User-created patterns/exercises (filtered by instrument)
- `POST /api/sessions` — Record practice session results
- `GET/POST /api/progress` — Sync lesson completion
- `GET /api/chats?instrument=drums` — List conversations filtered by instrument
- `POST /api/chats` — Create conversation (accepts `instrument` in body)
- `GET /api/chats/:id` — Get conversation with messages
- `POST /api/chats/:id/messages` — Add message to conversation
- `PATCH /api/chats/:id` — Update conversation title
- `DELETE /api/chats/:id` — Delete conversation

### Prisma Models (server/prisma/schema.prisma)
- `User` — email, passwordHash, displayName, role (user/admin)
- `Exercise` — title, category, patternData (JSON), config (JSON), instrument (drums/piano)
- `PracticeSession` — exerciseId, score, accuracy, timingData, instrument
- `ChatConversation` — userId, title, instrument (drums/piano)
- `ChatMessage` — conversationId, role, content, hasImage
- `LessonCompletion` — userId, lessonId, completedAt

### CORS Configuration
- `server/src/index.ts` — allows FRONTEND_URL env var + localhost ports
- Currently allows all origins in dev (`callback(null, true)`)

## Git Workflow
- `dev` branch for development
- `main` branch for production (Vercel + Railway deploy from here)
- Workflow: develop on `dev` → push dev → checkout main → merge dev → push main → checkout dev
- Always return to `dev` after pushing to main

## Common Gotchas
1. **Routes**: Always use `/drums/` or `/piano/` prefix in instrument pages — never bare `/curriculum`, `/practice`, etc.
2. **Dockerfile**: Railway uses `server/Dockerfile`, NOT `server/package.json` scripts. CMD changes go in Dockerfile.
3. **Shared DB**: Local and prod share the same PostgreSQL instance — destructive operations affect production.
4. **Strict TS on Vercel**: `useRef<T>()` needs explicit `undefined` arg on Vercel. Type casts may need `unknown` intermediate.
5. **CRLF warnings**: Windows dev environment. Git handles conversion — warnings are safe to ignore.
6. **Auth page favicon**: Must reset document.title and favicon in AuthPage and LandingPage on mount (otherwise stale instrument icon persists).
7. **AI store instrument scoping**: `useAiStore` tracks `currentInstrument` and clears conversations when switching. Always pass `instrument` to `loadConversations()` and `newConversation()`.
8. **Piano vs Drum progress**: Completely separate Zustand stores with different persist keys. ChatPage reads the correct one based on instrument context.
9. **Prisma client regeneration**: After schema changes locally, run `cd server && npx prisma generate` before `npx tsc`. The Dockerfile handles this automatically for Railway.
10. **Piano samples**: 37 MP3 files in `public/audio/piano/`. Named `C3.mp3`, `Db3.mp3`, etc. Loaded and cached by `pianoSounds.ts`. Falls back to synthesis if missing.
11. **Exercise playback engine**: Uses tick-based `requestAnimationFrame`, NOT pre-scheduled `setTimeout`/Web Audio scheduling. This is critical for stop/pause to work — pre-scheduling can't be cancelled. Notes and metronome clicks are triggered in the tick loop when elapsed time passes their start time, tracked by `playedNotesRef` and `playedClicksRef` Sets.
12. **Exercise notation chords**: When rendering chord events in notation, ALL notes in `ev.notes` must be rendered as stacked noteheads, not just `ev.notes[0]`. A C chord = 3 noteheads (C, E, G), not 1.
13. **Exercise both-hands**: `notes`/`chords` = RH, `notesLeft`/`chordsLeft` = LH. PracticePlayer handles dual scheduling automatically. LH notes are positioned in notation by TIME alignment to RH columns (not array index) — see `lhToRHColumn()` in PracticePlayer. When adding both-hands data, RH and LH total durations should match (the longer determines total playback time).
14. **ExercisePage is thin**: ExercisePage only handles header, breadcrumbs, instructions, and self-assessment. All playback (notation, keyboard, controls, fullscreen) is in the shared PracticePlayer component. Do NOT re-add playback logic to ExercisePage.
15. **Piano Studio save**: Uses `category: 'piano-studio'` + `instrument: 'piano'` to distinguish from drum exercises. The backend `patternData` Zod schema is `z.any()` to accept both drum `{beats,subdivisions,tracks}` and piano `{notes,chordsLeft,...}` formats.
16. **Responsive `min-w-0`**: All CSS Grid `1fr` columns containing scrollable content (PracticePlayer, notation) MUST have `min-w-0` on themselves and parent containers. Without this, the grid column expands to fit the SVG's intrinsic width, pushing content off-screen.
17. **Mobile audio unlock**: Mobile browsers require `AudioContext.resume()` during a user gesture. All AudioContexts must call `registerAudioContext()` from `@shared/services/audioUnlock`. The `main.tsx` global listener handles first-tap unlock (including iOS silent buffer trick). Never create/resume an AudioContext inside `.then()` or `setTimeout` — do it synchronously in the gesture callstack.
18. **Beat labels**: Use `subdivisionLabel(stepIndex, subdivisions)` and `isDownbeat()` from `@drums/utils/beatLabels` for counting labels in grids. Supports quarter (`1 2 3 4`), eighth (`1 + 2 +`), triplet (`1 t t 2 t t`), and sixteenth (`1 e + a 2 e + a`).
19. **Multi-bar pattern display**: When expanding 1-bar `patternData` for multi-bar display, the `tracks` arrays must be **tiled** (repeated N times), not just the `beats` count. Otherwise cells beyond the first bar show as empty rests.
20. **Drum notation uses OSMD** (OpenSheetMusicDisplay), not VexFlow. `drumMusicXml.ts` converts `PatternData` → MusicXML `{ xml, noteSlots }`, `OsmdNotation.tsx` renders via `forwardRef` with cursor control. Key settings: `FlatBeams=true`, `percussionOneLineCutoff=0`, `StretchLastSystemLine=true`, `NewSystemAtXMLNewSystemAttribute=true`. Line breaks every 4 bars via `<print new-system="yes"/>`. **Dual-layer cursor**: bar highlight (wide amber background covering entire measure) + beat cursor (narrow glow at specific note). Cursor sync uses authoritative `noteSlots` array from MusicXML generation — `cursorNext()` only fires on slots in that array. `cursorAtFirstNoteRef` flag prevents off-by-one after `cursorShow()`. **Per-beat adaptive note types**: beats with only downbeat hits → quarter notes, beats with off-beat hits → eighth/16th. Open hi-hat uses `circle-x` notehead. **Empty bars**: use `<direction font-size="0">` to prevent OSMD multi-measure rest consolidation; individual quarter rests per beat for correct cursor stepping.
21. **Drum pattern subdivisions — per-bar resolution**: Studio Compose mode supports different subdivisions per bar via `barSubdivisions: number[]`. Storage always uses `LCM(barSubdivisions)` as the global subdivisions (e.g., LCM(3,2)=6 for triplet+8th). `getBarPattern()` downsamples for editing (taking every Nth slot), `handleBarChange()` upsamples when writing back. `handleBarResolutionChange()` re-maps the entire pattern when the LCM changes. `barSubdivisions` is passed through StaffNotationDisplay → OsmdNotation/GridView → drumMusicXml for authoritative per-bar step size (`step = maxSub / barSub`), avoiding GCD heuristic ambiguity (triplets vs 8th notes in sub=6 grid). **Triplet notation**: MusicXML uses `<time-modification>` + `<tuplet type="start/stop" bracket="yes" show-number="actual"/>` per beat for "3" bracket. Tuplet start/stop applied to first/last SLOT of each beat (including rests). Beaming generated inline per beat using note position tracking.
22. **Drum practice routing**: All exercise/fill/beat pages navigate to `/drums/practice/play/:itemId`. The `PracticePlayerPage` resolves items via `getPracticeItemById()`. Bar count badge derives from `patternData.beats / timeSignature[0]`, not the `bars` field. The `bars` field must match the actual bar count in `patternData` — multi-bar patterns store all bars in `patternData.tracks` directly (no tiling).
23. **Drum Notation Guide**: Interactive cheatsheet popup in TopNav (`DrumNotationGuide.tsx`). Three tabs: Kit & Staff (cross-highlighting kit cards ↔ staff positions), Note Values, Articulations. Drums-only (gated behind `config.showMidi`). Uses `createPortal` to render full-page overlay.
24. **Studio landing page pattern**: Both drum and piano studios use a `mode: null` state for the landing page with animated hero and pathway cards. Clicking a pathway sets the mode. The "Compose" card calls `handleStartNewCompose()` which resets all pattern state before entering — ensures a fresh empty compose every time. Back button navigates to `/drums/studio` (or `/piano/studio`) to clear any `:id` URL param. Clicking "Recent Creations" navigates to `/studio/:id` which triggers the editId useEffect.
25. **Studio NotationInput**: Interactive SVG drum notation editor (`src/drums/components/studio/NotationInput.tsx`). Same Props interface as EditableGrid — fully interchangeable. Uses ResizeObserver to fill container width dynamically. Staff positions match drumMusicXml.ts display positions. Click cycles hit values (0→1→2→3→0), right-click clears. Noteheads: x for cymbals, filled ellipse for drums. Accent = glow, ghost = translucent.
26. **Playback pause/resume/seek**: `drumSounds.ts` supports `pausePatternPlayback()` (saves slot position), `resumePatternPlayback()` (re-schedules from saved slot), `playPatternFromSlot()` (seek to any slot). `schedulePattern` accepts `startFromStep` — only schedules audio from that slot onward. Backing track syncs with offset via `source.start(when, bufferOffset)`. `StaffNotationDisplay` PlayBar has play/pause/stop buttons. Grid cells are clickable for seek — clicking positions OSMD cursor correctly by advancing N times from reset.
27. **Backing track sync**: `drumSounds.ts` manages backing track with `_backingOffset` (seconds) for sync alignment. `startBackingTrack` computes `totalMusicalOffset = _backingOffset + patternOffsetSec` and converts to buffer position via `bufferOffset = totalMusicalOffset * (_backingBpm / bpm)`. Upload defaults Track BPM to pattern tempo. `loadBackingTrack` returns `{ buffer, duration, url }` — URL used for HTML5 `<audio>` preview player. **Tap-to-sync flow**: plays song via `<audio>` element, user taps on drum entry, picks which bar → offset auto-computed as `songTime - barStartInSong`. Mini-player with play/pause + seekable progress bar for scrubbing. Fine-tune nudge: ±50ms, ±10ms, ±1ms. `playBackingPreview()` / `stopBackingPreview()` for Web Audio preview with elapsed tracking.
28. **Audio preloading**: `ensureAudioReady()` creates AudioContext + preloads all drum samples. Called on `StaffNotationDisplay` mount. `playPatternFromSlot` is async — awaits sample loading before scheduling to prevent first-play desync (previously, scheduling used stale `currentTime` from before async load).
29. **Backing track persistence**: Audio stored as `Bytes` in PostgreSQL Exercise model. Upload via base64 JSON (`POST /api/exercises/:id/backing-track`), download as binary blob (`GET`). `backingTrackData` excluded from list/get endpoints — fetched on demand. Frontend: `apiUploadBackingTrack` uses `FileReader.readAsDataURL` → base64 JSON. Express JSON limit set to 15MB. **Lock state**: backing track settings auto-lock after save/load, unlock via Edit button to prevent accidental changes. **Practice mode**: `PracticePlayerPage` fetches backing track for studio patterns, shows On/Off toggle. Buffer cached in ref for instant toggle without re-fetch.
30. **AI Builder architecture**: `AiBuilderTab` renders as a full-page experience (StudioPage does an early return for `mode === 'ai-builder'`, bypassing the Studio header/sidebar/tabs layout). After generation, `onPatternGenerated` loads the pattern into StudioPage state AND auto-switches `mode` to `'create'` (Compose). The AI Builder builds its own prompt via `buildFullPrompt()` (does NOT use `buildAiExercisePrompt` from notationExerciseGenerator). "AI Decides Resolution" mode asks the AI to return a `barResolutions` array which is parsed into `barSubdivisions`. The `aiService.generateExercise` system prompt is a focused studio-drummer persona (not the chatbot TUTOR_PERSONA).
31. **GridView line breaks**: GridView now accepts `barsPerLine` prop (default 4) and breaks the grid into multi-line display matching the notation view. Each line shows bar numbers at the start of each bar, with amber bar boundary lines. Also accepts `focusBar` (highlights a bar), `scale` (enlarges rows/fonts).
32. **Fullscreen practice mode**: Fullscreen shows a split layout — top: full OSMD notation (scrollable, max 40vh), bottom: "Focus Grid" showing only the current bar ± 2 context bars at 1.3x scale. Focus grid auto-follows playback via `activeBar` computed from `activeSlot / slotsPerBar`. Bar position indicator with progress bar in the top control bar. Focus grid's `onSlotClick` offsets slot indices back to absolute positions for correct seek.
