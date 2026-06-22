# DELIVERY PLAN — Australian Maths App (V1)

## Operating principles

1. **Vertical slices, not layers.** Build one substrand end-to-end through the whole stack
   before adding breadth. The first slice proves auth, RLS, content loading, practice,
   progress, and the teacher/parent views — for a single topic.
2. **Guardrails as code, not prose.** Every invariant in `CONTRACT.md` that can be a test, IS
   a test (see Tripwires). Written rules get violated; failing CI gets fixed.
3. **Test as a principle.** TDD the things that are expensive to get wrong — the security /
   privacy invariants and answer-checking — before the feature code.
4. **Propose, don't act, on scope.** Anything outside V1 is drafted as a proposal for a human,
   never built silently.

## Agentic architecture for this project

- **Claude Code — the builder.** Owns the codebase: writes/edits code, runs tests, manages
  git/PRs. Governed by `CLAUDE.md` (which loads `CONTRACT.md`). This is where the app becomes
  real and runnable.
- **Claude Cowork — the knowledge-work surface.** Owns the non-code streams: authoring and
  verifying the question bank (hundreds of items — a content operation, not a coding task), and
  maintaining the project docs (this file, `spec.md`, `architecture.md`, `compliance.md`, the
  privacy policy, the DPA template, the PIA). The `.md` docs are the shared coordination
  substrate both surfaces read.
- **Subagents (inside Claude Code) — only where repetition justifies them.** Two earn their
  place early on this project:
  - *Content validator* — checks each question JSON against the schema, confirms the ACARA code
    matches the filename, enforces ≥20/substrand, and refuses anything without `verified: true`.
  - *Privacy & security reviewer* — audits any diff touching auth / DB / RLS for PII leakage,
    missing RLS, or US-region config, and blocks it for human review.
  Do not spin up more than these without a concrete recurring need.
- **MCP — per need.** Supabase MCP so Claude Code can inspect schema and RLS; Claude Design
  handoff for the UI. Add a connector when a task needs it, not "just in case."

## Testing strategy

- **Unit** — answer-checking (numeric + multiple choice), hint progression (≤3 then worked
  solution unlocks), content-schema validation, the deterministic mistake-repair rules.
- **Integration (security-critical — test heavily)** — RLS policies (student/parent/teacher
  isolation), both registration paths, hard-delete completeness.
- **End-to-end** — the three journeys: a student practises a topic, a teacher creates a class
  and assigns, a parent views a child's progress.
- **TDD first** — write the RLS isolation tests and the no-PII / no-tracker / AU-region
  tripwires before the code they guard.

## Tripwires (security & privacy, specified early as automated checks)

These turn `CONTRACT.md` from a document into something CI enforces. Each fails the build:

- **No-tracker check** — fails if any analytics/tracker package appears in dependencies or in
  client bundles.
- **No-PII-field check** — schema test fails if any user-data table has a column matching a
  denylist (dob, birth, address, phone, ssn, medicare, passport, …).
- **RLS-on check** — fails if any table holding user data has RLS disabled or lacks an
  isolation policy.
- **AU-region check** — fails if Supabase / host region config is not ap-southeast-2 (Sydney).
- **No-runtime-AI check** — fails if any runtime/server code in the student path references an
  LLM / inference client.
- **Content gate** — fails if any shipped question lacks required tags, has a code mismatching
  its filename, or has `verified: false`.
- **Hard-delete test** — asserts deletion removes every related record (no orphaned progress or
  attempts).
- **A11y check** — axe (or equivalent) runs in CI against key screens; regressions fail.
- **Scope tripwire** — CODEOWNERS / required-review gate on scope-locked paths (auth, schema,
  RLS, residency config, the content gate).

## Roadmap

**Phase 0 — Foundations & guardrails (before any feature).**
Repo + git; `CLAUDE.md` + `CONTRACT.md` in place; the Tripwires above wired into CI; privacy
policy + DPA drafts started in Cowork; design system set up in Claude Design.
*Done when:* the tripwires can fail a deliberately-bad PR.

**Phase 1 — One vertical slice.**
A single substrand (e.g. a Year 7 Number topic) end-to-end: parent/teacher registration →
student practice (question, ≤3 hints, worked solution, repair states) → progress recorded →
teacher assigns it → parent views it. RLS proven by tests.
*Done when:* all three journeys pass e2e with RLS green, for one topic.

**Phase 2 — Content pipeline.**
Stand up the authoring + verification workflow in Cowork; build the content-validator
subagent; author the highest-priority substrands first (per `curriculum-structure.md`: Year
7–8 Number, Year 9 Algebra, Year 9–10 Measurement, Year 10 Algebra).
*Done when:* the priority substrands have ≥20 verified questions each and pass the content gate.

**Phase 3 — Breadth.**
Fill the remaining Years 7–10 substrands; complete the teacher dashboard (per-student accuracy
and completion) and the parent view.
*Done when:* all in-scope substrands are covered and both dashboards are usable.

**Phase 4 — Pre-launch hardening.**
Accessibility pass; security & privacy review; privacy policy published; DPA ready; hard-delete
verified end-to-end; pilot with a handful of teachers.
*Done when:* a real teacher can run a real class without you intervening.

**Then:** the success metric — 10 teachers actively using it within 3 months. Defer every V2
item (adaptive engine, Years 11–12, runtime AI hints, LMS integrations, native apps) until V1
clears.

## Definition of Done (per slice)

Tests pass · RLS verified · content gate green · WCAG 2.1 AA on touched screens · reviewed if it
touched a scope-locked area · committed.
