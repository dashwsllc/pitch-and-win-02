import { useState, useEffect } from "react"
import {
  BarChart3,
  Home,
  Trophy,
  Users,
  User,
  Shield,
  ClipboardList,
  FolderOpen,
  Target,
  MessageSquare,
  ShoppingCart,
  UserCheck,
  TrendingUp,
  BookOpen,
  CheckSquare,
} from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"

// Menu para executives / super_admin
const menuItems = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Executive", url: "/executive", icon: Shield },
  { title: "Time", url: "/team-members", icon: UserCheck },
  { title: "WorkBoard", url: "/workboard/admin", icon: CheckSquare },
  { title: "CRM", url: "/crm", icon: Users },
  { title: "Tráfego", url: "/traffic", icon: TrendingUp },
  { title: "Playbooks", url: "/playbooks", icon: BookOpen },
  {
    title: "Formulários",
    icon: ClipboardList,
    isDropdown: true,
    submenu: [
      { title: "Vendas", url: "/vendas", icon: ShoppingCart },
      { title: "Abordagens", url: "/abordagens", icon: MessageSquare },
      { title: "Fechamento", url: "/closing", icon: Target },
    ],
  },
  { title: "Documentos", url: "/documentos", icon: FolderOpen },
  { title: "Ranking", url: "/ranking", icon: Trophy },
  { title: "Perfil", url: "/perfil", icon: User },
]

// Menu para roles não-executive (seller, closer, sdr, etc.)
const individualMenuItems = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  {
    title: "Formulários",
    icon: ClipboardList,
    isDropdown: true,
    submenu: [
      { title: "Vendas", url: "/vendas", icon: ShoppingCart },
      { title: "Abordagens", url: "/abordagens", icon: MessageSquare },
      { title: "Fechamento", url: "/closing", icon: Target },
    ],
  },
  { title: "Playbooks", url: "/playbooks", icon: BookOpen },
  { title: "WorkBoard", url: "/workboard", icon: CheckSquare },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Documentos", url: "/documentos", icon: FolderOpen },
  { title: "Ranking", url: "/ranking", icon: Trophy },
  { title: "Perfil", url: "/perfil", icon: User },
]

interface AppSidebarProps {
  isExecutive?: boolean
}

export function ExecutiveAppSidebar({ isExecutive = false }: AppSidebarProps) {
  const items = isExecutive ? menuItems : individualMenuItems
  const location = useLocation()
  const navigate = useNavigate()
  const [openForm, setOpenForm] = useState(false)

  const isFormularioActive = (submenu: any[]) => {
    return submenu.some(subItem => location.pathname === subItem.url) || location.pathname === '/formularios'
  }

  useEffect(() => {
    const isFormularioRoute = items.find(
      item => item.isDropdown && item.submenu && isFormularioActive(item.submenu)
    )
    setOpenForm(!!isFormularioRoute)
  }, [location.pathname])

  return (
    <aside className="w-16 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-40">
      <div className="p-4">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
        {items.map((item) => {
          if (item.isDropdown && item.submenu) {
            return (
              <div key={item.title} className="flex flex-col">
                <button
                  className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300 ${
                    isFormularioActive(item.submenu)
                      ? "bg-sidebar-accent text-sidebar-primary border border-sidebar-primary/20"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                  title={item.title}
                  onClick={() => setOpenForm(!openForm)}
                >
                  <item.icon className="w-5 h-5" />
                </button>
                {openForm && (
                  <div className="flex flex-col gap-1 mt-1 ml-1">
                    {item.submenu.map((subItem) => (
                      <NavLink
                        key={subItem.title}
                        to={subItem.url}
                        className={({ isActive }) =>
                          `flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-primary border border-sidebar-primary/20"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          }`
                        }
                        title={subItem.title}
                        onClick={() => setOpenForm(false)}
                      >
                        <subItem.icon className="w-4 h-4" />
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.title}
              to={item.url}
              className={({ isActive }) =>
                `flex items-center justify-center w-12 h-12 rounded-lg transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary border border-sidebar-primary/20"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`
              }
              title={item.title}
            >
              <item.icon className="w-5 h-5" />
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
