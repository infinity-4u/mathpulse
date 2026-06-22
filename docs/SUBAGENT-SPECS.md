# Subagent Specifications
Cross-reference: docs/PLAN.md → Agentic architecture, CONTRACT.md (binding on all subagents).

Each subagent below is a Claude Code instance spun up for a bounded, reviewable task.
All subagents must read CONTRACT.md first. None may touch scope-locked paths
(auth, DB schema, RLS, privacy, data residency) without a STOP + human escalation.

---

## Subagent 1: RLS / Privacy Reviewer

**Purpose:** Independent review of every migration and RLS policy before merge. Catches
privacy regressions that Claude Code (the builder) might miss because it wrote the code.

**Trigger:** Any PR that touches `supabase/migrations/`, `.env.example`,
`supabase/config.toml`, or any file in `src/` that calls Supabase directly.

**Input:**
- The diff of the PR (files changed)
- Current `supabase/migrations/` folder (all migrations, in order)
- `docs/CONTRACT.md`
- `docs/compliance.md`
- `docs/proposals/SPEC4-RLS-TEST-MATRIX.md`

**Task:**
1. Read CONTRACT.md completely before anything else.
2. For every new or modified table: confirm `ALTER TABLE x ENABLE ROW LEVEL SECURITY` is
   present. Fail the review if missing.
3. For every new RLS policy: trace the policy logic against the SPEC4 actor matrix. Confirm:
   - Each ALLOW row in the must-SEE table has a corresponding policy that grants it.
   - Each DENY row in the must-NOT-see table is NOT granted by any policy. Test by
     constructing a counter-example (does any policy accidentally allow Actor X to see
     Resource Y?).
4. Check for new columns: flag any column name that appears on the PII denylist
   (`dob`, `birth`, `address`, `phone`, `ssn`, `medicare`, `passport`, `email` on
   `student_profiles` specifically). Do not flag `pin_hash` — it is whitelisted.
5. Check for service-role key usage: any `supabaseAdmin` or `serviceRole` call in `src/`
   that is not inside a server-side API route (`src/app/api/`) is a violation.
6. Check data residency: `supabase/config.toml` region must remain `ap-southeast-2`.
7. Output: a structured review with sections PASS / FAIL / WARNINGS. Any FAIL blocks merge.
   Any WARNING requires human acknowledgement before merge.

**Scope limits:**
- Read-only on source files. Writes only a review comment (output text, no file edits).
- May not suggest architectural changes to RLS (only flag violations of the existing spec).
- Any uncertainty about whether something violates CONTRACT.md: escalate, do not guess.

**Estimated run time:** < 5 minutes per PR.

---

## Subagent 2: Content Validator

**Purpose:** Validate new question JSON files against the schema before they enter the
verified bank. Catches malformed JSON, schema violations, missing required fields, and
factual errors that would be caught by structure checks (not a mathematician — factual
verification is a human job).

**Trigger:** Any PR that adds or modifies files under `content/curriculum/`.

**Input:**
- The new or modified `.json` file(s)
- `docs/proposals/SPEC2-ANSWER-SCHEMA.md` (answer schema spec)
- `docs/proposals/SPEC3-ERROR-REPAIR-SCHEMA.md` (error/repair schema spec)
- `CONTRACT.md` §5

**Task:**
1. Read CONTRACT.md §5 completely first.
2. For each question in each file, validate:

   **Required fields present:**
   - `id` — format `AC9M[Year][Strand][Number]-[XXX]` (e.g. `AC9M7N01-001`)
   - `type` — one of `multiple_choice | numeric`  (V1 only)
   - `stem` — non-empty string
   - `answer` — object conforming to SPEC2 (typed, not bare `correct` string)
   - `difficulty` — integer 1, 2, or 3
   - `hints.default` — array of exactly 3 strings
   - `worked_solution` — non-empty string
   - `verified` — must be `true` at file level (no unverified questions ship)

   **Answer schema conformance (SPEC2):**
   - `answer.type` is one of the 8 defined types
   - V1 check: flag (but don't fail) if `answer.type` is Phase 3 type (`ordering`,
     `matching`, `expression`, `diagram`) — these need a content-gate exclusion note
   - For `multiple_choice`: `answer.correct` exists and matches one of `options[]`
   - For `numeric`: `answer.value` is a finite number; `answer.tolerance` ≥ 0 if present
   - For `fraction`: `answer.numerator` and `answer.denominator` are integers;
     `answer.denominator` ≠ 0

   **Error/repair schema conformance (SPEC3):**
   - Each `common_errors[].id` is unique within the question
   - Each `detect.rule` is one of the named rules in SPEC3 detection rule library
   - Each `repair_path` element is one of the named primitives in SPEC3 primitive library
   - `repair_path` length ≤ 3
   - Each `common_errors[]` has a non-empty `contextual_hint`

   **LaTeX sanity check:**
   - All strings containing `\\(` have a matching `\\)` (balanced delimiters)
   - No raw `<` or `>` in stems (should use KaTeX or HTML entities)

   **ACARA code cross-reference:**
   - The filename matches the `code` field in the JSON
   - The `year` and `strand` fields are consistent with the ACARA code prefix

3. Output: a table of questions × checks with PASS/FAIL per check. Any FAIL blocks merge.
   `verified: true` may only be accepted by the subagent if ALL structural checks pass —
   mathematical correctness must be separately confirmed by a human reviewer.

4. Generate a summary line: `N questions validated, M PASS, K FAIL, P WARNINGS.`

**Scope limits:**
- Does NOT verify mathematical correctness of answers, hints, or worked solutions.
  That is the human mathematician reviewer's job.
- Does NOT modify question files. Output only.
- Does NOT create questions. Only validates.

**Estimated run time:** < 3 minutes per file.

---

## Subagent 3: Repair Engine Reviewer

**Purpose:** Verify that `src/lib/repair.ts` and `src/lib/answer.ts` implement the
spec correctly after any change. Pure logic review — no database, no network.

**Trigger:** Any PR that modifies `src/lib/repair.ts`, `src/lib/answer.ts`,
or `tests/unit/repair.test.ts`.

**Input:**
- The full content of `src/lib/repair.ts`
- The full content of `src/lib/answer.ts`
- The full content of `tests/unit/repair.test.ts`
- `docs/proposals/SPEC2-ANSWER-SCHEMA.md`
- `docs/proposals/SPEC3-ERROR-REPAIR-SCHEMA.md`

**Task:**
1. For each V1 checker in SPEC2 (`numeric`, `fraction`, `multiple_choice`, `multi_select`):
   - Confirm a corresponding exported function exists in `answer.ts`
   - Trace the logic against the pseudocode spec in SPEC2
   - Identify any edge case from the spec that is NOT covered by a test in `repair.test.ts`
   - For `numeric`: confirm comma-thousand separator, trailing units, negative numbers, and
     scientific notation are handled (or explicitly excluded with a comment)
   - For `fraction`: confirm GCD reduction and decimal equivalence are handled

2. For each detection rule in SPEC3 that is referenced by any question in `content/`:
   - Confirm the rule is implemented in `repair.ts` (function or case branch)
   - Trace a sample call through the logic to confirm it would fire correctly

3. For `nextRepairStep`:
   - Confirm the priority order: common_errors match first, fallback to default hints
   - Confirm `worked_solution` unlocks after repair_path exhausted OR after default hint 3
   - Confirm the function returns a `RepairStep` discriminated union (not a raw string)

4. For `RepairState`:
   - Confirm `matchedErrorId` and `repairPathIndex` are tracked
   - Confirm `initialRepairState()` returns zeroed state

5. List any unit test that is missing for spec-required behaviour. These are not blocking
   (the reviewer does not write tests) but must be listed for the builder to address.

6. Output: SPEC CONFORMANCE: PASS/FAIL with specific line citations for any failure.
   Test coverage gaps listed as WARNINGS (non-blocking).

**Scope limits:**
- Does NOT modify source files.
- Does NOT run tests (the CI runner does that).
- Does NOT review files outside `src/lib/repair.ts`, `src/lib/answer.ts`,
  and their test file.
- If the repair logic touches auth, DB, or RLS: escalate immediately (this function
  must be pure — any DB call in repair.ts is a CONTRACT.md violation).

**Estimated run time:** < 5 minutes per PR.
