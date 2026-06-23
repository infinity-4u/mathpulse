'use client'

import { errorLabel } from '@/lib/errorLabels'
import { color, typography, space } from '@/theme/tokens'

export interface MisconceptionData {
  errorId:       string    // detected_error_id (SPEC3 rule name or CE id)
  frequency:     number    // occurrences in last 14 days
  affectedNames: string[]  // display names of students the teacher created
  unknownCount:  number    // additional affected students teacher cannot see names for
}

export function MisconceptionRow({ errorId, frequency, affectedNames, unknownCount }: MisconceptionData) {
  const label    = errorLabel(errorId)
  const nameList = affectedNames.join(', ')
  const extra    = unknownCount > 0 ? ` + ${unknownCount} more` : ''

  return (
    <li style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'flex-start',
      gap:            space[4],
      padding:        `${space[3]} 0`,
      borderBottom:   `1px solid ${color.border}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: typography.fontWeight.medium, color: color.text, fontSize: typography.fontSize.base }}>
          {label}
        </p>
        {(affectedNames.length > 0 || unknownCount > 0) && (
          <p style={{ margin: `${space[1]} 0 0`, fontSize: typography.fontSize.sm, color: color.textMuted }}>
            {nameList}{extra}
          </p>
        )}
      </div>
      <span style={{
        flexShrink:   0,
        fontSize:     typography.fontSize.sm,
        fontWeight:   typography.fontWeight.bold,
        color:        color.repair,
        background:   '#FEF3C7',
        borderRadius: '12px',
        padding:      `${space[1]} ${space[3]}`,
        whiteSpace:   'nowrap',
      }}>
        {frequency}×
      </span>
    </li>
  )
}
