'use client'

/**
 * Displays the worked solution one step at a time.
 * Steps are split on double newlines (\n\n) in the pre-rendered HTML.
 * Each step is revealed by a "Next step →" button appended below the previous.
 */
import { useState } from 'react'
import { MathText } from '@/components/ui/MathText'
import { color, typography, space } from '@/theme/tokens'

interface WorkedSolutionProps {
  solutionHtml: string
  onNext?:      () => void
}

export function splitSteps(solutionHtml: string): string[] {
  return solutionHtml.split('\n\n').filter(s => s.trim())
}

export function WorkedSolution({ solutionHtml, onNext }: WorkedSolutionProps) {
  const steps = splitSteps(solutionHtml)
  const [visibleCount, setVisibleCount] = useState(1)

  const allVisible = visibleCount >= steps.length

  return (
    <div
      role="note"
      aria-label="Worked solution"
      style={{
        background:   '#F0FDF4',
        border:       `1px solid ${color.success}`,
        borderLeft:   `4px solid ${color.success}`,
        borderRadius: '6px',
        padding:      `${space[4]} ${space[5]}`,
        marginTop:    space[4],
      }}
    >
      <h3 style={{
        fontSize:      typography.fontSize.sm,
        fontWeight:    typography.fontWeight.bold,
        color:         color.success,
        marginBottom:  space[3],
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        Worked solution
      </h3>

      <div style={{ color: color.text, lineHeight: typography.lineHeight.loose }}>
        {steps.slice(0, visibleCount).map((step, i) => (
          <div
            key={i}
            style={{
              marginBottom: i < visibleCount - 1 ? space[3] : 0,
              paddingBottom: i < visibleCount - 1 ? space[3] : 0,
              borderBottom: i < visibleCount - 1 ? `1px solid ${color.border}` : 'none',
            }}
          >
            <MathText html={step} block />
          </div>
        ))}
      </div>

      {!allVisible && (
        <button
          onClick={() => setVisibleCount(c => c + 1)}
          aria-label={`Show step ${visibleCount + 1} of ${steps.length}`}
          style={{
            marginTop:    space[4],
            background:   'transparent',
            color:        color.success,
            border:       `1px solid ${color.success}`,
            borderRadius: '6px',
            padding:      `${space[2]} ${space[5]}`,
            fontSize:     typography.fontSize.base,
            fontWeight:   typography.fontWeight.medium,
            cursor:       'pointer',
            minHeight:    '40px',
          }}
        >
          Next step →
        </button>
      )}

      {allVisible && onNext && (
        <button
          onClick={onNext}
          style={{
            marginTop:    space[5],
            background:   color.primary,
            color:        '#fff',
            border:       'none',
            borderRadius: '6px',
            padding:      `${space[3]} ${space[6]}`,
            fontSize:     typography.fontSize.base,
            fontWeight:   typography.fontWeight.medium,
            cursor:       'pointer',
            minHeight:    '44px',
          }}
        >
          Next question →
        </button>
      )}
    </div>
  )
}
