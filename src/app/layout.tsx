import type { Metadata } from 'next'
import 'katex/dist/katex.min.css'

export const metadata: Metadata = {
  title: 'Australian Maths App',
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
      <body>
        {children}
      </body>
    </html>
  )
}
