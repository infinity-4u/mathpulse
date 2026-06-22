# PROPOSAL — SPEC 4: RLS Negative-Test Matrix
**Status: AWAITING RATIFICATION** — implement TDD-first once approved.
Cross-reference: CONTRACT.md §3, PLAN.md → Testing strategy, architecture.md → RLS.
File to create: `tests/integration/rls.test.ts`

---

## Actors

| Actor | Auth mechanism | Notes |
|---|---|---|
| **Parent A** | Supabase JWT (`auth.uid()` = parent A's user_id) | Linked to Student A only |
| **Parent B** | Supabase JWT (`auth.uid()` = parent B's user_id) | Linked to Student B only |
| **Teacher A** | Supabase JWT (`auth.uid()` = teacher A's user_id) | Owner of Class A |
| **Teacher A (removed)** | Supabase JWT (same) | After class ownership removed |
| **Student A session** | Custom JWT (`student_id` = A, `class_ids` = [Class A]) | Signed by backend |
| **Student A session (expired)** | Same JWT, past `exp` | Supabase rejects; tests 401 |
| **Anonymous** | No token | All reads must return empty / 401 |

---

## Access matrix — must-SEE (ALLOW)

| Actor | Resource | Action | Condition |
|---|---|---|---|
| Parent A | `student_profiles` (Student A) | SELECT | own child via `created_by_id` |
| Parent A | `practice_sessions` (Student A) | SELECT | via `parent_student` link |
| Parent A | `question_attempts` (Student A) | SELECT | via session → parent_student |
| Parent A | `class_enrolments` (Student A) | SELECT | via `parent_student` link |
| Parent A | `assignments` (Class A) | SELECT | via Student A's enrolment |
| Teacher A | `classes` (Class A) | ALL | `teacher_id = auth.uid()` |
| Teacher A | `class_enrolments` (Class A) | SELECT | via `classes.teacher_id` |
| Teacher A | `practice_sessions` (Student A in Class A) | SELECT | via enrolment → class |
| Teacher A | `question_attempts` (Student A) | SELECT | via session → enrolment |
| Teacher A | `assignments` (Class A) | ALL | via `classes.teacher_id` |
| Student A | `practice_sessions` (own) | SELECT + INSERT | JWT claim `student_id` |
| Student A | `question_attempts` (own) | SELECT + INSERT | via session → `student_id` |
| Student A | `class_enrolments` (own) | SELECT | JWT `class_ids` claim |
| Student A | `assignments` (Class A) | SELECT | via enrolment |

---

## Access matrix — must-NOT-see (DENY)

| Actor | Resource | Attempted access | Expected result |
|---|---|---|---|
| Parent A | `student_profiles` (Student B) | SELECT | Empty result set (no error, zero rows) |
| Parent A | `practice_sessions` (Student B) | SELECT | Empty result set |
| Parent A | `teacher_profiles` (any) | SELECT | Empty result set |
| Parent A | `classes` (any) | SELECT | Empty result set |
| Parent A | `parent_profiles` (Parent B) | SELECT | Empty result set |
| Parent B | `practice_sessions` (Student A) | SELECT | Empty result set |
| Teacher A | `practice_sessions` (Student C, different class) | SELECT | Empty result set |
| Teacher A | `parent_profiles` (any) | SELECT | Empty result set |
| Teacher A | `student_profiles` (not created by Teacher A) | SELECT | Empty result set |
| Teacher A (removed) | `practice_sessions` (former Class A students) | SELECT | Empty result set |
| Student A | `practice_sessions` (Student B) | SELECT | Empty result set |
| Student A | `parent_profiles` (any) | SELECT | Empty result set |
| Student A | `teacher_profiles` (any) | SELECT | Empty result set |
| Student A | `classes` (any) | SELECT | Empty result set |
| Student A | `student_profiles` (Student B) | SELECT | Empty result set |
| Student A | `class_enrolments` (Class B, not enrolled) | SELECT | Empty result set |
| Student A (expired JWT) | Anything | Any | 401 Unauthorised |
| Anonymous | Any table | Any | Empty result set or 401 |

---

## Destructive-action tests

### 1. Parent hard-deletes Student A
```
GIVEN: Student A has 3 practice_sessions, 12 question_attempts, 1 class_enrolment
WHEN:  DELETE FROM student_profiles WHERE id = student_a_id
THEN:
  - practice_sessions for Student A: 0 rows
  - question_attempts for Student A (via sessions): 0 rows
  - class_enrolments for Student A: 0 rows
  - parent_student for Student A: 0 rows
  - No orphaned question_attempts with session_id referencing deleted session
```

### 2. Teacher A removed from Class A
```
GIVEN: Teacher A owns Class A with 5 enrolled students
WHEN:  DELETE FROM classes WHERE id = class_a_id AND teacher_id = teacher_a_id
        (or UPDATE classes SET teacher_id = teacher_b_id)
THEN:
  - Teacher A SELECT practice_sessions for former Class A students: 0 rows
  - Teacher A SELECT class_enrolments for Class A: 0 rows
  - Teacher A SELECT assignments for Class A: 0 rows
  - Students' own data unchanged (not deleted)
```

### 3. Class hard-deleted
```
GIVEN: Class A has 3 students enrolled, 2 assignments
WHEN:  DELETE FROM classes WHERE id = class_a_id
THEN:
  - class_enrolments for Class A: 0 rows (CASCADE)
  - assignments for Class A: 0 rows (CASCADE)
  - practice_sessions for students: UNCHANGED (source: assignment sets assignment_id to NULL)
  - Students can still access their practice history
```

### 4. Account hard-delete cascade
```
GIVEN: Parent A account, linked to Student A, Student A has full practice history
WHEN:  DELETE FROM auth.users WHERE id = parent_a_user_id
THEN:
  - parent_profiles: 0 rows for Parent A (CASCADE from auth.users)
  - student_profiles: 0 rows (CASCADE via created_by_id)
  - practice_sessions: 0 rows (CASCADE via student_id)
  - question_attempts: 0 rows (CASCADE via session_id)
  - parent_student: 0 rows (CASCADE via parent_id)
  - No orphaned rows in any table
```

### 5. Audit logs contain no banned PII
```
GIVEN: A complete practice session has been recorded
WHEN:  Scan application logs (console output, any log files)
THEN:
  - No student display_name in logs
  - No parent/teacher email in logs
  - No PIN or pin_hash in logs
  - UUIDs only (student_id, session_id) — these are not PII
  - No request body contents logged (answer_given must not appear in logs)
```

---

## Test implementation notes for Claude Code

- Use Supabase test instance (`SUPABASE_TEST_URL` + `SUPABASE_TEST_SERVICE_KEY`).
- Use service-role key **only** to set up test fixtures (insert rows). All assertions
  run under the actor's own credentials (anon key + JWT).
- For student JWT tests: sign tokens locally using `SUPABASE_JWT_SECRET` from test env.
- Run each DENY assertion; assert `data.length === 0` (not just `error === null`).
- Destructive tests: use transactions or per-test fixture isolation to avoid state bleed.
- Tests in this file are tagged `@integration` — run with `SUPABASE_TEST_URL` set;
  skipped in the no-database CI run.
- All 26 DENY assertions + 5 destructive tests must pass before Phase 1 merges.

---

## Flag: school admin actor

The matrix above has no "school admin" actor. The current schema has no such role.
If this is needed (e.g., for multi-class school views), it requires a new `school_admin`
role in `auth.users` metadata and new RLS policies — a scope-locked schema change needing
human sign-off. **Not proposed for V1.** Flag for Phase 3 when district adoption begins.
