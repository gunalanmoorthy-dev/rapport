import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { SentimentTag } from "@/components/app/sentiment-tag";
import { formatCents } from "@/lib/mock-data";
import { getClients, getLastContactByClient } from "@/lib/queries";
import { householdLabel, relativeFromNow } from "@/lib/display";
import type { Sentiment } from "@/db/schema";

export const metadata: Metadata = {
  title: "Clients · Rapport",
  description: "Your book of business with live sentiment.",
};

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [clients, lastContact] = await Promise.all([
    getClients(),
    getLastContactByClient(),
  ]);

  const totalAum = clients.reduce((sum, c) => sum + (c.totalBalanceCents ?? 0), 0);

  const counts = clients.reduce(
    (acc, c) => {
      if (c.sentiment) acc[c.sentiment] += 1;
      return acc;
    },
    { green: 0, amber: 0, red: 0 } as Record<Sentiment, number>
  );

  return (
    <AppShell>
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <div>
            <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              <span className="w-8 h-px bg-foreground/30" />
              Clients
            </span>
            <h1 className="text-5xl lg:text-6xl font-display tracking-tight">
              Your book of business
            </h1>
          </div>

          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-display">{formatCents(totalAum)}</p>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">
                Total AUM
              </p>
            </div>
            <div className="flex items-center gap-5 text-sm font-mono">
              <span className="flex items-center gap-2" title="Engaged">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-muted-foreground">Engaged</span>
                <span className="tabular-nums">{counts.green}</span>
              </span>
              <span className="flex items-center gap-2" title="Cooling">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-muted-foreground">Cooling</span>
                <span className="tabular-nums">{counts.amber}</span>
              </span>
              <span className="flex items-center gap-2" title="Going cold">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-muted-foreground">Going cold</span>
                <span className="tabular-nums">{counts.red}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border border-foreground/10 rounded-md overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-foreground/10 bg-foreground/[0.02] text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <div className="col-span-5">Client</div>
            <div className="col-span-3 text-right">Total balance</div>
            <div className="col-span-2">Sentiment</div>
            <div className="col-span-2 text-right">Last contact</div>
          </div>

          <div className="divide-y divide-foreground/10">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className={`group relative grid grid-cols-2 md:grid-cols-12 gap-4 px-6 py-5 items-center transition-colors border-l-2 ${
                  client.sentiment === "red"
                    ? "border-l-red-400/60 bg-red-400/[0.035] hover:bg-red-400/[0.07]"
                    : client.sentiment === "amber"
                    ? "border-l-amber-400/50 bg-amber-400/[0.025] hover:bg-amber-400/[0.05]"
                    : "border-l-transparent hover:bg-foreground/[0.03]"
                }`}
              >
                <div className="col-span-2 md:col-span-5">
                  <p className="text-base font-medium flex items-center gap-2">
                    {client.name}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-muted-foreground" />
                  </p>
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    {householdLabel(client.name)}
                  </p>
                </div>

                <div className="md:col-span-3 md:text-right">
                  <p className="text-base font-display tabular-nums">
                    {formatCents(client.totalBalanceCents ?? 0)}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground mt-1 md:hidden">
                    Total balance
                  </p>
                </div>

                <div className="md:col-span-2">
                  <SentimentTag sentiment={client.sentiment ?? "green"} />
                </div>

                <div className="md:col-span-2 md:text-right">
                  <p
                    className={`text-sm font-mono inline-flex items-center gap-1.5 md:justify-end ${
                      client.sentiment === "red"
                        ? "text-red-300"
                        : client.sentiment === "amber"
                        ? "text-amber-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {client.sentiment === "red" && (
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {relativeFromNow(lastContact.get(client.id))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
