/**
 * Assign practice page — teacher assigns a substrand to a class.
 * ACARA substrand codes are derived from static content JSON filenames.
 * CONTRACT.md: question content is static JSON — the DB stores only the code reference.
 */
'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import { color, typography, space, touch } from '@/theme/tokens'

// V1 content codes — derived from files in content/curriculum/
// This list is updated as content files are added; it is not read from the DB.
const AVAILABLE_SUBSTRANDS = [
  { code: 'AC9M7N01', label: 'Year 7 · Number: Integers and number sense' },
  // Future: add more codes as content files are verified and merged
]

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function AssignForm({ classId }: { classId: string }) {
  const [substrandCode, setSubstrandCode] = useState(AVAILABLE_SUBSTRANDS[0]?.code ?? '')
  const [dueDate, setDueDate]             = useState('')
  const [status, setStatus]               = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]           = useState('')
  const [teacherAuthed, setTeacherAuthed] = useState(false)

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = '/teacher/register'
      } else {
        setTeacherAuthed(true)
      }
    })
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherAuthed) return

    setStatus('loading')
    setErrorMsg('')

    const sb = getSupabase()
    const payload: Record<string, unknown> = {
      class_id:       classId,
      substrand_code: substrandCode,
    }
    if (dueDate) payload.due_date = dueDate

    const { error } = await sb.from('assignments').insert(payload)

    if (error) {
      setStatus('error')
      setErrorMsg(error.message ?? 'Could not create assignment.')
      return
    }

    setStatus('success')
  }, [teacherAuthed, classId, substrandCode, dueDate])

  if (status === 'success') {
    return (
      <div>
        <h1 style={headingStyle}>Practice assigned!</h1>
        <p style={bodyStyle}>
          Students in this class can now practise <strong>{substrandCode}</strong>.
        </p>
        <a href={`/teacher/class/${classId}`} style={{ color: color.primary }}>
          ← Back to class
        </a>
      </div>
    )
  }

  return (
    <div>
      <h1 style={headingStyle}>Assign practice</h1>
      <p style={{ ...bodyStyle, marginBottom: space[6] }}>
        Students will be able to practise the selected topic. All questions are pre-authored and verified — no AI in the student session.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Substrand" htmlFor="substrand">
          <select
            id="substrand"
            value={substrandCode}
            onChange={e => setSubstrandCode(e.target.value)}
            style={inputStyle}
          >
            {AVAILABLE_SUBSTRANDS.map(s => (
              <option key={s.code} value={s.code}>
                {s.code} — {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Due date (optional)" htmlFor="dueDate">
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={inputStyle}
          />
        </Field>

        {status === 'error' && (
          <p role="alert" style={{ color: color.error, fontSize: typography.fontSize.sm, marginBottom: space[4] }}>
            {errorMsg}
          </p>
        )}

        <button type="submit" disabled={status === 'loading' || !teacherAuthed} style={btnStyle}>
          {status === 'loading' ? 'Assigning…' : 'Assign practice'}
        </button>

        <a href={`/teacher/class/${classId}`} style={{ display: 'block', textAlign: 'center', marginTop: space[4], color: color.textMuted, fontSize: typography.fontSize.sm }}>
          Cancel
        </a>
      </form>
    </div>
  )
}

export default function AssignPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <AssignForm classId={params.id} />
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
