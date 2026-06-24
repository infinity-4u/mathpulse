/**
 * Renders a single question — MC or numeric.
 * All math is pre-rendered HTML (from server-side KaTeX in content.ts).
 *
 * questionState controls post-submit locking:
 *   'idle'            — question is interactive
 *   'correct'         — chosen MC option shows correct-revealed (✓); Check hidden
 *   'incorrect'       — chosen MC option shows repair-marked (⟳); Check hidden
 *   'worked-solution' — chosen option stays repair-marked; others muted; Check hidden
 */
import { MathText } from '@/components/ui/MathText'
import { MCOption } from './MCOption'
import { NumericInput } from './NumericInput'
import { color, typography, space, shadows } from '@/theme/tokens'
import type { PreRenderedQuestion } from '@/lib/content'

type QuestionState = 'idle' | 'correct' | 'incorrect' | 'worked-solution'

interface QuestionCardProps {
  question:        PreRenderedQuestion
  questionNumber:  number
  total:           number
  selectedAnswer:  string
  onAnswerChange:  (v: string) => void
  onSubmit:        () => void
  submitDisabled:  boolean
  questionState?:  QuestionState
}

// Derive strand from ACARA substrand code (e.g. AC9M7N01 → 'number')
function strandFromCode(code: string): keyof typeof color.strand | undefined {
  const m = code.match(/AC9M\d+(SP|ST|N|A|M|P)\d+/)
  if (!m) return undefined
  const map: Record<string, keyof typeof color.strand> = {
    N: 'number', A: 'algebra', M: 'measurement',
    SP: 'space', ST: 'statistics', P: 'probability',
  }
  return map[m[1]]
}

const strandLabel: Record<keyof typeof color.strand, string> = {
  number: 'Number', algebra: 'Algebra', measurement: 'Measurement',
  space: 'Space', statistics: 'Statistics', probability: 'Probability',
}

export function QuestionCard({
  question,
  questionNumber,
  total,
  selectedAnswer,
  onAnswerChange,
  onSubmit,
  submitDisabled,
  questionState,
}: QuestionCardProps) {
  const strand = strandFromCode(question.substrand_code ?? '')
  const isLocked = questionState && questionState !== 'idle'
  const showCheck = !isLocked

  function getRevealState(rawValue: string): 'correct' | 'repair' | 'locked' | undefined {
    const isChosen = selectedAnswer === rawValue
    if (questionState === 'correct' && isChosen) return 'correct'
    if ((questionState === 'incorrect' || questionState === 'worked-solution') && isChosen) return 'repair'
    if (questionState === 'worked-solution' && !isChosen) return 'locked'
    return undefined
  }

  return (
    <div style={{ background: color.surface, borderRadius: '12px', padding: space[6], boxShadow: shadows.raised }}>
      {/* Header: strand eyebrow + counter + dots (all stacked left) */}
      <div style={{ marginBottom: space[5] }}>
        {strand && (
          <p style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: color.strand[strand], margin: 0, marginBottom: space[1] }}>
            {strandLabel[strand]}
          </p>
        )}
        <p style={{ fontSize: typography.fontSize.sm, color: color.textMuted, margin: 0, marginBottom: space[2] }}>
          Question {questionNumber} of {total}
        </p>
        <div style={{ display: 'flex', gap: space[1] }} aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{
                width:        '8px',
                height:       '8px',
                borderRadius: '50%',
                background:   i < questionNumber - 1 ? color.success : i === questionNumber - 1 ? color.primary : color.border,
              }}
            />
          ))}
        </div>
      </div>

      {/* Stem — 20px (xl) for scannability */}
      <div style={{ fontSize: typography.fontSize.xl, lineHeight: typography.lineHeight.loose, color: color.text, marginBottom: space[6] }}>
        <MathText html={question.stemHtml} block />
      </div>

      {/* Answer area */}
      {question.type === 'multiple_choice' && question.options ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: space[3], marginBottom: space[6], pointerEvents: isLocked ? 'none' : 'auto' }}
          aria-disabled={isLocked || undefined}
        >
          {question.options.map((optHtml, i) => {
            const raw = question.rawOptions?.[i] ?? optHtml
            return (
              <MCOption
                key={i}
                optionHtml={optHtml}
                isSelected={selectedAnswer === raw}
                rawValue={raw}
                onSelect={onAnswerChange}
                revealState={getRevealState(raw)}
              />
            )
          })}
        </div>
      ) : (
        <NumericInput
          value={selectedAnswer}
          onChange={onAnswerChange}
          units={question.answer.type === 'numeric' ? question.answer.units : undefined}
          onEnterSubmit={submitDisabled ? undefined : onSubmit}
        />
      )}

      {/* Check button — hidden while submitted to keep the card clean */}
      {showCheck && (
        <button
          onClick={onSubmit}
          disabled={submitDisabled || selectedAnswer.trim() === ''}
          style={{
            width:        '100%',
            background:   color.primary,
            color:        color.surface,
            border:       'none',
            borderRadius: '8px',
            padding:      space[4],
            fontSize:     typography.fontSize.base,
            fontWeight:   typography.fontWeight.bold,
            cursor:       submitDisabled || selectedAnswer.trim() === '' ? 'not-allowed' : 'pointer',
            opacity:      submitDisabled || selectedAnswer.trim() === '' ? 0.5 : 1,
            minHeight:    '48px',
          }}
        >
          Check answer
        </button>
      )}
    </div>
  )
}
