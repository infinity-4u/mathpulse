/**
 * GET /api/progress/spaced?current=AC9M7N01
 *
 * Returns 2 pre-rendered questions from the substrand the student most recently
 * struggled with (repair_success = false), different from the current substrand.
 *
 * Returns null (204) if:
 *   - Student has no prior repair failures in a different substrand, OR
 *   - The identified substrand has no verified content loaded yet.
 *
 * Auth: Authorization: Bearer <student_jwt>
 * RLS ensures the student only reads their own question_attempts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/supabase'
import { extractBearer } from '@/lib/jwt'
import { loadContent, type PreRenderedQuestion } from '@/lib/content'

export const runtime = 'nodejs'

export interface SpacedResponse {
  substrandCode: string
  questions:     PreRenderedQuestion[]
}

export async function GET(req: NextRequest) {
  const bearer = extractBearer(req.headers.get('Authorization'))
  if (!bearer) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const currentSubstrand = req.nextUrl.searchParams.get('current') ?? ''
  if (!currentSubstrand) {
    return NextResponse.json({ error: 'missing current param' }, { status: 400 })
  }

  const client = getAuthedClient(bearer)

  // Step 1: find session_ids where this student had repair failures
  const { data: failures } = await client
    .from('question_attempts')
    .select('session_id')
    .eq('repair_success', false)
    .limit(100)

  if (!failures?.length) {
    return new NextResponse(null, { status: 204 })
  }

  const sessionIds = [...new Set(failures.map((f: { session_id: string }) => f.session_id))]

  // Step 2: find the practice sessions for those failures, different substrand, most recent first
  const { data: sessions } = await client
    .from('practice_sessions')
    .select('substrand_code, created_at')
    .in('id', sessionIds)
    .neq('substrand_code', currentSubstrand)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!sessions?.length) {
    return new NextResponse(null, { status: 204 })
  }

  // Most recently-failed substrand (first in DESC order)
  const targetSubstrand = (sessions[0] as { substrand_code: string }).substrand_code

  // Step 3: load verified content for that substrand
  const allQuestions = await loadContent(targetSubstrand)
  if (!allQuestions?.length) {
    return new NextResponse(null, { status: 204 })
  }

  // Take first 2 (lowest question_id for determinism — JSON order matches alphabetical ID sort)
  const questions = allQuestions.slice(0, 2)

  return NextResponse.json({ substrandCode: targetSubstrand, questions } satisfies SpacedResponse)
}
