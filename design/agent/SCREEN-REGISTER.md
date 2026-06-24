# Screen Register

Single source of truth for design status of every screen.
Update this file when a screen moves through the pipeline.

Status values: `pending` → `briefed` → `spec-ready` → `implemented` → `reviewed`

---

## Student-facing (highest priority)

| Screen | Route | Status | Spec file | Notes |
|---|---|---|---|---|
| Practice session — question | `/practice/session/[code]` | `implemented` | design/screens/practice-session.md | Core loop; most student time here |
| Practice session — correct state | `/practice/session/[code]` | `implemented` | design/screens/practice-session.md | State of above |
| Practice session — repair state | `/practice/session/[code]` | `implemented` | design/screens/practice-session.md | Amber; no red |
| Practice session — worked solution | `/practice/session/[code]` | `implemented` | design/screens/practice-session.md | State of above |
| Practice session — Visual Contract | `/practice/session/[code]` | `briefed` | design/screens/practice-session-contract.yaml | All 4 states specced; validated ✓ |
| Practice hub / substrand picker | `/practice` | `pending` | — | PIN entry + topic list |
| Year 7 hub | `/year/7` | `pending` | — | 6 strand cards |
| Strand page | `/year/7/[strand]` | `pending` | — | Topic list per strand |
| Home page | `/` | `pending` | — | Hero + role paths |

## Teacher-facing (medium priority)

| Screen | Route | Status | Spec file | Notes |
|---|---|---|---|---|
| Teacher register | `/teacher/register` | `pending` | — | Invite code flow |
| Teacher dashboard | `/teacher/dashboard` | `pending` | — | Class list |
| Class detail | `/teacher/class/[id]` | `pending` | — | Student table |
| Assign substrand | `/teacher/class/[id]/assign` | `pending` | — | Topic picker |
| New class | `/teacher/class/new` | `pending` | — | |

## Parent-facing (medium priority)

| Screen | Route | Status | Spec file | Notes |
|---|---|---|---|---|
| Parent register | `/parent/register` | `pending` | — | |
| Parent dashboard | `/parent/dashboard` | `pending` | — | Child list |
| Add child | `/parent/child/new` | `pending` | — | |
| Child PIN | `/parent/child/pin` | `pending` | — | Shows PIN to give child |
| Tonight's 3 questions | `/parent/tonight` | `pending` | — | See PHASE1-DESIGN-SPEC.md Screen 7 |
| Switch to child | `/parent/switch-to-child` | `pending` | — | |

## Shared components (designed once, used everywhere)

| Component | Status | Spec file | Used in |
|---|---|---|---|
| NavBar | `pending` | — | All screens |
| QuestionCard | `implemented` | design/components/QuestionCard.md | Practice session |
| MCOption button | `implemented` | design/components/MCOption.md | Practice session |
| NumericInput | `pending` | — | Practice session |
| CorrectBand | `implemented` | design/components/CorrectBand.md | Practice session |
| RepairBand | `implemented` | design/components/RepairBand.md | Practice session |
| HintCard | `implemented` | design/components/HintCard.md | Practice session |
| WorkedSolution | `implemented` | design/components/WorkedSolution.md | Practice session |
| TopicChip | `pending` | — | Practice session, strand pages |
| ProgressDots | `pending` | — | Practice session |
| CalmToggle | `pending` | — | Practice session, global |
| StrandCard | `pending` | — | Year 7 hub |
| SubstrandCard | `pending` | — | Strand pages |
| ClassCard | `pending` | — | Teacher dashboard |
| StudentRow | `pending` | — | Class detail |

---

## Design order (Phase 1)

Run the designer agent in this order:

1. Practice session (all states together — question/correct/repair/worked solution)
2. NavBar + shared navigation shell
3. Home page
4. Year 7 hub + strand page
5. Practice hub (PIN + substrand picker)
6. Teacher dashboard + class detail
7. Parent tonight view
8. Auth screens (register, PIN, switch-to-child) — functional over beautiful
