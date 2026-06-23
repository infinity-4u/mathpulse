/**
 * POST /api/progress
 *
 * Writes student progress to the database using the student JWT.
 * Body type discriminated by `action`:
 *   { action: 'start_session', substrand_code, source }
 *     → INSERT practice_sessions → returns { session_id }
 *   { action: 'record_attempt', session_id, question_id, answer_given, is_correct, hints_used }
 *     → INSERT question_attempts → returns 204
 *   { action: 'complete_session', session_id }
 *     → UPDATE practice_sessions SET completed_at → returns 204
 *
 * Auth: Authorization: Bearer <student_jwt>
 * RLS enforces student_id ownership at the database level (SPEC4 / 0002 migration).
 *
 * CONTRACT.md §2: answer_given stored as TEXT — no PII, no personal data.
 * CONTRACT.md §3: student JWT validated by Supabase at the DB level (signed with SUPABASE_JWT_SECRET).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/supabase'
import { extractBearer } from '@/lib/jwt'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const bearer = extractBearer(req.headers.get('Authorization'))
  if (!bearer) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // Use the student JWT as the bearer — Supabase validates the signature and enforces RLS
  const client = getAuthedClient(bearer)

  const action = body?.action

  // ── Start practice session ──────────────────────────────────────────────────
  if (action === 'start_session') {
    const substrandCode = String(body.substrand_code ?? '')
    const source        = String(body.source ?? 'free_practice')
    const studentId     = String(body.student_id ?? '')

    if (!substrandCode || !studentId) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }
    if (!['assignment', 'free_practice'].includes(source)) {
      return NextResponse.json({ error: 'invalid_source' }, { status: 400 })
    }

    const { data, error } = await client
      .from('practice_sessions')
      .insert({
        student_id:     studentId,
        substrand_code: substrandCode,
        source,
      })
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'could_not_start_session' }, { status: 500 })
    }

    return NextResponse.json({ session_id: data.id }, { status: 201 })
  }

  // ── Record question attempt ─────────────────────────────────────────────────
  if (action === 'record_attempt') {
    const sessionId   = String(body.session_id ?? '')
    const questionId  = String(body.question_id ?? '')
    const isCorrect   = Boolean(body.is_correct)
    const hintsUsed   = Math.min(3, Math.max(0, Number(body.hints_used ?? 0)))
    const answerGiven = body.answer_given != null ? String(body.answer_given) : null

    // Learning trace fields (migration 0005)
    const detectedErrorId = body.detected_error_id != null ? String(body.detected_error_id) : null
    const hintIdsShown    = Array.isArray(body.hint_ids_shown)
      ? (body.hint_ids_shown as unknown[]).map(String)
      : []
    const repairSuccess   = body.repair_success != null ? Boolean(body.repair_success) : null

    if (!sessionId || !questionId) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    const { error } = await client
      .from('question_attempts')
      .insert({
        session_id:        sessionId,
        question_id:       questionId,
        answer_given:      answerGiven,
        is_correct:        isCorrect,
        hints_used:        hintsUsed,
        detected_error_id: detectedErrorId,
        hint_ids_shown:    hintIdsShown,
        repair_success:    repairSuccess,
      })

    if (error) {
      return NextResponse.json({ error: 'could_not_record_attempt' }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  }

  // ── Complete session ────────────────────────────────────────────────────────
  if (action === 'complete_session') {
    const sessionId = String(body.session_id ?? '')
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
    }

    const { error } = await client
      .from('practice_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (error) {
      return NextResponse.json({ error: 'could_not_complete_session' }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 })
}
