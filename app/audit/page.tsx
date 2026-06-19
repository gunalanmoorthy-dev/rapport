import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Link2, Bot, User } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PrintButton } from "@/components/app/print-button";
import { auditTrail, auditTypeMeta } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Audit Trail · Rapport",
  description: "Immutable, append-only record of every committed change.",
};

export default function AuditPage() {
  const commits = auditTrail.filter((e) => e.type === "commit").length;
  const reviews = auditTrail.filter((e) => e.type === "approve" || e.type === "reject").length;

  return (
    <AppShell>
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <div>
            <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              <span className="w-8 h-px bg-foreground/30" />
              Immutable audit trail
            </span>
            <h1 className="text-5xl lg:text-6xl font-display tracking-tight">
              Nothing happens off the record
            </h1>
            <p className="text-sm text-muted-foreground mt-4 max-w-lg leading-relaxed">
              Every Echo commit, approval, and rejection is written once to a hash-chained
              ledger. Entries can never be edited or deleted — only appended.
            </p>
          </div>

          <div className="shrink-0">
            <PrintButton label="Export ledger (PDF)" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Ledger entries", value: auditTrail.length },
            { label: "Auto-commits", value: commits },
            { label: "Advisor reviews", value: reviews },
          ].map((s) => (
            <div
              key={s.label}
              className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-5"
            >
              <p className="text-3xl font-display tabular-nums">{s.value}</p>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Append-only banner */}
        <div className="flex items-center gap-3 mb-4 text-xs font-mono text-muted-foreground">
          <Lock className="w-3.5 h-3.5 text-[#eca8d6]" />
          Hash-chained · tamper-evident · newest first
        </div>

        {/* Ledger timeline */}
        <div className="border border-foreground/10 rounded-md divide-y divide-foreground/10">
          {auditTrail.map((entry) => {
            const meta = auditTypeMeta[entry.type];
            const Icon = entry.actor === "Rapport" ? Bot : User;
            return (
              <div key={entry.id} className="px-6 py-5 flex flex-col md:flex-row md:items-center gap-4">
                {/* seq + actor */}
                <div className="flex items-center gap-3 md:w-44 shrink-0">
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    #{entry.seq}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                    <Icon className="w-3.5 h-3.5" />
                    {entry.actor}
                  </span>
                </div>

                {/* type + detail */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full border text-xs font-mono ${meta.bg} ${meta.border} ${meta.text}`}
                    >
                      {meta.label}
                    </span>
                    {entry.clientName && (
                      <span className="text-sm">{entry.clientName}</span>
                    )}
                    {typeof entry.confidence === "number" && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {Math.round(entry.confidence * 100)}% conf.
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5">{entry.detail}</p>
                </div>

                {/* timestamp + hash chain */}
                <div className="md:text-right shrink-0">
                  <p className="text-xs font-mono text-muted-foreground tabular-nums">
                    {entry.timestamp}
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-xs font-mono text-foreground/70 mt-1">
                    <Link2 className="w-3 h-3 text-[#eca8d6]" />
                    {entry.hash}
                    <span className="text-muted-foreground">←</span>
                    <span className="text-muted-foreground">{entry.prevHash}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs font-mono text-muted-foreground mt-6 text-center">
          Genesis block verified · chain intact ·{" "}
          <Link href="/compliance" className="text-foreground hover:underline">
            view compliance log
          </Link>
        </p>
      </section>
    </AppShell>
  );
}
