# Design System — Setup Instructions

The design system has not been set up yet. Set it up in Figma or Claude Design before Phase 1 UI work begins.

## What to create

### Colour tokens (map to src/theme/tokens.ts)
- Primary: #1B5E9B (blue, 4.7:1 contrast on white)
- Repair/incorrect state: #B45309 (amber — never red for wrong answers)
- Success/correct: #166534 (green)
- Technical error only: #B91C1C (red — reserved for network failures etc.)
- Text: #111827 · Text muted: #4B5563 · Border: #D1D5DB
- Calm mode palette: background #F5F0E8, primary #2D5A3D

### Typography
- Base font: system-ui (no custom font for base — reduces load time)
- Dyslexia-friendly option: OpenDyslexic (toggled by student — load on demand)
- Math: KaTeX renders LaTeX — do not use images for equations

### Key components to design first (Phase 1)
1. Question card (stem + options/input + submit)
2. Hint reveal (progressive — hint 1 → hint 2 → hint 3 → worked solution)
3. Repair state (amber, non-shaming — never a red "wrong!" screen)
4. Correct state (green, brief celebration — no animation in calm mode)
5. Progress bar (per substrand, shown on practice selection screen)
6. Teacher assignment card (substrand name + due date + class accuracy)
7. Parent progress view (child's accuracy per topic, "tonight's 3 questions")

### Accessibility requirements (mandatory, not optional)
- All touch targets minimum 44×44px
- WCAG 2.1 AA contrast throughout (4.5:1 for body text, 3:1 for large/UI)
- Focus indicators visible at all times
- Screen reader labels on all interactive elements
- Calm mode: no animations, muted palette, no motion

## Design token sync
Once designed, export tokens as JSON to `src/theme/tokens.ts`.
Component specs go in `design/components/`.
Exported screen assets go in `design/screens/`.
