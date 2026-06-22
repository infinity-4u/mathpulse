# PROPOSAL — Demand-Driven Content Priority + Phase 1 Misconception-Slice Topic
**Status: AWAITING RATIFICATION** (topic choice only — priority order is informational).
Cross-reference: docs/curriculum-structure.md, docs/spec.md, CONTRACT.md §5.

---

## Demand-driven content priority (informational — no ratification needed)

Priority is determined by three signals: NAPLAN gap data, teacher-reported pain points
(published ACER research), and the answer-type coverage needed to prove the V1 checker set.

### Tier 1 — Author first (highest student impact + tests V1 checkers)
| Substrand | ACARA codes | Year | Why |
|---|---|---|---|
| Fraction operations | AC9M7N07, AC9M7N08 | 7 | #1 NAPLAN gap; tests `fraction` checker |
| Integers (+ − × ÷) | AC9M7N06 | 7 | Foundation for all algebra; tests `numeric` with negatives |
| Percentages | AC9M7N09, AC9M8N05 | 7–8 | High exam weighting; real-world relevance |
| Linear equations | AC9M7A02, AC9M8A02 | 7–8 | Gateway to senior; tests `numeric` and future `expression` |
| Pythagoras | AC9M9M02 | 9 | High Year 9 exam weighting; clear right/wrong |
| Linear relationships | AC9M8A04 | 8 | Slope/intercept misconceptions well-documented |

### Tier 2 — Author second (important but lower misconception density)
Year 7–8 Measurement, Year 9 Statistics and Probability, Year 9–10 trigonometry

### Tier 3 — Author last (smaller cohort or lower exam weighting)
Year 7 Space (geometry), Year 10 Circle Geometry, Year 10 Vectors

### Minimum to reach launch gate
50 substrands × 20 questions = 1,000 questions minimum. At 5 questions/hour (draft + verify),
that is 200 person-hours of content work. Phase 2 AI-drafted questions (human-verified) are
essential to hit this at any reasonable speed.

---

## Phase 1 misconception-slice topic recommendation

### The three candidates

**Option A: Fractions (AC9M7N07 — addition/subtraction with related denominators)**
- Misconception density: very high. The "add numerators and denominators" error
  (`added_numerators_denominators` detection rule) is the single most common Year 7 maths
  misconception in Australian NAPLAN data.
- Answer type: `fraction` — exercises the equivalence checker (non-trivial; 1/2 = 2/4).
- Detection rules exercised: `added_numerators_denominators`, `numerator_denominator_swapped`,
  `did_not_simplify`.
- Repair primitive: `visual_model` (fraction bar) is the pedagogically ideal repair — but
  it's a Phase 3 primitive. V1 uses `contextual_hint` + `worked_example`.
- Risk: `fraction` input UX (typing "1/2" on mobile) needs a keypad component.

**Option B: Integers (AC9M7N06 — operations with negative numbers)**
- Misconception density: high. Sign errors on subtraction of negatives ("two minuses make a
  plus" applied incorrectly) are extremely common.
- Answer type: `numeric` — simplest checker; already specified.
- Detection rules exercised: `sign_error`, `answer_equals_2x_value`.
- Risk: low technical risk; the answer schema is simplest.
- Weakness: `numeric` checker is already exercised by AC9M7N01. Less new coverage.

**Option C: Linear equations (AC9M7A02 — solve simple linear equations)**
- Misconception density: high. "Change side, change sign" errors are well-documented.
- Answer type: `numeric` (V1 — solve for x gives a number) or future `expression`.
- Detection rules exercised: `sign_error`, `wrong_operation`, `off_by_one`.
- Risk: moderate — equations with variables feel different from arithmetic; question
  authoring is more complex.

### Recommendation: **Option A — Fractions (AC9M7N07)**

**Reasoning:**

1. **Highest pedagogical leverage.** Fraction errors are the most common gateway misconception
   in Years 7–10 ACARA. If the repair system works for fractions, it handles the hardest
   case.

2. **Exercises the non-trivial checker.** `fraction` equivalence checking (`1/2 = 2/4 = 3/6`)
   is the most technically demanding V1 checker. Proving it in Phase 1 de-risks Phase 2
   content at scale.

3. **Forces the keypad/input UX decision.** Fraction input on mobile (typing "1/2") needs
   a custom input component. Better to discover the UX challenges in Phase 1 than Phase 3.

4. **Two slices, complementary coverage.** AC9M7N01 (perfect squares — numeric, MC) +
   AC9M7N07 (fractions — fraction type, mobile input) together cover three of the four V1
   answer types. Only `multi_select` remains for Phase 2.

5. **Detection rules are specific and documentable.** `added_numerators_denominators` is
   the canonical fraction error — the rule is unambiguous to implement and test.

### The two-slice package for Phase 1

| Slice | ACARA code | Answer types | Detection rules exercised |
|---|---|---|---|
| Perfect squares / square roots | AC9M7N01 | `numeric`, `multiple_choice` | `answer_equals_half_value`, `answer_matches`, `near_numeric` |
| Fraction addition/subtraction | AC9M7N07 | `fraction`, `numeric` | `added_numerators_denominators`, `numerator_denominator_swapped`, `did_not_simplify` |

---

## Awaiting ratification on topic choice

Present to human: is **AC9M7N07 (fractions)** approved as the second Phase 1 slice alongside
AC9M7N01? If preferred: AC9M7N06 (integers) or AC9M7A02 (linear equations).
