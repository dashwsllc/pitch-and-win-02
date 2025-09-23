import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface CommissionData {
  totalCommissions: number
  availableForWithdrawal: number
  withdrawnAmount: number
}

export function useCommissionData() {
  const [data, setData] = useState<CommissionData>({
    totalCommissions: 0,
    availableForWithdrawal: 0,
    withdrawnAmount: 0,
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchCommissionData = async () => {
    if (!user) return

    try {
      // Buscar todas as vendas do usuário para calcular comissão total (10%)
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('valor_venda')
        .eq('user_id', user.id)

      if (vendasError) throw vendasError

      const totalVendas = vendas?.reduce((sum, venda) => sum + parseFloat(venda.valor_venda.toString()), 0) || 0
      const totalCommissions = totalVendas * 0.10

      // Buscar saldo atual
      const { data: saldo, error: saldoError } = await supabase
        .from('saldos_disponiveis')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (saldoError) throw saldoError

      // Buscar saques pendentes para reservar valor
      const { data: saquesPendentes, error: pendError } = await supabase
        .from('saques')
        .select('valor_solicitado')
        .eq('user_id', user.id)
        .eq('status', 'pendente')

      if (pendError) throw pendError

      const pendingAmount = saquesPendentes?.reduce((sum, s) => sum + parseFloat(s.valor_solicitado.toString()), 0) || 0
      const currentWithdrawn = parseFloat((saldo?.valor_sacado ?? 0).toString())
      const availableComputed = Math.max(0, totalCommissions - currentWithdrawn - pendingAmount)

      setData({
        totalCommissions,
        availableForWithdrawal: availableComputed,
        withdrawnAmount: currentWithdrawn,
      })

      // Sincronizar tabela de saldos com os valores corretos
      if (saldo) {
        const { error: updateError } = await supabase
          .from('saldos_disponiveis')
          .update({ 
            valor_total_comissoes: totalCommissions,
            valor_liberado_para_saque: availableComputed,
          })
          .eq('user_id', user.id)
        if (updateError) console.error('Error updating balance:', updateError)
      } else {
        const { error: insertError } = await supabase
          .from('saldos_disponiveis')
          .insert({
            user_id: user.id,
            valor_total_comissoes: totalCommissions,
            valor_liberado_para_saque: availableComputed,
            valor_sacado: 0,
          })
        if (insertError) console.error('Error inserting balance:', insertError)
      }

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