'use client'

/**
 * Correct-answer feedback band.
 * Shows a competence-trajectory statement, never a score/badge/star.
 * Uses color.success (green). Never red or amber.
 */
import { color, typography, space, touch } from '@/theme/tokens'

interface CorrectBandProps {
  onNext:             () => void
  isLast:             boolean
  consecutiveCorrect: number
  usedHints:          boolean
}

export function competenceMessage(consec: number, usedHints: boolean): string {
  if (usedHints) return 'You worked that out after a hint — that counts.'
  if (consec >= 4) return `Your last ${consec} answers have all been correct.`
  if (consec >= 2) return 'You got this one right first try.'
  return 'Correct — on to the next one.'
}

export function CorrectBand({ onNext, isLast, consecutiveCorrect, usedHints }: CorrectBandProps) {
  const message = competenceMessage(consecutiveCorrect, usedHints)

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Correct"
      style={{
        background:   color.successLight,
        border:       `2px solid ${color.success}`,
        borderRadius: '12px',
        padding:      space[5],
        marginTop:    space[4],
        display:      'flex',
        flexDirection: 'column',
        gap:          space[4],
      }}
    >
      {/* Message row: ✓ glyph + text */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: space[3] }}>
        <span aria-hidden="true" style={{ fontSize: '24px', color: color.success, lineHeight: '1.3', flexShrink: 0 }}>✓</span>
        <div>
          <p style={{
            fontWeight: typography.fontWeight.medium,
            color:      color.success,
            margin:     0,
            fontSize:   typography.fontSize.base,
          }}>
            {message}
          </p>
          {isLast && (
            <p style={{ color: color.textMuted, margin: `${space[1]} 0 0`, fontSize: typography.fontSize.sm }}>
              That's the last question in this set.
            </p>
          )}
        </div>
      </div>

      {/* Action button — full width */}
      <button
        onClick={onNext}
        autoFocus
        style={{
          width:        '100%',
          background:   color.success,
          color:        color.surface,
          border:       'none',
          borderRadius: '6px',
          padding:      `${space[2]} ${space[5]}`,
          fontSize:     typography.fontSize.base,
          fontWeight:   typography.fontWeight.medium,
          cursor:       'pointer',
          minHeight:    touch.minSize,
        }}
      >
        {isLast ? 'See results' : 'Next question →'}
      </button>
    </div>
  )
}
