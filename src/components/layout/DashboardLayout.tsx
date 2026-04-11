import { ReactNode } from "react"
import { ExecutiveAppSidebar } from "./ExecutiveAppSidebar"
import { UserProfile } from "@/components/dashboard/UserProfile"
import { useRoles } from "@/hooks/useRoles"
import { BottomNav } from "./BottomNav"
import type { AppRole } from "./BottomNav"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, Trophy } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isExecutive, roles } = useRoles()
  const location = useLocation()
  const isExecutivePage = location.pathname.includes('/executive')
  const role = (roles[0] || 'seller') as AppRole

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Sidebar — visível apenas no desktop (md+) */}
      <div className="hidden md:block">
        <ExecutiveAppSidebar isExecutive={isExecutive} />
      </div>

      <div className="md:ml-16 min-h-screen flex flex-col overflow-x-hidden">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center justify-between h-full px-4 md:px-6">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {isExecutivePage ? 'Dashboard Executive' : 'System'}
              </h1>

              {isExecutive && (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    asChild
                    variant={isExecutivePage ? "outline" : "default"}
                    size="sm"
                  >
                    <Link to="/dashboard">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Individual
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant={isExecutivePage ? "default" : "outline"}
                    size="sm"
                  >
                    <Link to="/executive">
                      <Users className="w-4 h-4 mr-2" />
                      Executive
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button asChild variant="ghost" size="sm" className="hidden md:flex">
                <Link to="/ranking">
                  <Trophy className="w-4 h-4" />
                </Link>
              </Button>
              <UserProfile />
            </div>
          </div>
        </header>

        {/* Main content with bottom padding for mobile nav */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav role={role} />
    </div>
  )
}
