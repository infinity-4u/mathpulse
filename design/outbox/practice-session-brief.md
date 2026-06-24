# AusMaths Design Brief — Practice Session
Generated for Claude Design. Follow the response format at the end exactly.

---

## SECTION 1: The ask (read this first)

Design the practice session screen for an Australian Year 7–10 maths app — the screen students spend the most time on. It has **four visual states** that must be designed together as one coherent experience: (1) question display, (2) correct answer, (3) wrong answer / repair, (4) worked solution revealed step by step. The existing components are functional and structurally sound but visually rough — inline styles, no focus rings, inconsistent spacing hierarchy, and the feedback states feel generic. The ask is a **visual design pass** that lifts hierarchy, emotional clarity, and calm confidence while staying inside our token system. Describe what to change from the current implementation, not a full rewrite.

The **one question** for this pass: *How should the four states feel as one consistent, calm, confidence-building experience for a 12-year-old who is here to learn maths — not to be judged?*

---

## SECTION 2: Non-negotiable constraints

- Single-column layout, max-width 640px, centred. Never two-column at any breakpoint.
- `system-ui` only — no CDN fonts. KaTeX renders all maths; never images for equations.
- Touch targets ≥ 44px on every interactive element (currently enforced via `touch.minSize`).
- WCAG 2.1 AA: 4.5:1 for body text, 3:1 for large text and UI components.
- `color.repair` (amber `#B45309`) = wrong answer states **only**. `color.error` (red `#B91C1C`) = technical errors **only**. Never swap.
- Words "wrong", "incorrect", "mistake", "failed" must not appear in any student-facing copy.
- Misconception-repair copy pattern: (1) name the apparent strategy without shame, (2) explain why it doesn't fit, (3) give the repair, (4) offer retry. Not "wrong". Not "that's not right."
- No animations in calm mode. Every animated element needs a calm variant (instant state change).
- No hardcoded hex values — every colour must map to an existing token in Section 3, or be flagged as a new token in TOKEN ADDITIONS.
- Question stem font-size minimum 20px (`typography.fontSize.xl`).
- `color.successLight` background for correct state — never a green flash in calm mode.
- `color.repairLight` background for wrong state — warm amber, not alarming.
- Progress dots at top of QuestionCard are **decorative** — not interactive, not touch targets.
- `color.primaryLight` (`#EFF6FF`) = selected option background only. Do not repurpose it.

---

## SECTION 3: Current tokens

```typescript
/**
 * Design tokens — single source of truth for colours, spacing, and typography.
 */

export const color = {
  // Brand
  primary:      '#1B5E9B', // blue — 4.7:1 on white ✓
  primaryDark:  '#134478', // darker for hover states — 7.1:1 on white ✓
  primaryLight: '#EFF6FF', // light blue bg for selected state and info banners

  // Feedback — repair states (wrong answers, hints)
  repair:      '#B45309', // amber — used for incorrect / hint states. NEVER use error for wrong answers.
  repairLight: '#FEF3C7', // amber background for repair cards

  // Feedback — correct
  success:      '#166534', // green — 5.6:1 on white ✓
  successLight: '#DCFCE7',

  // Technical errors only (network failures, timeouts — NOT wrong answers)
  error:      '#B91C1C', // red — reserved for technical errors per spec.md
  errorLight: '#FEE2E2',

  // Neutral
  text:       '#111827', // 19:1 on white ✓
  textMuted:  '#4B5563', // 5.9:1 on white ✓
  border:     '#D1D5DB',
  surface:    '#FFFFFF',
  background: '#F9FAFB',

  // Calm mode overrides (toggled by student)
  calm: {
    background: '#F5F0E8', // warm off-white, less stimulating
    primary:    '#2D5A3D', // muted green
    text:       '#1C1917',
  },
} as const

export const space = {
  1:  '4px',  2:  '8px',   3:  '12px',  4:  '16px',
  5:  '20px', 6:  '24px',  8:  '32px',  10: '40px',
  12: '48px', 16: '64px',
} as const

export const typography = {
  fontFamily: {
    base:     'system-ui, -apple-system, sans-serif',
    dyslexic: '"OpenDyslexic", "Lexie Readable", sans-serif',
    mono:     'ui-monospace, "Cascadia Code", monospace',
  },
  fontSize: {
    sm:    '14px',
    base:  '16px',
    lg:    '18px',
    xl:    '20px',
    '2xl': '24px',
    '3xl': '30px',
  },
  fontWeight: { normal: '400', medium: '500', bold: '700' },
  lineHeight: { tight: '1.25', base: '1.5', loose: '1.75' },
} as const

export const touch = { minSize: '44px' } as const

export const shadows = { card: '0 1px 3px rgba(0,0,0,0.1)' } as const
```

---

## SECTION 4: What already exists

### src/components/practice/QuestionCard.tsx
```tsx
/**
 * Renders a single question — MC or numeric.
 * All math is pre-rendered HTML (from server-side KaTeX in content.ts).
 */
export function QuestionCard({
  question, questionNumber, total, selectedAnswer, onAnswerChange, onSubmit, submitDisabled,
}: QuestionCardProps) {
  return (
    <div style={{ background: color.surface, borderRadius: '12px', padding: space[6], boxShadow: shadows.card }}>
      {/* Progress counter + dots row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: space[5] }}>
        <span style={{ fontSize: typography.fontSize.sm, color: color.textMuted }}>
          Question {questionNumber} of {total}
        </span>
        <div style={{ display:'flex', gap: space[1] }}>
          {Array.from({ length: total }, (_, i) => (
            <div key={i} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: i < questionNumber - 1 ? color.success
                        : i === questionNumber - 1 ? color.primary
                        : color.border,
            }} />
          ))}
        </div>
      </div>
      {/* Stem — KaTeX, fontSize.lg, lineHeight.loose */}
      <div style={{ fontSize: typography.fontSize.lg, lineHeight: typography.lineHeight.loose,
                    color: color.text, marginBottom: space[6] }}>
        <MathText html={question.stemHtml} block />
      </div>
      {/* MC options OR NumericInput */}
      {question.type === 'multiple_choice' && question.options ? (
        <div style={{ display:'flex', flexDirection:'column', gap: space[3], marginBottom: space[6] }}>
          {question.options.map((optHtml, i) => (
            <MCOption key={i} optionHtml={optHtml} isSelected={selectedAnswer === question.rawOptions?.[i]}
                      rawValue={question.rawOptions?.[i] ?? optHtml} onSelect={onAnswerChange} />
          ))}
        </div>
      ) : (
        <NumericInput value={selectedAnswer} onChange={onAnswerChange}
                      units={question.answer.type === 'numeric' ? question.answer.units : undefined}
                      onEnterSubmit={submitDisabled ? undefined : onSubmit} />
      )}
      {/* "Check answer" — full-width primary, 48px, disabled when no answer */}
      <button onClick={onSubmit} disabled={submitDisabled || selectedAnswer.trim() === ''}
              style={{
                width: '100%', background: color.primary, color: color.surface,
                border: 'none', borderRadius: '8px', padding: space[4],
                fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold,
                cursor: submitDisabled || selectedAnswer.trim() === '' ? 'not-allowed' : 'pointer',
                opacity: submitDisabled || selectedAnswer.trim() === '' ? 0.5 : 1,
                minHeight: '48px',
              }}>
        Check answer
      </button>
    </div>
  )
}
```

**Known issue**: stem font-size is `typography.fontSize.lg` (18px) — must be at least `xl` (20px).
**Known issue**: progress dots are 8px circles — purely decorative but visually isolated from stem.
**Known issue**: No keyboard focus ring specified on MCOption or Check answer button.

### src/components/practice/MCOption.tsx
```tsx
export function MCOption({ optionHtml, rawValue, isSelected, onSelect }: MCOptionProps) {
  return (
    <button type="button" role="radio" aria-checked={isSelected}
            onClick={() => onSelect(rawValue)}
            style={{
              display:'flex', alignItems:'center', gap: space[4],
              width:'100%', padding:`${space[3]} ${space[4]}`,
              background: isSelected ? color.primaryLight : color.surface,
              border: `2px solid ${isSelected ? color.primary : color.border}`,
              borderRadius: '8px', cursor:'pointer', textAlign:'left',
              minHeight: touch.minSize, fontSize: typography.fontSize.base, color: color.text,
              transition: 'border-color 0.1s, background 0.1s',
            }}>
      {/* 20px radio circle left */}
      <span style={{ flexShrink:0, width:'20px', height:'20px', borderRadius:'50%',
                     border:`2px solid ${isSelected ? color.primary : color.border}`,
                     background: isSelected ? color.primary : 'transparent',
                     display:'flex', alignItems:'center', justifyContent:'center' }}>
        {isSelected && <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: color.surface, display:'block' }} />}
      </span>
      <MathText html={optionHtml} />
    </button>
  )
}
```

**Known issue**: No `:focus-visible` ring on the button (currently relies on browser default outline only).
**Known issue**: No `correct` or `incorrect` visual state after submission — QuestionCard locks the option but MCOption itself has no disabled/revealed state.

### src/components/practice/CorrectBand.tsx
```tsx
export function CorrectBand({ onNext, isLast, consecutiveCorrect, usedHints }: CorrectBandProps) {
  const message = competenceMessage(consecutiveCorrect, usedHints)
  return (
    <div role="status" aria-live="polite" aria-label="Correct"
         style={{
           background: color.successLight, border:`2px solid ${color.success}`,
           borderRadius:'12px', padding: space[5], marginTop: space[4],
           display:'flex', alignItems:'center', justifyContent:'space-between', gap: space[4],
         }}>
      <div>
        <p style={{ fontWeight: typography.fontWeight.medium, color: color.success, margin:0, fontSize: typography.fontSize.base }}>
          {message}
        </p>
        {isLast && <p style={{ color: color.textMuted, margin:`${space[1]} 0 0`, fontSize: typography.fontSize.sm }}>
          That's the last question in this set.
        </p>}
      </div>
      <button onClick={onNext} autoFocus
              style={{ background: color.success, color: color.surface, border:'none',
                       borderRadius:'6px', padding:`${space[2]} ${space[5]}`,
                       fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium,
                       cursor:'pointer', whiteSpace:'nowrap', minHeight: touch.minSize }}>
        {isLast ? 'See results' : 'Next question →'}
      </button>
    </div>
  )
}
// Competence messages (no score, no badge):
// default → "Correct — on to the next one."
// 2–3 consec → "You got this one right first try."
// 4+ consec → "Your last N answers have all been correct."
// used hints → "You answered that one correctly after seeing a hint — that counts."
```

**Known issue**: Flex row puts button right-aligned; on narrow viewport (375px) message text can be very short, creating uneven distribution. No icon alongside message to reinforce success without colour alone.

### src/components/practice/RepairBand.tsx
```tsx
export function RepairBand({ matchedError, initialHintHtml, onRetry, hintsExhausted,
                             onRequestHint, onRequestWorkedSolution, workedSolutionShown,
                             attemptCount, onNext }: RepairBandProps) {
  const workedSolutionReady = hintsExhausted || attemptCount >= 3
  return (
    <div role="status" aria-live="polite" aria-label="Let's work through this"
         style={{ background: color.repairLight, border:`2px solid ${color.repair}`,
                  borderRadius:'12px', padding: space[5], marginTop: space[4] }}>
      {/* Mode 1: CE matched — framing line + contextual hint */}
      {matchedError ? (
        <div style={{ marginBottom: space[4] }}>
          <p style={{ fontWeight: typography.fontWeight.medium, color: color.repair,
                      marginBottom: space[2], fontSize: typography.fontSize.base }}>
            {framingLine(matchedError)}
          </p>
          <MathText html={matchedError.contextualHintHtml} block />
        </div>
      ) : initialHintHtml ? (
        /* Mode 2: no CE match — show default hint inline */
        <MathText html={initialHintHtml} block />
      ) : (
        /* Mode 3: no hint at all */
        <p style={{ fontWeight: typography.fontWeight.medium, color: color.repair, marginBottom: space[4], fontSize: typography.fontSize.base }}>
          Have another look — let's work through this together.
        </p>
      )}
      {/* Buttons — hidden once worked solution shown */}
      {!workedSolutionShown && (
        <div style={{ display:'flex', gap: space[3], flexWrap:'wrap' }}>
          <button onClick={onRetry} style={secondaryBtn}>Try again</button>
          {!workedSolutionReady && (
            <button onClick={onRequestHint} disabled={hintsExhausted} style={secondaryBtn}>
              Show next hint
            </button>
          )}
          {workedSolutionReady && (
            <button onClick={onRequestWorkedSolution} style={primaryBtn}>Show worked solution</button>
          )}
        </div>
      )}
      {workedSolutionShown && onNext && (
        <button onClick={onNext} style={primaryBtn}>Next question →</button>
      )}
    </div>
  )
}
// Framing lines (never say "wrong"):
// conceptual → "It looks like there's a concept here worth sitting with — this kind of confusion is very common."
// procedural → "It looks like a step in the process caught you out — let's see what to focus on."
// careless → "Looks like a small slip — these are easy to catch once you know what to look for."
// default → "Have another look — let's work through this together."

// primaryBtn: bg color.repair, text color.surface, minHeight touch.minSize
// secondaryBtn: bg transparent, border+text color.repair, minHeight touch.minSize
```

**Known issue**: No visual distinction between "Try again" and "Show worked solution" beyond primary/secondary styling. The primary button (amber fill) is the heavy action, but on narrow screens the flex row can wrap awkwardly.
**Known issue**: No icon on the framing line — colour is the only cue for the repair state header text.

### src/components/practice/HintCard.tsx
```tsx
export function HintCard({ hintHtml, hintNumber }: HintCardProps) {
  return (
    <div role="note" aria-label={`Hint ${hintNumber}`}
         style={{ background: color.repairLight, border:`1px solid ${color.repair}`,
                  borderLeft:`4px solid ${color.repair}`, borderRadius:'6px',
                  padding:`${space[3]} ${space[4]}`, marginTop: space[3] }}>
      <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium,
                     color: color.repair, display:'block', marginBottom: space[2] }}>
        Hint {hintNumber}
      </span>
      <MathText html={hintHtml} block />
    </div>
  )
}
```

### src/components/practice/WorkedSolution.tsx
```tsx
export function WorkedSolution({ solutionHtml, onNext }: WorkedSolutionProps) {
  const steps = splitSteps(solutionHtml)  // split on double newline
  const [visibleCount, setVisibleCount] = useState(1)
  const allVisible = visibleCount >= steps.length
  return (
    <div role="note" aria-label="Worked solution"
         style={{ background: color.successLight, border:`1px solid ${color.success}`,
                  borderLeft:`4px solid ${color.success}`, borderRadius:'6px',
                  padding:`${space[4]} ${space[5]}`, marginTop: space[4] }}>
      <h3 style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold,
                   color: color.success, marginBottom: space[3],
                   textTransform:'uppercase', letterSpacing:'0.05em' }}>
        Worked solution
      </h3>
      {/* Steps revealed one at a time, separated by border */}
      {steps.slice(0, visibleCount).map((step, i) => (
        <div key={i} style={{ marginBottom: i < visibleCount-1 ? space[3] : 0,
                              borderBottom: i < visibleCount-1 ? `1px solid ${color.border}` : 'none' }}>
          <MathText html={step} block />
        </div>
      ))}
      {/* "Next step →" — secondary, green border, minHeight 44px */}
      {!allVisible && (
        <button onClick={() => setVisibleCount(c => c+1)}
                aria-label={`Show step ${visibleCount+1} of ${steps.length}`}
                style={{ marginTop: space[4], background:'transparent', color: color.success,
                         border:`1px solid ${color.success}`, borderRadius:'6px',
                         padding:`${space[2]} ${space[5]}`, fontSize: typography.fontSize.base,
                         fontWeight: typography.fontWeight.medium, cursor:'pointer',
                         minHeight: touch.minSize }}>
          Next step →
        </button>
      )}
      {/* "Next question →" — primary, 44px, shown when all steps visible */}
      {allVisible && onNext && (
        <button onClick={onNext}
                style={{ marginTop: space[5], background: color.primary, color: color.surface,
                         border:'none', borderRadius:'6px', padding:`${space[3]} ${space[6]}`,
                         fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium,
                         cursor:'pointer', minHeight:'44px' }}>
          Next question →
        </button>
      )}
    </div>
  )
}
```

---

## SECTION 5: Existing spec / wireframe

From design/outbox (earlier pass — for reference only, superseded by this brief):

**Question display (375px):**
```
┌─────────────────────────────────────────────┐
│  Question 3 of 5        ●●●○○               │  sm/muted | 8px dots
├─────────────────────────────────────────────┤
│  QUESTION STEM (KaTeX, 18px → needs 20px)   │  fontSize.lg → fix to xl
│                                             │
│  [○] option A (MCOption, h≥44px)            │
│  [●] option B (selected, primaryLight bg)   │
│  [○] option C                               │
│  [○] option D                               │
│  [Check answer ▶]          (full-width 48px)│
└─────────────────────────────────────────────┘
```

**Correct state:**
```
│  ┌───────────────────────────────────────┐  │
│  │ ✓ You got this one right first try.   │  │  successLight bg, 2px success border
│  │                      [Next question→] │  │  button: success bg, 44px
│  └───────────────────────────────────────┘  │
```

**Repair state:**
```
│  ┌───────────────────────────────────────┐  │
│  │ It looks like a step in the process   │  │  repairLight bg, 2px repair border
│  │ caught you out — let's see what to    │  │  framing line: repair colour, medium
│  │ focus on.                             │  │
│  │ [contextual hint HTML / KaTeX]        │  │
│  │ [Try again]  [Show next hint →]       │  │  44px buttons
│  └───────────────────────────────────────┘  │
│  ╔═══════════════════════════════════════╗  │
│  ║  Hint 1                               ║  │  repairLight bg, left 4px amber bar
│  ║  [hint HTML / KaTeX]                  ║  │
│  ╚═══════════════════════════════════════╝  │
```

**Worked solution state:**
```
│  ┌───────────────────────────────────────┐  │
│  │  WORKED SOLUTION                      │  │  successLight bg, left 4px green bar
│  │  Step 1: ...                          │  │
│  │  ─────────────────────────────────    │  │
│  │  [Next step →]                        │  │  secondary, green border, 44px
│  └───────────────────────────────────────┘  │
```

---

## SECTION 6: Strand colours reference

| Strand | Hex | WCAG AA on white (text)? |
|---|---|---|
| Number | `#2563EB` | PASS (5.17:1) |
| Algebra | `#7C3AED` | PASS (5.70:1) |
| Measurement | `#059669` | FAIL (3.77:1) — darken for text use |
| Space | `#D97706` | FAIL (3.19:1) — darken for text use |
| Statistics | `#DC2626` | PASS (4.83:1) |
| Probability | `#0891B2` | FAIL (3.68:1) — darken for text use |

**Contrast audit findings** (from `scripts/check_contrast.py`):
- `color.border` (`#D1D5DB`) on white = 1.47:1 — fails 3:1 for functional UI borders (input outlines).
  Recommend: darken default border to ≈ `#9CA3AF` for input/card borders that carry meaning.
- Measurement, Space, Probability strand colours fail 4.5:1 as text on white.
  Recommend: darken each for text-on-white use; or restrict to large text / coloured background use only.

---

## SECTION 7: Required output format

Respond using ONLY this structure. No preamble, no summary, no explanation outside these sections.

### TOKEN ADDITIONS
If new tokens are needed (e.g. darker strand colours for text, a darker border, focus ring colour),
list them as TypeScript additions to the color or shadows object in tokens.ts.
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
[ASCII wireframe at 375px — show all 4 states: question / correct / repair / worked-solution]
#### State inventory
#### Copy decisions
[Lock in the final approved copy for: all feedback messages, button labels, framing lines.
Apply the misconception-repair pattern: (1) name the apparent strategy, (2) explain why it doesn't fit,
(3) give the repair, (4) offer retry. No "wrong", "incorrect", "mistake", "failed".]

### OPEN QUESTIONS
[Only items requiring a human decision before implementation. If none, write: none]
