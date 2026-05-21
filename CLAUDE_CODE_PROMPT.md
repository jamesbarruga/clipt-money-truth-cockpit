# Claude Code Prompt

Paste this into Claude Code from inside the project folder in VS Code.

---

You are working in a Vite + React + Tailwind project called `clipt-money-truth-cockpit`.

Goal:
Polish this into a premium, self-contained clickable demo for presenting a finance-ops reconciliation concept to Clipt Care.

Context:
The prototype is called **Clipt Care Money Truth Cockpit**. It should show a realistic workflow for reconciling:
- client in-home foot care visits
- provider/nurse payouts
- provider training fees
- foot-care kits
- provider subscriptions
- commission/platform share
- cash visit payments
- Stripe charges, invoices, payouts, transfers, refunds
- US Bank deposits
- Clipt admin/provider app exports
- dev-facing data gaps

Important product logic:
This is not “AI does bookkeeping.”
The core reconciliation should be deterministic and auditable:
- parse/import exports
- normalize into a `financial_event` table
- match by strong IDs first: appointment_id, provider_id, stripe_charge_id, stripe_payout_id, transfer_id, bank reference
- never invent a match
- unresolved items become exceptions
- human review is required before close

AI is only allowed to:
- summarize exception clusters
- suggest likely categories with confidence and human approval
- draft dev tickets from repeated data gaps
- detect suspicious patterns/outliers
- draft monthly commentary
AI must not finalize reconciliations, tax categories, provider payouts, refunds, or P&L numbers.

Tasks:
1. Run the project and verify it builds.
2. Fix any compile/import issues.
3. Preserve the current single-page clickable prototype behavior.
4. Improve responsiveness:
   - On desktop, keep the collapsible left sidebar.
   - On smaller screens, make the sidebar usable and avoid horizontal page breakage.
   - Tables can scroll horizontally inside cards.
5. Improve presentation polish:
   - stronger hero/header
   - clearer active sidebar states
   - better spacing and hierarchy
   - premium dashboard feel, but not cyberpunk
   - keep it believable for a finance/bookkeeping/client demo
6. Add a short top-level note somewhere subtle:
   “Prototype uses sample data only. Not connected to Clipt systems.”
7. Add optional “Presentation Mode” polish if simple:
   - default open on Overview
   - smooth transitions
   - clear badges for Care Ops Gaps, Dev Fixes, Close Workflow
8. Do not add a backend.
9. Do not add fake API calls.
10. Do not add real client/customer PII.
11. Do not claim this is production software.

When done:
- Tell me exactly what changed.
- Confirm `npm run build` passes.
- Give me the commands to push to GitHub and deploy to GitHub Pages.
