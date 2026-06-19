import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Wallet, Users } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PrintButton } from "@/components/app/print-button";
import {
  referrals,
  referralStatusMeta,
  payrollLines,
  payrollPeriod,
  formatBalance,
} from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Synergy · Rapport",
  description: "Referral ledger and payroll bridge.",
};

export default function SynergyPage() {
  const converted = referrals.filter((r) => r.status === "converted");
  const pipelineAum = referrals
    .filter((r) => r.status === "qualified" || r.status === "prospect")
    .reduce((s, r) => s + r.estimatedAum, 0);
  const convertedAum = converted.reduce((s, r) => s + (r.convertedAum ?? 0), 0);
  const totalBonus = referrals.reduce((s, r) => s + r.bonus, 0);
  const payrollTotal = payrollLines.reduce((s, l) => s + l.amount, 0);

  return (
    <AppShell>
      <section className="max-w-[1200px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <div>
            <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              <span className="w-8 h-px bg-foreground/30" />
              Synergy · Referrals & payroll
            </span>
            <h1 className="text-5xl lg:text-6xl font-display tracking-tight">
              Relationships compound
            </h1>
            <p className="text-sm text-muted-foreground mt-4 max-w-lg leading-relaxed">
              Rapport tracks every introduction your clients make, ties conversions to
              bonus accrual, and bridges it straight into payroll — no spreadsheets.
            </p>
          </div>
          <div className="shrink-0">
            <PrintButton label="Export statement (PDF)" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {[
            { label: "Converted AUM", value: formatBalance(convertedAum), sub: `${converted.length} this quarter` },
            { label: "Pipeline AUM", value: formatBalance(pipelineAum), sub: "qualified + prospect" },
            { label: "Bonus accrued", value: formatBalance(totalBonus), sub: "from referrals" },
            { label: "Referrers active", value: `${new Set(referrals.map((r) => r.referrerId)).size}`, sub: "introducing clients" },
          ].map((s) => (
            <div key={s.label} className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-5">
              <p className="text-2xl lg:text-3xl font-display tabular-nums">{s.value}</p>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-2">
                {s.label}
              </p>
              <p className="text-xs font-mono text-muted-foreground/60">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Referral ledger */}
          <div className="lg:col-span-2">
            <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-6">
              <Users className="w-4 h-4 text-[#eca8d6]" />
              Referral ledger
            </h2>

            <div className="border border-foreground/10 rounded-md overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-4 border-b border-foreground/10 bg-foreground/[0.02] text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <div className="col-span-4">Referrer → Prospect</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3 text-right">AUM</div>
                <div className="col-span-3 text-right">Bonus</div>
              </div>

              <div className="divide-y divide-foreground/10">
                {referrals.map((r) => {
                  const meta = referralStatusMeta[r.status];
                  const aum = r.convertedAum ?? r.estimatedAum;
                  return (
                    <div
                      key={r.id}
                      className="grid grid-cols-2 md:grid-cols-12 gap-4 px-5 py-4 items-center"
                    >
                      <div className="col-span-2 md:col-span-4">
                        <Link
                          href={`/clients/${r.referrerId}`}
                          className="text-sm hover:underline inline-flex items-center gap-1"
                        >
                          {r.referrer}
                          <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                        </Link>
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          → {r.prospect} · {r.loggedAt}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border text-xs font-mono ${meta.bg} ${meta.border} ${meta.text}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="md:col-span-3 md:text-right">
                        <p className="text-sm font-display tabular-nums">{formatBalance(aum)}</p>
                        <p className="text-xs font-mono text-muted-foreground md:hidden">
                          {r.convertedAum ? "converted" : "estimated"}
                        </p>
                      </div>
                      <div className="md:col-span-3 md:text-right">
                        <p
                          className={`text-sm font-display tabular-nums ${
                            r.bonus > 0 ? "text-emerald-300" : "text-muted-foreground"
                          }`}
                        >
                          {r.bonus > 0 ? formatBalance(r.bonus) : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Payroll bridge */}
          <div>
            <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-6">
              <Wallet className="w-4 h-4 text-[#eca8d6]" />
              Payroll bridge
            </h2>

            <div className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-6">
              <p className="text-xs font-mono text-muted-foreground mb-5">{payrollPeriod}</p>

              <div className="space-y-px">
                {payrollLines.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-start justify-between gap-4 py-3 border-b border-foreground/10"
                  >
                    <div className="min-w-0">
                      <p className="text-sm">{line.label}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        {line.detail}
                      </p>
                    </div>
                    <p className="text-sm font-display tabular-nums shrink-0">
                      {formatBalance(line.amount)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-5 mt-2">
                <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                  Net this period
                </p>
                <p className="text-3xl font-display tabular-nums">{formatBalance(payrollTotal)}</p>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Synced to payroll provider · June 28
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
