import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { useTeamMessages, useSendMessage, useToggleReaction, TeamMessage } from '@/hooks/useTeamChat'
import { useAuth } from '@/hooks/useAuth'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const REACTIONS = ['👍', '🔥', '✅', '🎉']

function formatMsgTime(iso: string) {
  const d = new Date(iso)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return `ontem ${format(d, 'HH:mm')}`
  return format(d, 'dd/MM HH:mm')
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

interface MessageBubbleProps {
  msg: TeamMessage
  isOwn: boolean
  onReact: (emoji: string) => void
}

function MessageBubble({ msg, isOwn, onReact }: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false)
  const name = msg.profiles?.display_name
  const grouped = (msg.message_reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div
      className={cn('flex gap-2 items-end', isOwn && 'flex-row-reverse')}
      onContextMenu={(e) => { e.preventDefault(); setShowReactions(!showReactions) }}
    >
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-[#1A1A26] border border-white/15 flex items-center justify-center text-[10px] font-bold text-white/70 flex-shrink-0">
          {getInitials(name)}
        </div>
      )}
      <div className="max-w-[75%] space-y-1">
        {!isOwn && (
          <p className="text-[11px] text-white/40 pl-1">{name || '?'}</p>
        )}
        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm',
            isOwn
              ? 'bg-[#6366F1] text-white rounded-br-sm'
              : 'bg-[#1A1A26] border border-white/10 text-white/90 rounded-bl-sm'
          )}
        >
          {msg.link_url ? (
            <a
              href={msg.link_url}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col gap-1"
            >
              <span className="text-xs opacity-70">🔗 {msg.link_title || msg.link_url}</span>
              <span className="text-xs opacity-50 truncate">{msg.link_url}</span>
            </a>
          ) : msg.file_url ? (
            <a href={msg.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2">
              <span>📎</span>
              <span className="text-xs">{msg.file_name}</span>
            </a>
          ) : (
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          )}
        </div>
        {Object.entries(grouped).length > 0 && (
          <div className="flex gap-1 flex-wrap pl-1">
            {Object.entries(grouped).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReact(emoji)}
                className="text-xs bg-white/10 rounded-full px-2 py-0.5 hover:bg-white/20"
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}
        <p className={cn('text-[10px] text-white/30', isOwn && 'text-right')}>
          {formatMsgTime(msg.created_at)}
        </p>
        {showReactions && (
          <div className="flex gap-1 bg-[#1A1A26] border border-white/10 rounded-full px-2 py-1">
            {REACTIONS.map(e => (
              <button
                key={e}
                onClick={() => { onReact(e); setShowReactions(false) }}
                className="hover:scale-125 transition-transform text-base"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function TeamChat() {
  const { user } = useAuth()
  const { data: messages = [], isLoading } = useTeamMessages()
  const sendMessage = useSendMessage()
  const toggleReaction = useToggleReaction()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLenRef = useRef(0)

  useEffect(() => {
    if (messages.length > prevLenRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevLenRef.current = messages.length
  }, [messages.length])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const isLink = trimmed.startsWith('http')
    sendMessage.mutate(isLink ? { link_url: trimmed } : { content: trimmed })
    setText('')
  }

  return (
    <div className="flex flex-col" style={{ height: 360 }}>
      <div className="flex-1 overflow-y-auto space-y-3 px-1 py-2">
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6366F1]" />
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.user_id === user?.id}
            onReact={(emoji) => toggleReaction.mutate({ messageId: msg.id, emoji })}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-white/10 pt-2">
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Mensagem..."
            rows={1}
            className="flex-1 bg-[#1A1A26] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-[#6366F1]"
            style={{ maxHeight: 80 }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="w-9 h-9 rounded-full bg-[#6366F1] disabled:opacity-50 flex items-center justify-center hover:bg-[#4F46E5] transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
