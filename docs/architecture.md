# Architecture — Australian Maths App (V1)

> Binding constraints: [CONTRACT.md](CONTRACT.md). Stack decisions here are committed for V1. Reversing any of them requires human sign-off per CONTRACT.md §4.

---

## Core principle

Curriculum content is static data versioned with the codebase. The database stores only user accounts, class structure, and progress records. This keeps the schema simple, makes content auditable via git, enables offline practice (questions load from bundled assets; progress syncs when connected), and removes any risk of question content leaking through database access. See CONTRACT.md §4.

---

## Stack (committed — Option A)

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js (App Router, SSR) | Web-first, fast initial load, large ecosystem, good for SEO on public pages |
| Database + Auth | Supabase (Postgres + Auth + RLS) | Auth and RLS in one service; Sydney region (ap-southeast-2) satisfies data sovereignty |
| Math rendering | KaTeX | Faster than MathJax in React; all notation in KaTeX, never images without alt text |
| Deployment | Vercel, edge pinned to Sydney | Edge functions that touch user data must be pinned to ap-southeast-2 |
| Transactional email | AU/EU-hosted provider (e.g. Postmark AU region) | No US-only SaaS for anything touching user records (APP 8) |

**Data residency is non-negotiable:** Supabase Sydney (ap-southeast-2) for all database and auth. No user data in US regions. Vercel edge functions pinned to Sydney if processing user data. See CONTRACT.md §2 and compliance.md.

Native mobile apps (iOS/Android) are explicitly out of V1. Revisit only if user research shows school iPads require it. See CONTRACT.md §1.

---

## Data model

### Users and roles

```sql
-- Users (Supabase auth.users handles credentials; profiles extend it)

CREATE TABLE parent_profiles (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL
);

CREATE TABLE teacher_profiles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  school_name TEXT,
  state       TEXT CHECK (state IN ('NSW','VIC','QLD','WA','SA','TAS','ACT','NT'))
);

CREATE TABLE student_profiles (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name     TEXT NOT NULL,   -- nickname only, no real name required
  year_level       INT  NOT NULL CHECK (year_level BETWEEN 7 AND 10),
  created_by_role  TEXT NOT NULL CHECK (created_by_role IN ('teacher','parent')),
  created_by_id    UUID NOT NULL REFERENCES auth.users(id)
  -- CONTRACT.md §2: NEVER add dob, address, phone, or any government ID column
);

CREATE TABLE parent_student (
  parent_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);
```

### Classes and assignments

```sql
CREATE TABLE classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  year_level  INT  NOT NULL CHECK (year_level BETWEEN 7 AND 10),
  join_code   TEXT NOT NULL UNIQUE,  -- short alphanumeric, teacher shares out-of-band
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE class_enrolments (
  class_id    UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);

CREATE TABLE assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  substrand_code  TEXT NOT NULL,  -- ACARA code e.g. "AC9M7N01"
  due_date        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Progress

```sql
CREATE TABLE practice_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  substrand_code  TEXT NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  source          TEXT NOT NULL CHECK (source IN ('assignment','free_practice')),
  assignment_id   UUID REFERENCES assignments(id) ON DELETE SET NULL
);

CREATE TABLE question_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_id   TEXT NOT NULL,   -- references static content filename, NOT a FK
  answer_given  TEXT,
  is_correct    BOOLEAN NOT NULL,
  hints_used    INT NOT NULL DEFAULT 0 CHECK (hints_used BETWEEN 0 AND 3),
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**What is NOT in the database** (CONTRACT.md §4): question content, worked solutions, hint text, curriculum metadata, strands, substrands, year-level structure. All of this is static JSON in `/content/curriculum/`.

### Hard delete

"Delete" means permanent removal of every record for a student — no soft-delete flag. Cascading `ON DELETE CASCADE` on all child tables achieves this at the database level. A working hard-delete endpoint exists before launch (CONTRACT.md §2, compliance.md Phase 0).

---

## Row-level security (RLS)

RLS is enforced at the DATABASE level, not in application code (CONTRACT.md §3). Key policies:

- Students read only their own practice_sessions and question_attempts
- Parents read only their linked child's records (via parent_student join)
- Teachers read only records for students enrolled in their classes
- No user reads another user's profile

These policies are TDD'd as integration tests before the feature code that depends on them. See PLAN.md → Testing strategy.

---

## Curriculum content structure

Questions live as static JSON files under `/content/curriculum/`, version-controlled. Filename = ACARA content description code. See [curriculum-structure.md](curriculum-structure.md) for the full taxonomy.

```
/content/curriculum/
  year-7/
    number/          AC9M7N01.json  AC9M7N02.json  ...
    algebra/         AC9M7A01.json  ...
    measurement/     AC9M7M01.json  ...
    space/           AC9M7SP01.json ...
    statistics/      AC9M7ST01.json ...
    probability/     AC9M7P01.json  ...
  year-8/  year-9/  year-10/   (same structure)
```

Each JSON file schema:

```json
{
  "code": "AC9M7N01",
  "year": 7,
  "strand": "Number and Algebra",
  "substrand": "Number",
  "acara_description": "Describe the relationship between perfect square numbers and square roots...",
  "verified": true,
  "questions": [
    {
      "id": "AC9M7N01-001",
      "type": "multiple_choice",
      "stem": "What is √144?",
      "options": ["10", "11", "12", "14"],
      "correct": "12",
      "difficulty": 1,
      "common_errors": [
        { "answer": "72", "type": "conceptual", "note": "Student halved instead of finding square root" },
        { "answer": "14", "type": "careless",   "note": "Confused √144 with √196" }
      ],
      "hints": [
        "Think about which number, multiplied by itself, gives 144.",
        "Try 12 × 12. What do you get?",
        "12 × 12 = 144. So √144 = ?"
      ],
      "worked_solution": "We need n where n × n = 144.\nTesting: 10×10=100, 11×11=121, 12×12=144. ✓\nTherefore √144 = 12."
    }
  ]
}
```

`verified: true` must be set by a human mathematician after reviewing each question and worked solution. The content gate in CI refuses any file with `verified: false` or missing the flag (CONTRACT.md §5, PLAN.md → Tripwires).

---

## Mistake-repair logic (deterministic — no LLM)

When a student answers incorrectly, the repair sequence is selected by deterministic rules over the static bank. CONTRACT.md §4 and §5 prohibit any LLM call in this path.

Rules:
1. Check `common_errors` array for a matching answer pattern
2. If matched: use `type` field to select hint framing (conceptual / procedural / careless)
3. If not matched: fall back to the generic hint sequence (hints[0] → hints[1] → hints[2])
4. After hint 3: worked_solution unlocks automatically
5. Colour: never red for wrong answers. Reserve red for technical errors only (network, timeout)

This logic lives in `src/lib/repair.ts` as pure functions, fully unit-testable without a database or LLM.

---

## Auth model

Students cannot self-register (CONTRACT.md §2). Two paths:

**Teacher-led**
1. Teacher creates account → creates class → shares join code out-of-band (e.g. tells students in class)
2. Parent receives join code, creates parent account, registers child with join code
3. Student accesses via parent's session or a child PIN (no separate child email account)

**Parent-led (home context)**
1. Parent creates account
2. Parent creates child profile (display name + year level only)
3. Child accesses app via parent's device or child PIN

No child ever creates an account with an email address. No Supabase auth.user row is created for students — student_profiles reference the parent's or teacher's user_id as creator.

---

## Offline capability

Practice questions load from static JSON (bundled or cached via service worker). Progress writes queue locally (IndexedDB) and sync to Supabase on reconnect. Required for school environments with unreliable Wi-Fi (CONTRACT.md §4).
