-- Migration 0005: learning_trace fields on question_attempts
-- These three columns power the repair engine analytics and SpacedRetrievalBand.
-- Note: the brief referenced this as 0003_learning_trace.sql but that number was
-- already taken by 0003_pin_verify_fn.sql, so this is 0005.

ALTER TABLE question_attempts
  ADD COLUMN detected_error_id TEXT        NULL,
  ADD COLUMN hint_ids_shown    TEXT[]      NOT NULL DEFAULT '{}',
  ADD COLUMN repair_success    BOOLEAN     NULL;

-- Index for SpacedRetrievalBand queries: find substrands with prior repair failures
-- for a given student, ordered by recency.
CREATE INDEX idx_question_attempts_repair
  ON question_attempts (session_id, repair_success)
  WHERE repair_success = false;
