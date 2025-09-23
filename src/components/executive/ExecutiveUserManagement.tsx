import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
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
  Users, 
  Shield, 
  UserCheck, 
  Crown,
  Loader2,
  Trash2,
  UserMinus,
  RefreshCw,
  Save
} from 'lucide-react'
import { useAllUsers, useRoles } from '@/hooks/useRoles'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function ExecutiveUserManagement() {
  const { users, loading, refetch } = useAllUsers()
  const { isSuperAdmin } = useRoles()
  const { toast } = useToast()
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  const [suspendingUser, setSuspendingUser] = useState<string | null>(null)

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  const getRoleBadge = (role: string) => {
    if (role === 'executive') {
      return (
        <Badge className="bg-gradient-primary text-white">
          <Crown className="w-3 h-3 mr-1" />
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

  const changeUserRole = async (userId: string, userEmail: string, newRole: string) => {
    if (!isSuperAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas o super administrador pode alterar cargos.',
        variant: 'destructive'
      })
      return
    }

    setUpdatingUser(userId)
    
    try {
      // Remover role executive existente se houver
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'executive')

      // Se o novo role é executive, inserir o role
      if (newRole === 'executive') {
        const { error } = await supabase
          .from('user_roles')
          .insert([
            {
              user_id: userId,
              role: 'executive'
            }
          ])

        if (error) {
          throw error
        }
      }

      toast({
        title: 'Cargo alterado!',
        description: `${userEmail} agora é ${newRole === 'executive' ? 'Executive' : 'Seller'}.`
      })

      refetch()
    } catch (error) {
      console.error('Error changing user role:', error)
      toast({
        title: 'Erro ao alterar cargo',
        description: 'Não foi possível alterar o cargo. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setUpdatingUser(null)
    }
  }

  const toggleUserSuspension = async (userId: string, userEmail: string, currentSuspended: boolean) => {
    if (!isSuperAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas o super administrador pode suspender contas.',
        variant: 'destructive'
      })
      return
    }

    setSuspendingUser(userId)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ suspended: !currentSuspended })
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      toast({
        title: currentSuspended ? 'Conta reativada!' : 'Conta suspensa!',
        description: `${userEmail} foi ${currentSuspended ? 'reativado' : 'suspenso'}.`
      })

      refetch()
    } catch (error) {
      console.error('Error toggling user suspension:', error)
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status da conta. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setSuspendingUser(null)
    }
  }

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!isSuperAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas o super administrador pode excluir usuários.',
        variant: 'destructive'
      })
      return
    }

    setUpdatingUser(userId)
    
    try {
      // Primeiro remover todos os dados relacionados ao usuário
      await Promise.all([
        supabase.from('user_roles').delete().eq('user_id', userId),
        supabase.from('vendas').delete().eq('user_id', userId),
        supabase.from('abordagens').delete().eq('user_id', userId),
        supabase.from('assinaturas').delete().eq('user_id', userId),
        supabase.from('saques').delete().eq('user_id', userId),
        supabase.from('saldos_disponiveis').delete().eq('user_id', userId),
        supabase.from('profiles').delete().eq('user_id', userId)
      ])

      toast({
        title: 'Usuário excluído!',
        description: `${userEmail} foi removido da plataforma.`
      })

      refetch()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: 'Erro ao excluir usuário',
        description: 'Não foi possível excluir o usuário. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setUpdatingUser(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciar Usuários
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciar Usuários ({users.length})
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => {
            const userRoles = user.roles || []
            const isExecutive = userRoles.includes('executive')
            const role = isExecutive ? 'executive' : 'seller'
            const isSuspended = user.suspended || false
            
            return (
              <div key={user.id} className={`flex items-center justify-between p-4 border rounded-lg ${isSuspended ? 'bg-muted/50 opacity-75' : ''}`}>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className={`${isSuspended ? 'bg-muted text-muted-foreground' : 'bg-gradient-primary text-white'}`}>
                      {getInitials(user.display_name || user.user_id)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {user.display_name || 'Usuário'}
                      </p>
                      {isSuspended && (
                        <Badge variant="destructive" className="text-xs">
                          Suspenso
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ID: {user.user_id?.substring(0, 8)}...
                    </p>
                  </div>
                  
                  {getRoleBadge(role)}
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={role}
                    onValueChange={(newRole) => changeUserRole(user.user_id, user.display_name || user.user_id, newRole)}
                    disabled={updatingUser === user.user_id || isSuspended}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue>
                        {updatingUser === user.user_id ? (
                          <div className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="text-xs">Alterando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            {role === 'executive' ? <Crown className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            <span className="text-xs capitalize">
                              {role === 'executive' ? 'Executive' : 'Seller'}
                            </span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seller">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3 h-3" />
                          Seller
                        </div>
                      </SelectItem>
                      <SelectItem value="executive">
                        <div className="flex items-center gap-2">
                          <Crown className="w-3 h-3" />
                          Executive
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {isSuperAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                          disabled={suspendingUser === user.user_id}
                        >
                          {suspendingUser === user.user_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserMinus className="w-4 h-4" />
                          )}
                          {isSuspended ? 'Desuspender' : 'Suspender'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {isSuspended ? 'Desuspender conta' : 'Suspender conta'}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {isSuspended 
                              ? 'Tem certeza que deseja reativar esta conta? O usuário poderá acessar o sistema novamente.'
                              : 'Tem certeza que deseja suspender esta conta? O usuário não poderá mais acessar o sistema.'
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => toggleUserSuspension(user.user_id, user.display_name || user.user_id, isSuspended)}
                            className={isSuspended ? "bg-green-600 hover:bg-green-700" : "bg-yellow-600 hover:bg-yellow-700"}
                          >
                            {isSuspended ? 'Desuspender' : 'Suspender'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {isSuperAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive"
                          size="sm"
                          disabled={updatingUser === user.user_id}
                        >
                          {updatingUser === user.user_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir conta do usuário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação é IRREVERSÍVEL. Todos os dados do usuário {user.display_name || user.user_id}, 
                            incluindo vendas, abordagens e assinaturas serão permanentemente excluídos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUser(user.user_id, user.display_name || user.user_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir Permanentemente
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            )
          })}

          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}