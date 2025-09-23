import { ReactNode } from "react"
import { ExecutiveAppSidebar } from "./ExecutiveAppSidebar"
import { UserProfile } from "@/components/dashboard/UserProfile"
import { useRoles } from "@/hooks/useRoles"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, Trophy } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isExecutive } = useRoles()
  const location = useLocation()
  const isExecutivePage = location.pathname.includes('/executive')
  
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <ExecutiveAppSidebar isExecutive={isExecutive} />
      
      <div className="ml-16 min-h-screen flex flex-col overflow-x-hidden">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-foreground">
                {isExecutivePage ? 'Dashboard Executive' : ''}
              </h1>
              
              {isExecutive && (
                <div className="flex items-center gap-2">
                  <Button 
                    asChild 
                    variant={isExecutivePage ? "outline" : "default"} 
                    size="sm"
                  >
                    <Link to="/dashboard">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Seller
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
            
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm">
                <Link to="/ranking">
                  <Trophy className="w-4 h-4" />
                </Link>
              </Button>
              <UserProfile />
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}