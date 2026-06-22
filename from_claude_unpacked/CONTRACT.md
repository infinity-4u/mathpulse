# BUILD CONTRACT — Australian Maths App (V1)

## DECISION REQUIRED (read first)

This contract governs the product described in `spec.md` / `architecture.md` /
`compliance.md`: a **curriculum-aligned, teacher-distributed, web-first practice
platform for Years 7–10 (ACARA), with no AI at runtime**.

A second, conflicting spec exists (`Product_Spec.docx`, "Milo Maths"): a **consumer
mobile app for ages 7–11, parent-bought, built around a runtime adaptive/AI engine**.
These are different products. An agent that reads both will not stay the course.
**Confirm which product is V1.** This contract assumes the former; the salvageable
ideas from the latter (no-shame repair, mistake taxonomy, parent "tonight's plan",
calm mode, accessibility) are folded in below as *principles*, implemented without
runtime AI. If you instead choose the consumer product, §1 and §4 change; the rest
stands.

## How to read this contract

These are invariants. Every Claude agent building this project — Claude Code, Cowork,
and any subagent — must treat each rule as non-negotiable. If a task would require
breaking one, STOP and ask a human. Do not reinterpret, work around, or "temporarily"
suspend any rule. When unsure whether something is in scope, assume it is not, and ask.

---

## 1. Scope — stay the course

V1 is **Years 7–10, ACARA only**. The following are explicitly OUT of V1. Do not build,
scaffold, or "prepare for" them without written human sign-off:

- Years 11–12 content (any state)
- Any AI/LLM call at runtime (questions, hints, and solutions are pre-authored and verified)
- Adaptive difficulty engine
- Gamification (badges, streaks, leaderboards)
- Native mobile apps (web-first, responsive)
- In-app messaging between any users (teacher↔student included)
- Any feature whose primary purpose is virality or marketing inside the product

Adding scope is a human decision. Agents propose; humans dispose.

## 2. Privacy — non-negotiable (Privacy Act 1988 + APPs)

- Collect ONLY: student display name (nickname) + year level; teacher/parent name + email.
  NEVER collect date of birth, home/postal address, phone number, school-issued IDs, or any
  government identifier. [APP 3]
- Students cannot self-register. Accounts are created only via a teacher or parent flow.
  [under-15 parental consent]
- ZERO third-party trackers or analytics SDKs in the client. Server-side aggregate logging
  only; no per-individual tracking. [APP 6]
- No PII in logs, error messages, or analytics — ever. [APP 11]
- No ad-funded mechanics. User data is never sold or shared with any party not named in the
  published privacy policy. [APP 6]
- "Delete" means permanent hard delete of all records for that student, not a soft-delete
  flag. A working hard-delete path exists before launch. [state DET requirements]
- All user data resides in Australia: Supabase Sydney (ap-southeast-2). No user data in US
  regions. Transactional email via an AU/EU-hosted provider. Any offshore processor must be
  disclosed and meet APP 8. [APP 8]

## 3. Security

- Row-level security is enforced at the DATABASE level (Supabase RLS). Never as
  application-layer logic only. Students read only their own progress; parents only their
  child's; teachers only their class members'. [architecture constraint 3]
- Encryption at rest and in transit.
- No secrets, keys, or credentials in the repo or in client-side code.
- Dependencies kept current; no known-vulnerable packages shipped. [APP 11]

## 4. Architecture — decisions agents may not silently reverse

- Curriculum content is STATIC data, version-controlled under `/content/curriculum/` as JSON,
  filename = ACARA code. It does NOT live in the database. [architecture core principle]
- The database stores ONLY: user accounts, class structure, and progress records. Not
  questions, solutions, hints, or curriculum metadata. [architecture core principle]
- No LLM/AI calls during a student session in V1. All questions, hints, and worked solutions
  are pre-authored and verified. [architecture constraint 2]
- Practice is offline-capable: questions load from static JSON (bundled/cached); progress
  writes queue locally and sync on reconnect. [architecture constraint 4]
- ACARA content description codes (AC9M[Year][Strand][Number]) are the canonical taxonomy
  across content, data, and UI.

## 5. Content integrity

- Every question carries: year level, strand, substrand, ACARA code, difficulty (1–3). [spec]
- No question or worked solution ships unverified. AI-assisted authoring is allowed, but a
  human (mathematician) must verify before `verified: true` is set, and only `verified: true`
  content is included in a build. [spec open question 2, made invariant]
- Minimum 20 questions per substrand at launch. [spec]
- Mistakes are repaired, not punished: incorrect answers enter repair states (progressive
  hints / worked solution), never a shaming failure state. Reserve red for technical errors
  only. Repair logic is implemented as DETERMINISTIC rules over the static bank, not an LLM.
  [Milo principle, reconciled with §4]

## 6. Process & quality

- Tests must pass before any merge. Security and privacy invariants are TDD'd FIRST
  (see `PLAN.md` → Tripwires).
- Small commits; every change behind git.
- Human review is REQUIRED for any change touching: auth, the database schema, RLS policies,
  anything privacy-related, or anything on the scope-locked list. Agents may draft these but
  not merge them unreviewed.
- Build to WCAG 2.1 AA from day one (a formal third-party audit may wait). [compliance]

## 7. Escalation

When a task conflicts with any rule here, or touches a scope-locked area, the agent STOPS and
asks a human. "Scope-locked" = auth, DB schema / RLS, privacy & consent flows, data-residency
config, the content verification gate, and anything in §1's OUT list. Enforcement of these
rules is automated wherever possible — see `PLAN.md` → "Tripwires".
