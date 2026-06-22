# Project Summary — Australian Maths App
*Written for handoff to reviewers, collaborators, and other LLMs. Current as of Phase 0 completion.*

---

## What this project is

A curriculum-aligned maths practice platform for Australian secondary students in **Years 7–10 (ACARA)**. Students practice problems, receive up to three progressive hints, see worked solutions, and track progress per ACARA substrand. Teachers assign topics and monitor class accuracy. Parents see their child's activity and receive a "tonight's 3 questions" digest.

The product is **teacher-distributed** (teachers bring students in via a join code), **web-first**, and has **no AI at runtime in V1**. All questions, hints, and worked solutions are pre-authored, human-verified static JSON.

**Target:** 10 teachers actively using it with real classes within 3 months of launch.

---

## What has been built (Phase 0 — complete)

### Governance and planning
| File | Purpose |
|---|---|
| `CLAUDE.md` | Auto-loaded project memory for Claude Code — non-negotiables, stack, where things live |
| `docs/CONTRACT.md` | The binding law — invariants every agent must follow, escalation rules |
| `docs/PLAN.md` | Delivery phases, agentic architecture, tripwire spec, definition of done |
| `docs/README.md` | Reading order index — CONTRACT first, then PLAN, then spec/arch/compliance |

### Product and architecture docs
| File | What changed / why |
|---|---|
| `docs/spec.md` | Audience fixed to Years 7–10 only (was 7–12). Milo Maths UX principles (no-shame repair, mistake taxonomy, calm mode, dyslexia font, parent "tonight's plan") folded in as deterministic features with no AI. Open questions documented. |
| `docs/architecture.md` | Stack committed to Option A (Next.js + Supabase Sydney + KaTeX). Auth model documented — no student auth.users rows. Deterministic repair engine documented. Offline capability specified. |
| `docs/compliance.md` | Australian Privacy Act APP-to-tripwire mapping table added. Phase 0 vs Phase 4 deliverables split. State-by-state school procurement notes. |
| `docs/curriculum-structure.md` | Canonical ACARA taxonomy header added. Full Years 7–10 substrand list with content description codes (AC9M format). State senior pathway overview for V2 planning. |

### Legal drafts (Phase 0 — need legal review before use)
| File | Status |
|---|---|
| `docs/privacy-policy-DRAFT.md` | Plain-English Australian privacy policy. Covers APPs 1, 3, 5, 6, 8, 11. Items in [brackets] need completion before publication. |
| `docs/dpa-template-DRAFT.md` | Data Processing Agreement for schools. Covers data residency, deletion rights, sub-processors, breach notification. Needs solicitor review before sending to any school. |
| `docs/reference/PRODUCT_SPEC_NOTE.md` | Documents what Milo Maths (Product_Spec.docx) is and how to use it — principles only, not the product direction. |

### Database schema (`supabase/migrations/0001_initial_schema.sql`)
Nine tables, all scope-locked (require human review to modify):
- `parent_profiles`, `teacher_profiles` — adult account holders
- `student_profiles` — nickname + year level only, no auth.users row, created by adult
- `parent_student` — links parent to child
- `classes`, `class_enrolments` — teacher creates class, students join via code
- `assignments` — teacher assigns a substrand (ACARA code) to a class
- `practice_sessions`, `question_attempts` — progress records only, no question content

RLS enabled and policies written on all nine tables. CASCADE hard-delete on all child tables — no soft-delete anywhere. No PII columns (no dob, address, phone, government IDs).

### Guardrail infrastructure — 7 tripwire tests (19/19 pass; 6 deliberate violations caught)
| Tripwire | What it enforces |
|---|---|
| `no-tracker` | No analytics/tracker packages in dependencies or config |
| `no-PII-field` | No banned column names in migrations (dob, address, phone, medicare, etc.) |
| `rls-on` | All user-data tables have ENABLE ROW LEVEL SECURITY + at least one policy |
| `au-region` | Supabase config pinned to ap-southeast-2 (Sydney) |
| `no-runtime-ai` | No LLM/AI client imports anywhere in src/ |
| `content-gate` | Question files: verified:true, filename=code, required fields, valid hints |
| `hard-delete` | No soft-delete columns; CASCADE on all child tables |

All wired into `.github/workflows/ci.yml`. CODEOWNERS gates human review on scope-locked paths.

### Source code
| File | Purpose |
|---|---|
| `src/lib/repair.ts` | Deterministic repair engine — pure functions, no network, no AI. `isCorrect()`, `detectErrorType()`, `nextRepairStep()`. Fully unit-testable. |
| `src/theme/tokens.ts` | Design tokens — colours (a11y contrast verified), spacing, typography, calm mode palette. Repair amber reserved for wrong answers; red reserved for technical errors only. |
| `src/app/layout.tsx` | Next.js root layout — KaTeX CSS, lang="en-AU", no analytics tags |
| `src/app/page.tsx` | Phase 0 placeholder landing page |

### Content
| File | Purpose |
|---|---|
| `content/curriculum/year-7/number/AC9M7N01.json` | Sample verified question file — 5 questions on perfect squares/square roots. Demonstrates the full schema: stem, options, correct, difficulty 1–3, 3 hints, worked_solution, common_errors with typed error classification. |

### Configuration
| File | Purpose |
|---|---|
| `package.json` | Next.js, React, TypeScript, Vitest — no analytics packages |
| `next.config.ts` | Security headers (CSP, X-Frame-Options, nosniff), no tracking scripts |
| `tsconfig.json` | Strict TypeScript |
| `vitest.config.ts` | Test runner config |
| `.env.example` | Documents required env vars including SUPABASE_REGION=ap-southeast-2 |
| `supabase/config.toml` | Supabase region pinned to ap-southeast-2 |
| `CODEOWNERS` | Scope-locked paths require @husain review before merge |
| `.gitignore` | Standard exclusions; .env files excluded; no PII in logs note |
| `.github/workflows/ci.yml` | CI: tripwires → unit tests → typecheck → a11y (placeholder) |
| `design/DESIGN_PLACEHOLDER.md` | Design system setup instructions — components, tokens, a11y requirements |

---

## Roadmap

### Phase 1 — One vertical slice (next, in motion)
Build AC9M7N01 (Year 7 Number — perfect squares) end-to-end through the full stack.

Order: RLS integration tests first (TDD) → auth flows (parent-led + teacher-led) → practice session (questions, hints, repair, worked solution) → progress recording → teacher assignment → parent view → e2e tests → axe a11y check.

See `docs/PHASE1-KICKOFF.md` for the full step-by-step.

**Done when:** three e2e journeys pass (student practices, teacher assigns, parent views), RLS isolation verified, all tripwires green.

### Phase 2 — Content pipeline
Author the full question bank. This is a content operation, not primarily a coding task.

Priority order (per curriculum-structure.md): Year 7–8 Number → Year 9 Algebra → Year 9–10 Measurement → Year 10 Algebra → remaining substrands.

Minimum 20 verified questions per substrand. The content gate tripwire enforces this before any content reaches a build.

**Where generative AI fits in Phase 2 — the right uses:**

AI assists human authors, never replaces verification. Specifically:

1. **Draft question generation.** Give an LLM the ACARA content description, the question schema, and 2–3 examples from AC9M7N01.json. It drafts questions for a mathematician to verify. The `verified` flag stays false until a human sets it. The content gate refuses anything with `verified: false` in a build.

2. **Worked solution drafting.** LLM drafts step-by-step solutions; mathematician checks mathematical correctness and pedagogical clarity before `verified: true`.

3. **Common errors authoring.** LLM suggests plausible student error patterns (`common_errors` array) based on the question. These are reviewed and typed (conceptual/procedural/careless) by the content author before being added.

4. **Hint sequence generation.** LLM drafts the three-hint progressive sequence. Human reviews that hint[0] is conceptual, hint[1] is procedural, hint[2] is near-complete — not just rewording the question.

**What AI must NOT do in Phase 2:**
- Set `verified: true` itself — this is a human attestation
- Generate content that bypasses the content gate CI check
- Produce content that goes directly into a build without human review

**Tooling for Phase 2 content pipeline:**
- `scripts/validate-content.ts` (to be written in Phase 2) — runs content-gate checks on a single file before committing
- A content authoring workflow: LLM draft → mathematician review → `verified: true` → commit → CI gate confirms

### Phase 3 — Breadth
Fill remaining Years 7–10 substrands (following Phase 2 content pipeline). Build teacher class dashboard (per-student accuracy + completion) and complete parent progress view.

### Phase 4 — Pre-launch hardening
- Formal WCAG 2.1 AA audit (third-party)
- Privacy policy published at a real URL
- DPA template reviewed by solicitor and ready to send to schools
- Penetration test
- Privacy Impact Assessment (PIA) drafted — required for NSW DET and VIC DET district adoption
- Pilot with 3–5 real teachers before wide launch

### V2 (after V1 clears its success metric)
These are explicitly out of scope until 10 teachers are actively using V1:
- **Years 11–12 content** — start with NSW (Mathematics Advanced + Extension 1) and VIC (Mathematical Methods + Further Mathematics), the two largest state cohorts
- **Adaptive difficulty engine** — use `question_attempts` aggregate to select questions at the right difficulty per student. Pure deterministic logic over the existing data — still no LLM required
- **Runtime AI hints** — the one place where a carefully constrained LLM call is worth evaluating. Architecture: backend API route only (never client-side), tight system prompt, output must be validated as mathematically correct before display, no student PII in the prompt, context window limited to the current question and student's last 3 attempts. This requires a compliance review of the prompt-to-API data flow against APP 3 and APP 6 before enabling
- **LMS integrations** — Canvas, Schoolbox, Compass
- **Native iOS/Android** — only if web performance proves insufficient for school iPads offline

---

## Key decisions and the reasoning behind them

**Years 7–10 only for V1.** ACARA is nationally consistent for Years 7–10. Senior secondary (Years 11–12) varies by state — one content taxonomy works everywhere for 7–10, but 11–12 would require eight separate state curricula. Defer until V1 proves the model.

**No runtime AI in V1.** Not because AI is bad but because it introduces: output verification complexity (wrong maths shown to children), compliance risk (student context in a prompt), and an adaptive engine dependency before the base product is proven. The deterministic repair engine in `src/lib/repair.ts` delivers the core pedagogical benefit (progressive hints, error-type-aware repair) without any of that risk.

**Teacher-led distribution over direct-to-consumer.** Teachers are the gating factor for student volume in Australian secondary education. 10 active teachers is a more meaningful metric than 1,000 sign-ups. The school procurement path (join code, class enrolments, assignment tracking) is built for this.

**Australian data residency as a hard constraint, not a preference.** NSW DET and VIC DET procurement both require it. Supabase Sydney (ap-southeast-2) satisfies it. The au-region tripwire makes it impossible to accidentally configure a US region.

**No student auth.users rows.** Students access via parent session or PIN — they never create an account with an email address. This is the right architecture for under-15 users under Australian privacy law and makes COPPA/GDPR-K compliance structurally enforced rather than policy-dependent.

**Curriculum content as static JSON, not database rows.** Questions don't change per user; they're versioned with the codebase; they enable offline practice; and they can never leak via a database breach. The database holds only progress records.

---

## Open questions requiring human decisions

1. **Numeric answer tolerance** — for decimal answers, what tolerance is acceptable (±0.01? exact match only)? Affects `isCorrect()` in `src/lib/repair.ts`.
2. **Teacher registration** — open sign-up or invite-only? Recommendation: invite-only for Phase 1 pilot.
3. **"Tonight's 3 questions" delivery** — in-app only (V1) or email digest? Email adds an AU/EU-hosted provider and APP 8 obligations.
4. **Domain name and brand** — needed before any public deployment.
5. **Pricing model** — relevant to the teacher registration flow design.
6. **Content authoring workflow** — who verifies questions? A hired mathematician reviewer, the product owner, or both? This determines Phase 2 throughput.
