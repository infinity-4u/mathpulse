# AusMaths Design Brief — Practice Session
Generated for Claude Design. Follow the response format at the end exactly.

---

## SECTION 1: The ask (read this first)

Design the practice session screen for an Australian Year 7–10 maths app — the screen students spend the most time on. It has four visual states that must be designed together: (1) question display, (2) correct answer, (3) wrong answer / repair, (4) worked solution. The existing components are functional but unstyled beyond basic tokens — the ask is a visual design pass that improves hierarchy, clarity, and emotional tone while staying within the token system and constraints below. Describe the delta from the current implementation, not a full rewrite.

---

## SECTION 2: Non-negotiable constraints

- Single-column layout, max-width 640px, centred. Never two-column at any breakpoint.
- Font: system-ui only. No CDN fonts. KaTeX renders all maths — never use images for equations.
- Touch targets ≥ 44×44px on every interactive element.
- WCAG 2.1 AA: 4.5:1 contrast for body text, 3:1 for large text and UI components.
- `color.repair` (amber) = wrong answer states only. `color.error` (red) = technical errors only. Never swap.
- The word "wrong", "incorrect", "mistake", or "failed" must not appear in any student-facing copy.
- No animations in calm mode. Every animated element needs a calm variant (no transition, no flash).
- No localStorage or sessionStorage references anywhere.
- No hardcoded hex values — every colour must map to an existing token or a new token flagged in TOKEN ADDITIONS.
- Question stem font-size minimum 20px (typography.fontSize.xl).
- `color.successLight` background for correct state — never a green flash in calm mode.
- `color.repairLight` background for wrong state — warm amber, not alarming.

---

## SECTION 3: Current tokens

```typescript
export const color = {
  primary:     '#1B5E9B',
  primaryDark: '#134478',
  repair:      '#B45309',
  repairLight: '#FEF3C7',
  success:     '#166534',
  successLight:'#DCFCE7',
  error:       '#B91C1C',
  errorLight:  '#FEE2E2',
  text:        '#111827',
  textMuted:   '#4B5563',
  border:      '#D1D5DB',
  surface:     '#FFFFFF',
  background:  '#F9FAFB',
  calm: {
    background: '#F5F0E8',
    primary:    '#2D5A3D',
    text:       '#1C1917',
  },
} as const

export const space = {
  1:'4px', 2:'8px', 3:'12px', 4:'16px',
  5:'20px', 6:'24px', 8:'32px', 10:'40px',
  12:'48px', 16:'64px',
} as const

export const typography = {
  fontFamily: { base:'system-ui, -apple-system, sans-serif', dyslexic:'"OpenDyslexic", sans-serif', mono:'ui-monospace, monospace' },
  fontSize: { sm:'14px', base:'16px', lg:'18px', xl:'20px', '2xl':'24px', '3xl':'30px' },
  fontWeight: { normal:'400', medium:'500', bold:'700' },
  lineHeight: { tight:'1.25', base:'1.5', loose:'1.75' },
} as const

export const touch = { minSize: '44px' } as const
```

---

## SECTION 4: What already exists

### src/components/practice/QuestionCard.tsx
```tsx
export function QuestionCard({ question, questionNumber, total, selectedAnswer, onAnswerChange, onSubmit, submitDisabled }) {
  return (
    <div style={{ background: color.surface, borderRadius: '12px', padding: space[6], boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      {/* Progress: "Question N of M" + dots row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:space[5] }}>
        <span style={{ fontSize:typography.fontSize.sm, color:color.textMuted }}>Question {questionNumber} of {total}</span>
        <div style={{ display:'flex', gap:space[1] }}>
          {/* 8px circles: filled green=done, primary=current, border=upcoming */}
        </div>
      </div>
      {/* Stem at fontSize.lg / lineHeight.loose */}
      {/* MC options OR NumericInput below stem */}
      {/* "Check answer" button: full-width, color.primary, minHeight 48px */}
    </div>
  )
}
```

### src/components/practice/MCOption.tsx
```tsx
// button role="radio" aria-checked, border 2px primary when selected else border
// 20px radio circle left, option HTML right
// background #EFF6FF when selected (hardcoded — flag this)
// transition border-color 0.1s, background 0.1s
```

### src/components/practice/CorrectBand.tsx
```tsx
// role="status" aria-live="polite"
// background color.successLight, border 2px color.success, borderRadius 12px, padding space[5]
// Competence message (never score/badge): "Correct — on to the next one." etc.
// "Next question →" / "See results" button: color.success bg, minHeight 40px (BELOW touch target — flag)
```

### src/components/practice/RepairBand.tsx
```tsx
// role="status" aria-live="polite" aria-label="Let's work through this"
// background color.repairLight, border 2px color.repair, borderRadius 12px, padding space[5]
// Two modes: CE matched (framing line + contextual hint) | no CE (hint[0] inline)
// Buttons: "Try again" (secondary, border color.repair) + "Show next hint" | "Show worked solution"
// Primary button bg: color.repair. Secondary: transparent + color.repair border.
// minHeight 40px on buttons (BELOW touch target — flag)
```

### src/components/practice/HintCard.tsx
```tsx
// role="note" aria-label="Hint N"
// background #FFF7ED (hardcoded — flag), border 1px + borderLeft 4px color.repair
// "Hint N" label in sm/bold/color.repair, then hint HTML
```

### src/components/practice/WorkedSolution.tsx
```tsx
// role="note" aria-label="Worked solution"
// background #F0FDF4 (hardcoded — flag), border 1px + borderLeft 4px color.success
// Steps revealed one at a time via "Next step →" button
// "WORKED SOLUTION" heading: sm/bold/success/uppercase/letterSpacing
// "Next question →" final button: color.primary bg, minHeight 44px
```

### src/components/practice/NumericInput.tsx
```tsx
// flex row: input + optional units label
// input: border 2px color.border, fontSize xl, minHeight touch.minSize
// placeholder "Your answer"
```

**Known issues to fix:**
- `#EFF6FF` in MCOption (selected bg) — not in tokens
- `#FFF7ED` in HintCard — not in tokens
- `#F0FDF4` in WorkedSolution — not in tokens
- CorrectBand "Next question" button: minHeight 40px, should be 44px
- RepairBand action buttons: minHeight 40px, should be 44px

---

## SECTION 5: Existing spec / wireframe

From design/PHASE1-DESIGN-SPEC.md (relevant extract):

**Question display (375px):**
```
┌─────────────────────────────────────────────┐
│  [Topic chip: Year 7 · Number]    [Calm ☽]  │  sticky header
│  Question 3 of 5  ●●●○○                     │  progress dots
├─────────────────────────────────────────────┤
│  QUESTION STEM (KaTeX, 20px)                │
│  [A] option                                 │  MCOption, h≥44px
│  [B] option                                 │
│  [C] option                                 │
│  [D] option                                 │
│  [Check answer ▶]                           │  full-width primary
└─────────────────────────────────────────────┘
```

**Repair state:**
```
│  ◐  Let's look at this differently         │  amber-700, repairLight bg
│  [question repeated]                        │
│  [wrong option: amber border]               │
│  💡 Hint 1 of 3: ...                       │
│  [Try again]    [Next hint →]               │
```

---

## SECTION 6: Strand colours reference

| Strand | Colour |
|---|---|
| Number | #2563EB |
| Algebra | #7C3AED |
| Measurement | #059669 |
| Space | #D97706 |
| Statistics | #DC2626 |
| Probability | #0891B2 |

---

## SECTION 7: Required output format

Respond using ONLY this structure. No preamble, no summary, no explanation outside these sections.

### TOKEN ADDITIONS
If new tokens are needed, list them as TypeScript additions to the color object in tokens.ts.
If none needed, write: none

### COMPONENT SPEC: QuestionCard
#### Layout
#### States
#### Token map
#### Accessibility
#### Calm mode

### COMPONENT SPEC: MCOption
#### Layout
#### States
#### Token map
#### Accessibility
#### Calm mode

### COMPONENT SPEC: CorrectBand
#### Layout
#### States
#### Token map
#### Accessibility
#### Calm mode

### COMPONENT SPEC: RepairBand
#### Layout
#### States
#### Token map
#### Accessibility
#### Calm mode

### COMPONENT SPEC: HintCard
#### Layout
#### States
#### Token map
#### Accessibility
#### Calm mode

### COMPONENT SPEC: WorkedSolution
#### Layout
#### States
#### Token map
#### Accessibility
#### Calm mode

### SCREEN SPEC: PracticeSession
#### Layout
#### State inventory
#### Copy decisions

### OPEN QUESTIONS
