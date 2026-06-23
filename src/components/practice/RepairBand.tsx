'use client'

/**
 * Wrong-answer feedback band.
 * CONTRACT.md §4: uses color.repair (amber) NEVER color.error (red).
 * Never uses words like "wrong", "incorrect", "mistake", or "failed".
 *
 * Two modes:
 *   - CE matched: shows a conversational framing line + contextual hint from JSON
 *   - No CE match: shows default hint[0] directly with no framing
 */
import { MathText } from '@/components/ui/MathText'
import { color, typography, space } from '@/theme/tokens'
import type { CommonError } from '@/lib/repair'

interface RepairBandProps {
  matchedError:            (CommonError & { contextualHintHtml: string }) | null
  initialHintHtml:         string | null   // hints.default[0] shown inline when no CE match
  onRetry:                 () => void
  hintsExhausted:          boolean
  onRequestHint:           () => void
  onRequestWorkedSolution: () => void
  workedSolutionShown:     boolean
  attemptCount:            number          // wrong submissions; worked solution unlocks at 3
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
      style={{
        background:   color.repairLight,
        border:       `2px solid ${color.repair}`,
        borderRadius: '12px',
        padding:      space[5],
        marginTop:    space[4],
      }}
    >
      {/* Two-mode content */}
      {matchedError ? (
        <div style={{ marginBottom: space[4] }}>
          <p style={{ fontWeight: typography.fontWeight.medium, color: color.repair, marginBottom: space[2], fontSize: typography.fontSize.base }}>
            {framingLine(matchedError)}
          </p>
          <div style={{ color: color.text, lineHeight: typography.lineHeight.base }}>
            <MathText html={matchedError.contextualHintHtml} block />
          </div>
        </div>
      ) : initialHintHtml ? (
        <div style={{ marginBottom: space[4] }}>
          <div style={{ color: color.text, lineHeight: typography.lineHeight.base }}>
            <MathText html={initialHintHtml} block />
          </div>
        </div>
      ) : (
        <p style={{ fontWeight: typography.fontWeight.medium, color: color.repair, marginBottom: space[4], fontSize: typography.fontSize.base }}>
          Have another look — let's work through this together.
        </p>
      )}

      {/* Action buttons */}
      {!workedSolutionShown && (
        <div style={{ display: 'flex', gap: space[3], flexWrap: 'wrap' }}>
          <button onClick={onRetry} style={secondaryBtn}>
            Try again
          </button>

          {!workedSolutionReady && (
            <button onClick={onRequestHint} disabled={hintsExhausted} style={secondaryBtn}>
              Show next hint
            </button>
          )}

          {workedSolutionReady && (
            <button onClick={onRequestWorkedSolution} style={primaryBtn}>
              Show worked solution
            </button>
          )}
        </div>
      )}

      {workedSolutionShown && onNext && (
        <button onClick={onNext} style={primaryBtn}>
          Next question →
        </button>
      )}
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  background:   color.repair,
  color:        '#fff',
  border:       'none',
  borderRadius: '6px',
  padding:      `${space[2]} ${space[5]}`,
  fontSize:     typography.fontSize.base,
  fontWeight:   typography.fontWeight.medium,
  cursor:       'pointer',
  minHeight:    '40px',
}

const secondaryBtn: React.CSSProperties = {
  background:   'transparent',
  color:        color.repair,
  border:       `1px solid ${color.repair}`,
  borderRadius: '6px',
  padding:      `${space[2]} ${space[5]}`,
  fontSize:     typography.fontSize.base,
  fontWeight:   typography.fontWeight.medium,
  cursor:       'pointer',
  minHeight:    '40px',
}
