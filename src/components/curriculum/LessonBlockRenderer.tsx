import { LessonBlock } from '../../types/curriculum'
import PatternGrid from '../shared/PatternGrid'
import StaffNotationDisplay from '../shared/StaffNotationDisplay'
import QuizBlock from './QuizBlock'
import { LESSON_VISUALS, LessonVisualEntry } from '../../data/lessonVisuals'
import DrumKitDiagram from '../visuals/DrumKitDiagram'
import StickGripGuide from '../visuals/StickGripGuide'
import SittingPosture from '../visuals/SittingPosture'
import NoteValuesChart from '../visuals/NoteValuesChart'
import TimeSignatureVisual from '../visuals/TimeSignatureVisual'
import BpmMeter from '../visuals/BpmMeter'
import DrumStaffDiagram from '../visuals/DrumStaffDiagram'
import RestValuesChart from '../visuals/RestValuesChart'
import BeamingGuide from '../visuals/BeamingGuide'
import DrumArticulationsGuide from '../visuals/DrumArticulationsGuide'
import CountingGuide from '../visuals/CountingGuide'
import RudimentsVisual from '../visuals/RudimentsVisual'
import DottedNotesVisual from '../visuals/DottedNotesVisual'
import RhythmBuilderVisual from '../visuals/RhythmBuilderVisual'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Apply inline formatting (bold, italic, code, links) to a string
function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

// Parse a markdown table block into HTML
function parseTable(block: string): string {
  const lines = block.trim().split('\n').filter((l) => l.trim())
  if (lines.length < 3) return block // not enough rows

  const headers = lines[0]
    .split('|')
    .slice(1, -1)
    .map((h) => h.trim())

  // lines[1] is the separator row — skip it
  const rows = lines.slice(2).map((row) =>
    row
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim())
  )

  const thead = `<thead><tr>${headers.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead>`
  const tbody = `<tbody>${rows.map((row) => `<tr>${row.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`
  return `<div class="table-wrapper"><table>${thead}${tbody}</table></div>`
}

// Full markdown renderer for lesson content
function renderMarkdown(md: string): string {
  // 1. Fenced code blocks (``` ... ```)
  let result = md.replace(/```[^\n]*\n([\s\S]*?)```/g, (_, code) => {
    return `<pre><code>${escapeHtml(code.trimEnd())}</code></pre>`
  })

  // 2. Tables: header row | sep row | data rows
  result = result.replace(
    /(\|.+\|\n\|[-|: ]+\|\n(?:\|.+\|(?:\n|$))+)/g,
    (match) => parseTable(match)
  )

  // 3. Line-by-line
  const lines = result.split('\n')
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (/^### /.test(line)) { out.push(`<h3>${inline(line.slice(4))}</h3>`); i++; continue }
    if (/^## /.test(line))  { out.push(`<h2>${inline(line.slice(3))}</h2>`); i++; continue }
    if (/^# /.test(line))   { out.push(`<h1>${inline(line.slice(2))}</h1>`); i++; continue }
    if (/^---$/.test(line)) { out.push('<hr />'); i++; continue }
    if (/^> /.test(line))   { out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); i++; continue }
    if (/^- /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^- /.test(lines[i])) {
        items.push(`<li>${inline(lines[i].slice(2))}</li>`)
        i++
      }
      out.push(`<ul>${items.join('')}</ul>`)
      continue
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\. /, ''))}</li>`)
        i++
      }
      out.push(`<ol>${items.join('')}</ol>`)
      continue
    }
    // Already-converted HTML blocks (pre, table, etc.) — pass through
    if (/^<(pre|div|table|blockquote|h[1-6]|ul|ol|hr)/.test(line)) {
      out.push(line); i++; continue
    }
    // Non-empty line → paragraph
    if (line.trim()) {
      out.push(`<p>${inline(line)}</p>`)
    }
    i++
  }

  return out.join('\n')
}

function VisualComponent({ entry }: { entry: LessonVisualEntry }) {
  switch (entry.component) {
    case 'drum-kit-diagram':
      return <DrumKitDiagram />
    case 'sitting-posture':
      return <SittingPosture />
    case 'stick-grip':
      return <StickGripGuide />
    case 'note-values':
      return <NoteValuesChart />
    case 'time-signature':
      return <TimeSignatureVisual />
    case 'bpm-meter':
      return <BpmMeter />
    case 'drum-staff':
      return <DrumStaffDiagram />
    case 'rest-values':
      return <RestValuesChart />
    case 'beaming-guide':
      return <BeamingGuide />
    case 'drum-articulations':
      return <DrumArticulationsGuide />
    case 'counting-guide':
      return <CountingGuide />
    case 'rudiments-visual':
      return <RudimentsVisual />
    case 'dotted-notes-visual':
      return <DottedNotesVisual />
    case 'rhythm-builder':
      return <RhythmBuilderVisual />
    default:
      return null
  }
}

interface Props {
  blocks: LessonBlock[]
  lessonId?: string
  onQuizComplete?: (blockIndex: number) => void
}

export default function LessonBlockRenderer({ blocks, lessonId, onQuizComplete }: Props) {
  const visuals = lessonId ? (LESSON_VISUALS[lessonId] ?? []) : []

  // Group visuals by afterBlock position
  const visualsByPosition = new Map<number, LessonVisualEntry[]>()
  for (const v of visuals) {
    const list = visualsByPosition.get(v.afterBlock) ?? []
    list.push(v)
    visualsByPosition.set(v.afterBlock, list)
  }

  const rendered: React.ReactNode[] = []

  // Visuals at position -1 go before everything
  for (const entry of visualsByPosition.get(-1) ?? []) {
    rendered.push(<VisualComponent key={`visual-pre-${entry.component}`} entry={entry} />)
  }

  blocks.forEach((block, i) => {
    // Render the block
    switch (block.type) {
      case 'text':
        rendered.push(
          <div
            key={i}
            className="prose"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content) }}
          />
        )
        break

      case 'image':
        rendered.push(
          <figure key={i} className="my-4">
            <img
              src={block.src}
              alt={block.alt}
              className="rounded-lg max-w-full border border-[#1e2433]"
            />
            {block.caption && (
              <figcaption className="text-xs text-[#6b7280] mt-1 text-center">
                {block.caption}
              </figcaption>
            )}
          </figure>
        )
        break

      case 'notation':
        rendered.push(
          <div key={i} className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-4">
            <p className="text-sm text-[#94a3b8] mb-4">{block.description}</p>
            <StaffNotationDisplay pattern={block.pattern} />
          </div>
        )
        break

      case 'quiz':
        rendered.push(
          <QuizBlock
            key={i}
            block={block}
            onComplete={() => onQuizComplete?.(i)}
          />
        )
        break
    }

    // Inject visuals after this block
    for (const entry of visualsByPosition.get(i) ?? []) {
      rendered.push(<VisualComponent key={`visual-${i}-${entry.component}`} entry={entry} />)
    }
  })

  return <div className="space-y-2">{rendered}</div>
}
