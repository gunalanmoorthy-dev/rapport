import type { Metadata } from "next";
import { Lock, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PrintButton } from "@/components/app/print-button";
import {
  complianceCredits,
  complianceCategoryMeta,
  cpdTarget,
} from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Compliance · Rapport",
  description: "Append-only CPD and compliance credit log.",
};

export default function CompliancePage() {
  const totalCredits = complianceCredits.reduce((s, c) => s + c.credits, 0);
  const pct = Math.min(100, Math.round((totalCredits / cpdTarget) * 100));

  const byCategory = complianceCredits.reduce(
    (acc, c) => {
      acc[c.category] = (acc[c.category] ?? 0) + c.credits;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <AppShell>
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <div>
            <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              <span className="w-8 h-px bg-foreground/30" />
              Compliance · CPD log
            </span>
            <h1 className="text-5xl lg:text-6xl font-display tracking-tight">
              Regulatory burden, handled
            </h1>
            <p className="text-sm text-muted-foreground mt-4 max-w-lg leading-relaxed">
              Every review Rapport processes logs the continuing-education and compliance
              credits it earns — written once to an append-only trail you can export for audit.
            </p>
          </div>

          <div className="shrink-0">
            <PrintButton label="Export log (PDF)" />
          </div>
        </div>

        {/* CPD progress + stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="md:col-span-1 border border-foreground/10 bg-foreground/[0.02] rounded-md p-6">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
              CPD year progress
            </p>
            <p className="text-3xl font-display tabular-nums">
              {totalCredits.toFixed(1)}
              <span className="text-lg text-muted-foreground"> / {cpdTarget}</span>
            </p>
            <div className="mt-4 h-2 rounded-full bg-foreground/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#eca8d6]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-2">{pct}% of annual requirement</p>
          </div>

          <div className="md:col-span-2 border border-foreground/10 bg-foreground/[0.02] rounded-md p-6">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              Credits by category
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(Object.keys(complianceCategoryMeta) as (keyof typeof complianceCategoryMeta)[]).map(
                (cat) => {
                  const meta = complianceCategoryMeta[cat];
                  return (
                    <div key={cat}>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full border text-xs font-mono mb-2 ${meta.bg} ${meta.border} ${meta.text}`}
                      >
                        {cat}
                      </span>
                      <p className="text-2xl font-display tabular-nums">
                        {(byCategory[cat] ?? 0).toFixed(1)}
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Append-only banner */}
        <div className="flex items-center gap-3 mb-4 text-xs font-mono text-muted-foreground">
          <Lock className="w-3.5 h-3.5 text-[#eca8d6]" />
          Append-only ledger · {complianceCredits.length} entries · newest first
        </div>

        {/* Ledger */}
        <div className="border border-foreground/10 rounded-md overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-foreground/10 bg-foreground/[0.02] text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <div className="col-span-3">Logged</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-4">Activity</div>
            <div className="col-span-1 text-right">Credits</div>
            <div className="col-span-2 text-right">Hash</div>
          </div>

          <div className="divide-y divide-foreground/10">
            {complianceCredits.map((credit) => {
              const meta = complianceCategoryMeta[credit.category];
              return (
                <div
                  key={credit.id}
                  className="grid grid-cols-2 md:grid-cols-12 gap-4 px-6 py-5 items-center"
                >
                  <div className="md:col-span-3 order-1">
                    <p className="text-sm font-mono tabular-nums">{credit.loggedAt}</p>
                  </div>
                  <div className="md:col-span-2 order-3 md:order-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full border text-xs font-mono ${meta.bg} ${meta.border} ${meta.text}`}
                    >
                      {credit.category}
                    </span>
                  </div>
                  <div className="col-span-2 md:col-span-4 order-2 md:order-3">
                    <p className="text-sm">{credit.activity}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">{credit.source}</p>
                  </div>
                  <div className="md:col-span-1 md:text-right order-4">
                    <p className="text-sm font-display tabular-nums">{credit.credits.toFixed(1)}</p>
                  </div>
                  <div className="md:col-span-2 md:text-right order-5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                      <ShieldCheck className="w-3 h-3 text-emerald-300" />
                      {credit.hash}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
