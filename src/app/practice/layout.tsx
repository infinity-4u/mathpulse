/**
 * Practice layout — wraps all practice pages with the student session provider.
 * The provider holds the student JWT in memory (never localStorage).
 */
import type { ReactNode } from 'react'
import { color, typography } from '@/theme/tokens'

export default function PracticeLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontFamily: typography.fontFamily.base, background: color.background, minHeight: '100vh' }}>
      {children}
    </div>
  )
}
