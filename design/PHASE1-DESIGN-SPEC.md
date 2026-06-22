# Phase 1 Design Specification — Australian Maths App
Cross-reference: `src/theme/tokens.ts` (colour/spacing source of truth), `docs/spec.md`,
CONTRACT.md §4 (no red for wrong answers — amber only).

This document is the handoff brief for whoever builds Phase 1 screens — whether that is
a designer working in Figma, or Claude Code implementing directly in React/Tailwind.

---

## Design principles (non-negotiable)

1. **Amber for wrong, red for broken.** `color.repair` (#B45309 / Tailwind `amber-700`) is the
   only colour used for "incorrect answer" feedback states. `color.error` (#B91C1C) is
   RESERVED for technical errors (network failure, server error) only. This is a CONTRACT.md
   invariant.

2. **No shame on incorrect.** Wrong answer → calm amber state, hint prompt. Never a failure
   screen, never a "✗" icon, never a red flash. Use "Let's look at this differently" language.

3. **Touch-first.** All interactive targets ≥ 44 × 44 px. All inputs large enough to tap
   without zoom on a 375px viewport (iPhone SE baseline).

4. **WCAG 2.1 AA minimum.** 4.5:1 contrast for normal text, 3:1 for large text / UI
   components. Run axe on every screen before merge.

5. **KaTeX everywhere.** All mathematical expressions use KaTeX-rendered HTML, never images.
   Every KaTeX block must have an aria-label with the expression in words.

6. **Calm mode parity.** Every screen has a calm mode variant: muted palette
   (desaturated background), no animations, reduced visual density. Calm mode is toggled
   globally by student or parent.

---

## Design tokens reference (`src/theme/tokens.ts`)

```
colour.brand.primary     #0369A1  (sky-700)    Primary CTA, active states
colour.brand.secondary   #0284C7  (sky-600)    Hover states
colour.repair            #B45309  (amber-700)  Wrong answer — ONLY use
colour.repair.bg         #FEF3C7  (amber-100)  Wrong answer background
colour.repair.border     #F59E0B  (amber-400)  Wrong answer border
colour.error             #B91C1C  (red-700)    Technical errors ONLY
colour.correct           #15803D  (green-700)  Correct answer
colour.correct.bg        #DCFCE7  (green-100)  Correct answer background
colour.neutral.900       #111827              Primary text
colour.neutral.600       #4B5563              Secondary text
colour.neutral.200       #E5E7EB              Dividers, borders
colour.neutral.50        #F9FAFB              Page background
colour.calm.bg           #F5F0EB              Calm mode background (warm white)
colour.calm.text         #374151              Calm mode primary text (slightly muted)

typography.family.body   'Inter', sans-serif
typography.family.math   KaTeX font stack
typography.family.dyslexia 'OpenDyslexic', sans-serif  (toggled by student)
typography.size.base     16px
typography.size.lg       18px
typography.size.xl       22px
typography.size.stem     20px   (question text — large for readability)

spacing.touch-target     44px   (min height/width for all interactive elements)
spacing.card-padding     20px
spacing.section          32px
border-radius.card       12px
border-radius.button     8px
```

---

## Phase 1 screens (required for beta)

### SCREEN 1: Student practice — question display

**Route:** `/practice` (student JWT in memory)

**Layout:** Single-column, max-width 640px centred, vertically scrollable.

```
┌─────────────────────────────────────────────┐
│  [Topic chip: Year 7 · Number]    [Calm ☽]  │  header (sticky)
│  Question 3 of 5  ●●●○○                     │  progress dots
├─────────────────────────────────────────────┤
│                                             │
│  QUESTION STEM (KaTeX)                      │  font-size: 20px, line-height: 1.5
│  e.g. "What is √144 ?"                      │  padding: 20px
│                                             │
│  [A]  10                                    │  MC option button
│  [B]  11                                    │  height: 52px, radius: 8px
│  [C]  12                                    │  border: 1.5px neutral-200
│  [D]  14                                    │
│                                             │
│          [Check answer ▶]                   │  brand.primary button, full-width
│                                             │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│  💡 Hint available   [Get a hint]           │  shown after first wrong answer
└─────────────────────────────────────────────┘
```

**Accessibility notes:**
- Each MC option is a `<button>`, not a `<radio>` — a11y group handled by aria-checked
- Progress dots: `<ol aria-label="Question 3 of 5">` with each dot as `<li>`
- "Check answer" is `<button type="submit">`, disabled until an option is selected
- Calm toggle: `aria-pressed` attribute

---

### SCREEN 2: Numeric answer entry (variant of Screen 1)

Used when `answer.type === 'numeric'`.

```
┌─────────────────────────────────────────────┐
│  [Topic chip]                    [Calm ☽]   │
│  Question 2 of 5  ●○○○○                     │
├─────────────────────────────────────────────┤
│                                             │
│  "A square garden has an area of 225 m².    │
│   What is the side length in metres?"       │
│                                             │
│  ┌──────────────────────────────────────┐   │  
│  │  ___________________________   m     │   │  input field, height 52px
│  └──────────────────────────────────────┘   │  numeric keyboard type="number"
│                                             │
│          [Check answer ▶]                   │
└─────────────────────────────────────────────┘
```

**Notes:**
- `input type="number"` with `inputmode="decimal"` for mobile
- Unit label (`m`, `cm²`, etc.) displayed inline to the right of the input, not inside it
- Input font-size ≥ 18px to prevent iOS auto-zoom
- For fraction answers: two inputs side by side (numerator / denominator) with a dividing
  line — NOT a text field expecting "1/2". Rationale: avoids "slash key is hard to find on
  mobile" problem and makes fraction structure explicit pedagogically.

```
  ┌──────┐        
  │  1   │   ─── (fraction bar)
  ├──────┤
  │  2   │
  └──────┘
```

---

### SCREEN 3: Correct answer state

Transition in: green background flash (50ms), then settles to SCREEN 3 layout.
(Skip the flash entirely in calm mode.)

```
┌─────────────────────────────────────────────┐
│  [Topic chip]                    [Calm ☽]   │
│  Question 3 of 5  ●●●○○                     │
├─────────────────────────────────────────────┤
│                                             │
│  ✓  Great work                              │  correct.bg background band
│     12 is correct.                          │  green-700 text
│                                             │
│  Brief explanation (from worked_solution    │  neutral-600 text
│  first paragraph only — not the full        │
│  worked solution)                           │
│                                             │
│          [Next question ▶]                  │  brand.primary, full-width
└─────────────────────────────────────────────┘
```

**Notes:**
- The full `worked_solution` is NOT shown on correct — only a one-sentence confirmation
- Focus moves to the explanation text on render (aria-live region)

---

### SCREEN 4: Repair state — wrong answer (amber, not red)

This is the critical state. Wrong answer → never a failure screen.

```
┌─────────────────────────────────────────────┐
│  [Topic chip]                    [Calm ☽]   │
│  Question 3 of 5  ●●●○○                     │
├─────────────────────────────────────────────┤
│                                             │  repair.bg (#FEF3C7) background
│  ◐  Let's look at this differently         │  amber-700 text (NEVER red)
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  QUESTION STEM (repeated)                   │  same 20px font
│                                             │
│  [A]  10                                    │  previous wrong answer: amber border
│  [B]  11                                    │
│  [C]  12 (selected, wrong)                  │  ← amber border on wrong selection
│  [D]  14                                    │
│                                             │
│  💡 Hint 1 of 3:                           │  hint card — neutral-50 bg, neutral-200 border
│  "A square root asks: which number          │
│   multiplied by itself gives 144?"          │
│                                             │
│  [Try again]          [Next hint →]         │  secondary CTA     primary CTA
│                                             │
└─────────────────────────────────────────────┘
```

**Key design decisions:**
- Background is amber-100 (#FEF3C7) — warm, not alarming
- The word "wrong" never appears
- "Let's look at this differently" is the standard header (copy can be tuned)
- Hint counter "Hint 1 of 3" — student always knows where they are
- After Hint 3 is shown: "Show worked solution" button appears (secondary, small)
- The `◐` icon: a half-filled circle — suggests partial progress, not failure

**Calm mode variant:** Same layout, muted amber (amber-50 background, amber-600 text),
no animation on transition.

---

### SCREEN 5: Worked solution (unlocked after Hint 3 or explicit request)

```
┌─────────────────────────────────────────────┐
│  [Topic chip]                    [Calm ☽]   │
│  Question 3 of 5  ●●●○○                     │
├─────────────────────────────────────────────┤
│                                             │
│  Worked solution                            │  neutral-900 heading
│  ─────────────────────────────────────────  │
│                                             │
│  QUESTION STEM                              │
│                                             │
│  Step 1: We need n where n × n = 144.       │  KaTeX-rendered steps
│  Step 2: Testing: 10 × 10 = 100 (small)    │
│  Step 3: 12 × 12 = 144 ✓                   │
│                                             │
│  Therefore √144 = 12                        │  answer highlighted (brand.primary bg)
│                                             │
│          [I understand — next →]            │  brand.primary, full-width
│          [Try a similar question]           │  text link (retry_variant flow)
└─────────────────────────────────────────────┘
```

---

### SCREEN 6: Teacher dashboard

**Route:** `/teacher/dashboard` (teacher Supabase JWT)

```
┌─────────────────────────────────────────────────────────────────┐
│  Australian Maths App                           [+ New class]   │  nav header
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Year 8B Maths           [View ▶]   [Share code: MTH8B]       │  class card
│  ████████░░  8/12 students active   Due: 30 Jun               │
│  Current: AC9M7N07 — Fraction operations                       │
│                                                                 │
│  Year 7A Maths           [View ▶]   [Share code: MTH7A]       │  class card
│  ██░░░░░░░░  3/18 students started  Due: 2 Jul                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [+ Create class]                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Class detail screen (tapped from dashboard):**

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Year 8B Maths         AC9M7N07 — Fractions    [Assign ▶]   │
├──────────────────────┬──────────────────────────────────────────┤
│  Student             │  Accuracy    Complete    Last active     │
├──────────────────────┼──────────────────────────────────────────┤
│  Alex M.             │  ████ 80%   ✓ Done      Today          │
│  Sam K.              │  ██░░ 40%   In progress  Yesterday      │
│  Riley P.            │  ─── n/a   Not started   —             │
│  ...                 │                                         │
└──────────────────────┴──────────────────────────────────────────┘
```

**Accessibility:**
- Table uses `<table>` with `<th scope="col">` and `<th scope="row">`
- Progress bars: `role="progressbar" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100" aria-label="Alex M. — 80% accuracy"`
- Colour is NOT the only indicator of completion — text "Done" / "In progress" also present

---

### SCREEN 7: Parent "tonight's 3 questions" view

**Route:** `/parent/tonight` (parent Supabase JWT)

```
┌─────────────────────────────────────────────┐
│  ← [Child's display name]'s practice        │
├─────────────────────────────────────────────┤
│                                             │
│  Tonight's 3 questions                      │  heading
│  Based on recent gaps in their practice     │  neutral-600 caption
│                                             │
│  ┌─────────────────────────────────────┐    │  question preview card
│  │  Year 7 · Number                   │    │
│  │  "What is √144?"                   │    │
│  │  They got this type wrong 3×        │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Year 7 · Fractions                │    │
│  │  "What is 1/4 + 1/4?"             │    │
│  │  Not attempted yet                  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Year 7 · Number                   │    │
│  │  "Which of these is a perfect..."  │    │
│  │  They got this type wrong 2×        │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [Share session with child]                 │  → triggers student JWT issue
│                                             │
│  ─────────────────────────────────────────  │
│  This week: 12 questions · 75% accuracy     │  weekly summary strip
└─────────────────────────────────────────────┘
```

---

## Responsive breakpoints

| Breakpoint | Target | Notes |
|---|---|---|
| 375px | iPhone SE, small Android | Baseline — design for this first |
| 390px | iPhone 15 | Most common iOS |
| 768px | iPad / tablet | Two-column layout for teacher dashboard |
| 1280px | Desktop | Teacher dashboard full table; student practice max-width 640px centred |

Student practice is NEVER a two-column layout at any breakpoint. Single-column, max 640px.

---

## Component list (Phase 1)

Components to build (in implementation order, simplest first):

1. `<TopicChip>` — year + strand label
2. `<ProgressDots>` — n dots, filled/empty
3. `<MathStem>` — KaTeX-rendered question text
4. `<MCOption>` — multiple choice button (default / selected / correct / repair states)
5. `<NumericInput>` — number entry with optional units label
6. `<FractionInput>` — two-field fraction entry (numerator / denominator)
7. `<CheckButton>` — primary CTA, disabled until answer selected
8. `<CorrectBand>` — green confirmation strip
9. `<RepairBand>` — amber "let's look at this" strip
10. `<HintCard>` — hint text with hint counter
11. `<WorkedSolution>` — KaTeX step-by-step display
12. `<ClassCard>` — teacher dashboard class summary
13. `<StudentRow>` — teacher class detail table row
14. `<QuestionPreviewCard>` — parent tonight view card
15. `<CalmToggle>` — moon icon toggle, persists in memory (no localStorage)

---

## Accessibility requirements (build-time checklist, run before every PR)

- [ ] All interactive elements reachable via Tab in logical order
- [ ] All interactive elements have visible focus indicator (2px brand.primary outline)
- [ ] No colour-only information (all repair states also have text label)
- [ ] All images (if any) have alt text; all KaTeX blocks have aria-label
- [ ] Touch targets ≥ 44×44px — verify with browser inspector
- [ ] No auto-playing animations except the 50ms correct flash (disabled in calm mode)
- [ ] axe DevTools: zero critical or serious violations per screen
- [ ] Test with VoiceOver (macOS/iOS) and TalkBack (Android) — manual
- [ ] Heading hierarchy: one `<h1>` per screen, logical `<h2>`/`<h3>` nesting

---

## Open UX questions (must decide before building affected screens)

1. **Fraction input:** Two-field (numerator/denominator) is recommended above. Confirm before
   building `<FractionInput>`. Alternative: single text field accepting "1/2".
2. **Calm mode persistence:** Calm mode toggle is in-memory only (no localStorage per
   CONTRACT.md). On refresh, calm mode resets to off. Is this acceptable for V1, or should
   calm mode be stored in the student's server-side profile? (Schema change required.)
3. **"Let's look at this differently" copy:** The repair header text. Final copy should be
   reviewed by a teacher before lock-in.
4. **"Tonight's 3 questions":** Questions are previewed (stem visible). Should the parent
   be able to see the worked solution? Recommendation: no — preserve the discovery for the
   student.
