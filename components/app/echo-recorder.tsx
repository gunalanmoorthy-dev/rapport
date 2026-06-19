"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Check } from "lucide-react";
import { liveTranscript } from "@/lib/mock-data";

type Phase = "idle" | "recording" | "done";

const MAX_SECONDS = 60;

export function EchoRecorder() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const [partial, setPartial] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lineTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    lineTimers.current.forEach(clearTimeout);
    lineTimers.current = [];
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

  const stop = () => {
    clearAll();
    setPartial("");
    setPhase("done");
  };

  const reset = () => {
    clearAll();
    setPhase("idle");
    setSeconds(0);
    setLines([]);
    setPartial("");
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(1, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center">
      {/* Record button */}
      <div className="relative flex items-center justify-center mb-8" style={{ width: 240, height: 240 }}>
        {phase === "recording" && (
          <>
            <span className="absolute inset-0 rounded-full bg-[#eca8d6]/20 animate-ping" />
            <span className="absolute inset-6 rounded-full bg-[#eca8d6]/10 animate-pulse" />
          </>
        )}
        <span
          className={`absolute inset-0 rounded-full border ${
            phase === "recording" ? "border-[#eca8d6]/40" : "border-foreground/15"
          }`}
        />
        <span className="absolute inset-8 rounded-full border border-foreground/10" />

        <button
          type="button"
          onClick={phase === "recording" ? stop : phase === "done" ? reset : start}
          aria-label={phase === "recording" ? "Stop recording" : "Start recording"}
          className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-300 ${
            phase === "recording"
              ? "w-28 h-28 bg-[#eca8d6] text-black"
              : phase === "done"
              ? "w-32 h-32 bg-foreground/5 border border-foreground/15 text-foreground hover:bg-foreground/10"
              : "w-32 h-32 bg-foreground text-background hover:scale-105"
          }`}
        >
          {phase === "recording" ? (
            <Square className="w-8 h-8 fill-current" />
          ) : phase === "done" ? (
            <Check className="w-10 h-10 text-[#eca8d6]" />
          ) : (
            <Mic className="w-12 h-12" />
          )}
        </button>
      </div>

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
            <p className="text-4xl font-display tabular-nums text-[#eca8d6]">{mmss}</p>
            <p className="text-sm text-muted-foreground font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#eca8d6] animate-pulse" />
              Listening · {MAX_SECONDS - seconds}s remaining
            </p>
          </>
        )}
        {phase === "done" && (
          <>
            <p className="text-2xl font-display">Brief captured · {mmss}</p>
            <p className="text-sm text-muted-foreground font-mono">
              {lines.length} statements queued for verification.{" "}
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
          {phase === "done" && (
            <span className="text-xs font-mono uppercase tracking-wider text-[#eca8d6]">
              Sent to Staging
            </span>
          )}
        </div>

        <div className="min-h-[260px] rounded-md border border-foreground/10 bg-foreground/[0.02] p-6 font-mono text-sm leading-relaxed">
          {lines.length === 0 && !partial && (
            <p className="text-muted-foreground/50">
              {phase === "idle"
                ? "Transcript will appear here as you speak…"
                : "…"}
            </p>
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
                <span className="inline-block w-2 h-4 ml-1 align-middle bg-[#eca8d6] animate-pulse" />
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
