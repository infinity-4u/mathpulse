# Component Spec: CorrectBand
Source: design/inbox/practice-session-response.md · 2026-06-25

## Layout
- `background: successLight` · `border: 2px solid success` · `borderRadius: '12px'` · `padding: space[5]` · `marginTop: space[4]`
- Stack **vertically** (not space-between) — fixes uneven 375px distribution:
  - Row 1: ✓ glyph (24px, `color.success`, `aria-hidden`) + message
  - Row 2: action button — full-width on <420px, auto-width above
- Optional last-question subline `fontSize.sm` / `color.textMuted` under message

## States
| State | Message | Button |
|---|---|---|
| Default (1st correct) | "Correct — on to the next one." | Next question → |
| 2–3 consecutive | "You got this one right first try." | Next question → |
| 4+ consecutive | "Your last N answers have all been correct." | Next question → |
| After a hint | "You worked that out after a hint — that counts." | Next question → |
| Last question | Any message + subline "That's the last question in this set." | See results |

Button: `background: success` · `color: surface` · `minHeight: 44px` · `borderRadius: '6px'` · `autoFocus` on mount.

## Token map
| Element | Property | Token |
|---|---|---|
| Band bg | background | successLight |
| Band border | border | success |
| ✓ glyph | color | success (aria-hidden) |
| Message | color | success |
| Message weight | font-weight | fontWeight.medium |
| Subline | color | textMuted |
| Button fill | background | success |
| Button label | color | surface |

## Accessibility
- `role="status"` · `aria-live="polite"` · `aria-label="Correct"`
- ✓ glyph `aria-hidden="true"` — success conveyed by message text
- Button: `autoFocus` on mount · `outline: 3px solid color.focusRing; outline-offset: 2px`

## Calm mode
- Band mounts in final state — no green flash, no entrance animation
- Button fill stays `success` (semantic colour — not changed to calm green)
- No hover transition
