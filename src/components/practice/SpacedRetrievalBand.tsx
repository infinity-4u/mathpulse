'use client'

/**
 * SpacedRetrievalBand — fires once per session after the 5th question.
 *
 * On mount: fetches /api/progress/spaced to find a substrand the student recently
 * struggled with. If found, shows 2 questions from that substrand before resuming
 * the main session. If not found (no prior failures in other substrands), skips
 * immediately via onSkip.
 *
 * CONTRACT.md: no LLM calls. Questions come from verified static JSON only.
 */
import { useState, useEffect, useCallback } from 'react'
import { isCorrect } from '@/lib/answer'
import { detectError, nextRepairStep, initialRepairState, type RepairState, type CommonError } from '@/lib/repair'
import { QuestionCard } from './QuestionCard'
import { CorrectBand } from './CorrectBand'
import { RepairBand } from './RepairBand'
import { HintCard } from './HintCard'
import { WorkedSolution } from './WorkedSolution'
import { color, typography, space } from '@/theme/tokens'
import type { PreRenderedQuestion } from '@/lib/content'
import type { SpacedResponse } from '@/app/api/progress/spaced/route'

type BandState = 'loading' | 'skipped' | 'question'

interface SpacedRetrievalBandProps {
  studentToken:       string
  currentSubstrand:   string
  onComplete:         () => void
  onSkip:             () => void
}

type QuestionState = 'idle' | 'correct' | 'incorrect'

export function SpacedRetrievalBand({
  studentToken,
  currentSubstrand,
  onComplete,
  onSkip,
}: SpacedRetrievalBandProps) {
  const [bandState, setBandState] = useState<BandState>('loading')
  const [questions, setQuestions] = useState<PreRenderedQuestion[]>([])
  const [substrandCode, setSubstrandCode] = useState('')
  const [qIndex, setQIndex] = useState(0)
  const [qState, setQState] = useState<QuestionState>('idle')
  const [answer, setAnswer] = useState('')
  const [repairState, setRepairState] = useState<RepairState>(initialRepairState())
  const [attemptCount, setAttemptCount] = useState(0)
  const [shownHints, setShownHints] = useState<Array<{ html: string; number: number }>>([])
  const [workedSolutionHtml, setWorkedSolutionHtml] = useState<string | null>(null)
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0)

  // Fetch spaced candidates on mount
  useEffect(() => {
    fetch(`/api/progress/spaced?current=${encodeURIComponent(currentSubstrand)}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    })
      .then(async r => {
        if (r.status === 204 || !r.ok) { onSkip(); return }
        const data = await r.json() as SpacedResponse
        if (!data?.questions?.length) { onSkip(); return }
        setQuestions(data.questions)
        setSubstrandCode(data.substrandCode)
        setBandState('question')
      })
      .catch(() => onSkip())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const question = questions[qIndex]

  const handleSubmit = useCallback(() => {
    if (!question || qState !== 'idle') return
    const ok = isCorrect(answer, question.answer)
    if (ok) {
      setConsecutiveCorrect(n => n + 1)
      setQState('correct')
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
      const hasCE = Boolean(matched)
      setRepairState({
        ...initialRepairState(),
        matchedErrorId: matched?.id ?? null,
        hintsUsed:      hasCE ? 0 : 1,  // no-match mode: default[0] shown inline
      })
      setQState('incorrect')
    }
  }, [question, qState, answer])

  const handleWorkedSolution = useCallback(() => {
    if (!question) return
    setWorkedSolutionHtml(question.workedSolutionHtml)
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

  const handleRetry = useCallback(() => { setQState('idle') }, [])

  const handleNext = useCallback(() => {
    const next = qIndex + 1
    if (next >= questions.length) {
      onComplete()
      return
    }
    if (qState === 'incorrect') {
      setConsecutiveCorrect(0)
    }
    setQIndex(next)
    setQState('idle')
    setAnswer('')
    setRepairState(initialRepairState())
    setAttemptCount(0)
    setShownHints([])
    setWorkedSolutionHtml(null)
  }, [qIndex, questions.length, qState, onComplete])

  if (bandState === 'loading') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: `${space[8]} ${space[4]}`, textAlign: 'center' }}>
        <p style={{ color: color.textMuted, fontSize: typography.fontSize.sm }}>Loading…</p>
      </div>
    )
  }

  if (bandState === 'skipped' || !question) return null

  const matchedCE = qState === 'incorrect' && repairState.matchedErrorId
    ? question.common_errors?.find((e: CommonError & { contextualHintHtml: string }) => e.id === repairState.matchedErrorId) ?? null
    : null

  const initialHintHtml = (qState === 'incorrect' && !repairState.matchedErrorId)
    ? question.hintsHtml[0]
    : null

  const hintsExhausted = repairState.workedSolutionUnlocked || (() => {
    if (repairState.matchedErrorId && question) {
      const ce = question.common_errors?.find((e: CommonError & { contextualHintHtml: string }) => e.id === repairState.matchedErrorId)
      return !ce || repairState.repairPathIndex >= ce.repair_path.length
    }
    return repairState.hintsUsed >= 3
  })()

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: `${space[6]} ${space[4]}` }}>
      {/* Framing banner */}
      <div style={{
        background:   color.primaryLight,
        border:       `1px solid ${color.border}`,
        borderRadius: '8px',
        padding:      `${space[3]} ${space[4]}`,
        marginBottom: space[5],
      }}>
        <p style={{ fontSize: typography.fontSize.sm, color: color.primaryDark, margin: 0 }}>
          Before continuing — here are two questions from a topic you found tricky recently.
        </p>
        <p style={{ fontSize: typography.fontSize.sm, color: color.primary, margin: `${space[1]} 0 0`, fontFamily: 'ui-monospace, monospace' }}>
          {substrandCode} · {qIndex + 1} of {questions.length}
        </p>
      </div>

      <QuestionCard
        question={question}
        questionNumber={qIndex + 1}
        total={questions.length}
        selectedAnswer={answer}
        onAnswerChange={setAnswer}
        onSubmit={handleSubmit}
        submitDisabled={qState !== 'idle'}
        questionState={
          qState === 'correct' ? 'correct'
          : qState === 'incorrect' && workedSolutionHtml !== null ? 'worked-solution'
          : qState === 'incorrect' ? 'incorrect'
          : 'idle'
        }
      />

      {qState === 'correct' && (
        <CorrectBand
          onNext={handleNext}
          isLast={qIndex === questions.length - 1}
          consecutiveCorrect={consecutiveCorrect}
          usedHints={shownHints.length > 0}
        />
      )}

      {qState === 'incorrect' && (
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
