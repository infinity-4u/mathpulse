/**
 * TRIPWIRE: au-region
 * Fails if Supabase or hosting region config is not ap-southeast-2 (Sydney).
 * Enforces CONTRACT.md §2, compliance.md APP 8.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '../..')
const REQUIRED_REGION = 'ap-southeast-2'

describe('au-region tripwire', () => {
  it('supabase/config.toml specifies ap-southeast-2 region', () => {
    const configPath = resolve(ROOT, 'supabase/config.toml')
    expect(existsSync(configPath), 'supabase/config.toml not found').toBe(true)

    const config = readFileSync(configPath, 'utf-8')
    expect(
      config,
      `supabase/config.toml must contain region = "ap-southeast-2"`
    ).toContain(`region = "${REQUIRED_REGION}"`)
  })

  it('.env.example specifies SUPABASE_REGION=ap-southeast-2', () => {
    const envPath = resolve(ROOT, '.env.example')
    expect(existsSync(envPath), '.env.example not found').toBe(true)

    const env = readFileSync(envPath, 'utf-8')
    expect(
      env,
      '.env.example must set SUPABASE_REGION=ap-southeast-2'
    ).toContain(`SUPABASE_REGION=${REQUIRED_REGION}`)
  })

  it('no US-only Supabase URL patterns in .env.example', () => {
    const envPath = resolve(ROOT, '.env.example')
    if (!existsSync(envPath)) return

    const env = readFileSync(envPath, 'utf-8')
    // Supabase URLs with us-east, us-west etc in the project ref would indicate wrong region
    const usRegionPattern = /supabase\.co.*\b(us-east|us-west|us-central|eu-west|eu-central)\b/i
    expect(
      usRegionPattern.test(env),
      '.env.example contains a non-Sydney Supabase region URL'
    ).toBe(false)
  })

  it('next.config.ts does not configure a non-Sydney edge region', () => {
    const configPath = resolve(ROOT, 'next.config.ts')
    if (!existsSync(configPath)) return

    const config = readFileSync(configPath, 'utf-8')
    // If a region is specified, it must not be a US region
    const usRegionPattern = /\b(iad1|sfo1|lax1|sea1|pdx1|cle1|dfw1|cpt1|hnd1|icn1|bom1|gru1|fra1|cdg1)\b/
    expect(
      usRegionPattern.test(config),
      'next.config.ts configures a non-Sydney Vercel region'
    ).toBe(false)
  })
})
