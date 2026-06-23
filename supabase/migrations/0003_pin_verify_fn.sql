-- Migration: 0003_pin_verify_fn
-- SCOPE-LOCKED: requires human review (CONTRACT.md §6)
-- Creates server-side PIN verification helpers using pgcrypto.
-- These are SECURITY DEFINER functions accessible only to the service role.
-- The raw PIN never leaves the server — bcrypt comparison happens inside PostgreSQL.

-- Ensure pgcrypto is available (enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── verify_student_pin ───────────────────────────────────────────────────────
-- Called by POST /api/auth/pin with the service role key.
-- Returns (student_id, class_ids[]) if PIN matches, empty if not.
-- SECURITY DEFINER bypasses RLS so it can scan all students' pin_hash values.

CREATE OR REPLACE FUNCTION verify_student_pin(p_pin TEXT)
RETURNS TABLE(student_id UUID, class_ids TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id AS student_id,
    ARRAY(
      SELECT ce.class_id::TEXT
      FROM class_enrolments ce
      WHERE ce.student_id = sp.id
    ) AS class_ids
  FROM student_profiles sp
  WHERE sp.pin_hash IS NOT NULL
    AND sp.pin_hash = crypt(p_pin, sp.pin_hash)
  LIMIT 1;
END;
$$;

-- Only the service role may call this function
REVOKE EXECUTE ON FUNCTION verify_student_pin(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION verify_student_pin(TEXT) TO service_role;

-- ─── set_student_pin ──────────────────────────────────────────────────────────
-- Called by PATCH /api/student/pin with the service role key.
-- Hashes the raw PIN with bcrypt and stores only the hash.
-- The parent auth check (parent owns student) is enforced in the API route BEFORE calling this.

CREATE OR REPLACE FUNCTION set_student_pin(p_student_id UUID, p_pin TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE student_profiles
  SET pin_hash = crypt(p_pin, gen_salt('bf', 10))
  WHERE id = p_student_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_student_pin(UUID, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION set_student_pin(UUID, TEXT) TO service_role;
