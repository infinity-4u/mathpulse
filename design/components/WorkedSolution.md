# Component Spec: WorkedSolution
Source: design/inbox/practice-session-response.md · 2026-06-25

## Layout
- `background: successLight` · `border: 1px solid success` · `borderLeft: 4px solid success` · `borderRadius: '6px'` · `padding: space[4] space[5]` · `marginTop: space[4]`
- Heading "WORKED SOLUTION": `fontSize.sm` / `fontWeight.bold` / `color.success` / `letterSpacing: 0.05em` / uppercase · `marginBottom: space[3]`
- Each revealed step: "Step N" label (`fontSize.sm` / `textMuted`) above its KaTeX block
- Divider between steps: `1px solid color.border` (decorative)

## States
| State | Content | Button |
|---|---|---|
| Revealing (not all steps shown) | Steps 1..visibleCount | Next step → (secondary: transparent · 1px `success` border · `success` text · ≥44px) |
| Complete (all steps visible) | All steps | Next question → (primary: `primary` fill · `surface` text · ≥44px) |

## Token map
| Element | Property | Token |
|---|---|---|
| bg | background | successLight |
| Left accent bar | border-left | success |
| Heading | color | success |
| Step label | color | textMuted |
| Step dividers | border | border |
| Next step btn | border + color | success |
| Next question btn fill | background | primary |
| Next question btn label | color | surface |

## Accessibility
- `role="note"` · `aria-label="Worked solution"`
- Next step button: `aria-label="Show step N of N"`
- On each step reveal: move focus to newly shown step container (`tabindex="-1"`)
- All buttons: `outline: 3px solid color.focusRing; outline-offset: 2px`

## Calm mode
- Steps appear instantly on tap — `transition: none`, no reveal animation
- Optional: expose all steps at once with single "Show all steps" affordance (Open Question 5)
- Tokens unchanged
