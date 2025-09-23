import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useRoles } from '@/hooks/useRoles'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Lock, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ExecutiveProtectedRouteProps {
  children: React.ReactNode
}

export function ExecutiveProtectedRoute({ children }: ExecutiveProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { isExecutive, isSuperAdmin, loading: rolesLoading } = useRoles()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (!authLoading && !rolesLoading && !user) {
      const timer = setTimeout(() => {
        setShouldRedirect(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [user, authLoading, rolesLoading])

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!user && shouldRedirect) {
    return <Navigate to="/auth" replace />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Verificar se tem permissão executiva (super admin ou role executive)
  if (!isExecutive && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">Acesso Restrito</CardTitle>
            <CardDescription className="text-base">
              Você não tem permissão para acessar o painel executive.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <Shield className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Apenas usuários com permissões de executive podem acessar esta área.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}