/**
 * Database connection for the app.
 *
 * Uses the Neon serverless driver so it works on Vercel's serverless/edge
 * runtimes (a normal `pg` Pool keeps TCP sockets a serverless function can't).
 * The driver connects lazily on first query, so importing this module is cheap
 * and safe even when `DATABASE_URL` is momentarily unset (e.g. at build time).
 *
 * @module db/client
 */
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

/** Low-level connection pool. Exported so transactions/scripts can close it. */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** The Drizzle ORM instance — the primary entry point for all queries. */
export const db = drizzle(pool, { schema });

export { pool };
