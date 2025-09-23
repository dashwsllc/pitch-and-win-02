import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface WithdrawData {
  availableAmount: number
  totalCommissions: number
  withdrawnAmount: number
}

export function useWithdrawData() {
  const [data, setData] = useState<WithdrawData>({
    availableAmount: 0,
    totalCommissions: 0,
    withdrawnAmount: 0,
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchWithdrawData = async () => {
    if (!user) return

    try {
      console.log('Fetching withdraw data for user:', user.id)
      
      // Primeiro buscar vendas do usuário para calcular comissão
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('valor_venda')
        .eq('user_id', user.id)

      if (vendasError) throw vendasError

      // Calcular total de vendas e comissão (10%)
      const totalVendas = vendas?.reduce((sum, venda) => sum + Number(venda.valor_venda), 0) || 0
      const comissaoTotal = totalVendas * 0.10

      console.log('Total vendas:', totalVendas, 'Comissão total:', comissaoTotal)

      // Buscar saldo disponível
      const { data: saldo, error: saldoError } = await supabase
        .from('saldos_disponiveis')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (saldoError) throw saldoError

      let valorSacado = 0
      let valorLiberado = comissaoTotal

      if (saldo) {
        valorSacado = Number(saldo.valor_sacado ?? 0)
        valorLiberado = comissaoTotal - valorSacado
      } else {
        // Se não existe saldo, criar um novo registro
        const { error: insertError } = await supabase
          .from('saldos_disponiveis')
          .insert({
            user_id: user.id,
            valor_total_comissoes: comissaoTotal,
            valor_liberado_para_saque: valorLiberado,
            valor_sacado: 0,
          })

        if (insertError) throw insertError
      }

      console.log('Saldo final:', {
        availableAmount: valorLiberado,
        totalCommissions: comissaoTotal,
        withdrawnAmount: valorSacado
      })

      setData({
        availableAmount: Math.max(0, valorLiberado),
        totalCommissions: comissaoTotal,
        withdrawnAmount: valorSacado,
      })
    } catch (error) {
      console.error('Error fetching withdraw data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchWithdrawData()
    }
  }, [user])

  return {
    data,
    loading,
    refetch: fetchWithdrawData,
  }
}