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
        background:   '#FFF7ED',
        border:       `1px solid ${color.repair}`,
        borderLeft:   `4px solid ${color.repair}`,
        borderRadius: '6px',
        padding:      `${space[3]} ${space[4]}`,
        marginTop:    space[3],
      }}
    >
      <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: color.repair, display: 'block', marginBottom: space[2] }}>
        Hint {hintNumber}
      </span>
      <MathText html={hintHtml} block />
    </div>
  )
}
