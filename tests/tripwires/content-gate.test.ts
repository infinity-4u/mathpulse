/**
 * TRIPWIRE: content-gate
 * Updated per SPEC2 ratification: checks new answer-object schema.
 *
 * Fails if any question JSON:
 *   - lacks required top-level fields (code, year, strand, substrand, verified, questions)
 *   - has verified: false or missing verified flag (file-level)
 *   - has filename that doesn't match its "code" field
 *   - has a question missing required fields (id, type, stem, answer, difficulty, hints, worked_solution)
 *   - has an answer object with an unrecognised type
 *   - has answer.type in Phase-3-only types with verified: true (no V1 checker)
 *   - has ai-draft provenance with verified: true but no verified_by (would bypass mathematician gate)
 *   - has fewer than 20 questions per substrand (enforced when ENFORCE_MIN_QUESTIONS=true)
 *
 * Enforces CONTRACT.md §4 and §5.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, join, basename, extname } from 'path'

const CURRICULUM_DIR = resolve(__dirname, '../../content/curriculum')

// All answer types defined in SPEC2
const VALID_ANSWER_TYPES = [
  'numeric', 'fraction', 'multiple_choice', 'multi_select',
  'ordering', 'matching', 'expression', 'diagram',
]

// Phase 3 types that have no V1 checker — must not appear in verified content
const PHASE3_ANSWER_TYPES = ['ordering', 'matching', 'expression', 'diagram']

interface QuestionFile {
  code: string
  year: number
  strand: string
  substrand: string
  verified: boolean
  schema_version?: number
  questions: Question[]
}

interface Answer {
  type: string
  correct?: string
  value?: number
  tolerance?: number
  numerator?: number
  denominator?: number
  [key: string]: unknown
}

interface Question {
  id: string
  type: string
  stem: string
  answer: Answer
  difficulty: 1 | 2 | 3
  hints: { default: [string, string, string] }
  worked_solution: string
  options?: string[]
  common_errors?: object[]
  verified?: boolean
  provenance?: {
    authored_by: string
    verified_by: string | null
    [key: string]: unknown
  }
}

const REQUIRED_FILE_FIELDS: (keyof QuestionFile)[] = [
  'code', 'year', 'strand', 'substrand', 'verified', 'questions',
]

const REQUIRED_QUESTION_FIELDS: (keyof Question)[] = [
  'id', 'type', 'stem', 'answer', 'difficulty', 'hints', 'worked_solution',
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
    // dir may not exist yet
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
      `Unverified content found (CONTRACT.md §5 — human mathematician must verify before shipping):\n${violations.join('\n')}`,
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

  it('every question in every file has required fields and valid SPEC2 answer schema', () => {
    const violations: string[] = []
    for (const file of files) {
      const data = JSON.parse(readFileSync(file, 'utf-8')) as QuestionFile
      if (!Array.isArray(data.questions)) continue

      data.questions.forEach((q, i) => {
        const label = `${basename(file)} question[${i}] (${q.id ?? 'no-id'})`

        // Required fields (SPEC2: answer object replaces bare "correct")
        const missing = REQUIRED_QUESTION_FIELDS.filter(f => !(f in q))
        if (missing.length) {
          violations.push(`${label}: missing fields [${missing.join(', ')}]`)
        }

        // answer must be an object with a valid type
        if (q.answer) {
          if (typeof q.answer !== 'object' || Array.isArray(q.answer)) {
            violations.push(`${label}: answer must be an object, not a bare string`)
          } else if (!VALID_ANSWER_TYPES.includes(q.answer.type)) {
            violations.push(`${label}: answer.type "${q.answer.type}" is not one of the 8 SPEC2 types`)
          }
        }

        // Difficulty must be 1, 2, or 3
        if (![1, 2, 3].includes(q.difficulty as number)) {
          violations.push(`${label}: difficulty must be 1, 2, or 3`)
        }

        // hints must be { default: [string, string, string] }
        const defaultHints = (q.hints as any)?.default
        if (!Array.isArray(defaultHints) || defaultHints.length !== 3) {
          violations.push(`${label}: hints.default must be an array of exactly 3 strings`)
        }

        // multiple_choice must have options
        if (q.type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
          violations.push(`${label}: type=multiple_choice but options missing or < 2`)
        }

        // multiple_choice answer.correct must match one of options
        if (
          q.type === 'multiple_choice' &&
          q.answer?.type === 'multiple_choice' &&
          q.answer?.correct !== undefined &&
          q.options
        ) {
          if (!q.options.includes(q.answer.correct as string)) {
            violations.push(`${label}: answer.correct "${q.answer.correct}" is not in options[]`)
          }
        }
      })
    }
    expect(violations, violations.join('\n')).toHaveLength(0)
  })

  it('no verified question uses a Phase-3-only answer type (no V1 checker exists)', () => {
    const violations: string[] = []
    for (const file of files) {
      const data = JSON.parse(readFileSync(file, 'utf-8')) as QuestionFile
      if (!Array.isArray(data.questions)) continue
      for (const q of data.questions) {
        const qVerified = q.verified !== undefined ? q.verified : data.verified
        if (qVerified === true && q.answer && PHASE3_ANSWER_TYPES.includes(q.answer.type)) {
          violations.push(
            `${basename(file)} ${q.id}: answer.type "${q.answer.type}" has no V1 checker — remove verified:true until Phase 3`,
          )
        }
      }
    }
    expect(violations, violations.join('\n')).toHaveLength(0)
  })

  it('ai-drafted questions with verified: true must have provenance.verified_by set', () => {
    const violations: string[] = []
    for (const file of files) {
      const data = JSON.parse(readFileSync(file, 'utf-8')) as QuestionFile
      if (!Array.isArray(data.questions)) continue
      for (const q of data.questions) {
        const qVerified = q.verified !== undefined ? q.verified : data.verified
        if (
          qVerified === true &&
          q.provenance?.authored_by === 'ai-draft' &&
          !q.provenance?.verified_by
        ) {
          violations.push(
            `${basename(file)} ${q.id}: AI-drafted question has verified:true but provenance.verified_by is null — mathematician must sign off`,
          )
        }
      }
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
