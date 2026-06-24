# /design-apply — Apply Claude Design output to the codebase

**Usage:** `/design-apply [screen-or-component-name]`
**Examples:**
- `/design-apply practice-session`
- `/design-apply navbar`

Prerequisite: Claude Design's response must be saved at `design/inbox/[target]-response.md`
before running this command.

This command uses the **math-app-ui-design** skill (`.claude/skills/math-app-ui-design/`).
It implements the **Definition of Done** from `PRODUCT_AND_VERIFICATION.md §H`.

---

When this skill is invoked, do the following steps in order.

## Step 1 — Read the response

Read:
- `design/inbox/[target]-response.md` — the Claude Design output
- `src/theme/tokens.ts` — current tokens
- `design/agent/SCREEN-REGISTER.md` — current status
- `.claude/skills/math-app-ui-design/references/PRODUCT_AND_VERIFICATION.md` — §H Definition of Done

If the inbox file does not exist, stop and tell the user:
"No inbox file found at `design/inbox/[target]-response.md`.
Save Claude Design's response there first, then re-run `/design-apply [target]`."

## Step 2 — Validate the response

Check the response against these hard rules before applying anything:

| Rule | Check |
|---|---|
| No hardcoded hex values outside tokens | Any `#XXXXXX` not in tokens.ts is a violation |
| Amber for wrong answers only | `color.repair` must not be used for anything else |
| Red for technical errors only | `color.error` must not appear in student-facing feedback |
| No third-party CDN references | No Google Fonts, Tailwind CDN, or external URLs |
| No localStorage or sessionStorage | Flag any reference to these |
| Touch targets | Any interactive element without ≥44px noted — flag it |
| No shame language | "wrong", "incorrect", "mistake", "failed" must not appear in student copy |
| Maths as accessible text | No equations as bare images — must specify KaTeX/MathML |

If any violation is found: list each, explain the rule it breaks, and ask the user to confirm
before applying corrections or sending back to Claude Design.

## Step 3 — Apply TOKEN ADDITIONS

If the TOKEN ADDITIONS section contains new tokens:
1. Read `src/theme/tokens.ts`
2. Add the new tokens in the correct section (colour with colour, spacing with spacing, etc.)
3. Write the updated file
4. Print: "Added N new tokens to tokens.ts: [list names]"
5. Also update `.claude/skills/math-app-ui-design/assets/design-tokens.template.json` with the new values and add them to `contrastPairs`

If TOKEN ADDITIONS says "none": print "No new tokens needed."

## Step 4 — Run the deterministic gate (Definition of Done §H)

After applying token additions, run all four checks:

```bash
python3 .claude/skills/math-app-ui-design/scripts/check_contrast.py \
  --tokens .claude/skills/math-app-ui-design/assets/design-tokens.template.json

python3 .claude/skills/math-app-ui-design/scripts/find_hardcoded_values.py \
  --src src/

python3 .claude/skills/math-app-ui-design/scripts/check_copy_terms.py \
  src/
```

If a Visual Contract exists at `design/screens/[target]-contract.yaml`, also run:
```bash
python3 .claude/skills/math-app-ui-design/scripts/validate_visual_contract.py \
  design/screens/[target]-contract.yaml
```

Report any failures. Do not proceed to implementation until all four checks pass (or the user
explicitly accepts a specific known false positive with a justification).

## Step 5 — Save specs

For each COMPONENT SPEC section in the response:
- Save to `design/components/[component-name].md`
- Overwrite if it exists

For each SCREEN SPEC section in the response:
- Save to `design/screens/[target].md`
- Overwrite if it exists

Print the list of files written.

## Step 6 — Surface open questions

If the OPEN QUESTIONS section has any items (not "none"):
Print them clearly under the heading **Decisions needed before implementation:**
Number each one.
Do NOT proceed to implementation until the user has answered them or explicitly said to skip.

## Step 7 — Generate implementation checklist

Based on the saved specs and the §H Definition of Done:

```
Implementation checklist for [target]:

1. [ ] Update tokens.ts (done in Step 3 if needed)
2. [ ] Build [ComponentA] — spec at design/components/[ComponentA].md
3. [ ] Build [ComponentB] — spec at design/components/[ComponentB].md
4. [ ] Implement [ScreenName] layout — spec at design/screens/[target].md
5. [ ] Apply misconception-repair copy pattern (§C) to all feedback states
6. [ ] Calm mode variant for [elements listed in spec]
7. [ ] Accessibility pass: keyboard focus, touch targets ≥44px, colour-not-alone, reduced motion, reflow at 320px, KaTeX accessible
8. [ ] Re-run all four DoD checks (contrast, hardcoded-values, copy-terms, validate-contract)
9. [ ] Fill in design/components/before-after-template.md for each changed component
10. [ ] Update design/agent/SCREEN-REGISTER.md status to `implemented`
```

Print this checklist. Do not start implementing unless the user explicitly says "implement now"
or "go ahead".

## Step 8 — Update the register

In `design/agent/SCREEN-REGISTER.md`:
- Change status from `briefed` to `spec-ready`
- Update Spec file column to `design/screens/[target].md`

## Step 9 — Print summary

```
/design-apply complete for [target].

Specs saved:
  design/screens/[target].md
  design/components/[ComponentA].md  (if any)

Tokens added: [N] (or none)
DoD gate: [PASS / FAIL — list failures]

Next: review the checklist above, answer any open questions, then say "implement now" to build.
```
