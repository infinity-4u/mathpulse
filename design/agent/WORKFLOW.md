# Designer Agent — Workflow

How to use the designer agent skill for every screen in this product.
The agent produces a design spec. Claude Code implements it. Neither does both jobs.

---

## When to invoke the designer agent

**Always invoke before implementing:**
- Any student-facing screen (practice session, hub, home, strand pages)
- Any screen that shows assessment feedback (correct, repair, worked solution states)
- Any new component that appears in more than one place

**Skip the agent for:**
- Internal API routes
- Admin-only pages used only by developers (e.g. /test)
- Purely structural changes (routing, layout shell)
- Bug fixes to existing designed screens

---

## Inputs — what to always give the agent

Every agent invocation must include all three layers:

### 1. Fixed context (always attach)
File: `design/agent/CONTEXT-BRIEF.md`
Contains: product audience, platform constraints, design principles, token reference.
Do not summarise it — attach it in full.

### 2. Existing design spec (for screens already partially specced)
File: `design/PHASE1-DESIGN-SPEC.md`
Attach when the screen being designed overlaps with Phase 1 specs (practice session,
teacher dashboard, parent view). The agent should extend or refine, not contradict.

### 3. Screen-specific brief (write this each time)
A short brief (5–10 lines) stating:
- Route and user role (student / teacher / parent)
- What the user arrives here to do (one sentence)
- What state variations exist (e.g. correct / incorrect / loading)
- Any known constraints not in CONTEXT-BRIEF.md

---

## What to ask the agent to produce

Request all of the following in one call:

1. **Layout spec** — ASCII wireframe showing element order, max-width, spacing intent
2. **State inventory** — all visual states the screen or component can be in
3. **Token mapping** — which `color.*`, `space.*`, `typography.*` token applies to each element
4. **Accessibility checklist** — aria roles, focus order, touch target sizes, screen reader labels
5. **Calm mode variant** — how the screen differs when calm mode is active
6. **Copy decisions** — any button labels, headings, or feedback text that need to be locked in
7. **Open questions** — anything the agent cannot resolve without a human decision

---

## Output — where to save it

Save the agent's output to `design/screens/[screen-slug].md`.
Example: `design/screens/practice-session.md`

If the agent produces component specs that are shared across screens,
save them to `design/components/[component-name].md`.

Do not implement code until the spec is saved and reviewed.

---

## Review before implementing

Check the agent output against:

| Check | Where |
|---|---|
| Colours are in tokens.ts | `src/theme/tokens.ts` |
| No third-party fonts or CDN links | CONTRACT.md §3 |
| Touch targets ≥ 44px stated | PHASE1-DESIGN-SPEC.md |
| Amber for wrong, red for broken | CONTRACT.md + PHASE1-DESIGN-SPEC.md §1 |
| No animation in calm mode variant | PHASE1-DESIGN-SPEC.md §6 |
| No localStorage references | CONTRACT.md §2 |

If the agent output conflicts with any of the above, correct it in the saved spec
before implementing. Note the correction and why.

---

## Implementation discipline

- Implement from the saved spec, not from memory of the agent conversation
- If implementation requires a deviation from the spec, update the spec file to record it
- New tokens needed (spacing values, colours) → add to `src/theme/tokens.ts` first, then use
- Do not add inline styles that duplicate token values — always reference the token

---

## Order of screens (Phase 1 priority)

See `design/agent/SCREEN-REGISTER.md` for the full list with status.

Start with: **practice session** (most student time spent here).
Then: navigation shell → home → year hub → strand page → teacher dashboard.
