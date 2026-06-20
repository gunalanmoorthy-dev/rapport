/**
 * Typed data-access layer for server components and route handlers.
 *
 * Every query is scoped to the single demo advisor (see {@link DEMO_ADVISOR_ID})
 * — this is the only place tenant scoping is enforced, so always go through these
 * helpers rather than querying tables directly from a page.
 *
 * @module lib/queries
 */
import { and, asc, desc, eq, max } from "drizzle-orm";
import { db } from "@/db/client";
import { activities, clients, echoes, portfolioMoves } from "@/db/schema";
import type { Activity, Client, Echo, PortfolioMove } from "@/db/schema";
import { DEMO_ADVISOR_ID } from "./constants";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether a string is a well-formed UUID.
 *
 * Route params arrive as arbitrary strings; passing a non-UUID straight into a
 * Postgres `uuid` comparison throws. Callers use this to fail fast (404) instead.
 *
 * @param value - The candidate id, e.g. a dynamic route segment.
 * @returns `true` if `value` matches the UUID format.
 */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * All of the advisor's clients, richest first (for the Clients table + totals).
 *
 * @returns Client rows ordered by `totalBalanceCents` descending.
 */
export async function getClients(): Promise<Client[]> {
  return db
    .select()
    .from(clients)
    .where(eq(clients.advisorId, DEMO_ADVISOR_ID))
    .orderBy(desc(clients.totalBalanceCents));
}

/**
 * A single client owned by the demo advisor.
 *
 * @param id - Client UUID (typically a route param).
 * @returns The client, or `null` if the id is malformed or not owned by the advisor.
 */
export async function getClientById(id: string): Promise<Client | null> {
  if (!isUuid(id)) return null;
  const rows = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.advisorId, DEMO_ADVISOR_ID)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Committed portfolio moves for a client, newest first.
 *
 * @param clientId - Client UUID. Assumed already validated/owned by the advisor.
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
 * @param clientId - Client UUID. Assumed already validated/owned by the advisor.
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
 * Returned as a Map so callers can look up by client id in O(1) while rendering
 * a list, instead of issuing one query per row.
 *
 * @returns Map of `clientId` → most recent echo `Date`. Clients with no echoes
 *          are absent from the map (callers treat that as "no contact yet").
 */
export async function getLastContactByClient(): Promise<Map<string, Date>> {
  const rows = await db
    .select({ clientId: echoes.clientId, last: max(echoes.createdAt) })
    .from(echoes)
    .where(eq(echoes.advisorId, DEMO_ADVISOR_ID))
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
 * Echoes awaiting review (status `staged`), newest first, joined to their client.
 *
 * Uses a LEFT join because a staged echo may have no matched client (e.g. an
 * ambiguous brief) — the Staging UI still shows those, labelled "Unmatched".
 *
 * @returns Staged echoes each paired with their client row (or `null`).
 */
export async function getStagedEchoes(): Promise<StagedEcho[]> {
  const rows = await db
    .select({ echo: echoes, client: clients })
    .from(echoes)
    .leftJoin(clients, eq(echoes.clientId, clients.id))
    .where(
      and(eq(echoes.advisorId, DEMO_ADVISOR_ID), eq(echoes.status, "staged"))
    )
    .orderBy(desc(echoes.createdAt));
  return rows;
}

/**
 * All continuing-education activities for the advisor, soonest scheduled first.
 *
 * @returns Activity rows ordered by `scheduledAt` ascending (nulls last).
 */
export async function getActivities(): Promise<Activity[]> {
  return db
    .select()
    .from(activities)
    .where(eq(activities.advisorId, DEMO_ADVISOR_ID))
    .orderBy(asc(activities.scheduledAt));
}
