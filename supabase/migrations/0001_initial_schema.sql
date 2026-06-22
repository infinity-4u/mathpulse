-- Migration: 0001_initial_schema
-- SCOPE-LOCKED: changes to this file require human review (CONTRACT.md §6, PLAN.md → Tripwires)
--
-- CONTRACT.md §2 invariants enforced here:
--   - No dob, address, phone, ssn, medicare, passport columns (no-PII-field tripwire checks this)
--   - Students never get auth.users rows — student_profiles reference creator's user_id
--   - "Delete" = cascade hard delete on all child tables

-- Enable RLS on ALL user-data tables (rls-on tripwire checks this)

-- ─── Parent profiles ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS parent_profiles (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL
);

ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parents_own_profile" ON parent_profiles
  FOR ALL USING (auth.uid() = user_id);

-- ─── Teacher profiles ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teacher_profiles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  school_name TEXT,
  state       TEXT CHECK (state IN ('NSW','VIC','QLD','WA','SA','TAS','ACT','NT'))
);

ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_own_profile" ON teacher_profiles
  FOR ALL USING (auth.uid() = user_id);

-- ─── Student profiles ──────────────────────────────────────────────────────────
-- Note: students do NOT have auth.users rows.
-- created_by_id is the parent's or teacher's auth.users id.
-- display_name is a nickname only — no real name required.

CREATE TABLE IF NOT EXISTS student_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name     TEXT NOT NULL,
  year_level       INT  NOT NULL CHECK (year_level BETWEEN 7 AND 10),
  created_by_role  TEXT NOT NULL CHECK (created_by_role IN ('teacher','parent')),
  created_by_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Parent sees their children; teacher sees students they created
CREATE POLICY "creator_sees_student" ON student_profiles
  FOR ALL USING (auth.uid() = created_by_id);

-- ─── Parent–student link ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS parent_student (
  parent_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

ALTER TABLE parent_student ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parents_see_own_links" ON parent_student
  FOR ALL USING (auth.uid() = parent_id);

-- ─── Classes ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  year_level  INT  NOT NULL CHECK (year_level BETWEEN 7 AND 10),
  join_code   TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_own_classes" ON classes
  FOR ALL USING (auth.uid() = teacher_id);

-- ─── Class enrolments ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS class_enrolments (
  class_id    UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id  UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);

ALTER TABLE class_enrolments ENABLE ROW LEVEL SECURITY;

-- Teacher sees enrolments for their classes; parent sees enrolments for their child
CREATE POLICY "teacher_sees_class_enrolments" ON class_enrolments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_enrolments.class_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "parent_sees_child_enrolments" ON class_enrolments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_student ps
      WHERE ps.student_id = class_enrolments.student_id AND ps.parent_id = auth.uid()
    )
  );

-- ─── Assignments ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  substrand_code  TEXT NOT NULL,   -- ACARA code e.g. "AC9M7N01"
  due_date        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_manages_assignments" ON assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = assignments.class_id AND c.teacher_id = auth.uid()
    )
  );

-- Students (via parent) can read assignments for their class
CREATE POLICY "student_reads_assignments" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_enrolments ce
      JOIN parent_student ps ON ps.student_id = ce.student_id
      WHERE ce.class_id = assignments.class_id AND ps.parent_id = auth.uid()
    )
  );

-- ─── Practice sessions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS practice_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  substrand_code  TEXT NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  source          TEXT NOT NULL CHECK (source IN ('assignment','free_practice')),
  assignment_id   UUID REFERENCES assignments(id) ON DELETE SET NULL
);

ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- Parent sees their child's sessions
CREATE POLICY "parent_sees_child_sessions" ON practice_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_student ps
      WHERE ps.student_id = practice_sessions.student_id AND ps.parent_id = auth.uid()
    )
  );

-- Teacher sees sessions from their class enrolments
CREATE POLICY "teacher_sees_class_sessions" ON practice_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_enrolments ce
      JOIN classes c ON c.id = ce.class_id
      WHERE ce.student_id = practice_sessions.student_id AND c.teacher_id = auth.uid()
    )
  );

-- ─── Question attempts ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS question_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_id   TEXT NOT NULL,    -- static content reference, not a FK
  answer_given  TEXT,
  is_correct    BOOLEAN NOT NULL,
  hints_used    INT NOT NULL DEFAULT 0 CHECK (hints_used BETWEEN 0 AND 3),
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;

-- Access is inherited via practice_sessions — parent/teacher reach attempts through sessions
CREATE POLICY "parent_sees_child_attempts" ON question_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM practice_sessions ps
      JOIN parent_student pst ON pst.student_id = ps.student_id
      WHERE ps.id = question_attempts.session_id AND pst.parent_id = auth.uid()
    )
  );

CREATE POLICY "teacher_sees_class_attempts" ON question_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_sessions ps
      JOIN class_enrolments ce ON ce.student_id = ps.student_id
      JOIN classes c ON c.id = ce.class_id
      WHERE ps.id = question_attempts.session_id AND c.teacher_id = auth.uid()
    )
  );
