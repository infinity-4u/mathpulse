# LLM Review Brief — Australian Maths App

*This document is self-contained. Paste it to another LLM along with any specific file(s) you want reviewed. It gives the reviewer everything they need to understand context, constraints, and what to look for.*

---

## What you are reviewing

A greenfield educational software project — a curriculum-aligned maths practice platform for Australian secondary students (Years 7–10, ACARA curriculum). The project has completed its Phase 0 setup (governance, schema, guardrails, scaffold) and is about to begin Phase 1 (first vertical slice of working product).

The owner is a PhD researcher building a real product, not a prototype. It will eventually serve school students and be used in procurement conversations with Australian state education departments. Accuracy, privacy, and legal compliance matter.

---

## The binding constraint document

Everything in the project is governed by `CONTRACT.md`. Its key rules:

- **Scope:** V1 is Years 7–10 ACARA only. No Years 11–12, no runtime AI, no gamification, no native apps, no in-app messaging.
- **Privacy:** Collect only student display name + year level, teacher/parent name + email. Never dob, address, phone, government IDs. No student self-registration. No third-party analytics SDKs. All data in Australia (Supabase Sydney, ap-southeast-2).
- **Architecture:** Curriculum content is static JSON (not database rows). DB holds only accounts, class structure, and progress. No LLM calls during a student session. RLS at the database level (Supabase), never application logic only.
- **Content:** No question ships with `verified: false`. Minimum 20 questions per substrand at launch. Repair logic is deterministic rules over the static bank — not an LLM.
- **Process:** Human review required before merging changes to auth, DB schema, RLS, privacy flows, data residency config, or content verification gate.

---

## What has been produced

### Governance documents (read in this order)
1. `CLAUDE.md` — auto-loaded project memory for Claude Code; non-negotiables, stack, where things live
2. `docs/CONTRACT.md` — binding invariants, escalation rules
3. `docs/PLAN.md` — phases, agentic architecture, tripwire spec, definition of done
4. `docs/README.md` — reading order index

### Product documents
- `docs/spec.md` — product vision, users, V1 feature list (Years 7–10 only), Milo UX principles folded in without AI, open questions
- `docs/architecture.md` — committed stack (Next.js + Supabase Sydney + KaTeX), full data model with SQL, auth model (no student auth.users rows), deterministic repair logic, offline capability
- `docs/compliance.md` — Australian Privacy Act APP-to-tripwire mapping, state education procurement notes, Phase 0 vs Phase 4 deliverables
- `docs/curriculum-structure.md` — full ACARA Years 7–10 taxonomy with content description codes, state senior pathway overview for V2

### Legal drafts (need solicitor review before use)
- `docs/privacy-policy-DRAFT.md` — Australian-law privacy policy covering APPs 1, 3, 5, 6, 8, 11
- `docs/dpa-template-DRAFT.md` — Data Processing Agreement template for schools

### Code
- `supabase/migrations/0001_initial_schema.sql` — 9 tables, full RLS, CASCADE hard-delete, no PII columns
- `src/lib/repair.ts` — deterministic repair engine: `isCorrect()`, `detectErrorType()`, `nextRepairStep()` — pure functions, no AI, fully unit-testable
- `src/theme/tokens.ts` — design tokens with a11y contrast values and calm mode

### Tests / guardrails (19/19 pass clean; 6 deliberate violations caught)
Seven tripwire tests enforce CONTRACT.md as CI checks:
`no-tracker` · `no-PII-field` · `rls-on` · `au-region` · `no-runtime-ai` · `content-gate` · `hard-delete`

### Sample content
- `content/curriculum/year-7/number/AC9M7N01.json` — 5 verified questions on perfect squares/square roots, demonstrating the full schema including common_errors with typed error classification (conceptual/procedural/careless)

---

## The Phase 2 AI question

V1 has no AI at runtime. Phase 2 is where generative AI enters the picture — and the question for reviewers is whether the proposed boundaries are right.

**Planned AI uses in Phase 2 (AI assists humans, never replaces verification):**
1. Draft question generation — LLM drafts, mathematician verifies, human sets `verified: true`
2. Worked solution drafting — same human-in-the-loop pattern
3. Common error pattern suggestion — LLM proposes, human types and approves
4. Hint sequence drafting — LLM drafts 3-step sequence, human reviews pedagogical structure

**Planned AI use in V2 (runtime, with constraints):**
Runtime AI hints — backend API route only, tight system prompt, no student PII in the prompt, context window limited to current question + last 3 attempts, output mathematically validated before display. Requires compliance review of the data flow against APP 3 and APP 6.

**Question for reviewers:** Are these AI boundaries correct? Is there a V1 use case for AI that is being missed by excessive caution? Is there a V2 use case that creates risk not currently identified?

---

## What to review — suggested focus areas

### 1. Schema and RLS (high stakes)
Read `supabase/migrations/0001_initial_schema.sql`. Questions to consider:
- Is the student_profiles model (no auth.users row, accessed via parent session) the right architecture for under-15 users? Any gaps?
- Are the RLS policies sufficient? Consider: can a teacher in Class A ever see sessions from a student in Class B? Can a parent see another parent's child?
- Is CASCADE hard-delete complete? Are there any orphan paths?
- The schema uses `TEXT NOT NULL CHECK (state IN (...))` rather than an enum. Any issue with that?

### 2. Compliance gaps
Read `docs/compliance.md` and `docs/privacy-policy-DRAFT.md`. Questions:
- Are the APP obligations correctly mapped? Anything missed?
- The privacy policy says "we retain data for as long as the account is active" — is that sufficient under Australian law, or does it need a specific maximum retention period?
- The DPA template limits liability to "fees paid in the preceding 12 months" — is that appropriate for an educational platform serving minors?
- The project notes that Australia has no direct COPPA equivalent and handles under-15 consent via architectural enforcement (no child self-registration). Is there an emerging Australian regulatory position on this that the project should anticipate?

### 3. Deterministic repair engine
Read `src/lib/repair.ts`. Questions:
- Is the `detectErrorType()` function too simplistic? It matches on exact answer strings. For numeric questions with tolerance, should it also do range-based error detection?
- The repair sequence always shows hints in order [0] → [1] → [2] regardless of error type. The error type only annotates the hint, it doesn't change the sequence. Is that pedagogically sound, or should error type drive different hint paths?
- Is the `isCorrect()` function correct for all edge cases (empty string, whitespace, numeric formatting with commas)?

### 4. Content schema
Read `content/curriculum/year-7/number/AC9M7N01.json`. Questions:
- Is the question schema complete for Years 7–10 ACARA maths? What question types are missing (e.g., matching, ordering, diagram-based)?
- The schema has a single `correct` field (string). For numeric answers that accept a range (e.g., any answer between 14.9 and 15.1), should `correct` be an object `{ value: 15, tolerance: 0.1 }` rather than a string?
- Is 20 questions per substrand the right minimum? ACARA has roughly 50 substrands across Years 7–10 — that's 1,000 questions minimum. Is that achievable with a human-in-the-loop verification process?

### 5. Scope and prioritisation
Read `docs/spec.md` and `docs/PLAN.md`. Questions:
- Is the "10 teachers in 3 months" success metric the right one? What would cause it to be misleading (e.g., 10 teachers each using it once)?
- The Phase 1 vertical slice is AC9M7N01 specifically. Is this the right substrand to prove the model, or should it be a more commonly-taught topic (e.g., fractions or linear equations)?
- The parent "tonight's 3 questions" feature selects from substrands where accuracy < 70%. Is 70% the right threshold? Should it be configurable per teacher?

### 6. Phase 2 AI architecture
Considering the compliance posture and the student age range (12–15):
- What guardrails are missing from the proposed runtime AI hint system (V2)?
- Is there a case for using AI for content discovery (helping a teacher find the right substrand) rather than student-facing hints?
- The project proposes "no student PII in the prompt." Given that the context would include question_id, answer_given, and hints_used, what is the minimum safe context for a useful AI hint without creating a compliance issue?

---

## What NOT to suggest

Per CONTRACT.md §1, the following are explicitly out of V1 scope. Do not suggest adding them:
- Years 11–12 content
- Runtime AI in the student path
- Adaptive difficulty engine
- Gamification (badges, streaks, leaderboards)
- Native mobile apps
- In-app messaging
- Third-party analytics

Suggesting these is not wrong — but flag them as V2 proposals, not V1 changes.

---

## Files to request for deeper review

If you want to go deeper on any specific area, ask for:
- `docs/CONTRACT.md` — full binding rules
- `docs/architecture.md` — full data model and stack decisions
- `supabase/migrations/0001_initial_schema.sql` — full schema with RLS policies
- `src/lib/repair.ts` — full repair engine
- `tests/tripwires/` — any specific tripwire test
- `content/curriculum/year-7/number/AC9M7N01.json` — full sample question file
- `docs/compliance.md` — full APP mapping and state requirements
