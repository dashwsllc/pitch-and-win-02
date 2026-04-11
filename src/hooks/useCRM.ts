import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export interface CRMLead {
  id: string
  created_by: string
  name: string
  whatsapp?: string
  email?: string
  source?: string
  qualification: 'cold' | 'warm' | 'hot'
  notes?: string
  last_contact_at?: string
  created_at: string
  updated_at: string
}

export interface CRMActivity {
  id: string
  lead_id: string
  user_id: string
  type: 'call' | 'message' | 'meeting' | 'note' | 'status_change'
  description?: string
  created_at: string
}

export function useCRMLeads(qualification?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['crm_leads', qualification],
    queryFn: async () => {
      let query = supabase
        .from('crm_leads')
        .select('*')
        .order('updated_at', { ascending: false })

      if (qualification && qualification !== 'all') {
        query = query.eq('qualification', qualification)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as CRMLead[]
    },
    enabled: !!user,
  })
}

export function useCRMActivities(leadId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['crm_activities', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as CRMActivity[]
    },
    enabled: !!user && !!leadId,
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (values: Omit<CRMLead, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('crm_leads')
        .insert({ ...values, created_by: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm_leads'] })
      toast.success('Lead criado com sucesso!')
    },
    onError: () => toast.error('Erro ao criar lead'),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<CRMLead> & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_leads')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm_leads'] })
      toast.success('Lead atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar lead'),
  })
}

export function useCreateActivity() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (values: { lead_id: string; type: CRMActivity['type']; description?: string }) => {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert({ ...values, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['crm_activities', vars.lead_id] })
      toast.success('Atividade registrada!')
    },
    onError: () => toast.error('Erro ao registrar atividade'),
  })
}
