import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FABProps {
  onClick: () => void
  children?: ReactNode
  className?: string
  label?: string
}

export function FAB({ onClick, children, className, label }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'fixed bottom-[88px] right-5 z-50',
        'w-13 h-13 rounded-full',
        'bg-[#6366F1] hover:bg-[#4F46E5] active:scale-95',
        'flex items-center justify-center',
        'shadow-lg shadow-indigo-500/30',
        'transition-all duration-200',
        className
      )}
      style={{ width: 52, height: 52 }}
    >
      {children}
    </button>
  )
}
