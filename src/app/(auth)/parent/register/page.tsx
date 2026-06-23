/**
 * Parent registration page.
 * CONTRACT.md §2: Collect only full_name + email — no dob, address, phone.
 * Supabase Auth handles credentials. Session stored in memory only (persistSession: false).
 */
'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { color, typography, space, touch } from '@/theme/tokens'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export default function ParentRegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const supabase = getSupabase()

    // Create Supabase auth user
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error || !data.user) {
      setStatus('error')
      setErrorMsg(error?.message ?? 'Registration failed — please try again.')
      return
    }

    // Insert parent_profiles row
    const { error: profileError } = await supabase
      .from('parent_profiles')
      .insert({ user_id: data.user.id, full_name: fullName.trim() })

    if (profileError) {
      setStatus('error')
      setErrorMsg('Account created but profile setup failed. Please contact support.')
      return
    }

    setStatus('success')
  }, [fullName, email, password])

  if (status === 'success') {
    return (
      <div>
        <h1 style={headingStyle}>Check your email</h1>
        <p style={bodyStyle}>
          We sent a confirmation link to <strong>{email}</strong>.
          Click the link in the email to activate your account, then{' '}
          <a href="/parent/login" style={{ color: color.primary }}>sign in</a>.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 style={headingStyle}>Create a parent account</h1>
      <p style={{ ...bodyStyle, marginBottom: space[6] }}>
        You'll use this account to add your child and set their practice PIN.
        We collect only your name and email — no date of birth, no address.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Your full name" htmlFor="fullName">
          <input
            id="fullName"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Email address" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Password (min 8 characters)" htmlFor="password">
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
          />
        </Field>

        {status === 'error' && (
          <p role="alert" style={{ color: color.error, fontSize: typography.fontSize.sm, marginBottom: space[4] }}>
            {errorMsg}
          </p>
        )}

        <button type="submit" disabled={status === 'loading'} style={btnStyle}>
          {status === 'loading' ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: space[5] }}>
      <label htmlFor={htmlFor} style={{ display: 'block', fontWeight: typography.fontWeight.medium, fontSize: typography.fontSize.sm, marginBottom: space[2], color: color.text }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const headingStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: color.text,
  marginBottom: space[3],
}
const bodyStyle: React.CSSProperties = { color: color.textMuted, lineHeight: typography.lineHeight.base }
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: `${space[3]} ${space[4]}`,
  border: `1px solid ${color.border}`,
  borderRadius: '6px',
  fontSize: typography.fontSize.base,
  boxSizing: 'border-box',
  minHeight: touch.minSize,
}
const btnStyle: React.CSSProperties = {
  width: '100%',
  background: color.primary,
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: `${space[3]} ${space[4]}`,
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.medium,
  cursor: 'pointer',
  minHeight: touch.minSize,
}
