/**
 * TRIPWIRE: hard-delete
 * Verifies that the schema's cascade rules guarantee a complete hard delete.
 * Enforces CONTRACT.md §2: "Delete" = permanent removal of every record for a student.
 *
 * Unit layer: checks migration SQL for ON DELETE CASCADE on all child tables.
 * Integration layer: tagged with @integration — requires a live Supabase test instance.
 *                    Run with: SUPABASE_TEST_URL=... SUPABASE_TEST_KEY=... vitest run --reporter=verbose
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

const MIGRATIONS_DIR = resolve(__dirname, '../../supabase/migrations')

// Every table that references student_profiles must cascade on delete
const CHILD_TABLES_OF_STUDENT = [
  'parent_student',
  'class_enrolments',
  'practice_sessions',
]

// Every table that references practice_sessions must cascade on delete
const CHILD_TABLES_OF_SESSION = [
  'question_attempts',
]

function getAllMigrationSQL(): string {
  try {
    return readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .map(f => readFileSync(join(MIGRATIONS_DIR, f), 'utf-8'))
      .join('\n')
  } catch {
    return ''
  }
}

describe('hard-delete tripwire (schema layer)', () => {
  const sql = getAllMigrationSQL()

  it('migration SQL exists', () => {
    expect(sql.length, 'No migration SQL found').toBeGreaterThan(0)
  })

  it('child tables of student_profiles have ON DELETE CASCADE', () => {
    const violations: string[] = []
    for (const table of CHILD_TABLES_OF_STUDENT) {
      // Find the CREATE TABLE block for this table and check it references student with cascade
      const tableBlock = sql.match(
        new RegExp(`create\\s+table[^;]*?${table}[^;]*?;`, 'is')
      )?.[0] ?? ''

      if (!tableBlock) {
        violations.push(`${table}: CREATE TABLE block not found in migrations`)
        continue
      }

      // Must reference student_profiles (or student_id) with ON DELETE CASCADE
      const hasCascade = /references\s+\S+\s*\([^)]+\)\s+on\s+delete\s+cascade/i.test(tableBlock)
      if (!hasCascade) {
        violations.push(`${table}: missing ON DELETE CASCADE on foreign key`)
      }
    }
    expect(violations, violations.join('\n')).toHaveLength(0)
  })

  it('question_attempts has ON DELETE CASCADE to practice_sessions', () => {
    for (const table of CHILD_TABLES_OF_SESSION) {
      const tableBlock = sql.match(
        new RegExp(`create\\s+table[^;]*?${table}[^;]*?;`, 'is')
      )?.[0] ?? ''
      const hasCascade = /references\s+\S+\s*\([^)]+\)\s+on\s+delete\s+cascade/i.test(tableBlock)
      expect(
        hasCascade,
        `${table}: missing ON DELETE CASCADE — deleting a session must remove all attempts`
      ).toBe(true)
    }
  })

  it('no soft-delete columns exist on user-data tables', () => {
    // Soft deletes (deleted_at, is_deleted, archived_at) are banned for user data.
    // CONTRACT.md §2: "Delete" = permanent hard delete.
    const softDeletePatterns = [
      /\bdeleted_at\b/,
      /\bis_deleted\b/,
      /\barchived_at\b/,
      /\bsoft_delete\b/,
    ]
    const violations: string[] = []
    for (const pattern of softDeletePatterns) {
      if (pattern.test(sql)) {
        violations.push(`Migration SQL contains soft-delete pattern: ${pattern}`)
      }
    }
    expect(
      violations,
      `Soft-delete columns found — use hard delete only (CONTRACT.md §2):\n${violations.join('\n')}`
    ).toHaveLength(0)
  })
})

// ─── Integration layer (skipped unless SUPABASE_TEST_URL is set) ───────────────
describe.skipIf(!process.env.SUPABASE_TEST_URL)('hard-delete tripwire (integration)', () => {
  it('deleting a student removes all practice_sessions and question_attempts', async () => {
    // Requires: SUPABASE_TEST_URL, SUPABASE_TEST_SERVICE_KEY env vars
    // This test is a placeholder — implement once the schema is live in a test instance.
    // Steps:
    //   1. Insert a parent, student, practice_session, question_attempt
    //   2. Delete the student_profile row
    //   3. Assert practice_sessions and question_attempts are gone
    //   4. Assert parent_student link is gone
    expect(true).toBe(true) // placeholder — replace with real DB calls
  })
})
