'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { YEAR_7 } from '@/lib/curriculum'
import { color, typography, space } from '@/theme/tokens'

export function NavBar() {
  const pathname = usePathname()

  const isPractice = pathname?.startsWith('/practice') || pathname?.startsWith('/year')

  return (
    <header style={{
      background: '#fff',
      borderBottom: `1px solid ${color.border}`,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <nav style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: `0 ${space[6]}`,
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space[4],
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: space[2] }}>
          <span style={{
            fontWeight: typography.fontWeight.bold,
            fontSize: typography.fontSize.lg,
            color: color.primary,
            letterSpacing: '-0.02em',
          }}>
            AusMaths
          </span>
          <span style={{
            fontSize: typography.fontSize.sm,
            color: color.textMuted,
            fontWeight: typography.fontWeight.medium,
            background: '#F3F4F6',
            borderRadius: '4px',
            padding: '2px 6px',
          }}>Year 7</span>
        </Link>

        {/* Centre links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: space[1] }}>
          <NavLink href="/year/7" active={pathname?.startsWith('/year/7') ?? false}>
            Topics
          </NavLink>
          {YEAR_7.strands.map(strand => (
            <NavLink
              key={strand.slug}
              href={`/year/7/${strand.slug}`}
              active={pathname === `/year/7/${strand.slug}`}
              colour={strand.colour}
            >
              {strand.label}
            </NavLink>
          ))}
        </div>

        {/* Right links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: space[3] }}>
          <Link href="/teacher/dashboard" style={linkStyle}>Teachers</Link>
          <Link href="/parent/dashboard" style={linkStyle}>Parents</Link>
        </div>
      </nav>
    </header>
  )
}

function NavLink({ href, active, colour, children }: {
  href: string
  active: boolean
  colour?: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} style={{
      textDecoration: 'none',
      fontSize: typography.fontSize.sm,
      fontWeight: active ? typography.fontWeight.bold : typography.fontWeight.medium,
      color: active ? (colour ?? color.primary) : color.textMuted,
      padding: `${space[2]} ${space[3]}`,
      borderRadius: '6px',
      background: active ? `${colour ?? color.primary}15` : 'transparent',
      transition: 'background 0.15s',
      borderBottom: active ? `2px solid ${colour ?? color.primary}` : '2px solid transparent',
    }}>
      {children}
    </Link>
  )
}

const linkStyle: React.CSSProperties = {
  textDecoration: 'none',
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  color: color.textMuted,
}
