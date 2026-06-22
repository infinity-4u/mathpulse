/**
 * TRIPWIRE: rls-on
 * Fails if any user-data table in migrations lacks ENABLE ROW LEVEL SECURITY.
 * Enforces CONTRACT.md §3: RLS at the database level, never app-layer only.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

const MIGRATIONS_DIR = resolve(__dirname, '../../supabase/migrations')

// Every table that holds user data must have RLS enabled.
// This list must be updated when new user-data tables are added.
const USER_DATA_TABLES = [
  'parent_profiles',
  'teacher_profiles',
  'student_profiles',
  'parent_student',
  'classes',
  'class_enrolments',
  'assignments',
  'practice_sessions',
  'question_attempts',
]

function getAllMigrationSQL(): string {
  try {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .map(f => readFileSync(join(MIGRATIONS_DIR, f), 'utf-8'))
    return files.join('\n')
  } catch {
    return ''
  }
}

describe('rls-on tripwire', () => {
  it('every user-data table has ENABLE ROW LEVEL SECURITY', () => {
    const sql = getAllMigrationSQL()
    expect(sql.length, 'No migration SQL found').toBeGreaterThan(0)

    const missing: string[] = []

    for (const table of USER_DATA_TABLES) {
      // Check for: ALTER TABLE <table> ENABLE ROW LEVEL SECURITY
      const pattern = new RegExp(
        `alter\\s+table\\s+(if\\s+exists\\s+)?${table}\\s+enable\\s+row\\s+level\\s+security`,
        'i'
      )
      if (!pattern.test(sql)) {
        missing.push(table)
      }
    }

    expect(
      missing,
      `Tables missing ENABLE ROW LEVEL SECURITY: ${missing.join(', ')}`
    ).toHaveLength(0)
  })

  it('every user-data table has at least one RLS policy', () => {
    const sql = getAllMigrationSQL()
    const missing: string[] = []

    for (const table of USER_DATA_TABLES) {
      const pattern = new RegExp(`create\\s+policy\\s+\\S+\\s+on\\s+${table}`, 'i')
      if (!pattern.test(sql)) {
        missing.push(table)
      }
    }

    expect(
      missing,
      `Tables with RLS enabled but no policies defined: ${missing.join(', ')}`
    ).toHaveLength(0)
  })
})
