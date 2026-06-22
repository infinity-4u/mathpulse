/**
 * TRIPWIRE: content-gate
 * Fails if any question JSON:
 *   - lacks required fields (code, year, strand, substrand, verified, questions)
 *   - has verified: false or missing verified flag
 *   - has a filename that doesn't match its "code" field
 *   - has a question missing required tags (id, type, stem, correct, difficulty, hints, worked_solution)
 *   - has fewer than 20 questions per substrand (enforced when --full flag is set)
 * Enforces CONTRACT.md §4 and §5.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, join, basename, extname } from 'path'

const CURRICULUM_DIR = resolve(__dirname, '../../content/curriculum')

interface QuestionFile {
  code: string
  year: number
  strand: string
  substrand: string
  verified: boolean
  questions: Question[]
}

interface Question {
  id: string
  type: 'multiple_choice' | 'numeric'
  stem: string
  correct: string
  difficulty: 1 | 2 | 3
  hints: string[]
  worked_solution: string
  options?: string[]       // required for multiple_choice
  common_errors?: object[]
}

const REQUIRED_FILE_FIELDS: (keyof QuestionFile)[] = [
  'code', 'year', 'strand', 'substrand', 'verified', 'questions',
]

const REQUIRED_QUESTION_FIELDS: (keyof Question)[] = [
  'id', 'type', 'stem', 'correct', 'difficulty', 'hints', 'worked_solution',
]

function getAllQuestionFiles(dir: string): string[] {
  const results: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        results.push(...getAllQuestionFiles(full))
      } else if (entry.endsWith('.json') && entry.startsWith('AC9M')) {
        results.push(full)
      }
    }
  } catch {
    // dir may not exist yet — not a tripwire failure at scaffold stage
  }
  return results
}

describe('content-gate tripwire', () => {
  const files = getAllQuestionFiles(CURRICULUM_DIR)

  it('curriculum directory exists', () => {
    const { existsSync } = require('fs')
    expect(existsSync(CURRICULUM_DIR), 'content/curriculum/ directory not found').toBe(true)
  })

  if (files.length === 0) {
    it.skip('no question files yet — skipping content validation (add files to trigger)', () => {})
    return
  }

  it('every question file has all required top-level fields', () => {
    const violations: string[] = []
    for (const file of files) {
      const data = JSON.parse(readFileSync(file, 'utf-8')) as Partial<QuestionFile>
      const missing = REQUIRED_FILE_FIELDS.filter(f => !(f in data))
      if (missing.length) {
        violations.push(`${basename(file)}: missing fields [${missing.join(', ')}]`)
      }
    }
    expect(violations, violations.join('\n')).toHaveLength(0)
  })

  it('every question file has verified: true', () => {
    const violations: string[] = []
    for (const file of files) {
      const data = JSON.parse(readFileSync(file, 'utf-8')) as Partial<QuestionFile>
      if (data.verified !== true) {
        violations.push(`${basename(file)}: verified is ${JSON.stringify(data.verified)} — must be true`)
      }
    }
    expect(
      violations,
      `Unverified content found (CONTRACT.md §5 — human mathematician must verify before shipping):\n${violations.join('\n')}`
    ).toHaveLength(0)
  })

  it('every filename matches its "code" field', () => {
    const violations: string[] = []
    for (const file of files) {
      const data = JSON.parse(readFileSync(file, 'utf-8')) as Partial<QuestionFile>
      const fileCode = basename(file, extname(file))
      if (data.code !== fileCode) {
        violations.push(`${basename(file)}: filename is "${fileCode}" but code field is "${data.code}"`)
      }
    }
    expect(violations, violations.join('\n')).toHaveLength(0)
  })

  it('every question in every file has required fields', () => {
    const violations: string[] = []
    for (const file of files) {
      const data = JSON.parse(readFileSync(file, 'utf-8')) as QuestionFile
      if (!Array.isArray(data.questions)) continue
      data.questions.forEach((q, i) => {
        const missing = REQUIRED_QUESTION_FIELDS.filter(f => !(f in q))
        if (missing.length) {
          violations.push(`${basename(file)} question[${i}] (${q.id ?? 'no-id'}): missing [${missing.join(', ')}]`)
        }
        // multiple_choice must have options
        if (q.type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
          violations.push(`${basename(file)} question[${i}]: type=multiple_choice but options missing or < 2`)
        }
        // difficulty must be 1, 2, or 3
        if (![1, 2, 3].includes(q.difficulty as number)) {
          violations.push(`${basename(file)} question[${i}]: difficulty must be 1, 2, or 3`)
        }
        // hints must be an array of exactly 3
        if (!Array.isArray(q.hints) || q.hints.length !== 3) {
          violations.push(`${basename(file)} question[${i}]: must have exactly 3 hints`)
        }
      })
    }
    expect(violations, violations.join('\n')).toHaveLength(0)
  })

  it('every question file has at least 20 questions', () => {
    // Only enforce when ENFORCE_MIN_QUESTIONS=true (set in CI before launch gate)
    if (process.env.ENFORCE_MIN_QUESTIONS !== 'true') return

    const violations: string[] = []
    for (const file of files) {
      const data = JSON.parse(readFileSync(file, 'utf-8')) as QuestionFile
      const count = Array.isArray(data.questions) ? data.questions.length : 0
      if (count < 20) {
        violations.push(`${basename(file)}: ${count}/20 questions (minimum 20 required for launch)`)
      }
    }
    expect(violations, violations.join('\n')).toHaveLength(0)
  })
})
