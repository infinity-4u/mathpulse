/**
 * TRIPWIRE: no-runtime-ai
 * Fails if any LLM/AI inference client is imported in the student-facing path.
 * Enforces CONTRACT.md §4: no LLM calls during a student session in V1.
 * Repair logic is deterministic rules over the static bank (see src/lib/repair.ts).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, join } from 'path'

const SRC_DIR = resolve(__dirname, '../../src')

// AI/LLM packages that must not appear in src/
const BANNED_AI_IMPORTS = [
  'openai',
  '@anthropic-ai/sdk',
  'anthropic',
  '@google-ai/generativelanguage',
  '@google/generative-ai',
  'cohere-ai',
  '@cohere-ai/cohere-ts',
  'ai',                   // Vercel AI SDK
  '@vercel/ai',
  'langchain',
  '@langchain',
  'llamaindex',
  'transformers',         // HuggingFace transformers
  '@huggingface/inference',
  'replicate',
]

function getAllSourceFiles(dir: string): string[] {
  const results: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        results.push(...getAllSourceFiles(full))
      } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) {
        results.push(full)
      }
    }
  } catch {
    // dir may not exist yet
  }
  return results
}

describe('no-runtime-ai tripwire', () => {
  it('no LLM/AI client imports in src/', () => {
    const files = getAllSourceFiles(SRC_DIR)
    const violations: string[] = []

    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      for (const banned of BANNED_AI_IMPORTS) {
        // Match import/require statements
        const importPattern = new RegExp(
          `(import\\s+.*from\\s+['"]${banned}|require\\s*\\(\\s*['"]${banned})`,
          'i'
        )
        if (importPattern.test(content)) {
          violations.push(`${file.replace(SRC_DIR, 'src')}: imports "${banned}"`)
        }
      }
    }

    expect(
      violations,
      `AI/LLM client imports found in student path:\n${violations.join('\n')}\n\n` +
      'V1 uses deterministic repair rules over the static question bank. See CONTRACT.md §4.'
    ).toHaveLength(0)
  })

  it('package.json does not list AI inference packages as dependencies', () => {
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')
    )
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }

    const found = BANNED_AI_IMPORTS.filter(banned =>
      Object.keys(allDeps).some(dep => dep === banned || dep.startsWith(banned + '/'))
    )

    expect(
      found,
      `AI packages in package.json dependencies: ${found.join(', ')}`
    ).toHaveLength(0)
  })
})
