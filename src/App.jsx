import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Database,
  Download,
  FileSpreadsheet,
  Filter,
  Gauge,
  HeartPulse,
  Home,
  Layers3,
  LineChart,
  ListChecks,
  LockKeyhole,
  PlugZap,
  Search,
  SearchCheck,
  Settings2,
  ShieldCheck,
  Stethoscope,
  UploadCloud,
  UserRoundCheck,
  WalletCards,
} from "lucide-react";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const kpis = [
  { label: "Visit Revenue", value: 31240, display: money.format(31240), note: "Client foot-care bookings", icon: HeartPulse, tone: "blue" },
  { label: "Net Deposited", value: 40314, display: money.format(40314), note: "Matched to US Bank", icon: Banknote, tone: "green" },
  { label: "Provider Payouts", value: 18650, display: money.format(18650), note: "Nurse salary / commission view", icon: UserRoundCheck, tone: "slate" },
  { label: "Open Exceptions", value: 14, display: "14", note: "Needs review before close", icon: AlertTriangle, tone: "amber" },
];

const streams = [
  { name: "In-Home Visit Payments", amount: 31240, pct: 51, trend: "+16%", clean: 91 },
  { name: "Provider Training Fees", amount: 12600, pct: 21, trend: "+9%", clean: 88 },
  { name: "Foot-Care Kits", amount: 8700, pct: 14, trend: "+4%", clean: 76 },
  { name: "Provider Subscriptions", amount: 5700, pct: 9, trend: "+12%", clean: 94 },
  { name: "Commission / Platform Share", amount: 2900, pct: 5, trend: "-2%", clean: 82 },
];

const transactions = [
  {
    id: "appt_24051",
    stripe: "ch_clipt_1001",
    payout: "po_spk_7721",
    customer: "M. Carter",
    provider: "Nurse Elena R.",
    category: "In-Home Foot Care Visit",
    gross: 165,
    fee: 6,
    net: 159,
    bank: "Matched",
    admin: "Matched",
    status: "Clean",
    issue: "Client booking, provider visit, Stripe charge, and bank payout all match.",
    next: "Ready for monthly close and provider performance reporting.",
    metadata: ["appointment_id", "client_id", "provider_id", "stripe_charge_id", "service_type"],
  },
  {
    id: "kit_8842",
    stripe: "ch_clipt_1002",
    payout: "po_spk_7721",
    customer: "A. Johnson",
    provider: "Nurse applicant",
    category: "Provider Foot-Care Kit",
    gross: 349,
    fee: 11,
    net: 338,
    bank: "Matched",
    admin: "Missing kit reference",
    status: "Kit Gap",
    issue: "Stripe payment exists for a provider kit, but the admin export does not show kit_order_id or fulfillment status.",
    next: "Ask dev team to expose kit_order_id, kit_status, and provider_id in the admin export.",
    metadata: ["stripe_charge_id", "provider_id", "missing_kit_order_id"],
  },
  {
    id: "sub_2026_05_19",
    stripe: "in_clipt_1003",
    payout: "po_spk_7728",
    customer: "Provider Portal Plan",
    provider: "Nurse R. Smith",
    category: "Provider Subscription",
    gross: 99,
    fee: 3,
    net: 96,
    bank: "Pending",
    admin: "Active subscription",
    status: "Timing Review",
    issue: "Provider subscription is active in the admin panel, but the Stripe payout has not landed in US Bank yet.",
    next: "Do not force-match. Check next payout batch before month-end close.",
    metadata: ["subscription_id", "provider_id", "stripe_invoice_id"],
  },
  {
    id: "payout_6710",
    stripe: "tr_clipt_1004",
    payout: "po_spk_7729",
    customer: "Provider earnings",
    provider: "Nurse L. Brooks",
    category: "Commission / Provider Payout",
    gross: 750,
    fee: 22,
    net: 728,
    bank: "Matched",
    admin: "Wrong category",
    status: "Payout Tax Risk",
    issue: "Admin panel classifies this as Training, but Stripe/ledger metadata indicates a provider commission payout.",
    next: "Correct category and make sure payout classification flows into provider tax reports.",
    metadata: ["provider_id", "commission_source", "tax_report_category_conflict"],
  },
  {
    id: "appt_24077",
    stripe: "ch_clipt_1005",
    payout: "po_spk_7730",
    customer: "N. Williams",
    provider: "Dr. Patel / Podiatry Visit",
    category: "Diabetic Foot Care Visit",
    gross: 240,
    fee: 8,
    net: 232,
    bank: "Matched",
    admin: "Refund missing",
    status: "Refund Review",
    issue: "Stripe shows a partial refund after a cancelled/rescheduled visit, but the admin panel still shows the original full appointment amount.",
    next: "Update refund_status and refunded_amount. Confirm P&L uses net recognized visit revenue.",
    metadata: ["appointment_id", "refund_id", "reschedule_status", "provider_id"],
  },
  {
    id: "cash_4412",
    stripe: "cash_logged",
    payout: "no_stripe_payout",
    customer: "Facility visit batch",
    provider: "Nurse Maria S.",
    category: "Cash Visit Payment",
    gross: 420,
    fee: 0,
    net: 420,
    bank: "Unmatched deposit",
    admin: "Cash recorded",
    status: "Cash Reconcile",
    issue: "Provider app allows cash payments. Cash was recorded in the provider workflow, but no matching bank deposit or deposit batch reference is attached.",
    next: "Create cash_deposit_batch_id and require deposit confirmation before close.",
    metadata: ["cash_payment", "facility_visit", "provider_id", "missing_deposit_batch"],
  },
];

const exceptions = [
  {
    id: "ex_provider_payout_tax",
    issue: "Provider payout / tax report mismatch",
    count: 4,
    severity: "High",
    owner: "Bookkeeper + Dev",
    detail: "Provider earnings exist, but payout category or provider tax-report linkage is unclear.",
    impact: "Nurse salary/commission reporting can become unreliable, which is exactly the pain hinted by the engineering post.",
    fix: "Expose provider_id, payout_type, commission_source, gross_provider_earnings, platform_fee, net_provider_payout, and tax_report_category.",
  },
  {
    id: "ex_admin_missing",
    issue: "Appointment payment missing admin context",
    count: 3,
    severity: "High",
    owner: "Bookkeeper + Dev",
    detail: "Stripe charges exist, but the admin export does not clearly show appointment, client, provider, or service type.",
    impact: "Money exists in Stripe and bank, but the care platform cannot explain which foot-care visit or provider generated it.",
    fix: "Expose appointment_id, client_id, provider_id, service_type, visit_status, and stripe_charge_id in one export.",
  },
  {
    id: "ex_kit_missing",
    issue: "Kit disbursement not tied to provider",
    count: 3,
    severity: "High",
    owner: "Ops + Dev",
    detail: "Provider kit payments or disbursements appear in Stripe/admin records, but kit fulfillment references are missing.",
    impact: "Hardware revenue and provider onboarding costs become hard to audit.",
    fix: "Add kit_order_id, kit_status, shipped_date, provider_id, and amount_collected to exports.",
  },
  {
    id: "ex_cash_payment",
    issue: "Cash visit payments need deposit proof",
    count: 2,
    severity: "Medium",
    owner: "Bookkeeper + Ops",
    detail: "Provider app can record app or cash payments, but cash needs a separate deposit-control workflow.",
    impact: "Cash revenue may be recorded operationally but not reconciled to bank deposits.",
    fix: "Add cash_deposit_batch_id, deposited_by, deposit_date, and bank_match_status.",
  },
  {
    id: "ex_refund_missing",
    issue: "Refund / reschedule not reflected",
    count: 2,
    severity: "Medium",
    owner: "Bookkeeper + Dev",
    detail: "Stripe refund exists after cancellation/reschedule, but the admin panel still shows the full appointment payment.",
    impact: "Visit revenue can be overstated and provider payout calculations can be wrong.",
    fix: "Add refund_status, refund_id, refunded_amount, cancellation_reason, and reschedule_reference.",
  },
];

const devFixes = [
  { field: "appointment_id", type: "string", why: "Tie payment to the exact in-home foot-care visit", priority: "High", status: "Required" },
  { field: "provider_id", type: "string", why: "Connect payments, commissions, route work, and tax reports to the nurse/provider", priority: "High", status: "Required" },
  { field: "stripe_charge_id", type: "string", why: "Match admin records to Stripe payments", priority: "High", status: "Required" },
  { field: "stripe_payout_id", type: "string", why: "Tie Stripe payments to exact US Bank deposits", priority: "High", status: "Required" },
  { field: "service_type", type: "enum", why: "Separate toenail care, diabetic foot care, callus/corn, fungal treatment, facility visit", priority: "Medium", status: "Missing" },
  { field: "kit_order_id", type: "string", why: "Connect provider kit payment/disbursement to fulfillment", priority: "High", status: "Missing" },
  { field: "provider_payout_type", type: "enum", why: "Separate salary, commission, reimbursement, bonus, platform adjustment", priority: "High", status: "Partial" },
  { field: "cash_deposit_batch_id", type: "string", why: "Reconcile provider-recorded cash payments to bank deposits", priority: "Medium", status: "Missing" },
  { field: "tax_report_category", type: "enum", why: "Support provider payout/tax reporting", priority: "High", status: "Partial" },
  { field: "export_generated_at", type: "datetime", why: "Know which report version was reconciled", priority: "Low", status: "Nice to have" },
];

const closeSteps = [
  { title: "Import Stripe charges/invoices", detail: "Load client payments, provider subscriptions, refunds, fees, invoices, and metadata.", done: true, owner: "Bookkeeper" },
  { title: "Import Stripe payouts / transfers", detail: "Group client payments and provider payouts into payout batches and arrival dates.", done: true, owner: "Bookkeeper" },
  { title: "Import US Bank feed", detail: "Match Stripe net payouts and cash deposits to bank deposits.", done: true, owner: "Bookkeeper" },
  { title: "Import Clipt admin export", detail: "Verify appointment, service type, provider, kit, subscription, and payout context.", done: true, owner: "Bookkeeper" },
  { title: "Resolve care-platform exceptions", detail: "Investigate appointment gaps, cash payments, kits, provider payouts, timing gaps, and refunds.", done: false, owner: "Bookkeeper + Dev" },
  { title: "Prepare monthly P&L", detail: "Produce clean gross/net revenue by visit, training, kit, subscription, and platform share.", done: false, owner: "Bookkeeper" },
  { title: "Provider payout/tax review", detail: "Send clean payout classification for CPA/accounting review.", done: false, owner: "CPA/Owner" },
];

const normalizedFields = [
  { field: "event_id", example: "evt_2026_05_apt_24051", meaning: "One unique row for every money-related event" },
  { field: "event_type", example: "charge / refund / payout / transfer / cash", meaning: "What kind of financial movement this is" },
  { field: "source_system", example: "Stripe / US Bank / Clipt Admin / Provider App", meaning: "Where the record came from" },
  { field: "stripe_charge_id", example: "ch_clipt_1001", meaning: "Exact card payment in Stripe" },
  { field: "stripe_payout_id", example: "po_spk_7721", meaning: "Stripe batch that landed in US Bank" },
  { field: "stripe_transfer_id", example: "tr_clipt_1004", meaning: "Provider payout / Stripe Connect movement if used" },
  { field: "bank_txn_id", example: "usbank_dep_5591", meaning: "Actual bank deposit or debit reference" },
  { field: "appointment_id", example: "appt_24051", meaning: "Care visit or client booking" },
  { field: "provider_id", example: "prov_elena_r", meaning: "Nurse/provider connected to visit, subscription, kit, or payout" },
  { field: "category", example: "Visit / Training / Kit / Subscription / Commission / Refund", meaning: "Where it appears in reports" },
  { field: "gross_amount", example: "$165", meaning: "Customer/provider amount before fees" },
  { field: "fee_amount", example: "$6", meaning: "Stripe/platform/bank fee if applicable" },
  { field: "net_amount", example: "$159", meaning: "Actual amount after fees" },
  { field: "match_status", example: "matched / timing / missing_admin / missing_bank", meaning: "Whether the money trail is proven" },
  { field: "review_status", example: "open / reviewed / resolved / sent_to_dev", meaning: "Human workflow state" },
];

const dataRequests = [
  { source: "Stripe Charges / Invoices", needed: "id, created, amount, fees, net, customer, metadata, balance_transaction, refund fields", why: "Proves each card payment and its Stripe fee/refund trail", sensitivity: "Payment data" },
  { source: "Stripe Payouts", needed: "payout_id, arrival_date, status, amount, net, related balance transactions", why: "Connects individual payments to the exact US Bank deposit", sensitivity: "Payment data" },
  { source: "Stripe Transfers / Connect", needed: "transfer_id, destination/provider account, source_transaction, amount, application_fee", why: "Needed if providers/nurses are paid through Stripe Connect", sensitivity: "Provider payout data" },
  { source: "US Bank CSV", needed: "date, description, amount, reference, account, running balance if available", why: "Confirms money actually landed or left the bank", sensitivity: "Banking data" },
  { source: "Clipt Appointments Export", needed: "appointment_id, client_id, provider_id, service_type, visit_status, price, payment_method, stripe_charge_id", why: "Explains what each visit payment belongs to", sensitivity: "Care operations data" },
  { source: "Provider / Commission Export", needed: "provider_id, payout type, commission rate, amount owed, status, transfer ID, tax category", why: "Prevents provider payout and tax report confusion", sensitivity: "Provider earnings data" },
  { source: "Kits / Training / Subscriptions", needed: "provider_id, kit_order_id, training_id, subscription_id, amount, status, Stripe reference", why: "Separates onboarding revenue/costs from client visit revenue", sensitivity: "Business operations data" },
  { source: "Cash Payment Log", needed: "appointment_id, provider_id, cash_amount, receipt, deposit_batch_id, deposit_date", why: "Cash cannot be matched through Stripe, so it needs deposit proof", sensitivity: "Cash controls" },
];

const automationLevels = [
  { level: "Level 1", title: "Manual Control Sheet", cost: "Lowest", trust: "Low-Medium", bestFor: "First audit / proving the workflow", description: "CSV exports are pasted or imported into Sheets/Excel. Matching uses formulas and human review. Fast to start, but easy to break." },
  { level: "Level 2", title: "Semi-Automated Reconciliation", cost: "Medium", trust: "Medium-High", bestFor: "Weekly close with repeatable rules", description: "Scripts normalize CSVs, run matching rules, flag exceptions, refresh the dashboard, and generate dev-gap reports." },
  { level: "Level 3", title: "Full API Integration", cost: "Highest", trust: "High", bestFor: "Future mature operating system", description: "Stripe API, bank feed, and Clipt admin/API sync into a database. Near-real-time dashboard, audit trail, and alerts." },
];

const navSections = [
  {
    title: "Core Ops",
    items: [
      { id: "overview", label: "Overview", icon: BarChart3 },
      { id: "reconcile", label: "Reconcile", icon: SearchCheck },
      { id: "exceptions", label: "Care Ops Gaps", icon: AlertTriangle, badge: "14" },
    ],
  },
  {
    title: "System",
    items: [
      { id: "data", label: "Data Model", icon: Database },
      { id: "requests", label: "Data Requests", icon: UploadCloud },
      { id: "dev", label: "Dev Fixes", icon: Settings2, badge: "10" },
      { id: "automation", label: "Automation / AI", icon: PlugZap },
    ],
  },
  {
    title: "Reporting",
    items: [
      { id: "close", label: "Close Workflow", icon: ClipboardCheck, badge: "3 open" },
      { id: "report", label: "P&L Report", icon: FileSpreadsheet },
    ],
  },
];

const tabs = navSections.flatMap((section) => section.items);

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white/85 shadow-sm backdrop-blur ${className}`}>{children}</div>;
}

function Pill({ children, tone = "slate" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    blue: "bg-sky-50 text-sky-700 ring-sky-200",
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
    dark: "bg-slate-900 text-white ring-slate-800",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tones[tone]}`}>{children}</span>;
}

function toneForStatus(status) {
  if (status === "Clean" || status === "Required") return "green";
  if (status === "Kit Gap" || status === "High" || status === "Missing" || status === "Payout Tax Risk") return "red";
  if (status === "Timing Review" || status === "Needs Fix" || status === "Refund Review" || status === "Medium" || status === "Partial" || status === "Cash Reconcile") return "amber";
  return "slate";
}

function FlowBox({ icon: Icon, title, subtitle, tone = "green", active, onClick }) {
  const toneClass = tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "blue" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700";
  return (
    <button onClick={onClick} className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}>
      <div className={`shrink-0 rounded-lg p-1.5 ${toneClass}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold text-slate-900">{title}</div>
        <div className="truncate text-[11px] text-slate-500">{subtitle}</div>
      </div>
    </button>
  );
}

function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }) {
  return (
    <aside className={`sticky top-6 h-[calc(100vh-3rem)] shrink-0 overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950 text-slate-200 shadow-2xl transition-all duration-300 ${collapsed ? "w-20" : "w-72"}`}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
              <HeartPulse size={22} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-white">Clipt Care</div>
                <div className="truncate text-xs text-slate-400">Money Truth Demo</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronRight size={17} className={`transition ${collapsed ? "" : "rotate-180"}`} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto p-3">
          {navSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={collapsed ? item.label : ""}
                      className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/40" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                    >
                      <Icon size={19} className="shrink-0" />
                      {!collapsed && <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? "bg-white/20 text-white" : "bg-rose-500 text-white"}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className={`rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 ${collapsed ? "text-center" : ""}`}>
            <div className="flex items-center gap-2 text-emerald-300">
              <ShieldCheck size={18} className="shrink-0" />
              {!collapsed && <span className="text-xs font-medium text-slate-300">Environment</span>}
            </div>
            {!collapsed && (
              <>
                <div className="mt-1 text-sm font-bold text-white">Presentation Demo</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Self-contained prototype
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function DetailPanel({ transaction }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Selected event</div>
          <h3 className="mt-0.5 text-base font-bold">{transaction.id}</h3>
          <p className="text-xs text-slate-500">{transaction.customer} · {transaction.provider}</p>
          <p className="text-xs text-slate-400">{transaction.category}</p>
        </div>
        <Pill tone={toneForStatus(transaction.status)}>{transaction.status}</Pill>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="text-[11px] text-slate-500">Gross</div>
          <div className="mt-0.5 text-sm font-bold">{money.format(transaction.gross)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="text-[11px] text-slate-500">Stripe Fee</div>
          <div className="mt-0.5 text-sm font-bold">{money.format(transaction.fee)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="text-[11px] text-slate-500">Net</div>
          <div className="mt-0.5 text-sm font-bold">{money.format(transaction.net)}</div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-1 text-xs font-semibold">What the click reveals</div>
          <p className="text-xs text-slate-600">{transaction.issue}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-1 text-xs font-semibold">Next action</div>
          <p className="text-xs text-slate-600">{transaction.next}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">Metadata found / missing</div>
        <div className="flex flex-wrap gap-1.5">
          {transaction.metadata.map((item) => <Pill key={item} tone="slate">{item}</Pill>)}
        </div>
      </div>
    </Card>
  );
}

function TransactionTable({ selectedId, setSelectedId }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold">Clipt Reconciliation Table</h2>
          <p className="text-sm text-slate-500">Click a row to inspect visit, kit, subscription, cash, or provider payout issues.</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Filter size={16} /> Filter</button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"><Download size={16} /> Export gap report</button>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Event</th>
              <th className="hidden p-3 lg:table-cell">Stripe</th>
              <th className="hidden p-3 xl:table-cell">Payout</th>
              <th className="hidden p-3 md:table-cell">Client / Source</th>
              <th className="hidden p-3 lg:table-cell">Provider</th>
              <th className="p-3">Category</th>
              <th className="hidden p-3 md:table-cell">Gross</th>
              <th className="p-3">Net</th>
              <th className="hidden p-3 md:table-cell">Bank</th>
              <th className="hidden p-3 lg:table-cell">Admin</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {transactions.map((row) => (
              <tr key={row.id} onClick={() => setSelectedId(row.id)} className={`cursor-pointer transition hover:bg-slate-50 ${selectedId === row.id ? "bg-slate-50" : ""}`}>
                <td className="p-3 font-mono text-xs font-semibold">{row.id}</td>
                <td className="hidden p-3 font-mono text-xs text-slate-500 lg:table-cell">{row.stripe}</td>
                <td className="hidden p-3 font-mono text-xs text-slate-500 xl:table-cell">{row.payout}</td>
                <td className="hidden p-3 md:table-cell">{row.customer}</td>
                <td className="hidden p-3 lg:table-cell">{row.provider}</td>
                <td className="p-3">{row.category}</td>
                <td className="hidden p-3 md:table-cell">{money.format(row.gross)}</td>
                <td className="p-3">{money.format(row.net)}</td>
                <td className="hidden p-3 md:table-cell">{row.bank}</td>
                <td className="hidden p-3 lg:table-cell">{row.admin}</td>
                <td className="p-3"><Pill tone={toneForStatus(row.status)}>{row.status}</Pill></td>
                <td className="p-3 text-slate-400"><ChevronRight size={16} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Overview({ selectedFlow, setSelectedFlow, setActiveTab }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.button
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              onClick={() => kpi.label === "Open Exceptions" ? setActiveTab("exceptions") : setActiveTab("report")}
              className="text-left"
            >
              <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{kpi.label}</div>
                    <div className="mt-2 text-2xl font-bold">{kpi.display}</div>
                    <div className="mt-1 text-xs text-slate-500">{kpi.note}</div>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><Icon size={20} /></div>
                </div>
              </Card>
            </motion.button>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Clipt Money Flow Match</h2>
            <p className="text-sm text-slate-500">Click each block to see the platform layer being tested.</p>
          </div>
          <Pill tone="amber">Provider payout/tax gaps open</Pill>
        </div>
        <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
          <FlowBox icon={Home} title="Client App Bookings" subtitle="In-home foot care + facility visits" tone="blue" active={selectedFlow === "client"} onClick={() => setSelectedFlow("client")} />
          <ArrowRight className="hidden text-slate-400 lg:block" />
          <FlowBox icon={Stethoscope} title="Provider App" subtitle="Nurses, routes, visits, app/cash payments" tone="blue" active={selectedFlow === "provider"} onClick={() => setSelectedFlow("provider")} />
          <ArrowRight className="hidden text-slate-400 lg:block" />
          <FlowBox icon={WalletCards} title="Stripe / Payouts" subtitle="Payments, subscriptions, commissions" tone="green" active={selectedFlow === "stripe"} onClick={() => setSelectedFlow("stripe")} />
          <ArrowRight className="hidden text-slate-400 lg:block" />
          <FlowBox icon={Banknote} title="US Bank" subtitle="$40,314 matched / pending" tone="green" active={selectedFlow === "bank"} onClick={() => setSelectedFlow("bank")} />
          <ArrowRight className="hidden text-slate-400 lg:block" />
          <FlowBox icon={Database} title="Admin Site" subtitle="14 care-finance records need review" tone="amber" active={selectedFlow === "admin"} onClick={() => setSelectedFlow("admin")} />
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          {selectedFlow === "client" && "Client App layer tests booking → service selected → scheduled appointment → secure payment → feedback. Financial risk: cancellations, refunds, reschedules, and facility bookings not syncing cleanly."}
          {selectedFlow === "provider" && "Provider App layer tests nurse/provider, route, appointment completion, cash/app payment, invoice, and payout context. Financial risk: provider payout and tax reporting needs exact provider-event linkage."}
          {selectedFlow === "stripe" && "Stripe layer checks charges, subscriptions, invoices, transfers, fees, refunds, and payout timing. The key question: which exact care event or provider payout does this Stripe object belong to?"}
          {selectedFlow === "bank" && "US Bank layer confirms whether Stripe net payouts and cash deposits actually landed. This catches timing gaps, unmatched cash deposits, and batch deposit confusion."}
          {selectedFlow === "admin" && "Admin Site layer explains the business meaning: appointment, provider, service type, kit, subscription, commission, payout, and tax/reporting category."}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Clipt Revenue / Payout Streams</h2>
              <p className="text-sm text-slate-500">Care-platform categories based on public Clipt context + job post pain.</p>
            </div>
            <LineChart size={22} className="text-slate-500" />
          </div>
          <div className="space-y-4">
            {streams.map((stream) => (
              <button key={stream.name} onClick={() => setActiveTab("report")} className="w-full rounded-2xl p-2 text-left transition hover:bg-slate-50">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{stream.name}</span>
                  <span className="text-slate-500">{money.format(stream.amount)} · {stream.pct}% · {stream.trend}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-900" style={{ width: `${stream.pct}%` }} />
                </div>
                <div className="mt-1 text-xs text-slate-500">Clean match rate: {stream.clean}%</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Close Readiness</h2>
              <p className="text-sm text-slate-500">Care-tech bookkeeping health.</p>
            </div>
            <Gauge size={22} className="text-slate-500" />
          </div>
          <div className="space-y-3">
            {closeSteps.slice(0, 5).map((step) => (
              <button key={step.title} onClick={() => setActiveTab("close")} className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-slate-100">
                {step.done ? <CheckCircle2 className="text-emerald-600" size={18} /> : <AlertTriangle className="text-amber-600" size={18} />}
                <span className="text-sm font-medium">{step.title}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Reconcile({ selectedId, setSelectedId }) {
  const selected = transactions.find((t) => t.id === selectedId) || transactions[0];
  return (
    <div className="grid gap-4 2xl:grid-cols-[1.6fr_1fr]">
      <TransactionTable selectedId={selectedId} setSelectedId={setSelectedId} />
      <DetailPanel transaction={selected} />
    </div>
  );
}

function Exceptions({ selectedExceptionId, setSelectedExceptionId }) {
  const selected = exceptions.find((item) => item.id === selectedExceptionId) || exceptions[0];
  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Care-Finance Gap Queue</h2>
            <p className="text-sm text-slate-500">Click a problem type to see impact and fix path.</p>
          </div>
          <SearchCheck size={22} className="text-slate-500" />
        </div>
        <div className="space-y-3">
          {exceptions.map((item) => (
            <button key={item.id} onClick={() => setSelectedExceptionId(item.id)} className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${selectedExceptionId === item.id ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{item.issue}</div>
                  <div className="mt-1 text-sm text-slate-500">{item.detail}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{item.count}</div>
                  <Pill tone={toneForStatus(item.severity)}>{item.severity}</Pill>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Gap detail</div>
            <h2 className="mt-1 text-2xl font-bold">{selected.issue}</h2>
            <p className="mt-1 text-sm text-slate-500">Owner: {selected.owner}</p>
          </div>
          <Pill tone={toneForStatus(selected.severity)}>{selected.severity}</Pill>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle size={18} /> Why it matters</div>
            <p className="text-sm text-slate-600">{selected.impact}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold"><Settings2 size={18} /> Fix path</div>
            <p className="text-sm text-slate-600">{selected.fix}</p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-white">
          <div className="mb-2 text-sm font-semibold">What you would tell Clipt/dev team</div>
          <p className="text-sm text-slate-300">“This is not just a bookkeeping issue. It is a care-platform source-of-truth issue. The payment or payout exists, but the admin site does not expose enough appointment, provider, kit, or tax context to prove what it belongs to. Add the missing fields, then this exception class becomes automatically reconcilable.”</p>
        </div>
      </Card>
    </div>
  );
}

function DevFixes() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Clipt Admin Export Requirements</h2>
            <p className="text-sm text-slate-500">Fields needed so bookkeeping, provider payout, and tax reports stop guessing.</p>
          </div>
          <Settings2 size={22} className="text-slate-500" />
        </div>
        <div className="rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Field</th>
                <th className="hidden p-3 md:table-cell">Type</th>
                <th className="hidden p-3 lg:table-cell">Why needed</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {devFixes.map((fix) => (
                <tr key={fix.field} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs font-semibold text-slate-800">{fix.field}</td>
                  <td className="hidden p-3 text-slate-500 md:table-cell">{fix.type}</td>
                  <td className="hidden p-3 text-slate-600 lg:table-cell">{fix.why}</td>
                  <td className="p-3"><Pill tone={toneForStatus(fix.priority)}>{fix.priority}</Pill></td>
                  <td className="p-3"><Pill tone={toneForStatus(fix.status)}>{fix.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-bold"><PlugZap size={20} /> Best export shape</div>
          <p className="text-sm text-slate-600">The admin site should export one row per financial event: appointment payment, provider payout, kit payment/disbursement, subscription invoice, refund, or cash deposit. Each row should connect the client, provider, Stripe object, bank deposit, and care event.</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-bold"><LockKeyhole size={20} /> Control rule</div>
          <p className="text-sm text-slate-600">No Clipt financial event should reach monthly close unless it has a provider/client context, Stripe or cash reference, revenue/payout category, and match status. Anything incomplete goes to the gap queue.</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-bold"><Layers3 size={20} /> Automation path</div>
          <div className="space-y-2 text-sm text-slate-600">
            <div>1. Manual exports first: Stripe, US Bank, Clipt admin.</div>
            <div>2. Scripted cleanup/matching for weekly close.</div>
            <div>3. API connection once fields are reliable.</div>
            <div>4. Optional write-back only after controls are trusted.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function CloseWorkflow() {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Weekly/Monthly Close Workflow</h2>
            <p className="text-sm text-slate-500">The operating process behind the Clipt finance cockpit.</p>
          </div>
          <ClipboardCheck size={22} className="text-slate-500" />
        </div>
        <div className="space-y-3">
          {closeSteps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${step.done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{index + 1}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{step.title}</div>
                    {step.done ? <Pill tone="green">Done</Pill> : <Pill tone="amber">Open</Pill>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{step.detail}</p>
                  <div className="mt-2 text-xs text-slate-400">Owner: {step.owner}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Data Import Control</h2>
              <p className="text-sm text-slate-500">What the weekly workflow could feel like.</p>
            </div>
            <UploadCloud size={22} className="text-slate-500" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {["Stripe charges/invoices", "Stripe payouts/transfers", "US Bank deposits", "Clipt admin export", "Provider app visit/payment log", "Kit/subscription export"].map((item, idx) => (
              <div key={item} className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <div className="mb-2 flex items-center gap-2 font-semibold"><UploadCloud size={18} /> {item}</div>
                <div className="text-sm text-slate-500">{idx < 3 ? "Imported · schema valid" : idx === 3 ? "Imported · 14 warnings" : "Optional · improves matching"}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-bold"><ListChecks size={20} /> Matching logic</div>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 p-3">Stripe charge ID matches Clipt appointment/payment reference.</div>
            <div className="rounded-xl bg-slate-50 p-3">Provider ID connects appointment revenue to nurse/provider payout and tax category.</div>
            <div className="rounded-xl bg-slate-50 p-3">Stripe payout ID groups charges into net US Bank deposits.</div>
            <div className="rounded-xl bg-slate-50 p-3">Cash payments require deposit batch proof, not just provider app notes.</div>
            <div className="rounded-xl bg-slate-50 p-3">Kit and subscription records must tie to provider onboarding and active provider status.</div>
            <div className="rounded-xl bg-slate-50 p-3">Anything missing becomes a care-finance gap, not a silent bookkeeping mistake.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function DataModel() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Normalized Financial Event Table</h2>
            <p className="text-sm text-slate-500">The bridge layer: every source becomes one money-event format before matching.</p>
          </div>
          <Database size={22} className="text-slate-500" />
        </div>
        <div className="rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Field</th>
                <th className="hidden p-3 md:table-cell">Example</th>
                <th className="p-3">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {normalizedFields.map((row) => (
                <tr key={row.field} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs font-semibold text-slate-800">{row.field}</td>
                  <td className="hidden p-3 font-mono text-xs text-slate-500 md:table-cell">{row.example}</td>
                  <td className="p-3 text-slate-600">{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-bold"><Layers3 size={20} /> Real architecture</div>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 p-3">1. Read Stripe, bank, and Clipt/admin exports.</div>
            <div className="rounded-xl bg-slate-50 p-3">2. Convert every row into a financial_event record.</div>
            <div className="rounded-xl bg-slate-50 p-3">3. Match by strong IDs first, then amount/date only as fallback.</div>
            <div className="rounded-xl bg-slate-50 p-3">4. Anything unproven becomes an exception, not a guessed result.</div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-bold"><ShieldCheck size={20} /> Anti-hallucination rule</div>
          <p className="text-sm text-slate-600">The system should never invent a match. If no Stripe ID, bank reference, appointment ID, provider ID, or deposit proof exists, the row stays open for human review.</p>
        </Card>
      </div>
    </div>
  );
}

function DataRequests() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">What to Request From Clipt First</h2>
            <p className="text-sm text-slate-500">Start with sanitized CSV samples, not full production access.</p>
          </div>
          <UploadCloud size={22} className="text-slate-500" />
        </div>
        <div className="rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Source</th>
                <th className="hidden p-3 lg:table-cell">Needed fields</th>
                <th className="p-3">Why</th>
                <th className="p-3">Sensitivity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {dataRequests.map((row) => (
                <tr key={row.source} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">{row.source}</td>
                  <td className="hidden p-3 text-slate-600 lg:table-cell">{row.needed}</td>
                  <td className="p-3 text-slate-600">{row.why}</td>
                  <td className="p-3"><Pill tone="amber">{row.sensitivity}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-bold"><LockKeyhole size={20} /> Safe first ask</div>
          <p className="text-sm text-slate-600">Ask for 20–50 anonymized rows covering each flow: visit payment, provider payout, kit, training, subscription, refund, cash payment, and bank deposit. No full login needed at the discovery stage.</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-bold"><FileSpreadsheet size={20} /> Sample message</div>
          <p className="text-sm text-slate-600">“Could you send sanitized sample exports from Stripe, US Bank, and the Clipt admin panel? I only need enough rows to map customer payment → Stripe charge → payout/transfer → bank deposit → appointment/provider/category.”</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-bold"><AlertTriangle size={20} /> Red flag</div>
          <p className="text-sm text-slate-600">If the admin panel cannot export provider_id, appointment_id, Stripe IDs, payout IDs, or category fields, the system problem is real — and the dev-gap report becomes the main deliverable.</p>
        </Card>
      </div>
    </div>
  );
}

function AutomationDecision() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {automationLevels.map((item) => (
          <Card key={item.level} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <Pill tone={item.level === "Level 1" ? "amber" : item.level === "Level 2" ? "green" : "blue"}>{item.level}</Pill>
              <PlugZap size={20} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between rounded-xl bg-slate-50 p-3"><span className="text-slate-500">Cost</span><span className="font-semibold">{item.cost}</span></div>
              <div className="flex justify-between rounded-xl bg-slate-50 p-3"><span className="text-slate-500">Trust</span><span className="font-semibold">{item.trust}</span></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-500">Best for: </span><span className="font-semibold">{item.bestFor}</span></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">What should be automated without AI</h2>
              <p className="text-sm text-slate-500">These are accounting-control tasks. They should be deterministic and auditable.</p>
            </div>
            <PlugZap size={22} className="text-slate-500" />
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            {[
              "Import Stripe charges, invoices, transfers, payouts, refunds, and disputes.",
              "Import US Bank deposits and match by amount, date, descriptor, trace ID, and payout ID.",
              "Import Clipt admin exports for appointments, providers, kits, subscriptions, training, and cash payments.",
              "Normalize IDs, dates, statuses, amounts, and categories into one financial_event table.",
              "Run exact matching: appointment → Stripe charge → payout/transfer → bank deposit.",
              "Flag exceptions: missing provider ID, missing kit order, cash deposit proof missing, refund mismatch, wrong category.",
              "Generate P&L draft, close-readiness score, exception queue, and dev-gap report."
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 p-4">{item}</div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Where AI is allowed</h2>
              <p className="text-sm text-slate-500">AI should assist the reviewer, not decide the books.</p>
            </div>
            <ShieldCheck size={22} className="text-slate-500" />
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            {[
              "Summarize exception clusters into plain-English notes for the owner/dev team.",
              "Suggest likely categories only when rules fail, with confidence and human approval required.",
              "Detect suspicious patterns: unusual fee rates, delayed payouts, duplicate-looking records, provider payout outliers.",
              "Draft developer tickets from repeated data gaps, such as missing provider_id or stripe_payout_id.",
              "Draft monthly commentary: what changed, what is blocked, and what should be fixed next."
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 p-4">{item}</div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-white">
            <div className="mb-2 text-sm font-semibold">Control rule</div>
            <p className="text-sm text-slate-300">AI can explain, suggest, and prioritize. It should not finalize reconciliations, tax categories, provider payouts, refunds, or P&L numbers without human review.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PLReport() {
  const totalGross = streams.reduce((sum, item) => sum + item.amount, 0);
  const fees = 2146;
  const refunds = 1240;
  const providerPayouts = 18650;
  const netRevenue = totalGross - fees - refunds - providerPayouts;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Clipt Monthly P&L Draft</h2>
            <p className="text-sm text-slate-500">Management view before CPA/accounting review.</p>
          </div>
          <FileSpreadsheet size={22} className="text-slate-500" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-200 bg-white">
              {streams.map((item) => (
                <tr key={item.name}>
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4 text-right font-semibold">{money.format(item.amount)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td className="p-4 font-bold">Gross Revenue / Collections</td>
                <td className="p-4 text-right font-bold">{money.format(totalGross)}</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-600">Less: Stripe Fees</td>
                <td className="p-4 text-right font-semibold text-slate-600">-{money.format(fees)}</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-600">Less: Refunds / Reschedules</td>
                <td className="p-4 text-right font-semibold text-slate-600">-{money.format(refunds)}</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-600">Less: Provider Payouts</td>
                <td className="p-4 text-right font-semibold text-slate-600">-{money.format(providerPayouts)}</td>
              </tr>
              <tr className="bg-slate-900 text-white">
                <td className="p-4 font-bold">Net Management View</td>
                <td className="p-4 text-right font-bold">{money.format(netRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 font-bold"><BarChart3 size={20} /> Owner dashboard notes</div>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 p-3">In-home visit payments are the largest collection stream and need appointment/provider matching.</div>
            <div className="rounded-xl bg-slate-50 p-3">Provider training, kits, subscriptions, and commissions should not be mixed with patient visit revenue.</div>
            <div className="rounded-xl bg-slate-50 p-3">Provider payout/tax classification is the highest-risk gap because it affects nurses/providers directly.</div>
            <div className="rounded-xl bg-slate-50 p-3">Cash payments need a deposit-control workflow separate from Stripe.</div>
            <div className="rounded-xl bg-slate-50 p-3">14 exceptions must be cleared before final close.</div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-bold"><ShieldCheck size={20} /> Safe positioning</div>
          <p className="text-sm text-slate-600">This is a reconciled management view, not final tax advice. Washington State-specific treatment, healthcare/privacy considerations, and provider tax reporting should be reviewed with Clipt’s CPA/accounting lead.</p>
        </Card>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedId, setSelectedId] = useState("kit_8842");
  const [selectedExceptionId, setSelectedExceptionId] = useState("ex_provider_payout_tax");
  const [selectedFlow, setSelectedFlow] = useState("provider");

  const activeTitle = useMemo(() => tabs.find((tab) => tab.id === activeTab)?.label || "Overview", [activeTab]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-white">
            <HeartPulse size={16} />
          </div>
          <span className="text-sm font-bold">Clipt Care</span>
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
        >
          {sidebarCollapsed ? "Menu" : "Close"}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 z-20 bg-slate-950/60 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}
      {!sidebarCollapsed && (
        <div className="fixed inset-y-0 left-0 z-20 w-72 md:hidden">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => { setActiveTab(tab); setSidebarCollapsed(true); }}
            collapsed={false}
            setCollapsed={setSidebarCollapsed}
          />
        </div>
      )}

      <div className="mx-auto flex max-w-[1600px] gap-4 p-4">
        <div className="hidden md:block">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />
        </div>

        <main className="min-w-0 flex-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl"
          >
            <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck size={13} /> Clipt Care · finance ops demo
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-slate-500">Sample data only — not connected to Clipt systems</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Clipt Care Money Truth Cockpit</h1>
                <p className="mt-1 max-w-xl text-xs text-slate-400">
                  Reconcile visits, payouts, kits, subscriptions, cash, Stripe, and US Bank into one weekly close workflow.
                </p>
              </div>
              <div className="flex gap-2 md:flex-col md:items-end lg:flex-row">
                <button onClick={() => setActiveTab("overview")} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-left transition hover:bg-white/15">
                  <div className="text-base font-bold text-emerald-300">91%</div>
                  <div className="text-xs text-slate-400">Matched</div>
                </button>
                <button onClick={() => setActiveTab("exceptions")} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-left transition hover:bg-white/15">
                  <div className="text-base font-bold text-amber-300">14</div>
                  <div className="text-xs text-slate-400">Gaps</div>
                </button>
                <button onClick={() => setActiveTab("close")} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-left transition hover:bg-white/15">
                  <div className="text-base font-bold text-sky-300">May 2026</div>
                  <div className="text-xs text-slate-400">Close</div>
                </button>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Current view</div>
              <h2 className="text-xl font-bold">{activeTitle}</h2>
            </div>
            <div className="hidden items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs text-slate-500 shadow-sm md:flex">
              <Search size={14} /> Use the sidebar, cards, and rows to drill down.
            </div>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {activeTab === "overview" && <Overview selectedFlow={selectedFlow} setSelectedFlow={setSelectedFlow} setActiveTab={setActiveTab} />}
            {activeTab === "reconcile" && <Reconcile selectedId={selectedId} setSelectedId={setSelectedId} />}
            {activeTab === "exceptions" && <Exceptions selectedExceptionId={selectedExceptionId} setSelectedExceptionId={setSelectedExceptionId} />}
            {activeTab === "data" && <DataModel />}
            {activeTab === "requests" && <DataRequests />}
            {activeTab === "dev" && <DevFixes />}
            {activeTab === "close" && <CloseWorkflow />}
            {activeTab === "report" && <PLReport />}
            {activeTab === "automation" && <AutomationDecision />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

