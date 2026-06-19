"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stagedChanges, type StagedChange } from "@/lib/mock-data";

type Resolution = "approved" | "rejected";

const categoryStyle: Record<StagedChange["category"], string> = {
  CRM: "text-sky-300 bg-sky-400/10 border-sky-400/20",
  Portfolio: "text-[#eca8d6] bg-[#eca8d6]/10 border-[#eca8d6]/20",
  Compliance: "text-amber-300 bg-amber-400/10 border-amber-400/20",
};

export function StagingQueue() {
  const [resolved, setResolved] = useState<Record<string, Resolution>>({});

  const resolve = (id: string, decision: Resolution) =>
    setResolved((prev) => ({ ...prev, [id]: decision }));

  const pending = stagedChanges.filter((c) => !resolved[c.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-[#eca8d6]" />
        {pending.length} low-confidence change{pending.length === 1 ? "" : "s"} awaiting your sign-off
      </div>

      {stagedChanges.map((change) => {
        const decision = resolved[change.id];
        return (
          <div
            key={change.id}
            className={`border rounded-md overflow-hidden transition-all ${
              decision
                ? "border-foreground/10 opacity-60"
                : "border-foreground/10 bg-foreground/[0.02]"
            }`}
          >
            {/* Card header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-foreground/10">
              <div className="flex items-center gap-3">
                <Link
                  href={`/clients/${change.clientId}`}
                  className="text-base font-medium hover:text-[#eca8d6] transition-colors"
                >
                  {change.clientName}
                </Link>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-sm font-mono text-muted-foreground">{change.field}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-0.5 rounded-full border text-xs font-mono ${categoryStyle[change.category]}`}
                >
                  {change.category}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {Math.round(change.confidence * 100)}% conf.
                </span>
              </div>
            </div>

            {/* Before / After diff */}
            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch px-6 py-6">
              <div className="rounded-md border border-red-400/15 bg-red-400/[0.04] p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-red-300/70 mb-2">
                  Before
                </p>
                <p className="text-sm text-foreground/80 font-mono leading-relaxed">
                  {change.before}
                </p>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
              </div>

              <div className="rounded-md border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/70 mb-2">
                  After
                </p>
                <p className="text-sm text-foreground font-mono leading-relaxed">
                  {change.after}
                </p>
              </div>
            </div>

            {/* Footer / actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-foreground/10">
              <span className="text-xs font-mono text-muted-foreground">
                Source · {change.source}
              </span>

              {decision ? (
                <span
                  className={`inline-flex items-center gap-2 text-sm font-mono ${
                    decision === "approved" ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {decision === "approved" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  {decision === "approved" ? "Approved & committed" : "Rejected"}
                </span>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolve(change.id, "rejected")}
                    className="rounded-full border-foreground/20 hover:bg-red-400/10 hover:text-red-300 hover:border-red-400/30"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => resolve(change.id, "approved")}
                    className="rounded-full bg-foreground text-background hover:bg-foreground/90"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {pending.length === 0 && (
        <div className="border border-foreground/10 rounded-md p-12 text-center">
          <p className="text-2xl font-display mb-2">Queue clear</p>
          <p className="text-sm font-mono text-muted-foreground">
            Every change has been reviewed. High-confidence updates auto-commit silently.
          </p>
        </div>
      )}
    </div>
  );
}
