/**
 * Admin oversight data access. An admin can read every advisor sharing their
 * `firm` — read-only. Authorization is by firm membership, checked here before
 * any advisor-scoped query is reused.
 *
 * @module lib/admin
 */
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { advisors } from "@/db/schema";
import type { Advisor } from "@/db/schema";
import { isUuid } from "./queries";

/**
 * The advisors an admin oversees: everyone with role `advisor` in the same firm.
 *
 * @param firm - The admin's firm (null → no advisors).
 * @returns Advisor rows, alphby name.
 */
export async function getFirmAdvisors(firm: string | null): Promise<Advisor[]> {
  if (!firm) return [];
  return db
    .select()
    .from(advisors)
    .where(and(eq(advisors.firm, firm), eq(advisors.role, "advisor")))
    .orderBy(asc(advisors.name));
}

/**
 * Fetch a single advisor only if the admin is allowed to see them (same firm,
 * role advisor). Returns `null` otherwise — the authorization gate for the
 * `/admin/advisors/[id]` view.
 *
 * @param adminFirm - The admin's firm.
 * @param targetId - The advisor id being viewed.
 * @returns The advisor row, or `null` if not managed by this admin.
 */
export async function getManagedAdvisor(
  adminFirm: string | null,
  targetId: string
): Promise<Advisor | null> {
  if (!adminFirm || !isUuid(targetId)) return null;
  const rows = await db
    .select()
    .from(advisors)
    .where(
      and(
        eq(advisors.id, targetId),
        eq(advisors.firm, adminFirm),
        eq(advisors.role, "advisor")
      )
    )
    .limit(1);
  return rows[0] ?? null;
}
