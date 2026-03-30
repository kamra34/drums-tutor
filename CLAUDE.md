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
│   │   ├── services/           # apiClient, audioService, globalMetronome, storageService, tutorPersonas
│   │   ├── stores/             # useAuthStore, useAiStore, useUserStore (drums), storeUtils
│   │   ├── styles/             # themes.ts (per-instrument CSS variables)
│   │   └── types/              # ai.ts, instrument.ts
│   ├── drums/                  # Drum tutor (complete)
│   │   ├── components/         # curriculum/, metronome/, practice/, studio/, visuals/ (14 visual components)
│   │   ├── data/               # curriculum.ts (~2500 lines), drumMaps, patterns, practiceLibrary, lessonVisuals
│   │   ├── pages/              # DashboardPage, CurriculumPage, LessonPage, ExercisePage, ChatPage, PracticeHubPage, studio/
│   │   ├── services/           # aiService, midiService, scoringEngine, drumSounds, clickSounds
│   │   ├── stores/             # useGlobalMetronomeStore, useMetronomeStore, useMidiStore, usePracticeStore
│   │   └── types/              # curriculum.ts, midi.ts
│   └── piano/                  # Piano tutor (complete)
│       ├── components/
│       │   ├── curriculum/     # LessonBlockRenderer, QuizBlock
│       │   ├── visuals/        # 12 interactive visual components (see below)
│       │   └── PracticePlayer.tsx  # Shared playback component (notation+grid+keyboard+controls)
│       ├── data/               # curriculum.ts (Modules 0-3), curriculum-modules-4-7.ts, lessonVisuals.ts, repertoire.ts
│       ├── pages/              # DashboardPage, CurriculumPage, LessonPage, ExercisePage, PracticeHubPage, PlaceholderPage
│       │   └── practice/       # ScalePracticePage, ChordPracticePage, ExerciseBrowserPage, RepertoireBrowserPage, RepertoirePlayerPage, SightReadingPage, EarTrainingPage, SelfAssessment
│       ├── services/           # pianoSounds.ts (real sample playback + caching)
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
/piano/practice/songs           → RepertoireBrowserPage (15 classic pieces)
/piano/practice/songs/:pieceId  → RepertoirePlayerPage (song player)
/piano/practice/scales          → ScalePracticePage (15 scales + PracticePlayer)
/piano/practice/chords          → ChordPracticePage (11 progressions + PracticePlayer)
/piano/practice/sight-reading   → SightReadingPage (random passage generator + PracticePlayer)
/piano/practice/ear-training    → EarTrainingPage (interval + chord identification)
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
- **Two-color keyboard**: RH = purple (#a78bfa), LH = teal (#2dd4bf), both = deeper purple; separate finger bubbles per hand
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
- 15 classic pieces in `src/piano/data/repertoire.ts` with full note data (2 both-hands)
- 3 difficulty levels: Beginner (5), Easy (5), Intermediate (5)
- Both-hands pieces: Amazing Grace (RH melody + LH chords), Prelude in C (RH arpeggios + LH bass)
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
- Studio: Create/edit/save patterns, AI pattern generation (Anthropic), scan notation from photos
- AI Tutor "Max" with drum-specific persona and context
- Global metronome with BPM control and visual indicator

### Key Drum Files
- `src/drums/data/curriculum.ts` — All lesson content (~2500 lines)
- `src/drums/data/lessonVisuals.ts` — Visual component mapping for lessons
- `src/drums/services/aiService.ts` — Anthropic API calls (chat, feedback, title gen, suggestions)
- `src/drums/services/midiService.ts` — Web MIDI API connection + note parsing
- `src/drums/services/scoringEngine.ts` — Real-time hit detection + accuracy scoring
- `src/drums/services/drumSounds.ts` — Drum sample playback
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
13. **Exercise both-hands**: `notes`/`chords` = RH, `notesLeft`/`chordsLeft` = LH. PracticePlayer handles dual scheduling automatically. ExercisePage delegates ALL playback to PracticePlayer (~150 lines, no embedded engine). When adding both-hands data, ensure RH and LH total durations match (or the longer one determines total playback time).
14. **ExercisePage is thin**: ExercisePage only handles header, breadcrumbs, instructions, and self-assessment. All playback (notation, keyboard, controls, fullscreen) is in the shared PracticePlayer component. Do NOT re-add playback logic to ExercisePage.
