import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export interface CompanyGoal {
  id: string
  title: string
  description?: string
  period: 'daily' | 'weekly' | 'monthly'
  target?: number
  unit: string
  current: number
  status: 'on_track' | 'at_risk' | 'completed'
  deadline?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  pinned: boolean
  created_by: string
  created_at: string
  profiles?: { display_name: string | null }
}

export function useCompanyGoals(period?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['company_goals', period],
    queryFn: async () => {
      let query = supabase
        .from('company_goals')
        .select('*')
        .order('created_at', { ascending: false })

      if (period && period !== 'all') {
        query = query.eq('period', period)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as CompanyGoal[]
    },
    enabled: !!user,
  })
}

export function useAnnouncements(pinnedOnly = false) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['announcements', pinnedOnly],
    queryFn: async () => {
      let query = supabase
        .from('announcements')
        .select('*, profiles(display_name)')
        .order('created_at', { ascending: false })

      if (pinnedOnly) {
        query = query.eq('pinned', true)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as Announcement[]
    },
    enabled: !!user,
  })
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (values: { title: string; content: string; pinned: boolean }) => {
      const { error } = await supabase
        .from('announcements')
        .insert({ ...values, created_by: user!.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      toast.success('Comunicado publicado!')
    },
    onError: () => toast.error('Erro ao publicar comunicado'),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, current }: { id: string; current: number }) => {
      const { error } = await supabase
        .from('company_goals')
        .update({ current })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company_goals'] })
      toast.success('Progresso atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar progresso'),
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (values: Omit<CompanyGoal, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('company_goals')
        .insert({ ...values, created_by: user!.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company_goals'] })
      toast.success('Objetivo criado!')
    },
    onError: () => toast.error('Erro ao criar objetivo'),
  })
}
