import Link from 'next/link'
import { YEAR_7 } from '@/lib/curriculum'
import { color, space, typography } from '@/theme/tokens'

export const metadata = {
  title: 'Year 7 Maths — AusMaths',
  description: 'Practise all Year 7 Victorian Curriculum mathematics topics: Number, Algebra, Measurement, Space, Statistics and Probability.',
}

const STRAND_ICONS: Record<string, string> = {
  number:      '🔢',
  algebra:     '𝑥',
  measurement: '📐',
  space:       '🔷',
  statistics:  '📊',
  probability: '🎲',
}

export default function Year7HubPage() {
  return (
    <main style={{ background: color.background, minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{
        background: color.primary,
        color: '#fff',
        padding: `${space[16]} ${space[6]} ${space[12]}`,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, opacity: 0.75, marginBottom: space[2] }}>
          Victorian Curriculum v2.0 · 31 topics
        </p>
        <h1 style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, margin: `0 0 ${space[3]}` }}>
          Year 7 Mathematics
        </h1>
        <p style={{ fontSize: typography.fontSize.lg, opacity: 0.9, maxWidth: '520px', margin: '0 auto' }}>
          Choose a strand to explore topics and start practising.
        </p>
      </section>

      {/* Strand grid */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: `${space[10]} ${space[6]}` }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: space[5],
        }}>
          {YEAR_7.strands.map(strand => (
            <Link
              key={strand.slug}
              href={`/year/7/${strand.slug}`}
              style={{ textDecoration: 'none' }}
            >
              <article style={{
                background: '#fff',
                border: `1px solid ${color.border}`,
                borderRadius: '12px',
                padding: space[6],
                display: 'flex',
                flexDirection: 'column',
                gap: space[3],
                transition: 'box-shadow 0.15s, transform 0.15s',
                cursor: 'pointer',
                borderLeft: `4px solid ${strand.colour}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: space[3] }}>
                  <span style={{ fontSize: '28px', lineHeight: 1 }}>{STRAND_ICONS[strand.slug] ?? '📚'}</span>
                  <div>
                    <h2 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      color: strand.colour,
                      margin: 0,
                    }}>{strand.label}</h2>
                    <span style={{ fontSize: typography.fontSize.sm, color: color.textMuted }}>
                      {strand.substrands.length} topic{strand.substrands.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <ul style={{ margin: 0, padding: `0 0 0 ${space[4]}`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {strand.substrands.slice(0, 4).map(sub => (
                    <li key={sub.code} style={{ fontSize: typography.fontSize.sm, color: color.textMuted }}>
                      {sub.label}
                    </li>
                  ))}
                  {strand.substrands.length > 4 && (
                    <li style={{ fontSize: typography.fontSize.sm, color: strand.colour, fontWeight: typography.fontWeight.medium }}>
                      +{strand.substrands.length - 4} more…
                    </li>
                  )}
                </ul>

                <div style={{
                  marginTop: 'auto',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: strand.colour,
                }}>
                  Start practising →
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
