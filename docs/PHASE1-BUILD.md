# PHASE 1 BUILD BRIEF — Australian Maths App
**For: Claude Code (builder agent)**
**Status: PENDING RATIFICATION of SPEC1–SPEC4 and misconception-slice topic.**
Do not begin implementation until Cowork confirms ratification.

Read CONTRACT.md completely before any file edit. Every item in §1–§6 is non-negotiable.

---

## What Phase 1 is

A working vertical slice of the student practice loop, deployed to staging, that a real
teacher can use with a real class. Two substrands only (AC9M7N01 + AC9M7N07, pending
ratification of topic). Every Phase 0 invariant still holds; new code does not weaken
any tripwire.

---

## Prerequisites (Phase 0 must be complete before Phase 1 starts)

- [ ] All 7 tripwires passing in CI
- [ ] `supabase/migrations/0001_initial_schema.sql` deployed to staging Supabase instance
- [ ] `.env.example` variables documented; `.env.local` populated for local dev
- [ ] User terminal has run: `git add -A && git commit -m "Phase 0: scaffold, guardrails, and tripwires"`
- [ ] SPEC1–SPEC4 ratified by human (gate — wait for Cowork confirmation)
- [ ] Phase 1 topic (AC9M7N07) ratified by human (gate — wait for Cowork confirmation)

---

## Build order (strict — do not skip steps)

### Step 1: Schema migration for student PIN (SPEC1)

**File:** `supabase/migrations/0002_student_pin.sql`

```sql
ALTER TABLE student_profiles
  ADD COLUMN pin_hash TEXT;
-- bcrypt hash; NULL until parent sets a PIN
-- NOT a PII field (hash only, not the PIN itself)
```

After adding: re-run `no-pii-field` tripwire and confirm it still passes.
`pin_hash` is on the whitelist in the tripwire — do not add it to the denylist.

### Step 2: RLS additions for student JWT (SPEC1)

Add to `supabase/migrations/0002_student_pin.sql` (or a new `0003_student_rls.sql`):

```sql
-- practice_sessions: student reads/inserts own
CREATE POLICY "student_reads_own_sessions" ON practice_sessions
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'student'
    AND (auth.jwt() ->> 'student_id')::UUID = practice_sessions.student_id
  );

CREATE POLICY "student_inserts_own_sessions" ON practice_sessions
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role') = 'student'
    AND (auth.jwt() ->> 'student_id')::UUID = student_id
  );

-- question_attempts: student inserts (reads via session join)
CREATE POLICY "student_inserts_own_attempts" ON question_attempts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM practice_sessions ps
      WHERE ps.id = question_attempts.session_id
      AND (auth.jwt() ->> 'student_id')::UUID = ps.student_id
      AND (auth.jwt() ->> 'role') = 'student'
    )
  );

-- class_enrolments: student reads own
CREATE POLICY "student_reads_own_enrolments" ON class_enrolments
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'student'
    AND class_id = ANY(
      ARRAY(SELECT jsonb_array_elements_text(auth.jwt()->'class_ids'))::UUID[]
    )
    AND student_id = (auth.jwt() ->> 'student_id')::UUID
  );

-- assignments: student reads (for class they're enrolled in)
CREATE POLICY "student_reads_assignments" ON assignments
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'student'
    AND class_id = ANY(
      ARRAY(SELECT jsonb_array_elements_text(auth.jwt()->'class_ids'))::UUID[]
    )
  );
```

**After adding:** Run the RLS subagent (Subagent 1) review before proceeding.

### Step 3: RLS integration tests (TDD — write tests before auth routes)

**File:** `tests/integration/rls.test.ts`

Implement the full SPEC4 negative-test matrix (26 DENY assertions + 5 destructive tests).
All tests must pass against the local Supabase instance before Step 4 begins.

Run with: `SUPABASE_TEST_URL=... vitest run tests/integration/rls.test.ts`

Any failing DENY test is a blocking issue — do not proceed to Step 4 until all pass.

### Step 4: Answer + repair engine (SPEC2 + SPEC3)

**Files to create/modify:**
- `src/lib/answer.ts` — new file (replaces `isCorrect` in repair.ts)
- `src/lib/repair.ts` — refactor per SPEC3 spec
- `tests/unit/answer.test.ts` — new
- `tests/unit/repair.test.ts` — update

**answer.ts exports:**
```typescript
export type Answer = /* SPEC2 discriminated union */
export type NormalisationRule = /* SPEC2 */
export function isCorrect(studentInput: string | string[], answer: Answer): boolean
export function parseFraction(input: string): { numerator: number; denominator: number } | null
export function gcd(a: number, b: number): number
```

**repair.ts exports (updated per SPEC3):**
```typescript
export type DetectionRule = /* named rules from SPEC3 */
export type RepairPrimitive = /* named primitives from SPEC3 */
export interface CommonError { id, type, detect, repair_path, contextual_hint }
export interface RepairState { hintsUsed, workedSolutionUnlocked, matchedErrorId, repairPathIndex }
export type RepairStep = /* discriminated union from SPEC3 */
export function detectError(question: Question, studentAnswer: string): CommonError | null
export function nextRepairStep(question: Question, state: RepairState, options?): RepairStep
export function initialRepairState(): RepairState
```

**Test coverage required:**
- `isCorrect`: numeric (exact, tolerance, comma separator, negative, trailing units)
- `isCorrect`: fraction (lowest terms, decimal equivalent, equivalent_forms list)
- `isCorrect`: multiple_choice (exact match, case-trim)
- `detectError`: each detection rule with a matching and non-matching example
- `nextRepairStep`: matched error path, default hint fallback, worked solution unlock
- `initialRepairState`: returns expected zeros

Run: `vitest run tests/unit/` — all pass before Step 5.

### Step 5: API routes — student auth (SPEC1)

**Files:**
- `src/app/api/auth/student-token/route.ts`
- `src/app/api/auth/pin/route.ts`

**student-token route:**
```typescript
// POST /api/auth/student-token
// Body: { student_id: string }
// Auth: requires valid parent Supabase JWT (Authorization: Bearer <parent_jwt>)
// 1. Verify parent JWT via Supabase
// 2. Confirm parent_student row exists for (parent_id, student_id)
// 3. Fetch student's class_ids from class_enrolments
// 4. Sign JWT: { sub: student_id, role: 'student', student_id, class_ids, exp: now + 8h }
//    using process.env.SUPABASE_JWT_SECRET
// 5. Return { token, expires_at }
```

**pin route:**
```typescript
// POST /api/auth/pin
// Body: { pin: string }
// No auth header required
// Rate limit: 5 req/min per IP; lockout after 10 failures in 5 min
// 1. SELECT id, class_ids FROM student_profiles
//    WHERE pin_hash = crypt($pin, pin_hash) LIMIT 1
//    (use service-role key ONLY for this lookup — RLS cannot key on bcrypt)
// 2. If found: sign JWT same as above; return { token, expires_at }
// 3. If not found: 401 { error: 'invalid_pin' } — never reveal whether PIN exists
// 4. Log: only student_id (UUID) if successful; nothing if failed (no PII in logs)
```

**Security requirements:**
- `SUPABASE_JWT_SECRET` never logged, never returned to client
- Rate limiting is enforced at the route level (not a middleware placeholder)
- The PIN is never stored — only `pin_hash` in the DB; the raw PIN never appears in logs

### Step 6: Parent account flows

- `src/app/(auth)/parent/register/page.tsx` — parent creates account (email + password via Supabase Auth)
- `src/app/(auth)/parent/child/new/page.tsx` — add child (display_name + year_level; no email/dob)
- `src/app/(auth)/parent/child/pin/page.tsx` — set PIN for a child (6 digits; calls PATCH `/api/student/pin`)
- `src/app/(auth)/parent/switch-to-child/page.tsx` — parent grants child session (calls student-token route; stores JWT in React context)
- `src/app/api/student/pin/route.ts` — PATCH; sets pin_hash on student_profiles (parent auth required)

### Step 7: Teacher account flows

- `src/app/(auth)/teacher/register/page.tsx` — teacher creates account (invite-only V1: requires invite_code token)
- `src/app/(auth)/teacher/class/new/page.tsx` — create class, receive join code
- `src/app/(auth)/teacher/class/[id]/page.tsx` — class detail: student list, assignment progress
- `src/app/(auth)/teacher/class/[id]/assign/page.tsx` — assign substrand to class with due date

### Step 8: Student practice session

- `src/app/practice/page.tsx` — question display (uses QuestionCard component)
- `src/app/practice/session/[substrand]/page.tsx` — practice session for a substrand
- `src/components/practice/QuestionCard.tsx` — renders stem (KaTeX), answer input, check button
- `src/components/practice/MCOption.tsx` — multiple choice option button
- `src/components/practice/NumericInput.tsx` — numeric input with unit label
- `src/components/practice/FractionInput.tsx` — two-field fraction input (ratified separately)
- `src/components/practice/RepairBand.tsx` — amber wrong-answer state (CONTRACT.md §4: never red)
- `src/components/practice/HintCard.tsx` — progressive hint display with counter
- `src/components/practice/WorkedSolution.tsx` — full worked solution display
- `src/components/practice/CorrectBand.tsx` — green correct-answer state
- Progress written to `practice_sessions` + `question_attempts` via Supabase (student JWT)

### Step 9: Teacher dashboard

- `src/app/teacher/dashboard/page.tsx` — class list with assignment progress summary
- `src/components/teacher/ClassCard.tsx`
- `src/components/teacher/StudentRow.tsx`
- Data: read from `practice_sessions` + `question_attempts` + `class_enrolments` (teacher JWT)

### Step 10: Parent progress view

- `src/app/parent/dashboard/page.tsx` — child's practice history per substrand
- `src/app/parent/tonight/page.tsx` — deterministic "tonight's 3 questions" view
- Deterministic selection: 3 questions from substrands where `accuracy < 0.70` in last 7 days;
  selected by lowest question_id (deterministic, not random — no AI, no personalisation engine)

### Step 11: E2E tests

**File:** `tests/e2e/phase1.test.ts` (Playwright, or Vitest + jsdom for component-level)

Required scenarios:
1. Parent registers → adds child → sets PIN → switches to child session
2. Student (via parent-grant) practices AC9M7N01: correct answer → next question
3. Student gets wrong answer → sees amber repair state → requests hint → sees hint
4. Student exhausts 3 hints → sees worked solution → proceeds
5. Teacher creates class → sees student progress after student practice
6. Parent views "tonight's 3 questions" after child practice
7. Parent hard-deletes child → all practice data gone (verify via DB query)

### Step 12: Accessibility audit

Run `axe` on every screen component. Fix all critical and serious violations.
Validate keyboard navigation order on screens 1–7 (design spec).
Manual VoiceOver test on practice session (Question → Check → Repair → Hint flow).

---

## What NOT to build in Phase 1

- Adaptive difficulty (any kind) — CONTRACT.md §1
- Email notifications to parent — in-app only in V1
- Any AI/LLM call in the student path — CONTRACT.md §4
- Open teacher registration — invite-only; no self-service sign-up
- Years 9–10 content — AC9M7N01 + AC9M7N07 only in Phase 1
- `visual_model` repair primitive — Phase 3
- Gamification (badges, streaks, points) — CONTRACT.md §1
- Any LMS integration — CONTRACT.md §1

If a feature not in this list is needed to make Phase 1 work: STOP and ask.

---

## Definition of Done for Phase 1 merge

- [ ] All 7 Phase 0 tripwires still passing
- [ ] RLS integration tests (SPEC4): 26 DENY + 5 destructive tests all pass
- [ ] Unit tests (answer + repair): 100% of spec-required cases covered
- [ ] E2E tests (Step 11): all 7 scenarios pass on staging Supabase instance
- [ ] axe audit: zero critical or serious violations across all screens
- [ ] Subagent 1 (RLS Reviewer) PASS on the migration PR
- [ ] Subagent 2 (Content Validator) PASS on AC9M7N07 question file
- [ ] Subagent 3 (Repair Engine Reviewer) PASS on answer.ts + repair.ts PR
- [ ] No `console.log` containing student display_name, parent email, or PIN
- [ ] No `localStorage` or `sessionStorage` usage anywhere in `src/`
- [ ] `supabase/config.toml` region still `ap-southeast-2`
- [ ] At least one real teacher has completed the full flow on staging (human smoke test)

---

## Scope escalation — STOP and ask Cowork if

- Any new column on `student_profiles`, `parent_profiles`, or `teacher_profiles`
- Any change to RLS policies not already in SPEC1/SPEC4
- Any new third-party dependency in `package.json`
- Any data written to Supabase that is not a UUID, timestamp, integer, or short text
- Any route that reads or writes to a region other than ap-southeast-2
- Any feature request from a teacher during the pilot that touches the scope-locked list
