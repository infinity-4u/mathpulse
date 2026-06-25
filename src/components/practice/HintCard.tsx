/**
 * Single hint card in the repair flow.
 * Hint text is pre-rendered KaTeX HTML from the server.
 */
import { MathText } from '@/components/ui/MathText'

interface HintCardProps {
  hintHtml:   string
  hintNumber: number
  totalHints: 3
}

export function HintCard({ hintHtml, hintNumber }: HintCardProps) {
  return (
    <div
      role="note"
      aria-label={`Hint ${hintNumber}`}
      className="bg-repair-light border border-repair border-l-4 rounded-md px-4 py-3 mt-3"
    >
      {/* Header: numbered badge + label */}
      <div className="flex items-center gap-2 mb-2">
        <span
          aria-hidden="true"
          className="shrink-0 w-5 h-5 rounded-full bg-surface border border-repair text-repair text-[11px] font-bold flex items-center justify-center leading-none"
        >
          {hintNumber}
        </span>
        <span className="text-sm font-medium text-repair">Hint {hintNumber}</span>
      </div>

      <div className="text-ink leading-normal text-base">
        <MathText html={hintHtml} block />
      </div>
    </div>
  )
}
