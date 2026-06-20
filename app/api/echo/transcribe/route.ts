/**
 * `POST /api/echo/transcribe` — turn recorded audio into a transcript.
 *
 * @module api/echo/transcribe
 */
import { NextResponse } from "next/server";
import { genai } from "@/lib/gemini";
import { isAiMock, mockTranscribe } from "@/lib/ai-mock";

// Node runtime: we read the uploaded file into a Buffer (not available on edge).
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Transcribe an uploaded audio blob with a multimodal Gemini model.
 *
 * Expects `multipart/form-data` with an `audio` File field. Gemini has no Whisper
 * endpoint, so the audio is sent inline as base64 with the blob's own mime type
 * and a "transcribe verbatim" instruction.
 *
 * @param req - Request whose form data contains the `audio` file.
 * @returns `200 { transcript }`; `400` if no audio; `500` on transcription failure.
 */
export async function POST(req: Request) {
  try {
    // Offline demo path — return a canned transcript, ignore the audio.
    if (isAiMock()) {
      return NextResponse.json({ transcript: await mockTranscribe() });
    }

    const form = await req.formData();
    const audio = form.get("audio");

    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json(
        { error: "No audio file uploaded under 'audio'." },
        { status: 400 }
      );
    }

    // Gemini has no Whisper endpoint — send the audio inline (base64) to a
    // multimodal model and ask for a verbatim transcript. Forward the blob's
    // own mime type so the model decodes the correct container.
    const base64 = Buffer.from(await audio.arrayBuffer()).toString("base64");
    const mimeType = audio.type || "audio/webm";

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: "Transcribe this audio verbatim. Return only the transcript text." },
        { inlineData: { mimeType, data: base64 } },
      ],
    });

    const transcript = (response.text ?? "").trim();
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("transcribe error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed." },
      { status: 500 }
    );
  }
}
