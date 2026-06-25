/**
 * Renders a single question — MC or numeric.
 * All math is pre-rendered KaTeX HTML from the server.
 *
 * questionState drives post-submit lock behaviour:
 *   'idle'            — interactive
 *   'correct'         — chosen option correct-revealed (✓), Check hidden
 *   'incorrect'       — chosen option repair-marked (⟳), Check hidden
 *   'worked-solution' — chosen stays repair-marked, non-chosen options muted, Check hidden
 */
import { cn } from '@/lib/cn'
import { MathText } from '@/components/ui/MathText'
import { MCOption } from './MCOption'
import { NumericInput } from './NumericInput'
import { color } from '@/theme/tokens'
import type { PreRenderedQuestion } from '@/lib/content'

type QuestionState = 'idle' | 'correct' | 'incorrect' | 'worked-solution'

interface QuestionCardProps {
  question:       PreRenderedQuestion
  questionNumber: number
  total:          number
  selectedAnswer: string
  onAnswerChange: (v: string) => void
  onSubmit:       () => void
  submitDisabled: boolean
  questionState?: QuestionState
}

// Derive strand from ACARA code (e.g. AC9M7N01 → 'number')
function strandFromCode(code: string): keyof typeof color.strand | undefined {
  const m = code.match(/AC9M\d+(SP|ST|N|A|M|P)\d+/)
  if (!m) return undefined
  const map: Record<string, keyof typeof color.strand> = {
    N: 'number', A: 'algebra', M: 'measurement',
    SP: 'space', ST: 'statistics', P: 'probability',
  }
  return map[m[1]]
}

// Full literal strings so Tailwind JIT includes all strand colour classes
const STRAND_LABEL: Record<keyof typeof color.strand, string> = {
  number: 'Number', algebra: 'Algebra', measurement: 'Measurement',
  space: 'Space', statistics: 'Statistics', probability: 'Probability',
}
const STRAND_TEXT: Record<keyof typeof color.strand, string> = {
  number:      'text-strand-number',
  algebra:     'text-strand-algebra',
  measurement: 'text-strand-measurement',
  space:       'text-strand-space',
  statistics:  'text-strand-statistics',
  probability: 'text-strand-probability',
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
  const strand   = strandFromCode(question.substrand_code ?? '')
  const isLocked = !!questionState && questionState !== 'idle'
  const showCheck = !isLocked

  function getRevealState(rawValue: string): 'correct' | 'repair' | 'locked' | undefined {
    const chosen = selectedAnswer === rawValue
    if (questionState === 'correct' && chosen)  return 'correct'
    if ((questionState === 'incorrect' || questionState === 'worked-solution') && chosen) return 'repair'
    if (questionState === 'worked-solution' && !chosen) return 'locked'
    return undefined
  }

  return (
    <div className="bg-surface rounded-xl p-6 shadow-raised calm:shadow-card">
      {/* Header — stacked left: strand eyebrow → counter → progress dots */}
      <div className="mb-6">
        {strand && (
          <p className={cn('text-xs font-semibold uppercase tracking-wider mb-0.5', STRAND_TEXT[strand])}>
            {STRAND_LABEL[strand]}
          </p>
        )}
        <p className="text-sm text-ink-muted mb-2">Question {questionNumber} of {total}</p>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-colors duration-300',
                i < questionNumber - 1 ? 'bg-success'
                : i === questionNumber - 1 ? 'bg-primary calm:bg-calm-primary'
                : 'bg-edge'
              )}
            />
          ))}
        </div>
      </div>

      {/* Stem — 20px, generous line-height for readability */}
      <div className="text-xl leading-[1.75] text-ink mb-6 font-normal">
        <MathText html={question.stemHtml} block />
      </div>

      {/* Answer area */}
      {question.type === 'multiple_choice' && question.options ? (
        <div
          className={cn('flex flex-col gap-3 mb-6', isLocked && 'pointer-events-none')}
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
        <div className="mb-6">
          <NumericInput
            value={selectedAnswer}
            onChange={onAnswerChange}
            units={question.answer.type === 'numeric' ? question.answer.units : undefined}
            onEnterSubmit={submitDisabled ? undefined : onSubmit}
          />
        </div>
      )}

      {/* Check button — hidden while submitted to preserve card as anchor */}
      {showCheck && (
        <button
          onClick={onSubmit}
          disabled={submitDisabled || selectedAnswer.trim() === ''}
          className="w-full bg-primary text-white border-0 rounded-xl py-4 text-base font-bold min-h-[48px] transition-all duration-150 calm:transition-none calm:bg-calm-primary outline-none enabled:cursor-pointer enabled:hover:bg-primary-dark calm:enabled:hover:bg-calm-primary/80 enabled:active:scale-[0.98] enabled:focus-visible:ring-2 enabled:focus-visible:ring-primary calm:enabled:focus-visible:ring-calm-primary enabled:focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check answer
        </button>
      )}
    </div>
  )
}
