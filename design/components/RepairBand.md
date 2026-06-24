# Component Spec: RepairBand
Source: design/inbox/practice-session-response.md · 2026-06-25

CONTRACT: Amber (#B45309) only. Never red. Never "wrong", "incorrect", "mistake", "failed".

## Layout
- `background: repairLight` · `border: 2px solid repair` · `borderRadius: '12px'` · `padding: space[5]` · `marginTop: space[4]`
- Header: 24px ⟳ glyph (`repair`, `aria-hidden`) + framing line (`fontWeight.medium` / `color.repair` / `fontSize.base`)
- Contextual hint / KaTeX block: `marginTop: space[2]`
- Button group: column full-width on <420px; inline `gap: space[3]` above. Primary action last in DOM + visually weightiest.

## States / Modes
| Mode | Framing | Hint | Buttons |
|---|---|---|---|
| CE matched | Error-class framing line | contextual hint (KaTeX) | Try again (2ry) + Show next hint (2ry) |
| No CE match | — | default hint inline | Try again (2ry) + Show next hint (2ry) |
| No hint | "Have another look…" | — | Try again (2ry) + Show next hint (2ry) |
| Hints exhausted OR attempt ≥3 | same as mode | same | Try again (2ry) + **Show worked solution (primary)** |
| Worked solution shown | same | same | **Next question → (primary only)** |

**Secondary button:** `background: transparent` · `border: 1px solid repair` · `color: repair` · `minHeight: touch.minSize`
**Primary button:** `background: repair` · `color: surface` · `minHeight: touch.minSize`

## Framing lines (by error class)
- `conceptual`: "It looks like there's a concept here worth sitting with — this kind of confusion is very common."
- `procedural`: "It looks like a step in the process caught you out — let's see what to focus on."
- `careless` (internal type only — not student-facing): "Looks like a small slip — these are easy to catch once you know what to look for."
- default (no CE): "Have another look — let's work through this together."

## Token map
| Element | Property | Token |
|---|---|---|
| Band bg | background | repairLight |
| Band border | border | repair |
| ⟳ glyph | color | repair (aria-hidden) |
| Framing line | color | repair |
| Secondary btn | border + color | repair |
| Primary btn fill | background | repair |
| Primary btn label | color | surface |

## Accessibility
- `role="status"` · `aria-live="polite"` · `aria-label="Let's work through this"`
- All buttons: `outline: 3px solid color.focusRing; outline-offset: 2px`
- Glyph + amber border + text triple-encode the state — never colour alone
- No shame/judgement language in any rendered string

## Calm mode
- Static repairLight band, no entrance animation, `transition: none`
- Primary button keeps `repair` fill (semantic — not neutralised to calm green)
