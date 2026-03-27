import { useState } from 'react'
import { QuizBlock as QuizBlockType } from '@drums/types/curriculum'

interface Props {
  block: QuizBlockType
  onComplete?: () => void
}

export default function QuizBlock({ block, onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const answered = selected !== null
  const correct = selected === block.correctIndex

  function handleSelect(i: number) {
    if (answered) return
    setSelected(i)
    if (i === block.correctIndex) onComplete?.()
  }

  return (
    <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl p-5 my-4">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-violet-500 text-lg mt-0.5">?</span>
        <p className="text-[#e2e8f0] font-medium">{block.question}</p>
      </div>

      <div className="space-y-2">
        {block.options.map((option, i) => {
          let style = 'border-[#1e2433] text-[#94a3b8] hover:border-violet-800 hover:text-[#c4b5fd]'
          if (answered) {
            if (i === block.correctIndex) style = 'border-green-600 bg-green-900/20 text-green-400'
            else if (i === selected) style = 'border-red-600 bg-red-900/20 text-red-400'
            else style = 'border-[#1e2433] text-[#4b5563]'
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${style}`}
            >
              <span className="text-[#4b5563] mr-2">{String.fromCharCode(65 + i)}.</span>
              {option}
            </button>
          )
        })}
      </div>

      {answered && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            correct
              ? 'bg-green-900/20 border border-green-800 text-green-300'
              : 'bg-red-900/20 border border-red-800 text-red-300'
          }`}
        >
          <span className="font-medium">{correct ? '✓ Correct! ' : '✗ Not quite. '}</span>
          {block.explanation}
        </div>
      )}
    </div>
  )
}
