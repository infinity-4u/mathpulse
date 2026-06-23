/**
 * GET /api/progress/tonight?student_id=<uuid>
 *
 * Returns up to 3 questions for the parent's "tonight's practice" view.
 * Priority (CONTRACT.md §4: deterministic — no AI, no random selection):
 *   1. repair_success = false in last 14 days → most recent failure substrand
 *   2. accuracy < 0.70 in last 7 days → lowest question_id substrand
 *   3. Unattempted substrands from AVAILABLE_CODES
 *
 * Each returned question includes a one-line reason for why it was selected.
 *
 * Auth: Bearer <parent JWT>
 * RLS: parent_sees_child_sessions + parent_sees_child_attempts
 * CONTRACT.md §3: RLS at database level via parent JWT.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/supabase'
import { extractBearer } from '@/lib/jwt'
import { loadContent, AVAILABLE_CODES } from '@/lib/content'
import type { PreRenderedQuestion } from '@/lib/content'

export const runtime = 'nodejs'

export interface TonightQuestion {
  substrandCode: string
  question: Pick<PreRenderedQuestion, 'id' | 'stemHtml' | 'type' | 'options'>
  reason: string
}

export interface TonightResponse {
  questions: TonightQuestion[]
}

export async function GET(req: NextRequest) {
  const bearer = extractBearer(req.headers.get('Authorization'))
  if (!bearer) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const studentId = req.nextUrl.searchParams.get('student_id')
  if (!studentId) return NextResponse.json({ error: 'missing student_id' }, { status: 400 })

  const client = getAuthedClient(bearer) // RLS enforced via parent JWT

  const now             = Date.now()
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo    = new Date(now -  7 * 24 * 60 * 60 * 1000).toISOString()

  // ── 1. Fetch child's sessions (last 14 days) ─────────────────────────────
  // RLS: parent_sees_child_sessions ensures parent only reads their child's data
  const { data: sessRows } = await client
    .from('practice_sessions')
    .select('id, substrand_code, started_at')
    .eq('student_id', studentId)
    .gte('started_at', fourteenDaysAgo)

  const sessions = (sessRows ?? []) as { id: string; substrand_code: string; started_at: string }[]
  const sessionIds = sessions.map(s => s.id)

  let attempts: { session_id: string; is_correct: boolean; repair_success: boolean | null; attempted_at: string }[] = []
  if (sessionIds.length > 0) {
    const { data: attRows } = await client
      .from('question_attempts')
      .select('session_id, is_correct, repair_success, attempted_at')
      .in('session_id', sessionIds)
    attempts = (attRows ?? []) as typeof attempts
  }

  const sessMap = new Map(sessions.map(s => [s.id, s]))

  // ── Priority 1: most recent substrand with repair_success = false ──────────
  const recentFailures = attempts
    .filter(a => a.repair_success === false)
    .sort((a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime())

  const p1Substrand = recentFailures.length > 0
    ? (sessMap.get(recentFailures[0].session_id)?.substrand_code ?? null)
    : null

  // ── Priority 2: substrands with accuracy < 0.70 in last 7 days ───────────
  const recentSessIds = new Set(sessions.filter(s => s.started_at >= sevenDaysAgo).map(s => s.id))
  const recentAttempts = attempts.filter(a => recentSessIds.has(a.session_id))

  const subAccuracy = new Map<string, { correct: number; total: number }>()
  for (const att of recentAttempts) {
    const code = sessMap.get(att.session_id)?.substrand_code
    if (!code) continue
    if (!subAccuracy.has(code)) subAccuracy.set(code, { correct: 0, total: 0 })
    const s = subAccuracy.get(code)!
    s.total++
    if (att.is_correct) s.correct++
  }

  const lowAccuracyCodes = [...subAccuracy.entries()]
    .filter(([, s]) => s.total > 0 && s.correct / s.total < 0.70)
    .map(([code]) => code)

  // ── Priority 3: unattempted substrands from AVAILABLE_CODES ──────────────
  const attemptedCodes = new Set(sessions.map(s => s.substrand_code))
  const unattemptedCodes = AVAILABLE_CODES.filter(c => !attemptedCodes.has(c))

  // ── Build the 3 tonight questions ─────────────────────────────────────────
  const selected: TonightQuestion[] = []
  const usedCodes = new Set<string>()

  async function tryAdd(code: string, reason: string): Promise<void> {
    if (selected.length >= 3 || usedCodes.has(code)) return
    const questions = await loadContent(code)
    if (!questions?.length) return
    const q = questions[0]
    selected.push({
      substrandCode: code,
      question:      { id: q.id, stemHtml: q.stemHtml, type: q.type, options: q.options },
      reason,
    })
    usedCodes.add(code)
  }

  if (p1Substrand) {
    await tryAdd(p1Substrand, "You got stuck here recently — let's try it again.")
  }

  for (const code of lowAccuracyCodes) {
    await tryAdd(code, 'Your recent accuracy here is below 70% — good to keep practising.')
  }

  for (const code of unattemptedCodes) {
    await tryAdd(code, 'A new topic to explore.')
  }

  return NextResponse.json({ questions: selected } satisfies TonightResponse)
}
