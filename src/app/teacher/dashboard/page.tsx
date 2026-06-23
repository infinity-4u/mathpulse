'use client'

/**
 * Teacher dashboard — shows all classes with per-student accuracy and
 * top-5 misconception frequency view (last 14 days).
 *
 * Data: read from classes + class_enrolments + student_profiles +
 *       practice_sessions + question_attempts using the teacher's Supabase JWT.
 * RLS: teacher_sees_class_attempts, teacher_sees_class_sessions,
 *      teacher_sees_class_enrolments, creator_sees_student (names only for
 *      students the teacher created — not parent-enrolled students).
 * CONTRACT.md §3: RLS enforced at DB level via teacher JWT.
 * CONTRACT.md §4: no LLM calls — all computation is client-side aggregation.
 */
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ClassCard } from '@/components/teacher/ClassCard'
import { color, typography, space } from '@/theme/tokens'
import type { StudentProgress } from '@/components/teacher/StudentRow'
import type { MisconceptionData } from '@/components/teacher/MisconceptionRow'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

// ─── Row shapes returned by Supabase ─────────────────────────────────────────
interface ClassRow    { id: string; name: string; year_level: number; join_code: string }
interface EnrolRow    { class_id: string; student_id: string }
interface ProfileRow  { id: string; display_name: string; year_level: number }
interface SessionRow  { id: string; student_id: string; substrand_code: string }
interface AttemptRow  { session_id: string; is_correct: boolean; detected_error_id: string | null }

// ─── Derived shape per class ──────────────────────────────────────────────────
interface ClassDash {
  classRow:       ClassRow
  codes:          string[]
  students:       StudentProgress[]
  enrolmentCount: number
  misconceptions: MisconceptionData[]
}

export default function TeacherDashboardPage() {
  const [classDash, setClassDash] = useState<ClassDash[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    const sb = getSupabase()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = '/teacher/register'
        return
      }

      try {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

        // 1 — Teacher's classes
        const { data: classRows } = await sb
          .from('classes')
          .select('id, name, year_level, join_code')
          .order('created_at', { ascending: false })
        const classes = (classRows ?? []) as ClassRow[]
        if (!classes.length) { setClassDash([]); setLoading(false); return }

        const classIds = classes.map(c => c.id)

        // 2 — Enrolments for all teacher classes
        const { data: enrolRows } = await sb
          .from('class_enrolments')
          .select('class_id, student_id')
          .in('class_id', classIds)
        const enrolments = (enrolRows ?? []) as EnrolRow[]
        const allStudentIds = [...new Set(enrolments.map(e => e.student_id))]

        // 3 — Profiles (RLS: creator_sees_student — only students the teacher created)
        const { data: profileRows } = await sb
          .from('student_profiles')
          .select('id, display_name, year_level')
          .in('id', allStudentIds)
        const profiles = (profileRows ?? []) as ProfileRow[]
        const profileMap = new Map(profiles.map(p => [p.id, p]))

        // 4 — Practice sessions, last 14 days
        let sessions: SessionRow[] = []
        if (allStudentIds.length > 0) {
          const { data: sessRows } = await sb
            .from('practice_sessions')
            .select('id, student_id, substrand_code')
            .in('student_id', allStudentIds)
            .gte('started_at', fourteenDaysAgo)
          sessions = (sessRows ?? []) as SessionRow[]
        }

        // 5 — Question attempts for those sessions
        let attempts: AttemptRow[] = []
        const sessionIds = sessions.map(s => s.id)
        if (sessionIds.length > 0) {
          const { data: attRows } = await sb
            .from('question_attempts')
            .select('session_id, is_correct, detected_error_id')
            .in('session_id', sessionIds)
          attempts = (attRows ?? []) as AttemptRow[]
        }

        // Index: session_id → session
        const sessMap = new Map(sessions.map(s => [s.id, s]))

        // Per-student per-substrand accuracy
        const studentStats = new Map<string, Record<string, { correct: number; total: number }>>()
        for (const att of attempts) {
          const sess = sessMap.get(att.session_id)
          if (!sess) continue
          const sid  = sess.student_id
          const code = sess.substrand_code
          if (!studentStats.has(sid)) studentStats.set(sid, {})
          const sub = studentStats.get(sid)!
          if (!sub[code]) sub[code] = { correct: 0, total: 0 }
          sub[code].total++
          if (att.is_correct) sub[code].correct++
        }

        // Misconception frequency: group by detected_error_id across all class students
        const errorGroups = new Map<string, { frequency: number; studentIds: Set<string> }>()
        for (const att of attempts) {
          if (!att.detected_error_id) continue
          const sess = sessMap.get(att.session_id)
          if (!sess) continue
          if (!errorGroups.has(att.detected_error_id)) {
            errorGroups.set(att.detected_error_id, { frequency: 0, studentIds: new Set() })
          }
          const grp = errorGroups.get(att.detected_error_id)!
          grp.frequency++
          grp.studentIds.add(sess.student_id)
        }

        // Build per-class dashboard data
        const result: ClassDash[] = classes.map(cls => {
          const classEnrols     = enrolments.filter(e => e.class_id === cls.id)
          const classStudentIds = classEnrols.map(e => e.student_id)
          const enrolmentCount  = classStudentIds.length
          const classStudentSet = new Set(classStudentIds)

          // Teacher-created profiles in this class
          const classProfiles = profiles.filter(p => classStudentSet.has(p.id))

          // Active substrand codes (from sessions of enrolled students)
          const codeset = new Set<string>()
          for (const sid of classStudentIds) {
            Object.keys(studentStats.get(sid) ?? {}).forEach(c => codeset.add(c))
          }
          const codes = [...codeset].sort()

          const students: StudentProgress[] = classProfiles.map(p => ({
            id:          p.id,
            displayName: p.display_name,
            yearLevel:   p.year_level,
            substrands:  studentStats.get(p.id) ?? {},
          }))

          // Top 5 misconceptions for this class
          const classMisconceptions: MisconceptionData[] = []
          for (const [errorId, grp] of errorGroups.entries()) {
            const classAffected = [...grp.studentIds].filter(sid => classStudentSet.has(sid))
            if (!classAffected.length) continue
            const affectedNames = classAffected
              .map(sid => profileMap.get(sid)?.display_name)
              .filter((n): n is string => Boolean(n))
            const unknownCount = classAffected.length - affectedNames.length
            classMisconceptions.push({ errorId, frequency: grp.frequency, affectedNames, unknownCount })
          }
          classMisconceptions.sort((a, b) => b.frequency - a.frequency)

          return { classRow: cls, codes, students, enrolmentCount, misconceptions: classMisconceptions.slice(0, 5) }
        })

        setClassDash(result)
      } catch {
        setError('Failed to load dashboard data. Please refresh.')
      }

      setLoading(false)
    })
  }, [])

  if (loading) return <p style={bodyStyle}>Loading…</p>
  if (error)   return <p style={{ color: color.error }}>{error}</p>

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: `${space[8]} ${space[6]}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[6] }}>
        <h1 style={headingStyle}>My classes</h1>
        <a
          href="/teacher/class/new"
          style={{ background: color.primary, color: '#fff', border: 'none', borderRadius: '6px', padding: `${space[2]} ${space[5]}`, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          + New class
        </a>
      </div>

      {classDash.length === 0 ? (
        <p style={bodyStyle}>
          No classes yet.{' '}
          <a href="/teacher/class/new" style={{ color: color.primary }}>Create your first class →</a>
        </p>
      ) : (
        classDash.map(c => (
          <ClassCard
            key={c.classRow.id}
            classId={c.classRow.id}
            name={c.classRow.name}
            yearLevel={c.classRow.year_level}
            joinCode={c.classRow.join_code}
            codes={c.codes}
            students={c.students}
            enrolmentCount={c.enrolmentCount}
            misconceptions={c.misconceptions}
          />
        ))
      )}
    </div>
  )
}

const headingStyle: React.CSSProperties = { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: color.text, margin: 0 }
const bodyStyle: React.CSSProperties    = { color: color.textMuted, lineHeight: typography.lineHeight.base }
