/**
 * Partnership-ecosystem data access for the admin oversight interface.
 *
 * Partners are firm-level (org-wide, no `advisorId`). Referrals are the
 * introductions advisors make from a client to a partner, with a status
 * lifecycle. Every roll-up here — intro counts, conversion rate, "best fit"
 * ranking — is derived in CODE from the referral records, never invented by a
 * model. This mirrors the app's "AI interprets, code decides" trust pattern.
 *
 * @module lib/partners
 */
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { advisors, clients, partners, referrals } from "@/db/schema";
import type { Partner, Referral, ReferralStatus } from "@/db/schema";

/** Statuses that mean an introduction is still live (not yet closed). */
const ACTIVE_STATUSES: ReferralStatus[] = ["introduced", "responded", "progressing"];

/** All firm partners, alphabetical. Org-wide, so not advisor-scoped. */
export async function getPartners(): Promise<Partner[]> {
  return db.select().from(partners).orderBy(asc(partners.name));
}

/** A referral flattened with the names it links, for the admin pipeline view. */
export type FirmReferral = {
  id: string;
  partnerId: string;
  status: ReferralStatus;
  introducedAt: Date | null;
  advisorName: string | null;
  clientName: string | null;
  partnerName: string | null;
};

/**
 * Every referral made by an advisor in the given firm, newest first, flattened
 * with advisor / client / partner names. Firm-scoped via the advisor join.
 *
 * @param firm - The admin's firm (null → none).
 */
export async function getFirmReferrals(firm: string | null): Promise<FirmReferral[]> {
  if (!firm) return [];
  const rows = await db
    .select({
      referral: referrals,
      advisorName: advisors.name,
      clientName: clients.name,
      partnerName: partners.name,
    })
    .from(referrals)
    .innerJoin(advisors, eq(referrals.advisorId, advisors.id))
    .leftJoin(clients, eq(referrals.clientId, clients.id))
    .leftJoin(partners, eq(referrals.partnerId, partners.id))
    .where(eq(advisors.firm, firm))
    .orderBy(desc(referrals.introducedAt));

  return rows.map((r) => ({
    id: r.referral.id,
    partnerId: r.referral.partnerId,
    status: r.referral.status,
    introducedAt: r.referral.introducedAt ? new Date(r.referral.introducedAt) : null,
    advisorName: r.advisorName,
    clientName: r.clientName,
    partnerName: r.partnerName,
  }));
}

/** Per-partner roll-up, all derived from the referral records in code. */
export type PartnerStat = {
  partner: Partner;
  total: number;
  active: number;
  closed: number;
  /** Closed ÷ total, 0–1. The "is this a productive relationship?" signal. */
  conversionRate: number;
};

/**
 * Tally each partner's introductions from the firm's referrals. Partners are
 * ranked best-fit first: by conversion rate, then by total volume — so the most
 * productive relationship surfaces at the top ("the right partner").
 */
export function tallyPartners(allPartners: Partner[], firmReferrals: FirmReferral[]): PartnerStat[] {
  const byPartner = new Map<string, FirmReferral[]>();
  for (const r of firmReferrals) {
    const list = byPartner.get(r.partnerId) ?? [];
    list.push(r);
    byPartner.set(r.partnerId, list);
  }

  return allPartners
    .map((partner) => {
      const refs = byPartner.get(partner.id) ?? [];
      const total = refs.length;
      const closed = refs.filter((r) => r.status === "closed").length;
      const active = refs.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;
      return {
        partner,
        total,
        active,
        closed,
        conversionRate: total ? closed / total : 0,
      };
    })
    .sort((a, b) => b.conversionRate - a.conversionRate || b.total - a.total);
}
