# Project Docs — Reading Order

Read in this order. Each document builds on the previous.

1. **[CONTRACT.md](CONTRACT.md)** — the binding law. Every agent and contributor reads this first. Invariants that cannot be broken without human sign-off.
2. **[PLAN.md](PLAN.md)** — delivery phases, agentic architecture, tripwires, and definition of done.
3. **[spec.md](spec.md)** — what we're building, for whom, and what V1 includes and excludes.
4. **[architecture.md](architecture.md)** — stack decisions, data model, auth model, content structure.
5. **[compliance.md](compliance.md)** — Australian Privacy Act, APPs, state education requirements, and the mapping from each obligation to the tripwire that enforces it.
6. **[curriculum-structure.md](curriculum-structure.md)** — canonical ACARA taxonomy for Years 7–10 and state senior pathway overview (V2 reference).

## Reference material (principles only, not the product)
- **[reference/](reference/)** — `Product_Spec.docx` ("Milo Maths") lives here when present. It describes a different product (consumer, ages 7–11, runtime AI). Salvageable UX principles (no-shame repair, mistake taxonomy, parent plan, calm mode, accessibility) have been folded into `spec.md`. The Milo product direction is explicitly out of V1 scope per CONTRACT.md §1.

## Scope-locked areas (human review required before merge)
Auth · DB schema · RLS policies · Privacy and consent flows · Data-residency config · Content verification gate · Anything in CONTRACT.md §1 OUT list

See PLAN.md → Tripwires for the automated enforcement of these boundaries.
