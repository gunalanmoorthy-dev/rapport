/**
 * Offline mock for the AI pipeline so the Echo loop is fully demoable without a
 * Gemini API key (e.g. while recording a demo video).
 *
 * Mock mode is ON when `AI_MOCK === "true"` OR no `GEMINI_API_KEY` is set, so the
 * app never errors on a missing key. Set a real key and leave `AI_MOCK` unset to
 * use Gemini for real. Optionally pin a single scenario with `AI_MOCK_SCENARIO`
 * (one of the scenario ids below); otherwise a random scenario is returned per
 * recording, exercising all three outcomes (commit / stage / overspend).
 *
 * The mock ignores the uploaded audio and the transcript content — it returns a
 * canned transcript from {@link mockTranscribe}, and {@link mockExtractIntent}
 * looks that exact transcript back up to return the matching extraction.
 *
 * @module lib/ai-mock
 */
import type { RawExtraction } from "./extract";

/** A canned demo brief paired with the extraction it should produce. */
type Scenario = { id: string; transcript: string; extraction: RawExtraction };

// Scenarios reference seeded clients (see scripts/seed.ts) so the verify/commit
// path produces real outcomes against real balances.
const SCENARIOS: Scenario[] = [
  {
    // High confidence + valid inflow -> auto-commits, balance goes up.
    id: "commit-inflow",
    transcript:
      "Okay, quick recap from my meeting this afternoon with Priya Venkataraman. She came in with her husband — they've just sold their stake in the family business and the proceeds have finally cleared. We spent most of the hour talking through her time horizon and risk appetite now that she's closer to retirement, and she's comfortable staying with the balanced mandate we agreed last quarter. The headline action: she's contributing an additional two hundred thousand dollars to her portfolio, allocated along that same mandate — please add the two hundred thousand dollar contribution to her account. She also mentioned she'll be travelling through August, so let's pencil in the next review for September.",
    extraction: {
      matchedClientName: "Priya Venkataraman",
      intents: ["Add a $200,000 contribution to the portfolio"],
      move: { amount: 200000, direction: "in" },
      confidence: 0.97,
      summary: "Priya Venkataraman is contributing $200,000 to her portfolio.",
    },
  },
  {
    // High confidence + valid outflow -> auto-commits, balance goes down.
    id: "commit-outflow",
    transcript:
      "Just wrapping up after my meeting with Eleanor Harrington — really good catch-up, she's in great spirits. The main thing is she's finally found a property, a small place by the coast she's been wanting for years, and she needs liquidity for the deposit. She wants to withdraw fifty thousand dollars for the property deposit, ideally settled by the end of the month. We talked through whether to draw it from the cash position or trim the bond allocation, and she's comfortable taking the whole fifty thousand from cash. Everything else in the financial plan stays exactly as is.",
    extraction: {
      matchedClientName: "Eleanor Harrington",
      intents: ["Withdraw $50,000 for a property deposit"],
      move: { amount: 50000, direction: "out" },
      confidence: 0.95,
      summary: "Eleanor Harrington is withdrawing $50,000 for a property deposit.",
    },
  },
  {
    // Outflow that exceeds the balance -> flagged invalid, routed to Staging.
    id: "overspend",
    transcript:
      "Note from my call with James Whitlock — and this one's a bit of a curveball, so flagging it. He's looking at a large off-market acquisition and got fairly insistent on the phone about timing. He wants to pull out five million dollars right away, today if at all possible. I told him I'd log the request but that we'd need to review feasibility against his actual holdings before anything moves. Putting this in for a second set of eyes before we action it.",
    extraction: {
      matchedClientName: "James Whitlock",
      intents: ["Withdraw $5,000,000 immediately"],
      move: { amount: 5000000, direction: "out" },
      confidence: 0.96,
      summary: "James Whitlock wants to withdraw $5,000,000 immediately.",
    },
  },
  {
    // High confidence, no money move -> commits a note, no balance change.
    id: "note",
    transcript:
      "Quick note for Sophie Delacroix's file after our coffee this morning. No transactions today — this is purely a preference she raised and wanted on record. She's increasingly focused on sustainability and asked specifically about ESG screening for the next tranche of capital we deploy; in particular she wants to make sure we're not holding anything in fossil fuels or weapons manufacturers. Please flag ESG screening for the quarterly review so we can bring her a proper set of options then.",
    extraction: {
      matchedClientName: "Sophie Delacroix",
      intents: ["Flag ESG screening for the quarterly review"],
      move: null,
      confidence: 0.93,
      summary: "Sophie Delacroix asked about ESG screening for the next tranche.",
    },
  },
  {
    // Ambiguous / low confidence -> routed to Staging for review.
    id: "ambiguous",
    transcript:
      "Hey, just dictating a quick thought before I forget. Had a hallway chat at the industry event tonight — someone mentioned maybe moving some money around later in the year, possibly a rebalance or pulling some out, but honestly I'm not totally sure who it was or how much we're talking about. Putting this here so it doesn't get lost, but I'll need to follow up and confirm the details before we do anything at all.",
    extraction: {
      matchedClientName: null,
      intents: ["Clarify an unconfirmed future change"],
      move: null,
      confidence: 0.2,
      summary: "An unconfirmed mention of a possible future change; client and amount unclear.",
    },
  },
];

/** Whether the AI pipeline should run in offline mock mode. */
export function isAiMock(): boolean {
  return process.env.AI_MOCK === "true" || !process.env.GEMINI_API_KEY;
}

/** Pick the pinned scenario (via `AI_MOCK_SCENARIO`) or a random one. */
function pickScenario(): Scenario {
  const pinned = SCENARIOS.find((s) => s.id === process.env.AI_MOCK_SCENARIO);
  if (pinned) return pinned;
  return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Return a canned transcript, ignoring the uploaded audio.
 *
 * @returns A demo brief transcript that {@link mockExtractIntent} recognizes.
 */
export async function mockTranscribe(): Promise<string> {
  await sleep(700); // let the recorder's "transcribing" state show
  return pickScenario().transcript;
}

/**
 * Return the extraction matching a canned transcript.
 *
 * @param transcript - The (mock) transcript, used to look up the scenario.
 * @returns The scenario's extraction, or a low-confidence "needs review" result
 *          if the transcript isn't one of ours (so it safely stages).
 */
export async function mockExtractIntent(transcript: string): Promise<RawExtraction> {
  await sleep(600); // let the recorder's "analyzing" state show
  const match = SCENARIOS.find((s) => s.transcript === transcript);
  if (match) return match.extraction;
  return {
    matchedClientName: null,
    intents: ["Review this brief"],
    move: null,
    confidence: 0.3,
    summary: transcript.slice(0, 140),
  };
}
