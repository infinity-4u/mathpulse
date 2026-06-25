'use client'

/**
 * Correct-answer feedback band.
 * Never uses badges, streaks, or score language — competence statements only.
 * color.success (green) only. Never amber or red.
 */
interface CorrectBandProps {
  onNext:             () => void
  isLast:             boolean
  consecutiveCorrect: number
  usedHints:          boolean
}

export function competenceMessage(consec: number, usedHints: boolean): string {
  if (usedHints)    return 'You worked that out after a hint — that counts.'
  if (consec >= 4)  return `Your last ${consec} answers have all been correct.`
  if (consec >= 2)  return 'You got this one right first try.'
  return 'Correct — on to the next one.'
}

export function CorrectBand({ onNext, isLast, consecutiveCorrect, usedHints }: CorrectBandProps) {
  const message = competenceMessage(consecutiveCorrect, usedHints)

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Correct"
      className="bg-success-light border-2 border-success rounded-xl p-5 mt-4 flex flex-col gap-4"
    >
      {/* Message row */}
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-2xl text-success leading-snug shrink-0 mt-0.5">✓</span>
        <div>
          <p className="font-medium text-success text-base m-0 leading-snug">{message}</p>
          {isLast && (
            <p className="text-ink-muted text-sm mt-1">That's the last question in this set.</p>
          )}
        </div>
      </div>

      {/* Action */}
      <button
        onClick={onNext}
        autoFocus
        className="w-full bg-success text-white border-0 rounded-lg py-3 px-5 text-base font-semibold cursor-pointer min-h-touch hover:bg-success/90 active:scale-[0.98] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 outline-none"
      >
        {isLast ? 'See results' : 'Next question →'}
      </button>
    </div>
  )
}
