/**
 * Teacher registration page — invite-only.
 * Invite code is validated server-side (TEACHER_INVITE_CODES env var never sent to browser).
 * CONTRACT.md §2: collect only full_name + email + optional school/state.
 */
'use client'

import { useState, useCallback } from 'react'
import { color, typography, space, touch } from '@/theme/tokens'

const AU_STATES = ['NSW','VIC','QLD','WA','SA','TAS','ACT','NT']

export default function TeacherRegisterPage() {
  const [inviteCode, setInviteCode]   = useState('')
  const [fullName, setFullName]       = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [schoolName, setSchoolName]   = useState('')
  const [state, setState]             = useState('')
  const [status, setStatus]           = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]       = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const res = await fetch('/api/auth/teacher-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invite_code:  inviteCode.trim().toUpperCase(),
        full_name:    fullName,
        email,
        password,
        school_name:  schoolName || undefined,
        state:        state || undefined,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const messages: Record<string, string> = {
        invalid_invite_code: 'That invite code is not valid. Please check with your school admin.',
        email_in_use:        'An account with that email already exists.',
        password_too_short:  'Password must be at least 8 characters.',
      }
      setStatus('error')
      setErrorMsg(messages[body?.error] ?? 'Registration failed — please try again.')
      return
    }

    setStatus('success')
  }, [inviteCode, fullName, email, password, schoolName, state])

  if (status === 'success') {
    return (
      <div>
        <h1 style={headingStyle}>Account created!</h1>
        <p style={bodyStyle}>
          You can now{' '}
          <a href="/teacher/login" style={{ color: color.primary }}>sign in</a>
          {' '}and set up your first class.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 style={headingStyle}>Teacher account</h1>
      <p style={{ ...bodyStyle, marginBottom: space[6] }}>
        You'll need an invite code from your school coordinator.
        We collect your name and email — no phone or date of birth required.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Invite code" htmlFor="inviteCode">
          <input
            id="inviteCode"
            type="text"
            required
            placeholder="e.g. INVITE-001"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Full name" htmlFor="fullName">
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

        <Field label="School name (optional)" htmlFor="schoolName">
          <input
            id="schoolName"
            type="text"
            value={schoolName}
            onChange={e => setSchoolName(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="State (optional)" htmlFor="state">
          <select
            id="state"
            value={state}
            onChange={e => setState(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select state…</option>
            {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        {status === 'error' && (
          <p role="alert" style={{ color: color.error, fontSize: typography.fontSize.sm, marginBottom: space[4] }}>
            {errorMsg}
          </p>
        )}

        <button type="submit" disabled={status === 'loading'} style={btnStyle}>
          {status === 'loading' ? 'Creating account…' : 'Create teacher account'}
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

const headingStyle: React.CSSProperties = { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: color.text, marginBottom: space[3] }
const bodyStyle: React.CSSProperties    = { color: color.textMuted, lineHeight: typography.lineHeight.base }
const inputStyle: React.CSSProperties  = { width: '100%', padding: `${space[3]} ${space[4]}`, border: `1px solid ${color.border}`, borderRadius: '6px', fontSize: typography.fontSize.base, boxSizing: 'border-box', minHeight: touch.minSize }
const btnStyle: React.CSSProperties    = { width: '100%', background: color.primary, color: '#fff', border: 'none', borderRadius: '6px', padding: `${space[3]} ${space[4]}`, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, cursor: 'pointer', minHeight: touch.minSize }
