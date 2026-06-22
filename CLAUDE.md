# CLAUDE.md — Australian Maths App

A curriculum-aligned maths **practice** platform for Australian students **Years 7–10
(ACARA)**, distributed through teachers, web-first. **Current goal:** ship V1 to 10 teachers.
Binding rules: `docs/CONTRACT.md` (read it). Plan: `docs/PLAN.md`.

> A second spec (`Product_Spec.docx`, "Milo Maths" — consumer, ages 7–11, runtime AI)
> describes a *different* product. This repo follows the Years 7–10 / no-runtime-AI direction.
> Changing that is a human decision, not an agent one.

## Non-negotiables (full set in CONTRACT.md)

- Collect ONLY student display name + year level, and teacher/parent name + email. NEVER dob,
  address, phone, or any government ID.
- Students never self-register. Accounts come from a teacher or parent flow only.
- Zero third-party trackers/analytics SDKs. No PII in logs. No ad model.
- Row-level security at the DATABASE level (Supabase RLS) — never app-layer only.
- Curriculum content is STATIC JSON under `/content/curriculum/` (filename = ACARA code). The
  DB holds only accounts, classes, and progress.
- No LLM/AI calls in the student path in V1. Pre-authored, verified content only. Repair logic
  is deterministic rules, not an LLM.
- All user data in Supabase Sydney (ap-southeast-2). No US regions.
- "Delete" = permanent hard delete. A real one exists before launch.
- No question ships with `verified: false`.
- If a change touches auth, DB schema, RLS, privacy, data residency, or anything scope-locked
  → STOP and ask.

## Stack (working decision — Option A; revisit only with sign-off)

Next.js (web-first, SSR) · Supabase (Postgres + auth + RLS, Sydney) · KaTeX for math · Vercel
edge pinned to Sydney for anything touching user data.
Commands: `<dev>` / `<test>` / `<build>` / `<deploy>` — fill in as the repo takes shape.

## Where things live

- `docs/` — CONTRACT.md, PLAN.md, spec.md, architecture.md, compliance.md, curriculum-structure.md
- `content/curriculum/year-N/<strand>/AC9M*.json` — questions (static, version-controlled)
- `src/` — the app; `src/theme/` — design tokens (synced from Claude Design)
- `tests/` — with the tripwires (see PLAN.md) wired into CI

## Testing expectation

Tests run on every change. TDD the security/privacy invariants and answer-checking FIRST. The
CI tripwires (no-tracker, no-PII-field, RLS-on, AU-region, no-runtime-AI, content gate,
hard-delete, a11y, scope) must pass to merge.

## Things to get right here (Claude tends to slip on these)

- Don't add an analytics SDK "for insights" — server-side aggregates only.
- Don't put question content, hints, or solutions in the database.
- Don't implement row-level security in application code — use Supabase RLS.
- Don't reach for an LLM in the student session — repair is deterministic rules over the bank.
- Don't "round out" V1 with badges/streaks or Year 11–12 content.
