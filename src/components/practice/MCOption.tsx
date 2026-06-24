/**
 * A single multiple-choice option button.
 * The displayed HTML is pre-rendered KaTeX; the raw value is used for answer comparison.
 *
 * revealState controls post-submit visual:
 *   'correct' — successLight bg, ✓ glyph (chosen option was right)
 *   'repair'  — repairLight bg, ⟳ glyph  (chosen option was wrong)
 *   'locked'  — textMuted, pointer-events:none (non-chosen when worked solution shown)
 *   undefined — default interactive state
 */
import { MathText } from '@/components/ui/MathText'
import { color, typography, space, touch } from '@/theme/tokens'

interface MCOptionProps {
  optionHtml:   string
  rawValue:     string
  isSelected:   boolean
  onSelect:     (value: string) => void
  revealState?: 'correct' | 'repair' | 'locked'
}

export function MCOption({ optionHtml, rawValue, isSelected, onSelect, revealState }: MCOptionProps) {
  const isInteractive = !revealState

  const bg = revealState === 'correct' ? color.successLight
           : revealState === 'repair'  ? color.repairLight
           : isSelected                ? color.primaryLight
           :                            color.surface

  const borderColor = revealState === 'correct' ? color.success
                    : revealState === 'repair'  ? color.repair
                    : revealState === 'locked'  ? color.border
                    : isSelected                ? color.primary
                    :                            color.borderStrong

  const radioFill = revealState === 'correct' ? color.success
                  : revealState === 'repair'  ? color.repair
                  : isSelected                ? color.primary
                  :                            undefined

  const showInnerDot = !!radioFill

  const statusGlyph = revealState === 'correct' ? '✓' : revealState === 'repair' ? '⟳' : null
  const statusColor = revealState === 'correct' ? color.success : color.repair

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={isInteractive ? () => onSelect(rawValue) : undefined}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           space[4],
        width:         '100%',
        padding:       `${space[3]} ${space[4]}`,
        background:    bg,
        border:        `2px solid ${borderColor}`,
        borderRadius:  '8px',
        cursor:        isInteractive ? 'pointer' : 'default',
        textAlign:     'left',
        minHeight:     touch.minSize,
        fontSize:      typography.fontSize.base,
        color:         revealState === 'locked' ? color.textMuted : color.text,
        pointerEvents: revealState === 'locked' ? 'none' : 'auto',
      }}
    >
      {/* Radio glyph */}
      <span style={{
        flexShrink:     0,
        width:          '20px',
        height:         '20px',
        borderRadius:   '50%',
        border:         `2px solid ${borderColor}`,
        background:     radioFill ?? 'transparent',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        {showInnerDot && (
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color.surface, display: 'block' }} />
        )}
      </span>

      {/* Option content */}
      <span style={{ flex: 1 }}>
        <MathText html={optionHtml} />
        {revealState === 'correct' && (
          <span style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
            Correct answer
          </span>
        )}
      </span>

      {/* Status slot — 18px reserved so glyphs never reflow the row */}
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width:      '18px',
          textAlign:  'center',
          fontSize:   '16px',
          color:      statusColor,
          fontWeight: typography.fontWeight.bold,
          lineHeight: '1',
        }}
      >
        {statusGlyph}
      </span>
    </button>
  )
}
