export type Sentiment = "green" | "amber" | "red";

export type PortfolioMove = {
  id: string;
  date: string;
  action: string;
  instrument: string;
  amount: string;
  direction: "buy" | "sell" | "rebalance";
};

export type EchoEntry = {
  id: string;
  date: string;
  duration: string;
  summary: string;
  committed: number;
  flagged: number;
};

export type Client = {
  id: string;
  name: string;
  household: string;
  balance: number;
  sentiment: Sentiment;
  sentimentNote: string;
  advisor: string;
  lastContact: string;
  riskProfile: string;
  moves: PortfolioMove[];
  echoHistory: EchoEntry[];
};

export const sentimentMeta: Record<
  Sentiment,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  green: {
    label: "Green",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  amber: {
    label: "Amber",
    dot: "bg-amber-400",
    text: "text-amber-300",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  red: {
    label: "Red",
    dot: "bg-red-400",
    text: "text-red-300",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
};

export function formatBalance(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export const clients: Client[] = [
  {
    id: "harrington",
    name: "Eleanor Harrington",
    household: "Harrington Family Trust",
    balance: 14820000,
    sentiment: "green",
    sentimentNote: "Highly engaged, referred two prospects last quarter.",
    advisor: "You",
    lastContact: "2 days ago",
    riskProfile: "Growth · Moderate",
    moves: [
      { id: "m1", date: "Jun 18", action: "Trimmed", instrument: "NVDA", amount: "$420,000", direction: "sell" },
      { id: "m2", date: "Jun 18", action: "Added", instrument: "Treasury Ladder", amount: "$600,000", direction: "buy" },
      { id: "m3", date: "Jun 02", action: "Rebalanced", instrument: "Global Equity Sleeve", amount: "$1,200,000", direction: "rebalance" },
    ],
    echoHistory: [
      { id: "e1", date: "Jun 18 · 9:42 AM", duration: "0:54", summary: "Eleanor wants to de-risk ahead of the property purchase in Q3. Move proceeds to short-duration treasuries.", committed: 4, flagged: 1 },
      { id: "e2", date: "Jun 02 · 4:11 PM", duration: "1:02", summary: "Quarterly review. She's comfortable with current allocation, asked about ESG screening for the next tranche.", committed: 6, flagged: 0 },
    ],
  },
  {
    id: "okafor",
    name: "Marcus Okafor",
    household: "Okafor Holdings LLC",
    balance: 8430000,
    sentiment: "amber",
    sentimentNote: "Two missed review calls. Concerned about tech exposure.",
    advisor: "You",
    lastContact: "3 weeks ago",
    riskProfile: "Aggressive Growth",
    moves: [
      { id: "m1", date: "Jun 15", action: "Sold", instrument: "Concentrated TSLA", amount: "$910,000", direction: "sell" },
      { id: "m2", date: "May 28", action: "Added", instrument: "Private Credit Fund III", amount: "$500,000", direction: "buy" },
    ],
    echoHistory: [
      { id: "e1", date: "Jun 15 · 11:20 AM", duration: "0:48", summary: "Marcus is nervous about single-stock concentration. Diversify out of TSLA over two tranches.", committed: 3, flagged: 2 },
    ],
  },
  {
    id: "delacroix",
    name: "Sophie Delacroix",
    household: "Delacroix Private",
    balance: 22150000,
    sentiment: "green",
    sentimentNote: "Long-tenured, expanding mandate to include daughter's accounts.",
    advisor: "You",
    lastContact: "5 days ago",
    riskProfile: "Balanced · Income",
    moves: [
      { id: "m1", date: "Jun 12", action: "Added", instrument: "Muni Bond Sleeve", amount: "$2,000,000", direction: "buy" },
      { id: "m2", date: "Jun 12", action: "Opened", instrument: "529 Plan — Camille", amount: "$340,000", direction: "buy" },
    ],
    echoHistory: [
      { id: "e1", date: "Jun 12 · 2:05 PM", duration: "1:11", summary: "Sophie wants to set up education funding for her daughter and increase tax-exempt income.", committed: 5, flagged: 0 },
    ],
  },
  {
    id: "venkataraman",
    name: "Priya Venkataraman",
    household: "Venkataraman Family Office",
    balance: 41300000,
    sentiment: "green",
    sentimentNote: "Anchor relationship. Reviewing alternatives allocation.",
    advisor: "You",
    lastContact: "Yesterday",
    riskProfile: "Endowment Style",
    moves: [
      { id: "m1", date: "Jun 19", action: "Committed", instrument: "Real Assets Fund II", amount: "$3,500,000", direction: "buy" },
      { id: "m2", date: "Jun 09", action: "Rebalanced", instrument: "Hedge Sleeve", amount: "$1,800,000", direction: "rebalance" },
    ],
    echoHistory: [
      { id: "e1", date: "Jun 19 · 8:30 AM", duration: "0:59", summary: "Priya approved the Real Assets Fund II commitment. Wants quarterly liquidity reporting going forward.", committed: 7, flagged: 1 },
    ],
  },
  {
    id: "whitlock",
    name: "James Whitlock",
    household: "Whitlock Retirement",
    balance: 3120000,
    sentiment: "red",
    sentimentNote: "Expressed dissatisfaction with returns. Retention risk.",
    advisor: "You",
    lastContact: "6 weeks ago",
    riskProfile: "Conservative",
    moves: [
      { id: "m1", date: "May 30", action: "Raised cash", instrument: "Equity Sleeve", amount: "$250,000", direction: "sell" },
    ],
    echoHistory: [
      { id: "e1", date: "May 30 · 3:48 PM", duration: "0:41", summary: "James unhappy with YTD performance vs. benchmark. Schedule an in-person review and prepare attribution.", committed: 2, flagged: 3 },
    ],
  },
  {
    id: "nakamura",
    name: "Yuki Nakamura",
    household: "Nakamura Trust",
    balance: 9870000,
    sentiment: "amber",
    sentimentNote: "Awaiting decision on liquidity event proceeds.",
    advisor: "You",
    lastContact: "12 days ago",
    riskProfile: "Growth",
    moves: [
      { id: "m1", date: "Jun 07", action: "Parked", instrument: "Money Market", amount: "$1,500,000", direction: "buy" },
    ],
    echoHistory: [
      { id: "e1", date: "Jun 07 · 10:02 AM", duration: "0:52", summary: "Yuki's business sale closed. Hold proceeds in money market until allocation plan is approved next week.", committed: 3, flagged: 1 },
    ],
  },
];

export function getClient(id: string) {
  return clients.find((c) => c.id === id);
}

export type StagedChange = {
  id: string;
  clientId: string;
  clientName: string;
  field: string;
  category: "CRM" | "Portfolio" | "Compliance";
  confidence: number;
  source: string;
  before: string;
  after: string;
};

export const stagedChanges: StagedChange[] = [
  {
    id: "s1",
    clientId: "okafor",
    clientName: "Marcus Okafor",
    field: "Risk profile",
    category: "CRM",
    confidence: 0.62,
    source: "Echo · Jun 15, 0:48",
    before: "Aggressive Growth",
    after: "Growth · Moderate",
  },
  {
    id: "s2",
    clientId: "harrington",
    clientName: "Eleanor Harrington",
    field: "Liquidity need",
    category: "Compliance",
    confidence: 0.58,
    source: "Echo · Jun 18, 0:54",
    before: "None on file",
    after: "$600,000 property purchase — Q3 2025",
  },
  {
    id: "s3",
    clientId: "whitlock",
    clientName: "James Whitlock",
    field: "Sentiment tag",
    category: "CRM",
    confidence: 0.71,
    source: "Echo · May 30, 0:41",
    before: "Amber",
    after: "Red — retention risk flagged",
  },
  {
    id: "s4",
    clientId: "nakamura",
    clientName: "Yuki Nakamura",
    field: "Cash allocation",
    category: "Portfolio",
    confidence: 0.49,
    source: "Echo · Jun 07, 0:52",
    before: "$0 money market",
    after: "$1,500,000 money market (temporary)",
  },
  {
    id: "s5",
    clientId: "venkataraman",
    clientName: "Priya Venkataraman",
    field: "Reporting cadence",
    category: "Compliance",
    confidence: 0.66,
    source: "Echo · Jun 19, 0:59",
    before: "Annual",
    after: "Quarterly liquidity reporting",
  },
];

export const liveTranscript: string[] = [
  "Okay, just got out of the call with Eleanor Harrington.",
  "She wants to de-risk ahead of the property purchase in Q3 — roughly six hundred thousand.",
  "Move the proceeds from trimming the NVDA position into a short-duration treasury ladder.",
  "She also asked about ESG screening for the next tranche, flag that for follow-up.",
  "Schedule the next review for early September, in person at her office.",
];

/* ------------------------------------------------------------------ */
/* Compliance / CPD log                                                */
/* ------------------------------------------------------------------ */

export type ComplianceCredit = {
  id: string;
  loggedAt: string;
  category: "CPD" | "Ethics" | "Product" | "Regulatory";
  activity: string;
  credits: number;
  source: string;
  hash: string;
};

export const complianceCategoryMeta: Record<
  ComplianceCredit["category"],
  { text: string; bg: string; border: string }
> = {
  CPD: { text: "text-sky-300", bg: "bg-sky-400/10", border: "border-sky-400/20" },
  Ethics: { text: "text-[#eca8d6]", bg: "bg-[#eca8d6]/10", border: "border-[#eca8d6]/20" },
  Product: { text: "text-emerald-300", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  Regulatory: { text: "text-amber-300", bg: "bg-amber-400/10", border: "border-amber-400/20" },
};

// Most recent first. Append-only: new credits are added to the top.
export const complianceCredits: ComplianceCredit[] = [
  { id: "c8", loggedAt: "2025-06-19 08:31:04", category: "Regulatory", activity: "SEC Marketing Rule refresher — Q2 attestation", credits: 1.5, source: "Echo · Priya Venkataraman review", hash: "9f3a1c" },
  { id: "c7", loggedAt: "2025-06-18 09:47:22", category: "CPD", activity: "Fixed income & duration risk workshop", credits: 2.0, source: "Echo · Eleanor Harrington review", hash: "7b2e90" },
  { id: "c6", loggedAt: "2025-06-15 11:23:51", category: "Ethics", activity: "Suitability & concentration risk module", credits: 1.0, source: "Echo · Marcus Okafor review", hash: "4d8f17" },
  { id: "c5", loggedAt: "2025-06-12 14:09:38", category: "Product", activity: "Municipal bond & 529 plan certification", credits: 1.5, source: "Echo · Sophie Delacroix review", hash: "2a6b44" },
  { id: "c4", loggedAt: "2025-06-07 10:05:12", category: "CPD", activity: "Liquidity event planning seminar", credits: 2.0, source: "Echo · Yuki Nakamura review", hash: "c1e7d3" },
  { id: "c3", loggedAt: "2025-05-30 15:51:47", category: "Regulatory", activity: "Best execution & performance attribution", credits: 1.0, source: "Echo · James Whitlock review", hash: "8e0a52" },
  { id: "c2", loggedAt: "2025-05-21 09:14:03", category: "Ethics", activity: "Annual code of conduct attestation", credits: 1.0, source: "Manual entry", hash: "5fb3c8" },
  { id: "c1", loggedAt: "2025-05-09 13:42:19", category: "CPD", activity: "Alternatives & private credit due diligence", credits: 2.5, source: "Manual entry", hash: "1d9402" },
];

export const cpdTarget = 30;

/* ------------------------------------------------------------------ */
/* Immutable audit trail                                               */
/* ------------------------------------------------------------------ */

export type AuditEntry = {
  id: string;
  seq: number;
  timestamp: string;
  actor: "Rapport" | "You";
  type: "commit" | "approve" | "reject" | "compliance" | "export";
  clientName?: string;
  detail: string;
  confidence?: number;
  hash: string;
  prevHash: string;
};

export const auditTypeMeta: Record<
  AuditEntry["type"],
  { label: string; text: string; bg: string; border: string }
> = {
  commit: { label: "Auto-commit", text: "text-emerald-300", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  approve: { label: "Approved", text: "text-sky-300", bg: "bg-sky-400/10", border: "border-sky-400/20" },
  reject: { label: "Rejected", text: "text-red-300", bg: "bg-red-400/10", border: "border-red-400/20" },
  compliance: { label: "Compliance", text: "text-amber-300", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  export: { label: "Export", text: "text-[#eca8d6]", bg: "bg-[#eca8d6]/10", border: "border-[#eca8d6]/20" },
};

// Append-only ledger, newest first. Each entry chains to the previous via prevHash.
export const auditTrail: AuditEntry[] = [
  { id: "a12", seq: 1042, timestamp: "2025-06-19 08:31:05", actor: "Rapport", type: "compliance", clientName: "Priya Venkataraman", detail: "Logged 1.5 CPD credits — SEC Marketing Rule refresher", hash: "9f3a1c", prevHash: "e7d2b8" },
  { id: "a11", seq: 1041, timestamp: "2025-06-19 08:30:58", actor: "Rapport", type: "commit", clientName: "Priya Venkataraman", detail: "Reporting cadence → Quarterly liquidity reporting", confidence: 0.94, hash: "e7d2b8", prevHash: "b3f019" },
  { id: "a10", seq: 1040, timestamp: "2025-06-19 08:30:57", actor: "Rapport", type: "commit", clientName: "Priya Venkataraman", detail: "Committed Real Assets Fund II — $3,500,000", confidence: 0.97, hash: "b3f019", prevHash: "a1c7e4" },
  { id: "a9", seq: 1039, timestamp: "2025-06-18 14:22:11", actor: "You", type: "export", clientName: "Eleanor Harrington", detail: "Generated advisor brief (PDF)", hash: "a1c7e4", prevHash: "77de20" },
  { id: "a8", seq: 1038, timestamp: "2025-06-18 09:47:23", actor: "Rapport", type: "commit", clientName: "Eleanor Harrington", detail: "Trimmed NVDA → $420,000 to treasury ladder", confidence: 0.96, hash: "77de20", prevHash: "33ab91" },
  { id: "a7", seq: 1037, timestamp: "2025-06-18 09:47:20", actor: "You", type: "approve", clientName: "Eleanor Harrington", detail: "Approved liquidity need — $600,000 property purchase", confidence: 0.58, hash: "33ab91", prevHash: "0cf8a7" },
  { id: "a6", seq: 1036, timestamp: "2025-06-15 11:24:02", actor: "You", type: "reject", clientName: "Marcus Okafor", detail: "Rejected risk profile downgrade — needs verbal confirmation", confidence: 0.62, hash: "0cf8a7", prevHash: "d52e16" },
  { id: "a5", seq: 1035, timestamp: "2025-06-15 11:23:52", actor: "Rapport", type: "commit", clientName: "Marcus Okafor", detail: "Sold concentrated TSLA — $910,000", confidence: 0.91, hash: "d52e16", prevHash: "9a47c0" },
  { id: "a4", seq: 1034, timestamp: "2025-06-12 14:09:40", actor: "Rapport", type: "commit", clientName: "Sophie Delacroix", detail: "Opened 529 Plan — Camille — $340,000", confidence: 0.95, hash: "9a47c0", prevHash: "61bd38" },
  { id: "a3", seq: 1033, timestamp: "2025-06-09 16:40:11", actor: "Rapport", type: "commit", clientName: "Priya Venkataraman", detail: "Rebalanced hedge sleeve — $1,800,000", confidence: 0.93, hash: "61bd38", prevHash: "2e90f5" },
  { id: "a2", seq: 1032, timestamp: "2025-06-07 10:05:14", actor: "Rapport", type: "commit", clientName: "Yuki Nakamura", detail: "Parked $1,500,000 in money market (temporary)", confidence: 0.88, hash: "2e90f5", prevHash: "00a1b2" },
  { id: "a1", seq: 1031, timestamp: "2025-05-30 15:51:49", actor: "You", type: "approve", clientName: "James Whitlock", detail: "Approved sentiment tag → Red (retention risk)", confidence: 0.71, hash: "00a1b2", prevHash: "genesis" },
];

/* ------------------------------------------------------------------ */
/* Daily digest / morning brief                                        */
/* ------------------------------------------------------------------ */

export type DigestEcho = {
  id: string;
  clientName: string;
  time: string;
  summary: string;
  committed: number;
  flagged: number;
};

export const digest = {
  date: "Thursday, June 19",
  greeting: "Good morning, Alex",
  overnight: {
    autoCommitted: 14,
    clientsTouched: 4,
    cpdLogged: 3.5,
    minutesSaved: 96,
  },
  echoes: [
    { id: "d1", clientName: "Priya Venkataraman", time: "8:30 AM", summary: "Approved Real Assets Fund II commitment; quarterly liquidity reporting going forward.", committed: 7, flagged: 1 },
    { id: "d2", clientName: "Eleanor Harrington", time: "Yesterday 9:42 AM", summary: "De-risk ahead of Q3 property purchase; proceeds to short-duration treasuries.", committed: 4, flagged: 1 },
  ] as DigestEcho[],
};

/* ------------------------------------------------------------------ */
/* Sentiment topography (Vitality Engine)                              */
/* ------------------------------------------------------------------ */

// Fiscal year runs Jul → Jun.
export const fiscalMonths = [
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
];

// Market volatility index (VIX-like, inverted in chart as "calm → turbulent").
export const marketVolatility = [16, 18, 22, 28, 24, 19, 17, 21, 33, 29, 23, 20];

// Book-wide average client sentiment score (0–100) by fiscal month.
export const bookSentiment = [78, 80, 74, 66, 70, 75, 79, 76, 61, 64, 71, 73];

// Per-client monthly sentiment scores (0–100) for the fiscal year.
export const clientSentimentHistory: Record<string, number[]> = {
  harrington:     [82, 85, 80, 74, 78, 83, 86, 84, 79, 81, 85, 88],
  okafor:         [70, 72, 66, 58, 62, 65, 68, 64, 52, 55, 60, 57],
  delacroix:      [80, 82, 81, 76, 79, 84, 85, 83, 78, 80, 84, 86],
  venkataraman:   [88, 90, 86, 82, 85, 88, 90, 89, 84, 86, 89, 91],
  whitlock:       [60, 58, 54, 46, 44, 48, 52, 49, 38, 36, 40, 35],
  nakamura:       [72, 74, 70, 64, 66, 70, 73, 71, 58, 61, 64, 62],
};

/* ------------------------------------------------------------------ */
/* Synergy / referral ledger + payroll bridge                          */
/* ------------------------------------------------------------------ */

export type Referral = {
  id: string;
  loggedAt: string;
  referrerId: string;
  referrer: string;
  prospect: string;
  status: "prospect" | "qualified" | "converted" | "declined";
  estimatedAum: number;
  convertedAum?: number;
  bonus: number;
};

export const referralStatusMeta: Record<
  Referral["status"],
  { label: string; text: string; bg: string; border: string }
> = {
  prospect: { label: "Prospect", text: "text-muted-foreground", bg: "bg-foreground/5", border: "border-foreground/15" },
  qualified: { label: "Qualified", text: "text-sky-300", bg: "bg-sky-400/10", border: "border-sky-400/20" },
  converted: { label: "Converted", text: "text-emerald-300", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  declined: { label: "Declined", text: "text-red-300", bg: "bg-red-400/10", border: "border-red-400/20" },
};

export const referrals: Referral[] = [
  { id: "r1", loggedAt: "Jun 18", referrerId: "harrington", referrer: "Eleanor Harrington", prospect: "The Aldridge Family", status: "converted", estimatedAum: 6000000, convertedAum: 7200000, bonus: 18000 },
  { id: "r2", loggedAt: "Jun 11", referrerId: "delacroix", referrer: "Sophie Delacroix", prospect: "Camille Delacroix (daughter)", status: "converted", estimatedAum: 2500000, convertedAum: 2500000, bonus: 6250 },
  { id: "r3", loggedAt: "Jun 04", referrerId: "venkataraman", referrer: "Priya Venkataraman", prospect: "Sundar Holdings", status: "qualified", estimatedAum: 12000000, bonus: 0 },
  { id: "r4", loggedAt: "May 27", referrerId: "harrington", referrer: "Eleanor Harrington", prospect: "Dr. Mei Lin", status: "qualified", estimatedAum: 4500000, bonus: 0 },
  { id: "r5", loggedAt: "May 19", referrerId: "delacroix", referrer: "Sophie Delacroix", prospect: "Beaumont Trust", status: "prospect", estimatedAum: 3000000, bonus: 0 },
  { id: "r6", loggedAt: "May 02", referrerId: "okafor", referrer: "Marcus Okafor", prospect: "Vantage Partners", status: "declined", estimatedAum: 5000000, bonus: 0 },
];

export type PayrollLine = {
  id: string;
  label: string;
  detail: string;
  amount: number;
};

export const payrollPeriod = "June 2025 · Pay period 06";

export const payrollLines: PayrollLine[] = [
  { id: "p1", label: "Base draw", detail: "Monthly advisor base", amount: 14500 },
  { id: "p2", label: "AUM management fee share", detail: "0.18% on $99.7M blended", amount: 14955 },
  { id: "p3", label: "Referral conversion bonus", detail: "2 conversions · Harrington, Delacroix", amount: 24250 },
  { id: "p4", label: "Synergy credit (team intros)", detail: "3 cross-desk introductions", amount: 3600 },
  { id: "p5", label: "Compliance completion incentive", detail: "CPD on track · 11.5 / 30 credits", amount: 1200 },
];
