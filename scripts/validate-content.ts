#!/usr/bin/env node
/**
 * Content validation script — pre-commit local use.
 *
 * Checks all the rules from tests/tripwires/content-gate.test.ts EXCEPT
 * the file-level verified:true check (that stays in CI only).
 *
 * Usage:
 *   npx tsx scripts/validate-content.ts
 *   npx tsx scripts/validate-content.ts content/curriculum/year-7/number/AC9M7N01.json
 *   npx tsx scripts/validate-content.ts content/curriculum/year-7/number/AC9M7N01.json content/curriculum/year-7/number/AC9M7N02.json
 *
 * Exit codes:  0 = all files pass    1 = one or more files fail
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { resolve, join, basename, extname } from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  difficulty: number
  hints: { default: unknown[] }
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

interface QuestionFile {
  code: string
  year: number
  strand: string
  substrand: string
  verified: boolean
  schema_version?: number
  questions: Question[]
  [key: string]: unknown
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_ANSWER_TYPES = [
  'numeric', 'fraction', 'multiple_choice', 'multi_select',
  'ordering', 'matching', 'expression', 'diagram',
]

const PHASE3_ANSWER_TYPES = ['ordering', 'matching', 'expression', 'diagram']

const REQUIRED_FILE_FIELDS = ['code', 'year', 'strand', 'substrand', 'verified', 'questions']

const REQUIRED_QUESTION_FIELDS = ['id', 'type', 'stem', 'answer', 'difficulty', 'hints', 'worked_solution']

// ─── File discovery ───────────────────────────────────────────────────────────

function getAllQuestionFiles(dir: string): string[] {
  const results: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        results.push(...getAllQuestionFiles(full))
      } else if (entry.endsWith('.json') && entry.startsWith('AC9M')) {
        results.push(full)
      }
    }
  } catch {
    // directory may not exist yet
  }
  return results
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateFile(filePath: string): string[] {
  const errors: string[] = []
  const name = basename(filePath)

  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (err) {
    return [`${name}: JSON parse error — ${(err as Error).message}`]
  }

  const data = raw as Partial<QuestionFile>

  // Required top-level fields
  const missingFileFields = REQUIRED_FILE_FIELDS.filter(f => !(f in data))
  if (missingFileFields.length) {
    errors.push(`${name}: missing top-level fields [${missingFileFields.join(', ')}]`)
  }

  // NOTE: verified:true at file level is NOT checked here (CI only).

  // Filename must match code field
  const fileCode = basename(filePath, extname(filePath))
  if (data.code !== undefined && data.code !== fileCode) {
    errors.push(`${name}: filename is "${fileCode}" but code field is "${data.code}"`)
  }

  // Question-level checks
  if (!Array.isArray(data.questions)) return errors

  data.questions.forEach((q, i) => {
    const label = `${name} question[${i}] (${q.id ?? 'no-id'})`

    // Required question fields
    const missingQ = REQUIRED_QUESTION_FIELDS.filter(f => !(f in q))
    if (missingQ.length) {
      errors.push(`${label}: missing fields [${missingQ.join(', ')}]`)
    }

    // answer must be an object with a valid type
    if (q.answer !== undefined) {
      if (typeof q.answer !== 'object' || Array.isArray(q.answer)) {
        errors.push(`${label}: answer must be an object, not a bare value`)
      } else if (q.answer && !VALID_ANSWER_TYPES.includes(q.answer.type)) {
        errors.push(`${label}: answer.type "${q.answer.type}" is not one of the 8 SPEC2 types`)
      }
    }

    // Difficulty must be 1, 2, or 3
    if (![1, 2, 3].includes(q.difficulty)) {
      errors.push(`${label}: difficulty must be 1, 2, or 3 (got ${q.difficulty})`)
    }

    // hints.default must be array of exactly 3 strings
    const defaultHints = q.hints?.default
    if (!Array.isArray(defaultHints) || defaultHints.length !== 3) {
      errors.push(`${label}: hints.default must be an array of exactly 3 strings`)
    } else if (!defaultHints.every(h => typeof h === 'string')) {
      errors.push(`${label}: hints.default entries must all be strings`)
    }

    // worked_solution must be a non-empty string
    if (q.worked_solution !== undefined && typeof q.worked_solution !== 'string') {
      errors.push(`${label}: worked_solution must be a string`)
    }

    // multiple_choice must have options
    if (q.type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
      errors.push(`${label}: type=multiple_choice but options missing or has fewer than 2 entries`)
    }

    // multiple_choice answer.correct must match one of options
    if (
      q.type === 'multiple_choice' &&
      q.answer?.type === 'multiple_choice' &&
      q.answer?.correct !== undefined &&
      q.options
    ) {
      if (!q.options.includes(q.answer.correct as string)) {
        errors.push(`${label}: answer.correct "${q.answer.correct}" is not listed in options[]`)
      }
    }

    // No Phase-3 answer types on verified questions
    const qVerified = q.verified !== undefined ? q.verified : data.verified
    if (qVerified === true && q.answer && PHASE3_ANSWER_TYPES.includes(q.answer.type)) {
      errors.push(
        `${label}: answer.type "${q.answer.type}" has no V1 checker — remove verified:true until Phase 3`,
      )
    }

    // AI-drafted + verified:true + no verified_by
    if (
      qVerified === true &&
      q.provenance?.authored_by === 'ai-draft' &&
      !q.provenance?.verified_by
    ) {
      errors.push(
        `${label}: AI-drafted question has verified:true but provenance.verified_by is null — mathematician must sign off`,
      )
    }
  })

  return errors
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2)

  let files: string[]
  if (args.length > 0) {
    files = args.map(a => resolve(process.cwd(), a))
    const missing = files.filter(f => !existsSync(f))
    if (missing.length) {
      for (const f of missing) console.error(`ERROR: file not found — ${f}`)
      process.exit(1)
    }
  } else {
    const curriculumDir = resolve(process.cwd(), 'content/curriculum')
    files = getAllQuestionFiles(curriculumDir)
    if (files.length === 0) {
      console.log('No question files found in content/curriculum/ — nothing to validate.')
      process.exit(0)
    }
  }

  let allPass = true

  for (const filePath of files) {
    const errors = validateFile(filePath)
    const name = basename(filePath)
    if (errors.length === 0) {
      console.log(`PASS  ${name}`)
    } else {
      allPass = false
      console.log(`FAIL  ${name}`)
      for (const err of errors) {
        console.log(`      ${err}`)
      }
    }
  }

  if (!allPass) {
    console.log('\nOne or more files failed validation.')
    process.exit(1)
  } else {
    console.log(`\nAll ${files.length} file(s) passed validation.`)
    process.exit(0)
  }
}

main()
