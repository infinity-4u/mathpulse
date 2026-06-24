/**
 * Displays a hint in the repair flow.
 * Hint text is pre-rendered KaTeX HTML from the server.
 */
import { MathText } from '@/components/ui/MathText'
import { color, typography, space } from '@/theme/tokens'

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
      style={{
        background:   color.repairLight,
        border:       `1px solid ${color.repair}`,
        borderLeft:   `4px solid ${color.repair}`,
        borderRadius: '6px',
        padding:      `${space[3]} ${space[4]}`,
        marginTop:    space[3],
      }}
    >
      {/* Header: numbered badge + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: space[2], marginBottom: space[2] }}>
        <span
          aria-hidden="true"
          style={{
            width:          '20px',
            height:         '20px',
            borderRadius:   '50%',
            background:     color.surface,
            border:         `1px solid ${color.repair}`,
            color:          color.repair,
            fontSize:       '11px',
            fontWeight:     typography.fontWeight.bold,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}
        >
          {hintNumber}
        </span>
        <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: color.repair }}>
          Hint {hintNumber}
        </span>
      </div>

      <MathText html={hintHtml} block />
    </div>
  )
}
