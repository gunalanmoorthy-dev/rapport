/**
 * Deterministic partner scoring + matching.
 *
 * Pure, side-effect-free, unit-testable (same discipline as `lib/verify.ts`). The
 * model never produces a success score, velocity, or ranking — those are computed
 * here from real referral records. The model's only job (in `lib/extractNeed.ts`)
 * is mapping a need to tags, which this module then matches.
 *
 * @module lib/partners
 */
import type { ReferralStatus } from "@/db/schema";

/** Minimal referral shape for scoring (structurally satisfied by `Referral`). */
export type ReferralLike = {
  status: ReferralStatus;
  introducedAt?: Date | string | null;
  respondedAt?: Date | string | null;
};

/**
 * A partner's computed track record. `null` fields mean "not enough data" —
 * never a fabricated number (e.g. a partner with zero referrals).
 */
export type PartnerScore = {
  successScore: number | null; // 0–100: (closed + progressing) / total
  avgResponseDays: number | null; // mean introduced→responded, or null
  activeCount: number; // introduced | responded | progressing
};

function ms(t: Date | string | null | undefined): number {
  if (!t) return NaN;
  return t instanceof Date ? t.getTime() : new Date(t).getTime();
}

/**
 * Compute a partner's score from their referral records. Handles the
 * zero-referral case explicitly (returns nulls, not a fake 0%).
 *
 * @param referralsForPartner - All referrals for one partner.
 * @returns The deterministic {@link PartnerScore}.
 */
export function computePartnerScore(referralsForPartner: ReferralLike[]): PartnerScore {
  const total = referralsForPartner.length;
  if (total === 0) {
    return { successScore: null, avgResponseDays: null, activeCount: 0 };
  }

  const successful = referralsForPartner.filter(
    (r) => r.status === "closed" || r.status === "progressing"
  ).length;
  const successScore = Math.round((successful / total) * 100);

  const activeCount = referralsForPartner.filter(
    (r) => r.status === "introduced" || r.status === "responded" || r.status === "progressing"
  ).length;

  const responseDays: number[] = [];
  for (const r of referralsForPartner) {
    const intro = ms(r.introducedAt);
    const resp = ms(r.respondedAt);
    if (Number.isFinite(intro) && Number.isFinite(resp)) {
      const days = (resp - intro) / 86_400_000;
      if (days >= 0) responseDays.push(days);
    }
  }
  const avgResponseDays =
    responseDays.length === 0
      ? null
      : Math.round((responseDays.reduce((a, b) => a + b, 0) / responseDays.length) * 10) / 10;

  return { successScore, avgResponseDays, activeCount };
}

/** Minimal partner shape for matching (structurally satisfied by `Partner`). */
export type PartnerLike = { id: string; specializationTags?: string[] | null };

/** A matched partner: the partner plus its tag overlap and computed score. */
export type MatchedPartner<T extends PartnerLike> = T & {
  overlap: number;
  score: PartnerScore;
};

/**
 * Rank partners whose tags intersect the need, best first.
 *
 * Ranking: tag-overlap descending, then successScore descending (a partner with
 * no score sorts below one that has a real score). Partners with no overlap are
 * excluded.
 *
 * @param needTags - Tags from {@link extractNeed}.
 * @param partners - Candidate partners.
 * @param scores - Map of partnerId → {@link PartnerScore} (computed in code).
 * @returns Matched partners, ranked.
 */
export function matchPartners<T extends PartnerLike>(
  needTags: string[],
  partners: T[],
  scores: Map<string, PartnerScore>
): MatchedPartner<T>[] {
  const need = new Set(needTags.map((t) => t.toLowerCase().trim()).filter(Boolean));

  const matched: MatchedPartner<T>[] = partners
    .map((p) => {
      const tags = (p.specializationTags ?? []).map((t) => t.toLowerCase());
      const overlap = tags.filter((t) => need.has(t)).length;
      const score = scores.get(p.id) ?? {
        successScore: null,
        avgResponseDays: null,
        activeCount: 0,
      };
      return { ...p, overlap, score };
    })
    .filter((p) => p.overlap > 0);

  matched.sort(
    (a, b) => b.overlap - a.overlap || (b.score.successScore ?? -1) - (a.score.successScore ?? -1)
  );
  return matched;
}
