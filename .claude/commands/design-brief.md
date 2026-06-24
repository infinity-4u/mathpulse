# /design-brief — Generate a Claude Design handoff package

**Usage:** `/design-brief [screen-or-component-name]`
**Examples:**
- `/design-brief practice-session`
- `/design-brief navbar`
- `/design-brief repair-band`

---

When this skill is invoked, do the following steps in order. Do not skip any step.

## Step 1 — Identify the target

Read `$ARGUMENTS`. This is the screen or component name.
If blank, read `design/agent/SCREEN-REGISTER.md` and pick the first item with status `pending`.

## Step 2 — Gather source material

Read ALL of the following files:
- `src/theme/tokens.ts` — full content
- `design/agent/CONTEXT-BRIEF.md` — full content
- `design/PHASE1-DESIGN-SPEC.md` — full content
- `design/agent/SCREEN-REGISTER.md` — status column only

Then, based on the target name, also read:
- The existing screen spec if it exists at `design/screens/[target].md`
- The relevant source files: find `.tsx` files in `src/` that match the target name or route, read them
- Any component files in `src/components/` that are part of this screen

## Step 3 — Compress the source material

Produce a **Design Brief Package** — a single markdown document with these exact sections,
in this exact order, with NO preamble:

```
# AusMaths Design Brief — [Target Name]
Generated for Claude Design. Follow the response format at the end exactly.

---

## SECTION 1: The ask (read this first)
[2–4 sentences: what is being designed, what states it has, what decision is needed]

## SECTION 2: Non-negotiable constraints
[Bullet list — extract only the constraints relevant to this target from CONTEXT-BRIEF.md.
Maximum 12 bullets. No headings inside. Use exact token names, not hex values.]

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
[Paste the strand colour table from CONTEXT-BRIEF.md]

## SECTION 7: Required output format
[Paste this block verbatim — do not modify it:]

Respond using ONLY this structure. No preamble, no summary, no explanation outside these sections.

### TOKEN ADDITIONS
If new tokens are needed, list them here as TypeScript additions to tokens.ts.
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
[Any text that must be locked in — button labels, headings, feedback copy]

### OPEN QUESTIONS
[Only items that genuinely require a human decision before implementation.
If none, write: none]
```

## Step 4 — Save the package

Write the complete Design Brief Package to:
`design/outbox/[target]-brief.md`

Overwrite if it already exists.

## Step 5 — Update the register

In `design/agent/SCREEN-REGISTER.md`, find the row for this target and change its status from `pending` to `briefed`. Update the Spec file column to show the outbox path.

## Step 6 — Print handoff instructions

Print exactly this to the user (filling in [target] and [path]):

---
**Design brief ready: `design/outbox/[target]-brief.md`**

**To use with Claude Design:**

1. Open a new Claude Design conversation
2. Paste the entire contents of `design/outbox/[target]-brief.md`
3. Add this single instruction at the top:
   > "You are a product designer for an Australian maths education app. Read this brief and respond using ONLY the output format specified in Section 7. Do not ask clarifying questions — note anything uncertain in OPEN QUESTIONS."
4. When Claude Design responds, save the response to `design/inbox/[target]-response.md`
5. Run `/design-apply [target]` to apply it

**Token tip:** The brief is self-contained. Claude Design needs no prior context.
---
