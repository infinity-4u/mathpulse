/**
 * Expressive answer schema and V1 checkers.
 *
 * CONTRACT.md §4: no LLM calls — pure functions only.
 * SPEC2: defines all 8 answer types; only V1 types have checkers.
 */

export type NormalisationRule =
  | 'commutative'
  | 'expand_brackets'
  | 'collect_like_terms'
  | 'simplify_fractions'

export type Answer =
  // ── V1 (checkers implemented below) ────────────────────────────────────────
  | {
      type: 'numeric'
      value: number
      tolerance?: number
      accepted_range?: { min: number; max: number }
      units?: string
    }
  | {
      type: 'fraction'
      numerator: number
      denominator: number
      equivalent_forms?: string[]
    }
  | { type: 'multiple_choice'; correct: string }
  | { type: 'multi_select'; correct: string[] }

  // ── Phase 3 (schema reserved; no V1 checker) ────────────────────────────────
  | { type: 'ordering'; sequence: string[] }
  | { type: 'matching'; pairs: Array<{ left: string; right: string }> }
  | { type: 'expression'; canonical: string; normalisation_rules?: NormalisationRule[] }
  | { type: 'diagram'; spec: Record<string, unknown> }

/** Euclidean GCD — always positive, handles zero. */
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b !== 0) {
    ;[a, b] = [b, a % b]
  }
  return a || 1
}

/**
 * Parse a student fraction string into numerator/denominator.
 * Handles: "3/6", "0.5", "50%", "-1/2".
 * Returns null if the string cannot be interpreted as a fraction.
 */
export function parseFraction(
  input: string,
): { numerator: number; denominator: number } | null {
  const s = input.trim()
  if (!s) return null

  // Percentage: "50%" → {50, 100}
  if (s.endsWith('%')) {
    const pct = parseFloat(s.slice(0, -1))
    if (isNaN(pct)) return null
    // Handle decimal percentages like "33.33%" → {3333, 10000}
    const pctStr = String(pct)
    const dot = pctStr.indexOf('.')
    const scale = dot === -1 ? 1 : Math.pow(10, pctStr.length - dot - 1)
    return { numerator: Math.round(pct * scale), denominator: 100 * scale }
  }

  // Fraction string: "3/6" or "-1/2"
  const slash = s.indexOf('/')
  if (slash !== -1) {
    const num = parseInt(s.slice(0, slash), 10)
    const den = parseInt(s.slice(slash + 1), 10)
    if (isNaN(num) || isNaN(den) || den === 0) return null
    return { numerator: num, denominator: den }
  }

  // Decimal: "0.5" → {5, 10}
  const dec = parseFloat(s)
  if (isNaN(dec)) return null
  const decStr = String(dec)
  const dot = decStr.indexOf('.')
  if (dot === -1) return { numerator: dec, denominator: 1 }
  const decPlaces = decStr.length - dot - 1
  const denom = Math.pow(10, decPlaces)
  return { numerator: Math.round(dec * denom), denominator: denom }
}

function reduce(frac: {
  numerator: number
  denominator: number
}): { numerator: number; denominator: number } {
  const g = gcd(Math.abs(frac.numerator), Math.abs(frac.denominator))
  const sign = frac.denominator < 0 ? -1 : 1
  return {
    numerator: (sign * frac.numerator) / g,
    denominator: (sign * Math.abs(frac.denominator)) / g,
  }
}

/**
 * Check whether studentInput matches answer for V1 question types.
 * - numeric: strip commas + trailing units, apply tolerance / accepted_range
 * - fraction: reduce to lowest terms or check equivalent_forms
 * - multiple_choice: trim exact match
 * - multi_select: set equality (order-independent)
 * - Phase 3 types: always false (content-gate prevents them reaching this)
 */
export function isCorrect(studentInput: string | string[], answer: Answer): boolean {
  switch (answer.type) {
    case 'numeric': {
      const raw = typeof studentInput === 'string' ? studentInput : studentInput[0] ?? ''
      // Remove thousands commas, then extract leading numeric token
      // (handles trailing units like "15 m" or "15m" and scientific notation "1.2e3")
      const cleaned = raw.replace(/,/g, '').trim()
      const match = cleaned.match(/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/)
      if (!match) return false
      const n = parseFloat(match[0])
      if (isNaN(n)) return false
      if (answer.accepted_range) {
        return n >= answer.accepted_range.min && n <= answer.accepted_range.max
      }
      return Math.abs(n - answer.value) <= (answer.tolerance ?? 0)
    }

    case 'fraction': {
      const raw = typeof studentInput === 'string' ? studentInput : studentInput[0] ?? ''
      const trimmed = raw.trim()

      // Check equivalent_forms first (case-insensitive)
      if (answer.equivalent_forms) {
        if (
          answer.equivalent_forms.some(
            (f) => f.trim().toLowerCase() === trimmed.toLowerCase(),
          )
        ) {
          return true
        }
      }

      const parsed = parseFraction(trimmed)
      if (!parsed) return false

      const rStudent = reduce(parsed)
      const rAnswer = reduce({
        numerator: answer.numerator,
        denominator: answer.denominator,
      })
      return rStudent.numerator === rAnswer.numerator && rStudent.denominator === rAnswer.denominator
    }

    case 'multiple_choice': {
      const raw = typeof studentInput === 'string' ? studentInput : studentInput[0] ?? ''
      return raw.trim() === answer.correct.trim()
    }

    case 'multi_select': {
      const inputs = Array.isArray(studentInput) ? studentInput : [studentInput]
      const studentSet = new Set(inputs.map((s) => s.trim()))
      const answerSet = new Set(answer.correct.map((s) => s.trim()))
      if (studentSet.size !== answerSet.size) return false
      for (const s of studentSet) {
        if (!answerSet.has(s)) return false
      }
      return true
    }

    // Phase 3 types — no V1 checker
    default:
      return false
  }
}
