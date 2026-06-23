/**
 * Dev session page — fully interactive practice loop without auth.
 * Uses loadContentDev() which serves both verified + draft content.
 * Never linked from student-facing routes.
 */
import { notFound } from 'next/navigation'
import { loadContentDev, AVAILABLE_CODES, DRAFT_CODES } from '@/lib/content'
import { DevPracticeSession } from '@/components/practice/DevPracticeSession'
import { color, typography, space } from '@/theme/tokens'

const TOPIC_NAMES: Record<string, string> = {
  AC9M7N01: 'Square Numbers & Square Roots',
  AC9M7N02: 'Working with Integers',
  AC9M7N03: 'Fractions & Decimals',
  AC9M7A01: 'Algebraic Expressions',
  AC9M7M01: 'Perimeter & Area',
}

export default async function DevSessionPage({
  params,
}: {
  params: { substrand: string }
}) {
  const { substrand } = params
  const questions = await loadContentDev(substrand)

  if (!questions) notFound()

  const isDraft = DRAFT_CODES.includes(substrand) && !AVAILABLE_CODES.includes(substrand)
  const topicName = TOPIC_NAMES[substrand] ?? substrand

  return (
    <div style={{ fontFamily: typography.fontFamily.base, background: color.background, minHeight: '100vh' }}>
      {/* Dev banner */}
      <div style={{
        background: isDraft ? '#FEF3C7' : '#D1FAE5',
        borderBottom: `2px solid ${isDraft ? '#F59E0B' : '#6EE7B7'}`,
        padding: `${space[2]} ${space[6]}`,
        display: 'flex',
        alignItems: 'center',
        gap: space[2],
      }}>
        <span style={{ fontSize: typography.fontSize.sm }}>
          {isDraft ? '⚠' : '✓'}
        </span>
        <span style={{
          fontSize: typography.fontSize.sm,
          color: isDraft ? '#92400E' : '#065F46',
          fontWeight: typography.fontWeight.medium,
        }}>
          {isDraft
            ? 'Draft content — not yet verified by a mathematician. Teacher testing only.'
            : 'Verified content — ready for students.'}
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: 'ui-monospace, monospace', fontSize: typography.fontSize.sm, color: isDraft ? '#92400E' : '#065F46' }}>
          {substrand} · {topicName}
        </span>
      </div>

      <DevPracticeSession
        questions={questions}
        substrandCode={substrand}
      />
    </div>
  )
}
