import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
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
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  Eye
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface WithdrawalRequest {
  id: string
  user_id: string
  valor_solicitado: number
  chave_pix: string
  status: string
  data_solicitacao: string
  observacoes: string | null
  profile?: {
    display_name: string | null
    user_id: string
  }
}

export function ExecutiveWithdrawalManagement() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [observations, setObservations] = useState<string>('')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchWithdrawals = async () => {
    try {
      const { data: saques, error: saquesError } = await supabase
        .from('saques')
        .select('*')
        .order('data_solicitacao', { ascending: false })

      if (saquesError) throw saquesError

      const userIds = Array.from(new Set((saques || []).map((s) => s.user_id)))
      let profilesMap = new Map<string, { display_name: string | null; user_id: string }>()

      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds)
        if (profilesError) throw profilesError
        profiles?.forEach((p) => profilesMap.set(p.user_id, { user_id: p.user_id, display_name: p.display_name }))
      }

      const merged = (saques || []).map((s) => ({
        ...s,
        profile: profilesMap.get(s.user_id)
      })) as WithdrawalRequest[]

      setWithdrawals(merged)
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
      toast({
        title: 'Erro ao carregar saques',
        description: 'Não foi possível carregar as solicitações de saque.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : 'U'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        )
      case 'aprovado':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        )
      case 'rejeitado':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        )
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const processWithdrawal = async (withdrawalId: string, approve: boolean) => {
    setProcessing(withdrawalId)
    
    try {
      const withdrawal = withdrawals.find(w => w.id === withdrawalId)
      if (!withdrawal) return

      // Atualizar status do saque
      const { error: saqueError } = await supabase
        .from('saques')
        .update({
          status: approve ? 'aprovado' : 'rejeitado',
          data_processamento: new Date().toISOString(),
          processado_por: (await supabase.auth.getUser()).data.user?.id,
          observacoes: observations || null
        })
        .eq('id', withdrawalId)

      if (saqueError) throw saqueError

      if (approve) {
        // Se aprovado, usar a função process_withdrawal para debitar corretamente
        const { error: processError } = await supabase.rpc('process_withdrawal', {
          p_user_id: withdrawal.user_id,
          p_withdrawal_amount: withdrawal.valor_solicitado
        })

        if (processError) throw processError
      }
      // Se rejeitado, não precisa fazer nada com o saldo pois o valor já está disponível na comissão total

      toast({
        title: approve ? 'Saque aprovado!' : 'Saque rejeitado!',
        description: approve 
          ? `Saque de ${formatCurrency(withdrawal.valor_solicitado)} foi aprovado.`
          : `Saque de ${formatCurrency(withdrawal.valor_solicitado)} foi rejeitado.`
      })

      setObservations('')
      setSelectedWithdrawal(null)
      fetchWithdrawals()

    } catch (error) {
      console.error('Error processing withdrawal:', error)
      toast({
        title: 'Erro ao processar saque',
        description: 'Não foi possível processar a solicitação. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Gerenciar Saques
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

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pendente')
  const processedWithdrawals = withdrawals.filter(w => w.status !== 'pendente')

  return (
    <div className="space-y-6">
      {/* Pending Withdrawals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Saques Pendentes ({pendingWithdrawals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingWithdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum saque pendente.
              </div>
            ) : (
              pendingWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-primary text-white">
                          {getInitials(withdrawal.profile?.display_name || withdrawal.profile?.user_id || 'U')}
                          </AvatarFallback>
                        </Avatar>
                      
                      <div>
                        <p className="font-medium text-foreground">
                          {withdrawal.profile?.display_name || 'Usuário'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Chave PIX: {withdrawal.chave_pix}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Solicitado em: {new Date(withdrawal.data_solicitacao).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(withdrawal.valor_solicitado)}
                      </p>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={processing === withdrawal.id}
                          onClick={() => setSelectedWithdrawal(withdrawal.id)}
                        >
                          {processing === withdrawal.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Aprovar
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Aprovar saque?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Você está prestes a aprovar o saque de {formatCurrency(withdrawal.valor_solicitado)} 
                            para {withdrawal.profile?.display_name || 'o usuário'}. O valor será debitado do saldo disponível.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Observações (opcional):
                          </label>
                          <Textarea
                            placeholder="Adicione observações sobre a aprovação..."
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setObservations('')}>
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => processWithdrawal(withdrawal.id, true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Aprovar Saque
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive"
                          size="sm"
                          disabled={processing === withdrawal.id}
                          onClick={() => setSelectedWithdrawal(withdrawal.id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Rejeitar saque?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Você está prestes a rejeitar o saque de {formatCurrency(withdrawal.valor_solicitado)}. 
                            O valor será retornado ao saldo disponível do usuário.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Motivo da rejeição:
                          </label>
                          <Textarea
                            placeholder="Explique o motivo da rejeição..."
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            required
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setObservations('')}>
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => processWithdrawal(withdrawal.id, false)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Rejeitar Saque
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processed Withdrawals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Histórico de Saques ({processedWithdrawals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processedWithdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum saque processado ainda.
              </div>
            ) : (
              processedWithdrawals.slice(0, 10).map((withdrawal) => (
                <div key={withdrawal.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {getInitials(withdrawal.profile?.display_name || withdrawal.profile?.user_id || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <p className="font-medium text-foreground">
                          {withdrawal.profile?.display_name || 'Usuário'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Processado em: {new Date(withdrawal.data_solicitacao).toLocaleString('pt-BR')}
                        </p>
                        {withdrawal.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Obs: {withdrawal.observacoes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(withdrawal.valor_solicitado)}
                      </p>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}