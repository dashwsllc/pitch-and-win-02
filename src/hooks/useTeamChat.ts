import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useEffect } from 'react'
import { toast } from 'sonner'

export interface TeamMessage {
  id: string
  user_id: string
  content?: string
  file_url?: string
  file_name?: string
  file_type?: string
  link_url?: string
  link_title?: string
  created_at: string
  profiles?: { display_name: string | null }
  message_reactions?: { emoji: string; user_id: string }[]
}

export function useTeamMessages() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['team_messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_messages')
        .select('*, profiles(display_name), message_reactions(emoji, user_id)')
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) throw error
      return (data || []) as TeamMessage[]
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('team-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_messages' }, () => {
        qc.invalidateQueries({ queryKey: ['team_messages'] })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' }, () => {
        qc.invalidateQueries({ queryKey: ['team_messages'] })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' }, () => {
        qc.invalidateQueries({ queryKey: ['team_messages'] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, qc])

  return query
}

export function useSendMessage() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (values: {
      content?: string
      file_url?: string
      file_name?: string
      file_type?: string
      link_url?: string
      link_title?: string
    }) => {
      const { error } = await supabase
        .from('team_messages')
        .insert({ ...values, user_id: user!.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team_messages'] }),
    onError: () => toast.error('Erro ao enviar mensagem'),
  })
}

export function useToggleReaction() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      // Check if reaction exists
      const { data } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user!.id)
        .eq('emoji', emoji)
        .single()

      if (data) {
        await supabase.from('message_reactions').delete().eq('id', data.id)
      } else {
        await supabase.from('message_reactions').insert({ message_id: messageId, user_id: user!.id, emoji })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team_messages'] }),
  })
}
