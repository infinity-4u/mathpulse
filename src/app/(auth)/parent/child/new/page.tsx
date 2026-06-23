/**
 * Add child page — parent creates a student profile.
 * CONTRACT.md §2: collect ONLY display_name (nickname) + year_level.
 * NEVER: dob, email, real name, address, phone.
 * Students cannot self-register — accounts come from parent flow only.
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { color, typography, space, touch } from '@/theme/tokens'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export default function AddChildPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [parentId, setParentId]     = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [yearLevel, setYearLevel]   = useState<number>(7)
  const [status, setStatus]         = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]     = useState('')
  const [newStudentId, setNewStudentId] = useState('')

  useEffect(() => {
    const sb = getSupabase()
    setSupabase(sb)
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = '/parent/register'
      } else {
        setParentId(data.user.id)
      }
    })
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !parentId) return

    setStatus('loading')
    setErrorMsg('')

    // Insert student_profiles row — only display_name + year_level (CONTRACT.md §2)
    const { data: student, error: studentError } = await supabase
      .from('student_profiles')
      .insert({
        display_name:    displayName.trim(),
        year_level:      yearLevel,
        created_by_role: 'parent',
        created_by_id:   parentId,
      })
      .select('id')
      .single()

    if (studentError || !student) {
      setStatus('error')
      setErrorMsg(studentError?.message ?? 'Could not create student profile.')
      return
    }

    // Create parent_student link
    const { error: linkError } = await supabase
      .from('parent_student')
      .insert({ parent_id: parentId, student_id: student.id })

    if (linkError) {
      setStatus('error')
      setErrorMsg('Student created but link failed. Please contact support.')
      return
    }

    setNewStudentId(student.id)
    setStatus('success')
  }, [supabase, parentId, displayName, yearLevel])

  if (status === 'success') {
    return (
      <div>
        <h1 style={headingStyle}>Child added!</h1>
        <p style={bodyStyle}>
          <strong>{displayName}</strong> has been added to your account.
          Next, set a 6-digit PIN so they can sign in on a school device.
        </p>
        <a
          href={`/parent/child/pin?student_id=${newStudentId}`}
          style={{ ...btnStyle, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: space[5] }}
        >
          Set PIN for {displayName}
        </a>
      </div>
    )
  }

  return (
    <div>
      <h1 style={headingStyle}>Add a child</h1>
      <p style={{ ...bodyStyle, marginBottom: space[6] }}>
        We only need a nickname and school year — no real name, no date of birth.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Nickname (display name)" htmlFor="displayName">
          <input
            id="displayName"
            type="text"
            required
            maxLength={40}
            placeholder="e.g. Matilda or Mattie"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="School year" htmlFor="yearLevel">
          <select
            id="yearLevel"
            value={yearLevel}
            onChange={e => setYearLevel(Number(e.target.value))}
            style={inputStyle}
          >
            {[7, 8, 9, 10].map(y => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </Field>

        {status === 'error' && (
          <p role="alert" style={{ color: color.error, fontSize: typography.fontSize.sm, marginBottom: space[4] }}>
            {errorMsg}
          </p>
        )}

        <button type="submit" disabled={status === 'loading' || !parentId} style={btnStyle}>
          {status === 'loading' ? 'Adding child…' : 'Add child'}
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
