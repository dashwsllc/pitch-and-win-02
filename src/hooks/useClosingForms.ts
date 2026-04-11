import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export interface ClosingForm {
  id: string
  closer_id: string
  lead_name: string
  lead_whatsapp?: string
  product: string
  value: number
  objections_raised?: string
  how_closed?: string
  next_steps?: string
  status: 'won' | 'lost' | 'pending'
  closed_at?: string
  created_at: string
}

export function useClosingForms(status?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['closing_forms', status],
    queryFn: async () => {
      let query = supabase
        .from('closing_forms')
        .select('*')
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as ClosingForm[]
    },
    enabled: !!user,
  })
}

export function useCreateClosingForm() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (values: Omit<ClosingForm, 'id' | 'closer_id' | 'created_at'>) => {
      const payload: any = { ...values, closer_id: user!.id }
      if (values.status === 'won') {
        payload.closed_at = new Date().toISOString()
        // Also create a sale record
        await supabase.from('vendas').insert({
          user_id: user!.id,
          produto: values.product,
          valor: values.value,
          nome_cliente: values.lead_name,
          telefone_cliente: values.lead_whatsapp,
        })
      }
      const { data, error } = await supabase
        .from('closing_forms')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['closing_forms'] })
      qc.invalidateQueries({ queryKey: ['vendas'] })
      toast.success('Fechamento registrado!')
    },
    onError: () => toast.error('Erro ao registrar fechamento'),
  })
}
