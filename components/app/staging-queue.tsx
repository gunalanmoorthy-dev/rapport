"use client";

/**
 * The Staging review queue. Renders staged echoes as before/after diffs and
 * calls the approve/reject endpoints, refreshing server data on success.
 * Receives already-shaped {@link StagedItem}s from the server page.
 *
 * @module components/app/staging-queue
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type StagedItem = {
  echoId: string;
  clientId: string | null;
  clientName: string;
  field: string;
  category: "CRM" | "Portfolio" | "Compliance";
  confidence: number;
  source: string;
  before: string;
  after: string;
  invalid: boolean;
  invalidReason: string | null;
};

type Resolution = "approved" | "rejected";

const categoryStyle: Record<StagedItem["category"], string> = {
  CRM: "text-sky-300 bg-sky-400/10 border-sky-400/20",
  Portfolio: "text-[#eca8d6] bg-[#eca8d6]/10 border-[#eca8d6]/20",
  Compliance: "text-amber-300 bg-amber-400/10 border-amber-400/20",
};

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    value >= 0.7
      ? { bar: "bg-emerald-400", text: "text-emerald-300" }
      : value >= 0.55
      ? { bar: "bg-amber-400", text: "text-amber-300" }
      : { bar: "bg-red-400", text: "text-red-300" };

  return (
    <div className="flex items-center gap-2" title={`${pct}% confidence`}>
      <div className="w-16 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${tone.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono tabular-nums ${tone.text}`}>{pct}%</span>
    </div>
  );
}

export function StagingQueue({ items }: { items: StagedItem[] }) {
  const router = useRouter();
  const [resolved, setResolved] = useState<Record<string, Resolution>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const act = async (echoId: string, decision: Resolution) => {
    setBusy((b) => ({ ...b, [echoId]: true }));
    const action = decision === "approved" ? "approve" : "reject";
    try {
      const res = await fetch(`/api/staging/${echoId}/${action}`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `${action} failed.`);

      setResolved((prev) => ({ ...prev, [echoId]: decision }));
      toast[decision === "approved" ? "success" : "message"](
        decision === "approved" ? "Approved & committed" : "Rejected"
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Could not ${action}.`);
    } finally {
      setBusy((b) => ({ ...b, [echoId]: false }));
    }
  };

  const pending = items.filter((c) => !resolved[c.echoId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-[#eca8d6]" />
        {pending.length} change{pending.length === 1 ? "" : "s"} awaiting your sign-off
      </div>

      {items.map((change) => {
        const decision = resolved[change.echoId];
        const isBusy = busy[change.echoId];
        return (
          <div
            key={change.echoId}
            className={`border rounded-md overflow-hidden transition-all ${
              decision
                ? "border-foreground/10 opacity-60"
                : change.invalid
                ? "border-red-400/25 bg-red-400/[0.03]"
                : "border-foreground/10 bg-foreground/[0.02]"
            }`}
          >
            {/* Card header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-foreground/10">
              <div className="flex items-center gap-3">
                {change.clientId ? (
                  <Link
                    href={`/clients/${change.clientId}`}
                    className="text-base font-medium hover:text-[#eca8d6] transition-colors"
                  >
                    {change.clientName}
                  </Link>
                ) : (
                  <span className="text-base font-medium">{change.clientName}</span>
                )}
                <span className="text-muted-foreground/40">/</span>
                <span className="text-sm font-mono text-muted-foreground">{change.field}</span>
                {change.invalid && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-red-400/30 bg-red-400/10 text-red-300 text-xs font-mono">
                    <AlertTriangle className="w-3 h-3" />
                    Overspend
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full border text-xs font-mono ${categoryStyle[change.category]}`}>
                  {change.category}
                </span>
                <ConfidenceMeter value={change.confidence} />
              </div>
            </div>

            {/* Before / After diff */}
            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch px-6 py-6">
              <div className="rounded-md border border-red-400/15 bg-red-400/[0.04] p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-red-300/70 mb-2">
                  Before
                </p>
                <p className="text-sm text-foreground/80 font-mono leading-relaxed">{change.before}</p>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
              </div>

              <div
                className={`rounded-md border p-4 ${
                  change.invalid
                    ? "border-red-400/25 bg-red-400/[0.06]"
                    : "border-emerald-400/15 bg-emerald-400/[0.04]"
                }`}
              >
                <p
                  className={`text-[10px] font-mono uppercase tracking-wider mb-2 ${
                    change.invalid ? "text-red-300/80" : "text-emerald-300/70"
                  }`}
                >
                  {change.invalid ? "After (invalid)" : "After"}
                </p>
                <p className="text-sm text-foreground font-mono leading-relaxed">{change.after}</p>
                {change.invalid && change.invalidReason && (
                  <p className="text-xs text-red-300/80 mt-2 leading-relaxed">{change.invalidReason}</p>
                )}
              </div>
            </div>

            {/* Footer / actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-foreground/10">
              <span className="text-xs font-mono text-muted-foreground">Source · {change.source}</span>

              {decision ? (
                <span
                  className={`inline-flex items-center gap-2 text-sm font-mono ${
                    decision === "approved" ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {decision === "approved" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  {decision === "approved" ? "Approved & committed" : "Rejected"}
                </span>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => act(change.echoId, "rejected")}
                    className="rounded-full border-foreground/20 hover:bg-red-400/10 hover:text-red-300 hover:border-red-400/30"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={isBusy}
                    onClick={() => act(change.echoId, "approved")}
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

      {items.length === 0 && (
        <div className="border border-foreground/10 rounded-md p-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-5">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <p className="text-2xl font-display mb-2">All clear — nothing awaiting review</p>
          <p className="text-sm font-mono text-muted-foreground max-w-md">
            High-confidence updates auto-commit silently. We&apos;ll surface anything that needs your judgment here.
          </p>
        </div>
      )}
    </div>
  );
}
