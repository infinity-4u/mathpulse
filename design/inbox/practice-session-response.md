# Claude Design Response — Practice Session
Generated: 2026-06-25

---

### TOKEN ADDITIONS

```typescript
// tokens.ts — additions only

export const color = {
  // ...existing unchanged...

  // Functional border meeting 1.4.11 (3:1) for borders that CARRY MEANING
  // (text-input outline, unselected MCOption edge, card edge). Keep the
  // existing `border` (#D1D5DB) only for DECORATIVE dividers + progress dots.
  borderStrong: '#6B7280', // 4.6:1 on white ✓
  //            ^ audit recommended #9CA3AF, but that is ~2.6:1 and FAILS 3:1.
  //              Going one step darker to actually clear the bar.

  // Keyboard focus indicator. Applied as an OUTLINE (not box-shadow) so it
  // survives forced-colors / Windows High Contrast. 3:1+ against white,
  // successLight, repairLight and primaryLight.
  focusRing: '#1B5E9B', // = primary

  // Strand text colours that pass 4.5:1 on white (fixes Section 6 failures).
  // Used ONLY for the small strand eyebrow label on QuestionCard.
  strand: {
    number:      '#2563EB', // 5.17:1 ✓ unchanged
    algebra:     '#7C3AED', // 5.70:1 ✓ unchanged
    statistics:  '#DC2626', // 4.83:1 ✓ unchanged
    measurement: '#047857', // darkened from #059669 → 5.9:1 ✓
    space:       '#C2410C', // darkened from #D97706 → 4.8:1 ✓
    probability: '#0E7490', // darkened from #0891B2 → 5.0:1 ✓
  },
} as const

export const shadows = {
  card:   '0 1px 3px rgba(0,0,0,0.1)',        // unchanged
  raised: '0 4px 12px rgba(17,24,39,0.08)',   // active QuestionCard only — lifts the live card above feedback bands
} as const
```

---

### COMPONENT SPEC: QuestionCard

#### Layout
Single column, max-width 640px, centred; card padding: space[6], borderRadius:'12px', boxShadow: shadows.raised, border:1px solid color.border.

Header row → 3 stacked elements, left-aligned, not space-between: (1) strand eyebrow Number in fontSize.sm / fontWeight.medium / color.strand[strand] / letterSpacing:0.04em uppercase; (2) Question 3 of 5 in fontSize.sm / color.textMuted; (3) progress dots row directly under, gap: space[1]. This pulls the dots into the header instead of floating them opposite the counter.

marginBottom: space[6] from header to stem.

Stem: fontSize.xl (20px) — fixes the 18px known issue — lineHeight.loose, color.text, fontWeight.normal, marginBottom: space[6].

Answer zone: MC options column gap: space[3], or NumericInput. marginBottom: space[6].

Check button: full-width, minHeight:'48px', borderRadius:'8px', fontSize.base/fontWeight.bold.

#### States
- Default — Check disabled (opacity .5, cursor:not-allowed, aria-disabled), no answer selected.
- Answer-selected — Check enabled, background: color.primary; hover/active → color.primaryDark.
- Submitted-locked — inputs become non-interactive (options/input pointer-events:none, aria-disabled), Check hidden; the matching feedback band mounts below the answer zone (card stays on screen, never replaced).
- Progress dots: completed = color.success, current = color.primary, upcoming = color.border.

#### Token map
| Element | Property | Token |
|---|---|---|
| Card bg | background | surface |
| Card border | border | border |
| Elevation | box-shadow | shadows.raised |
| Eyebrow | color | strand[strand] |
| Counter | color | textMuted |
| Dots | background | success / primary / border |
| Stem | font-size | fontSize.xl |
| Check fill | background | primary → hover primaryDark |
| Check label | color | surface |
| Check radius | border-radius | 8px |
| Check pad | padding | space[4] |

#### Accessibility
- Header counter is the accessible progress source (Question 3 of 5 is real text). Dot row aria-hidden="true" — decorative, never focusable, never a touch target.
- MC container wraps options in role="radiogroup" with aria-label = plain-text question stem.
- Check button focus → outline: 3px solid color.focusRing; outline-offset: 2px. Disabled state uses aria-disabled="true" (not the disabled attr) so it stays discoverable.
- Stem 20px ≥ minimum; contrast 19:1.

#### Calm mode
Card bg calm.background, text calm.text; Check fill calm.primary (muted green) with white label (verify ≥4.5:1 → #2D5A3D is 6.6:1 ✓). transition: none on all hover/border changes; no shadow animation. State changes are instant; shadows.raised may flatten to shadows.card to reduce visual stimulation.

---

### COMPONENT SPEC: MCOption

#### Layout
Full-width button, padding: space[3] space[4], gap: space[4], minHeight: touch.minSize, borderRadius:'8px', 2px border, label fontSize.base/color.text, left-aligned.
20px radio glyph left, flex-shrink:0. Add an 18px status slot on the right (reserved space, empty by default) so revealed ✓ never reflows the row.

#### States
- Default — bg surface, border color.borderStrong (fixes the 1.47:1 border-contrast failure), empty radio.
- Selected (pre-submit) — bg color.primaryLight, border + filled radio color.primary. (primaryLight reserved to this use only, per constraint.)
- Correct-revealed — bg successLight, border success, radio filled success, right slot shows ✓ glyph in success.
- Repair-marked (the student's choice after an unsuccessful Check, options re-enabled for retry) — bg repairLight, border repair, right slot shows ⟳ glyph in repair. Never a ✗, never red.
- Locked-muted (worked solution shown) — non-chosen options drop to color.textMuted text + border edge, pointer-events:none.

#### Token map
| Element | Property | Token |
|---|---|---|
| Border default | border-color | borderStrong |
| Selected | border + bg | primary + primaryLight |
| Correct | border + bg | success + successLight |
| Repair | border + bg | repair + repairLight |
| Radio fill | background | mirrors border colour |
| Inner dot | background | surface |

#### Accessibility
- role="radio", aria-checked. Focus → outline: 3px solid color.focusRing; outline-offset: 2px.
- Status conveyed by glyph + colour + border, never colour alone. Correct-revealed option carries visually-hidden text "Correct answer". The repair-marked option gets no "incorrect"/"wrong" announcement — only "selected".
- Hit area = whole row ≥44px.

#### Calm mode
Same token mapping; transition:none. Selected/correct/repair changes apply instantly with no colour fade.

---

### COMPONENT SPEC: CorrectBand

#### Layout
background: successLight, 2px solid success, borderRadius:'12px', padding: space[5], marginTop: space[4].
Stack vertically, not space-between (fixes uneven 375px distribution): row 1 = ✓ glyph (24px, success) + message; row 2 = action button, full-width on <420px, auto-width above.
Optional last-question subline in fontSize.sm/textMuted under the message.

#### States
- Standard / streak / hinted — message swaps by competenceMessage(); band styling identical.
- Last question — button label See results, subline shown.
- Button: fill success, label surface, minHeight:44px, borderRadius:'6px'; receives focus on mount.

#### Token map
| Element | Property | Token |
|---|---|---|
| Band bg | background | successLight |
| Band border | border | success |
| Glyph | color | success |
| Message | color | success |
| Message weight | font-weight | fontWeight.medium |
| Subline | color | textMuted |
| Button fill | background | success |
| Button label | color | surface |

#### Accessibility
- role="status" aria-live="polite"; ✓ glyph aria-hidden, success carried by real message text.
- autoFocus on the Next button; add outline: 3px solid focusRing; outline-offset:2px.

#### Calm mode
Static successLight band — no green flash, no entrance animation. Mounts in final state. Button fill stays success (semantic). No hover transition.

---

### COMPONENT SPEC: RepairBand

#### Layout
background: repairLight, 2px solid repair, borderRadius:'12px', padding: space[5], marginTop: space[4].
Header row: 24px ⟳ glyph (repair, aria-hidden) + framing line fontWeight.medium/color.repair/fontSize.base.
Contextual hint / KaTeX block under header, marginTop: space[2].
Button group: stacks to full-width column on <420px; above that, inline gap: space[3]. Primary action always last in DOM + visually weightiest.

#### States
- Mode 1 (CE matched) — framing line by error class + contextual hint.
- Mode 2 (no CE match) — default hint inline.
- Mode 3 (no hint) — generic framing line only.
- Buttons: early attempts → Try again (secondary) + Show next hint (secondary). After hints exhausted or attempt ≥3 → Show worked solution (primary, repair fill). After worked solution shown → only Next question → (primary).
- Secondary = transparent bg, border + text: repair; primary = repair fill, surface text. Both minHeight: touch.minSize.

#### Token map
| Element | Property | Token |
|---|---|---|
| Band bg | background | repairLight |
| Band border | border | repair |
| Glyph | color | repair |
| Framing line | color | repair |
| Secondary btn | border + color | repair |
| Primary btn fill | background | repair |
| Primary btn label | color | surface |

#### Accessibility
- role="status" aria-live="polite", aria-label="Let's work through this".
- Focus rings outline: 3px solid focusRing; outline-offset:2px.
- Copy carries no "wrong/incorrect/mistake/failed". Glyph + amber + text triple-encode the state.

#### Calm mode
Static repairLight band, no entrance animation, transition:none. Primary button keeps repair fill (semantic).

---

### COMPONENT SPEC: HintCard

#### Layout
background: repairLight, 1px solid repair + borderLeft:4px solid repair, borderRadius:'6px', padding: space[3] space[4], marginTop: space[3].
Header: Hint 1 label in fontSize.sm/fontWeight.medium/repair. Add a 20px circular numbered badge (repair text on surface, 1px repair border) before the label.
Hint body KaTeX block under header.

#### States
Static per hintNumber; stacks vertically as more hints reveal. No interactive state.

#### Token map
| Element | Property | Token |
|---|---|---|
| bg | background | repairLight |
| Left bar | border-left | repair |
| Border | border | repair |
| Label + badge | color | repair |
| Body | color | text |

#### Accessibility
- role="note", aria-label="Hint {n}". Left bar is reinforcement; the visible "Hint N" label is the real cue. No focusable elements.

#### Calm mode
Renders instantly on reveal (no slide/fade). Identical tokens.

---

### COMPONENT SPEC: WorkedSolution

#### Layout
background: successLight, 1px solid success + borderLeft:4px solid success, borderRadius:'6px', padding: space[4] space[5], marginTop: space[4].
Heading WORKED SOLUTION uppercase, fontSize.sm/fontWeight.bold/success/letterSpacing:0.05em, marginBottom: space[3]. Prefix each revealed step with a Step n label (fontSize.sm/textMuted) above its KaTeX.
Steps revealed one at a time, divider 1px solid color.border between them.

#### States
- Revealing — visibleCount < steps.length: Next step → secondary (transparent, 1px success border + success text, minHeight:44px).
- Complete — all steps shown: secondary hidden; Next question → primary (primary fill, surface text, minHeight:44px).

#### Token map
| Element | Property | Token |
|---|---|---|
| bg | background | successLight |
| Left bar | border-left | success |
| Heading | color | success |
| Step label | color | textMuted |
| Step dividers | border | border |
| Next step btn | border + color | success |
| Final CTA fill | background | primary |
| Final CTA label | color | surface |

#### Accessibility
- role="note" aria-label="Worked solution". Next step button aria-label="Show step n of N"; on reveal move focus to the newly shown step container (tabindex=-1).
- Focus rings outline: 3px solid focusRing; outline-offset:2px.

#### Calm mode
Steps appear instantly on tap (no reveal animation), transition:none. Optional "Show all steps" single affordance for calm mode. Tokens unchanged.

---

### SCREEN SPEC: PracticeSession

#### Layout
Centred column · max-width 640px · page bg color.background (calm: calm.background)

```
╔═════════ QUESTION DISPLAY (375px) ═════════╗
║ Number                                     ║  strand eyebrow · sm · strand[strand]
║ Question 3 of 5                            ║  sm · textMuted
║ ●●●○○                                      ║  dots, aria-hidden, decorative
║                                            ║
║ A bag has 3 red and 5 blue marbles.        ║  STEM · 20px · lineHeight.loose
║ What fraction are red?                      ║
║                                            ║
║ [○] 3/5                          (h≥44)    ║  borderStrong edge
║ [●] 3/8        (selected · primaryLight)   ║
║ [○] 5/8                                    ║
║ [○] 5/3                                    ║
║                                            ║
║ [        Check answer        ]   (h=48)    ║  primary, enabled
╚════════════════════════════════════════════╝

— CORRECT —
╔════════════════════════════════════════════╗
║ ✓  You got this one right first try.       ║  successLight · 2px success
║                                            ║
║ [ Next question → ]              (h≥44)    ║  success fill · stacked, full-width <420
╚════════════════════════════════════════════╝

— REPAIR (wrong answer / amber) —
╔════════════════════════════════════════════╗
║ ⟳  It looks like a step in the process     ║  repairLight · 2px repair
║    caught you out — let's see what to       ║  framing line · repair · medium
║    focus on.                                ║
║    A fraction compares the part to the      ║  contextual hint (KaTeX)
║    WHOLE: 3 red out of 8 marbles total.     ║
║                                            ║
║ [ Try again ]  [ Show next hint → ]        ║  secondary · stacks <420
╚════════════════════════════════════════════╝
┌─ Hint 1 ───────────────────────────────────┐  repairLight · 4px left amber bar
│ ① Count every marble first: 3 + 5 = 8.     │
└────────────────────────────────────────────┘

— WORKED SOLUTION —
┌────────────────────────────────────────────┐  successLight · 4px left green bar
│ WORKED SOLUTION                            │
│ Step 1  Total marbles = 3 + 5 = 8          │
│ ──────────────────────────────────────     │
│ Step 2  Red marbles = 3                    │
│ ──────────────────────────────────────     │
│ Step 3  Fraction red = 3/8                 │
│                                            │
│ [ Next step → ]   then   [ Next question → ]│
└────────────────────────────────────────────┘
```

#### State inventory
- Question display — QuestionCard, Check disabled→enabled on selection.
- Correct — QuestionCard locks (chosen option correct-revealed) → CorrectBand mounts below; focus to Next.
- Repair — QuestionCard locks (chosen option repair-marked, options re-enabled on Try again) → RepairBand mounts; optional HintCard stack grows on each "Show next hint".
- Worked solution — reached when hints exhausted or attempt ≥3; RepairBand buttons collapse, WorkedSolution mounts and reveals steps; ends on Next question.
- Transitions between states are mount/unmount of bands below a persistent QuestionCard — the card is never swapped, preserving the student's anchor.
- Technical color.error states (network/timeout) are out of scope for these four and never reuse repair amber.

#### Copy decisions

**Question / actions**
- Counter: Question 3 of 5
- Strand eyebrow: the strand name (Number, Algebra, …) — plain, capitalised.
- Submit: Check answer

**CorrectBand (no score, no badge)**
- Default: Correct — on to the next one.
- 2–3 consecutive: You got this one right first try.
- 4+ consecutive: Your last 4 answers have all been correct. (N substituted)
- After a hint: You worked that out after a hint — that counts.
- Last question subline: That's the last question in this set.
- Button: Next question → / See results (last)

**RepairBand framing lines**
- Conceptual: It looks like there's a concept here worth sitting with — this kind of confusion is very common.
- Procedural: It looks like a step in the process caught you out — let's see what to focus on.
- Careless: Looks like a small slip — these are easy to catch once you know what to look for.
- Default (no CE match): Have another look — let's work through this together.
- Buttons: Try again · Show next hint → · Show worked solution

**Canonical misconception-repair instance (3/8-vs-3/5 example):**
1. Name the strategy: It looks like a step in the process caught you out — let's see what to focus on.
2. Why it doesn't fit: A fraction compares the part to the whole. You used 3 and 5 — but 5 is the other part, not the total.
3. The repair: Add both parts to get the whole first: 3 + 5 = 8. Red is 3 out of 8.
4. Offer retry: Try again button.

HintCard: label Hint {n}. WorkedSolution: heading Worked solution; step prefix Step {n}; buttons Next step →, Next question →.

No instance of "wrong", "incorrect", "mistake", or "failed" appears in any string above.

---

### OPEN QUESTIONS

1. **Strand eyebrow scope:** I introduced a strand-coloured eyebrow + color.strand text tokens to lift question identity/hierarchy. This adds strand data into QuestionCard, which currently doesn't receive it. Confirm QuestionCard can be passed strand, or drop the eyebrow and keep borderStrong/focusRing only.

2. **borderStrong value:** the audit recommended #9CA3AF, but that measures ~2.6:1 and does not meet the 3:1 required for meaningful borders; specced #6B7280 (4.6:1). Confirm the darker value is acceptable aesthetically, or accept a documented exception at #9CA3AF.

3. **MCOption repair-marked glyph:** confirm ⟳ (look-again) vs leaving the chosen option visually unmarked until worked solution. Marking it risks reading as "you picked wrong"; not marking it can disorient on retry. Need a call on which serves the no-judgement goal.

4. **Calm-mode primary colour for the repair/success bands:** calm overrides only background/primary/text. Kept feedback bands semantic (amber/green) in calm mode and only neutralised motion. Confirm feedback semantics should not be recoloured to calm green/neutral.

5. **Worked-solution "Show all steps" calm affordance:** confirm whether calm mode should expose all steps at once (less interaction/motion) or keep the one-at-a-time reveal without animation.
