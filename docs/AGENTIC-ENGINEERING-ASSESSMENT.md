# Agentic Engineering Assessment — Australian Maths App
**Prepared by:** Claude Cowork (coordinator)
**Date:** 2026-06-22
**Purpose:** Strategic assessment of the current build plan against the Software 3.0 /
agentic engineering framework. Intended for internal review and external comparison
(ChatGPT second opinion).

---

## Context for external reviewers

This document is a self-assessment of an in-progress EdTech product. Here is the
baseline:

**Product:** A curriculum-aligned maths practice platform for Australian students Years
7–10, distributed through teachers and parents. Web-first. Privacy-first. No runtime AI
in V1.

**Stack:** Next.js · Supabase (Sydney, ap-southeast-2) · KaTeX · Vercel edge (AU region).

**Current status:** Phase 1 underway. Steps 1–4 complete (schema, RLS, unit tests, answer
and repair engine). Drafting question content in parallel.

**Governing document:** `docs/CONTRACT.md` — a binding set of invariants every agent and
human must follow. Scope-locked areas require human sign-off before any agent proceeds.

**The framework being applied:** A Karpathy-derived "Software 3.0" / agentic engineering
model, which argues that in a verifiable domain, the winning move is to build a verified
feedback loop with agents generating, testing, and improving content and code — while
humans own judgment, pedagogy, privacy, and meaning. The framework explicitly warns
against building the old app faster with AI, and says the moat in verifiable domains is
the verified dataset, not the UI.

---

## Part 1: Honest assessment — what we are already doing right

The following elements of the current plan align well with the agentic engineering
framework without any pivot required.

### 1.1 CONTRACT.md IS the Software 3.0 context object

The framework's core argument is: "documentation programs the agents." Our CONTRACT.md
is exactly this. It is a machine-readable set of invariants that every Claude agent in
this repo reads first and treats as non-negotiable. It governs scope, privacy, security,
architecture, content, and escalation. Agents cite it before making changes. This is not
just documentation — it is executable governance.

Assessment: **strong alignment.** Most teams building with AI do not have this. We do.

### 1.2 Tripwires turn prose into enforced code

We have 7 CI tripwires: no-tracker, no-pii-field, rls-on, au-region, no-runtime-ai,
content-gate, hard-delete. Each fails the build if violated. This is exactly what the
framework calls "executable governance." Written rules get violated; failing CI gets
fixed.

Assessment: **strong alignment.**

### 1.3 No runtime AI in V1

The framework explicitly says: do not jump to runtime AI — first build the verifiable
feedback loop. Our V1 keeps all student-path logic deterministic. Repair is rule-based.
Hints are pre-authored. This is not caution for its own sake; it is the right
architecture for a school-facing product with under-15 users where "jagged intelligence"
would be dangerous.

Assessment: **strong alignment.**

### 1.4 Static verified content with human verification gate

Questions live in version-controlled JSON. No question ships with `verified: false`. A
human mathematician must verify before `verified: true`. The content gate tripwire
enforces this in CI. This is the correct model for a product making curriculum claims to
schools.

Assessment: **strong alignment.**

### 1.5 SPEC3 misconception taxonomy is a first-class artifact

We have a named detection rule library (`added_numerators_denominators`,
`did_not_simplify`, `sign_error`, etc.) and a repair primitive library. This is not just
content — it is a machine-readable misconception taxonomy. This is the foundation of the
"verified learning environment" framing and the future RL environment.

Assessment: **strong alignment, but underexploited** (see gaps below).

### 1.6 Phase 2 content pipeline is AI-assisted, not AI-deployed

The content pipeline is: AI draft → human verify → schema check → CI gate → content
bank. AI generates; humans certify; machines enforce. This is the correct model.

Assessment: **strong alignment.**

---

## Part 2: Honest assessment — what we are missing or should pivot

These are the genuine gaps between where we are and where the framework says we should be.

### Gap 1 — The question_attempts schema does not capture the learning trace

**What we have:** `question_attempts` records student_answer, is_correct, timestamp.

**What the framework requires:** every attempt record should also capture:
- `detected_error_id` — which misconception rule fired (or null if none matched)
- `hint_ids_shown` — array of which hint steps were presented
- `repair_success` — boolean: did the student answer correctly on the next attempt after
  receiving the hint?

**Why this matters:** Without these three fields, the data is just a score log. With them,
it is the beginning of an RL environment:
```json
{
  "question_id": "AC9M7N07-005",
  "student_answer": "2/9",
  "is_correct": false,
  "detected_error_id": "added_numerators_denominators",
  "hint_ids_shown": ["contextual_hint"],
  "repair_success": true
}
```

This record powers:
1. The current deterministic app (no change there).
2. A teacher dashboard that shows CLASS-LEVEL misconception frequency, not just accuracy.
3. The parent "tonight's 3 questions" — selecting questions where repair_success was false
   (the child got the hint but still failed), not just questions with accuracy < 70%.
4. A future Phase 4 hint-selection model that can be trained on repair_success outcomes.
5. A future fine-tuning or eval dataset.

**Recommendation:** This is a scope-locked schema change (new columns on question_attempts)
that requires human sign-off before Claude Code implements it. The right time to add it
is NOW, in Phase 1, before any attempt data is in production. Retrofitting later is
expensive. See Section 3.1 for the specific proposal.

### Gap 2 — No EVALS.md: we have tripwires but not product-level evaluation sets

**What we have:** Tripwires guard security and privacy invariants. Unit tests guard the
answer checker and repair engine.

**What we are missing:** A formal evaluation set for the product's educational claims.
Tripwires answer "does the code obey the contract?" Evals answer "does the product
actually work?"

Required eval sets, none of which currently exist as formal test fixtures:

| Eval set | What it tests |
|---|---|
| Answer equivalence corpus | `isCorrect` across edge cases: fractions, tolerances, units, malformed input, scientific notation, percentage forms, algebraic equivalences |
| Misconception classification accuracy | Given a wrong answer and question, does `detectError` return the right error type? Needs a labelled corpus of (question, wrong_answer, expected_error_id) triples |
| Hint safety | Does hint 1 avoid giving away the answer? Does hint 3 always imply the method without stating the value? Human-judged |
| Curriculum alignment | Does this question actually test the ACARA content description it claims? Needs external reviewer or a checklist |
| Age-appropriateness | Reading level, tone, absence of shame language, absence of adult framing |
| Adversarial student input | Nonsense, profanity, extremely long text, copied web content, prompt injection attempts in answer fields |
| Privacy prompt check | Confirm no student PII reaches any AI system; confirm worked solutions don't encode personal context |
| Repair outcome tracking | When a hint fires, does retry success rate improve vs baseline? (Needs real data — Phase 2) |

**Recommendation:** Create `docs/EVALS.md` specifying each eval set. The answer
equivalence corpus should be built as test fixtures NOW (it is unit-testable). The others
require human judgment or real data and should be scheduled for Phase 2.

### Gap 3 — No AGENTS.md: agent operating model is implicit

**What we have:** Agent roles are described in `docs/PLAN.md` (Claude Code = builder,
Cowork = knowledge work, subagents for content validation and privacy review). Agent
constraints are in `CLAUDE.md` and `CONTRACT.md`.

**What we are missing:** A single explicit document that any new agent reads to understand
the team structure, role boundaries, escalation rules, and what each agent is allowed to
do without asking a human.

The current setup relies on CLAUDE.md being read correctly every time. As the project
grows and more subagents are added (content validator, RLS reviewer, hint safety checker,
adversarial tester), the implicit model breaks.

**Recommendation:** Create `docs/AGENTS.md` (see Section 3.2 for draft structure).

### Gap 4 — No AI_BOUNDARIES.md: phase gates for AI use are scattered

**What we have:** "No runtime AI in V1" is in CONTRACT.md. Phase 4/5 AI plans are in the
strategic planning doc. The Phase 2 content pipeline rules are in PHASE2-CONTENT-PIPELINE.md.

**What we are missing:** A single document that every agent reads to know: in which phase
is AI permitted to do what, and what validation gates apply before that permission
expands?

Without this, agents will propose AI features as the project grows, and each will need to
be evaluated ad hoc against scattered documentation. The framework explicitly says
"agents will happily produce plausible but unsafe designs."

**Recommendation:** Create `docs/AI_BOUNDARIES.md` (see Section 3.3 for draft).

### Gap 5 — Teacher dashboard is "accuracy view," not "misconception view"

**What we have planned (Step 9):** Teacher dashboard shows per-student accuracy and
completion for each substrand.

**What the framework implies:** The defensible product asset is not score data — every
app can show scores. The defensible asset is misconception-labelled data. A teacher who
can see "14 of your 22 students are making the added_numerators_denominators error on
fractions" is getting something no generic platform provides.

This does not require AI. It requires:
1. The three new fields in question_attempts (Gap 1 above).
2. A GROUP BY detected_error_id aggregation query in the teacher dashboard.
3. A human-readable label for each detected_error_id (already in SPEC3).

**Recommendation:** Reframe Step 9 teacher dashboard to include a class-level
misconception frequency view. This is a scope addition to Step 9, not a new step.

### Gap 6 — "Tonight's 3 questions" is low-signal

**What we have planned (Step 10):** Parent view selects 3 questions from substrands where
accuracy < 70% in last 7 days. Selection is deterministic (lowest question_id).

**What would be better:** Select questions where `repair_success = false` — meaning the
student received the hint sequence but still did not answer correctly on retry. These are
the questions where the child is genuinely stuck, not just questions they haven't
practised enough.

This is a small logic change that becomes possible only if Gap 1 (learning trace fields)
is addressed.

**Recommendation:** Implement Gap 1 first, then update Step 10 selection logic to
prioritise `repair_success = false` over raw accuracy.

### Gap 7 — No adversarial student input testing

**What we have:** RLS integration tests (SPEC4) test access control. Unit tests test
the answer checker with known inputs.

**What we are missing:** A test suite for adversarial student inputs in the practice
session. Students will type: nothing, "idk", "???", "12.00000001", extremely long
strings, emojis, copy-pasted worked solutions, profanity, potential prompt injection
strings. The answer checker and repair engine should handle all of these gracefully.

**Recommendation:** Add an adversarial input section to `tests/unit/answer.test.ts`
covering: empty string, non-numeric in numeric field, extremely long input (>500 chars),
HTML/script tags, repeated characters, Unicode fractions (½ ¾), words in numeric fields.
All should return `isCorrect: false` without throwing or leaking stack traces.

---

## Part 3: Concrete pivot recommendations

### 3.1 Schema change: add learning trace to question_attempts (SCOPE-LOCKED — human decision required)

**Proposed addition to the next migration:**

```sql
ALTER TABLE question_attempts
  ADD COLUMN detected_error_id TEXT,         -- SPEC3 error id, e.g. 'added_numerators_denominators'; NULL if no match
  ADD COLUMN hint_ids_shown TEXT[],          -- ordered array of hint/repair primitives shown, e.g. ['contextual_hint']
  ADD COLUMN repair_success BOOLEAN;         -- true if next attempt after hint was correct; NULL until retry occurs
```

**Why now:** This is cheap to add before any production data exists. It becomes expensive
to retrofit once teachers and parents depend on the data model. The columns are
nullable — no existing code breaks. The repair engine (just written in Step 4) already
computes detected_error_id and the repair path; it just does not persist them.

**Human decision required:** Yes. This touches the DB schema (scope-locked). Recommend
approving this addition as part of Step 4's migration set before Step 5 proceeds.

**After approval:** Update `src/app/api/sessions/` (Step 8) to write these three fields
when recording question_attempts.

### 3.2 New file: docs/AGENTS.md (Cowork to draft, no code change)

```markdown
# AGENTS.md — How agents work in this repo

## Team model
Claude Code = builder. Owns all files under src/, supabase/, tests/.
  May not merge scope-locked changes without human review.
Claude Cowork = coordinator + content author. Owns docs/, content/.
  May not touch src/, supabase/ directly.
Subagents (Claude Code internal) = single-purpose, listed below.

## Active subagents
Content Validator: runs against content/curriculum/**/*.json before any content PR.
  Checks: schema, verified:true, ACARA code match, ≥20 questions/substrand.
RLS Reviewer: runs against supabase/migrations/ on any RLS change.
  Checks: policies match SPEC4 matrix, no policy bypasses service-role key unnecessarily.

## Escalation rule
Any agent that hits a scope-locked area STOPS and pings the human.
Scope-locked = auth, DB schema, RLS, privacy, data residency, content gate, §1 OUT list.

## What agents may not do without a human decision
- Add a column to any user-data table
- Add a third-party dependency
- Enable runtime AI in any user path
- Remove or weaken a tripwire
- Set verified: true on any content item
- Change the data residency region
```

### 3.3 New file: docs/AI_BOUNDARIES.md (Cowork to draft, no code change)

```markdown
# AI_BOUNDARIES.md — Phase-gated AI permission levels

## Phase 1 (current) — AI in back office only
ALLOWED: AI drafts question JSON, worked solutions, hint text, doc content.
ALLOWED: AI generates code (Claude Code), tests, migration files.
NOT ALLOWED: Any LLM call that touches a student session at runtime.
NOT ALLOWED: Any LLM call that reads or writes user data.
Gate to unlock Phase 2 AI: all Phase 1 DoD items pass + mathematician verifier named.

## Phase 2 — AI-assisted content production
ALLOWED: AI drafts questions in bulk (PHASE2-CONTENT-PIPELINE.md).
ALLOWED: AI reviews content for curriculum alignment, duplicate detection, hint safety.
STILL NOT ALLOWED: Any runtime AI in student or parent views.
Gate to unlock Phase 3: 10-substrand pilot content fully verified + eval sets passing.

## Phase 3 — AI-assisted content review
ALLOWED: AI as reviewer role (not creator): flags curriculum mismatches, ambiguous
  wording, duplicate questions, potential answer-leaking hints.
STILL NOT ALLOWED: Runtime AI in student path.
Gate to unlock Phase 4: eval set for misconception classification reaches >90% accuracy
  on labelled corpus + legal/privacy review of AI tool used.

## Phase 4 — AI hint SELECTION from verified bank (not generation)
ALLOWED: Model receives {content_code, error_type, attempt_count, available_hint_ids}
  and returns {selected_hint_id}. No student name, no school, no PII, no free-form output.
STILL NOT ALLOWED: Free-form AI-generated hints in student path.
Gate to unlock Phase 5: Phase 4 hint selection eval (repair_success rate improvement
  vs deterministic baseline) + separate compliance review + teacher opt-in + logging.

## Phase 5 — AI-generated hints (opt-in schools only)
Only after: prompt logging, output validation, mathematical checking, content safety
  checks, teacher override, opt-in school agreement, human-reviewed eval set of ≥500 items.
```

### 3.4 New file: docs/EVALS.md (Cowork to draft, no code change)

Specify each evaluation set with: purpose, format, how it runs, who judges it, what
pass/fail means. Prioritise the answer equivalence corpus (automatable now) and hint
safety checklist (human-judged, Phase 2).

### 3.5 Reframe product description everywhere

Change the internal framing from:

> "A curriculum-aligned maths practice platform"

to:

> "A privacy-first Australian maths intervention system that identifies misconceptions,
> repairs them calmly, and gives teachers and parents verified next steps."

The word "intervention" is deliberate. It says the product acts on specific errors, not
just on practice volume. This changes what gets built in Step 9 (teacher dashboard) and
what gets measured.

---

## Part 4: What does NOT change

The following elements of the current plan are already correct and should not be pivoted:

1. **V1 keeps all student-path logic deterministic.** Do not add runtime AI to V1 on the
   basis of this framework. The framework validates the current approach.
2. **CONTRACT.md remains the binding agent document.** It is working. Add to it; do not
   loosen it.
3. **The content pipeline structure is correct.** AI draft → human verify → schema check
   → CI gate → content bank. The framework explicitly endorses this model.
4. **Privacy architecture is correct.** No PII in logs, no trackers, RLS at DB level, AU
   residency, hard delete. These are non-negotiable for school procurement.
5. **The vertical-slice build order is correct.** Two substrands fully working beats ten
   substrands half-built.
6. **SPEC3 misconception taxonomy is an asset, not a detail.** Preserve and expand it.

---

## Part 5: The moat argument

The conventional product moat would be: best UI, most questions, most engaging.

The agentic engineering moat in this domain is different:

```
Australian curriculum alignment
+ verified content (human mathematician sign-off)
+ named misconception taxonomy (machine-readable)
+ learning trace per attempt (error detected, hint shown, repair outcome)
+ privacy-compliant student data (AU residency, RLS, hard delete)
+ school procurement-grade auditability
= a dataset no competitor can quickly replicate
```

A generic foundation model or a generic question-bank app can generate questions. It
cannot generate verified, ACARA-aligned questions with labelled misconceptions, repair
outcomes, and a privacy-compliant data trail. That combination, accumulated over two years
of student attempts, is the moat.

The questions themselves are not the asset. The verified misconception-repair outcome
dataset is the asset. Build toward it from Phase 1 by capturing the learning trace.

---

## Part 6: Updated roadmap in light of this framework

| Phase | Focus | AI role | Gate |
|---|---|---|---|
| Phase 1 | Verified vertical slice: 2 substrands end-to-end, all tripwires green, teacher/parent/student flows working | AI builds code + drafts 40 questions | DoD checklist in PHASE1-BUILD.md + human smoke test |
| Phase 2 | AI-assisted content production: 10-substrand pilot (200 questions), content pipeline proven end-to-end, misconception dashboard live | AI drafts questions; human verifies; AI reviews for alignment + duplicates | Mathematician verifier named; eval sets specified; pilot content 100% verified |
| Phase 3 | Scale content + AI as reviewer: 50 substrands, ≥1,000 verified questions; AI flags issues but humans approve | AI reviewer role only | Eval corpus for misconception classification ≥90% accuracy |
| Phase 4 | AI hint selection from verified bank (no free-form generation); trial with opt-in teachers | Model selects from approved hint library; no PII in prompt | repair_success lift demonstrated vs deterministic baseline; compliance sign-off |
| Phase 5 | AI-generated hints with full validation pipeline; national expansion | Full pipeline with logging, output validation, human eval set | Opt-in schools only; separate legal review |

---

## Part 7: Immediate actions (before Phase 1 Step 5 proceeds)

In priority order:

1. **[HUMAN DECISION] Approve or defer the three-column schema addition to
   question_attempts** (`detected_error_id`, `hint_ids_shown`, `repair_success`). This is
   the single most leveraged schema decision in Phase 1. If approved, Claude Code adds it
   to the current migration before Step 5.

2. **[COWORK] Draft `docs/AGENTS.md`** — using Section 3.2 above as the starting point.

3. **[COWORK] Draft `docs/AI_BOUNDARIES.md`** — using Section 3.3 above as the starting
   point.

4. **[COWORK] Draft `docs/EVALS.md`** — specifying the answer equivalence corpus first
   (automatable), then the human-judged eval sets for Phase 2.

5. **[CLAUDE CODE — after schema approval] Add adversarial input tests** to
   `tests/unit/answer.test.ts`: empty string, non-numeric in numeric field, >500 chars,
   HTML/script injection, Unicode fraction characters.

6. **[CLAUDE CODE — Step 9] Add misconception frequency view** to teacher dashboard:
   GROUP BY detected_error_id query, labelled with SPEC3 human-readable names.

7. **[CLAUDE CODE — Step 10] Update "tonight's 3 questions"** to prioritise
   `repair_success = false` attempts over raw accuracy threshold.

---

## Part 8: Questions for external review (ChatGPT prompt)

The following questions are offered for a second opinion from ChatGPT or another external
reviewer:

**Q1 (Schema):** We are proposing to add `detected_error_id`, `hint_ids_shown`, and
`repair_success` to every `question_attempts` row in Phase 1. Is this the right minimal
learning trace, or are there other fields that would be significantly more valuable for
both current analytics and future model training?

**Q2 (Misconception taxonomy):** Our SPEC3 detection rule library has 12 named rules
covering the most common procedural and conceptual errors. Is there a well-known academic
taxonomy (e.g., from maths education research) we should align our rule names to, to make
the dataset more interoperable with research work?

**Q3 (Moat):** We believe our moat is: verified ACARA-aligned content + labelled
misconception-repair outcomes + privacy-compliant Australian student data. Is this
defensible? What would a well-resourced competitor (e.g., Khan Academy, Mathspace,
a foundation model provider) struggle to replicate quickly?

**Q4 (Phase 4 hint selection):** We plan to implement AI hint selection as: model
receives {content_code, error_type, attempt_count, available_hint_ids} and returns
{selected_hint_id}. This minimises PII exposure and constrains output. Is this the right
architecture for a Phase 4 AI feature in a school-facing product? What would you change?

**Q5 (Phase gate):** We are gating Phase 4 (AI hint selection) on: repair_success lift
demonstrated vs deterministic baseline + compliance review + opt-in schools only. Are
these the right gates, or are there standard EdTech or Privacy Act criteria we should
also satisfy before deploying any runtime AI to students?

**Q6 (Overall assessment):** Given the architecture described above (deterministic V1,
content pipeline with human verification, learning trace dataset, phase-gated AI
expansion), does this represent a defensible "agentic engineering" approach to an EdTech
product for Australian schools? What would you do differently?

---

## Summary

The current plan is closer to the agentic engineering model than most teams building
with AI today. The binding contract, executable tripwires, no-runtime-AI policy, and
verified content pipeline are all correct. The gaps are:

1. **The learning trace (Gap 1)** — three columns in question_attempts that turn a score
   log into a verified feedback loop. This is the highest-leverage change. Requires human
   schema approval now.
2. **Formal eval sets (Gap 2)** — especially the adversarial input corpus and the
   misconception classification accuracy eval.
3. **Explicit AI phase gates (Gap 3)** — in a single AI_BOUNDARIES.md document.
4. **Product reframing (Gap 5/6)** — from "practice app" to "misconception intervention
   system," reflected in the teacher dashboard and parent view.

The moat is not the UI. It is the verified dataset. Build toward it from Phase 1.
