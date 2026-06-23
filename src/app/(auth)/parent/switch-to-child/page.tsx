/**
 * Switch-to-child page — parent selects a child and opens a student session.
 * Calls POST /api/auth/student-token → stores the student JWT in SessionContext (memory only).
 * SPEC1: JWT stored in React context — never localStorage, never sessionStorage.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useStudentSession } from '@/contexts/StudentSessionContext'
import { color, typography, space, touch } from '@/theme/tokens'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

interface Child {
  id: string
  display_name: string
  year_level: number
}

export default function SwitchToChildPage() {
  const { setSession } = useStudentSession()
  const [children, setChildren] = useState<Child[]>([])
  const [parentToken, setParentToken] = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)
  const [error, setError]         = useState('')

  useEffect(() => {
    const sb = getSupabase()
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.href = '/parent/register'
        return
      }
      setParentToken(data.session.access_token)
      const parentId = data.session.user.id

      // Fetch this parent's children via parent_student join
      const { data: links } = await sb
        .from('parent_student')
        .select('student_id')
        .eq('parent_id', parentId)

      if (links && links.length > 0) {
        const ids = links.map((l: { student_id: string }) => l.student_id)
        const { data: profiles } = await sb
          .from('student_profiles')
          .select('id, display_name, year_level')
          .in('id', ids)
        setChildren(profiles ?? [])
      }
      setLoading(false)
    })
  }, [])

  const switchTo = useCallback(async (studentId: string) => {
    if (!parentToken) return
    setSwitching(studentId)
    setError('')

    const res = await fetch('/api/auth/student-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`,
      },
      body: JSON.stringify({ student_id: studentId }),
    })

    if (!res.ok) {
      setSwitching(null)
      setError('Could not start child session. Please try again.')
      return
    }

    const { token, expires_at } = await res.json()
    setSession({ token, studentId, classIds: [], expiresAt: expires_at })
    window.location.href = '/practice'
  }, [parentToken, setSession])

  if (loading) return <p style={bodyStyle}>Loading…</p>

  return (
    <div>
      <h1 style={headingStyle}>Choose a child</h1>
      <p style={{ ...bodyStyle, marginBottom: space[6] }}>
        Select which child's practice session to open. The session lasts 8 hours and is stored only in this browser tab.
      </p>

      {error && (
        <p role="alert" style={{ color: color.error, fontSize: typography.fontSize.sm, marginBottom: space[4] }}>
          {error}
        </p>
      )}

      {children.length === 0 ? (
        <p style={bodyStyle}>
          No children added yet.{' '}
          <a href="/parent/child/new" style={{ color: color.primary }}>Add a child →</a>
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {children.map(child => (
            <li key={child.id} style={{ marginBottom: space[3] }}>
              <button
                onClick={() => switchTo(child.id)}
                disabled={switching !== null}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: `${space[4]} ${space[5]}`,
                  background: color.surface,
                  border: `1px solid ${color.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  minHeight: touch.minSize,
                  fontSize: typography.fontSize.base,
                }}
              >
                <span style={{ fontWeight: typography.fontWeight.medium }}>
                  {child.display_name}
                </span>
                <span style={{ color: color.textMuted, fontSize: typography.fontSize.sm }}>
                  {switching === child.id ? 'Opening…' : `Year ${child.year_level} →`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const headingStyle: React.CSSProperties = { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: color.text, marginBottom: space[3] }
const bodyStyle: React.CSSProperties    = { color: color.textMuted, lineHeight: typography.lineHeight.base }
