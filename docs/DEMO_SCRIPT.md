# Rapport — Demo Video Script (~7:00)

A scene-by-scene script for a ~7-minute submission/demo video. It covers the
**problem**, **who it's for**, **why**, a full walkthrough of the **working app**
(all five AI scenarios), an **architecture** deep-dive, and a close.

> **Live URL:** https://rapport-advisor.vercel.app · start on the landing page.

---

## Before you record (setup)

1. **Reset demo data** so balances are clean: `pnpm run seed`.
2. The app runs in **offline AI mock mode**, so each recording plays a canned
   brief. **Pin the scenario per take** so the on-screen output is predictable:
   set `AI_MOCK_SCENARIO` to one of `commit-inflow`, `commit-outflow`, `note`,
   `ambiguous`, `overspend`.
   - On Vercel: Project → Settings → Environment Variables → set on Production →
     redeploy. (Or run locally with the var set, re-running between takes.)
3. Open tabs ready to cut between: **/echo**, **/clients**, **/staging**,
   **/digest**, and one client detail page.
4. Record each Echo take separately so you can pin a different scenario each time,
   then edit them together.

> Whatever you say into the mic, the transcript shown is the pinned scenario —
> narrate along with it; don't read a different sentence.

---

## The script

### 0:00 – 0:35 — Cold open: the problem

*On screen: the landing hero, slow scroll.*

> "Meet the modern financial advisor. They're paid to build trust and manage
> wealth — but studies put up to a third of their week on something else
> entirely: admin. After every client meeting comes the paperwork — logging what
> was said into the CRM, updating the portfolio, filing the compliance notes,
> reconciling the numbers. It's hours a week of typing, and every minute of it is
> a minute not spent with the client. Worse, it's where mistakes creep in —
> a fat-fingered figure, a missed follow-up."

### 0:35 – 1:05 — What Rapport is, and who it's for

*On screen: scroll to the "How Rapport works" pillars.*

> "Rapport is the advisor's silent back-office. The idea is simple: after a
> meeting, the advisor records a single 60-second voice note — we call it an
> Echo — in plain, natural speech. From that one recording, Rapport produces
> verified CRM updates, compliance logs, and portfolio changes. It's built
> specifically for financial advisors — people handling real client money, who
> need speed but cannot tolerate an error."

### 1:05 – 1:40 — The book of business

*On screen: navigate to **/clients**.*

> "This is the advisor's book of business. Every client, their total balance, and
> a sentiment signal — green, amber, or red — so you can see at a glance who's
> thriving and who's going cold. Total assets under management up top. Everything
> you're about to see is backed by a real Postgres database — these are live
> balances, and they'll change as we work."

*Hover a red/amber client to show the "going cold" styling.*

### 1:40 – 2:45 — Demo 1: record → auto-commit (the happy path)

*Pin `commit-inflow`. Go to **/echo**.*

> "Let's do the core loop. I've just finished a call with Priya Venkataraman —
> she's adding to her portfolio. Instead of opening five tools, I record a
> ten-second brief."

*Hit record, speak naturally for ~10s, stop.*

> "Watch what happens. First it transcribes the audio. Then it reads the
> intent — which client, what action, how much. Then — and this is the important
> part — it verifies the math in code against her actual balance."

*On screen: transcript appears → "Rapport is thinking" → result card:
**Committed to Priya Venkataraman — balance updated**, showing the inflow and the
new balance.*

> "Because it was high-confidence and the numbers checked out, it committed
> automatically. The CRM, the portfolio, the record — all updated. Zero typing."

*Cut to **/clients**, refresh: Priya's balance is now higher.*

> "And there it is, reflected live in the book of business."

### 2:45 – 3:20 — The audit trail on the client page

*Click into Priya's client detail page.*

> "Every change is traceable. On the client's page we see the portfolio move that
> just landed, and the Echo history — each brief, its confidence, and what it
> did. Nothing happens off the record; every committed move links back to the
> voice note that produced it. You can even export a clean advisor brief as a
> PDF."

*Click "Export advisor brief" to show the printable report, then back.*

### 3:20 – 4:30 — Demo 2: the trust mechanic (overspend → staging)

*Pin `overspend`. Go to **/echo**, record again.*

> "Now — what stops this from going wrong? This is the heart of the product. Here
> a brief says to withdraw five million dollars from a client who only holds
> about three."

*On screen: result card shows **Sent to Staging — Overspend**, flagged invalid,
balance unchanged.*

> "The language model never does the math. It only interprets the speech into
> structured intent. The actual arithmetic — does this client have the funds? —
> runs in deterministic code. An outflow that exceeds the balance is rejected
> before it can ever touch the database. So instead of committing a bad trade, it
> flags it and logs it for the advisor instead of acting on it."

*Cut to **/clients** briefly: that client's balance is untouched.*

### 4:30 – 5:25 — The Staging log & the rest of the workspace

*Go to **/staging**. (Have an `ambiguous` or `note` take recorded earlier too, so
there's more than one client in the log.)*

> "Everything Rapport captured lands here, grouped by client. For each brief you
> see the full transcript on the left and the AI's pinpoint summary on the right —
> so the advisor can verify exactly what was understood. Contact details are
> editable inline, right where you're reading."

*Point to the overspend brief and its summary; edit a phone number inline to show it saves.*

> "And the workspace goes further. Every client has a free-text Notes page for
> anything the advisor wants to remember…"

*Cut to **/notes**, type into a client's note, save.*

> "…a Compliance log for continuing-education activities and seminars, where you
> can add an upcoming session with its date and time…"

*Cut to **/compliance**, add an upcoming seminar via the form.*

> "…and an immutable, hash-chained Audit trail of everything that happened."

*Cut to **/audit**, scroll the ledger.*

### 5:25 – 5:55 — The morning brief

*Go to **/digest**.*

> "Because everything is captured, Rapport can hand the advisor a morning brief:
> what committed overnight, how many changes need review, and — critically — which
> clients are going cold and need a call. The admin disappears, and what's left is
> exactly the high-value decisions an advisor should be making."

### 5:55 – 6:40 — Why it works: the architecture

*On screen: the landing "Trust" section, or a simple architecture slide.*

> "So why can you trust this with real money? One design decision runs through the
> whole system: the AI interprets, but code decides. Gemini turns messy speech
> into structured, schema-validated JSON — which client, what action, what amount.
> It is never the source of truth for a number. Every figure is recomputed in
> TypeScript, money is handled as integer cents to avoid rounding errors, and a
> change only auto-commits when the model is confident *and* the math is valid.
> Everything else is staged. And it's all back-office — there is zero
> client-facing AI; the relationship stays entirely human."

> "Under the hood: Next.js on Vercel, a Neon Postgres database through Drizzle,
> and Google Gemini for transcription and extraction — with the AI layer cleanly
> isolated, so the trust-critical code never even imports it."

### 6:40 – 6:55 — What's next

> "From here the foundation extends naturally — multi-advisor accounts with
> database-enforced isolation, a fully persisted audit ledger, and direct CRM and
> custodian integrations. The trust core is built; the surface area grows."

### 6:55 – 7:00 — Close

*On screen: back to the hero, end on the wordmark.*

> "Rapport gives advisors their time back — without ever giving up control. Talk
> for a minute; we'll handle the paperwork."

---

## Shot list (quick reference)

| Time | Screen | Action / scenario |
| ---- | ------ | ----------------- |
| 0:00 | Landing | Scroll hero |
| 0:35 | Landing | Scroll "How Rapport works" pillars |
| 1:05 | /clients | Tour book + sentiment + AUM |
| 1:40 | /echo | Record → **auto-commit** (`commit-inflow`) |
| 2:30 | /clients | Refresh → balance updated |
| 2:45 | /clients/[id] | Portfolio move + Echo history → export brief |
| 3:20 | /echo | Record → **overspend** (`overspend`) |
| 4:15 | /clients | Balance untouched |
| 4:30 | /staging | Per-client log: transcript vs. AI summary; edit a contact inline |
| 4:55 | /notes, /compliance, /audit | Notes save · add upcoming seminar · scroll ledger |
| 5:25 | /digest | Morning brief — going cold, awaiting review |
| 5:55 | Landing/Trust | "AI interprets, code decides" + stack |
| 6:40 | Slide/landing | Roadmap |
| 6:55 | Landing hero | Wordmark close |

---

## Optional B-roll to fill time naturally

- Slow scroll through the full landing page during narration.
- A second auto-commit take with `commit-outflow` (Eleanor) to show a withdrawal.
- A `note` take (Sophie) to show a CRM-only update that commits without moving money.
- Cursor hovering the confidence meter on a staged item.

## One-liners you can drop in

- "The AI interprets; the code decides."
- "An overspend can never auto-commit."
- "Money is integer cents, end to end — no rounding errors."
- "Zero client-facing AI."
- "Talk for a minute — we'll do the paperwork."
