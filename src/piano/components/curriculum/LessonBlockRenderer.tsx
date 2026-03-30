import type { LessonBlock } from '@piano/types/curriculum'
import QuizBlock from './QuizBlock'
import { LESSON_VISUALS, LessonVisualEntry } from '@piano/data/lessonVisuals'
import KeyboardDiagram from '../visuals/KeyboardDiagram'
import StaffGuide from '../visuals/StaffGuide'
import HandPositionGuide from '../visuals/HandPositionGuide'
import NoteValuesChart from '../visuals/NoteValuesChart'
import MelodyPlayer from '../visuals/MelodyPlayer'
import type { MelodyPlayerProps } from '../visuals/MelodyPlayer'
import ChordDiagram from '../visuals/ChordDiagram'
import DynamicsGuide from '../visuals/DynamicsGuide'
import IntervalChart from '../visuals/IntervalChart'
import PedalGuide from '../visuals/PedalGuide'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

function parseTable(block: string): string {
  const lines = block.trim().split('\n').filter((l) => l.trim())
  if (lines.length < 3) return block

  const headers = lines[0].split('|').slice(1, -1).map((h) => h.trim())
  const rows = lines.slice(2).map((row) =>
    row.split('|').slice(1, -1).map((c) => c.trim())
  )

  const thead = `<thead><tr>${headers.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead>`
  const tbody = `<tbody>${rows.map((row) => `<tr>${row.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`
  return `<div class="table-wrapper"><table>${thead}${tbody}</table></div>`
}

function renderMarkdown(md: string): string {
  let result = md.replace(/```[^\n]*\n([\s\S]*?)```/g, (_, code) => {
    return `<pre><code>${escapeHtml(code.trimEnd())}</code></pre>`
  })

  result = result.replace(
    /(\|.+\|\n\|[-|: ]+\|\n(?:\|.+\|(?:\n|$))+)/g,
    (match) => parseTable(match)
  )

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
    if (/^<(pre|div|table|blockquote|h[1-6]|ul|ol|hr)/.test(line)) {
      out.push(line); i++; continue
    }
    if (line.trim()) {
      out.push(`<p>${inline(line)}</p>`)
    }
    i++
  }

  return out.join('\n')
}

function VisualComponent({ entry }: { entry: LessonVisualEntry }) {
  switch (entry.component) {
    case 'keyboard-diagram':
      return <KeyboardDiagram />
    case 'staff-guide':
      return <StaffGuide />
    case 'hand-position-guide':
      return <HandPositionGuide />
    case 'note-values-chart':
      return <NoteValuesChart />
    case 'melody-player':
      return <MelodyPlayer {...(entry.props as unknown as MelodyPlayerProps)} />
    case 'chord-diagram':
      return <ChordDiagram />
    case 'dynamics-guide':
      return <DynamicsGuide />
    case 'interval-chart':
      return <IntervalChart />
    case 'pedal-guide':
      return <PedalGuide />
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

  const visualsByPosition = new Map<number, LessonVisualEntry[]>()
  for (const v of visuals) {
    const list = visualsByPosition.get(v.afterBlock) ?? []
    list.push(v)
    visualsByPosition.set(v.afterBlock, list)
  }

  const rendered: React.ReactNode[] = []

  for (const entry of visualsByPosition.get(-1) ?? []) {
    rendered.push(<VisualComponent key={`visual-pre-${entry.component}`} entry={entry} />)
  }

  blocks.forEach((block, i) => {
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

    for (const entry of visualsByPosition.get(i) ?? []) {
      rendered.push(<VisualComponent key={`visual-${i}-${entry.component}`} entry={entry} />)
    }
  })

  return <div className="space-y-2">{rendered}</div>
}
