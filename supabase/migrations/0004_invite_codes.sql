-- Migration 0004: invite_codes
-- Teacher registration uses a one-time invite code from this table.
-- No RLS — this table is only accessed via service_role in the teacher-register route.

CREATE TABLE invite_codes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT        UNIQUE NOT NULL,
  used_at    TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed two codes for V1 teacher onboarding (10 teachers target)
INSERT INTO invite_codes (code) VALUES
  ('AUSMATHS-TEACH-2026-A'),
  ('AUSMATHS-TEACH-2026-B'),
  ('AUSMATHS-TEACH-2026-C'),
  ('AUSMATHS-TEACH-2026-D'),
  ('AUSMATHS-TEACH-2026-E'),
  ('AUSMATHS-TEACH-2026-F'),
  ('AUSMATHS-TEACH-2026-G'),
  ('AUSMATHS-TEACH-2026-H'),
  ('AUSMATHS-TEACH-2026-I'),
  ('AUSMATHS-TEACH-2026-J');
