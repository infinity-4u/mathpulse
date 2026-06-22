# Product Spec — Australian Maths App (V1)

> Binding constraints: [CONTRACT.md](CONTRACT.md). Delivery phases: [PLAN.md](PLAN.md).
> This spec describes the V1 product only. Anything not listed under "V1 features" is out of scope per CONTRACT.md §1.

---

## Vision

A curriculum-aligned maths practice platform for Australian students in **Years 7–10** (ages ~12–15), distributed through teachers, web-first. Students practice problems, get progressive hints and worked solutions, and track progress per ACARA substrand. Teachers assign topics and see class progress. Parents see their child's activity.

The product is not a tutoring app, not a game, and not a replacement for classroom teaching. It is a structured practice layer that maps directly to what students are currently being taught.

---

## Users

### Primary: Students (Years 7–10, ages ~12–15)
- Practice problems by year level and topic
- Receive up to 3 progressive hints before worked solution unlocks
- See per-topic progress (accuracy, completion)
- Cannot self-register — account created by teacher or parent (CONTRACT.md §2)

### Secondary: Teachers
- Create a class and share a join code
- Assign a substrand to the class with a due date
- View per-student accuracy and completion per assignment
- Are the primary distribution channel — the product reaches students through them

### Tertiary: Parents
- Create account, add child profile (display name + year level only — no real name required)
- View child's practice history and accuracy per topic
- Receive a lightweight "tonight's practice" summary (3 recommended questions based on recent gaps — deterministic selection from static bank, no LLM)

---

## V1 Scope: Years 7–10, ACARA only

**Why Years 7–10 only:** ACARA curriculum is consistent across all Australian states for Years 7–10. One content taxonomy works nationally. Years 11–12 diverge by state (NSW, VIC, QLD, WA, SA, TAS, ACT, NT each have different senior syllabi) and require separate per-state content work. That is explicitly V2. See CONTRACT.md §1.

### V1 features

**Student practice**
- Select year level and topic; receive questions from the verified static bank
- Multiple choice and numeric answer entry (student types a number)
- Up to 3 progressive hints per question; worked solution unlocks after hint 3
- Immediate feedback: correct or incorrect, with brief explanation
- Repair states (see below) — never a shaming failure screen
- Calm mode: reduced visual stimulation (muted palette, no animations) toggled by student or parent
- Progress summary: per-substrand completion and accuracy, visible to student

**Mistake repair (deterministic — no LLM)**
Incorrect answers do not produce a failure state. They enter a repair flow:
- Hint 1: conceptual prompt (what to think about)
- Hint 2: procedural step (what to do first)
- Hint 3: near-complete worked example with one step left
- Worked solution: full step-by-step, unlocks after hint 3 or on explicit student request
Repair path selection is a deterministic rule over the static question bank based on `difficulty` and `error_type` tags. Reserve red colour only for technical errors (network failure, etc.), never for wrong answers.

**Mistake taxonomy (deterministic classification)**
Each question carries an optional `common_errors` array in its JSON. When a student's answer matches a known error pattern, the hint sequence is tailored to that error type:
- `conceptual` — student misunderstands the underlying idea; hint 1 addresses the concept directly
- `procedural` — student knows the concept but applies steps incorrectly; hint 1 addresses the step
- `careless` — answer is close (within defined tolerance for numeric); hint 1 prompts checking

**Teacher**
- Create class, generate join code
- Students join via code (teacher or parent completes registration, not the student)
- Assign a substrand to class with due date
- View per-student accuracy and completion per assignment

**Parent**
- Create account, add child profile
- View child's practice history and accuracy per topic
- "Tonight's 3 questions" summary: 3 questions from substrands where the child has <70% accuracy, selected deterministically from the static bank (no AI)

**Accessibility (built to from day one)**
- WCAG 2.1 AA minimum contrast (4.5:1 normal text, 3:1 large)
- Touch targets minimum 44×44pt
- All interactive elements keyboard and screen-reader accessible
- KaTeX for all maths notation — never images without alt text
- Dyslexia-friendly font option (OpenDyslexic or similar) toggled by student
- Calm mode (see above) as an accessibility affordance, not just a preference

---

## V1 explicitly excludes (CONTRACT.md §1)

- Years 11–12 content (any state)
- Runtime AI or LLM calls during a student session
- Adaptive difficulty engine
- Gamification: badges, streaks, leaderboards
- Native mobile apps — web-first, mobile-responsive only
- In-app messaging between any users
- Any feature whose primary purpose is virality or marketing inside the product
- Video or audio content
- LMS integrations (Canvas, Schoolbox, Compass)

Do not build, scaffold, or "prepare for" any of the above without written human sign-off.

---

## Content

- Question bank covers all ACARA Years 7–10 substrands (see [curriculum-structure.md](curriculum-structure.md))
- Minimum 20 questions per substrand at launch (CONTRACT.md §5)
- Every question carries: year level, strand, substrand, ACARA code, difficulty (1–3), and optional `common_errors` array
- Questions are static, version-controlled JSON — never stored in the database (CONTRACT.md §4)
- No question ships with `verified: false` — human mathematician review required before setting verified flag (CONTRACT.md §5)
- Content priority for authoring: Year 7–8 Number → Year 9 Algebra → Year 9–10 Measurement → Year 10 Algebra (see curriculum-structure.md)

---

## Open questions (decide before building the affected feature)

1. **Numeric answer tolerance**: for decimal answers, what tolerance is acceptable? (e.g. ±0.01?) Affects answer-checking logic.
2. **Teacher registration**: open sign-up or invite-only? Invite-only slows growth but prevents spam and makes school procurement cleaner. Recommendation: invite-only for Phase 1 pilot, open with email verification for Phase 3.
3. **"Tonight's 3 questions" delivery**: in-app notification only (V1), or email digest to parent? Email adds an external provider dependency (and APP 8 obligations). In-app only for V1.
4. **Domain name and brand**: required before any public deployment.
5. **Pricing model**: relevant to teacher registration flow. Decide before Phase 4.
6. **Fraction input UX**: how does a student type "1/2" on mobile? Options: text field (type "1/2"), two separate fields (numerator + denominator), or a custom fraction keypad. Affects Phase 1 UX design.

---

## Success metrics for V1

**Adoption:** 10 teachers actively using the platform with at least one class within 3 months of launch. Not downloads, not sign-ups — active class use (≥1 assignment + ≥5 student practice sessions per week). Teacher adoption gates student volume in this market.

**Engagement (leading indicator):** ≥60% of sessions where a student gets a question wrong proceed to at least one hint (not an immediate close). This confirms the repair flow is being used, not abandoned.

**Repair effectiveness:** ≥40% of students who see the worked solution for a question answer the next question in that substrand correctly. Measured deterministically from `question_attempts` data — no AI.

---

## Content schema

Question JSON files follow the expressive answer schema (SPEC2-ANSWER-SCHEMA.md — pending ratification). The canonical TypeScript definition lives in `src/lib/answer.ts`. V1 implements checkers for: `numeric` (with tolerance), `fraction` (equivalence), `multiple_choice`, `multi_select`. Questions using Phase 3 answer types (`ordering`, `matching`, `expression`, `diagram`) are excluded from the V1 build by the content-gate tripwire.
