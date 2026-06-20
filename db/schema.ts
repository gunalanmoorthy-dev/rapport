/**
 * Drizzle schema that MATCHES the tables already provisioned in Neon.
 *
 * This file is a typed *mirror* of the live database — it is deliberately not a
 * migration source. Do not run `drizzle-kit push`/generate against it to create
 * or alter tables; it exists only to type and query the existing `advisors`,
 * `clients`, `echoes`, and `portfolio_moves` tables. If the real tables change,
 * update this file by hand to match.
 *
 * Money is stored as integer cents (bigint) throughout — never floats.
 *
 * @module db/schema
 */
import {
  pgTable,
  uuid,
  text,
  bigint,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export type Sentiment = "green" | "amber" | "red";
export type EchoStatus = "committed" | "staged" | "rolled_back";
export type MoveDirection = "in" | "out";

/** Shape of the structured intent the model extracts from a voice brief. */
export type ExtractedIntent = {
  matchedClientId: string | null;
  matchedClientName: string | null;
  intents: string[];
  move: {
    amountCents: number;
    direction: MoveDirection;
  } | null;
  summary: string;
  /** Set by the deterministic verifier in code, never by the model. */
  invalid?: boolean;
  invalidReason?: string;
  /** Balance math, recomputed in TypeScript (never by the model). */
  balanceBeforeCents?: number;
  balanceAfterCents?: number;
};

export const advisors = pgTable("advisors", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  firm: text("firm"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  advisorId: uuid("advisor_id")
    .notNull()
    .references(() => advisors.id, { onDelete: "cascade" }),
  name: text("name"),
  totalBalanceCents: bigint("total_balance_cents", { mode: "number" }).default(0),
  sentiment: text("sentiment").$type<Sentiment>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const echoes = pgTable("echoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  advisorId: uuid("advisor_id")
    .notNull()
    .references(() => advisors.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").references(() => clients.id, {
    onDelete: "cascade",
  }),
  transcript: text("transcript"),
  extracted: jsonb("extracted").$type<ExtractedIntent>(),
  confidence: numeric("confidence"),
  status: text("status").$type<EchoStatus>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const portfolioMoves = pgTable("portfolio_moves", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  echoId: uuid("echo_id").references(() => echoes.id, { onDelete: "set null" }),
  amountCents: bigint("amount_cents", { mode: "number" }),
  direction: text("direction").$type<MoveDirection>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Advisor = typeof advisors.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Echo = typeof echoes.$inferSelect;
export type PortfolioMove = typeof portfolioMoves.$inferSelect;
