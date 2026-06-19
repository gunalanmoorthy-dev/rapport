import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { SentimentTag } from "@/components/app/sentiment-tag";
import { clients, formatBalance } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Clients · Rapport",
  description: "Your book of business with live sentiment.",
};

export default function ClientsPage() {
  const totalAum = clients.reduce((sum, c) => sum + c.balance, 0);

  const counts = clients.reduce(
    (acc, c) => {
      acc[c.sentiment] += 1;
      return acc;
    },
    { green: 0, amber: 0, red: 0 } as Record<string, number>
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
              <p className="text-3xl font-display">{formatBalance(totalAum)}</p>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">
                Total AUM
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {counts.green}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {counts.amber}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                {counts.red}
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
                className="group grid grid-cols-2 md:grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-foreground/[0.03] transition-colors"
              >
                <div className="col-span-2 md:col-span-5">
                  <p className="text-base font-medium flex items-center gap-2">
                    {client.name}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-muted-foreground" />
                  </p>
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    {client.household}
                  </p>
                </div>

                <div className="md:col-span-3 md:text-right">
                  <p className="text-base font-display tabular-nums">
                    {formatBalance(client.balance)}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground mt-1 md:hidden">
                    Total balance
                  </p>
                </div>

                <div className="md:col-span-2">
                  <SentimentTag sentiment={client.sentiment} />
                </div>

                <div className="md:col-span-2 md:text-right">
                  <p className="text-sm font-mono text-muted-foreground">
                    {client.lastContact}
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
