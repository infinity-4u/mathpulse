/**
 * Content loading + server-side KaTeX rendering.
 * Runs only in Server Components — do not import in Client Components.
 * CONTRACT.md: question content is STATIC JSON — never from the database.
 * Content gate tripwire: only questions with verified:true can be loaded.
 */
import katex from 'katex'
import type { Answer } from './answer'
import type { CommonError } from './repair'

// ─── Type for a pre-rendered question (safe to pass to Client Components) ─────

export interface PreRenderedQuestion {
  id: string
  type: 'multiple_choice' | 'numeric'
  stemHtml: string
  options?: string[]                    // HTML strings for MC options (display only)
  rawOptions?: string[]                 // raw option strings for answer comparison
  answer: Answer
  hintsHtml: [string, string, string]   // all 3 hints pre-rendered
  workedSolutionHtml: string
  common_errors?: (CommonError & { contextualHintHtml: string })[]
  difficulty: number
  substrand_code: string
}

export interface ContentFile {
  code: string
  year: number
  strand: string
  substrand: string
  acara_description: string
  verified: boolean
  schema_version: number
  questions: RawQuestion[]
}

interface RawQuestion {
  id: string
  type: 'multiple_choice' | 'numeric'
  stem: string
  options?: string[]
  answer: Answer
  hints: { default: [string, string, string] }
  worked_solution: string
  common_errors?: CommonError[]
  difficulty?: number
}

// ─── Render LaTeX in a string ─────────────────────────────────────────────────

/**
 * Replace \(...\) inline math with KaTeX-rendered HTML.
 * Block math \[...\] also supported.
 * Remaining text is HTML-escaped so no XSS via content JSON.
 */
export function renderMath(text: string): string {
  // HTML-escape a plain text segment
  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // Match \[...\] (block) or \(...\) (inline)
  const pattern = /\\\[(.+?)\\\]|\\\((.+?)\\\)/gs
  let result = ''
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    // Append text before this match (escaped)
    result += escapeHtml(text.slice(lastIndex, match.index))
    const mathExpr = match[1] ?? match[2]  // block or inline
    const isBlock  = match[1] !== undefined
    try {
      result += katex.renderToString(mathExpr, {
        throwOnError:     false,
        displayMode:      isBlock,
        output:           'html',
      })
    } catch {
      result += escapeHtml(match[0])
    }
    lastIndex = pattern.lastIndex
  }
  result += escapeHtml(text.slice(lastIndex))
  return result
}

// ─── Content registry ─────────────────────────────────────────────────────────
// Add entries here as verified content files are merged.

const CONTENT_LOADERS: Record<string, () => Promise<ContentFile>> = {
  // ── Number ──────────────────────────────────────────────────────────────────
  'AC9M7N01': () => import('../../content/curriculum/year-7/number/AC9M7N01.json').then(m => m.default as unknown as ContentFile),
  'AC9M7N02': () => import('../../content/curriculum/year-7/number/AC9M7N02.json').then(m => m.default as unknown as ContentFile),
  'AC9M7N03': () => import('../../content/curriculum/year-7/number/AC9M7N03.json').then(m => m.default as unknown as ContentFile),
  'AC9M7N04': () => import('../../content/curriculum/year-7/number/AC9M7N04.json').then(m => m.default as unknown as ContentFile),
  'AC9M7N05': () => import('../../content/curriculum/year-7/number/AC9M7N05.json').then(m => m.default as unknown as ContentFile),
  'AC9M7N06': () => import('../../content/curriculum/year-7/number/AC9M7N06.json').then(m => m.default as unknown as ContentFile),
  'AC9M7N07': () => import('../../content/curriculum/year-7/number/AC9M7N07.json').then(m => m.default as unknown as ContentFile),
  'AC9M7N08': () => import('../../content/curriculum/year-7/number/AC9M7N08.json').then(m => m.default as unknown as ContentFile),
  'AC9M7N09': () => import('../../content/curriculum/year-7/number/AC9M7N09.json').then(m => m.default as unknown as ContentFile),
  'AC9M7N10': () => import('../../content/curriculum/year-7/number/AC9M7N10.json').then(m => m.default as unknown as ContentFile),
  // ── Algebra ─────────────────────────────────────────────────────────────────
  'AC9M7A01': () => import('../../content/curriculum/year-7/algebra/AC9M7A01.json').then(m => m.default as unknown as ContentFile),
  'AC9M7A02': () => import('../../content/curriculum/year-7/algebra/AC9M7A02.json').then(m => m.default as unknown as ContentFile),
  'AC9M7A03': () => import('../../content/curriculum/year-7/algebra/AC9M7A03.json').then(m => m.default as unknown as ContentFile),
  'AC9M7A04': () => import('../../content/curriculum/year-7/algebra/AC9M7A04.json').then(m => m.default as unknown as ContentFile),
  'AC9M7A05': () => import('../../content/curriculum/year-7/algebra/AC9M7A05.json').then(m => m.default as unknown as ContentFile),
  'AC9M7A06': () => import('../../content/curriculum/year-7/algebra/AC9M7A06.json').then(m => m.default as unknown as ContentFile),
  // ── Measurement ─────────────────────────────────────────────────────────────
  'AC9M7M01': () => import('../../content/curriculum/year-7/measurement/AC9M7M01.json').then(m => m.default as unknown as ContentFile),
  'AC9M7M02': () => import('../../content/curriculum/year-7/measurement/AC9M7M02.json').then(m => m.default as unknown as ContentFile),
  'AC9M7M03': () => import('../../content/curriculum/year-7/measurement/AC9M7M03.json').then(m => m.default as unknown as ContentFile),
  'AC9M7M04': () => import('../../content/curriculum/year-7/measurement/AC9M7M04.json').then(m => m.default as unknown as ContentFile),
  'AC9M7M05': () => import('../../content/curriculum/year-7/measurement/AC9M7M05.json').then(m => m.default as unknown as ContentFile),
  'AC9M7M06': () => import('../../content/curriculum/year-7/measurement/AC9M7M06.json').then(m => m.default as unknown as ContentFile),
  // ── Space ────────────────────────────────────────────────────────────────────
  'AC9M7SP01': () => import('../../content/curriculum/year-7/space/AC9M7SP01.json').then(m => m.default as unknown as ContentFile),
  'AC9M7SP02': () => import('../../content/curriculum/year-7/space/AC9M7SP02.json').then(m => m.default as unknown as ContentFile),
  'AC9M7SP03': () => import('../../content/curriculum/year-7/space/AC9M7SP03.json').then(m => m.default as unknown as ContentFile),
  'AC9M7SP04': () => import('../../content/curriculum/year-7/space/AC9M7SP04.json').then(m => m.default as unknown as ContentFile),
  // ── Statistics ───────────────────────────────────────────────────────────────
  'AC9M7ST01': () => import('../../content/curriculum/year-7/statistics/AC9M7ST01.json').then(m => m.default as unknown as ContentFile),
  'AC9M7ST02': () => import('../../content/curriculum/year-7/statistics/AC9M7ST02.json').then(m => m.default as unknown as ContentFile),
  'AC9M7ST03': () => import('../../content/curriculum/year-7/statistics/AC9M7ST03.json').then(m => m.default as unknown as ContentFile),
  // ── Probability ──────────────────────────────────────────────────────────────
  'AC9M7P01': () => import('../../content/curriculum/year-7/probability/AC9M7P01.json').then(m => m.default as unknown as ContentFile),
  'AC9M7P02': () => import('../../content/curriculum/year-7/probability/AC9M7P02.json').then(m => m.default as unknown as ContentFile),
}

// No draft content — all Year 7 content is verified (VCAA source, authorised 2026-06-23).
const DRAFT_LOADERS: Record<string, () => Promise<ContentFile>> = {}

export const AVAILABLE_CODES = Object.keys(CONTENT_LOADERS)
export const DRAFT_CODES = Object.keys(DRAFT_LOADERS)

/**
 * Load and pre-render a content file for a given substrand code.
 * Returns null if the code is unknown or content is unverified.
 */
export async function loadContent(code: string): Promise<PreRenderedQuestion[] | null> {
  const loader = CONTENT_LOADERS[code]
  if (!loader) return null

  const file = await loader()
  // Content gate: only verified files reach students (mirrors content-gate tripwire)
  if (!file.verified) return null

  return file.questions.map(q => preRender(q, code))
}

/**
 * Dev/testing variant — bypasses verified gate, includes draft content.
 * Only used in the /test route. Never call from student-facing routes.
 */
export async function loadContentDev(code: string): Promise<PreRenderedQuestion[] | null> {
  const verifiedLoader = CONTENT_LOADERS[code]
  if (verifiedLoader) {
    const file = await verifiedLoader()
    return file.questions.map(q => preRender(q, code))
  }
  const draftLoader = DRAFT_LOADERS[code]
  if (!draftLoader) return null
  const file = await draftLoader()
  return file.questions.map(q => preRender(q, code))
}

function preRender(q: RawQuestion, substrandCode: string): PreRenderedQuestion {
  return {
    id:            q.id,
    type:          q.type,
    stemHtml:      renderMath(q.stem),
    options:       q.options?.map(renderMath),
    rawOptions:    q.options,
    answer:        q.answer,
    hintsHtml:     [
      renderMath(q.hints.default[0]),
      renderMath(q.hints.default[1]),
      renderMath(q.hints.default[2]),
    ],
    workedSolutionHtml: renderMath(q.worked_solution),
    common_errors: q.common_errors?.map(ce => ({
      ...ce,
      contextualHintHtml: renderMath(ce.contextual_hint),
    })),
    difficulty:    q.difficulty ?? 1,
    substrand_code: substrandCode,
  }
}
