/**
 * Presentation helpers for turning raw DB rows into display strings.
 *
 * The schema is deliberately minimal, so several UI fields (household name,
 * sentiment narrative) are *derived* here rather than stored. Keeping that
 * derivation in one module means the same client reads consistently across the
 * Clients table, the detail page, and the printable brief.
 *
 * @module lib/display
 */
import type { Sentiment } from "@/db/schema";

/**
 * Derive a household label from a client name (there is no household column).
 *
 * @param name - The client's full name, or `null`.
 * @returns e.g. `"Harrington Household"`, or `"Private account"` when name is missing.
 */
export function householdLabel(name: string | null): string {
  if (!name) return "Private account";
  const parts = name.trim().split(/\s+/);
  return `${parts[parts.length - 1]} Household`;
}

/**
 * Coarse, human "time ago" label for last-contact columns.
 *
 * Intentionally approximate (days/weeks/months) — advisors care about recency
 * bands, not exact timestamps, and rounding avoids noisy "0 days ago" output.
 *
 * @param date - The reference timestamp, or `null`/`undefined` if none.
 * @returns A phrase like `"Yesterday"`, `"3 days ago"`, or `"No contact yet"`.
 */
export function relativeFromNow(date: Date | null | undefined): string {
  if (!date) return "No contact yet";
  const ms = Date.now() - date.getTime();
  const day = 86_400_000;
  const days = Math.floor(ms / day);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/**
 * Default sentiment narrative when there is no per-client note in the DB.
 *
 * @param sentiment - The client's sentiment tag, or `null`.
 * @returns A one-line description suitable for the client detail/brief.
 */
export function sentimentNote(sentiment: Sentiment | null): string {
  switch (sentiment) {
    case "green":
      return "Engaged relationship — sentiment is healthy.";
    case "amber":
      return "Cooling — worth a proactive check-in soon.";
    case "red":
      return "Going cold — retention risk, prioritize outreach.";
    default:
      return "No sentiment recorded yet.";
  }
}

/**
 * Format an absolute timestamp for echo cards / audit-style rows.
 *
 * @param date - The timestamp, or `null`/`undefined`.
 * @returns e.g. `"Jun 18, 9:42 AM"`, or `"—"` when no date is given.
 */
export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
