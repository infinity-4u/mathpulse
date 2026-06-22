# Phase 2 Content Pipeline Specification
Cross-reference: CONTRACT.md §5, docs/PLAN.md → Phase 2, docs/curriculum-structure.md.

---

## The problem

Phase 1 produces ~10 hand-authored questions (the two-substrand slice). The launch gate
requires ≥20 questions per substrand across all Years 7–10 substrands (~50 substrands
× 20 = 1,000 questions minimum). At 5 questions/hour of human authoring time, that is
200 person-hours. An LLM-assisted pipeline (AI draft → human verify → CI gate) can
reduce this to ~40–60 person-hours while preserving the `verified: true` guarantee.

**Rule (CONTRACT.md §5, non-negotiable):** No question ships with `verified: false`.
Human mathematician review is required before any question reaches `verified: true`.
The AI produces drafts; the human certifies correctness.

---

## Pipeline stages

```
STAGE 1          STAGE 2           STAGE 3          STAGE 4          STAGE 5
AI Draft   →   Human Review  →   Schema Check  →   CI Gate    →   Content Bank
(Cowork)       (Mathematician)    (Subagent 2)      (tripwire)     (verified: true)
```

### Stage 1: AI Draft (Claude Cowork — content author mode)

**Who:** Claude Cowork (this agent), acting as content author. NOT Claude Code.

**Input per batch:**
- ACARA content description code and text (e.g. `AC9M7N07`)
- Year level and substrand
- Existing questions for that substrand (avoid duplicates)
- SPEC2-ANSWER-SCHEMA.md + SPEC3-ERROR-REPAIR-SCHEMA.md (schema)
- A seed question (one human-authored example to match style and difficulty)

**Output:** A draft `.json` file conforming to `schema_version: 2`:
- 5–10 questions per batch
- `verified: false` (draft flag — never set to true by AI)
- `provenance` field added (see below)
- All fields populated: `answer`, `hints.default`, `common_errors[]`, `worked_solution`
- Difficulty spread: approximately 40% difficulty 1, 40% difficulty 2, 20% difficulty 3

**Provenance field (new field, Stage 1 only):**
```json
"provenance": {
  "authored_by": "ai-draft",
  "model": "claude-sonnet-4-6",
  "drafted_at": "2026-07-01T09:00:00Z",
  "seed_question_id": "AC9M7N07-001",
  "verified_by": null,
  "verified_at": null
}
```

`authored_by` must be `"ai-draft"` for all AI-generated questions. The content-gate
tripwire will fail any question with `authored_by: "ai-draft"` AND `verified: true` —
the human verification step must set both fields before `verified: true` is allowed.

**Constraints on the AI author:**
- Do NOT invent ACARA codes that do not exist in `curriculum-structure.md`
- Do NOT generate questions requiring Phase 3 answer types (`expression`, `diagram`,
  `ordering`, `matching`) — V1 checkers do not exist for them
- Do NOT generate questions with answers that require units validation (V1: units display-only)
- Mathematical correctness is the human reviewer's job — do not over-claim accuracy
- Write worked solutions step-by-step in KaTeX; every step on its own line
- Write `contextual_hint` for each `common_errors` entry in the voice of a patient teacher,
  not a formal textbook

### Stage 2: Human Review (Mathematician)

**Who:** A named human mathematician reviewer (must be decided before Phase 2 starts —
this is an open question).

**Input:** The draft `.json` file from Stage 1, printed or in a review UI.

**Checks the reviewer performs (not the AI's job):**
1. Is every answer mathematically correct?
2. Are the worked solutions accurate step-by-step?
3. Are the hints pedagogically useful (not misleading)?
4. Is the difficulty rating appropriate for the year level?
5. Does the question align with the ACARA description it claims?
6. Is any question ambiguous, culturally biased, or inappropriate for a 12–15 year old?

**Output:** The reviewer modifies the `.json` directly (or via a simple review UI):
- Corrects any mathematical errors in `answer`, `worked_solution`, hints
- Adjusts difficulty if needed
- Sets `verified: true` at the question level
- Sets `provenance.verified_by` to their name and `provenance.verified_at` to current date

**Reviewer time estimate:** 3–5 minutes per question (checking maths + reading hints).
For a 10-question batch: 30–50 minutes.

**Escalation:** If a question is mathematically correct but the worked solution is
confusing or hints are poor: reviewer edits and re-reviews (not a full new Stage 1).

### Stage 3: Schema Check (Subagent 2 — Content Validator)

Automated. Subagent 2 runs against the post-review file:
- All structural checks from SUBAGENT-SPECS.md § Subagent 2
- Additional check: `provenance.verified_by` is non-null for every question with `verified: true`
- Additional check: `provenance.authored_by` is `"ai-draft"` for AI questions; `"human"` for
  hand-authored questions
- Flag any question that has `verified: true` but `provenance.verified_by === null` as FAIL

Any FAIL: returned to Stage 2 for correction.

### Stage 4: CI Gate (tripwire)

The existing `content-gate.test.ts` tripwire runs in CI on every PR touching `content/`:
- All existing checks (verified:true, 20-question minimum per substrand, schema)
- New check: no question with `provenance.authored_by === "ai-draft"` may have
  `verified: true` AND `provenance.verified_by === null` simultaneously

This is the last automated gate. Any failure blocks merge.

### Stage 5: Content Bank (merged, available)

Questions are merged to main. The static JSON is now part of the content bank.
No DB writes — questions live purely as version-controlled files.

---

## Batch sizing and cadence

| Phase | Batches | Questions/batch | Total questions |
|---|---|---|---|
| Phase 1 | 2 (AC9M7N01 + AC9M7N07) | 5 hand-authored | 10 |
| Phase 2 pilot | 10 substrands × 2 batches | 10 AI-draft + 10 human-authored | ~200 |
| Phase 2 full | Remaining 40 substrands | 15–20 AI-draft | ~800 |
| Launch gate | All substrands | ≥20/substrand verified | ≥1,000 |

Phase 2 pilot (10 substrands) should be completed before Phase 3 begins. This proves the
pipeline end-to-end with a real mathematician reviewer before committing to full scale.

---

## Review UI (Phase 2 tooling, not V1 product)

For Phase 2, the mathematician reviewer needs a simple interface. Options:

**Option A: Direct JSON editing** (no new tooling)
- Reviewer opens the draft `.json` in VS Code or a JSON editor
- Manually sets `verified: true` and fills `provenance.verified_by`
- Low tooling cost; requires reviewer to be comfortable with JSON

**Option B: Simple review web page** (minimal tooling)
- A static HTML page (not deployed; run locally) that renders each question with KaTeX
- Reviewer clicks APPROVE / EDIT / REJECT per question
- On APPROVE: page writes `verified: true` + provenance fields and saves the file
- Estimated build time: 2–4 hours for Claude Code

**Recommendation:** Option B for Phase 2 pilot. The mathematician reviewer should not need
to hand-edit JSON. This is a 4-hour build that pays back immediately in reviewer accuracy.
Build it as a standalone tool in `tools/content-review/` — NOT part of the student-facing app.

---

## Phase 2 content pipeline — open questions

1. **Who is the mathematician reviewer?** This must be a named person before Phase 2 starts.
   Without this decision, the pipeline cannot proceed. Options: university maths education
   lecturer, retired secondary maths teacher, ACER curriculum specialist.

2. **How many questions per substrand is the right launch minimum?** CONTRACT.md says ≥20.
   Is 20 enough for meaningful differentiation (difficulty spread across 3 levels)? Minimum
   viable recommendation: 20 questions with at least 5 at difficulty 3.

3. **Will AI draft `multi_select` questions in Phase 2?** The `multi_select` checker is a
   V1 answer type. Including these in Phase 2 batches requires the reviewer to verify
   multi-answer correctness. Add to the reviewer checklist when first used.
