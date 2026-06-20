# Rapport

**The advisor's silent back-office.** Rapport turns a 60-second voice note into verified CRM updates, compliance logs, and portfolio reconciliation — so financial advisors stay with their clients, not their keyboards.

## Team — 1MAS

1MAS is a team of three builders focused on tools that remove invisible administrative friction from high-trust professions.

- **Gunalan A/L Moorthy** — Backend & database (Neon, Drizzle, the API pipeline, and the verify/commit-or-stage core loop)
- **Adam Ashwin Tay** — Frontend & UX (Next.js screens, the Echo recorder, and the staging review queue)
- **Khan Khai Qian** — AI & integration (Gemini transcription, structured extraction, and prompt/schema design)

## What it does

After a client meeting, an advisor records a 60-second voice brief (an "Echo") in plain, unstructured speech. From that single recording, Rapport:

1. **Transcribes** the audio (Gemini).
2. **Extracts** structured intent — which client, what changed, any portfolio move — as verified JSON.
3. **Verifies the math in code, never by the AI.** Every figure is checked against the client's actual balance; an overspend or invalid move is rejected before it can touch the database.
4. **Commits or stages by confidence.** High-confidence, math-valid updates auto-commit to the database. Anything ambiguous (low confidence, unmatched client, or an overspend) is captured in a per-client Staging log — the full transcript next to the AI's pinpoint summary — so nothing risky is applied silently.

The result: the administrative burden disappears, while the advisor keeps full control and the AI never touches the client.

## Why it's different

Rapport operates entirely in the **background** — it's an operational backend, not a client-facing chatbot. Trust is the core design principle: the language model only *interprets* data, while all financial math is computed deterministically in code, so it can't hallucinate a number.

## Technologies used

- **Frontend:** Next.js (App Router), TypeScript, Tailwind — deployed on Vercel
- **Database:** Neon Postgres (Drizzle ORM)
- **AI:** Google Gemini (transcription + structured extraction)

## Challenges and approach

The hard problem in Rapport isn't transcription — it's **trust**. An advisor handling real client money cannot accept a system that might invent a balance or approve an invalid trade. So the central design challenge was: *how do we use a language model without ever letting it be the source of truth for a number?*

We solved it by drawing a hard architectural boundary between **interpretation** (the model) and **decision** (deterministic code):

- **Constrained, schema-bound extraction.** The `/api/echo/process` route calls Gemini with `responseMimeType: "application/json"` and a strict `responseSchema`, so the output is guaranteed to deserialize into a typed `RawExtraction` — no free-text parsing, no prompt-injection of control flow. Crucially, the model returns the *stated* figure only (e.g. `"six hundred thousand" → 600000`); it is explicitly instructed never to convert units or do arithmetic.
- **Money is integer cents, end to end.** Code multiplies the model's dollar figure by 100 once, then everything downstream — storage (`bigint`), comparison, and the balance update — operates on integer cents. This sidesteps IEEE-754 float drift entirely, so `$0.10 + $0.20` can never become `$0.30000000000000004`.
- **A deterministic verifier as the trust gate.** `lib/verify.ts#verifyMove` recomputes the resulting balance in plain TypeScript and rejects any outflow that exceeds the client's balance. This is pure, side-effect-free, and unit-testable — the one place that decides whether money may move.
- **Three-way confidence routing.** The model's `confidence` is clamped to `[0,1]` and a change auto-commits **only** when `confidence ≥ 0.9` *and* the verifier passes *and* a client was matched. Everything else — low confidence, an unmatched client, or a failed math check (overspend) — is written as `status: "staged"` with no balance change, surfaced in the review queue as a before/after diff.
- **Atomic commits, re-verified on approval.** An auto-commit runs inside a single Drizzle transaction that inserts the echo, inserts the `portfolio_move`, and updates the client balance together — any failure rolls the whole thing back. Because a balance can change between recording and review, approving a staged echo **re-runs `verifyMove` against the *current* balance** rather than the value captured earlier, closing a time-of-check/time-of-use gap. Every committed move keeps a foreign key back to the echo that produced it, giving a full provenance trail (`committed` / `staged` / `rolled_back`).
- **Provider-agnostic core.** All LLM access is isolated in `lib/extract.ts` and `lib/gemini.ts`; the verify/commit/database path imports no AI SDK. Swapping models (we migrated OpenAI → Gemini mid-build) touches two files and leaves the trust-critical code untouched.

The biggest tradeoff we navigated was **automation vs. trust**, expressed concretely as the `AUTO_COMMIT_THRESHOLD`. Set it too low and the product feels magical but risks silent bad writes; too high and everything lands in the queue and it stops saving time. Tuning that boundary — and making the staging diff fast enough that review isn't a chore — was where most of our design effort went.

## Core flow

```
Voice note → Transcribe → Extract intent → Verify math (in code) → Commit (high confidence) or Stage for review (low confidence)
```

## Getting started

### Prerequisites

- Node.js 20+ and [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- A [Neon](https://neon.tech) Postgres database
- A [Google Gemini](https://aistudio.google.com/apikey) API key

### 1. Clone and install

```bash
git clone <your-repo-url>
cd rapport
pnpm install
```

### 2. Environment variables

Create a `.env.local` file in the project root:

```
DATABASE_URL=your-neon-pooled-connection-string
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Set up the database

The Drizzle schema in [`db/schema.ts`](db/schema.ts) mirrors four tables in Neon
(`advisors`, `clients`, `echoes`, `portfolio_moves`). If your database already has
them, skip straight to seeding. Otherwise, create them to match `db/schema.ts`
(via the Neon SQL Editor), then seed the demo advisor + clients:

```bash
pnpm run seed   # seed demo advisor + clients (re-runnable)
```

### 4. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Go to `/echo`, record a brief, and watch it transcribe, extract, verify, and commit or stage.

### 5. Deploy

Push to `main` — Vercel auto-deploys. Set `DATABASE_URL` and `GEMINI_API_KEY` in your Vercel project's Environment Variables (all environments), then redeploy.

## Project structure

```
app/            Next.js App Router pages and API routes
  echo/         Voice-brief recording screen
  clients/      Book of business — add/edit/delete + approve pending (+ detail, brief)
  staging/      Per-client log: full transcript vs. AI summary, editable contacts
  notes/        Free-text note per client
  compliance/   Activities & seminars (past + upcoming), with an add form
  digest/ audit/ Morning brief + immutable audit trail
  api/
    echo/       transcribe + process (Gemini) pipeline routes
    clients/    create / edit / approve / delete
    activities/ create / delete
db/             Drizzle schema and database client
lib/            Extraction (AI), verification (code), queries, display helpers, AI mock
scripts/        Seed, additive schema migration, and a commit-loop smoke test
components/     UI components (in-app + landing)
```

## Database schema

- **advisors** — the advisor account
- **clients** — each advisor's clients: balance (integer cents), sentiment (green/amber/red), email, phone, approval `status` (pending/active), and a free-text `note`
- **echoes** — every voice brief: transcript, extracted JSON, confidence, status (committed/staged/rolled_back)
- **portfolio_moves** — committed money movements, linked to the echo that produced them
- **activities** — continuing-education activities/seminars (title, category, `scheduled_at`) for the Compliance log

## License

Released under the [MIT License](LICENSE). Some UI primitives under `components/ui`
were scaffolded by [v0](https://v0.app) and remain under their original terms.
