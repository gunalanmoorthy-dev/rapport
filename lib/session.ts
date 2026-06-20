/**
 * Stateless session tokens: a compact `<payload>.<hmac>` string signed with
 * HMAC-SHA256 via the Web Crypto API.
 *
 * Web Crypto + `btoa`/`atob` are available in BOTH the Node and Edge runtimes,
 * so this module can be used from middleware (edge) and route handlers (node)
 * alike. It carries no secret beyond `AUTH_SECRET` and stores no server state.
 *
 * @module lib/session
 */

type SessionPayload = { sub: string; exp: number };

const enc = new TextEncoder();
const dec = new TextDecoder();

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set.");
  return s;
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(str: string): Uint8Array {
  const norm = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = norm.length % 4 ? 4 - (norm.length % 4) : 0;
  const bin = atob(norm + "=".repeat(pad));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// crypto.subtle wants a BufferSource; TextEncoder/our decoders yield
// Uint8Array<ArrayBufferLike>, which TS's strict lib types reject — cast here.
const bs = (b: Uint8Array): BufferSource => b as unknown as BufferSource;

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    bs(enc.encode(secret())),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Sign a session token for an advisor.
 *
 * @param advisorId - The advisor's UUID (stored as the token subject).
 * @param ttlSeconds - Token lifetime in seconds (default 7 days).
 * @returns A `<payload>.<signature>` token to store in an httpOnly cookie.
 */
export async function signSession(advisorId: string, ttlSeconds = 7 * 86400): Promise<string> {
  const payload: SessionPayload = {
    sub: advisorId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = bytesToB64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), bs(enc.encode(body)));
  return `${body}.${bytesToB64url(new Uint8Array(sig))}`;
}

/**
 * Verify a session token and return the advisor id if valid and unexpired.
 *
 * @param token - The `<payload>.<signature>` token from the cookie.
 * @returns The advisor id, or `null` if the token is missing/forged/expired.
 */
export async function verifySession(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      bs(b64urlToBytes(sig)),
      bs(enc.encode(body))
    );
    if (!ok) return null;
    const payload = JSON.parse(dec.decode(b64urlToBytes(body))) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now() / 1000) return null;
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "rapport_session";
export const SESSION_TTL_SECONDS = 7 * 86400;
