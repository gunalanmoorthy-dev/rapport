/**
 * Structured-intent extraction from a voice-brief transcript, via Gemini.
 *
 * This is the *only* place the app talks to the LLM for understanding a brief.
 * It is deliberately isolated from the verify/commit/DB code so the AI provider
 * can be swapped without touching the trust-critical path. The model is kept
 * purely extractive — see {@link RawExtraction}.
 *
 * @module lib/extract
 */
import { Type } from "@google/genai";
import { genai } from "./gemini";
import { isAiMock, mockExtractIntent } from "./ai-mock";
import type { MoveDirection } from "@/db/schema";

/**
 * Raw, purely-extractive output from the model. The model reports the dollar
 * figure it HEARD (`move.amount`) — it does no arithmetic and never converts to
 * cents or touches balances. Code multiplies by 100 and runs every check.
 */
export type RawExtraction = {
  matchedClientName: string | null;
  intents: string[];
  move: { amount: number; direction: MoveDirection } | null;
  confidence: number;
  summary: string;
};

const SYSTEM_PROMPT = `You extract structured intent from a wealth advisor's spoken voice note after a client meeting.

Rules:
- Never invent numbers, clients, or facts. Only capture what is explicitly stated.
- Match the client to exactly one name from the provided client list. If there is no clear match, or you are unsure, set matchedClientName to null.
- If the advisor states a concrete money movement, fill "move":
  - "amount" is the plain dollar figure they said (e.g. "six hundred thousand" -> 600000). Report the stated figure only — do NOT convert to cents and do NOT do any arithmetic.
  - "direction" is "in" for money added / deposited / bought / contributed, and "out" for money withdrawn / sold / raised / removed.
  - If no concrete money movement is stated, set "move" to null.
- "intents" is a short list of the discrete things the advisor wants done or noted.
- "summary" is one concise sentence capturing the note.
- "confidence" is 0 to 1. Lower it when the client is ambiguous, the figure is vague or unstated, the direction is unclear, or the intent is fuzzy.`;

// Gemini structured-output schema producing the exact RawExtraction shape.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    matchedClientName: {
      type: Type.STRING,
      nullable: true,
      description: "Exact client name from the provided list, or null.",
    },
    intents: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    move: {
      type: Type.OBJECT,
      nullable: true,
      description: "A stated money movement, or null if none.",
      properties: {
        amount: {
          type: Type.NUMBER,
          description: "Stated dollar figure (not cents). No arithmetic.",
        },
        direction: { type: Type.STRING, enum: ["in", "out"] },
      },
      required: ["amount", "direction"],
    },
    confidence: { type: Type.NUMBER },
    summary: { type: Type.STRING },
  },
  required: ["matchedClientName", "intents", "move", "confidence", "summary"],
  propertyOrdering: ["matchedClientName", "intents", "move", "confidence", "summary"],
};

/**
 * Extract structured intent from a transcript using Gemini structured output.
 *
 * Runs at `temperature: 0` with a strict response schema so the output always
 * parses into {@link RawExtraction}. The model is told the advisor's client
 * names so it can match one by name (or return `null` when unsure). It reports
 * the stated dollar figure only — the caller converts to cents and runs
 * {@link verifyMove}; the model never does arithmetic.
 *
 * @param transcript - The (already transcribed) voice-brief text.
 * @param clientNames - The advisor's client names, for name matching.
 * @returns The parsed extraction, with `confidence` clamped to `[0, 1]`.
 * @throws If the model returns no content.
 */
export async function extractIntent(
  transcript: string,
  clientNames: string[]
): Promise<RawExtraction> {
  // Offline demo path — no Gemini call. See lib/ai-mock.ts.
  if (isAiMock()) return mockExtractIntent(transcript);

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Client list:\n${clientNames.map((n) => `- ${n}`).join("\n")}\n\nVoice note transcript:\n"""${transcript}"""`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const content = response.text;
  if (!content) throw new Error("Model returned no content");

  const parsed = JSON.parse(content) as RawExtraction;
  // Clamp confidence defensively; the model occasionally reports >1 or <0.
  parsed.confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
  return parsed;
}
