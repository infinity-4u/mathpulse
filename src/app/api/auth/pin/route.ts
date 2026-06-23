/**
 * POST /api/auth/pin
 *
 * Issues a student JWT from a 6-digit PIN (school-device / shared-device flow).
 * Body: { pin: string }
 * No auth header required — the PIN is the credential.
 *
 * SPEC1 security requirements:
 *   - Rate limit: 5 attempts per minute per IP
 *   - Lockout: 10 failures within 5 min → 15 min lockout
 *   - 401 on failure — never reveal whether PIN exists or not
 *   - Raw PIN never stored or logged
 *   - Log only student_id (UUID) on success — nothing on failure
 *
 * CONTRACT.md §2: No PII in logs.
 * CONTRACT.md §3: SUPABASE_JWT_SECRET never logged or returned to client.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { signStudentJwt } from '@/lib/jwt'

export const runtime = 'nodejs'

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// For V1 single-instance deployments. Replace with Redis/Upstash for multi-instance.

const WINDOW_MS         = 60_000       // 1 minute window for 5-req cap
const MAX_PER_WINDOW    = 5            // requests per window
const FAILURE_WINDOW_MS = 5 * 60_000  // 5 min window for lockout tracking
const MAX_FAILURES      = 10          // failures before lockout
const LOCKOUT_MS        = 15 * 60_000 // 15 min lockout duration

interface IpState {
  // Rate limiting (5 req/min)
  reqCount:   number
  windowStart: number
  // Failure tracking (10 failures in 5 min → lockout)
  failCount:    number
  failStart:    number
  lockedUntil:  number
}

const ipState = new Map<string, IpState>()

// Evict stale entries every 30 min to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now()
  for (const [ip, s] of ipState) {
    if (
      now - s.windowStart > WINDOW_MS &&
      now - s.failStart > FAILURE_WINDOW_MS &&
      now > s.lockedUntil
    ) {
      ipState.delete(ip)
    }
  }
}, 30 * 60_000)

function getState(ip: string): IpState {
  const now = Date.now()
  let s = ipState.get(ip)
  if (!s) {
    s = { reqCount: 0, windowStart: now, failCount: 0, failStart: now, lockedUntil: 0 }
    ipState.set(ip, s)
  }
  // Reset rate window if it has expired
  if (now - s.windowStart > WINDOW_MS) {
    s.reqCount   = 0
    s.windowStart = now
  }
  // Reset failure window if it has expired
  if (now - s.failStart > FAILURE_WINDOW_MS) {
    s.failCount = 0
    s.failStart  = now
  }
  return s
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const s   = getState(ip)

  // Lockout check
  if (s.lockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((s.lockedUntil - now) / 1000) }
  }

  // Per-minute cap
  if (s.reqCount >= MAX_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((s.windowStart + WINDOW_MS - now) / 1000) }
  }

  s.reqCount++
  return { allowed: true }
}

function recordFailure(ip: string) {
  const s = getState(ip)
  s.failCount++
  if (s.failCount >= MAX_FAILURES) {
    s.lockedUntil = Date.now() + LOCKOUT_MS
    s.failCount   = 0
    s.failStart   = Date.now()
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Resolve client IP from Vercel/proxy headers
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  // Rate limit check
  const rl = checkRateLimit(ip)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'too_many_requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 60) } },
    )
  }

  // Parse PIN from request body
  let pin: string
  try {
    const body = await req.json()
    pin = String(body?.pin ?? '').trim()
  } catch {
    recordFailure(ip)
    return NextResponse.json({ error: 'invalid_pin' }, { status: 401 })
  }

  // Validate PIN format: 6 digits
  if (!/^\d{6}$/.test(pin)) {
    recordFailure(ip)
    return NextResponse.json({ error: 'invalid_pin' }, { status: 401 })
  }

  // Look up student by PIN using the DB-level bcrypt comparison
  // Service role bypasses RLS — required because RLS cannot key on bcrypt
  const admin = getServiceClient()
  const { data, error } = await admin.rpc('verify_student_pin', { p_pin: pin })

  if (error || !data || data.length === 0) {
    recordFailure(ip)
    return NextResponse.json({ error: 'invalid_pin' }, { status: 401 })
  }

  const row: { student_id: string; class_ids: string[] } = data[0]

  // Sign student JWT
  const { token, expiresAt } = signStudentJwt({
    studentId: row.student_id,
    classIds:  row.class_ids ?? [],
  })

  // Log only the UUID on success — no PII (CONTRACT.md §2)
  // console.log(`[pin-auth] success student_id=${row.student_id}`)

  return NextResponse.json({ token, expires_at: expiresAt })
}
