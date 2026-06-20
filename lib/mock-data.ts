/**
 * Shared display helpers + mock data for the two not-yet-wired screens.
 *
 * This module plays two roles (kept together for now to avoid churning imports):
 *  1. Real, always-used presentation helpers — {@link formatBalance},
 *     {@link formatCents}, {@link sentimentMeta}, and the {@link Sentiment} type.
 *  2. Mock fixtures for the screens that still have no backing tables: the
 *     **Audit** trail and the **Digest** overnight summary. These are placeholder
 *     data only; everything else (Clients, Staging, Notes, Compliance) is live.
 *
 * @module lib/mock-data
 */

/** A client's relationship-health tag, driving colour + copy across the UI. */
export type Sentiment = "green" | "amber" | "red";

/** Per-sentiment Tailwind classes for dots, text, backgrounds, and borders. */
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

/**
 * Format a whole-dollar amount as USD with no decimals (e.g. `$14,820,000`).
 *
 * @param value - Amount in **dollars** (not cents).
 * @returns A localized currency string.
 */
export function formatBalance(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format an integer-cents amount as USD. The single display bridge for money —
 * balances are stored as cents everywhere, so always render them through this.
 *
 * @param cents - Amount in **integer cents**.
 * @returns A localized currency string.
 */
export function formatCents(cents: number) {
  return formatBalance(cents / 100);
}

/* ------------------------------------------------------------------ */
/* MOCK — Immutable audit trail (no backing table yet)                 */
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
/* MOCK — Daily digest / morning brief (no backing table yet)          */
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
