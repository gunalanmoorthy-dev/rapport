import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Mic, FileText } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { SentimentTag } from "@/components/app/sentiment-tag";
import { formatCents } from "@/lib/mock-data";
import { getClientById, getClientMoves, getClientEchoes } from "@/lib/queries";
import { getAdvisorId, requireAdvisorId } from "@/lib/auth";
import {
  householdLabel,
  sentimentNote,
  relativeFromNow,
  formatDateTime,
} from "@/lib/display";
import type { MoveDirection } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const advisorId = await getAdvisorId();
  const client = advisorId ? await getClientById(id, advisorId) : null;
  return {
    title: client ? `${client.name} · Rapport` : "Client · Rapport",
  };
}

const directionMeta: Record<
  MoveDirection,
  { icon: typeof ArrowDownRight; cls: string; action: string }
> = {
  in: { icon: ArrowDownRight, cls: "text-emerald-300", action: "Added" },
  out: { icon: ArrowUpRight, cls: "text-red-300", action: "Withdrew" },
};

const echoStatusMeta = {
  committed: { label: "Committed", cls: "text-emerald-300" },
  staged: { label: "In staging", cls: "text-amber-300" },
  rolled_back: { label: "Rolled back", cls: "text-red-300" },
} as const;

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const advisorId = await requireAdvisorId();
  const client = await getClientById(id, advisorId);
  if (!client) notFound();

  const [moves, echoHistory] = await Promise.all([
    getClientMoves(client.id),
    getClientEchoes(client.id),
  ]);

  const echoSummaryById = new Map(
    echoHistory.map((e) => [e.id, e.extracted?.summary ?? null] as const)
  );
  const lastContact = echoHistory[0]?.createdAt
    ? new Date(echoHistory[0].createdAt)
    : null;

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
              <SentimentTag sentiment={client.sentiment ?? "green"} />
            </div>
            <p className="text-sm font-mono text-muted-foreground">
              {householdLabel(client.name)}
            </p>
            {(client.email || client.phone) && (
              <p className="text-sm font-mono text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                {client.email && <span>{client.email}</span>}
                {client.phone && <span>{client.phone}</span>}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-3 max-w-md leading-relaxed">
              {sentimentNote(client.sentiment)}
            </p>
          </div>

          <div className="text-left lg:text-right shrink-0">
            <p className="text-4xl font-display tabular-nums">
              {formatCents(client.totalBalanceCents ?? 0)}
            </p>
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
            { label: "Advisor", value: "You" },
            { label: "Last contact", value: relativeFromNow(lastContact) },
            { label: "Portfolio moves", value: `${moves.length}` },
            { label: "Briefs on record", value: `${echoHistory.length}` },
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
            {moves.length === 0 ? (
              <p className="text-sm font-mono text-muted-foreground/60 py-4">
                No portfolio moves committed yet.
              </p>
            ) : (
              <div className="space-y-px">
                {moves.map((move) => {
                  const meta = directionMeta[move.direction ?? "in"];
                  const Icon = meta.icon;
                  const instrument =
                    (move.echoId && echoSummaryById.get(move.echoId)) ||
                    "Portfolio adjustment";
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
                          <span className="text-muted-foreground">{meta.action} </span>
                          {instrument}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">
                          {formatDateTime(move.createdAt ? new Date(move.createdAt) : null)}
                        </p>
                      </div>
                      <p className="text-sm font-display tabular-nums shrink-0">
                        {formatCents(move.amountCents ?? 0)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Echo history */}
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-6">
              Echo history
            </h2>
            {echoHistory.length === 0 ? (
              <p className="text-sm font-mono text-muted-foreground/60 py-4">
                No briefs recorded for this client yet.
              </p>
            ) : (
              <div className="space-y-4">
                {echoHistory.map((echo) => {
                  const status = echoStatusMeta[echo.status ?? "staged"];
                  return (
                    <div
                      key={echo.id}
                      className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground">
                          <Mic className="w-3.5 h-3.5 text-[#eca8d6]" />
                          {formatDateTime(echo.createdAt ? new Date(echo.createdAt) : null)}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {Math.round(Number(echo.confidence ?? 0) * 100)}% conf.
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed mb-4">
                        {echo.extracted?.summary ?? echo.transcript ?? "—"}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className={status.cls}>{status.label}</span>
                        {echo.extracted?.move && (
                          <span className="text-muted-foreground">
                            {echo.extracted.move.direction === "in" ? "Inflow" : "Outflow"}{" "}
                            {formatCents(echo.extracted.move.amountCents)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
