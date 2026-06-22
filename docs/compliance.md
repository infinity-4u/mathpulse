# Compliance — Australian Maths App (V1)

> Binding constraints: [CONTRACT.md](CONTRACT.md). Tripwire automation: [PLAN.md](PLAN.md) → Tripwires.
> Items marked **[Phase 0]** must exist before any user data is collected.

---

## Relevant legal framework

### Privacy Act 1988 (Cth) + Australian Privacy Principles (APPs)

Treat the APPs as binding from day one regardless of revenue threshold. Schools will require this in any data processing agreement, and retrofitting privacy controls mid-product is expensive.

| APP | Obligation | How we meet it | Tripwire |
|---|---|---|---|
| APP 1 — Transparency | Publish a privacy policy before any sign-up | `docs/privacy-policy-DRAFT.md` → published URL **[Phase 0]** | Manual: privacy policy URL must be live before launch gate |
| APP 3 — Collection | Collect only what is necessary | Schema denylist: no `dob`, `birth`, `address`, `phone`, `ssn`, `medicare`, `passport` columns | **no-PII-field** CI check — fails build if denylist column appears in any migration |
| APP 5 — Notification | Inform registering adult of what is collected | Consent checkbox at teacher/parent registration referencing privacy policy | Manual: consent flow reviewed as scope-locked change |
| APP 6 — Use/disclosure | Data used only for stated purpose; not sold or shared | No ad-funded model; no third-party SDKs; data shared only with parties named in privacy policy | **no-tracker** CI check — fails build if analytics/tracker package detected |
| APP 8 — Cross-border | Offshore processors must meet Australian standards | Supabase Sydney (ap-southeast-2); transactional email via AU/EU-hosted provider; no US-only SaaS for user data | **AU-region** CI check — fails if Supabase region config is not ap-southeast-2 |
| APP 11 — Security | Reasonable steps to protect personal information | Encryption at rest and in transit; RLS at DB level; no PII in logs; dependency updates | **RLS-on** CI check — fails if any user-data table has RLS disabled; **no-PII-field** covers logs |

### Online Safety Act 2021 (Cth)

Basic Online Safety Expectations (BOSE) apply. Key obligations:
- Take reasonable steps to ensure users are not exposed to harmful content. For this product: no user-generated content, no social features, no in-app messaging — document this as the primary mitigation.
- If in-app messaging is ever added (even teacher→student), higher obligations trigger. This is prohibited in V1 per CONTRACT.md §1.
- Reporting obligations apply at >250k Australian users ("designated internet service"). Not relevant for V1.

### State education data requirements

Enforced via school procurement, not legislation, but non-compliance means schools cannot use the platform.

| State | Authority | Key requirements |
|---|---|---|
| NSW | DET / NESA | NSW Privacy and Personal Information Protection Act 1998; data must stay in Australia; formal vendor review for school-wide adoption |
| VIC | DET / VCAA | Data Processing Agreement required; vendor assessment before adoption |
| QLD | DoE / QCAA | Queensland Information Privacy Act 2009 for public schools; DPA required |
| WA | SCSA | Federal Privacy Act; less formal for small deployments |
| SA, TAS, ACT, NT | Various | Federal Privacy Act; similar to WA for small deployments |

**Practical implication:** Launch with independent and Catholic schools first — faster procurement. Government school adoption (particularly NSW DET and VIC DET) requires a completed DPA and, for district-wide deployment, a formal Privacy Impact Assessment (PIA).

### Age and consent

Australia has no direct COPPA equivalent. Current best practice (and most aligned with likely future regulation following the 2022–23 Privacy Act review):
- Students under 15: account created by teacher or parent only — architecturally enforced, not a policy (CONTRACT.md §2, architecture.md → Auth model)
- Students 15–18: capacity to consent exists, but in a school context the institution acts as the responsible party
- Document who consented, when, and to what — the teacher/parent registration flow captures this

### Children's Online Privacy Code (tracked dependency)

The Australian eSafety Commissioner released an exposure draft of a Children's Online Privacy Code on 31 March 2026. The Code is expected to be registered by **10 December 2026** under the Online Safety Act 2021.

**Current status:** Exposure draft. Not yet law.

**Likely obligations relevant to this product:**
- Stronger consent requirements for collection of personal information from under-18s
- Data minimisation obligations (already met: display name + year level only)
- Prohibition on certain commercial data uses (already met: no ad model, no data sale)
- Potentially: enhanced deletion rights for children/parents (already met: hard-delete endpoint)
- Potentially: age assurance obligations (impact TBD — we use teacher/parent-gated accounts, which may satisfy this)

**Action:** Review the finalised Code against our data practices when registered. Assign to compliance review gate pre-Phase 4. If enacted before our launch, add Code obligations to the DPA template.

**Tripwire:** None automated. Add to Phase 4 manual launch checklist: "Verify compliance with Children's Online Privacy Code (if enacted)."

---

## Phase 0 deliverables (required before any user data is collected)

- [ ] **Privacy policy** (plain English) — `docs/privacy-policy-DRAFT.md` → published URL. Must cover: data collected, storage location (Australia), retention period, deletion rights, contact for requests. **[Phase 0]**
- [ ] **Data Processing Agreement template** — `docs/dpa-template-DRAFT.md`. Schools will ask for this before any class use. **[Phase 0]**
- [ ] **Hard-delete endpoint** — when school or parent requests deletion, all records for that student are permanently removed. Working before launch per CONTRACT.md §2. Verified by **hard-delete** tripwire test. **[Phase 0]**
- [ ] **Australian hosting confirmed** — Supabase ap-southeast-2 for all database and auth; no user data in US regions. Verified by **AU-region** tripwire. **[Phase 0]**
- [ ] **No third-party trackers** — zero analytics SDKs in V1 client. Verified by **no-tracker** tripwire. **[Phase 0]**

## Phase 4 deliverables (pre-launch hardening, not Phase 0)

- [ ] **Privacy Impact Assessment (PIA)** — required for large NSW DET or VIC DET district adoption. Prepare once first institutional client requests it.
- [ ] **Formal WCAG 2.1 AA audit** — third-party audit. Build to the standard from day one (enforced by **a11y** tripwire); formal audit before first institutional procurement.
- [ ] **Penetration test** — schedule before significant user growth, not before launch.
- [ ] **SOC 2 / ISO 27001** — required by some enterprise school districts. Not for V1.

---

## Data retention schedule

Concrete schedules replacing the former "active account" placeholder.

| Data category | Retention rule | Mechanism |
|---|---|---|
| Practice sessions and question attempts | Retained while student profile exists; hard-deleted with student profile | CASCADE on `student_profiles` DELETE |
| Student profiles | Retained while linked parent or teacher account is active; hard-deleted on parent/teacher account deletion or on explicit parent/guardian request | CASCADE on `auth.users` DELETE |
| Parent/teacher accounts | Retained indefinitely while active; hard-deleted within **30 days** of explicit deletion request | Admin deletion endpoint; 30-day SLA |
| Inactive student profiles | After **12 months** with no practice sessions: parent is notified (in-app + email). After a further **30 days** of no response, the profile is de-identified: `display_name` is replaced with a random string; year_level is retained for cohort analytics only. The account is NOT deleted — deletion requires explicit parent action. | Scheduled job (Phase 3); Phase 1: manual |
| School/class data | Retained while teacher account is active; hard-deleted when teacher account is deleted | CASCADE on `auth.users` DELETE → `teacher_profiles` → `classes` → `class_enrolments`, `assignments` |
| Backups | Supabase automated backups retained for **30 days**. After 30 days, backup data is outside our control (Supabase infrastructure). Disclosed in the privacy policy and DPA template. | Supabase Pro plan — verify at account setup |
| Application logs | Logs must contain no PII. Logs are retained for **90 days** in the application server. After 90 days, automated rotation. | Enforced by **no-PII-field** policy + manual review |
| Deletion request records | Confirmation that a deletion was performed: retained for **5 years** for audit purposes. Record contains only: requestor type, timestamp, affected record count — no PII. | Append-only deletion log table |

**Hard-delete SLA:** A deletion request submitted by a parent, teacher, or school must result in permanent deletion of all linked data within **30 calendar days**. The hard-delete endpoint must complete the deletion in one database transaction (no "deletion queue" in V1).

---

## Ongoing obligations

- Review privacy policy whenever a new feature collects new data or adds a third-party processor
- Notifiable Data Breaches (NDB) scheme under the Privacy Act: notify the OAIC within **30 days** of becoming aware of an eligible data breach; notify affected individuals as soon as practicable
- Log and confirm all deletion requests; meet the 30-day SLA
- Dependency updates: no known-vulnerable packages shipped (APP 11)
- Review Children's Online Privacy Code status quarterly until enacted; update DPA and privacy policy if enacted before launch
