import { useNavigate } from 'react-router-dom'
import { FeedItem } from '@/hooks/useActivityFeed'

const typeIcon: Record<string, string> = {
  venda: '💰',
  abordagem: '📞',
  closing: '🏆',
  completion: '✅',
  traffic: '📊',
  announcement: '📌',
}

interface ActivityFeedProps {
  items: FeedItem[]
  onLoadMore?: () => void
  hasMore?: boolean
}

export function ActivityFeed({ items, onLoadMore, hasMore }: ActivityFeedProps) {
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 gap-2 text-center">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-30">
          <circle cx="24" cy="24" r="20" stroke="#94A3B8" strokeWidth="2"/>
          <path d="M16 24h16M24 16v16" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p className="text-[15px] text-white/40">Nenhuma atividade ainda</p>
        <p className="text-[13px] text-white/25">As ações do time aparecerão aqui</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => navigate(item.route)}
          className="w-full flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-left transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#1A1A26] border border-white/10 flex items-center justify-center flex-shrink-0 text-sm">
            {typeIcon[item.type] || '📋'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/80 leading-snug">{item.text}</p>
            <p className="text-xs text-white/30 mt-0.5">{item.time}</p>
          </div>
        </button>
      ))}
      {hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-3 text-sm text-[#6366F1] hover:underline"
        >
          Ver mais
        </button>
      )}
    </div>
  )
}
