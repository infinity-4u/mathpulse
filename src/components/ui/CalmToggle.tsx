'use client'

import { useCalm } from '@/contexts/CalmModeContext'
import { cn } from '@/lib/cn'

export function CalmToggle() {
  const { isCalm, toggleCalm } = useCalm()

  return (
    <button
      type="button"
      onClick={toggleCalm}
      aria-pressed={isCalm}
      title={isCalm ? 'Switch to standard mode' : 'Switch to calm mode'}
      className={cn(
        'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 min-h-touch',
        isCalm
          ? 'bg-calm-primary/10 border-calm-primary text-calm-primary focus-visible:ring-calm-primary'
          : 'bg-transparent border-edge text-ink-muted hover:border-edge-strong hover:text-ink focus-visible:ring-primary',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'w-2 h-2 rounded-full shrink-0',
          isCalm ? 'bg-calm-primary' : 'bg-edge-strong',
        )}
      />
      Calm
    </button>
  )
}
