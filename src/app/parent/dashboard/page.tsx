'use client'

/**
 * Parent progress dashboard — per-substrand accuracy for each child.
 * Links to the "tonight's 3 questions" view.
 *
 * Data: practice_sessions + question_attempts via parent Supabase JWT.
 * RLS: parent_sees_child_sessions + parent_sees_child_attempts.
 * CONTRACT.md §4: no AI — pure aggregation over question_attempts.
 */
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

interface Child       { id: string; display_name: string; year_level: number }
interface SessionRow  { id: string; substrand_code: string }
interface AttemptRow  { session_id: string; is_correct: boolean }

interface SubstrandStat {
  code:     string
  correct:  number
  total:    number
  accuracy: number
}

export default function ParentDashboardPage() {
  const [children, setChildren]         = useState<Child[]>([])
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [substrands, setSubstrands]     = useState<SubstrandStat[]>([])
  const [loading, setLoading]           = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    const sb = getSupabase()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = '/parent/register'
        return
      }
      const parentId = data.user.id

      const { data: links } = await sb
        .from('parent_student')
        .select('student_id')
        .eq('parent_id', parentId)

      if (!links?.length) { setLoading(false); return }

      const ids = (links as { student_id: string }[]).map(l => l.student_id)
      const { data: profiles } = await sb
        .from('student_profiles')
        .select('id, display_name, year_level')
        .in('id', ids)

      const children = (profiles ?? []) as Child[]
      setChildren(children)
      if (children.length) setSelectedId(children[0].id)
      setLoading(false)
    })
  }, [])

  // Fetch accuracy stats whenever the selected child changes
  useEffect(() => {
    if (!selectedId) return
    setStatsLoading(true)
    const sb = getSupabase()

    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return

      const { data: sessRows } = await sb
        .from('practice_sessions')
        .select('id, substrand_code')
        .eq('student_id', selectedId)
      const sessions = (sessRows ?? []) as SessionRow[]

      if (!sessions.length) { setSubstrands([]); setStatsLoading(false); return }

      const sessionIds = sessions.map(s => s.id)
      const { data: attRows } = await sb
        .from('question_attempts')
        .select('session_id, is_correct')
        .in('session_id', sessionIds)
      const attempts = (attRows ?? []) as AttemptRow[]

      const sessMap = new Map(sessions.map(s => [s.id, s.substrand_code]))
      const statsMap = new Map<string, { correct: number; total: number }>()

      for (const att of attempts) {
        const code = sessMap.get(att.session_id)
        if (!code) continue
        if (!statsMap.has(code)) statsMap.set(code, { correct: 0, total: 0 })
        const s = statsMap.get(code)!
        s.total++
        if (att.is_correct) s.correct++
      }

      const result: SubstrandStat[] = [...statsMap.entries()]
        .map(([code, s]) => ({ code, ...s, accuracy: s.total > 0 ? s.correct / s.total : 0 }))
        .sort((a, b) => a.code.localeCompare(b.code))

      setSubstrands(result)
      setStatsLoading(false)
    })
  }, [selectedId])

  if (loading) return <p style={bodyStyle}>Loading…</p>

  const selectedChild = children.find(c => c.id === selectedId)

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: `${space[8]} ${space[6]}` }}>
      <h1 style={headingStyle}>Practice progress</h1>

      {children.length === 0 ? (
        <p style={bodyStyle}>
          No children added yet.{' '}
          <a href="/parent/child/new" style={{ color: color.primary }}>Add a child →</a>
        </p>
      ) : (
        <>
          {children.length > 1 && (
            <div style={{ marginBottom: space[5] }}>
              <label htmlFor="childSelect" style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: color.textMuted, marginRight: space[3] }}>
                Viewing:
              </label>
              <select
                id="childSelect"
                value={selectedId ?? ''}
                onChange={e => setSelectedId(e.target.value)}
                style={{ fontSize: typography.fontSize.base, border: `1px solid ${color.border}`, borderRadius: '6px', padding: `${space[2]} ${space[3]}`, minHeight: '40px' }}
              >
                {children.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[5] }}>
            <h2 style={subheadingStyle}>
              {selectedChild?.display_name ?? '—'}
            </h2>
            <a href="/parent/tonight" style={{ color: color.primary, fontWeight: typography.fontWeight.medium, fontSize: typography.fontSize.sm }}>
              Tonight's practice →
            </a>
          </div>

          {statsLoading ? (
            <p style={bodyStyle}>Loading…</p>
          ) : substrands.length === 0 ? (
            <p style={bodyStyle}>No practice sessions recorded yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {substrands.map(s => {
                const pct  = Math.round(s.accuracy * 100)
                const good = pct >= 70
                return (
                  <li key={s.code} style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    padding:        `${space[3]} 0`,
                    borderBottom:   `1px solid ${color.border}`,
                  }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: typography.fontSize.sm, color: color.text }}>
                      {s.code}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: space[3] }}>
                      <span style={{ fontSize: typography.fontSize.sm, color: color.textMuted }}>
                        {s.correct}/{s.total} correct
                      </span>
                      <span style={{ fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.base, color: good ? color.success : color.repair }}>
                        {pct}%
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

const headingStyle: React.CSSProperties    = { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: color.text, marginBottom: space[6] }
const subheadingStyle: React.CSSProperties = { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: color.text, margin: 0 }
const bodyStyle: React.CSSProperties       = { color: color.textMuted, lineHeight: typography.lineHeight.base }
