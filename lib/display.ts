import type { Sentiment } from "@/db/schema";

/** Derive a household label from a client name (no household column in the DB). */
export function householdLabel(name: string | null): string {
  if (!name) return "Private account";
  const parts = name.trim().split(/\s+/);
  return `${parts[parts.length - 1]} Household`;
}

/** Coarse "time ago" for last-contact columns. */
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

/** Default sentiment narrative when there is no per-client note in the DB. */
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

/** Format an absolute timestamp for echo cards / audit-style rows. */
export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
