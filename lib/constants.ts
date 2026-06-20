/**
 * Auth is intentionally trivial for the demo: there is no login. Every server
 * action and query runs as this one seeded advisor. The seed script inserts the
 * advisor row with exactly this id so the two stay in sync.
 */
export const DEMO_ADVISOR_ID = "00000000-0000-0000-0000-000000000001";

/** Confidence at/above this auto-commits; below it routes to Staging. */
export const AUTO_COMMIT_THRESHOLD = 0.9;
