'use client'

/**
 * Self-contained practice session for teacher/dev testing.
 * No auth context, no DB writes, no Supabase dependency.
 * SpacedRetrievalBand is omitted (requires a student JWT).
 * Used by /test/session/[substrand] — never linked from student-facing routes.
 */
import { useState, useCallback } from 'react'
import { isCorrect } from '@/lib/answer'
import { detectError, nextRepairStep, initialRepairState, type RepairState, type CommonError } from '@/lib/repair'
import { QuestionCard } from './QuestionCard'
import { CorrectBand } from './CorrectBand'
import { RepairBand } from './RepairBand'
import { HintCard } from './HintCard'
import { WorkedSolution } from './WorkedSolution'
import { cn } from '@/lib/cn'
import type { PreRenderedQuestion } from '@/lib/content'

type QuestionState = 'idle' | 'correct' | 'incorrect'

interface DevPracticeSessionProps {
  questions:     PreRenderedQuestion[]
  substrandCode: string
}

export function DevPracticeSession({ questions, substrandCode }: DevPracticeSessionProps) {
  const [qIndex, setQIndex]             = useState(0)
  const [state, setState]               = useState<QuestionState>('idle')
  const [answer, setAnswer]             = useState('')
  const [repairState, setRepairState]   = useState<RepairState>(initialRepairState())
  const [attemptCount, setAttemptCount] = useState(0)
  const [shownHints, setShownHints]     = useState<Array<{ html: string; number: number }>>([])
  const [workedSolutionHtml, setWorked] = useState<string | null>(null)
  const [consecutiveCorrect, setCC]     = useState(0)
  const [correct, setCorrect]           = useState(0)
  const [attempted, setAttempted]       = useState(0)
  const [finished, setFinished]         = useState(false)

  const question = questions[qIndex]

  const handleSubmit = useCallback(() => {
    if (!question || state !== 'idle') return

    const ok = isCorrect(answer, question.answer)
    setAttempted(n => n + 1)

    if (ok) {
      setCorrect(n => n + 1)
      setCC(n => n + 1)
      setState('correct')
    } else {
      setAttemptCount(n => n + 1)
      const matched = detectError(
        {
          id:              question.id,
          type:            question.type,
          answer:          question.answer,
          hints:           { default: ['', '', ''] as [string, string, string] },
          worked_solution: '',
          common_errors:   question.common_errors,
          difficulty:      question.difficulty,
          substrand_code:  question.substrand_code,
        },
        answer,
      )
      setRepairState({
        ...initialRepairState(),
        matchedErrorId: matched?.id ?? null,
        hintsUsed:      matched ? 0 : 1,  // no-match: default[0] shown inline
      })
      setState('incorrect')
    }
  }, [question, state, answer])

  const handleRetry = useCallback(() => { setState('idle') }, [])

  const handleWorkedSolution = useCallback(() => {
    if (!question) return
    setWorked(question.workedSolutionHtml)
    setRepairState(prev => ({ ...prev, workedSolutionUnlocked: true }))
  }, [question])

  const handleHintRequest = useCallback(() => {
    if (!question) return
    const step = nextRepairStep(
      {
        id:             question.id,
        type:           question.type,
        answer:         question.answer,
        hints:          { default: question.hintsHtml as [string, string, string] },
        worked_solution: question.workedSolutionHtml,
        common_errors:  question.common_errors?.map(ce => ({
          ...ce,
          contextual_hint: ce.contextualHintHtml,
        })),
        difficulty:     question.difficulty,
        substrand_code: question.substrand_code,
      },
      repairState,
    )
    if (step.kind === 'hint') {
      setShownHints(prev => [...prev, { html: step.text, number: prev.length + 1 }])
      if (repairState.matchedErrorId) {
        setRepairState(prev => ({ ...prev, repairPathIndex: prev.repairPathIndex + 1 }))
      } else {
        setRepairState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }))
      }
    } else {
      handleWorkedSolution()
    }
  }, [question, repairState, handleWorkedSolution])

  const handleNext = useCallback(() => {
    if (state === 'incorrect') setCC(0)
    const next = qIndex + 1
    if (next >= questions.length) { setFinished(true); return }
    setQIndex(next)
    setState('idle')
    setAnswer('')
    setRepairState(initialRepairState())
    setAttemptCount(0)
    setShownHints([])
    setWorked(null)
  }, [qIndex, questions.length, state])

  if (finished) {
    const pct = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
    return (
      <div className="max-w-[480px] mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-ink mb-3">Session complete</h1>
        <p className={cn('text-2xl font-bold mb-2', pct >= 80 ? 'text-success' : 'text-repair')}>
          {correct}/{attempted} correct ({pct}%)
        </p>
        <p className="text-ink-muted mb-8">{substrandCode}</p>
        <a href="/test" className="inline-block bg-primary text-white no-underline rounded-xl px-8 py-3 text-base font-semibold hover:bg-primary-dark transition-colors">
          ← Back to topics
        </a>
      </div>
    )
  }

  if (!question) return null

  const hintsExhausted = repairState.workedSolutionUnlocked || (() => {
    if (repairState.matchedErrorId && question) {
      const ce = question.common_errors?.find(e => e.id === repairState.matchedErrorId)
      return !ce || repairState.repairPathIndex >= ce.repair_path.length
    }
    return repairState.hintsUsed >= 3
  })()

  const matchedCE = state === 'incorrect' && repairState.matchedErrorId
    ? question.common_errors?.find((e: CommonError & { contextualHintHtml: string }) => e.id === repairState.matchedErrorId) ?? null
    : null

  const initialHintHtml = (state === 'incorrect' && !repairState.matchedErrorId)
    ? question.hintsHtml[0]
    : null

  return (
    <div className="max-w-[600px] mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-5">
        <a href="/test" className="text-ink-muted text-sm no-underline hover:text-ink transition-colors">← Back</a>
        <span className="font-mono text-sm text-ink-muted">{substrandCode}</span>
      </div>

      <QuestionCard
        question={question}
        questionNumber={qIndex + 1}
        total={questions.length}
        selectedAnswer={answer}
        onAnswerChange={setAnswer}
        onSubmit={handleSubmit}
        submitDisabled={state !== 'idle'}
        questionState={
          state === 'correct' ? 'correct'
          : state === 'incorrect' && workedSolutionHtml !== null ? 'worked-solution'
          : state === 'incorrect' ? 'incorrect'
          : 'idle'
        }
      />

      {state === 'correct' && (
        <CorrectBand
          onNext={handleNext}
          isLast={qIndex === questions.length - 1}
          consecutiveCorrect={consecutiveCorrect}
          usedHints={shownHints.length > 0}
        />
      )}

      {state === 'incorrect' && (
        <>
          <RepairBand
            matchedError={matchedCE}
            initialHintHtml={initialHintHtml}
            onRetry={handleRetry}
            hintsExhausted={hintsExhausted}
            onRequestHint={handleHintRequest}
            onRequestWorkedSolution={handleWorkedSolution}
            workedSolutionShown={workedSolutionHtml !== null}
            attemptCount={attemptCount}
            onNext={workedSolutionHtml !== null ? handleNext : undefined}
          />

          {shownHints.map(h => (
            <HintCard key={h.number} hintHtml={h.html} hintNumber={h.number} totalHints={3} />
          ))}

          {workedSolutionHtml !== null && (
            <WorkedSolution solutionHtml={workedSolutionHtml} onNext={handleNext} />
          )}
        </>
      )}
    </div>
  )
}
