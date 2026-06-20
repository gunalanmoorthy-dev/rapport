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
  integer,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export type Sentiment = "green" | "amber" | "red";
export type EchoStatus = "committed" | "staged" | "rolled_back";
export type MoveDirection = "in" | "out";
/** A client is `pending` until an advisor approves it into the active book. */
export type ClientStatus = "pending" | "active";
/** Account role. Admins oversee (read-only) every advisor sharing their firm. */
export type AdvisorRole = "advisor" | "admin";

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
  // Login credentials: a human-friendly work id + a scrypt password hash.
  workId: text("work_id").unique(),
  passwordHash: text("password_hash"),
  // 'advisor' (default) or 'admin' (firm oversight, read-only).
  role: text("role").$type<AdvisorRole>().default("advisor"),
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
  email: text("email"),
  phone: text("phone"),
  // 'pending' until an advisor approves the record into the active book.
  status: text("status").$type<ClientStatus>().default("active"),
  // Free-text advisor note (the "Notes" screen). Advisor decides what goes here.
  note: text("note"),
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

/**
 * Continuing-education activities and seminars (the Compliance screen). Includes
 * a `scheduledAt` so advisors can log upcoming sessions, not just past ones.
 */
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  advisorId: uuid("advisor_id")
    .notNull()
    .references(() => advisors.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Advisor = typeof advisors.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Echo = typeof echoes.$inferSelect;
export type PortfolioMove = typeof portfolioMoves.$inferSelect;
export type Activity = typeof activities.$inferSelect;

/* ------------------------------------------------------------------ */
/* Feature A — Passive CPD tracking                                    */
/* ------------------------------------------------------------------ */

/** Where a CPD credit came from. `minutes` is always decided by code, not AI. */
export type CpdSourceType =
  | "regulatory_brief"
  | "market_update"
  | "research"
  | "seminar"
  | "field_brief";

/**
 * Passive continuing-education credits. Each row is one verified learning event;
 * `minutes` is computed deterministically by `lib/cpd.ts#creditFor` (never by the
 * model or the request body). Mirrors the Neon `cpd_entries` table.
 */
export const cpdEntries = pgTable("cpd_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  advisorId: uuid("advisor_id")
    .notNull()
    .references(() => advisors.id, { onDelete: "cascade" }),
  sourceType: text("source_type").$type<CpdSourceType>().notNull(),
  sourceRef: text("source_ref"),
  category: text("category"),
  minutes: integer("minutes").notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type CpdEntry = typeof cpdEntries.$inferSelect;

/* ------------------------------------------------------------------ */
/* Partnership ecosystem                                               */
/* ------------------------------------------------------------------ */

/**
 * Firm-level specialist partners (org-wide — no advisorId). The model only maps
 * a stated need to `specializationTags`; success scores are computed in code.
 * Mirrors the Neon `partners` table.
 */
export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  specialization: text("specialization"),
  specializationTags: jsonb("specialization_tags").$type<string[]>(),
  contactEmail: text("contact_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Partner = typeof partners.$inferSelect;

/** Lifecycle of a partner introduction. */
export type ReferralStatus = "introduced" | "responded" | "progressing" | "closed";

/**
 * A per-advisor introduction of a client to a partner. Success score and
 * velocity are derived in code (`lib/partners.ts`) from these records — never
 * invented. Mirrors the Neon `referrals` table.
 */
export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  advisorId: uuid("advisor_id")
    .notNull()
    .references(() => advisors.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  status: text("status").$type<ReferralStatus>().notNull(),
  introducedAt: timestamp("introduced_at", { withTimezone: true }).defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Referral = typeof referrals.$inferSelect;
