# Screen Spec: PracticeSession
Source: design/inbox/practice-session-response.md · 2026-06-25
Route: `/practice/session/[code]`
Visual Contract: design/screens/practice-session-contract.yaml

## Layout
Centred column · max-width 640px · page `background: color.background` (calm: `calm.background`)

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
║ [ Next question → ]              (h≥44)    ║  success fill · stacked full-width <420px
╚════════════════════════════════════════════╝

— REPAIR —
╔════════════════════════════════════════════╗
║ ⟳  It looks like a step in the process     ║  repairLight · 2px repair
║    caught you out — let's see what to       ║
║    focus on.                                ║
║    A fraction compares the part to the      ║  contextual hint (KaTeX)
║    WHOLE: 3 red out of 8 marbles total.     ║
║                                            ║
║ [ Try again ]  [ Show next hint → ]        ║  secondary · stacks <420px
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

## State inventory
1. **Question display** — QuestionCard, Check disabled → enabled on selection
2. **Correct** — QuestionCard locks (chosen option correct-revealed) → CorrectBand mounts below; focus to Next button
3. **Repair** — QuestionCard locks (chosen option repair-marked, options re-enabled on Try again) → RepairBand mounts; HintCard stack grows on each "Show next hint"
4. **Worked solution** — hints exhausted OR attempt ≥3; RepairBand buttons collapse, WorkedSolution mounts with step-by-step reveal; ends on Next question
5. **Technical error** — `color.error` only (network/timeout); never reuses repair amber

Key principle: **card never swaps** — feedback bands mount below a persistent QuestionCard, preserving the student's anchor.

## Copy decisions

### Question / actions
- Counter: `Question 3 of 5`
- Strand eyebrow: strand name (`Number`, `Algebra`, …) — plain, title-case
- Submit: `Check answer`

### CorrectBand
- Default: `Correct — on to the next one.`
- 2–3 consecutive: `You got this one right first try.`
- 4+ consecutive: `Your last N answers have all been correct.`
- After a hint: `You worked that out after a hint — that counts.`
- Last question subline: `That's the last question in this set.`
- Button: `Next question →` / `See results` (last)

### RepairBand framing lines
- Conceptual: `It looks like there's a concept here worth sitting with — this kind of confusion is very common.`
- Procedural: `It looks like a step in the process caught you out — let's see what to focus on.`
- Careless (internal type): `Looks like a small slip — these are easy to catch once you know what to look for.`
- Default: `Have another look — let's work through this together.`
- Buttons: `Try again` · `Show next hint →` · `Show worked solution` · `Next question →`

### Canonical misconception-repair example (3/8 vs 3/5)
1. Name strategy: *"It looks like a step in the process caught you out — let's see what to focus on."*
2. Why it doesn't fit: *"A fraction compares the part to the whole. You used 3 and 5 — but 5 is the other part, not the total."*
3. The repair: *"Add both parts to get the whole first: 3 + 5 = 8. Red is 3 out of 8."*
4. Offer retry: Try again button

### HintCard / WorkedSolution
- Hint label: `Hint N`
- Worked solution heading: `WORKED SOLUTION`
- Step prefix: `Step N`
- Buttons: `Next step →` · `Next question →`

**Prohibited strings:** "wrong", "incorrect", "mistake", "failed" — must not appear in any student-facing copy.

## Open questions (unresolved — see implementation checklist)
1. Strand eyebrow — does QuestionCard receive a `strand` prop?
2. borderStrong value — #6B7280 confirmed or documented exception at #9CA3AF?
3. MCOption repair-marked — ⟳ glyph vs visually unmarked on retry
4. Calm mode feedback bands — keep amber/green semantic or neutralise?
5. Worked solution calm mode — all steps at once vs incremental without animation
