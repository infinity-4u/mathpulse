/**
 * Renders a single question — MC or numeric.
 * All math is pre-rendered HTML (from server-side KaTeX in content.ts).
 */
import { MathText } from '@/components/ui/MathText'
import { MCOption } from './MCOption'
import { NumericInput } from './NumericInput'
import { color, typography, space } from '@/theme/tokens'
import type { PreRenderedQuestion } from '@/lib/content'

interface QuestionCardProps {
  question: PreRenderedQuestion
  questionNumber: number
  total: number
  selectedAnswer: string
  onAnswerChange: (v: string) => void
  onSubmit: () => void
  submitDisabled: boolean
}

export function QuestionCard({
  question,
  questionNumber,
  total,
  selectedAnswer,
  onAnswerChange,
  onSubmit,
  submitDisabled,
}: QuestionCardProps) {
  return (
    <div style={{ background: color.surface, borderRadius: '12px', padding: space[6], boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      {/* Question counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[5] }}>
        <span style={{ fontSize: typography.fontSize.sm, color: color.textMuted }}>
          Question {questionNumber} of {total}
        </span>
        <div style={{ display: 'flex', gap: space[1] }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: i < questionNumber - 1 ? color.success : i === questionNumber - 1 ? color.primary : color.border,
              }}
            />
          ))}
        </div>
      </div>

      {/* Stem */}
      <div style={{ fontSize: typography.fontSize.lg, lineHeight: typography.lineHeight.loose, color: color.text, marginBottom: space[6] }}>
        <MathText html={question.stemHtml} block />
      </div>

      {/* Answer area */}
      {question.type === 'multiple_choice' && question.options ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: space[3], marginBottom: space[6] }}>
          {question.options.map((optHtml, i) => {
            const raw = question.rawOptions?.[i] ?? optHtml
            return (
              <MCOption
                key={i}
                optionHtml={optHtml}
                isSelected={selectedAnswer === raw}
                rawValue={raw}
                onSelect={onAnswerChange}
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

      <button
        onClick={onSubmit}
        disabled={submitDisabled || selectedAnswer.trim() === ''}
        style={{
          width: '100%',
          background: color.primary,
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: space[4],
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.bold,
          cursor: submitDisabled || selectedAnswer.trim() === '' ? 'not-allowed' : 'pointer',
          opacity: submitDisabled || selectedAnswer.trim() === '' ? 0.5 : 1,
          minHeight: '48px',
        }}
      >
        Check answer
      </button>
    </div>
  )
}
