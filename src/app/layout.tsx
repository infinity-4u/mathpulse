import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import 'katex/dist/katex.min.css'
import './globals.css'
import { StudentSessionProvider } from '@/contexts/StudentSessionContext'
import { NavBar } from '@/components/ui/NavBar'

// Self-hosted at build time via next/font — no runtime request to Google (privacy-safe)
const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
})

export const metadata: Metadata = {
  title: 'AusMaths — Curriculum-aligned maths for Years 7–10',
  description: 'Curriculum-aligned maths practice for Australian students in Years 7–10.',
  // No analytics metadata tags — CONTRACT.md §2
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={inter.variable}>
      <body>
        <StudentSessionProvider>
          <NavBar />
          {children}
        </StudentSessionProvider>
      </body>
    </html>
  )
}
