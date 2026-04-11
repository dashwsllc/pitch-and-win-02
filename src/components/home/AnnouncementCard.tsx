import { useState } from 'react'
import { Announcement } from '@/hooks/useHome'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AnnouncementCardProps {
  announcement: Announcement
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false)
  const lines = announcement.content.split('\n')
  const preview = lines.slice(0, 3).join('\n')
  const hasMore = lines.length > 3

  return (
    <div className="rounded-xl border-l-[3px] border-l-[#6366F1] border border-white/10 bg-[#1A1A26] p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-base">📌</span>
        <p className="text-sm font-semibold text-white">{announcement.title}</p>
      </div>
      <p className="text-sm text-white/70 whitespace-pre-wrap">
        {expanded ? announcement.content : preview}
      </p>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[#6366F1] hover:underline"
        >
          {expanded ? 'Ver menos' : 'Ver mais'}
        </button>
      )}
      <p className="text-xs text-white/40">
        {announcement.profiles?.display_name || 'Executive'} · há{' '}
        {formatDistanceToNow(new Date(announcement.created_at), { locale: ptBR })}
      </p>
    </div>
  )
}
