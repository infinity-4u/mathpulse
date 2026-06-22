# PROPOSAL — SPEC 2: Expressive Answer Schema
**Status: AWAITING RATIFICATION** — do not implement until approved.
Cross-reference: spec.md → Content, architecture.md → Content structure, CONTRACT.md §4 §5.

---

## The problem

The current schema has `"correct": "12"` — a bare string. This cannot represent:
- Numeric answers with tolerance (14.99 ≠ 15, but should be accepted within ±0.01)
- Fraction equivalence (1/2 = 2/4 = 3/6)
- Multiple correct answers for multi-select questions
- Ordered sequences, matching pairs — needed for Years 9–10 content

Fixing this mid-project once questions are authored is expensive. Define the full schema now;
implement checkers incrementally.

---

## Schema-ahead / implementation-incremental rule

**Schema is defined for all types now.** Question JSON validates against the full schema.
**Checkers are implemented only for V1 types.** The content gate tripwire enforces that
questions using V2/V3 types are not shipped in a V1 build (they will have no checker).

---

## TypeScript answer type (canonical definition)

```typescript
// src/lib/answer.ts — source of truth; content schema mirrors this

type NormalisationRule =
  | 'commutative'        // a + b = b + a
  | 'expand_brackets'    // 2(x+1) = 2x + 2
  | 'collect_like_terms' // 2x + x = 3x
  | 'simplify_fractions' // 4/8 → 1/2

type Answer =
  // ── V1 (implement checker) ─────────────────────────────────────────────────
  | {
      type: 'numeric'
      value: number
      tolerance?: number          // ± absolute; default 0 (exact)
      accepted_range?: { min: number; max: number }  // alternative to tolerance
      units?: string              // "m", "cm²" etc. — displayed only, not validated V1
    }
  | {
      type: 'fraction'
      numerator: number
      denominator: number
      // Checker: reduce both to lowest terms, compare. Also accepts decimal equivalent.
      equivalent_forms?: string[] // e.g. ["0.5", "50%"] — accept these strings too
    }
  | {
      type: 'multiple_choice'
      correct: string             // must match one option exactly (trimmed)
    }
  | {
      type: 'multi_select'
      correct: string[]           // set equality — order does not matter
    }

  // ── V3/Phase 3 (schema reserved; NO checker in V1 or V2) ──────────────────
  | {
      type: 'ordering'
      sequence: string[]          // correct left-to-right order
    }
  | {
      type: 'matching'
      pairs: Array<{ left: string; right: string }>
    }
  | {
      type: 'expression'
      canonical: string           // e.g. "2x + 3"
      normalisation_rules?: NormalisationRule[]
    }
  | {
      type: 'diagram'
      spec: Record<string, unknown>  // TBD — Phase 3 placeholder
    }
```

---

## JSON schema (question file format)

Replace `"correct": "string"` with an `answer` object at the question level:

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
  ...
}
```

```json
{
  "id": "AC9M7N04-001",
  "type": "numeric",
  "stem": "What is 3.7 + 2.85? Give your answer to 2 decimal places.",
  "answer": {
    "type": "numeric",
    "value": 6.55,
    "tolerance": 0.005
  },
  ...
}
```

```json
{
  "id": "AC9M7N07-001",
  "type": "numeric",
  "stem": "What is \\(\\frac{1}{4} + \\frac{1}{4}\\)? Write your answer as a fraction.",
  "answer": {
    "type": "fraction",
    "numerator": 1,
    "denominator": 2,
    "equivalent_forms": ["2/4", "0.5", "50%"]
  },
  ...
}
```

---

## V1 checker specifications (for Claude Code to implement in `src/lib/answer.ts`)

### `numeric` checker
```
isCorrect(studentInput, answer):
  n = parseFloat(studentInput.replace(/,/g, '').trim())
  if isNaN(n): return false
  if answer.accepted_range: return answer.accepted_range.min ≤ n ≤ answer.accepted_range.max
  return |n - answer.value| ≤ (answer.tolerance ?? 0)
```
Edge cases: trailing units text (strip non-numeric suffix), comma thousands separator,
negative numbers ("-3"), scientific notation ("1.2e3").

### `fraction` checker
```
isCorrect(studentInput, answer):
  // Accept fraction string "a/b" or decimal or equivalent_forms
  if studentInput in answer.equivalent_forms (case-insensitive trim): return true
  parsed = parseFraction(studentInput)  // handles "3/6", "0.5", "50%"
  if parsed == null: return false
  // Reduce both to lowest terms via GCD, compare
  return reduce(parsed) == reduce({ numerator: answer.numerator, denominator: answer.denominator })
```

### `multiple_choice` checker
```
isCorrect(studentInput, answer):
  return studentInput.trim() === answer.correct.trim()
```

### `multi_select` checker
```
isCorrect(studentInput[], answer):
  return setEquals(studentInput.map(trim), answer.correct.map(trim))
```

---

## Content gate update

Add to `content-gate.test.ts`:
- Every question has an `answer` object (not a bare `correct` string)
- `answer.type` is one of the eight defined types
- V1 build: questions with `answer.type` in `['ordering','matching','expression','diagram']`
  are flagged as NOT_YET_IMPLEMENTED and excluded from the build (content gate fails the
  build if such questions are marked `verified: true` without a corresponding checker)

---

## Migration note for existing AC9M7N01.json

All five existing questions must be migrated from `"correct": "12"` to
`"answer": { "type": "multiple_choice" | "numeric", ... }`. See the updated file.

---

## Open questions for ratification

1. Should `units` be validated in V1 (reject "15m" when answer is `value: 15, units: "m"`)
   or display-only? Recommendation: display-only in V1 — parsing unit strings is complex and
   rarely wrong.
2. For `fraction`, should `"0.5"` always be accepted as equivalent to `1/2`? Pedagogically
   some questions want fractions only. Recommendation: add an optional `decimal_accepted: false`
   flag to `fraction` answers; default true.
