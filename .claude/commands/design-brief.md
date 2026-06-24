# /design-brief — Generate a Claude Design handoff package

**Usage:** `/design-brief [screen-or-component-name]`
**Examples:**
- `/design-brief practice-session`
- `/design-brief navbar`
- `/design-brief repair-band`

This command uses the **math-app-ui-design** skill (`.claude/skills/math-app-ui-design/`).
It operates in **task mode 3: Claude Design prompt** (see `PRODUCT_AND_VERIFICATION.md §B`).

---

When this skill is invoked, do the following steps in order. Do not skip any step.

## Step 1 — Identify the target

Read `$ARGUMENTS`. This is the screen or component name.
If blank, read `design/agent/SCREEN-REGISTER.md` and pick the first item with status `pending`.

## Step 2 — Gather source material

Read ALL of the following files:
- `.claude/skills/math-app-ui-design/references/design-system.md` — populated app design system
- `.claude/skills/math-app-ui-design/references/PRODUCT_AND_VERIFICATION.md` — product model, constraints, V1 rules
- `src/theme/tokens.ts` — current tokens (source of truth)
- `design/agent/CONTEXT-BRIEF.md` — product context
- `design/agent/SCREEN-REGISTER.md` — design status

Then based on the target, also read:
- The existing screen spec if it exists at `design/screens/[target].md`
- `.tsx` files in `src/` that match the target name or route
- Component files in `src/components/` that are part of this screen

## Step 3 — Run the deterministic checks

Before generating the brief, run these and note any findings to include:

```bash
python3 .claude/skills/math-app-ui-design/scripts/check_contrast.py \
  --tokens .claude/skills/math-app-ui-design/assets/design-tokens.template.json

python3 .claude/skills/math-app-ui-design/scripts/find_hardcoded_values.py \
  --src src/

python3 .claude/skills/math-app-ui-design/scripts/check_copy_terms.py \
  src/
```

Include any genuine failures (not false positives from code identifiers) in the brief under "Known issues to fix".

## Step 4 — Produce the Visual Contract (if targeting a new flow)

If the target is a new screen flow (not a polish pass on an existing component):
- Create a Visual Contract from `.claude/skills/math-app-ui-design/assets/visual-contract.template.yaml`
- Tie it to the relevant ACARA code (e.g. `AC9M7N01` for practice session)
- Validate it: `python3 .claude/skills/math-app-ui-design/scripts/validate_visual_contract.py <file>`
- Save to `design/screens/[target]-contract.yaml`

For a polish pass on existing components, skip this step.

## Step 5 — Compress the source material into a Design Brief Package

Produce a single markdown document with these exact sections, NO preamble:

```
# AusMaths Design Brief — [Target Name]
Generated for Claude Design. Follow the response format at the end exactly.

---

## SECTION 1: The ask (read this first)
[2–4 sentences: what is being designed, what states it has, what decision is needed]

## SECTION 2: Non-negotiable constraints
[Bullet list — extract only the constraints relevant to this target.
Maximum 12 bullets. Use exact token names, not hex values.
Always include: amber for wrong/repair only, red for technical errors only,
no hardcoded hex, WCAG 2.1 AA, touch targets ≥ 44px, no CDN fonts, KaTeX for maths.]

## SECTION 3: Current tokens (use these — do not invent new ones without flagging)
[Paste the full content of src/theme/tokens.ts verbatim, inside a typescript code block]

## SECTION 4: What already exists
[For each relevant source file found in Step 2:
  - File path as heading
  - Paste the file content verbatim inside a code block
  Omit files longer than 200 lines — note "file too long, key excerpt:" and paste lines 1–60]

## SECTION 5: Existing spec / wireframe (if any)
[If design/screens/[target].md exists, paste it here. Otherwise write "No existing spec."]

## SECTION 6: Strand colours reference
[Number #2563EB · Algebra #7C3AED · Measurement #059669 · Space #D97706 ·
 Statistics #DC2626 · Probability #0891B2]

## SECTION 7: Required output format
[Paste this block verbatim:]

Respond using ONLY this structure. No preamble, no summary, no explanation outside these sections.

### TOKEN ADDITIONS
If new tokens are needed, list them as TypeScript additions to tokens.ts.
If none needed, write: none

### COMPONENT SPEC: [ComponentName]
For each component involved:
#### Layout
[ASCII wireframe — exact element order, spacing intent using space[] token names]
#### States
[Bullet list: state name → visual change → which token changes]
#### Token map
[Table: element | property | token]
#### Accessibility
[Bullet list: aria role/label, focus order, touch target size, screen reader behaviour]
#### Calm mode
[What changes when calm mode is active]

### SCREEN SPEC: [ScreenName]
#### Layout
[ASCII wireframe at 375px width]
#### State inventory
[All visual states the screen can be in]
#### Copy decisions
[Any text that must be locked in — button labels, headings, feedback copy.
 Apply misconception-repair pattern from PRODUCT_AND_VERIFICATION.md §C:
 name the strategy, explain why, show the correct idea, offer a retry.]

### OPEN QUESTIONS
[Only items that genuinely require a human decision before implementation.
If none, write: none]
```

## Step 6 — Save the package

Write the complete Design Brief Package to:
`design/outbox/[target]-brief.md`

Overwrite if it already exists.

## Step 7 — Update the register

In `design/agent/SCREEN-REGISTER.md`, change the row's status from `pending` to `briefed`.
Update the Spec file column to show the outbox path.

## Step 8 — Print handoff instructions

Print exactly this (filling in [target] and the live URL if the screen is deployed):

---
**Design brief ready: `design/outbox/[target]-brief.md`**

**To use with Claude Design (4 steps):**

1. Open a new Claude Design conversation
2. **Select the AusMaths design system** — click the design-system picker (bottom-left of the chat input) and choose **AusMaths**. This gives Claude Design our component previews, colours, and constraints without needing to read the brief first.
3. Click the **paperclip / Attach file** button → attach `design/outbox/[target]-brief.md` directly (no copy-pasting needed)
4. Type ONLY this in the text box, then send:
   > *You are a product designer for an Australian maths education app. Read the attached brief and respond using ONLY the output format in Section 7. Do not ask clarifying questions — note anything uncertain in OPEN QUESTIONS.*

**Optional but recommended:** Before sending, also click **"Grab web element"** and point it at the live URL of the screen (e.g. `https://maths.graphsight.app/practice/session/AC9M7N01`). A screenshot gives Claude Design a visual reference alongside the spec.

**When Claude Design responds:** save the response as `design/inbox/[target]-response.md`

**Then type `/design-apply [target]` here** to validate, apply tokens, save specs, and get the implementation checklist.

**To keep the design system in sync:** after any change to `src/theme/tokens.ts` or a new component in `src/components/`, re-run `/design-sync` from Claude Code to update the AusMaths project.
---
