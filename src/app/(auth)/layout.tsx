/**
 * Auth layout — wraps parent and teacher registration/management pages.
 * Provides consistent nav header and max-width container.
 */
import type { ReactNode } from 'react'
import { color, typography, space } from '@/theme/tokens'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontFamily: typography.fontFamily.base, background: color.background, minHeight: '100vh' }}>
      <header style={{
        background: color.surface,
        borderBottom: `1px solid ${color.border}`,
        padding: `${space[4]} ${space[6]}`,
        display: 'flex',
        alignItems: 'center',
        gap: space[4],
      }}>
        <a href="/" style={{ color: color.primary, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.lg, textDecoration: 'none' }}>
          Australian Maths App
        </a>
      </header>
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: `${space[8]} ${space[6]}` }}>
        {children}
      </main>
    </div>
  )
}
