import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface FeedItem {
  id: string
  text: string
  time: string
  timeRaw: string
  route: string
  userName: string
  userRole?: string
  type: string
}

function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

export function useActivityFeed(limit = 20, offset = 0) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['activity_feed', limit, offset],
    queryFn: async () => {
      const [vendasRes, abordagensRes, closingRes, completionsRes, trafficRes, announcementsRes] = await Promise.all([
        supabase
          .from('vendas')
          .select('id, created_at, valor, produto, user_id, profiles(display_name)')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('abordagens')
          .select('id, created_at, user_id, quantidade, profiles(display_name)')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('closing_forms')
          .select('id, created_at, product, value, status, lead_name, closer_id, profiles!closing_forms_closer_id_fkey(display_name)')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('workboard_completions')
          .select('id, completed_at, user_id, task_id, workboard_tasks(title), profiles!workboard_completions_user_id_fkey(display_name)')
          .order('completed_at', { ascending: false })
          .limit(10),
        supabase
          .from('traffic_metrics')
          .select('id, created_at, manager_id, spend, date, profiles!traffic_metrics_manager_id_fkey(display_name)')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('announcements')
          .select('id, created_at, title, created_by, profiles!announcements_created_by_fkey(display_name)')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const items: FeedItem[] = []

      ;(vendasRes.data || []).forEach((v: any) => {
        const name = v.profiles?.display_name || 'Alguém'
        const val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.valor || 0)
        items.push({
          id: `venda-${v.id}`,
          text: `${name} registrou uma venda de ${val} — ${v.produto || ''}`,
          time: timeAgo(v.created_at),
          timeRaw: v.created_at,
          route: '/vendas',
          userName: name,
          type: 'venda',
        })
      })

      ;(abordagensRes.data || []).forEach((a: any) => {
        const name = a.profiles?.display_name || 'Alguém'
        items.push({
          id: `abordagem-${a.id}`,
          text: `${name} registrou ${a.quantidade || 1} abordagem(ns)`,
          time: timeAgo(a.created_at),
          timeRaw: a.created_at,
          route: '/abordagens',
          userName: name,
          type: 'abordagem',
        })
      })

      ;(closingRes.data || []).forEach((c: any) => {
        const name = (c.profiles as any)?.display_name || 'Alguém'
        const val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.value || 0)
        if (c.status === 'won') {
          items.push({
            id: `closing-${c.id}`,
            text: `${name} fechou negócio: ${c.product} ${val}`,
            time: timeAgo(c.created_at),
            timeRaw: c.created_at,
            route: '/closing',
            userName: name,
            type: 'closing',
          })
        }
      })

      ;(completionsRes.data || []).forEach((c: any) => {
        const name = (c.profiles as any)?.display_name || 'Alguém'
        const taskTitle = (c.workboard_tasks as any)?.title || 'task'
        items.push({
          id: `completion-${c.id}`,
          text: `${name} concluiu task: ${taskTitle}`,
          time: timeAgo(c.completed_at),
          timeRaw: c.completed_at,
          route: '/workboard',
          userName: name,
          type: 'completion',
        })
      })

      ;(trafficRes.data || []).forEach((t: any) => {
        const name = (t.profiles as any)?.display_name || 'Alguém'
        const val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.spend || 0)
        items.push({
          id: `traffic-${t.id}`,
          text: `${name} inseriu métricas de ${t.date} — ${val} investido`,
          time: timeAgo(t.created_at),
          timeRaw: t.created_at,
          route: '/traffic',
          userName: name,
          type: 'traffic',
        })
      })

      ;(announcementsRes.data || []).forEach((a: any) => {
        const name = (a.profiles as any)?.display_name || 'Alguém'
        items.push({
          id: `announcement-${a.id}`,
          text: `${name} publicou um comunicado: ${a.title}`,
          time: timeAgo(a.created_at),
          timeRaw: a.created_at,
          route: '/home',
          userName: name,
          type: 'announcement',
        })
      })

      // Sort by date descending
      items.sort((a, b) => new Date(b.timeRaw).getTime() - new Date(a.timeRaw).getTime())

      return items.slice(offset, offset + limit)
    },
    enabled: !!user,
  })
}
