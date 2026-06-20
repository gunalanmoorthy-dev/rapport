# Rapport — Demo Video Script (~2:45)

A tight, sub-3-minute script for the submission video. It covers the **problem**,
**who it's for**, **why**, shows the **working app**, and names the **tech**.

> **Live URL:** https://rapport-advisor.vercel.app · start on the landing page.

---

## Before you record (2-minute setup)

1. **Reset demo data** so balances are clean: `pnpm run seed`.
2. **Pin the scenario per take** (so the AI output is predictable on camera). The
   app runs in offline mock mode, so each recording plays a canned brief.
   - For the **commit** take, set `AI_MOCK_SCENARIO=commit-inflow`.
   - For the **overspend** take, set `AI_MOCK_SCENARIO=overspend`.
   - On Vercel: Project → Settings → Environment Variables → set it on
     Production, redeploy. Or run locally with the var set.
3. Open two browser tabs: **/echo** and **/clients** (so you can cut to the
   updated balance).
4. Have the **Staging** tab ready too: **/staging**.

> Whatever you say into the mic, the on-screen transcript is the pinned
> scenario — narrate along with it, don't read a different sentence.

---

## The script

### 0:00 – 0:18 — The problem (landing page on screen)

> "Financial advisors spend up to a third of their week not with clients — but
> on paperwork. Logging the meeting, updating the CRM, reconciling the portfolio,
> filing compliance notes. Every minute on the keyboard is a minute not building
> the relationship."

*On screen: slow scroll of the Rapport landing — hero, then the "How Rapport
works" pillars.*

### 0:18 – 0:32 — What it is & who it's for

> "Rapport is the advisor's silent back-office. After a meeting, you record one
> 60-second voice note — and Rapport turns it into verified CRM, compliance, and
> portfolio updates. It's built for financial advisors who manage real client
> money and can't afford a mistake."

*On screen: click into the app, land on **/clients** — show the book of business
with real balances and green/amber/red sentiment.*

### 0:32 – 1:15 — The core loop: record → commit (the happy path)

*Pin `commit-inflow`. Go to **/echo**, hit record, speak ~10s, stop.*

> "Here's the whole product. I just got off a call with a client who's adding to
> her portfolio. I record a quick brief…"

*On screen: the transcript appears, then "Rapport is thinking", then the result
card: **Committed to Priya Venkataraman — balance updated**, with the move and
the new balance.*

> "Rapport transcribed it, understood the intent, checked the math against her
> real balance, and — because it was confident and the numbers were valid —
> committed it automatically. No typing."

*Cut to the **/clients** tab, refresh: Priya's balance is now higher.*

### 1:15 – 2:00 — The trust mechanic: overspend → staging

*Pin `overspend`. Back to **/echo**, record again.*

> "But what happens when something's wrong? Here a brief says to withdraw five
> million dollars from a client who only has three."

*On screen: the result card shows **Sent to Staging — Overspend**, flagged
invalid, balance unchanged.*

> "The AI never does the math. Every figure is recomputed in code, and an
> overspend can never auto-commit. It's flagged and sent to a review queue."

*Cut to **/staging**: show the before/after diff and the red "Overspend" tag.
Click **Reject** — the balance stays untouched.*

> "The advisor stays in control of every edge case — approve or reject with a
> clean before-and-after diff. Nothing changes behind your back."

### 2:00 – 2:30 — Why it's different + the stack

*On screen: the "Trust" section of the landing, or the client detail page.*

> "What makes Rapport trustworthy is one design decision: the AI only
> *interprets* speech into structured intent — it never decides a number. All the
> financial math runs in deterministic code before anything touches the database.
> And it's all back-office: there's zero client-facing AI."

> "It's built on Next.js and deployed on Vercel, with a Neon Postgres database
> through Drizzle, and Google Gemini for transcription and extraction."

### 2:30 – 2:45 — Close

> "Rapport gives advisors their time back — without ever giving up control.
> Talk for a minute; we'll handle the paperwork."

*On screen: back to the hero. End on the wordmark.*

---

## Shot list (quick reference)

| Time | Screen | Action |
| ---- | ------ | ------ |
| 0:00 | Landing | Scroll hero → pillars |
| 0:18 | /clients | Show book + sentiment |
| 0:32 | /echo | Record → **auto-commit** (commit-inflow) |
| 1:05 | /clients | Refresh → balance updated |
| 1:15 | /echo | Record → **overspend** (overspend) |
| 1:35 | /staging | Before/after diff → **Reject** |
| 2:00 | Landing/Trust | "AI interprets, code decides" |
| 2:30 | Landing hero | Wordmark close |

---

## One-liners you can drop in

- "The AI interprets; the code decides."
- "An overspend can never auto-commit."
- "Zero client-facing AI."
- "Talk for a minute — we'll do the paperwork."
