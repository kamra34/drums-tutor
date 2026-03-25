import { SkillProfile } from '../../types/curriculum'

const SKILLS: { key: keyof SkillProfile; label: string; color: string }[] = [
  { key: 'timing', label: 'Timing', color: 'bg-violet-500' },
  { key: 'dynamics', label: 'Dynamics', color: 'bg-blue-500' },
  { key: 'independence', label: 'Independence', color: 'bg-cyan-500' },
  { key: 'speed', label: 'Speed', color: 'bg-emerald-500' },
  { key: 'musicality', label: 'Musicality', color: 'bg-pink-500' },
]

interface Props {
  profile: SkillProfile
}

export default function SkillBars({ profile }: Props) {
  return (
    <div className="space-y-3">
      {SKILLS.map(({ key, label, color }) => (
        <div key={key}>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-[#94a3b8]">{label}</span>
            <span className="text-sm text-[#64748b]">{profile[key]}</span>
          </div>
          <div className="h-1.5 bg-[#1e2433] rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-500`}
              style={{ width: `${profile[key]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
