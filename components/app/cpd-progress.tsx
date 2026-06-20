"use client";

/**
 * CPD progress panel for the Compliance screen. Fetches the code-computed tally
 * from GET /api/cpd and shows progress vs. the annual requirement plus a
 * per-category breakdown. A few demo "passive" learning items can be marked as
 * read, POSTing to /api/cpd (where the minutes are decided in code, not here).
 *
 * @module components/app/cpd-progress
 */
import { useCallback, useEffect, useState } from "react";
import { BookOpen, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Tally = {
  totalMinutes: number;
  byCategory: Record<string, number>;
  requirementMinutes: number;
  metRequirement: boolean;
};

type PassiveItem = {
  key: string;
  title: string;
  sourceType: string;
  category: string;
};

// Demo "passive" learning material an advisor can mark as read for CPD credit.
const PASSIVE_ITEMS: PassiveItem[] = [
  { key: "reg-q2", title: "SC Licensing Handbook — Q2 amendments", sourceType: "regulatory_brief", category: "Regulatory" },
  { key: "mkt-wk", title: "Weekly market & rates update", sourceType: "market_update", category: "Markets" },
  { key: "res-pc", title: "Private credit due-diligence note", sourceType: "research", category: "Product" },
];

const hours = (m: number) => (m / 60).toFixed(1);

export function CpdProgress() {
  const [tally, setTally] = useState<Tally | null>(null);
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cpd");
      if (res.ok) setTally(await res.json());
    } catch {
      /* leave tally null */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (item: PassiveItem) => {
    setBusy(item.key);
    try {
      const res = await fetch("/api/cpd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: item.sourceType,
          sourceRef: item.title,
          category: item.category,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to record CPD.");
      setRead((r) => ({ ...r, [item.key]: true }));
      toast.success("CPD credit recorded");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record CPD.");
    } finally {
      setBusy(null);
    }
  };

  const pct = tally
    ? Math.min(100, Math.round((tally.totalMinutes / tally.requirementMinutes) * 100))
    : 0;

  return (
    <div className="mt-16 pt-12 border-t border-foreground/10">
      <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-6">
        CPD progress
      </h2>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Progress vs requirement */}
        <div className="lg:col-span-1 border border-foreground/10 bg-foreground/[0.02] rounded-md p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            This year
          </p>
          <p className="text-3xl font-display tabular-nums">
            {tally ? hours(tally.totalMinutes) : "—"}
            <span className="text-lg text-muted-foreground">
              {" "}
              / {tally ? hours(tally.requirementMinutes) : "—"} h
            </span>
          </p>
          <div className="mt-4 h-2 rounded-full bg-foreground/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                tally?.metRequirement ? "bg-emerald-400" : "bg-[#eca8d6]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs font-mono text-muted-foreground mt-2">
            {pct}% of annual requirement{tally?.metRequirement ? " · met" : ""}
          </p>
        </div>

        {/* Breakdown by category */}
        <div className="lg:col-span-2 border border-foreground/10 bg-foreground/[0.02] rounded-md p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            By category
          </p>
          {tally && Object.keys(tally.byCategory).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(tally.byCategory).map(([cat, mins]) => (
                <div key={cat}>
                  <span className="inline-block px-2 py-0.5 rounded-full border border-foreground/10 bg-foreground/5 text-xs font-mono text-muted-foreground mb-2">
                    {cat}
                  </span>
                  <p className="text-2xl font-display tabular-nums">{hours(mins)}<span className="text-sm text-muted-foreground"> h</span></p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-mono text-muted-foreground/50">No CPD recorded yet.</p>
          )}
        </div>
      </div>

      {/* Passive CPD — mark as read */}
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-10 mb-4">
        Passive CPD · mark as read
      </p>
      <div className="border border-foreground/10 rounded-md divide-y divide-foreground/10">
        {PASSIVE_ITEMS.map((item) => {
          const done = read[item.key];
          return (
            <div key={item.key} className="flex items-center gap-4 px-6 py-4">
              <BookOpen className="w-4 h-4 text-[#eca8d6] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{item.title}</p>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.category}</p>
              </div>
              {done ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-mono text-emerald-300">
                  <Check className="w-4 h-4" /> Logged
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={busy === item.key}
                  onClick={() => markRead(item)}
                >
                  {busy === item.key ? "Logging…" : "Mark as read"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
