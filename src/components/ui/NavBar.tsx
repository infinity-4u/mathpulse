'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { YEAR_7 } from '@/lib/curriculum'
import { CalmToggle } from '@/components/ui/CalmToggle'

export function NavBar() {
  const pathname = usePathname()

  return (
    <header className="bg-surface border-b border-edge sticky top-0 z-50">
      <nav className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="no-underline flex items-center gap-2">
          <span className="font-bold text-lg text-primary tracking-tight">AusMaths</span>
          <span className="text-xs text-ink-muted font-medium bg-canvas rounded px-1.5 py-0.5">Year 7</span>
        </Link>

        {/* Centre links */}
        <div className="flex items-center gap-0.5">
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

        {/* Right — links + calm toggle */}
        <div className="flex items-center gap-4">
          <Link href="/teacher/dashboard" className="text-sm font-medium text-ink-muted no-underline hover:text-ink transition-colors">
            Teachers
          </Link>
          <Link href="/parent/dashboard" className="text-sm font-medium text-ink-muted no-underline hover:text-ink transition-colors">
            Parents
          </Link>
          <CalmToggle />
        </div>

      </nav>
    </header>
  )
}

function NavLink({ href, active, colour, children }: {
  href:     string
  active:   boolean
  colour?:  string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="no-underline text-sm font-medium px-3 py-2 rounded-md transition-all duration-150"
      style={{
        color:        active ? (colour ?? '#1B5E9B') : '#4B5563',
        background:   active ? `${colour ?? '#1B5E9B'}18` : 'transparent',
        borderBottom: active ? `2px solid ${colour ?? '#1B5E9B'}` : '2px solid transparent',
        fontWeight:   active ? '700' : '500',
      }}
    >
      {children}
    </Link>
  )
}
