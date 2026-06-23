/**
 * Teacher testing page — Year 7 substrand picker.
 * No auth, no Supabase required. Draft content is clearly flagged.
 * For evaluation by teachers before Supabase is provisioned.
 */
import { color, typography, space } from '@/theme/tokens'

const YEAR7_TOPICS = [
  {
    code: 'AC9M7N01',
    title: 'Square Numbers & Square Roots',
    strand: 'Number',
    description: 'Squares, square roots and perfect square numbers.',
    isDraft: false,
  },
  {
    code: 'AC9M7N02',
    title: 'Working with Integers',
    strand: 'Number',
    description: 'Positive and negative integers, number line, ordering and operations.',
    isDraft: true,
  },
  {
    code: 'AC9M7N03',
    title: 'Fractions & Decimals',
    strand: 'Number',
    description: 'Equivalent fractions, comparing, converting fractions to decimals.',
    isDraft: true,
  },
  {
    code: 'AC9M7A01',
    title: 'Algebraic Expressions',
    strand: 'Algebra',
    description: 'Variables, substitution and writing expressions from word problems.',
    isDraft: true,
  },
  {
    code: 'AC9M7M01',
    title: 'Perimeter & Area',
    strand: 'Measurement',
    description: 'Perimeter and area of rectangles, squares and triangles.',
    isDraft: true,
  },
]

const STRAND_COLORS: Record<string, string> = {
  Number:      '#2563EB',
  Algebra:     '#7C3AED',
  Measurement: '#0891B2',
  Statistics:  '#059669',
}

export default function TestPage() {
  return (
    <div style={{ fontFamily: typography.fontFamily.base, background: color.background, minHeight: '100vh' }}>
      {/* Dev banner */}
      <div style={{
        background: '#FEF3C7',
        borderBottom: '2px solid #F59E0B',
        padding: `${space[3]} ${space[6]}`,
        display: 'flex',
        alignItems: 'center',
        gap: space[2],
      }}>
        <span style={{ fontSize: typography.fontSize.lg }}>⚠</span>
        <div>
          <strong style={{ color: '#92400E', fontSize: typography.fontSize.sm }}>
            Teacher Testing Mode
          </strong>
          <span style={{ color: '#92400E', fontSize: typography.fontSize.sm, marginLeft: space[2] }}>
            — This page is for functional evaluation only. Draft content (marked below) has not been verified by a mathematician and must not be shown to students.
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: `${space[10]} ${space[6]}` }}>
        <div style={{ marginBottom: space[2] }}>
          <span style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: '#2563EB',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '20px',
            padding: `${space[1]} ${space[3]}`,
          }}>
            Year 7 · ACARA
          </span>
        </div>

        <h1 style={{
          fontSize: typography.fontSize['3xl'],
          fontWeight: typography.fontWeight.bold,
          color: color.text,
          marginBottom: space[2],
          marginTop: space[3],
        }}>
          Year 7 Practice Topics
        </h1>
        <p style={{ color: color.textMuted, fontSize: typography.fontSize.base, marginBottom: space[8] }}>
          Select a topic to practise. Answer questions, get hints and see worked solutions.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
          {YEAR7_TOPICS.map(topic => (
            <a
              key={topic.code}
              href={`/test/session/${topic.code}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: color.surface,
                border: `1px solid ${color.border}`,
                borderRadius: '12px',
                padding: `${space[5]} ${space[6]}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: space[4],
                transition: 'border-color 0.15s',
                cursor: 'pointer',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: space[2], marginBottom: space[1] }}>
                    <span style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: STRAND_COLORS[topic.strand] ?? color.primary,
                      background: `${STRAND_COLORS[topic.strand] ?? color.primary}18`,
                      borderRadius: '4px',
                      padding: `1px ${space[2]}`,
                    }}>
                      {topic.strand}
                    </span>
                    <span style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: typography.fontSize.sm,
                      color: color.textMuted,
                    }}>
                      {topic.code}
                    </span>
                    {topic.isDraft ? (
                      <span style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                        color: '#92400E',
                        background: '#FEF3C7',
                        border: '1px solid #F59E0B',
                        borderRadius: '4px',
                        padding: `1px ${space[2]}`,
                      }}>
                        Draft
                      </span>
                    ) : (
                      <span style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                        color: '#065F46',
                        background: '#D1FAE5',
                        border: '1px solid #6EE7B7',
                        borderRadius: '4px',
                        padding: `1px ${space[2]}`,
                      }}>
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <h2 style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    color: color.text,
                    margin: 0,
                    marginBottom: space[1],
                  }}>
                    {topic.title}
                  </h2>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    color: color.textMuted,
                    margin: 0,
                  }}>
                    {topic.description}
                  </p>
                </div>
                <div style={{
                  color: color.textMuted,
                  fontSize: typography.fontSize.xl,
                  flexShrink: 0,
                }}>
                  →
                </div>
              </div>
            </a>
          ))}
        </div>

        <div style={{
          marginTop: space[10],
          padding: `${space[4]} ${space[5]}`,
          background: color.surface,
          border: `1px solid ${color.border}`,
          borderRadius: '8px',
          fontSize: typography.fontSize.sm,
          color: color.textMuted,
        }}>
          <strong style={{ color: color.text }}>What to test:</strong>
          {' '}Select a topic → read the question → pick or type an answer → submit.
          {' '}Try a wrong answer to see the amber repair band, then request hints and the worked solution.
          {' '}This is the complete student loop minus login.
        </div>
      </div>
    </div>
  )
}
