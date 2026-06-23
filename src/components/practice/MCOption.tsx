/**
 * A single multiple-choice option button.
 * The displayed HTML is pre-rendered KaTeX; the raw value is used for answer comparison.
 */
import { MathText } from '@/components/ui/MathText'
import { color, typography, space, touch } from '@/theme/tokens'

interface MCOptionProps {
  optionHtml: string  // pre-rendered HTML for display
  rawValue:   string  // raw string for answer comparison
  isSelected: boolean
  onSelect:   (value: string) => void
}

export function MCOption({ optionHtml, rawValue, isSelected, onSelect }: MCOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => onSelect(rawValue)}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           space[4],
        width:         '100%',
        padding:       `${space[3]} ${space[4]}`,
        background:    isSelected ? '#EFF6FF' : color.surface,
        border:        `2px solid ${isSelected ? color.primary : color.border}`,
        borderRadius:  '8px',
        cursor:        'pointer',
        textAlign:     'left',
        minHeight:     touch.minSize,
        fontSize:      typography.fontSize.base,
        color:         color.text,
        transition:    'border-color 0.1s, background 0.1s',
      }}
    >
      <span style={{
        flexShrink:   0,
        width:        '20px',
        height:       '20px',
        borderRadius: '50%',
        border:       `2px solid ${isSelected ? color.primary : color.border}`,
        background:   isSelected ? color.primary : 'transparent',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
      }}>
        {isSelected && (
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', display: 'block' }} />
        )}
      </span>
      <MathText html={optionHtml} />
    </button>
  )
}
