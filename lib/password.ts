/**
 * Password hashing with Node's built-in scrypt — no native dependency.
 *
 * Node-only (uses `node:crypto` + `Buffer`); import only from the Node runtime
 * (the login route and the seed script), never from middleware/edge.
 *
 * @module lib/password
 */
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

/**
 * Hash a plaintext password.
 *
 * @param password - The plaintext password.
 * @returns A `"<saltHex>:<hashHex>"` string safe to store in the database.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Verify a plaintext password against a stored hash, in constant time.
 *
 * @param password - The candidate plaintext password.
 * @param stored - The `"<saltHex>:<hashHex>"` value produced by {@link hashPassword}.
 * @returns `true` if the password matches.
 */
export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const hash = Buffer.from(hashHex, "hex");
  const test = scryptSync(password, Buffer.from(saltHex, "hex"), hash.length);
  return hash.length === test.length && timingSafeEqual(hash, test);
}
