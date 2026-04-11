import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export interface WorkboardTask {
  id: string
  title: string
  description?: string
  created_by: string
  assigned_to?: string[]
  target_roles?: string[]
  deadline?: string
  priority: 'low' | 'medium' | 'high'
  is_active: boolean
  created_at: string
}

export interface WorkboardCompletion {
  id: string
  task_id: string
  user_id: string
  completed_at: string
}

export function useWorkboardTasks() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['workboard_tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workboard_tasks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as WorkboardTask[]
    },
    enabled: !!user,
  })
}

export function useWorkboardCompletions() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['workboard_completions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workboard_completions')
        .select('*')
        .eq('user_id', user!.id)

      if (error) throw error
      return (data || []) as WorkboardCompletion[]
    },
    enabled: !!user,
  })
}

export function useCompleteTask() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('workboard_completions')
        .insert({ task_id: taskId, user_id: user!.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workboard_completions'] })
      toast.success('Task concluída!')
    },
    onError: () => toast.error('Erro ao concluir task'),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (values: Omit<WorkboardTask, 'id' | 'created_by' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('workboard_tasks')
        .insert({ ...values, created_by: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workboard_tasks'] })
      toast.success('Task criada!')
    },
    onError: () => toast.error('Erro ao criar task'),
  })
}

export function useArchiveTask() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workboard_tasks')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workboard_tasks'] })
      toast.success('Task arquivada!')
    },
    onError: () => toast.error('Erro ao arquivar task'),
  })
}
