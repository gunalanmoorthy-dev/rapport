/**
 * Typed data-access layer for server components and route handlers.
 *
 * Every client/echo/activity query takes an `advisorId` and filters by it — that
 * is the tenant-isolation boundary now that the app is multi-advisor. Callers
 * resolve the current advisor via `lib/auth` ({@link requireAdvisorId} in pages,
 * {@link getAdvisorId} in routes) and pass it in.
 *
 * @module lib/queries
 */
import { and, asc, desc, eq, max } from "drizzle-orm";
import { db } from "@/db/client";
import { activities, advisors, clients, echoes, portfolioMoves } from "@/db/schema";
import type { Activity, Advisor, Client, Echo, PortfolioMove } from "@/db/schema";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether a string is a well-formed UUID. Route params arrive as arbitrary
 * strings; passing a non-UUID into a Postgres `uuid` comparison throws, so
 * callers use this to fail fast (404) instead.
 *
 * @param value - The candidate id, e.g. a dynamic route segment.
 * @returns `true` if `value` matches the UUID format.
 */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Look up an advisor by their login work id (includes the password hash).
 *
 * @param workId - The advisor's work id from the login form.
 * @returns The advisor row, or `null`.
 */
export async function getAdvisorByWorkId(workId: string): Promise<Advisor | null> {
  const rows = await db
    .select()
    .from(advisors)
    .where(eq(advisors.workId, workId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Look up an advisor by email (used to reject duplicate sign-ups).
 *
 * @param email - The email to check.
 * @returns The advisor row, or `null`.
 */
export async function getAdvisorByEmail(email: string): Promise<Advisor | null> {
  const rows = await db
    .select()
    .from(advisors)
    .where(eq(advisors.email, email))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Look up an advisor by id (for the session/greeting).
 *
 * @param id - Advisor UUID.
 * @returns The advisor row, or `null`.
 */
export async function getAdvisorById(id: string): Promise<Advisor | null> {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(advisors).where(eq(advisors.id, id)).limit(1);
  return rows[0] ?? null;
}

/**
 * All of an advisor's clients, richest first.
 *
 * @param advisorId - The signed-in advisor's id.
 * @returns Client rows ordered by `totalBalanceCents` descending.
 */
export async function getClients(advisorId: string): Promise<Client[]> {
  return db
    .select()
    .from(clients)
    .where(eq(clients.advisorId, advisorId))
    .orderBy(desc(clients.totalBalanceCents));
}

/**
 * A single client owned by the given advisor.
 *
 * @param id - Client UUID.
 * @param advisorId - The signed-in advisor's id (ownership check).
 * @returns The client, or `null` if malformed or not owned by the advisor.
 */
export async function getClientById(id: string, advisorId: string): Promise<Client | null> {
  if (!isUuid(id)) return null;
  const rows = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.advisorId, advisorId)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Committed portfolio moves for a client, newest first.
 *
 * @param clientId - Client UUID (caller has already verified ownership).
 * @returns Portfolio move rows ordered by `createdAt` descending.
 */
export async function getClientMoves(clientId: string): Promise<PortfolioMove[]> {
  return db
    .select()
    .from(portfolioMoves)
    .where(eq(portfolioMoves.clientId, clientId))
    .orderBy(desc(portfolioMoves.createdAt));
}

/**
 * All echoes recorded against a client (any status), newest first.
 *
 * @param clientId - Client UUID (caller has already verified ownership).
 * @returns Echo rows ordered by `createdAt` descending.
 */
export async function getClientEchoes(clientId: string): Promise<Echo[]> {
  return db
    .select()
    .from(echoes)
    .where(eq(echoes.clientId, clientId))
    .orderBy(desc(echoes.createdAt));
}

/**
 * Most recent echo timestamp per client, for "last contact" columns.
 *
 * @param advisorId - The signed-in advisor's id.
 * @returns Map of `clientId` → most recent echo `Date` (clients with no echoes are absent).
 */
export async function getLastContactByClient(advisorId: string): Promise<Map<string, Date>> {
  const rows = await db
    .select({ clientId: echoes.clientId, last: max(echoes.createdAt) })
    .from(echoes)
    .where(eq(echoes.advisorId, advisorId))
    .groupBy(echoes.clientId);

  const map = new Map<string, Date>();
  for (const r of rows) {
    if (r.clientId && r.last) map.set(r.clientId, new Date(r.last));
  }
  return map;
}

/** A staged echo paired with its client (or `null` if no client was matched). */
export type StagedEcho = {
  echo: Echo;
  client: Client | null;
};

/**
 * Echoes awaiting review (status `staged`) for an advisor, newest first, joined
 * to their client. LEFT join because a staged echo may have no matched client.
 *
 * @param advisorId - The signed-in advisor's id.
 * @returns Staged echoes each paired with their client row (or `null`).
 */
export async function getStagedEchoes(advisorId: string): Promise<StagedEcho[]> {
  return db
    .select({ echo: echoes, client: clients })
    .from(echoes)
    .leftJoin(clients, eq(echoes.clientId, clients.id))
    .where(and(eq(echoes.advisorId, advisorId), eq(echoes.status, "staged")))
    .orderBy(desc(echoes.createdAt));
}

/**
 * An advisor's continuing-education activities, soonest scheduled first.
 *
 * @param advisorId - The signed-in advisor's id.
 * @returns Activity rows ordered by `scheduledAt` ascending.
 */
export async function getActivities(advisorId: string): Promise<Activity[]> {
  return db
    .select()
    .from(activities)
    .where(eq(activities.advisorId, advisorId))
    .orderBy(asc(activities.scheduledAt));
}
