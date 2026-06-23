import type { Metadata } from 'next'
import 'katex/dist/katex.min.css'
import { StudentSessionProvider } from '@/contexts/StudentSessionContext'
import { NavBar } from '@/components/ui/NavBar'

export const metadata: Metadata = {
  title: 'AusMaths — Curriculum-aligned maths for Years 7–10',
  description: 'Curriculum-aligned maths practice for Australian students in Years 7–10.',
  // No analytics metadata tags — CONTRACT.md §2
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-AU">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <StudentSessionProvider>
          <NavBar />
          {children}
        </StudentSessionProvider>
      </body>
    </html>
  )
}
