import { openai } from "./openai";
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

const RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "advisor_intent",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        matchedClientName: {
          type: ["string", "null"],
          description: "Exact client name from the provided list, or null.",
        },
        intents: {
          type: "array",
          items: { type: "string" },
        },
        move: {
          type: ["object", "null"],
          additionalProperties: false,
          properties: {
            amount: {
              type: "number",
              description: "Stated dollar figure (not cents). No arithmetic.",
            },
            direction: { type: "string", enum: ["in", "out"] },
          },
          required: ["amount", "direction"],
        },
        confidence: { type: "number" },
        summary: { type: "string" },
      },
      required: ["matchedClientName", "intents", "move", "confidence", "summary"],
    },
  },
};

export async function extractIntent(
  transcript: string,
  clientNames: string[]
): Promise<RawExtraction> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: RESPONSE_FORMAT,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Client list:\n${clientNames.map((n) => `- ${n}`).join("\n")}\n\nVoice note transcript:\n"""${transcript}"""`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Model returned no content");

  const parsed = JSON.parse(content) as RawExtraction;
  // Clamp confidence defensively; the model occasionally reports >1 or <0.
  parsed.confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
  return parsed;
}
