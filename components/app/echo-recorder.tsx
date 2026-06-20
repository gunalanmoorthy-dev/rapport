"use client";

/**
 * The Echo recorder: captures microphone audio via MediaRecorder, uploads it to
 * `/api/echo/transcribe`, then sends the transcript to `/api/echo/process` and
 * shows the committed/staged result. Drives the whole core loop from the client.
 *
 * @module components/app/echo-recorder
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Check } from "lucide-react";
import { toast } from "sonner";
import { formatCents } from "@/lib/mock-data";

type Phase = "idle" | "recording" | "processing" | "done";

type ProcessResult = {
  status: "committed" | "staged";
  reason: string;
  confidence: number;
  clientName: string | null;
  move: { amountCents: number; direction: "in" | "out" } | null;
  balanceAfterCents: number | null;
  invalid?: boolean;
};

const MAX_SECONDS = 2 * 60 * 60; // up to two hours

/** Format a duration in seconds as h:mm:ss (or m:ss under an hour). */
function formatClock(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

// Fixed bar heights so the waveform is deterministic (no hydration mismatch).
const WAVE_BARS = [0.4, 0.7, 0.95, 0.55, 0.8, 0.35, 0.6, 0.9, 0.45, 0.75, 0.5, 0.85, 0.3, 0.65, 0.95, 0.5, 0.7, 0.4];

export function EchoRecorder() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [processStep, setProcessStep] = useState<"transcribing" | "extracting" | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopTimer();
      releaseStream();
    };
  }, []);

  const start = async () => {
    setResult(null);
    setTranscript("");
    setSeconds(0);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Microphone not available in this browser.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone permission denied.");
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      releaseStream();
      void handleProcess(blob);
    };
    recorder.start();

    setPhase("recording");
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) {
          stop();
          return MAX_SECONDS;
        }
        return s + 1;
      });
    }, 1000);
  };

  const stop = () => {
    stopTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setPhase("processing");
  };

  const handleProcess = async (blob: Blob) => {
    try {
      // 1) Transcribe with Whisper.
      setProcessStep("transcribing");
      const form = new FormData();
      form.append("audio", new File([blob], "echo.webm", { type: blob.type }));
      const tRes = await fetch("/api/echo/transcribe", { method: "POST", body: form });
      const tJson = await tRes.json();
      if (!tRes.ok) throw new Error(tJson.error || "Transcription failed.");

      const text: string = tJson.transcript ?? "";
      setTranscript(text);

      if (!text.trim()) {
        toast.error("Nothing was transcribed — try again.");
        setPhase("idle");
        setProcessStep(null);
        return;
      }

      // 2) Extract + verify + commit-or-stage.
      setProcessStep("extracting");
      const pRes = await fetch("/api/echo/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      const pJson = await pRes.json();
      if (!pRes.ok) throw new Error(pJson.error || "Processing failed.");

      const res = pJson as ProcessResult;
      setResult(res);
      setPhase("done");
      setProcessStep(null);

      if (res.status === "committed") {
        toast.success(
          res.clientName
            ? `Committed to ${res.clientName}${res.balanceAfterCents !== null ? " — balance updated" : ""}`
            : "Committed",
          { description: res.reason }
        );
      } else {
        toast(res.invalid ? "Flagged — sent to Staging" : "Sent to Staging", {
          description: res.reason,
        });
      }
      // Refresh server components (Clients, Staging, Digest) with new data.
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("idle");
      setProcessStep(null);
    }
  };

  const reset = () => {
    setPhase("idle");
    setSeconds(0);
    setTranscript("");
    setResult(null);
  };

  const remaining = MAX_SECONDS - seconds;
  const countdown = formatClock(remaining);
  const elapsed = formatClock(seconds);

  return (
    <div className="flex flex-col items-center">
      {/* Record button */}
      <div className="relative flex items-center justify-center mb-8" style={{ width: 240, height: 240 }}>
        {phase === "recording" && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <span className="absolute inset-4 rounded-full bg-red-500/15 animate-pulse" />
            <span className="absolute inset-0 rounded-full border border-red-500/50" />
          </>
        )}
        {phase === "processing" && (
          <>
            <span className="absolute inset-0 rounded-full border border-[#eca8d6]/30" />
            <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#eca8d6] animate-spin" />
          </>
        )}
        {(phase === "idle" || phase === "done") && (
          <span
            className={`absolute inset-0 rounded-full border ${
              phase === "done" ? "border-[#eca8d6]/40" : "border-foreground/15"
            }`}
          />
        )}
        <span className="absolute inset-8 rounded-full border border-foreground/10" />

        <button
          type="button"
          onClick={phase === "recording" ? stop : phase === "done" ? reset : phase === "idle" ? start : undefined}
          disabled={phase === "processing"}
          aria-label={
            phase === "recording"
              ? "Stop recording"
              : phase === "processing"
              ? "Processing"
              : phase === "done"
              ? "Record another brief"
              : "Start recording"
          }
          className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-300 ${
            phase === "recording"
              ? "w-28 h-28 bg-red-500 text-white"
              : phase === "processing"
              ? "w-28 h-28 bg-[#eca8d6]/10 text-[#eca8d6] cursor-wait"
              : phase === "done"
              ? "w-32 h-32 bg-foreground/5 border border-foreground/15 text-foreground hover:bg-foreground/10"
              : "w-32 h-32 bg-foreground text-background hover:scale-105"
          }`}
        >
          {phase === "recording" ? (
            <Square className="w-8 h-8 fill-current" />
          ) : phase === "processing" ? (
            <div className="flex items-end gap-1 h-8">
              {WAVE_BARS.slice(0, 5).map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-[#eca8d6] animate-waveform"
                  style={{ height: `${h * 100}%`, animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          ) : phase === "done" ? (
            <Check className="w-10 h-10 text-[#eca8d6]" />
          ) : (
            <Mic className="w-12 h-12" />
          )}
        </button>
      </div>

      {/* Live waveform (recording only) */}
      {phase === "recording" && (
        <div className="flex items-end justify-center gap-1 h-12 mb-6" aria-hidden="true">
          {WAVE_BARS.map((h, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-red-500/70 animate-waveform"
              style={{ height: `${h * 100}%`, animationDelay: `${(i % 6) * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {/* Status line */}
      <div className="flex flex-col items-center gap-2 mb-12 text-center">
        {phase === "idle" && (
          <>
            <p className="text-2xl font-display">Record a brief — up to 2 hours</p>
            <p className="text-sm text-muted-foreground font-mono">
              Tap the mic and talk. Rapport handles the rest.
            </p>
          </>
        )}
        {phase === "recording" && (
          <>
            <p className="text-5xl font-display tabular-nums text-red-400">{countdown}</p>
            <p className="text-sm text-muted-foreground font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Recording · {countdown} remaining
            </p>
          </>
        )}
        {phase === "processing" && (
          <>
            <p className="text-2xl font-display flex items-center gap-2">
              Rapport is thinking
              <span className="inline-flex items-end gap-1 pb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#eca8d6] animate-thinking-dot" style={{ animationDelay: "0s" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#eca8d6] animate-thinking-dot" style={{ animationDelay: "0.2s" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#eca8d6] animate-thinking-dot" style={{ animationDelay: "0.4s" }} />
              </span>
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              {processStep === "transcribing"
                ? "Transcribing your brief…"
                : "Verifying against CRM, compliance, and portfolio records…"}
            </p>
          </>
        )}
        {phase === "done" && result && (
          <>
            <p className="text-2xl font-display">Brief captured · {elapsed}</p>
            <p className="text-sm text-muted-foreground font-mono">
              {result.status === "committed" ? "Auto-committed." : "Sent to Staging for review."}{" "}
              <button onClick={reset} className="text-[#eca8d6] hover:underline">
                Record another
              </button>
            </p>
          </>
        )}
      </div>

      {/* Transcript */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Live transcript
          </span>
          {phase === "processing" && (
            <span className="text-xs font-mono uppercase tracking-wider text-[#eca8d6] animate-pulse">
              {processStep === "transcribing" ? "Transcribing" : "Analyzing"}
            </span>
          )}
          {phase === "done" && result && (
            <span
              className={`text-xs font-mono uppercase tracking-wider ${
                result.status === "committed" ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {result.status === "committed" ? "Auto-committed" : "Sent to Staging"}
            </span>
          )}
        </div>

        <div className="min-h-[260px] rounded-md border border-foreground/10 bg-foreground/[0.02] p-6 font-mono text-sm leading-relaxed">
          {phase === "idle" && !transcript && (
            <p className="text-muted-foreground/50">
              Transcript will appear here after you record…
            </p>
          )}
          {phase === "recording" && (
            <p className="text-muted-foreground/60 flex items-center gap-2">
              Listening…
              <span className="inline-block w-2 h-4 align-middle bg-red-500 animate-pulse" />
            </p>
          )}
          {phase === "processing" && !transcript && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-4 rounded bg-foreground/10 animate-pulse"
                  style={{ width: `${90 - i * 18}%`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
          {transcript && <p className="text-foreground/90 whitespace-pre-wrap">{transcript}</p>}
        </div>

        {/* Result detail */}
        {phase === "done" && result && (
          <div
            className={`mt-4 rounded-md border p-5 ${
              result.status === "committed"
                ? "border-emerald-400/20 bg-emerald-400/[0.04]"
                : result.invalid
                ? "border-red-400/20 bg-red-400/[0.04]"
                : "border-amber-400/20 bg-amber-400/[0.04]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {result.clientName ?? "No client matched"}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {Math.round(result.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{result.reason}</p>
            {result.move && (
              <p className="text-sm font-mono">
                {result.move.direction === "in" ? "Inflow" : "Outflow"} ·{" "}
                {formatCents(result.move.amountCents)}
                {result.balanceAfterCents !== null && (
                  <span className="text-muted-foreground">
                    {" "}
                    → new balance {formatCents(result.balanceAfterCents)}
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
