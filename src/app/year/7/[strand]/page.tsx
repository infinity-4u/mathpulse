import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getStrand, YEAR_7 } from '@/lib/curriculum'
import { color, space, typography } from '@/theme/tokens'

interface Props {
  params: { strand: string }
}

export function generateStaticParams() {
  return YEAR_7.strands.map(s => ({ strand: s.slug }))
}

export function generateMetadata({ params }: Props) {
  const strand = getStrand(params.strand)
  if (!strand) return {}
  return {
    title: `Year 7 ${strand.label} — AusMaths`,
    description: `Practise Year 7 ${strand.label} topics: ${strand.substrands.map(s => s.label).join(', ')}.`,
  }
}

const DIFFICULTY_LABELS = ['', 'Foundation', 'Core', 'Extension']

export default function StrandPage({ params }: Props) {
  const strand = getStrand(params.strand)
  if (!strand) notFound()

  return (
    <main style={{ background: color.background, minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{
        background: strand.colour,
        color: '#fff',
        padding: `${space[12]} ${space[6]} ${space[10]}`,
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <Link href="/year/7" style={{
            textDecoration: 'none',
            fontSize: typography.fontSize.sm,
            color: 'rgba(255,255,255,0.8)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: space[2],
            marginBottom: space[4],
          }}>
            ← Year 7 Topics
          </Link>
          <h1 style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, margin: `0 0 ${space[2]}` }}>
            {strand.label}
          </h1>
          <p style={{ fontSize: typography.fontSize.base, opacity: 0.9, margin: 0 }}>
            {strand.substrands.length} topics · Year 7 Victorian Curriculum
          </p>
        </div>
      </section>

      {/* Topic cards */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: `${space[10]} ${space[6]}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
          {strand.substrands.map((sub, idx) => (
            <article key={sub.code} style={{
              background: '#fff',
              border: `1px solid ${color.border}`,
              borderRadius: '10px',
              padding: `${space[5]} ${space[6]}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: space[4],
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: space[4] }}>
                {/* Topic number badge */}
                <span style={{
                  minWidth: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `${strand.colour}20`,
                  color: strand.colour,
                  fontWeight: typography.fontWeight.bold,
                  fontSize: typography.fontSize.sm,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}>
                  {idx + 1}
                </span>

                <div>
                  <h2 style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.bold,
                    color: color.text,
                    margin: `0 0 ${space[1]}`,
                  }}>
                    {sub.label}
                  </h2>
                  <p style={{ fontSize: typography.fontSize.sm, color: color.textMuted, margin: 0 }}>
                    {sub.description}
                  </p>
                  <code style={{
                    fontSize: '11px',
                    color: color.textMuted,
                    opacity: 0.6,
                    fontFamily: 'monospace',
                  }}>
                    {sub.vcCode}
                  </code>
                </div>
              </div>

              <Link
                href={`/practice/session/${sub.code}`}
                style={{
                  textDecoration: 'none',
                  background: strand.colour,
                  color: '#fff',
                  fontWeight: typography.fontWeight.medium,
                  fontSize: typography.fontSize.sm,
                  padding: `${space[2]} ${space[5]}`,
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Practise
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
