"use client";

/**
 * Field-brief library: a minimal recorder (mic → /api/echo/transcribe →
 * /api/briefs) plus a searchable list of de-identified briefs. Uses the existing
 * transcribe route only; it never touches the Echo commit pipeline.
 *
 * @module components/app/brief-library
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Search, Shield, Square, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/display";

type Brief = {
  id: string;
  summary: string | null;
  problemDomain: string | null;
  tags: string[] | null;
  createdAt: string | null;
};

type Phase = "idle" | "recording" | "processing";

export function BriefLibrary() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const search = useCallback(async (q: string) => {
    try {
      const res = await fetch(`/api/briefs?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        setBriefs(json.briefs ?? []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void search("");
  }, [search]);

  // Debounced search as the query changes.
  useEffect(() => {
    const t = setTimeout(() => void search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const start = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Microphone not available.");
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
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      releaseStream();
      void process(blob);
    };
    recorder.start();
    setPhase("recording");
  };

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setPhase("processing");
  };

  const process = async (blob: Blob) => {
    try {
      // 1) Transcribe via the EXISTING route (unchanged).
      const form = new FormData();
      form.append("audio", new File([blob], "brief.webm", { type: blob.type }));
      const tRes = await fetch("/api/echo/transcribe", { method: "POST", body: form });
      const tJson = await tRes.json();
      if (!tRes.ok) throw new Error(tJson.error || "Transcription failed.");
      const transcript: string = (tJson.transcript ?? "").trim();
      if (!transcript) throw new Error("Nothing was transcribed.");

      // 2) Distill + scrub + store.
      const bRes = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const bJson = await bRes.json();
      if (!bRes.ok) throw new Error(bJson.error || "Failed to save brief.");

      toast.success("Brief saved", {
        description: `${bJson.redactionsCount ?? 0} personal detail(s) redacted before storing.`,
      });
      setPhase("idle");
      await search(query);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("idle");
    }
  };

  return (
    <div className="space-y-8">
      {/* Recorder */}
      <div className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-6 flex items-center gap-5">
        <button
          type="button"
          onClick={phase === "recording" ? stop : phase === "idle" ? start : undefined}
          disabled={phase === "processing"}
          aria-label={phase === "recording" ? "Stop" : "Record a brief"}
          className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            phase === "recording"
              ? "bg-red-500 text-white"
              : phase === "processing"
              ? "bg-[#eca8d6]/10 text-[#eca8d6] cursor-wait"
              : "bg-foreground text-background hover:bg-foreground/90"
          }`}
        >
          {phase === "recording" ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-6 h-6" />}
        </button>
        <div className="min-w-0">
          <p className="text-base font-medium">
            {phase === "recording" ? "Recording…" : phase === "processing" ? "Distilling & redacting…" : "Record a field brief"}
          </p>
          <p className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-[#eca8d6]" />
            Personal details are redacted in code before anything is stored.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search briefs by topic, tag, or domain…"
          className="w-full rounded-md border border-foreground/15 bg-foreground/[0.03] pl-9 pr-3 h-11 text-sm focus:outline-none focus:border-foreground/40"
        />
      </div>

      {/* List */}
      {briefs.length === 0 ? (
        <p className="text-sm font-mono text-muted-foreground/60 py-8 text-center">
          {query ? "No briefs match your search." : "No briefs yet — record your first one above."}
        </p>
      ) : (
        <div className="space-y-4">
          {briefs.map((b) => (
            <div key={b.id} className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-5">
              <div className="flex items-center justify-between mb-3">
                {b.problemDomain && (
                  <span className="text-xs font-mono uppercase tracking-wider text-[#eca8d6]">
                    {b.problemDomain}
                  </span>
                )}
                <span className="text-xs font-mono text-muted-foreground">
                  {formatDateTime(b.createdAt ? new Date(b.createdAt) : null)}
                </span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{b.summary}</p>
              {b.tags && b.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {b.tags.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-foreground/10 bg-foreground/5 text-xs font-mono text-muted-foreground"
                    >
                      <Tag className="w-3 h-3" />
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
