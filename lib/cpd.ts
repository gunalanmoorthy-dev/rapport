/**
 * Deterministic CPD (continuing-professional-development) accounting.
 *
 * Pure, side-effect-free, and unit-testable — the same "code decides, never the
 * model" discipline as `lib/verify.ts`. The LLM never sets CPD minutes or judges
 * progress; this module assigns credit from the source type and tallies it.
 *
 * @module lib/cpd
 */
import type { CpdSourceType } from "@/db/schema";
import { CPD_ANNUAL_REQUIREMENT_MINUTES } from "./constants";

/** Fixed CPD minutes granted per source type. The single source of truth. */
const CREDIT_MINUTES: Record<CpdSourceType, number> = {
  regulatory_brief: 15,
  market_update: 10,
  research: 20,
  seminar: 60,
  field_brief: 15,
};

/**
 * Decide how many CPD minutes a learning event is worth — in code, never by AI.
 *
 * @param sourceType - The kind of event (see {@link CpdSourceType}).
 * @param opts.durationMinutes - An explicit known duration (e.g. a 90-minute
 *   seminar). When a positive finite number, it overrides the table default.
 *   This is still a code/caller decision, never the model's.
 * @returns Whole minutes of CPD credit (never negative).
 */
export function creditFor(
  sourceType: CpdSourceType,
  opts?: { durationMinutes?: number }
): number {
  const override = opts?.durationMinutes;
  if (typeof override === "number" && Number.isFinite(override) && override > 0) {
    return Math.round(override);
  }
  return CREDIT_MINUTES[sourceType] ?? 0;
}

/** A time window (epoch ms) over which to tally CPD. */
export type CpdPeriod = { startMs: number; endMs: number };

/** Rolling 12-month window ending now (the default CPD period). */
export function defaultCpdPeriod(now: number = Date.now()): CpdPeriod {
  return { startMs: now - 365 * 86_400_000, endMs: now };
}

/** Minimal shape of a CPD entry for tallying (structurally satisfied by `CpdEntry`). */
export type CpdEntryInput = {
  minutes: number;
  category?: string | null;
  verifiedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

/** Minimal shape of an existing activity for tallying (satisfied by `Activity`). */
export type CpdActivityInput = {
  category?: string | null;
  scheduledAt?: Date | string | null;
};

export type CpdTally = {
  totalMinutes: number;
  byCategory: Record<string, number>;
  requirementMinutes: number;
  metRequirement: boolean;
};

function ms(t: Date | string | null | undefined): number {
  if (!t) return NaN;
  return t instanceof Date ? t.getTime() : new Date(t).getTime();
}

/**
 * Tally CPD over a period from explicit `cpd_entries` PLUS existing activities
 * (read-only — activities have no minutes column, so each attended one counts as
 * a seminar's worth of credit). Fully deterministic given its inputs.
 *
 * @param entries - CPD entry rows (their `minutes` were already set by {@link creditFor}).
 * @param activities - Existing activity rows; only those within the window and on
 *   or before `period.endMs` (i.e. already occurred) are counted.
 * @param period - The window to tally over (defaults to a rolling 12 months).
 * @returns Totals, a per-category breakdown, the requirement, and whether it's met.
 */
export function tallyCpd(
  entries: CpdEntryInput[],
  activities: CpdActivityInput[],
  period: CpdPeriod = defaultCpdPeriod()
): CpdTally {
  const byCategory: Record<string, number> = {};
  let totalMinutes = 0;

  const add = (minutes: number, category: string | null | undefined) => {
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    totalMinutes += minutes;
    const key = category && category.trim() ? category : "Uncategorized";
    byCategory[key] = (byCategory[key] ?? 0) + minutes;
  };

  for (const e of entries) {
    const t = ms(e.verifiedAt ?? e.createdAt);
    if (Number.isFinite(t) && t >= period.startMs && t <= period.endMs) {
      add(e.minutes, e.category);
    }
  }

  for (const a of activities) {
    const t = ms(a.scheduledAt);
    // Only count activities that have already happened within the window.
    if (Number.isFinite(t) && t >= period.startMs && t <= period.endMs) {
      add(creditFor("seminar"), a.category);
    }
  }

  return {
    totalMinutes,
    byCategory,
    requirementMinutes: CPD_ANNUAL_REQUIREMENT_MINUTES,
    metRequirement: totalMinutes >= CPD_ANNUAL_REQUIREMENT_MINUTES,
  };
}
