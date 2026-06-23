/**
 * Supabase client factories — server-side only.
 * CONTRACT.md §3: service role key never sent to client.
 * CONTRACT.md §2: all data in ap-southeast-2 (enforced by the Supabase project URL).
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

/**
 * Service-role Supabase client — bypasses RLS.
 * Use ONLY in server-side API routes for operations that require elevated access
 * (e.g., PIN verification, inserting student profiles).
 * Never return this client or its key to the browser.
 */
export function getServiceClient() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY', SERVICE_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * Anon Supabase client with a caller-supplied Authorization header.
 * Used server-side to verify parent/teacher JWTs or make RLS-guarded calls.
 */
export function getAuthedClient(bearerToken: string) {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', ANON_KEY),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    },
  )
}
