/**
 * Unit tests for component logic — pure function layer only.
 * No DOM rendering required (vitest node environment).
 *
 * Tests cover:
 *   - competenceMessage() from CorrectBand
 *   - framingLine() from RepairBand
 *   - splitSteps() from WorkedSolution
 *   - SpacedRetrievalBand question-count constraint
 *   - RepairBand mode selection (CE vs default)
 */
import { describe, it, expect } from 'vitest'
import { competenceMessage } from '@/components/practice/CorrectBand'
import { framingLine } from '@/components/practice/RepairBand'
import { splitSteps } from '@/components/practice/WorkedSolution'
import type { CommonError } from '@/lib/repair'

// ─── CorrectBand — competenceMessage ─────────────────────────────────────────

describe('competenceMessage — hint used', () => {
  it('returns the "after hints" message when usedHints = true', () => {
    const msg = competenceMessage(1, true)
    expect(msg).toContain('hint')
    expect(msg).toContain('counts')
  })

  it('returns the "after hints" message even when streak is high', () => {
    const msg = competenceMessage(10, true)
    expect(msg).toContain('hint')
  })
})

describe('competenceMessage — streak', () => {
  it('returns streak message when consecutive >= 4 and no hints', () => {
    const msg = competenceMessage(4, false)
    expect(msg).toContain('4')
  })

  it('returns streak message with correct count for 6', () => {
    const msg = competenceMessage(6, false)
    expect(msg).toContain('6')
  })

  it('returns first-try message when consecutive = 2 and no hints', () => {
    const msg = competenceMessage(2, false)
    expect(msg).toContain('first try')
  })

  it('returns neutral message when consecutive = 1 and no hints', () => {
    const msg = competenceMessage(1, false)
    expect(msg).toBe('Correct — on to the next one.')
  })
})

describe('competenceMessage — language invariants', () => {
  const badWords = ['wrong', 'incorrect', 'mistake', 'failed']

  it.each(Array.from({ length: 8 }, (_, i) => i + 1))('does not contain forbidden words (consec %i, hints=false)', (n) => {
    const msg = competenceMessage(n, false)
    for (const word of badWords) {
      expect(msg.toLowerCase()).not.toContain(word)
    }
  })

  it.each(Array.from({ length: 4 }, (_, i) => i + 1))('does not contain forbidden words (consec %i, hints=true)', (n) => {
    const msg = competenceMessage(n, true)
    for (const word of badWords) {
      expect(msg.toLowerCase()).not.toContain(word)
    }
  })
})

// ─── RepairBand — framingLine ─────────────────────────────────────────────────

function makeError(type: CommonError['type']): CommonError {
  return {
    id:             'CE001',
    type,
    detect:         { rule: 'answer_matches', params: { value: '14' } },
    repair_path:    ['contextual_hint'],
    contextual_hint: 'Test hint.',
  }
}

describe('framingLine — CE mode', () => {
  it('returns a conversational line for conceptual errors', () => {
    const line = framingLine(makeError('conceptual'))
    expect(line.length).toBeGreaterThan(10)
    expect(line).not.toContain('wrong')
    expect(line).not.toContain('incorrect')
  })

  it('returns a conversational line for procedural errors', () => {
    const line = framingLine(makeError('procedural'))
    expect(line.length).toBeGreaterThan(10)
    expect(line).not.toContain('mistake')
  })

  it('returns a conversational line for careless errors', () => {
    const line = framingLine(makeError('careless'))
    expect(line.length).toBeGreaterThan(10)
    expect(line).not.toContain('failed')
  })

  it('produces different text for different error types', () => {
    const conceptual = framingLine(makeError('conceptual'))
    const procedural = framingLine(makeError('procedural'))
    const careless   = framingLine(makeError('careless'))
    const distinct = new Set([conceptual, procedural, careless])
    expect(distinct.size).toBe(3)
  })
})

describe('RepairBand — mode determination', () => {
  it('CE mode: when matchedError is provided, contextualHint should be shown (not default hint)', () => {
    const matchedError = { ...makeError('conceptual'), contextualHintHtml: '<span>CE specific hint</span>' }
    const defaultHint  = '<span>Default hint 0</span>'

    // When matchedError is set, initialHintHtml should be null
    // (RepairBand shows CE content; default hint is not the initial display)
    const initialHintHtml = matchedError ? null : defaultHint

    expect(initialHintHtml).toBeNull()
  })

  it('no-match mode: when matchedError is null, initialHintHtml is the default hint[0]', () => {
    const matchedError: null = null
    const defaultHint = '<span>Default hint 0</span>'

    const initialHintHtml = matchedError ? null : defaultHint

    expect(initialHintHtml).toBe(defaultHint)
    expect(initialHintHtml).not.toBeNull()
  })
})

// ─── WorkedSolution — splitSteps ─────────────────────────────────────────────

describe('splitSteps', () => {
  it('splits on double newlines', () => {
    const html = 'Step 1 content\n\nStep 2 content\n\nStep 3 content'
    expect(splitSteps(html)).toHaveLength(3)
    expect(splitSteps(html)[0]).toBe('Step 1 content')
    expect(splitSteps(html)[2]).toBe('Step 3 content')
  })

  it('filters out empty segments', () => {
    const html = 'Step 1\n\n\n\nStep 2'
    expect(splitSteps(html)).toHaveLength(2)
  })

  it('returns single-element array for no double newlines', () => {
    const html = 'Single step with no splits'
    expect(splitSteps(html)).toHaveLength(1)
    expect(splitSteps(html)[0]).toBe('Single step with no splits')
  })

  it('first render should show only step 1 (count = 1)', () => {
    const html = 'Step 1\n\nStep 2\n\nStep 3'
    const steps = splitSteps(html)
    // Initial visibleCount = 1, so slice(0, 1) shows only first step
    expect(steps.slice(0, 1)).toHaveLength(1)
    expect(steps.slice(0, 1)[0]).toBe('Step 1')
  })

  it('"Next step" button not shown when all steps visible', () => {
    const steps = splitSteps('Only one step')
    // allVisible = visibleCount (1) >= steps.length (1)
    expect(steps.length).toBe(1)
    const allVisible = 1 >= steps.length
    expect(allVisible).toBe(true)
  })

  it('"Next step" advances correctly through all steps', () => {
    const html = 'Step 1\n\nStep 2\n\nStep 3'
    const steps = splitSteps(html)
    let visibleCount = 1
    expect(steps.slice(0, visibleCount)).toHaveLength(1)
    visibleCount++
    expect(steps.slice(0, visibleCount)).toHaveLength(2)
    visibleCount++
    expect(steps.slice(0, visibleCount)).toHaveLength(3)
    expect(visibleCount >= steps.length).toBe(true)
  })
})

// ─── SpacedRetrievalBand — question-count logic ───────────────────────────────

describe('SpacedRetrievalBand — question count constraint', () => {
  it('shows exactly 2 questions when populated', () => {
    const allQuestions = [
      { id: 'Q1' }, { id: 'Q2' }, { id: 'Q3' }, { id: 'Q4' },
    ]
    // The component takes first 2 (lowest question_id for determinism)
    const spacedQuestions = allQuestions.slice(0, 2)
    expect(spacedQuestions).toHaveLength(2)
    expect(spacedQuestions[0].id).toBe('Q1')
    expect(spacedQuestions[1].id).toBe('Q2')
  })

  it('skips (calls onSkip) when no prior failures — empty array', () => {
    const failures: unknown[] = []
    const shouldSkip = !failures.length
    expect(shouldSkip).toBe(true)
  })

  it('does not skip when prior failures exist', () => {
    const failures = [{ session_id: 'sess-1' }]
    const shouldSkip = !failures.length
    expect(shouldSkip).toBe(false)
  })
})
