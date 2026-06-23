/**
 * Server-side student JWT signing.
 * Uses Node.js built-in crypto — no additional package required.
 *
 * CONTRACT.md §3: SUPABASE_JWT_SECRET never logged, never returned to client.
 * SPEC1: student JWTs are signed with the Supabase JWT secret so Supabase
 *        validates and trusts them; claims are readable in RLS via auth.jwt().
 */
import { createHmac } from 'node:crypto'

export interface StudentTokenPayload {
  studentId: string
  classIds: string[]
}

export interface SignedToken {
  token: string
  expiresAt: number  // Unix timestamp (seconds)
}

/** Sign a student JWT valid for 8 hours. */
export function signStudentJwt(payload: StudentTokenPayload): SignedToken {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) throw new Error('SUPABASE_JWT_SECRET is not set')

  const now = Math.floor(Date.now() / 1000)
  const exp = now + 8 * 3600

  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body    = Buffer.from(JSON.stringify({
    sub:        payload.studentId,
    role:       'student',
    student_id: payload.studentId,
    class_ids:  payload.classIds,
    iat:        now,
    exp,
  })).toString('base64url')

  const sig = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')

  return { token: `${header}.${body}.${sig}`, expiresAt: exp }
}

/**
 * Extract the bearer token from an Authorization header.
 * Returns null if the header is absent or malformed.
 */
export function extractBearer(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7).trim()
  return token.length > 0 ? token : null
}
