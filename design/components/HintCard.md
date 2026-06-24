# Component Spec: HintCard
Source: design/inbox/practice-session-response.md · 2026-06-25

## Layout
- `background: repairLight` · `border: 1px solid repair` · `borderLeft: 4px solid repair` · `borderRadius: '6px'` · `padding: space[3] space[4]` · `marginTop: space[3]`
- Header: 20px circular numbered badge (`repair` text on `surface`, 1px `repair` border) + "Hint N" label (`fontSize.sm` / `fontWeight.medium` / `repair`)
- Hint body: KaTeX block below header

## States
Static per `hintNumber`. Stacks vertically as hints reveal — each new card `marginTop: space[3]`. No interactive state.

## Token map
| Element | Property | Token |
|---|---|---|
| bg | background | repairLight |
| Left accent bar | border-left | repair |
| Border | border | repair |
| Label + badge | color | repair |
| Badge bg | background | surface |
| Body text | color | text |

## Accessibility
- `role="note"` · `aria-label="Hint {n}"`
- Left bar = reinforcement only; "Hint N" label is the real cue (not colour-dependent)
- No focusable elements inside

## Calm mode
Renders instantly on reveal — no slide/fade animation. Identical tokens.
