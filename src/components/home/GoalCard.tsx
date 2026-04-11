import { CompanyGoal } from '@/hooks/useHome'
import { differenceInDays, parseISO, isValid } from 'date-fns'

interface GoalCardProps {
  goal: CompanyGoal
  onEdit?: (goal: CompanyGoal) => void
  isExecutive?: boolean
}

function computeGoalStatus(goal: CompanyGoal): 'on_track' | 'at_risk' | 'completed' {
  if (!goal.target || goal.target === 0) return 'on_track'
  const pct = (goal.current / goal.target) * 100
  if (pct >= 100) return 'completed'
  if (goal.deadline) {
    const deadline = parseISO(goal.deadline)
    const now = new Date()
    if (isValid(deadline)) {
      const total = differenceInDays(deadline, new Date(goal.created_at))
      const elapsed = differenceInDays(now, new Date(goal.created_at))
      const periodPct = total > 0 ? elapsed / total : 0
      if (periodPct > 0.5 && pct < 40) return 'at_risk'
    }
  }
  return 'on_track'
}

const statusConfig = {
  on_track: { label: 'No caminho', color: '#10B981', dot: '🟢' },
  at_risk: { label: 'Em risco', color: '#F59E0B', dot: '🟡' },
  completed: { label: 'Concluído', color: '#6366F1', dot: '🏆' },
}

export function GoalCard({ goal, onEdit, isExecutive }: GoalCardProps) {
  const status = computeGoalStatus(goal)
  const cfg = statusConfig[status]
  const pct = goal.target ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0

  const format = (val: number) => {
    if (goal.unit === 'BRL') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    }
    return `${val.toLocaleString('pt-BR')} ${goal.unit}`
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1A1A26] p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <p className="text-sm font-semibold text-white">{goal.title}</p>
        </div>
        {isExecutive && onEdit && (
          <button
            onClick={() => onEdit(goal)}
            className="text-xs text-[#6366F1] hover:underline"
          >
            ✏️
          </button>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-white font-semibold">{format(goal.current)}</span>
          <span className="text-white/50">de {goal.target ? format(goal.target) : '—'}</span>
        </div>
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: cfg.color }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-medium" style={{ color: cfg.color }}>
            {cfg.dot} {cfg.label}
          </span>
          {goal.deadline && (
            <span className="text-xs text-white/40">Vence {goal.deadline}</span>
          )}
        </div>
      </div>
    </div>
  )
}
