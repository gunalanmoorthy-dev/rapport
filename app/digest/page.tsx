import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mic, Clock, CheckCircle2, Snowflake } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { SentimentTag } from "@/components/app/sentiment-tag";
import { digest, formatCents } from "@/lib/mock-data";
import { getClients, getStagedEchoes, getLastContactByClient, getAdvisorById } from "@/lib/queries";
import { requireAdvisorId } from "@/lib/auth";
import { sentimentNote, relativeFromNow } from "@/lib/display";

export const metadata: Metadata = {
  title: "Morning Brief · Rapport",
  description: "What happened overnight, what needs you, who's going cold.",
};

export const dynamic = "force-dynamic";

export default async function DigestPage() {
  const advisorId = await requireAdvisorId();
  const [advisor, clients, staged, lastContact] = await Promise.all([
    getAdvisorById(advisorId),
    getClients(advisorId),
    getStagedEchoes(advisorId),
    getLastContactByClient(advisorId),
  ]);

  const firstName = advisor?.name?.split(" ")[0] ?? "there";

  const goingCold = clients
    .filter((c) => c.sentiment !== "green")
    .sort((a, b) => (a.sentiment === "red" ? -1 : 1));
  const awaiting = staged.length;

  return (
    <AppShell>
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        {/* Header */}
        <div className="mb-12">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            {digest.date}
          </span>
          <h1 className="text-5xl lg:text-6xl font-display tracking-tight">
            Good morning, {firstName}.
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-xl leading-relaxed">
            While you were out, Rapport committed{" "}
            <span className="text-foreground">{digest.overnight.autoCommitted} verified changes</span>{" "}
            across {digest.overnight.clientsTouched} clients. Here&apos;s your morning brief.
          </p>
        </div>

        {/* Overnight stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {[
            { label: "Auto-committed", value: `${digest.overnight.autoCommitted}`, sub: "overnight" },
            { label: "Clients touched", value: `${digest.overnight.clientsTouched}`, sub: "verified" },
            { label: "CPD logged", value: digest.overnight.cpdLogged.toFixed(1), sub: "credits" },
            { label: "Time saved", value: `${digest.overnight.minutesSaved}m`, sub: "back to you" },
          ].map((s) => (
            <div
              key={s.label}
              className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-5"
            >
              <p className="text-3xl lg:text-4xl font-display tabular-nums">{s.value}</p>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-2">
                {s.label}
              </p>
              <p className="text-xs font-mono text-muted-foreground/60">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left column */}
          <div className="space-y-12">
            {/* Overnight echoes */}
            <div>
              <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-6">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Committed overnight
              </h2>
              <div className="space-y-4">
                {digest.echoes.map((echo) => (
                  <div
                    key={echo.id}
                    className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-2 text-sm">
                        <Mic className="w-3.5 h-3.5 text-[#eca8d6]" />
                        {echo.clientName}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">{echo.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {echo.summary}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-emerald-300">{echo.committed} auto-committed</span>
                      {echo.flagged > 0 && (
                        <span className="text-amber-300">{echo.flagged} in staging</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Awaiting review */}
            <div>
              <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-6">
                <Clock className="w-4 h-4 text-amber-300" />
                Awaiting your review
              </h2>
              <Link
                href="/staging"
                className="group block border border-amber-400/20 bg-amber-400/[0.04] rounded-md p-6 hover:bg-amber-400/[0.08] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-display tabular-nums">{awaiting}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      low-confidence changes need a decision
                    </p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            </div>
          </div>

          {/* Right column — going cold */}
          <div>
            <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-6">
              <Snowflake className="w-4 h-4 text-red-300" />
              Clients going cold
            </h2>
            <div className="space-y-3">
              {goingCold.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className={`group flex items-center justify-between gap-4 border rounded-md px-5 py-4 transition-colors ${
                    client.sentiment === "red"
                      ? "border-red-400/20 bg-red-400/[0.04] hover:bg-red-400/[0.08]"
                      : "border-amber-400/20 bg-amber-400/[0.03] hover:bg-amber-400/[0.06]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-base font-medium flex items-center gap-2">
                      {client.name}
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-muted-foreground" />
                    </p>
                    <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                      {sentimentNote(client.sentiment)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <SentimentTag sentiment={client.sentiment ?? "green"} />
                    <p
                      className={`text-xs font-mono mt-2 inline-flex items-center gap-1.5 ${
                        client.sentiment === "red" ? "text-red-300" : "text-amber-300"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {relativeFromNow(lastContact.get(client.id))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 border border-foreground/10 bg-foreground/[0.02] rounded-md p-5">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                Book at a glance
              </p>
              <p className="text-2xl font-display tabular-nums">
                {formatCents(clients.reduce((s, c) => s + (c.totalBalanceCents ?? 0), 0))}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                across {clients.length} relationships
              </p>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
