# Rapport — The Advisor's Silent Back-Office

> Turn a spoken voice note into verified CRM updates, compliance logs, and
> portfolio reconciliation — so financial advisors stay with their clients,
> not their keyboards.

**Team 1MAS** · Built on Next.js + Neon + Google Gemini · Deployed on Vercel

---

## Inspiration

Financial advisors don't lose clients because they give bad advice — they lose
them because they're buried in admin. After every client meeting comes a tail of
invisible work: updating the CRM, logging the call, reconciling a portfolio move,
noting a sentiment change, filing for compliance. It's the work nobody sees and
everybody resents, and it pulls advisors away from the one thing that actually
compounds trust: time with their clients.

We kept hearing the same thing — *"I became an advisor to advise, not to do data
entry."* So we asked a sharper question: what if an advisor could just *talk*, the
way they already debrief after a meeting, and everything else simply happened in
the background — correctly, and without ever letting an AI touch a client's money?

## What it does

Rapport is **the advisor's silent back-office.** After a meeting, an advisor
records a quick spoken brief — an **Echo** — in plain, unstructured speech. From
that single voice note, Rapport:

1. **Transcribes** the audio.
2. **Extracts structured intent** — which client, what changed, any portfolio
   move — as verified JSON.
3. **Verifies the math in code, never with the AI.** Every figure is recomputed
   against the client's real balance; an overspend or invalid move is rejected
   before it can touch the database.
4. **Commits or stages by confidence.** High-confidence, math-valid updates
   auto-commit; anything ambiguous (low confidence, unmatched client, or an
   overspend) lands in a per-client **Staging** log — full transcript beside the
   AI's pinpoint summary — so nothing risky is ever applied silently.

On top of the core loop, Rapport gives a firm three role-aware surfaces from one
codebase:

- **Advisors** get their book of business, the Echo recorder, staging review,
  notes, compliance/CPD tracking, and a morning digest.
- **Admins** get firm-wide, read-only oversight of every advisor they manage.
- **Partners** get the shared **Partnership ecosystem** — the firm's specialist
  network, a contacts directory, and the live referral pipeline.

The result: the administrative burden disappears, while the advisor keeps full
control and the AI never becomes the source of truth for a number.

## How we built it

- **Frontend:** Next.js (App Router, Turbopack), React, TypeScript, and Tailwind
  — deployed on Vercel.
- **Database:** Neon serverless Postgres with Drizzle ORM. Money is stored as
  **integer cents** end-to-end (`bigint`) so float drift is impossible.
- **AI:** Google Gemini for transcription and **schema-bound** structured
  extraction (`responseMimeType: "application/json"` + a strict `responseSchema`),
  so the model's output always deserializes into a typed shape — no free-text
  parsing, no prompt-injected control flow.
- **The trust gate:** a pure, side-effect-free `verifyMove` recomputes every
  balance in plain TypeScript and is the *only* place that decides whether money
  may move. It's fully unit-tested.
- **Auth & tenancy:** HMAC-signed, httpOnly session cookies verified at the edge,
  with role-based routing (advisor / admin / partner) and `advisorId`-scoped
  queries enforcing tenant isolation on every read.

## Challenges we ran into

- **Trust, not transcription, was the hard problem.** An advisor handling real
  client money can't accept a system that might invent a balance or approve a bad
  trade. We drew a hard architectural line between **interpretation** (the model)
  and **decision** (deterministic code) — the model returns only the *stated*
  figure and is explicitly forbidden from doing arithmetic or unit conversion.
- **Tuning automation vs. trust.** The whole product lives or dies on the
  `AUTO_COMMIT_THRESHOLD`. Too low and it feels magical but risks silent bad
  writes; too high and everything piles into the review queue and it stops saving
  time.
- **Time-of-check vs. time-of-use.** A balance can change between recording and
  review, so approving a staged echo **re-verifies against the current balance**,
  not the value captured earlier.
- **Provider migration mid-build.** We moved from OpenAI to Gemini — and because
  all LLM access is isolated behind two files, the trust-critical path didn't
  change at all.
- **One UI, three roles.** Reusing the partnership view verbatim across admin and
  partner while keeping role boundaries airtight took a few iterations on routing
  and the login flow.

## Accomplishments that we're proud of

- **A genuinely trustworthy AI pipeline** where the language model never decides a
  number — every figure is recomputed and gated by deterministic, testable code.
- **A real working loop:** voice → transcribe → extract → verify →
  commit-or-stage, with atomic transactions and a full provenance trail
  (`committed` / `staged` / `rolled_back`) linking every move back to the echo
  that produced it.
- **Money math you can trust** — integer cents throughout, so `$0.10 + $0.20` can
  never become `$0.30000000000000004`.
- **A polished, multi-role product** (advisor, admin, partner) with proper tenant
  isolation, not just a demo screen.

## What we learned

- **Constrain the model, trust the code.** Schema-bound extraction plus a
  deterministic verifier gives you the magic of an LLM without ever making it the
  authority on truth.
- **The boundary is the product.** Most of our design effort went into *where* the
  AI stops and code begins, and into making the staging diff fast enough that
  review isn't a chore.
- **Provider-agnostic architecture pays off** — isolating AI access made a
  mid-build model swap nearly free.
- **Operate in the background.** The best version of this isn't a chatbot; it's
  infrastructure the advisor barely notices.

## What's next for Rapport

- **Live integrations** with real custodians and CRMs (Salesforce, Redtail) so
  commits flow into the systems firms already run on.
- **Calendar-aware Echoes** that pre-fill the client and context from the meeting
  that just ended.
- **Smarter confidence routing** that learns each advisor's review patterns to
  safely raise the auto-commit bar over time.
- **Compliance-grade audit exports** and e-sign-ready advisor briefs.
- **A native mobile recorder** for hands-free briefs straight from the car.
- **Deeper partner ecosystem** — referral tracking, conversion analytics, and
  warm-intro automation across the firm.

## Built with

`next.js` · `react` · `typescript` · `tailwindcss` · `node.js` · `neon` ·
`postgresql` · `drizzle-orm` · `google-gemini` · `vercel` · `web-crypto-api` ·
`scrypt` · `zod` · `pnpm` · `web-audio-api`
