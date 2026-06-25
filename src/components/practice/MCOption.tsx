/**
 * A single multiple-choice option button.
 * HTML is pre-rendered KaTeX from the server; rawValue is used for answer comparison.
 *
 * revealState post-submit:
 *   'correct' — green bg, ✓ glyph   (student's correct choice)
 *   'repair'  — amber bg, ⟳ glyph   (student's wrong choice)
 *   'locked'  — muted, non-interactive (non-chosen when worked solution shown)
 */
import { cn } from '@/lib/cn'
import { MathText } from '@/components/ui/MathText'

interface MCOptionProps {
  optionHtml:   string
  rawValue:     string
  isSelected:   boolean
  onSelect:     (value: string) => void
  revealState?: 'correct' | 'repair' | 'locked'
}

// Full class strings written as literals so Tailwind JIT includes them
const BTN: Record<string, string> = {
  default:  'bg-surface border-edge-strong text-ink hover:bg-primary-light hover:border-primary cursor-pointer calm:hover:bg-calm-primary/5 calm:hover:border-calm-primary',
  selected: 'bg-primary-light border-primary text-ink cursor-pointer calm:bg-calm-primary/10 calm:border-calm-primary',
  correct:  'bg-success-light border-success text-ink cursor-default',
  repair:   'bg-repair-light border-repair text-ink cursor-default',
  locked:   'bg-surface border-edge text-ink-muted cursor-default pointer-events-none opacity-60',
}

const RADIO_BORDER: Record<string, string> = {
  default:  'border-edge-strong',
  selected: 'border-primary bg-primary calm:border-calm-primary calm:bg-calm-primary',
  correct:  'border-success bg-success',
  repair:   'border-repair bg-repair',
  locked:   'border-edge',
}

export function MCOption({ optionHtml, rawValue, isSelected, onSelect, revealState }: MCOptionProps) {
  const stateKey = revealState ?? (isSelected ? 'selected' : 'default')
  const filled   = stateKey === 'selected' || stateKey === 'correct' || stateKey === 'repair'

  const statusGlyph = revealState === 'correct' ? '✓' : revealState === 'repair' ? '⟳' : null
  const glyphColor  = revealState === 'correct' ? 'text-success' : 'text-repair'

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={!revealState ? () => onSelect(rawValue) : undefined}
      className={cn(
        'flex items-center gap-4 w-full px-4 py-3 rounded-lg border-2 text-left min-h-touch text-base transition-all duration-150 calm:transition-none',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 calm:focus-visible:ring-calm-primary outline-none',
        BTN[stateKey],
      )}
    >
      {/* Radio circle */}
      <span className={cn(
        'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-150',
        RADIO_BORDER[stateKey],
      )}>
        {filled && <span className="w-2 h-2 rounded-full bg-white block" />}
      </span>

      {/* Option content */}
      <span className="flex-1 text-left">
        <MathText html={optionHtml} />
        {revealState === 'correct' && <span className="sr-only">Correct answer</span>}
      </span>

      {/* Status glyph slot — 18px reserved width prevents layout reflow */}
      <span aria-hidden="true" className={cn('shrink-0 w-[18px] text-center text-base font-bold leading-none', glyphColor)}>
        {statusGlyph}
      </span>
    </button>
  )
}
