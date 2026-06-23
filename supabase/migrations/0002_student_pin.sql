-- Migration: 0002_student_pin
-- SCOPE-LOCKED: requires human review (CONTRACT.md §6)
-- Adds pin_hash column and student JWT RLS policies per SPEC1 + SPEC4.

-- ─── student_profiles: add PIN hash ─────────────────────────────────────────
-- pin_hash is NOT a PII field (bcrypt hash of PIN only, not personally identifiable).
-- no-pii-field tripwire does not flag this column.

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- ─── practice_sessions: student reads/inserts own via JWT claim ──────────────

CREATE POLICY "student_reads_own_sessions" ON practice_sessions
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'student'
    AND (auth.jwt() ->> 'student_id')::UUID = practice_sessions.student_id
  );

CREATE POLICY "student_inserts_own_sessions" ON practice_sessions
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role') = 'student'
    AND (auth.jwt() ->> 'student_id')::UUID = student_id
  );

-- ─── question_attempts: student reads and inserts own via session join ────────

CREATE POLICY "student_reads_own_attempts" ON question_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_sessions ps
      WHERE ps.id = question_attempts.session_id
        AND (auth.jwt() ->> 'student_id')::UUID = ps.student_id
        AND (auth.jwt() ->> 'role') = 'student'
    )
  );

CREATE POLICY "student_inserts_own_attempts" ON question_attempts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM practice_sessions ps
      WHERE ps.id = question_attempts.session_id
        AND (auth.jwt() ->> 'student_id')::UUID = ps.student_id
        AND (auth.jwt() ->> 'role') = 'student'
    )
  );

-- ─── class_enrolments: student reads own via class_ids JWT claim ─────────────

CREATE POLICY "student_reads_own_enrolments" ON class_enrolments
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'student'
    AND class_id = ANY(
      ARRAY(SELECT jsonb_array_elements_text(auth.jwt() -> 'class_ids'))::UUID[]
    )
    AND student_id = (auth.jwt() ->> 'student_id')::UUID
  );

-- ─── assignments: student reads for enrolled classes via JWT claim ────────────
-- Distinct name from 0001's parent-path "student_reads_assignments" policy.

CREATE POLICY "student_jwt_reads_assignments" ON assignments
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'student'
    AND class_id = ANY(
      ARRAY(SELECT jsonb_array_elements_text(auth.jwt() -> 'class_ids'))::UUID[]
    )
  );
