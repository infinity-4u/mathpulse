'use client'

/**
 * Parent "tonight's practice" page.
 * Calls GET /api/progress/tonight with the parent JWT.
 * Displays up to 3 questions prioritised by repair history + accuracy.
 * Each question shows a one-line reason for why it was selected.
 *
 * CONTRACT.md §4: no AI — questions are selected by deterministic priority rules.
 * CONTRACT.md §2: no PII passed to API beyond the student UUID.
 */
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { MathText } from '@/components/ui/MathText'
import { color, typography, space } from '@/theme/tokens'
import type { TonightQuestion } from '@/app/api/progress/tonight/route'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

interface Child { id: string; display_name: string }

export default function TonightPage() {
  const [children, setChildren]         = useState<Child[]>([])
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [parentToken, setParentToken]   = useState<string | null>(null)
  const [questions, setQuestions]       = useState<TonightQuestion[]>([])
  const [loading, setLoading]           = useState(true)
  const [questLoading, setQuestLoading] = useState(false)

  useEffect(() => {
    const sb = getSupabase()
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) { window.location.href = '/parent/register'; return }
      setParentToken(data.session.access_token)
      const parentId = data.session.user.id

      const { data: links } = await sb
        .from('parent_student')
        .select('student_id')
        .eq('parent_id', parentId)
      if (!links?.length) { setLoading(false); return }

      const ids = (links as { student_id: string }[]).map(l => l.student_id)
      const { data: profiles } = await sb
        .from('student_profiles')
        .select('id, display_name')
        .in('id', ids)

      const kids = (profiles ?? []) as Child[]
      setChildren(kids)
      if (kids.length) setSelectedId(kids[0].id)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedId || !parentToken) return
    setQuestLoading(true)
    fetch(`/api/progress/tonight?student_id=${encodeURIComponent(selectedId)}`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    })
      .then(r => r.json())
      .then(data => { setQuestions(data.questions ?? []); setQuestLoading(false) })
      .catch(() => setQuestLoading(false))
  }, [selectedId, parentToken])

  if (loading) return <p style={bodyStyle}>Loading…</p>

  const selectedChild = children.find(c => c.id === selectedId)

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: `${space[8]} ${space[6]}` }}>
      <a href="/parent/dashboard" style={{ color: color.textMuted, fontSize: typography.fontSize.sm, textDecoration: 'none' }}>
        ← Back to progress
      </a>

      <h1 style={{ ...headingStyle, marginTop: space[4] }}>Tonight's practice</h1>

      {children.length === 0 ? (
        <p style={bodyStyle}>
          No children added yet.{' '}
          <a href="/parent/child/new" style={{ color: color.primary }}>Add a child →</a>
        </p>
      ) : (
        <>
          {children.length > 1 && (
            <div style={{ marginBottom: space[5] }}>
              <select
                value={selectedId ?? ''}
                onChange={e => setSelectedId(e.target.value)}
                aria-label="Choose a child"
                style={{ fontSize: typography.fontSize.base, border: `1px solid ${color.border}`, borderRadius: '6px', padding: `${space[2]} ${space[3]}`, minHeight: '40px' }}
              >
                {children.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
              </select>
            </div>
          )}

          <p style={{ ...bodyStyle, marginBottom: space[6] }}>
            Three questions for <strong>{selectedChild?.display_name ?? '—'}</strong> tonight —
            chosen based on their recent practice history.
          </p>

          {questLoading ? (
            <p style={bodyStyle}>Finding questions…</p>
          ) : questions.length === 0 ? (
            <p style={bodyStyle}>
              No suggestions yet — {selectedChild?.display_name} hasn't practised anything.
              Have them start at <a href="/practice" style={{ color: color.primary }}>Practice</a>.
            </p>
          ) : (
            <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {questions.map((tq, i) => (
                <li key={tq.question.id} style={{
                  marginBottom:  space[5],
                  background:    color.surface,
                  border:        `1px solid ${color.border}`,
                  borderRadius:  '8px',
                  padding:       space[5],
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[3] }}>
                    <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: color.textMuted }}>
                      Question {i + 1}
                    </span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: typography.fontSize.sm, color: color.textMuted }}>
                      {tq.substrandCode}
                    </span>
                  </div>
                  <div style={{ color: color.text, lineHeight: typography.lineHeight.base, marginBottom: space[3] }}>
                    <MathText html={tq.question.stemHtml} block />
                  </div>
                  {tq.question.options && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: `0 0 ${space[3]}` }}>
                      {tq.question.options.map((opt, j) => (
                        <li key={j} style={{ fontSize: typography.fontSize.sm, color: color.textMuted, padding: `${space[1]} 0` }}>
                          {String.fromCharCode(65 + j)}. <MathText html={opt} />
                        </li>
                      ))}
                    </ul>
                  )}
                  <p style={{ margin: 0, fontSize: typography.fontSize.sm, color: color.textMuted, fontStyle: 'italic' }}>
                    {tq.reason}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  )
}

const headingStyle: React.CSSProperties = { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: color.text, marginBottom: space[3] }
const bodyStyle: React.CSSProperties    = { color: color.textMuted, lineHeight: typography.lineHeight.base }
