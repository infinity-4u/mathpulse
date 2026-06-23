/**
 * Practice entry page.
 * If the student has no session → PIN entry form.
 * If the student has a session → substrand selection.
 * SPEC1: all student state is in memory — never localStorage/sessionStorage.
 */
'use client'

import { useState, useCallback } from 'react'
import { useStudentSession } from '@/contexts/StudentSessionContext'
import { color, typography, space, touch } from '@/theme/tokens'

const AVAILABLE_SUBSTRANDS = [
  { code: 'AC9M7N01', label: 'Year 7 · Squares and square roots', year: 7 },
]

export default function PracticePage() {
  const { session, setSession } = useStudentSession()

  if (!session) {
    return <PinEntryForm onSuccess={setSession} />
  }

  return <SubstrandPicker />
}

// ─── PIN entry ─────────────────────────────────────────────────────────────────

interface StudentSession {
  token: string
  studentId: string
  classIds: string[]
  expiresAt: number
}

function PinEntryForm({ onSuccess }: { onSuccess: (s: StudentSession) => void }) {
  const [pin, setPin]     = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(pin)) {
      setError('Enter your 6-digit PIN.')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })

    setLoading(false)

    if (res.status === 429) {
      const retry = res.headers.get('Retry-After') ?? '60'
      setError(`Too many attempts. Try again in ${retry} seconds.`)
      setPin('')
      return
    }

    if (!res.ok) {
      setError('Incorrect PIN. Please try again.')
      setPin('')
      return
    }

    const { token, expires_at } = await res.json()
    // We don't have student_id here — the server stores it inside the JWT.
    // Decode it from the JWT payload (base64, no verification needed client-side).
    const payload  = JSON.parse(atob(token.split('.')[1]))
    onSuccess({
      token,
      studentId: payload.student_id,
      classIds:  payload.class_ids ?? [],
      expiresAt: expires_at,
    })
  }, [pin, onSuccess])

  return (
    <div style={{ maxWidth: '360px', margin: '0 auto', padding: `${space[16]} ${space[6]}` }}>
      <h1 style={headingStyle}>Enter your PIN</h1>
      <p style={{ ...bodyStyle, marginBottom: space[6] }}>
        Type your 6-digit PIN to start practising.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <input
          type="password"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          placeholder="• • • • • •"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          aria-label="6-digit PIN"
          style={{
            width: '100%',
            padding: `${space[4]} ${space[5]}`,
            fontSize: '1.5rem',
            letterSpacing: '0.4em',
            textAlign: 'center',
            border: `2px solid ${error ? color.error : color.border}`,
            borderRadius: '8px',
            outline: 'none',
            marginBottom: space[3],
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <p role="alert" style={{ color: color.error, fontSize: typography.fontSize.sm, marginBottom: space[4], textAlign: 'center' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading || pin.length !== 6} style={btnStyle}>
          {loading ? 'Checking…' : 'Start practising'}
        </button>
      </form>
    </div>
  )
}

// ─── Substrand picker ──────────────────────────────────────────────────────────

function SubstrandPicker() {
  const { session, clearSession, isExpiringSoon } = useStudentSession()

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: `${space[8]} ${space[6]}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[8] }}>
        <h1 style={headingStyle}>What would you like to practise?</h1>
        <button onClick={clearSession} style={{ background: 'none', border: 'none', color: color.textMuted, fontSize: typography.fontSize.sm, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>

      {isExpiringSoon && (
        <p role="status" style={{ background: color.repairLight, color: color.repair, padding: `${space[3]} ${space[4]}`, borderRadius: '6px', fontSize: typography.fontSize.sm, marginBottom: space[5] }}>
          Session expires soon — you'll need to enter your PIN again.
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {AVAILABLE_SUBSTRANDS.map(s => (
          <li key={s.code} style={{ marginBottom: space[3] }}>
            <a
              href={`/practice/session/${s.code}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${space[4]} ${space[5]}`,
                background: color.surface,
                border: `1px solid ${color.border}`,
                borderRadius: '8px',
                textDecoration: 'none',
                color: color.text,
                minHeight: touch.minSize,
              }}
            >
              <div>
                <div style={{ fontWeight: typography.fontWeight.medium }}>{s.label}</div>
                <div style={{ fontSize: typography.fontSize.sm, color: color.textMuted, fontFamily: 'ui-monospace, monospace' }}>{s.code}</div>
              </div>
              <span style={{ color: color.textMuted }}>→</span>
            </a>
          </li>
        ))}
      </ul>

      {session && (
        <p style={{ fontSize: typography.fontSize.sm, color: color.textMuted, marginTop: space[8], textAlign: 'center' }}>
          Session active until{' '}
          {new Date(session.expiresAt * 1000).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  )
}

const headingStyle: React.CSSProperties = { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: color.text, margin: 0 }
const bodyStyle: React.CSSProperties    = { color: color.textMuted, lineHeight: typography.lineHeight.base }
const btnStyle: React.CSSProperties    = { width: '100%', background: color.primary, color: '#fff', border: 'none', borderRadius: '8px', padding: `${space[4]} ${space[4]}`, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, cursor: 'pointer', minHeight: touch.minSize }
