/**
 * TRIPWIRE: no-PII-field
 * Fails if any migration SQL contains a column name from the PII denylist.
 * Enforces CONTRACT.md §2 (APP 3): never collect dob, address, phone, government IDs.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

const MIGRATIONS_DIR = resolve(__dirname, '../../supabase/migrations')

// Any column name containing these strings (case-insensitive) is banned.
const PII_DENYLIST = [
  'dob',
  'birth',
  'date_of_birth',
  'address',
  'street',
  'suburb',
  'postcode',
  'phone',
  'mobile',
  'ssn',
  'medicare',
  'passport',
  'licence',
  'license',
  'tax_file',
  'tfn',
  'government_id',
  'national_id',
]

function getMigrationFiles(): string[] {
  try {
    return readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .map(f => join(MIGRATIONS_DIR, f))
  } catch {
    return []
  }
}

/** Strip SQL line comments before scanning — avoids false positives from
 *  comments that document the denylist itself (e.g. "-- no passport column"). */
function stripSQLComments(sql: string): string {
  return sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')
}

describe('no-PII-field tripwire', () => {
  it('migration SQL files contain no banned PII column names', () => {
    const files = getMigrationFiles()
    expect(files.length, 'No migration files found — expected at least one').toBeGreaterThan(0)

    const violations: string[] = []

    for (const file of files) {
      const sql = stripSQLComments(readFileSync(file, 'utf-8')).toLowerCase()
      // Match column definitions: word boundary around the column name
      for (const banned of PII_DENYLIST) {
        // Look for the pattern as a column name in CREATE TABLE or ALTER TABLE ADD COLUMN
        const pattern = new RegExp(`\\b${banned}\\b\\s+\\w`, 'i')
        if (pattern.test(sql)) {
          violations.push(`${file.split('/').pop()}: column matching "${banned}"`)
        }
      }
    }

    expect(
      violations,
      `PII column names found in migrations:\n${violations.join('\n')}`
    ).toHaveLength(0)
  })

  it('migration SQL never adds an email column to student_profiles', () => {
    const files = getMigrationFiles()
    for (const file of files) {
      const sql = stripSQLComments(readFileSync(file, 'utf-8')).toLowerCase()
      // Extract only the CREATE TABLE student_profiles block and check for email there
      const block = sql.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?student_profiles\s*\([^;]+\)/is)?.[0] ?? ''
      if (/\bemail\b/.test(block)) {
        throw new Error(
          `student_profiles must never have an email column — found in ${file.split('/').pop()}`
        )
      }
    }
  })
})
