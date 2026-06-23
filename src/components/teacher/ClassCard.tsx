'use client'

import { color, typography, space } from '@/theme/tokens'
import { StudentRow } from './StudentRow'
import { MisconceptionRow } from './MisconceptionRow'
import type { StudentProgress } from './StudentRow'
import type { MisconceptionData } from './MisconceptionRow'

interface ClassCardProps {
  classId:        string
  name:           string
  yearLevel:      number
  joinCode:       string
  /** Substrand codes with activity in the last 14 days. */
  codes:          string[]
  /** Teacher-created students whose names are visible via creator_sees_student RLS. */
  students:       StudentProgress[]
  /** Total enrolled count, including parent-created students. */
  enrolmentCount: number
  /** Top 5 misconceptions in the last 14 days. */
  misconceptions: MisconceptionData[]
}

export function ClassCard({ classId, name, yearLevel, joinCode, codes, students, enrolmentCount, misconceptions }: ClassCardProps) {
  const hiddenCount = enrolmentCount - students.length

  return (
    <section style={{
      background:   color.surface,
      border:       `1px solid ${color.border}`,
      borderRadius: '8px',
      padding:      space[6],
      marginBottom: space[6],
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space[5] }}>
        <div>
          <h2 style={{ margin: 0, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: color.text }}>
            {name}
          </h2>
          <p style={{ margin: `${space[1]} 0 0`, fontSize: typography.fontSize.sm, color: color.textMuted }}>
            Year {yearLevel} · {enrolmentCount} student{enrolmentCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: space[6] }}>
          <p style={{ margin: 0, fontSize: typography.fontSize.sm, color: color.textMuted }}>Join code</p>
          <p style={{ margin: `${space[1]} 0 0`, fontFamily: 'ui-monospace, monospace', fontWeight: typography.fontWeight.bold, letterSpacing: '0.1em', color: color.text }}>
            {joinCode}
          </p>
        </div>
      </div>

      {/* Per-student accuracy table — only teacher-created students shown by name */}
      {students.length > 0 && codes.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: space[5] }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: typography.fontSize.sm }}>
            <thead>
              <tr>
                <th style={thStyle}>Student</th>
                {codes.map(code => (
                  <th key={code} style={{ ...thStyle, fontFamily: 'ui-monospace, monospace', textAlign: 'center' }}>
                    {code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(s => <StudentRow key={s.id} student={s} codes={codes} />)}
            </tbody>
          </table>
          {hiddenCount > 0 && (
            <p style={{ fontSize: typography.fontSize.sm, color: color.textMuted, marginTop: space[2], margin: `${space[2]} 0 0` }}>
              + {hiddenCount} student{hiddenCount !== 1 ? 's' : ''} enrolled via parent (progress visible in full reports)
            </p>
          )}
        </div>
      )}

      {/* Misconception frequency — top 5, last 14 days */}
      {misconceptions.length > 0 && (
        <div>
          <h3 style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: color.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: `0 0 ${space[3]}` }}>
            Top errors — last 14 days
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {misconceptions.map(m => <MisconceptionRow key={m.errorId} {...m} />)}
          </ul>
        </div>
      )}

      {students.length === 0 && misconceptions.length === 0 && (
        <p style={{ color: color.textMuted, fontSize: typography.fontSize.sm, margin: 0 }}>
          No student activity yet. Share the join code above to get started.
        </p>
      )}

      <div style={{ marginTop: space[5], paddingTop: space[5], borderTop: `1px solid ${color.border}` }}>
        <a
          href={`/teacher/class/${classId}`}
          style={{ color: color.primary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, textDecoration: 'none' }}
        >
          Manage class →
        </a>
      </div>
    </section>
  )
}

const thStyle: React.CSSProperties = {
  padding:      `${space[2]} ${space[4]}`,
  textAlign:    'left',
  fontWeight:   typography.fontWeight.medium,
  color:        color.textMuted,
  borderBottom: `2px solid ${color.border}`,
  whiteSpace:   'nowrap',
}
