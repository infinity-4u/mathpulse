/**
 * PATCH /api/student/pin
 *
 * Sets or updates a student's PIN. Requires parent's Supabase JWT.
 * Body: { student_id: string, pin: string }
 * Auth: Authorization: Bearer <parent_supabase_jwt>
 *
 * Security:
 *   1. Verify parent JWT (Supabase auth.getUser)
 *   2. Confirm parent_student row exists (parent owns this student)
 *   3. Call DB function set_student_pin(uuid, plain) — bcrypt hash stored, raw PIN never persisted
 *   4. Return 204 No Content
 *
 * CONTRACT.md §2: raw PIN never logged.
 * CONTRACT.md §3: service role key used only server-side.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthedClient, getServiceClient } from '@/lib/supabase'
import { extractBearer } from '@/lib/jwt'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest) {
  const bearer = extractBearer(req.headers.get('Authorization'))
  if (!bearer) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let studentId: string, pin: string
  try {
    const body = await req.json()
    studentId  = body?.student_id
    pin        = String(body?.pin ?? '')
    if (!studentId || typeof studentId !== 'string') {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // Validate PIN format
  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: 'pin must be 6 digits' }, { status: 400 })
  }

  // Verify parent JWT
  const parentClient = getAuthedClient(bearer)
  const { data: { user: parentUser }, error: authError } = await parentClient.auth.getUser()
  if (authError || !parentUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Confirm parent owns this student
  const { data: link, error: linkError } = await parentClient
    .from('parent_student')
    .select('student_id')
    .eq('parent_id', parentUser.id)
    .eq('student_id', studentId)
    .maybeSingle()

  if (linkError || !link) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Hash and store PIN via DB function — raw PIN never written to any column directly
  const admin = getServiceClient()
  const { error: pinError } = await admin.rpc('set_student_pin', {
    p_student_id: studentId,
    p_pin:        pin,
  })

  if (pinError) {
    return NextResponse.json({ error: 'could_not_set_pin' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
