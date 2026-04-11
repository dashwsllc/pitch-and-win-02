import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export interface TrafficMetric {
  id: string
  manager_id: string
  date: string
  platform: 'meta' | 'google' | 'tiktok' | 'youtube' | 'other'
  campaign_name: string
  ad_set_name?: string
  impressions: number
  clicks: number
  ctr?: number
  cpc?: number
  cpl?: number
  spend: number
  leads_generated: number
  notes?: string
  created_at: string
  updated_at: string
}

export function useTrafficMetrics(days = 30, platform?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['traffic_metrics', days, platform],
    queryFn: async () => {
      const since = new Date()
      since.setDate(since.getDate() - days)

      let query = supabase
        .from('traffic_metrics')
        .select('*')
        .gte('date', since.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (platform && platform !== 'all') {
        query = query.eq('platform', platform)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as TrafficMetric[]
    },
    enabled: !!user,
  })
}

export function useCreateTrafficMetric() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (values: Omit<TrafficMetric, 'id' | 'manager_id' | 'ctr' | 'cpc' | 'cpl' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('traffic_metrics')
        .insert({ ...values, manager_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['traffic_metrics'] })
      toast.success('Métricas inseridas com sucesso!')
    },
    onError: (err: any) => {
      if (err?.code === '23505') {
        toast.error('Já existe registro para esta data, plataforma e campanha.')
      } else {
        toast.error('Erro ao inserir métricas')
      }
    },
  })
}
