import { useNavigate } from 'react-router-dom'
import type { AppRole } from '@/components/layout/BottomNav'

interface QuickAction {
  label: string
  to?: string
  action?: () => void
}

function getActions(role: AppRole): QuickAction[] {
  switch (role) {
    case 'closer':
      return [
        { label: '+ Registrar Venda', to: '/vendas' },
        { label: 'Ver Inspirações', to: '/playbooks' },
        { label: 'Meu WorkBoard', to: '/workboard' },
      ]
    case 'sdr':
      return [
        { label: '+ Nova Abordagem', to: '/abordagens' },
        { label: 'Ver Scripts SDR', to: '/playbooks' },
        { label: 'Meu WorkBoard', to: '/workboard' },
      ]
    case 'bdr':
      return [
        { label: '+ Novo Lead', to: '/crm' },
        { label: 'Ver CRM', to: '/crm' },
        { label: 'Meu WorkBoard', to: '/workboard' },
      ]
    case 'traffic_manager':
      return [
        { label: '+ Inserir Métricas', to: '/traffic/new' },
        { label: 'Ver Dashboard Tráfego', to: '/traffic' },
      ]
    case 'executive':
    case 'super_admin':
      return [
        { label: '+ Comunicado', to: '/home' },
        { label: '+ Objetivo', to: '/home' },
        { label: 'Gestão do Time', to: '/team-members' },
        { label: 'Ver Tráfego', to: '/traffic' },
      ]
    default:
      return [
        { label: '+ Registrar Venda', to: '/vendas' },
        { label: '+ Nova Abordagem', to: '/abordagens' },
        { label: 'Meu WorkBoard', to: '/workboard' },
      ]
  }
}

interface QuickActionsProps {
  role: AppRole
}

export function QuickActions({ role }: QuickActionsProps) {
  const navigate = useNavigate()
  const actions = getActions(role)

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => action.to ? navigate(action.to) : action.action?.()}
          className="flex-shrink-0 px-3 py-1.5 rounded-full border border-white/15 bg-[#1A1A26] text-sm text-white/80 hover:bg-[#6366F1] hover:border-transparent hover:text-white transition-all whitespace-nowrap"
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
