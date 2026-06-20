/**
 * Map a stated client need to specialization tags — via Gemini, interpretation
 * ONLY. Follows the same shape as `lib/extract.ts`. The model picks tags; it does
 * NOT rank partners or compute any score — `lib/partners.ts` does that in code.
 *
 * @module lib/extractNeed
 */
import { Type } from "@google/genai";
import { genai } from "./gemini";
import { isAiMock } from "./ai-mock";

/** Interpretation-only output: the specialization tags a need maps to. */
export type NeedExtraction = { specializationTags: string[] };

const SYSTEM_PROMPT = `You map a wealth advisor's stated client need to a short list of specialization tags so the right specialist partner can be found.

Rules:
- Output lowercase, hyphenated tags from areas like: estate-planning, trust, tax-planning, cross-border, offshore, insurance, risk, property, mortgage, business-succession, legal, philanthropy.
- Choose only tags clearly implied by the need. If nothing fits, return ["general-advisory"].
- Interpretation only — do not rank partners, score anything, or invent a need that wasn't stated.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    specializationTags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["specializationTags"],
  propertyOrdering: ["specializationTags"],
};

// Deterministic keyword → tag map for the offline mock (canned interpretation).
const MOCK_KEYWORDS: Array<[RegExp, string]> = [
  [/estate|will|inheritance|legacy/i, "estate-planning"],
  [/trust|trustee/i, "trust"],
  [/tax|cgt|capital gains/i, "tax-planning"],
  [/offshore|international|expat/i, "cross-border"],
  [/insur|cover|protection/i, "insurance"],
  [/property|mortgage|real estate/i, "property"],
  [/business|succession|exit|sell.*company/i, "business-succession"],
  [/legal|lawyer|divorce/i, "legal"],
  [/philanthrop|charit|foundation|donat/i, "philanthropy"],
];

/** Canned offline mapping (used when {@link isAiMock} is true). */
function mockExtractNeed(need: string): NeedExtraction {
  const tags = new Set<string>();
  for (const [re, tag] of MOCK_KEYWORDS) if (re.test(need)) tags.add(tag);
  if (tags.size === 0) tags.add("general-advisory");
  return { specializationTags: [...tags] };
}

/**
 * Map a stated client need to specialization tags.
 *
 * @param need - The advisor's free-text description of the client's need.
 * @returns The interpreted tags; defaults to `["general-advisory"]` if empty.
 */
export async function extractNeed(need: string): Promise<NeedExtraction> {
  if (isAiMock()) return mockExtractNeed(need);

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Client need:\n"""${need}"""`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const content = response.text;
  if (!content) throw new Error("Model returned no content");

  const parsed = JSON.parse(content) as NeedExtraction;
  const tags = Array.isArray(parsed.specializationTags) ? parsed.specializationTags : [];
  return { specializationTags: tags.length ? tags : ["general-advisory"] };
}
