/**
 * Practice session page — Server Component.
 * Loads the static content JSON, pre-renders all math strings via KaTeX,
 * then passes the pre-rendered questions to the Client Component.
 *
 * CONTRACT.md: content is STATIC JSON, never from the database.
 * No-runtime-AI tripwire: no LLM calls anywhere in this path.
 */
import { notFound } from 'next/navigation'
import { loadContent } from '@/lib/content'
import { PracticeSession } from '@/components/practice/PracticeSession'

interface Props {
  params: { substrand: string }
}

export default async function SessionPage({ params }: Props) {
  const questions = await loadContent(params.substrand)

  if (!questions || questions.length === 0) {
    notFound()
  }

  return (
    <PracticeSession
      questions={questions}
      substrandCode={params.substrand}
    />
  )
}
