/**
 * POST /api/auth/teacher-register
 *
 * Registers a teacher with a valid one-time invite code from the invite_codes table.
 * Body: { invite_code, full_name, email, password, school_name?, state? }
 *
 * CONTRACT.md §2: collect only full_name + email (+ optional school_name + state for reporting).
 * CONTRACT.md §2: no dob, address, phone.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const VALID_STATES = new Set(['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'])

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const {
    invite_code,
    full_name,
    email,
    password,
    school_name,
    state,
  } = body as Record<string, string>

  if (!invite_code?.trim()) {
    return NextResponse.json({ error: 'invalid_invite_code' }, { status: 403 })
  }

  // Validate invite code against the DB — must exist and not yet used
  const admin = getServiceClient()
  const { data: codeRow, error: codeError } = await admin
    .from('invite_codes')
    .select('id')
    .eq('code', invite_code.trim())
    .is('used_at', null)
    .single()

  if (codeError || !codeRow) {
    return NextResponse.json({ error: 'invalid_invite_code' }, { status: 403 })
  }

  // Basic field validation
  if (!full_name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'password_too_short' }, { status: 400 })
  }
  if (state && !VALID_STATES.has(state)) {
    return NextResponse.json({ error: 'invalid_state' }, { status: 400 })
  }

  // Create auth user via service role (bypasses email confirmation for invite flow)
  const { data, error: signUpError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,  // pre-confirmed — teacher received invite from admin
  })

  if (signUpError || !data.user) {
    // Supabase returns 422 for duplicate email — surface as a user-friendly error
    const isConflict = signUpError?.message?.includes('already')
    return NextResponse.json(
      { error: isConflict ? 'email_in_use' : 'registration_failed' },
      { status: isConflict ? 409 : 500 },
    )
  }

  // Insert teacher_profiles row
  const profile: Record<string, unknown> = {
    user_id:   data.user.id,
    full_name: full_name.trim(),
  }
  if (school_name?.trim()) profile.school_name = school_name.trim()
  if (state) profile.state = state

  const { error: profileError } = await admin
    .from('teacher_profiles')
    .insert(profile)

  if (profileError) {
    // Roll back: delete the orphaned auth user
    await admin.auth.admin.deleteUser(data.user.id)
    return NextResponse.json({ error: 'profile_creation_failed' }, { status: 500 })
  }

  // Mark invite code as used — one-time use enforced at the DB level
  await admin
    .from('invite_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', codeRow.id)

  return NextResponse.json({ message: 'ok' }, { status: 201 })
}
