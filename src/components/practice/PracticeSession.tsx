'use client'

/**
 * PracticeSession — main practice loop.
 *
 * State machine per question:
 *   idle → correct (CorrectBand) | incorrect (RepairBand → hints → worked solution)
 *   incorrect → retry (back to idle) | give up (WorkedSolution → next)
 *
 * After the 5th question: SpacedRetrievalBand fires once (if student has prior
 * repair failures in a different substrand).
 *
 * Learning trace (migration 0005) fields written per question on advance to next:
 *   detected_error_id, hint_ids_shown, repair_success
 *
 * CONTRACT.md: no LLM calls, no localStorage, no tracking SDKs, no PII in logs.
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { useStudentSession } from '@/contexts/StudentSessionContext'
import { isCorrect } from '@/lib/answer'
import { detectError, nextRepairStep, initialRepairState, type RepairState, type CommonError } from '@/lib/repair'
import { QuestionCard } from './QuestionCard'
import { CorrectBand } from './CorrectBand'
import { RepairBand } from './RepairBand'
import { HintCard } from './HintCard'
import { WorkedSolution } from './WorkedSolution'
import { SpacedRetrievalBand } from './SpacedRetrievalBand'
import { color, typography, space } from '@/theme/tokens'
import type { PreRenderedQuestion } from '@/lib/content'

type QuestionState = 'idle' | 'correct' | 'incorrect'
type SessionMode   = 'main' | 'spaced'

interface PracticeSessionProps {
  questions:     PreRenderedQuestion[]
  substrandCode: string
}

export function PracticeSession({ questions, substrandCode }: PracticeSessionProps) {
  const { session, setSession } = useStudentSession()

  // Session tracking
  const sessionIdRef = useRef<string | null>(null)
  const correctRef   = useRef(0)
  const attemptedRef = useRef(0)

  // SpacedRetrievalBand — fires once per session, after 5th question
  const spacedFiredRef = useRef(false)
  const [mode, setMode] = useState<SessionMode>('main')

  // Question navigation
  const [qIndex, setQIndex] = useState(0)
  const question = questions[qIndex]

  // Per-question state
  const [state, setState]           = useState<QuestionState>('idle')
  const [answer, setAnswer]         = useState('')
  const [repairState, setRepairState] = useState<RepairState>(initialRepairState())
  const [attemptCount, setAttemptCount] = useState(0)  // wrong submissions this question

  // Hints and worked solution
  const [shownHints, setShownHints]             = useState<Array<{ html: string; number: number }>>([])
  const [workedSolutionHtml, setWorkedSolution] = useState<string | null>(null)

  // Learning trace per question
  const [detectedErrorId, setDetectedErrorId] = useState<string | null>(null)
  const [hintIdsShown, setHintIdsShown]       = useState<string[]>([])
  const [repairSuccess, setRepairSuccess]       = useState<boolean | null>(null)

  // Streak — correct answers in a row (regardless of hints used)
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0)

  // Session finished
  const [finished, setFinished] = useState(false)

  // ── Start the session ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return
    fetch('/api/progress', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({
        action:         'start_session',
        substrand_code: substrandCode,
        source:         'free_practice',
        student_id:     session.studentId,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.session_id) sessionIdRef.current = data.session_id })
      .catch(() => { /* continue without progress recording */ })
  }, [session, substrandCode])

  // ── Write attempt to DB (called when moving to next question) ─────────────
  const writeAttempt = useCallback((
    questionId:      string,
    answerGiven:     string,
    correct:         boolean,
    hintsUsed:       number,
    errorId:         string | null,
    hintIds:         string[],
    repair:          boolean | null,
  ) => {
    if (!session || !sessionIdRef.current) return
    fetch('/api/progress', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({
        action:            'record_attempt',
        session_id:        sessionIdRef.current,
        question_id:       questionId,
        answer_given:      answerGiven,
        is_correct:        correct,
        hints_used:        hintsUsed,
        detected_error_id: errorId,
        hint_ids_shown:    hintIds,
        repair_success:    repair,
      }),
    }).catch(() => { /* fire-and-forget */ })
  }, [session])

  // ── Answer submission ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!question || state !== 'idle') return

    const ok = isCorrect(answer, question.answer)
    attemptedRef.current++

    if (ok) {
      correctRef.current++
      setConsecutiveCorrect(n => n + 1)
      // repair_success: true if they previously had a wrong attempt
      if (attemptCount > 0) setRepairSuccess(true)
      setState('correct')
    } else {
      setAttemptCount(n => n + 1)

      const matched = detectError(
        {
          id:             question.id,
          type:           question.type,
          answer:         question.answer,
          hints:          { default: ['', '', ''] as [string, string, string] },
          worked_solution: '',
          common_errors:  question.common_errors,
          difficulty:     question.difficulty,
          substrand_code: question.substrand_code,
        },
        answer,
      )

      const hasCE = Boolean(matched)
      if (matched && !detectedErrorId) {
        setDetectedErrorId(matched.detect.rule ?? matched.id)
        setHintIdsShown(prev => [...prev, 'contextual_hint'])
      } else if (!matched && shownHints.length === 0) {
        // No-match mode: RepairBand shows default[0] inline; record it
        setHintIdsShown(prev => prev.includes('default_hint_0') ? prev : [...prev, 'default_hint_0'])
      }

      setRepairState({
        ...initialRepairState(),
        matchedErrorId: matched?.id ?? null,
        hintsUsed:      hasCE ? 0 : 1,  // no-match: default[0] consumed by RepairBand
      })
      setState('incorrect')
    }
  }, [question, state, answer, attemptCount, detectedErrorId, shownHints.length])

  // ── "Try again" — re-enable the QuestionCard without resetting hints ──────
  const handleRetry = useCallback(() => {
    setState('idle')
  }, [])

  // ── Worked solution request ───────────────────────────────────────────────
  const handleWorkedSolutionRequest = useCallback(() => {
    if (!question) return
    setWorkedSolution(question.workedSolutionHtml)
    setRepairState(prev => ({ ...prev, workedSolutionUnlocked: true }))
    setHintIdsShown(prev => [...prev, 'worked_example'])
    // Student gave up — repair_success = false
    setRepairSuccess(false)
  }, [question])

  // ── Hint request — follows CE repair_path or default sequence ────────────
  const handleHintRequest = useCallback(() => {
    if (!question) return

    // Pass pre-rendered HTML so nextRepairStep returns display-ready text
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
      const hintId = repairState.matchedErrorId
        ? `ce_repair_${repairState.repairPathIndex}`
        : `default_hint_${repairState.hintsUsed}`
      setShownHints(prev => [...prev, { html: step.text, number: prev.length + 1 }])
      setHintIdsShown(prev => [...prev, hintId])
      if (repairState.matchedErrorId) {
        setRepairState(prev => ({ ...prev, repairPathIndex: prev.repairPathIndex + 1 }))
      } else {
        setRepairState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }))
      }
    } else {
      // repair_path exhausted or check_arithmetic/retry_variant — show worked solution
      handleWorkedSolutionRequest()
    }
  }, [question, repairState, handleWorkedSolutionRequest])

  // ── Advance to next question ──────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!question) return

    // Write the attempt with all learning trace fields
    writeAttempt(
      question.id,
      answer,
      state === 'correct',
      shownHints.length,
      detectedErrorId,
      hintIdsShown,
      state === 'correct' && attemptCount === 0 ? null : repairSuccess,
    )

    if (state === 'incorrect') {
      setConsecutiveCorrect(0)  // student gave up via worked solution
    }

    const nextIndex = qIndex + 1

    if (nextIndex >= questions.length) {
      // Complete the session
      if (session && sessionIdRef.current) {
        fetch('/api/progress', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({ action: 'complete_session', session_id: sessionIdRef.current }),
        }).catch(() => { /* fire-and-forget */ })
      }
      setFinished(true)
      return
    }

    // Fire SpacedRetrievalBand after the 5th question (0-indexed: qIndex 4)
    if (qIndex === 4 && !spacedFiredRef.current) {
      spacedFiredRef.current = true
      // Reset per-question state first, then show band
      resetPerQuestion()
      setQIndex(nextIndex)
      setMode('spaced')
      return
    }

    resetPerQuestion()
    setQIndex(nextIndex)
  }, [question, answer, state, shownHints.length, detectedErrorId, hintIdsShown, repairSuccess,
      attemptCount, qIndex, questions.length, session, writeAttempt]) // eslint-disable-line react-hooks/exhaustive-deps

  function resetPerQuestion() {
    setState('idle')
    setAnswer('')
    setRepairState(initialRepairState())
    setAttemptCount(0)
    setShownHints([])
    setWorkedSolution(null)
    setDetectedErrorId(null)
    setHintIdsShown([])
    setRepairSuccess(null)
  }

  // ── No session ────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: space[16] }}>
        <p style={{ color: color.textMuted, marginBottom: space[4] }}>Session expired.</p>
        <a href="/practice" style={{ color: color.primary, display: 'block', marginBottom: space[4] }}>Enter your PIN to continue →</a>
        <button
          onClick={() => {
            const now = Math.floor(Date.now() / 1000)
            setSession({ token: 'demo', studentId: 'demo-student', classIds: [], expiresAt: now + 8 * 3600 })
          }}
          style={{ background: 'none', border: `1px solid ${color.border}`, borderRadius: '8px', padding: `${space[3]} ${space[5]}`, color: color.textMuted, fontSize: typography.fontSize.sm, cursor: 'pointer' }}
        >
          Continue as guest
        </button>
      </div>
    )
  }

  // ── Spaced retrieval mode ─────────────────────────────────────────────────
  if (mode === 'spaced') {
    return (
      <SpacedRetrievalBand
        studentToken={session.token}
        currentSubstrand={substrandCode}
        onComplete={() => setMode('main')}
        onSkip={() => setMode('main')}
      />
    )
  }

  // ── Finished screen ───────────────────────────────────────────────────────
  if (finished) {
    const correct  = correctRef.current
    const attempted = attemptedRef.current
    const pct = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: `${space[16]} ${space[6]}`, textAlign: 'center' }}>
        <h1 style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, color: color.text, marginBottom: space[3] }}>
          Session complete
        </h1>
        <p style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: pct >= 80 ? color.success : color.repair, marginBottom: space[2] }}>
          {correct}/{attempted} correct
        </p>
        <p style={{ color: color.textMuted, marginBottom: space[8] }}>{substrandCode}</p>
        <a
          href="/practice"
          style={{ background: color.primary, color: color.surface, borderRadius: '8px', padding: `${space[3]} ${space[8]}`, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, textDecoration: 'none', display: 'inline-block' }}
        >
          Practise again
        </a>
      </div>
    )
  }

  // ── Main practice UI ──────────────────────────────────────────────────────
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
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: `${space[6]} ${space[4]}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[5] }}>
        <a href="/practice" style={{ color: color.textMuted, fontSize: typography.fontSize.sm, textDecoration: 'none' }}>
          ← Back
        </a>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: typography.fontSize.sm, color: color.textMuted }}>
          {substrandCode}
        </span>
      </div>

      {question && (
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
      )}

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
            onRequestWorkedSolution={handleWorkedSolutionRequest}
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
