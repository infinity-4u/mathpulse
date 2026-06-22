# PROPOSAL — SPEC 3: Structured Error / Repair Schema
**Status: AWAITING RATIFICATION** — do not implement until approved.
Cross-reference: spec.md → Mistake repair, src/lib/repair.ts, CONTRACT.md §4 §5.

---

## The problem

The current schema has a flat `hints: [string, string, string]` array and a `common_errors`
array that only records the error answer and a text note. There is no machine-readable
detection rule, no structured repair path, and no reuse of repair primitives across
questions. The result is per-question hint branching that does not scale.

---

## Design principles

1. **Detection is rule-based, not AI.** A small set of named rules (`answer_equals_2x_value`,
   `near_numeric`, etc.) cover the vast majority of predictable misconceptions.
2. **Repair is a sequence of primitives from a small shared library.** Most questions use
   1–2 primitives. No per-question branching trees.
3. **The engine stays in `src/lib/repair.ts` as pure functions.** This spec tells Claude
   Code what to implement — Cowork does not touch the engine code.
4. **Unrecognised answers fall back to the default hint sequence.** The structured paths
   are enhancements, not replacements.

---

## Detection rule library

Each rule is a named pure function `detect(rule, params, studentAnswer, question) → boolean`.

| Rule name | Detects | Params |
|---|---|---|
| `answer_matches` | Exact string match to a known wrong answer | `{ value: string }` |
| `near_numeric` | Within `factor × |correct|` of a known wrong value | `{ value: number, tolerance_factor: number }` |
| `answer_equals_2x_value` | Student doubled the correct answer | — |
| `answer_equals_half_value` | Student halved the correct answer | — |
| `answer_equals_x_plus_n` | Student added n to the correct answer | `{ n: number }` |
| `sign_error` | Correct magnitude, wrong sign | — |
| `off_by_one` | Exactly ±1 from correct | — |
| `digit_transposition` | Digits of correct answer transposed | — |
| `wrong_operation` | Applied a different operation (e.g. × instead of +) | `{ operation: 'add'|'subtract'|'multiply'|'divide' }` |
| `numerator_denominator_swapped` | Fraction inverted | — |
| `did_not_simplify` | Answer is correct but unsimplified (for fractions) | — |
| `added_numerators_denominators` | Classic fraction error: 1/2 + 1/3 = 2/5 | — |

---

## Repair primitive library

Each primitive is a named display instruction. The engine resolves primitives to UI
components — it does not generate text.

| Primitive | What it shows |
|---|---|
| `contextual_hint` | The error-specific hint text from the `common_errors` entry |
| `worked_example` | The question's full `worked_solution` |
| `retry_variant` | A simpler question from the same substrand (difficulty - 1); selected from the static bank |
| `check_arithmetic` | "Check your calculation — try working through it step by step again" |
| `visual_model` | A visual aid specified in the question (Phase 3 for most; stub in V1) |

Most questions will have `repair_path: ["contextual_hint", "worked_example"]`.
`retry_variant` is used for conceptual errors where the student needs a simpler entry point.
`visual_model` is reserved — Phase 3.

---

## Updated question JSON schema

### `common_errors` entry (replaces flat `{ answer, type, note }`)

```typescript
interface CommonError {
  id: string                    // e.g. "CE001" — unique within the question
  type: 'conceptual' | 'procedural' | 'careless'
  detect: {
    rule: DetectionRule         // one of the named rules above
    params?: Record<string, unknown>
  }
  repair_path: RepairPrimitive[]   // ordered sequence; max 3
  contextual_hint: string          // human-written hint for this specific error
}
```

### Default hints (retained for unrecognised answers)

```typescript
interface QuestionHints {
  default: [string, string, string]  // exactly 3; used when no common_error matches
}
```

### Full question structure (combining Spec 2 + Spec 3)

```json
{
  "id": "AC9M7N01-001",
  "type": "multiple_choice",
  "stem": "What is \\(\\sqrt{144}\\)?",
  "options": ["10", "11", "12", "14"],
  "answer": {
    "type": "multiple_choice",
    "correct": "12"
  },
  "difficulty": 1,
  "hints": {
    "default": [
      "A square root asks: which number multiplied by itself gives 144?",
      "Try 12 × 12. Work it out step by step: 12 × 10 = 120, then 12 × 2 = 24.",
      "12 × 12 = 144. So \\(\\sqrt{144}\\) = ?"
    ]
  },
  "common_errors": [
    {
      "id": "CE001",
      "type": "conceptual",
      "detect": { "rule": "answer_equals_half_value" },
      "repair_path": ["contextual_hint", "worked_example"],
      "contextual_hint": "Halving gives the middle of a range — it is not the same as a square root. Ask: what number times itself gives 144?"
    },
    {
      "id": "CE002",
      "type": "careless",
      "detect": { "rule": "answer_matches", "params": { "value": "14" } },
      "repair_path": ["contextual_hint", "check_arithmetic"],
      "contextual_hint": "Close — but check: does 14 × 14 = 144?"
    }
  ],
  "worked_solution": "We need n where n × n = 144.\n\n- 10 × 10 = 100 (too small)\n- 12 × 12 = 144 ✓\n\nTherefore \\(\\sqrt{144} = 12\\)."
}
```

---

## Engine changes required in `src/lib/repair.ts` (spec for Claude Code)

### New exports needed

```typescript
// Detection
export function detectError(
  question: Question,
  studentAnswer: string
): CommonError | null

// Resolution: returns what to display next
export function nextRepairStep(
  question: Question,
  state: RepairState,
  options?: { requestWorkedSolution?: boolean }
): RepairStep

export type RepairStep =
  | { kind: 'hint'; index: number; text: string; errorType: ErrorType | null }
  | { kind: 'worked_solution'; text: string }
  | { kind: 'retry_variant'; substrandCode: string; difficulty: number }
  | { kind: 'check_arithmetic' }
```

### Detection priority order

1. Check `common_errors[].detect` rules in order. First match wins.
2. If no match: use default hint sequence.
3. After default hint 3 OR after matched repair_path exhausted: unlock `worked_solution`.

### State to track

```typescript
interface RepairState {
  hintsUsed: number               // 0–3 (default sequence) OR index in matched repair_path
  workedSolutionUnlocked: boolean
  matchedErrorId: string | null   // which CE was matched, if any
  repairPathIndex: number         // position in matched repair_path
}
```

---

## Impact on existing repair.ts

The current `repair.ts` interface (`isCorrect`, `detectErrorType`, `nextRepairStep`,
`initialRepairState`) is superseded. Claude Code should refactor:
- `isCorrect` → move to `src/lib/answer.ts` (per Spec 2)
- `detectErrorType` → replace with `detectError` above
- `nextRepairStep` → extend to return `RepairStep` discriminated union
- `initialRepairState` → update `RepairState` type

Keep all functions pure. Keep full unit-test coverage.

---

## Open questions for ratification

1. Should `retry_variant` select the question automatically (random from difficulty-1 pool)
   or present the student with a choice? Recommendation: automatic, silent — student should
   not feel they are being sent backwards.
2. Maximum `repair_path` length: proposal is 3 primitives max. Is this right, or should
   it be 2 (simpler, forces reliance on `worked_solution` sooner)?
