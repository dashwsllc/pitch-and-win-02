import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface CommissionData {
  totalSales: number
  totalRevenue: number
  commissionRate: number
  totalCommissions: number
  availableForWithdrawal: number
  withdrawnAmount: number
  pendingWithdrawals: number
}

export function useCommissionData() {
  const [data, setData] = useState<CommissionData>({
    totalSales: 0,
    totalRevenue: 0,
    commissionRate: 0.10, // 10%
    totalCommissions: 0,
    availableForWithdrawal: 0,
    withdrawnAmount: 0,
    pendingWithdrawals: 0
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchCommissionData = async () => {
    if (!user) return

    try {
      console.log('Fetching commission data for user:', user.id)
      setLoading(true)

      // Buscar todas as vendas do usuário
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('valor_venda')
        .eq('user_id', user.id)

      if (vendasError) throw vendasError

      // Buscar saques pendentes
      const { data: saquesPendentes, error: saquesError } = await supabase
        .from('saques')
        .select('valor_solicitado')
        .eq('user_id', user.id)
        .eq('status', 'pendente')

      if (saquesError) throw saquesError

      // Buscar saldos
      const { data: saldo, error: saldoError } = await supabase
        .from('saldos_disponiveis')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (saldoError) throw saldoError

      // Calcular dados
      const totalSales = vendas?.length || 0
      const totalRevenue = vendas?.reduce((sum, venda) => sum + Number(venda.valor_venda), 0) || 0
      const totalCommissions = totalRevenue * 0.10 // 10% de comissão
      const withdrawnAmount = Number(saldo?.valor_sacado || 0)
      const pendingWithdrawals = saquesPendentes?.reduce((sum, saque) => sum + Number(saque.valor_solicitado), 0) || 0
      const availableForWithdrawal = Math.max(0, totalCommissions - withdrawnAmount - pendingWithdrawals)

      console.log('Commission calculation:', {
        totalSales,
        totalRevenue,
        totalCommissions,
        withdrawnAmount,
        pendingWithdrawals,
        availableForWithdrawal
      })

      setData({
        totalSales,
        totalRevenue,
        commissionRate: 0.10,
        totalCommissions,
        availableForWithdrawal,
        withdrawnAmount,
        pendingWithdrawals
      })

    } catch (error) {
      console.error('Error fetching commission data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchCommissionData()
    }
  }, [user])

  return {
    data,
    loading,
    refetch: fetchCommissionData,
  }
}