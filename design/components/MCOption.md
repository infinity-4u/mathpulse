# Component Spec: MCOption
Source: design/inbox/practice-session-response.md · 2026-06-25

## Layout
Full-width button.
- `padding: space[3] space[4]` · `gap: space[4]` · `minHeight: touch.minSize` · `borderRadius: '8px'` · `border: 2px solid` · `fontSize.base` / `color.text` · left-aligned
- 20px radio glyph left (`flex-shrink: 0`)
- 18px status slot right — **reserved space, always present** — so ✓ / ⟳ glyphs never reflow the row

## States
| State | Border | Background | Radio | Right slot |
|---|---|---|---|---|
| Default | `borderStrong` | `surface` | empty | — |
| Selected (pre-submit) | `primary` | `primaryLight` | filled `primary` | — |
| Correct-revealed | `success` | `successLight` | filled `success` | ✓ glyph in `success` |
| Repair-marked | `repair` | `repairLight` | filled `repair` | ⟳ glyph in `repair` (Open Q3) |
| Locked-muted | `border` (decorative) | `surface` | — | `color.textMuted` text + border, `pointer-events: none` |

Note: `primaryLight` is reserved exclusively for the Selected state.

## Token map
| Element | Property | Token |
|---|---|---|
| Border default | border-color | borderStrong |
| Selected border + bg | border / background | primary + primaryLight |
| Correct border + bg | border / background | success + successLight |
| Repair border + bg | border / background | repair + repairLight |
| Radio fill | background | mirrors border colour |
| Radio inner dot | background | surface |
| Status glyph correct | color | success |
| Status glyph repair | color | repair |

## Accessibility
- `role="radio"` · `aria-checked`
- Focus: `outline: 3px solid color.focusRing; outline-offset: 2px` (works on all 4 background colours)
- State conveyed by glyph + colour + border — never colour alone
- Correct-revealed: visually-hidden text "Correct answer"
- Repair-marked: announces only "selected" — no "incorrect"/"wrong"
- Hit area = whole row ≥44px

## Calm mode
Same token mapping. `transition: none` — state changes instant, no colour fade.
