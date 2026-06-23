/**
 * New class page — teacher creates a class.
 * join_code is a random 8-character alphanumeric code generated client-side.
 * Students (via parent) will use the join_code to be enrolled.
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

function randomJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  // no I/O/1/0 to avoid confusion
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function NewClassPage() {
  const [supabase, setSupabase]     = useState<SupabaseClient | null>(null)
  const [teacherId, setTeacherId]   = useState<string | null>(null)
  const [name, setName]             = useState('')
  const [yearLevel, setYearLevel]   = useState<number>(7)
  const [status, setStatus]         = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]     = useState('')
  const [newClassId, setNewClassId] = useState('')

  useEffect(() => {
    const sb = getSupabase()
    setSupabase(sb)
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = '/teacher/register'
      } else {
        setTeacherId(data.user.id)
      }
    })
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !teacherId) return

    setStatus('loading')
    setErrorMsg('')

    const joinCode = randomJoinCode()

    const { data, error } = await supabase
      .from('classes')
      .insert({
        teacher_id: teacherId,
        name:       name.trim(),
        year_level: yearLevel,
        join_code:  joinCode,
      })
      .select('id')
      .single()

    if (error || !data) {
      setStatus('error')
      setErrorMsg(error?.message ?? 'Could not create class.')
      return
    }

    setNewClassId(data.id)
    setStatus('success')
  }, [supabase, teacherId, name, yearLevel])

  if (status === 'success') {
    return (
      <div>
        <h1 style={headingStyle}>Class created!</h1>
        <p style={{ ...bodyStyle, marginBottom: space[5] }}>
          <strong>{name}</strong> (Year {yearLevel}) is ready. Share the join code with parents so their child can be enrolled.
        </p>
        <a
          href={`/teacher/class/${newClassId}`}
          style={{ ...btnStyle, display: 'block', textAlign: 'center', textDecoration: 'none' }}
        >
          Go to class →
        </a>
      </div>
    )
  }

  return (
    <div>
      <h1 style={headingStyle}>New class</h1>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Class name" htmlFor="name">
          <input
            id="name"
            type="text"
            required
            placeholder="e.g. 7B Maths"
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Year level" htmlFor="yearLevel">
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

        <button type="submit" disabled={status === 'loading' || !teacherId} style={btnStyle}>
          {status === 'loading' ? 'Creating class…' : 'Create class'}
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
