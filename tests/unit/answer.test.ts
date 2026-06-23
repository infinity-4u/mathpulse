/**
 * Unit tests for src/lib/answer.ts
 * SPEC2 required coverage: numeric, fraction, multiple_choice, multi_select.
 */
import { describe, it, expect } from 'vitest'
import { isCorrect, parseFraction, gcd, type Answer } from '@/lib/answer'

// ─── gcd ──────────────────────────────────────────────────────────────────────

describe('gcd', () => {
  it('returns the GCD of two positive integers', () => {
    expect(gcd(12, 8)).toBe(4)
    expect(gcd(9, 3)).toBe(3)
    expect(gcd(7, 5)).toBe(1)
  })

  it('is symmetric', () => {
    expect(gcd(8, 12)).toBe(gcd(12, 8))
  })

  it('handles zero', () => {
    expect(gcd(0, 5)).toBe(5)
    expect(gcd(5, 0)).toBe(5)
  })

  it('handles equal values', () => {
    expect(gcd(6, 6)).toBe(6)
  })

  it('handles negative inputs (uses absolute value)', () => {
    expect(gcd(-12, 8)).toBe(4)
    expect(gcd(12, -8)).toBe(4)
  })
})

// ─── parseFraction ────────────────────────────────────────────────────────────

describe('parseFraction', () => {
  it('parses a fraction string "3/6"', () => {
    expect(parseFraction('3/6')).toEqual({ numerator: 3, denominator: 6 })
  })

  it('parses "1/2"', () => {
    expect(parseFraction('1/2')).toEqual({ numerator: 1, denominator: 2 })
  })

  it('parses a negative fraction "-1/2"', () => {
    expect(parseFraction('-1/2')).toEqual({ numerator: -1, denominator: 2 })
  })

  it('parses a decimal "0.5"', () => {
    const result = parseFraction('0.5')
    expect(result).not.toBeNull()
    // 0.5 → 5/10 or equivalent; GCD-reduced should equal 1/2
    const g = gcd(result!.numerator, result!.denominator)
    expect(result!.numerator / g).toBe(1)
    expect(result!.denominator / g).toBe(2)
  })

  it('parses an integer decimal "2.0"', () => {
    const result = parseFraction('2.0')
    expect(result).not.toBeNull()
    const g = gcd(result!.numerator, result!.denominator)
    expect(result!.numerator / g).toBe(2)
    expect(result!.denominator / g).toBe(1)
  })

  it('parses a percentage "50%"', () => {
    const result = parseFraction('50%')
    expect(result).not.toBeNull()
    const g = gcd(result!.numerator, result!.denominator)
    expect(result!.numerator / g).toBe(1)
    expect(result!.denominator / g).toBe(2)
  })

  it('parses "25%"', () => {
    const result = parseFraction('25%')
    expect(result).not.toBeNull()
    const g = gcd(result!.numerator, result!.denominator)
    expect(result!.numerator / g).toBe(1)
    expect(result!.denominator / g).toBe(4)
  })

  it('returns null for empty string', () => {
    expect(parseFraction('')).toBeNull()
  })

  it('returns null for non-numeric string', () => {
    expect(parseFraction('abc')).toBeNull()
  })

  it('returns null for fraction with zero denominator', () => {
    expect(parseFraction('1/0')).toBeNull()
  })
})

// ─── isCorrect — numeric ──────────────────────────────────────────────────────

describe('isCorrect — numeric', () => {
  const num = (value: number, tolerance?: number): Answer => ({
    type: 'numeric',
    value,
    ...(tolerance !== undefined ? { tolerance } : {}),
  })

  it('exact match', () => {
    expect(isCorrect('12', num(12))).toBe(true)
  })

  it('rejects wrong exact value', () => {
    expect(isCorrect('11', num(12))).toBe(false)
  })

  it('within tolerance', () => {
    expect(isCorrect('6.55', num(6.55, 0.005))).toBe(true)
    expect(isCorrect('6.554', num(6.55, 0.005))).toBe(true)
  })

  it('outside tolerance', () => {
    expect(isCorrect('6.60', num(6.55, 0.005))).toBe(false)
  })

  it('strips comma thousand separator', () => {
    expect(isCorrect('1,200', num(1200))).toBe(true)
    expect(isCorrect('1,200,000', num(1200000))).toBe(true)
  })

  it('accepts negative numbers', () => {
    expect(isCorrect('-3', num(-3))).toBe(true)
    expect(isCorrect('-3', num(3))).toBe(false)
  })

  it('strips trailing units text', () => {
    expect(isCorrect('15 m', num(15))).toBe(true)
    expect(isCorrect('15m', num(15))).toBe(true)
    expect(isCorrect('15 cm²', num(15))).toBe(true)
  })

  it('handles scientific notation', () => {
    expect(isCorrect('1.2e3', num(1200))).toBe(true)
    expect(isCorrect('1.2E3', num(1200))).toBe(true)
    expect(isCorrect('3e-2', num(0.03, 0.001))).toBe(true)
  })

  it('rejects non-numeric input', () => {
    expect(isCorrect('abc', num(12))).toBe(false)
  })

  it('uses accepted_range when provided', () => {
    const a: Answer = { type: 'numeric', value: 0, accepted_range: { min: 10, max: 20 } }
    expect(isCorrect('15', a)).toBe(true)
    expect(isCorrect('10', a)).toBe(true)
    expect(isCorrect('20', a)).toBe(true)
    expect(isCorrect('9', a)).toBe(false)
    expect(isCorrect('21', a)).toBe(false)
  })

  it('accepts string[] input (uses first element)', () => {
    expect(isCorrect(['12'], num(12))).toBe(true)
  })
})

// ─── isCorrect — fraction ─────────────────────────────────────────────────────

describe('isCorrect — fraction', () => {
  const frac = (n: number, d: number, equiv?: string[]): Answer => ({
    type: 'fraction',
    numerator: n,
    denominator: d,
    ...(equiv ? { equivalent_forms: equiv } : {}),
  })

  it('accepts exact fraction', () => {
    expect(isCorrect('1/2', frac(1, 2))).toBe(true)
  })

  it('accepts unsimplified equivalent fraction (reduces to lowest terms)', () => {
    expect(isCorrect('2/4', frac(1, 2))).toBe(true)
    expect(isCorrect('3/6', frac(1, 2))).toBe(true)
    expect(isCorrect('4/8', frac(1, 2))).toBe(true)
  })

  it('rejects incorrect fraction', () => {
    expect(isCorrect('1/3', frac(1, 2))).toBe(false)
  })

  it('accepts decimal equivalent', () => {
    expect(isCorrect('0.5', frac(1, 2))).toBe(true)
    expect(isCorrect('0.25', frac(1, 4))).toBe(true)
  })

  it('accepts string from equivalent_forms (case-insensitive)', () => {
    expect(isCorrect('50%', frac(1, 2, ['50%', '0.5']))).toBe(true)
    expect(isCorrect('0.5', frac(1, 2, ['50%', '0.5']))).toBe(true)
  })

  it('equivalent_forms matching is case-insensitive and trimmed', () => {
    expect(isCorrect(' 50% ', frac(1, 2, ['50%']))).toBe(true)
  })

  it('rejects unrecognised string', () => {
    expect(isCorrect('half', frac(1, 2))).toBe(false)
  })
})

// ─── isCorrect — multiple_choice ──────────────────────────────────────────────

describe('isCorrect — multiple_choice', () => {
  const mc = (correct: string): Answer => ({ type: 'multiple_choice', correct })

  it('accepts exact match', () => {
    expect(isCorrect('12', mc('12'))).toBe(true)
  })

  it('trims whitespace before comparing', () => {
    expect(isCorrect('  12  ', mc('12'))).toBe(true)
    expect(isCorrect('12', mc('  12  '))).toBe(true)
  })

  it('rejects wrong option', () => {
    expect(isCorrect('11', mc('12'))).toBe(false)
  })

  it('is case-sensitive (as per spec)', () => {
    expect(isCorrect('true', mc('True'))).toBe(false)
  })
})

// ─── isCorrect — multi_select ─────────────────────────────────────────────────

describe('isCorrect — multi_select', () => {
  const ms = (correct: string[]): Answer => ({ type: 'multi_select', correct })

  it('accepts correct set in same order', () => {
    expect(isCorrect(['A', 'B'], ms(['A', 'B']))).toBe(true)
  })

  it('accepts correct set in different order', () => {
    expect(isCorrect(['B', 'A'], ms(['A', 'B']))).toBe(true)
  })

  it('rejects missing selection', () => {
    expect(isCorrect(['A'], ms(['A', 'B']))).toBe(false)
  })

  it('rejects extra selection', () => {
    expect(isCorrect(['A', 'B', 'C'], ms(['A', 'B']))).toBe(false)
  })

  it('trims whitespace in each option', () => {
    expect(isCorrect(['A ', ' B'], ms(['A', 'B']))).toBe(true)
  })
})

// ─── isCorrect — Phase 3 types (no V1 checker) ───────────────────────────────

describe('isCorrect — Phase 3 types return false', () => {
  it('ordering returns false', () => {
    const a: Answer = { type: 'ordering', sequence: ['a', 'b'] }
    expect(isCorrect('a', a)).toBe(false)
  })

  it('expression returns false', () => {
    const a: Answer = { type: 'expression', canonical: '2x+3' }
    expect(isCorrect('2x+3', a)).toBe(false)
  })
})
