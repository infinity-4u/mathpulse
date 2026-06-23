/**
 * Deterministic mistake-repair engine.
 *
 * CONTRACT.md §4: no LLM calls — pure functions only. No network, no database.
 * SPEC3: named detection rules + repair primitive library.
 *
 * Flow:
 *   1. Student submits wrong answer → call detectError(question, answer)
 *   2. Store returned CommonError.id in RepairState (null if no match)
 *   3. Student requests help → call nextRepairStep(question, state)
 *   4. Repeat until worked_solution is shown
 */

import { parseFraction, gcd, type Answer } from './answer'

// ─── Error taxonomy ──────────────────────────────────────────────────────────

export type ErrorType = 'conceptual' | 'procedural' | 'careless'

// ─── Detection rule names (SPEC3 §Detection rule library) ────────────────────

export type DetectionRule =
  | 'answer_matches'
  | 'near_numeric'
  | 'answer_equals_2x_value'
  | 'answer_equals_half_value'
  | 'answer_equals_x_plus_n'
  | 'sign_error'
  | 'off_by_one'
  | 'digit_transposition'
  | 'wrong_operation'
  | 'numerator_denominator_swapped'
  | 'did_not_simplify'
  | 'added_numerators_denominators'

// ─── Repair primitive names (SPEC3 §Repair primitive library) ─────────────────

export type RepairPrimitive =
  | 'contextual_hint'
  | 'worked_example'
  | 'retry_variant'
  | 'check_arithmetic'
  | 'visual_model' // Phase 3 stub

// ─── Question schema (SPEC2 + SPEC3 combined) ─────────────────────────────────

export interface CommonError {
  id: string
  type: ErrorType
  detect: {
    rule: DetectionRule
    params?: Record<string, unknown>
  }
  repair_path: RepairPrimitive[]
  contextual_hint: string
}

export interface QuestionHints {
  default: [string, string, string]
}

export interface Question {
  id: string
  type: 'multiple_choice' | 'numeric'
  answer: Answer
  hints: QuestionHints
  worked_solution: string
  common_errors?: CommonError[]
  substrand_code?: string
  difficulty?: number
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface RepairState {
  hintsUsed: number               // position in default hint sequence (0–3)
  workedSolutionUnlocked: boolean
  matchedErrorId: string | null   // which CE was matched, if any
  repairPathIndex: number         // position within matched repair_path
}

// ─── Step discriminated union ─────────────────────────────────────────────────

export type RepairStep =
  | { kind: 'hint'; index: number; text: string; errorType: ErrorType | null }
  | { kind: 'worked_solution'; text: string }
  | { kind: 'retry_variant'; substrandCode: string; difficulty: number }
  | { kind: 'check_arithmetic' }

// ─── Detection ────────────────────────────────────────────────────────────────

function matchesRule(
  detect: CommonError['detect'],
  studentAnswer: string,
  question: Question,
): boolean {
  const { rule, params } = detect
  const answer = question.answer
  const studentNum = parseFloat(studentAnswer.replace(/,/g, ''))
  const correctNum = answer.type === 'numeric' ? answer.value : NaN

  switch (rule) {
    case 'answer_matches':
      return studentAnswer.trim() === String(params?.value ?? '').trim()

    case 'near_numeric': {
      if (isNaN(studentNum)) return false
      const target = params?.value as number
      const factor = (params?.tolerance_factor as number) ?? 0.1
      return Math.abs(studentNum - target) <= factor * Math.abs(target)
    }

    case 'answer_equals_2x_value':
      return answer.type === 'numeric' && !isNaN(studentNum) &&
        Math.abs(studentNum - 2 * correctNum) < 0.001

    case 'answer_equals_half_value':
      return answer.type === 'numeric' && !isNaN(studentNum) &&
        Math.abs(studentNum - correctNum / 2) < 0.001

    case 'answer_equals_x_plus_n': {
      const n = (params?.n as number) ?? 0
      return answer.type === 'numeric' && !isNaN(studentNum) &&
        Math.abs(studentNum - (correctNum + n)) < 0.001
    }

    case 'sign_error':
      return answer.type === 'numeric' && !isNaN(studentNum) &&
        Math.abs(studentNum + correctNum) < 0.001

    case 'off_by_one':
      return answer.type === 'numeric' && !isNaN(studentNum) &&
        Math.abs(Math.abs(studentNum - correctNum) - 1) < 0.001

    case 'digit_transposition': {
      if (answer.type !== 'numeric' || isNaN(studentNum)) return false
      const correctStr = String(Math.round(correctNum))
      const studentStr = String(Math.round(studentNum))
      if (correctStr.length !== studentStr.length || correctStr === studentStr) return false
      return correctStr.split('').sort().join('') === studentStr.split('').sort().join('')
    }

    case 'wrong_operation':
      // Detected via answer_matches against the expected wrong-operation result; no generic rule
      return false

    case 'numerator_denominator_swapped': {
      if (answer.type !== 'fraction') return false
      const parsed = parseFraction(studentAnswer)
      if (!parsed) return false
      return parsed.numerator === answer.denominator && parsed.denominator === answer.numerator
    }

    case 'did_not_simplify': {
      if (answer.type !== 'fraction') return false
      const parsed = parseFraction(studentAnswer)
      if (!parsed) return false
      const g = gcd(Math.abs(parsed.numerator), Math.abs(parsed.denominator))
      if (g <= 1) return false // already simplified — not this error
      const reduced = { numerator: parsed.numerator / g, denominator: parsed.denominator / g }
      const aGcd = gcd(Math.abs(answer.numerator), Math.abs(answer.denominator))
      const aReduced = { numerator: answer.numerator / aGcd, denominator: answer.denominator / aGcd }
      return reduced.numerator === aReduced.numerator && reduced.denominator === aReduced.denominator
    }

    case 'added_numerators_denominators': {
      // Classic error: 1/2 + 1/3 = 2/5
      // Detected via answer_matches against a pre-computed wrong value in params
      if (params?.value !== undefined) {
        return studentAnswer.trim() === String(params.value).trim()
      }
      return false
    }

    default:
      return false
  }
}

/**
 * Find the first matching common_error for the student's wrong answer.
 * Returns null if no rule fires.
 */
export function detectError(question: Question, studentAnswer: string): CommonError | null {
  if (!question.common_errors?.length) return null
  for (const error of question.common_errors) {
    if (matchesRule(error.detect, studentAnswer, question)) {
      return error
    }
  }
  return null
}

// ─── Repair step resolution ───────────────────────────────────────────────────

function resolvePrimitive(
  primitive: RepairPrimitive,
  error: CommonError,
  question: Question,
  repairPathIndex: number,
): RepairStep {
  switch (primitive) {
    case 'contextual_hint':
      return {
        kind: 'hint',
        index: repairPathIndex,
        text: error.contextual_hint,
        errorType: error.type,
      }
    case 'worked_example':
      return { kind: 'worked_solution', text: question.worked_solution }
    case 'retry_variant':
      return {
        kind: 'retry_variant',
        substrandCode: question.substrand_code ?? question.id.split('-')[0],
        difficulty: Math.max(1, (question.difficulty ?? 2) - 1),
      }
    case 'check_arithmetic':
      return { kind: 'check_arithmetic' }
    case 'visual_model':
      // Phase 3 stub — fall back to worked solution
      return { kind: 'worked_solution', text: question.worked_solution }
  }
}

/**
 * Return the next repair step to show the student.
 *
 * Priority:
 *   1. If a common_error was matched (matchedErrorId set), follow its repair_path.
 *   2. If repair_path exhausted: worked_solution.
 *   3. If no match: default hint sequence (hints.default[hintsUsed]).
 *   4. After default hint 3 OR requestWorkedSolution: worked_solution.
 */
export function nextRepairStep(
  question: Question,
  state: RepairState,
  options: { requestWorkedSolution?: boolean } = {},
): RepairStep {
  if (options.requestWorkedSolution || state.workedSolutionUnlocked) {
    return { kind: 'worked_solution', text: question.worked_solution }
  }

  // Matched error path
  if (state.matchedErrorId !== null) {
    const error = question.common_errors?.find((e) => e.id === state.matchedErrorId) ?? null
    if (error) {
      const primitive = error.repair_path[state.repairPathIndex]
      if (primitive === undefined) {
        // Repair path exhausted
        return { kind: 'worked_solution', text: question.worked_solution }
      }
      return resolvePrimitive(primitive, error, question, state.repairPathIndex)
    }
  }

  // Default hint sequence
  if (state.hintsUsed >= 3) {
    return { kind: 'worked_solution', text: question.worked_solution }
  }
  return {
    kind: 'hint',
    index: state.hintsUsed,
    text: question.hints.default[state.hintsUsed],
    errorType: null,
  }
}

/** Initial repair state for a new question attempt. */
export function initialRepairState(): RepairState {
  return {
    hintsUsed: 0,
    workedSolutionUnlocked: false,
    matchedErrorId: null,
    repairPathIndex: 0,
  }
}
