/**
 * Deterministic mistake-repair logic.
 *
 * CONTRACT.md §4: no LLM calls in the student path in V1.
 * This module is pure functions only — no network, no database, no AI.
 * It is fully unit-testable from tests/unit/repair.test.ts.
 *
 * Repair flow per spec.md:
 *   Wrong answer → hint[0] → hint[1] → hint[2] → worked_solution unlocks
 *   Error type (conceptual / procedural / careless) is detected from common_errors
 *   and used to annotate the hint, not to select a different sequence.
 */

export type ErrorType = 'conceptual' | 'procedural' | 'careless'

export interface CommonError {
  answer: string
  type: ErrorType
  note: string
}

export interface Question {
  id: string
  type: 'multiple_choice' | 'numeric'
  correct: string
  hints: [string, string, string]   // exactly 3
  worked_solution: string
  common_errors?: CommonError[]
  // numeric tolerance — optional, defaults to exact match
  tolerance?: number
}

export interface RepairState {
  hintsUsed: number         // 0–3
  workedSolutionUnlocked: boolean
  detectedErrorType: ErrorType | null
}

/**
 * Checks whether the student's answer is correct.
 * For numeric questions, applies optional tolerance.
 */
export function isCorrect(question: Question, answer: string): boolean {
  if (question.type === 'multiple_choice') {
    return answer.trim() === question.correct.trim()
  }
  // Numeric: parse both and compare within tolerance
  const studentNum = parseFloat(answer.replace(/,/g, ''))
  const correctNum = parseFloat(question.correct)
  if (isNaN(studentNum) || isNaN(correctNum)) return false
  const tolerance = question.tolerance ?? 0
  return Math.abs(studentNum - correctNum) <= tolerance
}

/**
 * Detects the error type from the common_errors array.
 * Returns null if the answer doesn't match any known error pattern.
 */
export function detectErrorType(
  question: Question,
  wrongAnswer: string
): ErrorType | null {
  if (!question.common_errors) return null
  const match = question.common_errors.find(
    e => e.answer.trim() === wrongAnswer.trim()
  )
  return match?.type ?? null
}

/**
 * Returns the next hint to show, or null if worked_solution should unlock.
 * hintsUsed is the number of hints already shown (0, 1, 2, or 3).
 */
export function getNextHint(
  question: Question,
  hintsUsed: number
): { hint: string; index: number } | null {
  if (hintsUsed >= 3) return null
  return { hint: question.hints[hintsUsed], index: hintsUsed }
}

/**
 * Returns whether the worked solution should be visible.
 * Unlocks after all 3 hints have been used, or on explicit student request.
 */
export function isWorkedSolutionUnlocked(
  hintsUsed: number,
  explicitRequest: boolean
): boolean {
  return hintsUsed >= 3 || explicitRequest
}

/**
 * Full repair step — called when student submits a wrong answer or requests a hint.
 * Returns the updated RepairState and the content to display.
 */
export function nextRepairStep(
  question: Question,
  state: RepairState,
  options: { requestWorkedSolution?: boolean } = {}
): {
  state: RepairState
  hint: string | null
  workedSolution: string | null
  errorType: ErrorType | null
} {
  const errorType = state.detectedErrorType ??
    (state.hintsUsed === 0 ? detectErrorType(question, '') : null)

  if (options.requestWorkedSolution || state.hintsUsed >= 3) {
    return {
      state: { ...state, workedSolutionUnlocked: true, hintsUsed: Math.max(state.hintsUsed, 3) },
      hint: null,
      workedSolution: question.worked_solution,
      errorType,
    }
  }

  const next = getNextHint(question, state.hintsUsed)
  if (!next) {
    return {
      state: { ...state, workedSolutionUnlocked: true },
      hint: null,
      workedSolution: question.worked_solution,
      errorType,
    }
  }

  return {
    state: { ...state, hintsUsed: state.hintsUsed + 1, detectedErrorType: errorType },
    hint: next.hint,
    workedSolution: null,
    errorType,
  }
}

/** Initial repair state for a new question attempt. */
export function initialRepairState(): RepairState {
  return { hintsUsed: 0, workedSolutionUnlocked: false, detectedErrorType: null }
}
