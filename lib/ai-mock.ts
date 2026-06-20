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
      "Just got off a call with Priya Venkataraman. She's contributing an additional two hundred thousand dollars to her portfolio — please add it to her account.",
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
      "Quick note from my meeting with Eleanor Harrington — she wants to withdraw fifty thousand dollars for a property deposit.",
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
      "Met with James Whitlock. He wants to pull out five million dollars right away.",
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
      "Note for Sophie Delacroix's file — she asked about ESG screening for the next tranche. Flag it for the quarterly review.",
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
      "Had a quick chat — someone mentioned maybe moving some money around later, not totally sure who or how much.",
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
