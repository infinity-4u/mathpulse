# Designer Agent — Context Brief

Attach this file to every designer agent invocation, in full.

---

## Product

**AusMaths** — curriculum-aligned maths practice for Australian students in Years 7–10.
Aligned to the Victorian Curriculum v2.0 (VC2M). Distributed through teachers and parents.
V1 target: 10 teachers, web-first.

Not a consumer app. Not gamified. Not an AI tutor.
A focused, honest practice tool that respects student time and school trust.

---

## Users

| Role | Age / context | Primary device |
|---|---|---|
| Student | 12–15 years old, in school or at home | School Chromebook / iPad / iPhone SE |
| Teacher | Secondary school maths teacher | Desktop browser or iPad |
| Parent | Adult, occasional use | Mobile phone |

Design for students first. Teacher/parent flows can be more information-dense.

---

## Platform constraints (non-negotiable)

- **Web-first, no native app.** All screens must work at 375px viewport width minimum.
- **No third-party fonts via CDN.** Use system-ui for body text. KaTeX for maths.
- **No analytics SDKs or tracking pixels** anywhere in the UI.
- **No localStorage or sessionStorage.** All student state is in memory.
- **No animations in calm mode.** Calm mode is a global toggle; every animated element needs a calm variant.
- **WCAG 2.1 AA minimum** on every screen. 4.5:1 for body text, 3:1 for large text / UI.
- **Touch targets ≥ 44×44px** on all interactive elements.
- **KaTeX for all maths.** Never images for equations. Every KaTeX block needs an aria-label.

---

## Design principles (from PHASE1-DESIGN-SPEC.md — do not contradict)

1. **Amber for wrong, red for broken.**
   - `color.repair` (#B45309) = wrong answer states only
   - `color.error` (#B91C1C) = technical errors (network, server) only
   - Never use red to indicate an incorrect answer.

2. **No shame on incorrect.**
   - Wrong answer → calm amber state with a hint prompt
   - The word "wrong" never appears in student-facing copy
   - No red flashes, no ✗ icons, no failure screens
   - Standard repair header: "Let's look at this differently"

3. **Touch-first.** Design at 375px. Verify at 390px and 768px.

4. **Calm mode parity.** Every screen must have a calm variant:
   - Muted palette (desaturated, warm white background #F5F0E8)
   - No animations or transitions
   - Reduced visual density

5. **Single-column for students.** Practice screens: max-width 640px, centred, never two-column.
   Teacher dashboard: two-column at ≥768px.

6. **KaTeX everywhere.** All mathematical notation rendered via KaTeX. Font-size for question stems: 20px minimum.

---

## Design token reference (`src/theme/tokens.ts`)

### Colour
```
color.primary       #1B5E9B   blue — primary CTAs, active nav, links
color.primaryDark   #134478   hover states
color.repair        #B45309   wrong answer states (amber) — ONLY use
color.repairLight   #FEF3C7   wrong answer background
color.success       #166534   correct answer
color.successLight  #DCFCE7   correct answer background
color.error         #B91C1C   technical errors ONLY (network/server)
color.errorLight    #FEE2E2   technical error background
color.text          #111827   primary text
color.textMuted     #4B5563   secondary / caption text
color.border        #D1D5DB   dividers and borders
color.surface       #FFFFFF   card / input backgrounds
color.background    #F9FAFB   page background
color.calm.background  #F5F0E8   calm mode page bg
color.calm.primary     #2D5A3D   calm mode brand colour
color.calm.text        #1C1917   calm mode primary text
```

### Strand colours (for navigation and topic chips)
```
Number       #2563EB
Algebra      #7C3AED
Measurement  #059669
Space        #D97706
Statistics   #DC2626
Probability  #0891B2
```

### Spacing
```
space[1]  4px    space[2]  8px    space[3]  12px   space[4]  16px
space[5]  20px   space[6]  24px   space[8]  32px   space[10] 40px
space[12] 48px   space[16] 64px
touch.minSize  44px
```

### Typography
```
fontSize.sm    14px   fontSize.base  16px   fontSize.lg   18px
fontSize.xl    20px   fontSize['2xl'] 24px  fontSize['3xl'] 30px
fontWeight.normal 400  fontWeight.medium 500  fontWeight.bold 700
lineHeight.tight 1.25  lineHeight.base 1.5   lineHeight.loose 1.75
```

### Borders / radius
Use 6px–12px border-radius for cards, 8px for buttons, 4px for chips/badges.

---

## Existing components (already built — do not redesign from scratch)

- `NavBar` — sticky top bar, strand links, Teacher/Parent links
- `QuestionCard` — renders question stem (KaTeX)
- `CorrectBand` — green confirmation strip (built, needs visual polish)
- `RepairBand` — amber incorrect strip (built, needs visual polish)
- `HintCard` — progressive hint display (built)
- `WorkedSolution` — full step-by-step display (built)
- `SpacedRetrievalBand` — spaced retrieval prompt (built)

When designing improvements to existing components, reference the current implementation
and describe the delta, not a full rewrite.

---

## Screens inventory

See `design/agent/SCREEN-REGISTER.md` for all screens and their design status.
