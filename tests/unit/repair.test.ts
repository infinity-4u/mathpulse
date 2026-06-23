/**
 * Unit tests for src/lib/repair.ts
 * SPEC3 required coverage: detectError (all rules), nextRepairStep, initialRepairState.
 */
import { describe, it, expect } from 'vitest'
import {
  detectError,
  nextRepairStep,
  initialRepairState,
  type Question,
  type RepairState,
} from '@/lib/repair'

// ─── Fixture builders ─────────────────────────────────────────────────────────

function makeNumericQ(
  correctValue: number,
  errors: Question['common_errors'] = [],
): Question {
  return {
    id: 'AC9M7N01-001',
    type: 'numeric',
    answer: { type: 'numeric', value: correctValue },
    hints: { default: ['Hint 1', 'Hint 2', 'Hint 3'] },
    worked_solution: 'The worked solution.',
    common_errors: errors,
    substrand_code: 'AC9M7N01',
    difficulty: 2,
  }
}

function makeFractionQ(
  numerator: number,
  denominator: number,
  errors: Question['common_errors'] = [],
): Question {
  return {
    id: 'AC9M7N07-001',
    type: 'numeric',
    answer: { type: 'fraction', numerator, denominator },
    hints: { default: ['Hint 1', 'Hint 2', 'Hint 3'] },
    worked_solution: 'The fraction solution.',
    common_errors: errors,
    substrand_code: 'AC9M7N07',
    difficulty: 1,
  }
}

function makeMcQ(correct: string, errors: Question['common_errors'] = []): Question {
  return {
    id: 'AC9M7N01-002',
    type: 'multiple_choice',
    answer: { type: 'multiple_choice', correct },
    hints: { default: ['Hint A', 'Hint B', 'Hint C'] },
    worked_solution: 'MC solution.',
    common_errors: errors,
  }
}

// ─── initialRepairState ───────────────────────────────────────────────────────

describe('initialRepairState', () => {
  it('returns zeroed state', () => {
    const state = initialRepairState()
    expect(state.hintsUsed).toBe(0)
    expect(state.workedSolutionUnlocked).toBe(false)
    expect(state.matchedErrorId).toBeNull()
    expect(state.repairPathIndex).toBe(0)
  })
})

// ─── detectError ─────────────────────────────────────────────────────────────

describe('detectError — answer_matches', () => {
  const q = makeNumericQ(12, [
    { id: 'CE001', type: 'careless', detect: { rule: 'answer_matches', params: { value: '14' } }, repair_path: ['contextual_hint'], contextual_hint: 'Not 14.' },
  ])

  it('fires when student gives the matched value', () => {
    expect(detectError(q, '14')).not.toBeNull()
    expect(detectError(q, '14')!.id).toBe('CE001')
  })

  it('does not fire for a different wrong answer', () => {
    expect(detectError(q, '11')).toBeNull()
  })
})

describe('detectError — near_numeric', () => {
  const q = makeNumericQ(100, [
    {
      id: 'CE001', type: 'procedural',
      detect: { rule: 'near_numeric', params: { value: 50, tolerance_factor: 0.1 } },
      repair_path: ['contextual_hint'], contextual_hint: 'Near 50.',
    },
  ])

  it('fires when student answer is within factor of target', () => {
    expect(detectError(q, '51')).not.toBeNull()
    expect(detectError(q, '49')).not.toBeNull()
  })

  it('does not fire when outside tolerance', () => {
    expect(detectError(q, '60')).toBeNull()
  })
})

describe('detectError — answer_equals_2x_value', () => {
  const q = makeNumericQ(6, [
    { id: 'CE001', type: 'conceptual', detect: { rule: 'answer_equals_2x_value' }, repair_path: ['contextual_hint'], contextual_hint: 'Doubled.' },
  ])

  it('fires when student doubled the answer', () => {
    expect(detectError(q, '12')).not.toBeNull()
  })

  it('does not fire for other wrong answers', () => {
    expect(detectError(q, '3')).toBeNull()
    expect(detectError(q, '8')).toBeNull()
  })
})

describe('detectError — answer_equals_half_value', () => {
  const q = makeNumericQ(144, [
    { id: 'CE001', type: 'conceptual', detect: { rule: 'answer_equals_half_value' }, repair_path: ['contextual_hint'], contextual_hint: 'Halved.' },
  ])

  it('fires when student halved the answer', () => {
    expect(detectError(q, '72')).not.toBeNull()
  })

  it('does not fire for other values', () => {
    expect(detectError(q, '12')).toBeNull()
  })
})

describe('detectError — answer_equals_x_plus_n', () => {
  const q = makeNumericQ(10, [
    { id: 'CE001', type: 'careless', detect: { rule: 'answer_equals_x_plus_n', params: { n: 2 } }, repair_path: ['check_arithmetic'], contextual_hint: 'Off by 2.' },
  ])

  it('fires when student added n to the correct answer', () => {
    expect(detectError(q, '12')).not.toBeNull()
  })

  it('does not fire for other errors', () => {
    expect(detectError(q, '8')).toBeNull()
  })
})

describe('detectError — sign_error', () => {
  const q = makeNumericQ(-5, [
    { id: 'CE001', type: 'procedural', detect: { rule: 'sign_error' }, repair_path: ['contextual_hint'], contextual_hint: 'Sign error.' },
  ])

  it('fires when student gave the magnitude with wrong sign', () => {
    expect(detectError(q, '5')).not.toBeNull()
  })

  it('does not fire for unrelated wrong answers', () => {
    expect(detectError(q, '3')).toBeNull()
  })
})

describe('detectError — off_by_one', () => {
  const q = makeNumericQ(10, [
    { id: 'CE001', type: 'careless', detect: { rule: 'off_by_one' }, repair_path: ['check_arithmetic'], contextual_hint: 'Off by 1.' },
  ])

  it('fires for +1 error', () => {
    expect(detectError(q, '11')).not.toBeNull()
  })

  it('fires for -1 error', () => {
    expect(detectError(q, '9')).not.toBeNull()
  })

  it('does not fire for off_by_two', () => {
    expect(detectError(q, '12')).toBeNull()
  })
})

describe('detectError — digit_transposition', () => {
  const q = makeNumericQ(12, [
    { id: 'CE001', type: 'careless', detect: { rule: 'digit_transposition' }, repair_path: ['check_arithmetic'], contextual_hint: 'Transposed.' },
  ])

  it('fires when student transposed digits of the answer', () => {
    expect(detectError(q, '21')).not.toBeNull()
  })

  it('does not fire for the correct answer', () => {
    expect(detectError(q, '12')).toBeNull()
  })

  it('does not fire for a completely different number', () => {
    expect(detectError(q, '33')).toBeNull()
  })
})

describe('detectError — numerator_denominator_swapped', () => {
  const q = makeFractionQ(1, 3, [
    { id: 'CE001', type: 'conceptual', detect: { rule: 'numerator_denominator_swapped' }, repair_path: ['contextual_hint'], contextual_hint: 'Flipped.' },
  ])

  it('fires when student inverted the fraction', () => {
    expect(detectError(q, '3/1')).not.toBeNull()
  })

  it('does not fire for the correct fraction', () => {
    expect(detectError(q, '1/3')).toBeNull()
  })

  it('does not fire for a different wrong answer', () => {
    expect(detectError(q, '2/3')).toBeNull()
  })
})

describe('detectError — did_not_simplify', () => {
  const q = makeFractionQ(1, 2, [
    { id: 'CE001', type: 'procedural', detect: { rule: 'did_not_simplify' }, repair_path: ['contextual_hint', 'worked_example'], contextual_hint: 'Simplify.' },
  ])

  it('fires when student gave an unsimplified equivalent', () => {
    expect(detectError(q, '2/4')).not.toBeNull()
    expect(detectError(q, '4/8')).not.toBeNull()
    expect(detectError(q, '3/6')).not.toBeNull()
  })

  it('does not fire when already in lowest terms', () => {
    expect(detectError(q, '1/2')).toBeNull()
  })

  it('does not fire for a non-equivalent fraction', () => {
    expect(detectError(q, '1/3')).toBeNull()
  })
})

describe('detectError — added_numerators_denominators', () => {
  const q = makeFractionQ(5, 6, [
    {
      id: 'CE001', type: 'conceptual',
      detect: { rule: 'added_numerators_denominators', params: { value: '2/5' } },
      repair_path: ['contextual_hint'],
      contextual_hint: "You can't add fractions by adding numerators and denominators separately.",
    },
  ])

  it('fires when student gave the classic wrong answer', () => {
    expect(detectError(q, '2/5')).not.toBeNull()
  })

  it('does not fire for other answers', () => {
    expect(detectError(q, '5/6')).toBeNull()
  })
})

describe('detectError — no errors defined', () => {
  it('returns null when question has no common_errors', () => {
    const q = makeNumericQ(12)
    expect(detectError(q, '11')).toBeNull()
  })
})

// ─── nextRepairStep ───────────────────────────────────────────────────────────

describe('nextRepairStep — default hint fallback', () => {
  const q = makeNumericQ(12)

  it('returns hint 0 on first call', () => {
    const state = initialRepairState()
    const step = nextRepairStep(q, state)
    expect(step.kind).toBe('hint')
    if (step.kind === 'hint') {
      expect(step.index).toBe(0)
      expect(step.text).toBe('Hint 1')
      expect(step.errorType).toBeNull()
    }
  })

  it('returns hint 1 when hintsUsed = 1', () => {
    const state: RepairState = { ...initialRepairState(), hintsUsed: 1 }
    const step = nextRepairStep(q, state)
    expect(step.kind).toBe('hint')
    if (step.kind === 'hint') {
      expect(step.index).toBe(1)
      expect(step.text).toBe('Hint 2')
    }
  })

  it('returns hint 2 when hintsUsed = 2', () => {
    const state: RepairState = { ...initialRepairState(), hintsUsed: 2 }
    const step = nextRepairStep(q, state)
    expect(step.kind).toBe('hint')
    if (step.kind === 'hint') {
      expect(step.index).toBe(2)
      expect(step.text).toBe('Hint 3')
    }
  })

  it('returns worked_solution when hintsUsed = 3', () => {
    const state: RepairState = { ...initialRepairState(), hintsUsed: 3 }
    const step = nextRepairStep(q, state)
    expect(step.kind).toBe('worked_solution')
    if (step.kind === 'worked_solution') {
      expect(step.text).toBe(q.worked_solution)
    }
  })
})

describe('nextRepairStep — requestWorkedSolution override', () => {
  const q = makeNumericQ(12)

  it('returns worked_solution immediately if requested', () => {
    const state = initialRepairState()
    const step = nextRepairStep(q, state, { requestWorkedSolution: true })
    expect(step.kind).toBe('worked_solution')
  })

  it('returns worked_solution if already unlocked in state', () => {
    const state: RepairState = { ...initialRepairState(), workedSolutionUnlocked: true }
    const step = nextRepairStep(q, state)
    expect(step.kind).toBe('worked_solution')
  })
})

describe('nextRepairStep — matched error path', () => {
  const q = makeNumericQ(12, [
    {
      id: 'CE001',
      type: 'careless',
      detect: { rule: 'answer_matches', params: { value: '14' } },
      repair_path: ['contextual_hint', 'worked_example'],
      contextual_hint: 'Close — but check: does 14 × 14 = 144?',
    },
  ])

  it('returns contextual_hint at repairPathIndex 0', () => {
    const state: RepairState = { ...initialRepairState(), matchedErrorId: 'CE001', repairPathIndex: 0 }
    const step = nextRepairStep(q, state)
    expect(step.kind).toBe('hint')
    if (step.kind === 'hint') {
      expect(step.text).toBe('Close — but check: does 14 × 14 = 144?')
      expect(step.errorType).toBe('careless')
    }
  })

  it('returns worked_solution at repairPathIndex 1 (worked_example primitive)', () => {
    const state: RepairState = { ...initialRepairState(), matchedErrorId: 'CE001', repairPathIndex: 1 }
    const step = nextRepairStep(q, state)
    expect(step.kind).toBe('worked_solution')
    if (step.kind === 'worked_solution') {
      expect(step.text).toBe(q.worked_solution)
    }
  })

  it('returns worked_solution when repair path is exhausted', () => {
    const state: RepairState = { ...initialRepairState(), matchedErrorId: 'CE001', repairPathIndex: 99 }
    const step = nextRepairStep(q, state)
    expect(step.kind).toBe('worked_solution')
  })
})

describe('nextRepairStep — check_arithmetic primitive', () => {
  const q = makeNumericQ(10, [
    { id: 'CE001', type: 'careless', detect: { rule: 'off_by_one' }, repair_path: ['check_arithmetic'], contextual_hint: '' },
  ])

  it('returns check_arithmetic step', () => {
    const state: RepairState = { ...initialRepairState(), matchedErrorId: 'CE001', repairPathIndex: 0 }
    const step = nextRepairStep(q, state)
    expect(step.kind).toBe('check_arithmetic')
  })
})

describe('nextRepairStep — retry_variant primitive', () => {
  const q = makeNumericQ(12, [
    { id: 'CE001', type: 'conceptual', detect: { rule: 'answer_equals_2x_value' }, repair_path: ['retry_variant'], contextual_hint: '' },
  ])

  it('returns retry_variant with lower difficulty', () => {
    const state: RepairState = { ...initialRepairState(), matchedErrorId: 'CE001', repairPathIndex: 0 }
    const step = nextRepairStep(q, state)
    expect(step.kind).toBe('retry_variant')
    if (step.kind === 'retry_variant') {
      expect(step.substrandCode).toBe('AC9M7N01')
      expect(step.difficulty).toBe(1) // difficulty 2 - 1 = 1
    }
  })

  it('clamps difficulty to minimum 1', () => {
    const lowQ: Question = { ...q, difficulty: 1 }
    const state: RepairState = { ...initialRepairState(), matchedErrorId: 'CE001', repairPathIndex: 0 }
    const step = nextRepairStep(lowQ, state)
    if (step.kind === 'retry_variant') {
      expect(step.difficulty).toBe(1)
    }
  })
})

describe('nextRepairStep — unknown matchedErrorId falls through to default hints', () => {
  const q = makeNumericQ(12)

  it('returns default hint if matchedErrorId references a deleted error', () => {
    const state: RepairState = { ...initialRepairState(), matchedErrorId: 'DELETED', repairPathIndex: 0, hintsUsed: 0 }
    const step = nextRepairStep(q, state)
    expect(step.kind).toBe('hint')
    if (step.kind === 'hint') {
      expect(step.text).toBe('Hint 1')
    }
  })
})
