import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, RefreshCw, Mic, FileText } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { SentimentTag } from "@/components/app/sentiment-tag";
import { clients, getClient, formatBalance } from "@/lib/mock-data";

export function generateStaticParams() {
  return clients.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const client = getClient(id);
  return {
    title: client ? `${client.name} · Rapport` : "Client · Rapport",
  };
}

const directionMeta = {
  buy: { icon: ArrowDownRight, cls: "text-emerald-300" },
  sell: { icon: ArrowUpRight, cls: "text-red-300" },
  rebalance: { icon: RefreshCw, cls: "text-[#eca8d6]" },
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = getClient(id);

  if (!client) notFound();

  return (
    <AppShell>
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          All clients
        </Link>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-12 pb-12 border-b border-foreground/10">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-4xl lg:text-5xl font-display tracking-tight">
                {client.name}
              </h1>
              <SentimentTag sentiment={client.sentiment} />
            </div>
            <p className="text-sm font-mono text-muted-foreground">{client.household}</p>
            <p className="text-sm text-muted-foreground mt-3 max-w-md leading-relaxed">
              {client.sentimentNote}
            </p>
          </div>

          <div className="text-left lg:text-right shrink-0">
            <p className="text-4xl font-display tabular-nums">{formatBalance(client.balance)}</p>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">
              Total balance
            </p>
            <Link
              href={`/clients/${client.id}/report`}
              className="inline-flex items-center gap-2 mt-5 rounded-full border border-foreground/15 bg-foreground/[0.03] px-4 h-9 text-sm hover:bg-foreground/[0.07] transition-colors"
            >
              <FileText className="w-4 h-4 text-[#eca8d6]" />
              Export advisor brief
            </Link>
          </div>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {[
            { label: "Risk profile", value: client.riskProfile },
            { label: "Advisor", value: client.advisor },
            { label: "Last contact", value: client.lastContact },
            { label: "Open briefs", value: `${client.echoHistory.length}` },
          ].map((item) => (
            <div
              key={item.label}
              className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-4"
            >
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                {item.label}
              </p>
              <p className="text-sm">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Portfolio moves */}
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-6">
              Portfolio moves
            </h2>
            <div className="space-y-px">
              {client.moves.map((move) => {
                const meta = directionMeta[move.direction];
                const Icon = meta.icon;
                return (
                  <div
                    key={move.id}
                    className="flex items-center gap-4 py-4 border-b border-foreground/10"
                  >
                    <div className="w-9 h-9 rounded-full border border-foreground/10 bg-foreground/[0.02] flex items-center justify-center shrink-0">
                      <Icon className={`w-4 h-4 ${meta.cls}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="text-muted-foreground">{move.action} </span>
                        {move.instrument}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        {move.date}
                      </p>
                    </div>
                    <p className="text-sm font-display tabular-nums shrink-0">{move.amount}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Echo history */}
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-6">
              Echo history
            </h2>
            <div className="space-y-4">
              {client.echoHistory.map((echo) => (
                <div
                  key={echo.id}
                  className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <Mic className="w-3.5 h-3.5 text-[#eca8d6]" />
                      {echo.date}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">{echo.duration}</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed mb-4">
                    {echo.summary}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-emerald-300">{echo.committed} auto-committed</span>
                    {echo.flagged > 0 && (
                      <span className="text-amber-300">{echo.flagged} flagged for review</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
