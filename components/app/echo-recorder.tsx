"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Check } from "lucide-react";
import { toast } from "sonner";
import { liveTranscript } from "@/lib/mock-data";

type Phase = "idle" | "recording" | "processing" | "done";

const MAX_SECONDS = 60;

// Fixed bar heights so the waveform is deterministic (no hydration mismatch).
const WAVE_BARS = [0.4, 0.7, 0.95, 0.55, 0.8, 0.35, 0.6, 0.9, 0.45, 0.75, 0.5, 0.85, 0.3, 0.65, 0.95, 0.5, 0.7, 0.4];

export function EchoRecorder() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const [partial, setPartial] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lineTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    lineTimers.current.forEach(clearTimeout);
    lineTimers.current = [];
    phaseTimers.current.forEach(clearTimeout);
    phaseTimers.current = [];
  };

  useEffect(() => clearAll, []);

  const start = () => {
    setPhase("recording");
    setSeconds(0);
    setLines([]);
    setPartial("");

    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) {
          stop();
          return MAX_SECONDS;
        }
        return s + 1;
      });
    }, 1000);

    // Stream the mock transcript line by line
    liveTranscript.forEach((line, i) => {
      const t = setTimeout(() => {
        setPartial(line);
        const commit = setTimeout(() => {
          setLines((prev) => [...prev, line]);
          setPartial("");
        }, 900);
        lineTimers.current.push(commit);
      }, i * 1800 + 600);
      lineTimers.current.push(t);
    });
  };

  const finishProcessing = () => {
    setPhase("done");
    // Auto-commit confirmation for the high-confidence update.
    toast.success("Committed to Eleanor Harrington — balance updated", {
      description: "4 high-confidence changes committed · 1 sent to Staging",
    });
  };

  const stop = () => {
    clearAll();
    setPartial("");
    setPhase("processing");
    const t = setTimeout(finishProcessing, 2600);
    phaseTimers.current.push(t);
  };

  const reset = () => {
    clearAll();
    setPhase("idle");
    setSeconds(0);
    setLines([]);
    setPartial("");
  };

  const remaining = MAX_SECONDS - seconds;
  const countdown = `0:${String(remaining).padStart(2, "0")}`;
  const elapsed = `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, "0")}`;

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
            <p className="text-2xl font-display">Record a 60-second brief</p>
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
              Recording · {remaining}s remaining
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
              Verifying against CRM, compliance, and portfolio records…
            </p>
          </>
        )}
        {phase === "done" && (
          <>
            <p className="text-2xl font-display">Brief captured · {elapsed}</p>
            <p className="text-sm text-muted-foreground font-mono">
              {lines.length} statements verified.{" "}
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
              Analyzing
            </span>
          )}
          {phase === "done" && (
            <span className="text-xs font-mono uppercase tracking-wider text-[#eca8d6]">
              Sent to Staging
            </span>
          )}
        </div>

        <div className="min-h-[260px] rounded-md border border-foreground/10 bg-foreground/[0.02] p-6 font-mono text-sm leading-relaxed">
          {lines.length === 0 && !partial && phase !== "processing" && (
            <p className="text-muted-foreground/50">
              Transcript will appear here as you speak…
            </p>
          )}
          {phase === "processing" && lines.length === 0 && (
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
          <div className="space-y-3">
            {lines.map((line, i) => (
              <p key={i} className="text-foreground/90">
                <span className="text-muted-foreground/40 mr-2">{String(i + 1).padStart(2, "0")}</span>
                {line}
              </p>
            ))}
            {partial && (
              <p className="text-foreground/60">
                <span className="text-muted-foreground/40 mr-2">
                  {String(lines.length + 1).padStart(2, "0")}
                </span>
                {partial}
                <span className="inline-block w-2 h-4 ml-1 align-middle bg-red-500 animate-pulse" />
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
