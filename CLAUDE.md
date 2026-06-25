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

## Deployment

**Platform:** Hetzner VPS · Caddy + Docker Compose · **not Vercel, not PM2**  
**Guide:** `docs/DEPLOY.md` — read this before touching deploys.  
**Short version:** `sshpass` password auth only (SSH keys don't work on this server); rsync → docker build → docker stop/rm → up -d; verify on port 3005.  
**Live URL:** https://maths.graphsight.app (basic auth: admin / waqar)

## Stack (working decision — Option A; revisit only with sign-off)

Next.js (web-first, SSR) · Supabase (Postgres + auth + RLS, Sydney) · KaTeX for math.
Commands: `npm run dev` / `npm test` / `npm run build` / see `docs/DEPLOY.md` for deploy.

## Where things live

- `docs/` — CONTRACT.md, PLAN.md, spec.md, architecture.md, compliance.md, curriculum-structure.md
- `content/curriculum/year-N/<strand>/AC9M*.json` — questions (static, version-controlled)
- `src/` — the app; `src/theme/` — design tokens (synced from Claude Design)
- `tests/` — with the tripwires (see PLAN.md) wired into CI
- `design/agent/` — designer agent workflow, context brief, screen register
- `design/screens/` — per-screen design specs (output from designer agent, input to implementation)
- `design/components/` — shared component specs (output from designer agent)
- `.claude/skills/math-app-ui-design/` — installed UI design skill (SKILL.md + references/ + scripts/ + assets/)
  - `references/design-system.md` — **populated** with our real tokens, components, screens, constraints
  - `references/PRODUCT_AND_VERIFICATION.md` — product model, V1 constraints, misconception-repair pattern, §H Definition of Done
  - `scripts/check_contrast.py` — WCAG 2.2 contrast checker against our real palette
  - `scripts/find_hardcoded_values.py` — finds hex values not routed through tokens.ts
  - `scripts/check_copy_terms.py` — catches shame language and gamification copy in student-facing text
  - `scripts/validate_visual_contract.py` — validates Visual Contract YAML specs

## Testing expectation

Tests run on every change. TDD the security/privacy invariants and answer-checking FIRST. The
CI tripwires (no-tracker, no-PII-field, RLS-on, AU-region, no-runtime-AI, content gate,
hard-delete, a11y, scope) must pass to merge.

## Designer agent workflow

**Before implementing any student-facing screen or shared component:**
1. Read `design/agent/WORKFLOW.md` — it defines the full process.
2. Attach `design/agent/CONTEXT-BRIEF.md` and (if relevant) `design/PHASE1-DESIGN-SPEC.md`
   to the agent invocation in full — do not summarise them.
3. Write a short screen-specific brief (route, user goal, state variants, constraints).
4. Ask the agent for: layout spec, state inventory, token mapping, a11y checklist,
   calm mode variant, copy decisions, open questions.
5. Save the agent output to `design/screens/[screen-slug].md` before writing any code.
6. Implement from the saved spec. Record any deviations back in the spec file.
7. Update `design/agent/SCREEN-REGISTER.md` status when the screen moves through the pipeline.

**The 5-step loop (full reference — you never need to remember this):**
1. Here in chat: `/design-brief [screen]` → I generate `design/outbox/[screen]-brief.md` (runs contrast + hardcoded-values checks first)
2. Open Claude Design → **Select AusMaths** from the design-system picker (bottom-left) → **Attach file** (`design/outbox/[screen]-brief.md`) → type in the box: *"You are a product designer for an Australian maths education app. Read the attached brief and respond using ONLY the output format in Section 7. Do not ask clarifying questions — note anything uncertain in OPEN QUESTIONS."* → optionally also **Grab web element** from the live URL for a visual reference → send
3. Claude Design responds → you save that response as `design/inbox/[screen]-response.md`
4. Back here in chat: `/design-apply [screen]` → I validate, run §H Definition of Done checks, update tokens, save specs, give checklist
5. Say "implement now" → I build it

**The skill is installed at `.claude/skills/math-app-ui-design/`.**
Both `/design-brief` and `/design-apply` use it automatically.
The key file to keep in sync: `design-system.md` must mirror `src/theme/tokens.ts`.
**AusMaths design system** is synced to claude.ai/design (projectId: `91469e57-02a9-4c7f-af20-d75839c54649`). Re-run `/design-sync` after any change to `src/theme/tokens.ts` or a new component in `src/components/`.

**Checks that always apply regardless of agent output (§H Definition of Done):**
- `check_contrast.py` must pass on all pairs (WCAG 2.2 AA)
- `find_hardcoded_values.py` must report no hardcoded hex in changed files
- `check_copy_terms.py` must report no shame/gamification language in student-facing copy
- Touch targets ≥ 44px, colour-not-alone for correct/incorrect, maths accessible via KaTeX
- Amber for wrong answers, red for technical errors only (CONTRACT.md invariant, never swap)

## Session discipline

**Subagents**
Only spawn a subagent (Task tool) when the work is genuinely parallel or isolated.
Do not use the Task tool for content validation — use `npm run validate-content` instead.
Do not use the Task tool for RLS review within a normal implementation session.
When a subagent is necessary, prefer claude-haiku-4-5 for validation and review tasks.

**Context management**
After completing a step group (e.g. Steps 1–4, or Steps 5–8), stop and wait for the
human to run /compact before continuing. Do not proceed to the next step group until
told to.

**Brief discipline**
When a brief says "as specified in docs/X.md", read that file directly.
Do not ask the human to paste the spec content. The files are in the repo.
When reporting back, list only files changed and decisions not covered by the brief.
Do not summarise what you built step by step — the human can read the diff.

## Things to get right here (Claude tends to slip on these)

- Don't add an analytics SDK "for insights" — server-side aggregates only.
- Don't put question content, hints, or solutions in the database.
- Don't implement row-level security in application code — use Supabase RLS.
- Don't reach for an LLM in the student session — repair is deterministic rules over the bank.
- Don't "round out" V1 with badges/streaks or Year 11–12 content.
