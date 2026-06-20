/**
 * Deterministic PII redaction — the privacy gate for the brief library.
 *
 * Pure, side-effect-free, and unit-testable (same discipline as `lib/verify.ts`).
 * No AI: the model decides nothing about what is safe to store. This runs in code
 * over the transcript and summary BEFORE anything is written, and nothing is
 * stored unscrubbed. It is intentionally conservative — over-redaction is the
 * safe failure mode for a privacy gate.
 *
 * Redacts: email addresses, phone numbers, Malaysian NRIC, card-like digit runs,
 * and any client names passed in.
 *
 * @module lib/scrub
 */

export type ScrubResult = { text: string; redactionsCount: number };

const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const NRIC_DASHED = /\b\d{6}-\d{2}-\d{4}\b/g; // MY NRIC: YYMMDD-PB-###G
const NRIC_PLAIN = /\b\d{12}\b/g;
// A run of digits (with spaces/dashes) at least 13 long — count digits in code.
const DIGIT_RUN = /\d[\d -]{11,}\d/g;
// Phone-ish: optional +, then digits/separators; validated to 7–15 digits in code.
const PHONE = /\+?\d[\d\s().-]{5,}\d/g;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Redact PII from a string.
 *
 * @param input - The raw text.
 * @param clientNames - Names to redact verbatim (case-insensitive, whole word).
 * @returns The scrubbed text and how many redactions were made.
 */
export function scrub(input: string, clientNames: string[] = []): ScrubResult {
  let count = 0;
  let text = input ?? "";

  const replaceAll = (re: RegExp, repl: string) => {
    text = text.replace(re, () => {
      count++;
      return repl;
    });
  };

  // 1) Emails.
  replaceAll(EMAIL, "[redacted email]");

  // 2) Card-like runs (13–19 digits). Shorter runs are left for NRIC/phone.
  text = text.replace(DIGIT_RUN, (m) => {
    const digits = m.replace(/\D/g, "").length;
    if (digits >= 13 && digits <= 19) {
      count++;
      return "[redacted card]";
    }
    return m;
  });

  // 3) Malaysian NRIC (dashed then plain 12-digit).
  replaceAll(NRIC_DASHED, "[redacted id]");
  replaceAll(NRIC_PLAIN, "[redacted id]");

  // 4) Phone numbers (7–15 digits once separators are stripped).
  text = text.replace(PHONE, (m) => {
    const digits = m.replace(/\D/g, "").length;
    if (digits >= 7 && digits <= 15) {
      count++;
      return "[redacted phone]";
    }
    return m;
  });

  // 5) Client names (whole word, case-insensitive).
  for (const name of clientNames) {
    const n = name?.trim();
    if (!n) continue;
    replaceAll(new RegExp(`\\b${escapeRegExp(n)}\\b`, "gi"), "[redacted name]");
  }

  return { text, redactionsCount: count };
}
