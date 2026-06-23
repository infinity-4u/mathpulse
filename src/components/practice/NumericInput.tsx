/**
 * Text input for numeric answers.
 * Students type a number; the answer engine in isCorrect() does tolerance checking.
 */
import { color, typography, space, touch } from '@/theme/tokens'

interface NumericInputProps {
  value:            string
  onChange:         (v: string) => void
  units?:           string
  onEnterSubmit?:   () => void
}

export function NumericInput({ value, onChange, units, onEnterSubmit }: NumericInputProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: space[3], marginBottom: space[6] }}>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && onEnterSubmit) {
            e.preventDefault()
            onEnterSubmit()
          }
        }}
        placeholder="Your answer"
        aria-label={units ? `Numeric answer in ${units}` : 'Numeric answer'}
        style={{
          flex:         1,
          padding:      `${space[3]} ${space[4]}`,
          border:       `2px solid ${color.border}`,
          borderRadius: '8px',
          fontSize:     typography.fontSize.xl,
          outline:      'none',
          minHeight:    touch.minSize,
          color:        color.text,
        }}
      />
      {units && (
        <span style={{ fontSize: typography.fontSize.lg, color: color.textMuted, whiteSpace: 'nowrap' }}>
          {units}
        </span>
      )}
    </div>
  )
}
