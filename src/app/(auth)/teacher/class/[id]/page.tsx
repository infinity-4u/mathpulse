/**
 * Class detail page — teacher views their class, students, and assignments.
 * Join code is shown prominently so the teacher can share with parents.
 */
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { color, typography, space } from '@/theme/tokens'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

interface ClassDetail {
  id: string
  name: string
  year_level: number
  join_code: string
}
interface Student {
  id: string
  display_name: string
  year_level: number
}
interface Assignment {
  id: string
  substrand_code: string
  due_date: string | null
  created_at: string
}

export default function ClassDetailPage({ params }: { params: { id: string } }) {
  const classId = params.id

  const [classDetail, setClassDetail]   = useState<ClassDetail | null>(null)
  const [students, setStudents]         = useState<Student[]>([])
  const [assignments, setAssignments]   = useState<Assignment[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  useEffect(() => {
    const sb = getSupabase()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = '/teacher/register'
        return
      }

      // Fetch class (RLS ensures teacher only sees own classes)
      const { data: cls, error: clsError } = await sb
        .from('classes')
        .select('id, name, year_level, join_code')
        .eq('id', classId)
        .single()

      if (clsError || !cls) {
        setError('Class not found or you do not have access.')
        setLoading(false)
        return
      }
      setClassDetail(cls)

      // Fetch enrolled students
      const { data: enrolments } = await sb
        .from('class_enrolments')
        .select('student_id')
        .eq('class_id', classId)

      if (enrolments && enrolments.length > 0) {
        const ids = enrolments.map((e: { student_id: string }) => e.student_id)
        const { data: profiles } = await sb
          .from('student_profiles')
          .select('id, display_name, year_level')
          .in('id', ids)
        setStudents(profiles ?? [])
      }

      // Fetch assignments for this class
      const { data: asgns } = await sb
        .from('assignments')
        .select('id, substrand_code, due_date, created_at')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })

      setAssignments(asgns ?? [])
      setLoading(false)
    })
  }, [classId])

  if (loading) return <p style={bodyStyle}>Loading…</p>
  if (error) return <p style={{ color: color.error }}>{error}</p>
  if (!classDetail) return null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space[6] }}>
        <div>
          <h1 style={headingStyle}>{classDetail.name}</h1>
          <p style={bodyStyle}>Year {classDetail.year_level}</p>
        </div>
        <a
          href={`/teacher/class/${classId}/assign`}
          style={{ background: color.primary, color: '#fff', border: 'none', borderRadius: '6px', padding: `${space[2]} ${space[5]}`, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          + Assign practice
        </a>
      </div>

      {/* Join code — share with parents */}
      <section style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: '8px', padding: space[5], marginBottom: space[8] }}>
        <p style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: color.textMuted, marginBottom: space[2] }}>
          Join code — share with parents to enrol their child
        </p>
        <p style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.15em', color: color.text, margin: 0 }}>
          {classDetail.join_code}
        </p>
      </section>

      {/* Students */}
      <section style={{ marginBottom: space[8] }}>
        <h2 style={subheadingStyle}>Students ({students.length})</h2>
        {students.length === 0 ? (
          <p style={bodyStyle}>No students enrolled yet. Parents use the join code above to enrol their child.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {students.map(s => (
              <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: `${space[3]} 0`, borderBottom: `1px solid ${color.border}`, fontSize: typography.fontSize.base, color: color.text }}>
                <span>{s.display_name}</span>
                <span style={{ color: color.textMuted }}>Year {s.year_level}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Assignments */}
      <section>
        <h2 style={subheadingStyle}>Assigned practice</h2>
        {assignments.length === 0 ? (
          <p style={bodyStyle}>No assignments yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {assignments.map(a => (
              <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: `${space[3]} 0`, borderBottom: `1px solid ${color.border}`, fontSize: typography.fontSize.base }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', color: color.text }}>{a.substrand_code}</span>
                <span style={{ color: color.textMuted }}>
                  {a.due_date ? `Due ${new Date(a.due_date).toLocaleDateString('en-AU')}` : 'No due date'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

const headingStyle: React.CSSProperties    = { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: color.text, margin: 0 }
const subheadingStyle: React.CSSProperties = { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: color.text, marginBottom: space[4] }
const bodyStyle: React.CSSProperties       = { color: color.textMuted, lineHeight: typography.lineHeight.base }
