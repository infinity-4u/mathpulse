import Link from 'next/link'
import { YEAR_7 } from '@/lib/curriculum'
import { color, space, typography } from '@/theme/tokens'

export const metadata = {
  title: 'AusMaths — Curriculum-aligned maths for Years 7–10',
  description: 'Free, curriculum-aligned maths practice for Australian students Years 7–10. No ads. No tracking.',
}

const STRAND_ICONS: Record<string, string> = {
  number:      '🔢',
  algebra:     '𝑥',
  measurement: '📐',
  space:       '🔷',
  statistics:  '📊',
  probability: '🎲',
}

export default function HomePage() {
  const totalTopics = YEAR_7.strands.reduce((n, s) => n + s.substrands.length, 0)

  return (
    <main style={{ background: color.background, minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{
        background: `linear-gradient(135deg, ${color.primary} 0%, ${color.primaryDark} 100%)`,
        color: '#fff',
        padding: `${space[16]} ${space[6]}`,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <p style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            opacity: 0.8,
            marginBottom: space[3],
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Victorian Curriculum v2.0 · ACARA Aligned
          </p>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: typography.fontWeight.bold,
            lineHeight: '1.2',
            margin: `0 0 ${space[4]}`,
          }}>
            Maths practice<br/>built for Australian students
          </h1>
          <p style={{ fontSize: typography.fontSize.lg, opacity: 0.9, margin: `0 0 ${space[8]}`, lineHeight: '1.6' }}>
            {totalTopics} curriculum-aligned topics for Year 7. No ads, no tracking, no AI guessing — just
            verified questions written by qualified educators.
          </p>
          <div style={{ display: 'flex', gap: space[3], justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/year/7" style={{
              textDecoration: 'none',
              background: '#fff',
              color: color.primary,
              fontWeight: typography.fontWeight.bold,
              fontSize: typography.fontSize.base,
              padding: `${space[3]} ${space[8]}`,
              borderRadius: '8px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
            }}>
              Start Year 7 →
            </Link>
            <Link href="/teacher/dashboard" style={{
              textDecoration: 'none',
              background: 'transparent',
              color: '#fff',
              fontWeight: typography.fontWeight.medium,
              fontSize: typography.fontSize.base,
              padding: `${space[3]} ${space[6]}`,
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.4)',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
            }}>
              I&#39;m a teacher
            </Link>
          </div>
        </div>
      </section>

      {/* Year 7 strand overview */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: `${space[12]} ${space[6]}` }}>
        <h2 style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: color.text,
          marginBottom: space[2],
        }}>Year 7 Mathematics</h2>
        <p style={{ color: color.textMuted, fontSize: typography.fontSize.base, marginBottom: space[8] }}>
          All {totalTopics} topics across {YEAR_7.strands.length} strands — click any strand to start practising.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: space[4],
        }}>
          {YEAR_7.strands.map(strand => (
            <Link
              key={strand.slug}
              href={`/year/7/${strand.slug}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: '#fff',
                borderRadius: '10px',
                border: `1px solid ${color.border}`,
                borderLeft: `4px solid ${strand.colour}`,
                padding: `${space[5]} ${space[5]}`,
                display: 'flex',
                alignItems: 'center',
                gap: space[4],
              }}>
                <span style={{ fontSize: '24px' }}>{STRAND_ICONS[strand.slug] ?? '📚'}</span>
                <div>
                  <div style={{ fontWeight: typography.fontWeight.bold, color: strand.colour }}>
                    {strand.label}
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: color.textMuted }}>
                    {strand.substrands.length} topics
                  </div>
                </div>
                <span style={{ marginLeft: 'auto', color: strand.colour, fontSize: typography.fontSize.lg }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust signals */}
      <section style={{
        background: '#fff',
        borderTop: `1px solid ${color.border}`,
        padding: `${space[10]} ${space[6]}`,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: color.text, marginBottom: space[8] }}>
            Built on principles, not platforms
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: space[6] }}>
            {[
              { icon: '🔒', title: 'Privacy first', body: 'We collect only what\'s needed. No DOB, no address, no government IDs.' },
              { icon: '🇦🇺', title: 'Data stays in Australia', body: 'Hosted in Sydney (ap-southeast-2). Your data never leaves Australian servers.' },
              { icon: '✅', title: 'Verified content', body: 'Every question reviewed by qualified educators before publication.' },
              { icon: '🚫', title: 'No AI guessing', body: 'Repair logic is deterministic rules, not a language model.' },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '28px', marginBottom: space[2] }}>{icon}</div>
                <div style={{ fontWeight: typography.fontWeight.bold, color: color.text, marginBottom: space[1] }}>{title}</div>
                <div style={{ fontSize: typography.fontSize.sm, color: color.textMuted, lineHeight: '1.5' }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role paths */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: `${space[10]} ${space[6]}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: space[5] }}>
          <RolePath
            href="/teacher/dashboard"
            label="For teachers"
            description="Create classes, assign topics, and review student progress across all Year 7 strands."
            colour={color.primary}
          />
          <RolePath
            href="/parent/dashboard"
            label="For parents"
            description="Add your child, choose their year level, and track their curriculum progress."
            colour={color.success}
          />
          <RolePath
            href="/year/7"
            label="For students"
            description="Jump straight in — pick a topic and start practising with immediate feedback."
            colour="#7C3AED"
          />
        </div>
      </section>
    </main>
  )
}

function RolePath({ href, label, description, colour }: {
  href: string
  label: string
  description: string
  colour: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff',
        border: `1px solid ${color.border}`,
        borderRadius: '10px',
        padding: space[6],
      }}>
        <div style={{ fontWeight: typography.fontWeight.bold, color, marginBottom: space[2] }}>{label}</div>
        <p style={{ fontSize: typography.fontSize.sm, color: color.textMuted, margin: `0 0 ${space[4]}`, lineHeight: '1.5' }}>
          {description}
        </p>
        <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color }}>
          Get started →
        </span>
      </div>
    </Link>
  )
}
