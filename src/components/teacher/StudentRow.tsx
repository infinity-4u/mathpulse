'use client'

import { color, typography, space } from '@/theme/tokens'

export interface StudentProgress {
  id:          string
  displayName: string
  yearLevel:   number
  /** Per-substrand accuracy keyed by ACARA code. */
  substrands:  Record<string, { correct: number; total: number }>
}

interface StudentRowProps {
  student: StudentProgress
  codes:   string[]   // substrand codes to display (ordered)
}

export function StudentRow({ student, codes }: StudentRowProps) {
  return (
    <tr>
      <td style={nameCellStyle}>
        {student.displayName}
      </td>
      {codes.map(code => {
        const stats = student.substrands[code]
        if (!stats || stats.total === 0) {
          return (
            <td key={code} style={dataCellStyle}>
              <span style={{ color: color.textMuted }}>—</span>
            </td>
          )
        }
        const pct  = Math.round((stats.correct / stats.total) * 100)
        const good = pct >= 70
        return (
          <td key={code} style={dataCellStyle}>
            <span style={{ color: good ? color.success : color.repair, fontWeight: typography.fontWeight.medium, fontSize: typography.fontSize.sm }}>
              {pct}%
            </span>
            <span style={{ color: color.textMuted, fontSize: typography.fontSize.sm }}> ({stats.total})</span>
          </td>
        )
      })}
    </tr>
  )
}

const nameCellStyle: React.CSSProperties = {
  padding:      `${space[3]} ${space[4]}`,
  fontWeight:   typography.fontWeight.medium,
  color:        color.text,
  borderBottom: `1px solid ${color.border}`,
  whiteSpace:   'nowrap',
}

const dataCellStyle: React.CSSProperties = {
  padding:      `${space[3]} ${space[4]}`,
  borderBottom: `1px solid ${color.border}`,
  textAlign:    'center',
}
