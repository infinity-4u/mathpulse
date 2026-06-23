'use client'

/**
 * Fraction input: two numeric fields separated by a fraction bar.
 * Outputs a "numerator/denominator" string (e.g. "3/4") via onChange.
 * Used for questions with answer.type === 'fraction'.
 */
import { useCallback } from 'react'
import { color, typography, space } from '@/theme/tokens'

interface FractionInputProps {
  value:    string    // "3/4" format; empty string when blank
  onChange: (v: string) => void
}

function parseParts(value: string): { num: string; den: string } {
  const [num = '', den = ''] = value.split('/')
  return { num, den }
}

export function FractionInput({ value, onChange }: FractionInputProps) {
  const { num, den } = parseParts(value)

  const handleNum = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const n = e.target.value.replace(/[^0-9-]/g, '')
    onChange(n && den ? `${n}/${den}` : '')
  }, [den, onChange])

  const handleDen = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/[^0-9]/g, '')
    onChange(num && d ? `${num}/${d}` : '')
  }, [num, onChange])

  return (
    <div
      role="group"
      aria-label="Fraction input"
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: space[1], marginBottom: space[4] }}
    >
      <input
        type="text"
        inputMode="numeric"
        aria-label="Numerator"
        value={num}
        onChange={handleNum}
        placeholder="0"
        style={fieldStyle}
      />
      <div style={{ width: '48px', height: '2px', background: color.text, borderRadius: '1px' }} role="presentation" aria-hidden />
      <input
        type="text"
        inputMode="numeric"
        aria-label="Denominator"
        value={den}
        onChange={handleDen}
        placeholder="1"
        style={fieldStyle}
      />
    </div>
  )
}

const fieldStyle: React.CSSProperties = {
  width:       '48px',
  textAlign:   'center',
  border:      `1px solid ${color.border}`,
  borderRadius: '6px',
  padding:     `${space[2]} ${space[1]}`,
  fontSize:    typography.fontSize.lg,
  fontWeight:  typography.fontWeight.bold,
  color:       color.text,
  background:  color.surface,
}
