import { NavLink, useLocation } from 'react-router-dom'
import { Home, BarChart3, ShoppingCart, MessageSquare, MoreHorizontal, Users, TrendingUp, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { useNavigate } from 'react-router-dom'

export type AppRole = 'seller' | 'executive' | 'super_admin' | 'closer' | 'sdr' | 'bdr' | 'traffic_manager'

interface BottomNavProps {
  role: AppRole
}

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
}

function getNavItems(role: AppRole): NavItem[] {
  switch (role) {
    case 'closer':
      return [
        { label: 'Home', icon: Home, to: '/home' },
        { label: 'Dashboard', icon: BarChart3, to: '/dashboard' },
        { label: 'Vendas', icon: ShoppingCart, to: '/vendas' },
        { label: 'Playbook', icon: ClipboardList, to: '/playbooks' },
      ]
    case 'sdr':
      return [
        { label: 'Home', icon: Home, to: '/home' },
        { label: 'Dashboard', icon: BarChart3, to: '/dashboard' },
        { label: 'Abordagens', icon: MessageSquare, to: '/abordagens' },
        { label: 'Playbook', icon: ClipboardList, to: '/playbooks' },
      ]
    case 'bdr':
      return [
        { label: 'Home', icon: Home, to: '/home' },
        { label: 'Leads', icon: Users, to: '/crm' },
        { label: 'WorkBoard', icon: ClipboardList, to: '/workboard' },
        { label: 'Mais', icon: MoreHorizontal, to: '' },
      ]
    case 'traffic_manager':
      return [
        { label: 'Home', icon: Home, to: '/home' },
        { label: 'Tráfego', icon: TrendingUp, to: '/traffic' },
        { label: 'Inserir', icon: ClipboardList, to: '/traffic/new' },
        { label: 'Mais', icon: MoreHorizontal, to: '' },
      ]
    case 'executive':
    case 'super_admin':
      return [
        { label: 'Home', icon: Home, to: '/home' },
        { label: 'Dashboard', icon: BarChart3, to: '/executive' },
        { label: 'WorkBoard', icon: ClipboardList, to: '/workboard/admin' },
        { label: 'Mais', icon: MoreHorizontal, to: '' },
      ]
    default: // seller
      return [
        { label: 'Home', icon: Home, to: '/home' },
        { label: 'Dashboard', icon: BarChart3, to: '/dashboard' },
        { label: 'Vendas', icon: ShoppingCart, to: '/vendas' },
        { label: 'Mais', icon: MoreHorizontal, to: '' },
      ]
  }
}

function getMoreItems(role: AppRole) {
  switch (role) {
    case 'closer':
      return [
        { label: 'Formulário de Fechamento', to: '/closing' },
        { label: 'Meus Clientes', to: '/clientes' },
        { label: 'WorkBoard', to: '/workboard' },
        { label: 'Perfil', to: '/perfil' },
      ]
    case 'sdr':
      return [
        { label: 'Vendas', to: '/vendas' },
        { label: 'WorkBoard', to: '/workboard' },
        { label: 'Clientes', to: '/clientes' },
        { label: 'Perfil', to: '/perfil' },
      ]
    case 'bdr':
      return [
        { label: 'Documentos', to: '/documentos' },
        { label: 'Perfil', to: '/perfil' },
      ]
    case 'traffic_manager':
      return [
        { label: 'Histórico', to: '/traffic' },
        { label: 'Perfil', to: '/perfil' },
      ]
    case 'executive':
    case 'super_admin':
      return [
        { label: 'Tráfego', to: '/traffic' },
        { label: 'CRM', to: '/crm' },
        { label: 'Playbooks', to: '/playbooks' },
        { label: 'Documentos', to: '/documentos' },
        { label: 'Time', to: '/team-members' },
        { label: 'Ranking', to: '/ranking' },
        { label: 'Perfil', to: '/perfil' },
      ]
    default:
      return [
        { label: 'Clientes', to: '/clientes' },
        { label: 'WorkBoard', to: '/workboard' },
        { label: 'Documentos', to: '/documentos' },
        { label: 'Ranking', to: '/ranking' },
        { label: 'Perfil', to: '/perfil' },
      ]
  }
}

export function BottomNav({ role }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const navItems = getNavItems(role)
  const moreItems = getMoreItems(role)

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          height: 64,
          background: '#111118',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center justify-around h-full px-2">
          {navItems.map((item) => {
            if (item.to === '') {
              return (
                <button
                  key={item.label}
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors',
                    'text-[#475569] hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px]">{item.label}</span>
                </button>
              )
            }

            const isActive = location.pathname === item.to || (item.to !== '/home' && location.pathname.startsWith(item.to))

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors',
                  isActive ? 'text-[#6366F1]' : 'text-[#475569] hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5" />
                {isActive && <span className="text-[10px] font-medium">{item.label}</span>}
              </NavLink>
            )
          })}
        </div>
      </nav>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Mais">
        <div className="flex flex-col gap-1">
          {moreItems.map((item) => (
            <button
              key={item.label}
              onClick={() => { navigate(item.to); setMoreOpen(false) }}
              className="flex items-center px-3 py-3 rounded-lg text-left text-white/80 hover:bg-white/10 hover:text-white transition-colors text-sm"
            >
              {item.label}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  )
}
