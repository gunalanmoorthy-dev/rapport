/**
 * Distill a field-brief transcript into a reusable, shareable lesson — via Gemini,
 * interpretation ONLY. Follows the same shape as `lib/extract.ts`: strict response
 * schema, temperature 0, JSON mime, and an offline mock path.
 *
 * The model never decides what is safe to store — `lib/scrub.ts` does that
 * deterministically after this step.
 *
 * @module lib/extractBrief
 */
import { Type } from "@google/genai";
import { genai } from "./gemini";
import { isAiMock } from "./ai-mock";

/** Interpretation-only output: a short summary, topic tags, and the problem domain. */
export type BriefExtraction = {
  summary: string;
  tags: string[];
  problemDomain: string | null;
};

const SYSTEM_PROMPT = `You distill a wealth advisor's spoken field note into a short, reusable lesson their colleagues can learn from.

Rules:
- "summary": 1–2 sentences describing the situation and what was done. Generalize it; do NOT include any client name, contact detail, or personal identifier.
- "tags": a few short lowercase topic tags (e.g. "de-risking", "liquidity-planning").
- "problemDomain": the single domain this brief is about (e.g. "liquidity planning"), or null if unclear.
- Interpretation only — never invent facts that were not stated.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    problemDomain: { type: Type.STRING, nullable: true },
  },
  required: ["summary", "tags", "problemDomain"],
  propertyOrdering: ["summary", "tags", "problemDomain"],
};

/** Canned offline output (used when {@link isAiMock} is true). */
function mockExtractBrief(): BriefExtraction {
  return {
    summary:
      "Advisor de-risked a client ahead of a property purchase, moving proceeds into short-duration treasuries to protect near-term liquidity.",
    tags: ["de-risking", "liquidity-planning", "fixed-income"],
    problemDomain: "liquidity planning",
  };
}

/**
 * Extract a reusable brief from a transcript.
 *
 * @param transcript - The (already transcribed) field-note text.
 * @returns The interpreted {@link BriefExtraction}; `tags` defaults to `[]`.
 * @throws If the model returns no content.
 */
export async function extractBrief(transcript: string): Promise<BriefExtraction> {
  if (isAiMock()) return mockExtractBrief();

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Field note transcript:\n"""${transcript}"""`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const content = response.text;
  if (!content) throw new Error("Model returned no content");

  const parsed = JSON.parse(content) as BriefExtraction;
  parsed.tags = Array.isArray(parsed.tags) ? parsed.tags : [];
  return parsed;
}
