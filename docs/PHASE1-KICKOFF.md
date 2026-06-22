# Phase 1 Kick-off — One Vertical Slice

> Read CONTRACT.md before touching anything here. Phase 0 guardrails must be green before Phase 1 code merges.

## What Phase 1 builds

One substrand end-to-end: **AC9M7N01** (Year 7 Number — perfect squares and square roots).

The slice proves every layer of the stack works together:

```
Parent/Teacher registers → creates student → student practices AC9M7N01
  → gets up to 3 hints → sees worked solution → attempt recorded
  → teacher assigns AC9M7N01 to class → parent views child's progress
```

Done when: all three journeys pass e2e, RLS isolation verified by tests, content gate green for AC9M7N01.

---

## Build order within Phase 1

Follow PLAN.md principle: TDD security/privacy invariants FIRST, then feature code.

### Step 1 — RLS isolation tests (write before any feature code)
File: `tests/integration/rls.test.ts`

Write these tests first — they will fail until the feature code makes them pass:
- Student A cannot read Student B's `practice_sessions`
- Parent can read their child's sessions but not another child's
- Teacher can read their class students' sessions but not other classes'
- Hard-delete of a student removes all their sessions and attempts (extend hard-delete tripwire)

These tests require a live Supabase test project. Set `SUPABASE_TEST_URL` and `SUPABASE_TEST_SERVICE_KEY` in `.env.test.local` (not committed).

### Step 2 — Auth flows (SCOPE-LOCKED — requires human review before merge)
Files: `src/app/register/`, `src/lib/auth.ts`, `src/app/api/auth/`

Two registration paths:
1. **Parent flow**: parent signs up → creates child profile (display_name + year_level only)
2. **Teacher flow**: teacher signs up → creates class → gets join_code → parent uses join_code to link child to class

Constraints (CONTRACT.md §2):
- No student auth.users row — students access via parent session or a child PIN
- Collect only: teacher/parent name + email; student display_name + year_level
- Consent checkbox at registration linking to privacy policy URL

### Step 3 — Practice session (student path — no LLM, see src/lib/repair.ts)
Files: `src/app/practice/[code]/page.tsx`, `src/app/api/sessions/`

- Load questions from `content/curriculum/year-7/number/AC9M7N01.json` (static import)
- Submit answer → `isCorrect()` from `src/lib/repair.ts`
- Wrong answer → `nextRepairStep()` → show hint (amber repair state, never red)
- After hint 3 → worked solution unlocks
- On completion → POST to `/api/sessions` to record `practice_session` + `question_attempts`
- Offline: queue writes to IndexedDB, sync on reconnect

### Step 4 — Teacher assignment
Files: `src/app/teacher/`, `src/app/api/assignments/`

- Teacher selects AC9M7N01 from their class dashboard
- Sets optional due date → creates `assignments` row
- Class progress view: per-student accuracy and completion for that assignment

### Step 5 — Parent progress view
Files: `src/app/parent/`

- Child's accuracy per substrand, recent sessions
- "Tonight's 3 questions": deterministic selection of 3 questions from substrands with accuracy < 70%
  (pure function over `question_attempts` aggregate — no AI)

### Step 6 — e2e tests
Files: `tests/e2e/`

Three journeys using Playwright (or equivalent):
1. Parent registers → child practices AC9M7N01 → views progress
2. Teacher creates class → assigns AC9M7N01 → views class results
3. Parent links child to class via join_code → child completes assignment

### Step 7 — A11y check
Run axe against: practice screen, hint state, worked solution, registration form.
All WCAG 2.1 AA violations are blocking (per CONTRACT.md, compliance.md).

---

## Subagents to stand up (PLAN.md)

**Content validator** (`tests/tripwires/content-gate.test.ts` already exists as CI check)
For Phase 2 content authoring, promote this into a standalone script:
`scripts/validate-content.ts` — run against a new file before committing it.
Usage: `npx tsx scripts/validate-content.ts content/curriculum/year-7/number/AC9M7N02.json`

**Privacy & security reviewer** (manual for now, automate in Phase 2)
Before any PR touches auth, schema, or RLS: the no-PII-field, rls-on, and au-region tripwires
already automate most of this. What remains manual:
- Check that new API routes don't log request bodies containing user data
- Confirm any new third-party dependency is reviewed against APP 8
Consider this a code review checklist item until Phase 2 volume justifies automation.

---

## Definition of Done — Phase 1

- [ ] RLS isolation tests pass (student/parent/teacher boundaries enforced at DB level)
- [ ] Both registration flows work (parent-led and teacher-led)
- [ ] Student can complete an AC9M7N01 practice session with hints and worked solution
- [ ] Attempt recorded correctly; hard-delete removes it completely
- [ ] Teacher can assign AC9M7N01 and view class progress
- [ ] Parent can view child progress and "tonight's 3 questions"
- [ ] All three e2e journeys pass
- [ ] axe finds zero WCAG 2.1 AA violations on touched screens
- [ ] All 7 tripwires still green
- [ ] No scope-locked changes merged without human review (check CODEOWNERS)

---

## What NOT to build in Phase 1

Per CONTRACT.md §1 — do not add, prepare for, or scaffold:
- Any other substrand (breadth is Phase 3)
- Adaptive difficulty
- Badges, streaks, or gamification
- In-app messaging
- Years 11–12 content
- Native mobile app
- Any LLM call anywhere

If you find yourself reaching for any of these, stop and re-read CONTRACT.md.

---

## First action

Write `tests/integration/rls.test.ts` with the four isolation tests listed in Step 1 above.
Run them — they should fail (no feature code yet). That failure is the correct starting state.
Then build Step 2 (auth) until the tests go green.
