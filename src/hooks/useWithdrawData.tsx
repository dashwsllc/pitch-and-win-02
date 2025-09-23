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
      // Buscar saldo disponível
      const { data: saldo, error: saldoError } = await supabase
        .from('saldos_disponiveis')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (saldoError) throw saldoError

      // Se não existe saldo, criar um novo registro
      if (!saldo) {
        const { error: insertError } = await supabase
          .from('saldos_disponiveis')
          .insert({
            user_id: user.id,
            valor_total_comissoes: 0,
            valor_liberado_para_saque: 0,
            valor_sacado: 0,
          })

        if (insertError) throw insertError

        setData({
          availableAmount: 0,
          totalCommissions: 0,
          withdrawnAmount: 0,
        })
      } else {
        setData({
          availableAmount: Number(saldo.valor_liberado_para_saque ?? 0),
          totalCommissions: Number(saldo.valor_total_comissoes ?? 0),
          withdrawnAmount: Number(saldo.valor_sacado ?? 0),
        })
      }
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