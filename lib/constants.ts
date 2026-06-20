/**
 * The id of the primary seeded advisor (ADV-001, Alex Donovan). The seed script
 * inserts that advisor row with exactly this id so fixtures and scripts can
 * reference a known advisor without a lookup. The live app is multi-advisor with
 * real login — see `lib/auth.ts`.
 */
export const DEMO_ADVISOR_ID = "00000000-0000-0000-0000-000000000001";

/** Confidence at/above this auto-commits; below it routes to Staging. */
export const AUTO_COMMIT_THRESHOLD = 0.9;

/**
 * Annual continuing-professional-development requirement, in minutes
 * (30 hours × 60). Used by `lib/cpd.ts#tallyCpd` to gauge progress.
 */
export const CPD_ANNUAL_REQUIREMENT_MINUTES = 30 * 60;
