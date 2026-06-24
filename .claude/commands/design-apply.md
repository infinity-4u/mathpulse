# /design-apply — Apply Claude Design output to the codebase

**Usage:** `/design-apply [screen-or-component-name]`
**Examples:**
- `/design-apply practice-session`
- `/design-apply navbar`

Prerequisite: Claude Design's response must be saved at `design/inbox/[target]-response.md`
before running this command.

---

When this skill is invoked, do the following steps in order.

## Step 1 — Read the response

Read:
- `design/inbox/[target]-response.md` — the Claude Design output
- `src/theme/tokens.ts` — current tokens
- `design/agent/SCREEN-REGISTER.md` — current status

If the inbox file does not exist, stop and tell the user:
"No inbox file found at `design/inbox/[target]-response.md`.
Save Claude Design's response there first, then re-run `/design-apply [target]`."

## Step 2 — Validate the response

Check the response against these hard rules before applying anything:

| Rule | Check |
|---|---|
| No hardcoded hex values outside tokens | Any `#XXXXXX` that isn't in tokens.ts is a violation |
| Amber for wrong answers only | `color.repair` must not be used for anything else |
| Red for technical errors only | `color.error` must not appear in student-facing feedback |
| No third-party CDN references | No Google Fonts, Tailwind CDN, or external URLs |
| No localStorage or sessionStorage | Flag any reference to these |
| Touch targets | Any interactive element without a 44px minimum noted — flag it |

If any violation is found: list each violation, explain the rule it breaks, and ask the user
whether to proceed with corrections or send back to Claude Design.

## Step 3 — Apply TOKEN ADDITIONS

If the TOKEN ADDITIONS section contains new tokens:
1. Read `src/theme/tokens.ts`
2. Add the new tokens in the correct section (colour with colour, spacing with spacing, etc.)
3. Write the updated file
4. Print: "Added N new tokens to tokens.ts: [list names]"

If TOKEN ADDITIONS says "none": print "No new tokens needed."

## Step 4 — Save specs

For each COMPONENT SPEC section in the response:
- Save to `design/components/[component-name].md`
- Overwrite if it exists

For each SCREEN SPEC section in the response:
- Save to `design/screens/[target].md`
- Overwrite if it exists

Print the list of files written.

## Step 5 — Surface open questions

If the OPEN QUESTIONS section has any items (not "none"):
Print them clearly under the heading **Decisions needed before implementation:**
Number each one.
Do NOT proceed to implementation until the user has answered them or explicitly said to skip.

## Step 6 — Generate implementation checklist

Based on the saved specs, produce a numbered implementation checklist:

```
Implementation checklist for [target]:

1. [ ] Update tokens.ts (done in Step 3 if needed)
2. [ ] Build [ComponentA] — spec at design/components/[ComponentA].md
3. [ ] Build [ComponentB] — spec at design/components/[ComponentB].md
4. [ ] Implement [ScreenName] layout — spec at design/screens/[target].md
5. [ ] Add calm mode variant for [elements listed in spec]
6. [ ] Accessibility pass — verify items in spec's Accessibility section
7. [ ] Update design/agent/SCREEN-REGISTER.md status to `implemented`
```

Print this checklist. Do not start implementing unless the user explicitly says "implement now" 
or "go ahead".

## Step 7 — Update the register

In `design/agent/SCREEN-REGISTER.md`:
- Change status from `briefed` to `spec-ready`
- Update Spec file column to `design/screens/[target].md`

## Step 8 — Print summary

Print:
```
/design-apply complete for [target].

Specs saved:
  design/screens/[target].md
  design/components/[ComponentA].md  (if any)

Tokens added: [N] (or none)

Next: review the checklist above, answer any open questions, then say "implement now" to build.
```
