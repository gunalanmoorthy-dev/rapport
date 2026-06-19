import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { VitalityOverview, ClientTrend } from "@/components/app/vitality-charts";
import {
  clients,
  fiscalMonths,
  bookSentiment,
  marketVolatility,
  clientSentimentHistory,
} from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Vitality · Rapport",
  description: "Client sentiment topography across the fiscal year vs market volatility.",
};

const toneColor: Record<string, string> = {
  green: "#34d399",
  amber: "#fbbf24",
  red: "#f87171",
};

export default function VitalityPage() {
  const overviewData = fiscalMonths.map((month, i) => ({
    month,
    sentiment: bookSentiment[i],
    volatility: marketVolatility[i],
  }));

  const currentAvg = Math.round(bookSentiment[bookSentiment.length - 1]);

  const clientTrends = clients
    .map((c) => {
      const history = clientSentimentHistory[c.id] ?? [];
      const current = history[history.length - 1] ?? 0;
      const prior = history[history.length - 4] ?? current; // ~quarter ago
      const delta = current - prior;
      return {
        client: c,
        data: history.map((score, i) => ({ month: fiscalMonths[i], score })),
        current,
        delta,
      };
    })
    .sort((a, b) => a.delta - b.delta); // most cooling first

  return (
    <AppShell>
      <section className="max-w-[1200px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        {/* Header */}
        <div className="mb-12">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Vitality Engine
          </span>
          <h1 className="text-5xl lg:text-6xl font-display tracking-tight">
            Sentiment topography
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-xl leading-relaxed">
            Relationship health across the fiscal year, read against market turbulence —
            so you can tell a market wobble from a relationship at risk.
          </p>
        </div>

        {/* Overview chart */}
        <div className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-6 lg:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Book sentiment
                </p>
                <p className="text-3xl font-display tabular-nums">{currentAvg}<span className="text-lg text-muted-foreground">/100</span></p>
              </div>
              <div className="flex items-center gap-6 text-xs font-mono">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: "#eca8d6" }} />
                  Book sentiment
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-0.5 rounded-full border-t border-dashed" style={{ borderColor: "#d4a23c", backgroundColor: "#d4a23c" }} />
                  Market volatility
                </span>
              </div>
            </div>
            <p className="text-xs font-mono text-muted-foreground">Fiscal year · Jul – Jun</p>
          </div>

          <VitalityOverview data={overviewData} />

          <p className="text-xs text-muted-foreground mt-6 leading-relaxed max-w-2xl">
            Note the March dip: book sentiment softened as volatility spiked to 33, then
            recovered — a market-driven wobble, not a churn signal. Persistent declines
            uncorrelated with volatility are the ones that need a call.
          </p>
        </div>

        {/* Per-client topography */}
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5 mt-12">
          Per-client trend · sorted by quarterly change
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientTrends.map(({ client, data, current, delta }) => {
            const up = delta >= 0;
            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="group border border-foreground/10 bg-foreground/[0.02] rounded-md p-5 hover:bg-foreground/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium flex items-center gap-1.5 truncate">
                      {client.name}
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground shrink-0" />
                    </p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      Score {current}/100
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-mono ${
                      up ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {up ? "+" : ""}
                    {delta}
                  </span>
                </div>
                <ClientTrend data={data} color={toneColor[client.sentiment]} />
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
