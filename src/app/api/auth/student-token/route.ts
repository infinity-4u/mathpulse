/**
 * POST /api/auth/student-token
 *
 * Issues a student JWT from a parent's Supabase session.
 * Body: { student_id: string }
 * Auth: Authorization: Bearer <parent_supabase_jwt>
 *
 * SPEC1:
 *   1. Verify parent JWT via Supabase (auth.uid() must resolve)
 *   2. Confirm parent_student row exists for (parent_id, student_id)
 *   3. Fetch student's class_ids from class_enrolments
 *   4. Sign JWT: { sub: student_id, role: 'student', student_id, class_ids, exp: now + 8h }
 *   5. Return { token, expires_at }
 *
 * CONTRACT.md §3: SUPABASE_JWT_SECRET never logged, never returned to client.
 * CONTRACT.md §2: No PII in logs — only UUIDs if logging at all.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/supabase'
import { signStudentJwt, extractBearer } from '@/lib/jwt'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // 1. Extract parent JWT from Authorization header
  const bearer = extractBearer(req.headers.get('Authorization'))
  if (!bearer) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 2. Parse request body
  let studentId: string
  try {
    const body = await req.json()
    studentId = body?.student_id
    if (!studentId || typeof studentId !== 'string') {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // 3. Verify the parent JWT and resolve parent_id via auth.uid()
  const parentClient = getAuthedClient(bearer)
  const { data: { user: parentUser }, error: authError } = await parentClient.auth.getUser()
  if (authError || !parentUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const parentId = parentUser.id

  // 4. Confirm parent_student link exists (parent must own this student)
  const { data: link, error: linkError } = await parentClient
    .from('parent_student')
    .select('student_id')
    .eq('parent_id', parentId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (linkError || !link) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // 5. Fetch student's class_ids from class_enrolments
  const { data: enrolments } = await parentClient
    .from('class_enrolments')
    .select('class_id')
    .eq('student_id', studentId)

  const classIds = (enrolments ?? []).map((e: { class_id: string }) => e.class_id)

  // 6. Sign and return the student JWT
  const { token, expiresAt } = signStudentJwt({ studentId, classIds })

  return NextResponse.json({ token, expires_at: expiresAt })
}
