/**
 * Set PIN page — parent sets a 6-digit PIN for their child.
 * Calls PATCH /api/student/pin (requires parent JWT).
 * The raw PIN is sent over HTTPS and immediately hashed server-side — never stored in plain text.
 */
'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { color, typography, space, touch } from '@/theme/tokens'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function SetPinForm() {
  const searchParams  = useSearchParams()
  const studentId     = searchParams.get('student_id') ?? ''
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [token, setToken]     = useState<string | null>(null)
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = '/parent/register'
      } else {
        setToken(data.session.access_token)
      }
    })
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (!/^\d{6}$/.test(pin)) {
      setErrorMsg('PIN must be exactly 6 digits.')
      return
    }
    if (pin !== confirm) {
      setErrorMsg('PINs do not match.')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    const res = await fetch('/api/student/pin', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ student_id: studentId, pin }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setStatus('error')
      setErrorMsg(body?.error ?? 'Could not set PIN. Please try again.')
      return
    }

    setStatus('success')
  }, [token, pin, confirm, studentId])

  if (!studentId) {
    return <p style={{ color: color.error }}>No student ID provided.</p>
  }

  if (status === 'success') {
    return (
      <div>
        <h1 style={headingStyle}>PIN set!</h1>
        <p style={bodyStyle}>
          Your child can now sign in on a school device by entering their 6-digit PIN.
        </p>
        <a href="/parent/switch-to-child" style={{ color: color.primary }}>
          Switch to your child's session now →
        </a>
      </div>
    )
  }

  return (
    <div>
      <h1 style={headingStyle}>Set a 6-digit PIN</h1>
      <p style={{ ...bodyStyle, marginBottom: space[6] }}>
        Your child will enter this PIN to start practising on a school device.
        Choose something memorable but not a birthday.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="6-digit PIN" htmlFor="pin">
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={inputStyle}
            aria-describedby="pin-hint"
          />
          <span id="pin-hint" style={{ fontSize: typography.fontSize.sm, color: color.textMuted }}>
            Digits only, exactly 6.
          </span>
        </Field>

        <Field label="Confirm PIN" htmlFor="confirm">
          <input
            id="confirm"
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={inputStyle}
          />
        </Field>

        {errorMsg && (
          <p role="alert" style={{ color: color.error, fontSize: typography.fontSize.sm, marginBottom: space[4] }}>
            {errorMsg}
          </p>
        )}

        <button type="submit" disabled={status === 'loading' || !token} style={btnStyle}>
          {status === 'loading' ? 'Saving PIN…' : 'Save PIN'}
        </button>
      </form>
    </div>
  )
}

export default function SetPinPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <SetPinForm />
    </Suspense>
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
