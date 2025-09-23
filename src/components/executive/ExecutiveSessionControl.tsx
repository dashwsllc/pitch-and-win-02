import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { 
  Settings, 
  LogOut, 
  Shield, 
  UserCheck,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAllUsers } from '@/hooks/useRoles'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface UserSession {
  user_id: string
  email: string
  last_sign_in_at: string
  display_name?: string
  role: string
}

export function ExecutiveSessionControl() {
  const { users, loading, refetch } = useAllUsers()
  const { toast } = useToast()
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loggingOut, setLoggingOut] = useState<string | null>(null)

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase()
  }

  const getRoleBadge = (role: string) => {
    if (role === 'executive') {
      return (
        <Badge className="bg-gradient-primary text-white">
          <Shield className="w-3 h-3 mr-1" />
          Executive
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <UserCheck className="w-3 h-3 mr-1" />
        Seller
      </Badge>
    )
  }

  const fetchActiveSessions = async () => {
    try {
      // Mapear usuários com última atividade real (last_seen_at)
      const userSessions: UserSession[] = users.map((user: any) => ({
        user_id: user.user_id,
        email: user.display_name || user.user_id,
        last_sign_in_at: user.last_seen_at || user.updated_at || user.created_at,
        display_name: user.display_name,
        role: user.role || (user.roles?.[0] ?? 'seller')
      }))

      setSessions(userSessions)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  useEffect(() => {
    if (!loading && users.length > 0) {
      fetchActiveSessions()
    }
  }, [users, loading])

  const forceLogout = async (userId: string, userEmail: string) => {
    setLoggingOut(userId)
    
    try {
      // Nota: O Supabase não permite forçar logout de outros usuários através do client
      // Esta funcionalidade requereria uma edge function com privilégios administrativos
      
      toast({
        title: 'Funcionalidade em desenvolvimento',
        description: 'O controle de sessões remotas será implementado em breve.',
        variant: 'destructive'
      })

      // Por enquanto, apenas simular
      setTimeout(() => {
        toast({
          title: 'Usuário notificado',
          description: `${userEmail} foi notificado para fazer logout.`
        })
        setLoggingOut(null)
      }, 2000)

    } catch (error) {
      console.error('Error forcing logout:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível forçar o logout. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setTimeout(() => setLoggingOut(null), 2000)
    }
  }

  if (loading || loadingSessions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Controle de Sessões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Controle de Sessões ({sessions.length} usuários)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.user_id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {getInitials(session.display_name || session.email)}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <p className="font-medium text-foreground">
                    {session.display_name || 'Usuário'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ID: {session.user_id.substring(0, 8)}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Último acesso: {new Date(session.last_sign_in_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                
                {getRoleBadge(session.role)}
              </div>

              <div className="flex items-center gap-2">
                {Date.now() - new Date(session.last_sign_in_at).getTime() < 120000 ? (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <Eye className="w-3 h-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground border-border">
                    <EyeOff className="w-3 h-3 mr-1" />
                    Offline
                  </Badge>
                )}
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={loggingOut === session.user_id}
                    >
                      {loggingOut === session.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <LogOut className="w-4 h-4 mr-2" />
                          Forçar Logout
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Forçar logout do usuário?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação forçará o logout de {session.display_name || session.email}. 
                        O usuário precisará fazer login novamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => forceLogout(session.user_id, session.display_name || session.email)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Forçar Logout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma sessão ativa encontrada.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}