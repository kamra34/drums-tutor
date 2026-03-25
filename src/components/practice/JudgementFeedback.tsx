import { useEffect, useState } from 'react'
import { HitJudgement } from '../../stores/usePracticeStore'

const JUDGEMENT_CONFIG: Record<HitJudgement, { label: string; color: string }> = {
  perfect: { label: 'PERFECT', color: 'text-yellow-400' },
  good: { label: 'GOOD', color: 'text-green-400' },
  early: { label: 'EARLY', color: 'text-blue-400' },
  late: { label: 'LATE', color: 'text-orange-400' },
  miss: { label: 'MISS', color: 'text-red-500' },
}

interface Props {
  judgement: HitJudgement | null
  offsetMs?: number
  timestamp: number
}

export default function JudgementFeedback({ judgement, offsetMs, timestamp }: Props) {
  const [visible, setVisible] = useState(false)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (!judgement) return
    setVisible(true)
    setKey((k) => k + 1)
    const t = setTimeout(() => setVisible(false), 600)
    return () => clearTimeout(t)
  }, [timestamp])

  if (!judgement || !visible) return <div className="h-10" />

  const cfg = JUDGEMENT_CONFIG[judgement]

  return (
    <div key={key} className="h-10 flex items-center justify-center">
      <div className={`font-bold text-lg tracking-widest ${cfg.color} animate-bounce`}>
        {cfg.label}
        {offsetMs !== undefined && judgement !== 'miss' && (
          <span className="ml-2 text-sm font-normal opacity-70">
            {offsetMs > 0 ? `+${Math.round(offsetMs)}` : Math.round(offsetMs)}ms
          </span>
        )}
      </div>
    </div>
  )
}
