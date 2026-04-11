import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export interface Playbook {
  id: string
  title: string
  content: string
  type: 'sdr_approach' | 'closer_inspiration' | 'objection_handler' | 'general'
  target_roles: string[]
  tags: string[]
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export function usePlaybooks(type?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['playbooks', type],
    queryFn: async () => {
      let query = supabase
        .from('playbooks')
        .select('*')
        .order('created_at', { ascending: false })

      if (type && type !== 'all') {
        query = query.eq('type', type)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as Playbook[]
    },
    enabled: !!user,
  })
}

export function useCreatePlaybook() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (values: Omit<Playbook, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('playbooks')
        .insert({ ...values, created_by: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks'] })
      toast.success('Playbook criado!')
    },
    onError: () => toast.error('Erro ao criar playbook'),
  })
}

export function useUpdatePlaybook() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Playbook> & { id: string }) => {
      const { data, error } = await supabase
        .from('playbooks')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks'] })
      toast.success('Playbook atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar playbook'),
  })
}

export function useDeletePlaybook() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('playbooks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks'] })
      toast.success('Playbook removido!')
    },
    onError: () => toast.error('Erro ao remover playbook'),
  })
}
