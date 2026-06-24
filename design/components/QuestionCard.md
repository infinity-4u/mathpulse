# Component Spec: QuestionCard
Source: design/inbox/practice-session-response.md · 2026-06-25

## Layout
Single column, max-width 640px, centred.
- `background: color.surface` · `borderRadius: '12px'` · `boxShadow: shadows.raised` · `border: 1px solid color.border` · `padding: space[6]`
- Header: 3 stacked elements, left-aligned (NOT space-between):
  1. Strand eyebrow — `fontSize.sm` / `fontWeight.medium` / `color.strand[strand]` / `letterSpacing: 0.04em` / uppercase
  2. Counter — "Question 3 of 5" · `fontSize.sm` / `color.textMuted`
  3. Progress dots row — `gap: space[1]` · `aria-hidden="true"` (decorative)
- `marginBottom: space[6]` from header to stem
- Stem: `fontSize.xl` (20px) · `lineHeight.loose` · `color.text` · `fontWeight.normal` · `marginBottom: space[6]`
- Answer zone: MC column `gap: space[3]` OR NumericInput · `marginBottom: space[6]`
- Check button: full-width · `minHeight: '48px'` · `borderRadius: '8px'` · `fontSize.base` / `fontWeight.bold`

## States
| State | Visual |
|---|---|
| Default | Check disabled — `opacity: 0.5`, `cursor: not-allowed`, `aria-disabled="true"` |
| Answer selected | Check enabled — `background: color.primary`; hover → `color.primaryDark` |
| Submitted-locked | Inputs `pointer-events: none` / `aria-disabled`; Check hidden; feedback band mounts below (card stays) |
| Dots | completed = `color.success` · current = `color.primary` · upcoming = `color.border` |

## Token map
| Element | Property | Token |
|---|---|---|
| Card bg | background | surface |
| Card border | border | border |
| Elevation | box-shadow | shadows.raised |
| Eyebrow | color | strand[strand] |
| Counter | color | textMuted |
| Dots | background | success / primary / border |
| Stem | font-size | fontSize.xl |
| Check fill | background | primary → primaryDark on hover |
| Check label | color | surface |
| Check radius | border-radius | 8px |
| Check padding | padding | space[4] |

## Props
```typescript
interface QuestionCardProps {
  question:       PreRenderedQuestion
  questionNumber: number
  total:          number
  selectedAnswer: string
  onAnswerChange: (v: string) => void
  onSubmit:       () => void
  submitDisabled: boolean
  strand?:        keyof typeof color.strand  // for eyebrow (Open Question 1)
}
```

## Accessibility
- Progress counter ("Question 3 of 5") is the accessible source — dots are `aria-hidden="true"`
- MC container: `role="radiogroup"` with `aria-label` = plain-text question stem
- Check button: `aria-disabled="true"` when disabled (not HTML `disabled` — stays focusable/discoverable)
- Focus: `outline: 3px solid color.focusRing; outline-offset: 2px`
- Stem minimum 20px · contrast 19:1

## Calm mode
- `background: calm.background` · `color: calm.text`
- Check fill: `calm.primary` (#2D5A3D — 6.6:1 on white ✓)
- `transition: none` on all hover/border changes
- `shadows.raised` → `shadows.card` (reduces visual stimulation)
