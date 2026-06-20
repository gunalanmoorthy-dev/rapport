import { and, desc, eq, max } from "drizzle-orm";
import { db } from "@/db/client";
import { clients, echoes, portfolioMoves } from "@/db/schema";
import type { Client, Echo, PortfolioMove } from "@/db/schema";
import { DEMO_ADVISOR_ID } from "./constants";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export async function getClients(): Promise<Client[]> {
  return db
    .select()
    .from(clients)
    .where(eq(clients.advisorId, DEMO_ADVISOR_ID))
    .orderBy(desc(clients.totalBalanceCents));
}

export async function getClientById(id: string): Promise<Client | null> {
  if (!isUuid(id)) return null;
  const rows = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.advisorId, DEMO_ADVISOR_ID)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getClientMoves(clientId: string): Promise<PortfolioMove[]> {
  return db
    .select()
    .from(portfolioMoves)
    .where(eq(portfolioMoves.clientId, clientId))
    .orderBy(desc(portfolioMoves.createdAt));
}

export async function getClientEchoes(clientId: string): Promise<Echo[]> {
  return db
    .select()
    .from(echoes)
    .where(eq(echoes.clientId, clientId))
    .orderBy(desc(echoes.createdAt));
}

/** Most recent echo timestamp per client, for "last contact" columns. */
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

export type StagedEcho = {
  echo: Echo;
  client: Client | null;
};

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
