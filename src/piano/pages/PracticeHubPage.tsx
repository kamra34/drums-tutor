import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePianoProgressStore } from '@piano/stores/usePianoProgressStore'
import { CURRICULUM } from '@piano/data/curriculum'
import type { Module } from '@piano/types/curriculum'
import { useAuthStore } from '@shared/stores/useAuthStore'

const accent = '#a78bfa'

// ── Unlock logic (same as CurriculumPage) ───────────────────────────────────

function isModuleUnlocked(module: Module, completedLessons: string[], curriculum: Module[]): boolean {
  const req = module.unlockRequirements
  if (!req.requiredModuleComplete) return true
  const requiredModule = curriculum.find(m => m.id === req.requiredModuleComplete)
  if (!requiredModule) return true
  return requiredModule.lessons.every(l => completedLessons.includes(l.id))
}

// ── Section definitions ─────────────────────────────────────────────────────

interface PracticeSection {
  id: string
  title: string
  description: string
  icon: string
  to: string
  color: string
  badge?: string
}

const SECTIONS: PracticeSection[] = [
  {
    id: 'my-exercises',
    title: 'My Exercises',
    description: 'Custom exercises you built or generated in the Studio. Practice your own creations.',
    icon: '🎨',
    to: '/piano/practice/my-exercises',
    color: '#c084fc',
  },
  {
    id: 'exercises',
    title: 'Curriculum Exercises',
    description: 'All 48 exercises from your course — scales, chords, melodies, technique, and sight-reading. Locked exercises unlock as you complete lessons.',
    icon: '📚',
    to: '/piano/practice/exercises',
    color: '#a78bfa',
    badge: '48',
  },
  {
    id: 'songs',
    title: 'Play Songs',
    description: '18 classic pieces from beginner to intermediate. Many with both-hands arrangements.',
    icon: '🎵',
    to: '/piano/practice/songs',
    color: '#8b5cf6',
    badge: '18',
  },
  {
    id: 'scales',
    title: 'Scale Trainer',
    description: 'All major and minor scales with proper fingering. 1 or 2 octaves, hands separate or together, at your tempo.',
    icon: '🎼',
    to: '/piano/practice/scales',
    color: '#7c3aed',
  },
  {
    id: 'chords',
    title: 'Chord Lab',
    description: 'Every triad, seventh chord, and inversion. Common progressions in all keys. Block chords and broken patterns.',
    icon: '🎹',
    to: '/piano/practice/chords',
    color: '#6d28d9',
  },
  {
    id: 'sight-reading',
    title: 'Sight Reading',
    description: 'Random short passages at your level. Preview, then play without stopping. Builds the most practical piano skill.',
    icon: '👁',
    to: '/piano/practice/sight-reading',
    color: '#5b21b6',
  },
  {
    id: 'ear-training',
    title: 'Ear Training',
    description: 'Identify intervals, chords, and short melodies by ear. Progressive difficulty from seconds to sevenths.',
    icon: '👂',
    to: '/piano/practice/ear-training',
    color: '#4c1d95',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════

export default function PracticeHubPage() {
  const { progress, totalPracticeTime, practiceStreak, getBestResult } = usePianoProgressStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  // Count exercise stats
  const totalExercises = CURRICULUM.flatMap(m => m.exercises).length
  const completedExercises = CURRICULUM.flatMap(m => m.exercises).filter(e => getBestResult(e.id)).length
  const unlockedModules = CURRICULUM.filter(m => isModuleUnlocked(m, progress.completedLessons, CURRICULUM)).length

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 max-w-[1800px] mx-auto">
      {/* ── Header ── */}
      <div className="relative mb-4 sm:mb-6 overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 lg:p-8 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(12,10,20,0.9) 0%, rgba(10,12,22,0.9) 50%, rgba(14,10,20,0.8) 100%)',
      }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)` }} />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight mb-1">Practice</h1>
          <p className="text-sm text-[#6b7280] max-w-lg">
            Your piano gym. Drill exercises, play songs, build technique — all with visual guidance.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-5">
            <Stat value={`${totalPracticeTime}`} unit="m" label="Practice time" />
            <Stat value={`${practiceStreak}`} label="Day streak" />
            <Stat value={`${completedExercises}/${totalExercises}`} label="Exercises" />
            <Stat value={`${unlockedModules}/${CURRICULUM.length}`} label="Modules open" />
          </div>
        </div>
      </div>

      {/* ── Practice Sections Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {SECTIONS.map(section => (
          <Link key={section.id} to={section.to}
            className="group relative rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-white/[0.04] overflow-hidden transition-all hover:border-white/[0.08]"
            style={{ background: 'linear-gradient(135deg, rgba(12,14,20,0.7) 0%, rgba(10,12,18,0.8) 100%)' }}>
            {/* Left accent */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ background: section.color, opacity: 0.5 }} />
            {/* Hover glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ background: `radial-gradient(circle, ${section.color}15 0%, transparent 70%)` }} />

            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${section.color}10`, border: `1px solid ${section.color}20` }}>
                {section.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold text-sm">{section.title}</h3>
                  {section.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold"
                      style={{ background: `${section.color}15`, color: section.color }}>
                      {section.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6b7280] leading-relaxed mt-1">{section.description}</p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium transition-colors"
                  style={{ color: `${section.color}99` }}>
                  Open
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── How it works ── */}
      <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-white/[0.04]" style={{
        background: 'linear-gradient(135deg, rgba(12,14,20,0.5) 0%, rgba(10,12,18,0.6) 100%)',
      }}>
        <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">How Practice Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {[
            { step: '1', title: 'Watch & Listen', desc: 'See notes on the keyboard with finger numbers. Hear correct sound at your tempo.' },
            { step: '2', title: 'Play Along', desc: 'Play on your piano following the visual guide. Pause, rewind, repeat as needed.' },
            { step: '3', title: 'Self-Assess', desc: 'Rate your performance. Your skill profile updates based on your honest assessment.' },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: `${accent}12`, color: accent }}>{item.step}</div>
              <div>
                <div className="text-xs font-medium text-white">{item.title}</div>
                <p className="text-[10px] text-[#6b7280] leading-relaxed mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div>
      <div className="text-base sm:text-lg font-bold text-white">
        {value}{unit && <span className="text-sm text-[#4b5563]">{unit}</span>}
      </div>
      <div className="text-[9px] text-[#4b5563] uppercase tracking-wider">{label}</div>
    </div>
  )
}
