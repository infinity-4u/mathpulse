'use client'

/**
 * Wrong-answer feedback band.
 * CONTRACT.md: color.repair (amber) ONLY — never color.error (red) for wrong answers.
 * Never "wrong", "incorrect", "mistake", "failed" in student-facing copy.
 *
 * Modes:
 *   1. CE matched   — ⟳ glyph + framing line + contextual hint
 *   2. No CE, hint  — default hint[0] inline (no glyph — hint leads)
 *   3. No CE, blank — ⟳ glyph + generic framing line
 */
import { MathText } from '@/components/ui/MathText'
import type { CommonError } from '@/lib/repair'

interface RepairBandProps {
  matchedError:            (CommonError & { contextualHintHtml: string }) | null
  initialHintHtml:         string | null
  onRetry:                 () => void
  hintsExhausted:          boolean
  onRequestHint:           () => void
  onRequestWorkedSolution: () => void
  workedSolutionShown:     boolean
  attemptCount:            number
  onNext?:                 () => void
}

export function framingLine(error: CommonError): string {
  switch (error.type) {
    case 'conceptual':
      return "It looks like there's a concept here worth sitting with — this kind of confusion is very common."
    case 'procedural':
      return "It looks like a step in the process caught you out — let's see what to focus on."
    case 'careless':
      return "Looks like a small slip — these are easy to catch once you know what to look for."
    default:
      return "This is a very common place to get tripped up — here's what to focus on."
  }
}

const primaryBtn = 'bg-repair text-white border-0 rounded-lg px-5 py-2.5 text-base font-semibold cursor-pointer min-h-touch hover:bg-repair/90 active:scale-[0.98] transition-all duration-150 calm:transition-none focus-visible:ring-2 focus-visible:ring-repair focus-visible:ring-offset-1 outline-none'
const secondaryBtn = 'bg-transparent text-repair border border-repair rounded-lg px-5 py-2.5 text-base font-semibold cursor-pointer min-h-touch hover:bg-repair-light active:scale-[0.98] transition-all duration-150 calm:transition-none focus-visible:ring-2 focus-visible:ring-repair focus-visible:ring-offset-1 outline-none disabled:opacity-50 disabled:cursor-not-allowed'

export function RepairBand({
  matchedError,
  initialHintHtml,
  onRetry,
  hintsExhausted,
  onRequestHint,
  onRequestWorkedSolution,
  workedSolutionShown,
  attemptCount,
  onNext,
}: RepairBandProps) {
  const workedSolutionReady = hintsExhausted || attemptCount >= 3

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Let's work through this"
      className="bg-repair-light border-2 border-repair rounded-xl p-5 mt-4"
    >
      {/* Mode 1: CE matched — glyph + framing + contextual hint */}
      {matchedError && (
        <div className="mb-4">
          <div className="flex items-start gap-3 mb-2">
            <span aria-hidden="true" className="text-2xl text-repair leading-snug shrink-0 mt-0.5">⟳</span>
            <p className="font-semibold text-repair text-base m-0 leading-snug">{framingLine(matchedError)}</p>
          </div>
          <div className="text-ink leading-normal ml-9">
            <MathText html={matchedError.contextualHintHtml} block />
          </div>
        </div>
      )}

      {/* Mode 2: No CE, default hint inline */}
      {!matchedError && initialHintHtml && (
        <div className="text-ink leading-normal mb-4">
          <MathText html={initialHintHtml} block />
        </div>
      )}

      {/* Mode 3: No CE, no hint — glyph + generic framing */}
      {!matchedError && !initialHintHtml && (
        <div className="flex items-start gap-3 mb-4">
          <span aria-hidden="true" className="text-2xl text-repair leading-snug shrink-0 mt-0.5">⟳</span>
          <p className="font-semibold text-repair text-base m-0 leading-snug">
            Have another look — let's work through this together.
          </p>
        </div>
      )}

      {/* Action buttons */}
      {!workedSolutionShown && (
        <div className="flex gap-3 flex-wrap">
          <button onClick={onRetry} className={secondaryBtn}>Try again</button>

          {!workedSolutionReady && (
            <button onClick={onRequestHint} disabled={hintsExhausted} className={secondaryBtn}>
              Show next hint →
            </button>
          )}

          {workedSolutionReady && (
            <button onClick={onRequestWorkedSolution} className={primaryBtn}>
              Show worked solution
            </button>
          )}
        </div>
      )}

      {workedSolutionShown && onNext && (
        <button onClick={onNext} className={primaryBtn}>Next question →</button>
      )}
    </div>
  )
}
