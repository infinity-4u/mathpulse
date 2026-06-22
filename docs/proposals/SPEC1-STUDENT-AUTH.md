# PROPOSAL — SPEC 1: Student Auth Principal
**Status: AWAITING RATIFICATION** — do not implement until approved.
Cross-reference: CONTRACT.md §2 §3, architecture.md → Auth model.

---

## The problem

Students have no `auth.users` row. Every existing RLS policy keys off `auth.uid()`. In the
teacher-led, student-own-device flow a student opens the app, enters a PIN, and practices
— but there is no Supabase identity for them. Without a JWT that Supabase accepts, RLS
cannot enforce student-level isolation at the database layer, and all student reads would
require the service-role key (bypassing RLS entirely — a CONTRACT.md §3 violation).

---

## Proposed solution: backend-signed student JWT

### Token structure

```json
{
  "sub":        "<student_profile_id>",
  "role":       "student",
  "student_id": "<student_profile_id>",
  "class_ids":  ["<uuid>", "<uuid>"],
  "iat":        1234567890,
  "exp":        1234567890 + 28800
}
```

- Signed with `SUPABASE_JWT_SECRET` (same secret Supabase uses for its own tokens).
  Supabase will validate and trust the token; the claims are readable in RLS via
  `auth.jwt()`.
- `exp`: 8 hours. Short enough to limit exposure; long enough for a school day.
- No PII in claims. `student_id` is the UUID primary key from `student_profiles` — not a
  name, email, or any identifier that maps to a real person outside the DB.
- `class_ids` allows RLS to confirm the student is enrolled without a join in every policy.

### How it is issued — two paths

**Parent-grant (home device)**
1. Parent is authenticated (normal Supabase JWT via `auth.uid()`).
2. Parent selects child from their profile → POST `/api/auth/student-token`
   with `{ student_id }`.
3. Server verifies: `parent_student` row exists for `(auth.uid(), student_id)`.
4. Server signs and returns student JWT.
5. Client stores JWT in **memory only** (React context / Zustand store).
   Never `localStorage`, never `sessionStorage` — CONTRACT.md §4 and browser
   security best practice.

**PIN-grant (school device, shared)**
1. Student navigates to `/practice`, enters a 6-digit PIN.
2. POST `/api/auth/pin` with `{ pin }` — no student_id sent by client.
3. Server runs `SELECT id FROM student_profiles WHERE pin_hash = crypt($1, pin_hash)`
   (bcrypt constant-time compare). Returns at most one row.
4. Server signs and returns student JWT (same structure as above).
5. JWT stored in memory for the session only.

### Schema addition required (SCOPE-LOCKED — needs human review)

```sql
-- Add to 0001_initial_schema.sql or new migration 0002_student_pin.sql
ALTER TABLE student_profiles
  ADD COLUMN pin_hash TEXT;  -- bcrypt hash; NULL until parent sets a PIN

-- PIN is set by the parent, not the student:
-- UPDATE student_profiles SET pin_hash = crypt($pin, gen_salt('bf', 10))
-- WHERE id = $student_id AND created_by_id = auth.uid()
```

`pin_hash` is NOT in the PII denylist. It stores a bcrypt hash, not a PIN or any personal
identifier. The no-PII-field tripwire does not flag it. However, as a schema change on a
scope-locked table it requires human review per CONTRACT.md §6.

### RLS policy additions (SCOPE-LOCKED)

Add to each student-readable table. Example for `practice_sessions`:

```sql
-- Student reads their own sessions via JWT claim
CREATE POLICY "student_reads_own_sessions" ON practice_sessions
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'student'
    AND (auth.jwt() ->> 'student_id')::UUID = practice_sessions.student_id
  );

-- Student inserts their own sessions
CREATE POLICY "student_inserts_own_sessions" ON practice_sessions
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role') = 'student'
    AND (auth.jwt() ->> 'student_id')::UUID = student_id
  );
```

Same pattern for `question_attempts` (keyed via session → student_id join) and
`class_enrolments` (read-only; keyed on `class_ids` claim to avoid a join):

```sql
CREATE POLICY "student_reads_own_enrolments" ON class_enrolments
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'student'
    AND class_id = ANY(
      ARRAY(SELECT jsonb_array_elements_text(auth.jwt()->'class_ids'))::UUID[]
    )
    AND student_id = (auth.jwt() ->> 'student_id')::UUID
  );
```

Students have no write access to `classes`, `assignments`, `parent_profiles`,
`teacher_profiles`, or `parent_student`. No policy grants it.

### Token refresh

The `/api/auth/pin` and `/api/auth/student-token` endpoints also return `expires_at`.
Client-side: if `expires_at - now() < 30 minutes`, silently re-request (parent-grant path)
or show "Session expiring — enter PIN again" (PIN-grant path). No refresh tokens: the
PIN or parent session re-issues a fresh JWT.

### Security properties

- JWT secret never leaves the server. No client-side signing.
- 8-hour expiry limits blast radius of a stolen token.
- `class_ids` claim is verified server-side at issue time (enrolment check). Client
  cannot forge class membership.
- PIN brute-force: rate-limit `/api/auth/pin` to 5 attempts per minute per IP.
  Lockout after 10 failures within 5 minutes — reset by parent.
- No student PII in the JWT payload; the UUID maps to PII only inside the DB, behind RLS.

### Required changes to architecture.md

- Add "Student JWT" sub-section under Auth model.
- Add `pin_hash` to the student_profiles schema diagram with a note that it is not PII.
- Update the RLS policy examples to show both `auth.uid()` (parent/teacher) and
  `auth.jwt() ->> 'student_id'` (student) patterns.

### Open question for ratification

Is 8 hours the right expiry? Alternative: 4 hours (shorter school day slice, lower
exposure). Affects UX on long school days — students would need to re-enter PIN.
