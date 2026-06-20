import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/app/print-button";
import { formatCents } from "@/lib/mock-data";
import { getClientById, getClientMoves, getClientEchoes } from "@/lib/queries";
import { householdLabel, sentimentNote, relativeFromNow, formatDateTime } from "@/lib/display";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const client = await getClientById(id);
  return {
    title: client ? `${client.name} — Advisor Brief · Rapport` : "Advisor Brief · Rapport",
  };
}

const sentimentLabel: Record<string, { label: string; color: string }> = {
  green: { label: "Engaged", color: "#059669" },
  amber: { label: "Cooling", color: "#d97706" },
  red: { label: "Going cold", color: "#dc2626" },
};

export default async function ClientReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const [moves, echoHistory] = await Promise.all([
    getClientMoves(client.id),
    getClientEchoes(client.id),
  ]);

  const echoSummaryById = new Map(
    echoHistory.map((e) => [e.id, e.extracted?.summary ?? null] as const)
  );
  const sentiment = sentimentLabel[client.sentiment ?? "green"];
  const totalCommitted = echoHistory.filter((e) => e.status === "committed").length;
  const totalFlagged = echoHistory.filter((e) => e.status === "staged").length;
  const lastContact = echoHistory[0]?.createdAt ? new Date(echoHistory[0].createdAt) : null;
  const generatedOn = new Date().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="print-hide sticky top-0 z-10 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[900px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href={`/clients/${client.id}`}
            className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {(client.name ?? "client").split(" ")[0]}
          </Link>
          <PrintButton label="Download brief (PDF)" />
        </div>
      </div>

      {/* The printable sheet */}
      <div className="max-w-[900px] mx-auto px-6 py-10 print:p-0 print:max-w-none">
        <article className="print-sheet bg-white text-neutral-900 rounded-md shadow-2xl shadow-black/40 px-10 py-12 lg:px-14 lg:py-16">
          {/* Letterhead */}
          <header className="flex items-start justify-between border-b border-neutral-200 pb-8 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-display tracking-tight text-neutral-900">RAPPORT</span>
                <span className="text-[10px] font-mono text-neutral-400 mt-0.5">TM</span>
              </div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 mt-2">
                Advisor Brief — Confidential
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono uppercase tracking-wider text-neutral-400">Generated</p>
              <p className="text-sm text-neutral-700 mt-1">{generatedOn}</p>
            </div>
          </header>

          {/* Client identity */}
          <div className="flex items-start justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-display tracking-tight text-neutral-900">{client.name}</h1>
              <p className="text-sm font-mono text-neutral-500 mt-2">{householdLabel(client.name)}</p>
              <p className="text-sm text-neutral-600 mt-3 max-w-md leading-relaxed">
                {sentimentNote(client.sentiment)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-display tabular-nums text-neutral-900">
                {formatCents(client.totalBalanceCents ?? 0)}
              </p>
              <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 mt-1">
                Total balance
              </p>
              <span
                className="inline-flex items-center gap-2 mt-4 px-2.5 py-1 rounded-full text-xs font-mono border"
                style={{ color: sentiment.color, borderColor: sentiment.color + "55", backgroundColor: sentiment.color + "12" }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sentiment.color }} />
                {sentiment.label}
              </span>
            </div>
          </div>

          {/* Snapshot grid */}
          <section className="grid grid-cols-4 gap-px bg-neutral-200 border border-neutral-200 rounded-md overflow-hidden mb-12">
            {[
              { label: "Advisor", value: "You" },
              { label: "Last contact", value: relativeFromNow(lastContact) },
              { label: "Portfolio moves", value: `${moves.length}` },
              { label: "Auto-committed", value: `${totalCommitted} briefs` },
            ].map((item) => (
              <div key={item.label} className="bg-white px-4 py-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  {item.label}
                </p>
                <p className="text-sm text-neutral-900">{item.value}</p>
              </div>
            ))}
          </section>

          {/* Portfolio moves */}
          <section className="mb-12">
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 mb-4">
              Recent portfolio moves
            </h2>
            {moves.length === 0 ? (
              <p className="text-sm text-neutral-500">No portfolio moves on record.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-200">
                    <th className="py-2 font-normal">Date</th>
                    <th className="py-2 font-normal">Action</th>
                    <th className="py-2 font-normal">Instrument</th>
                    <th className="py-2 font-normal text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {moves.map((move) => (
                    <tr key={move.id} className="border-b border-neutral-100">
                      <td className="py-3 font-mono text-neutral-500">
                        {formatDateTime(move.createdAt ? new Date(move.createdAt) : null)}
                      </td>
                      <td className="py-3 text-neutral-700">
                        {move.direction === "out" ? "Withdrew" : "Added"}
                      </td>
                      <td className="py-3 text-neutral-900">
                        {(move.echoId && echoSummaryById.get(move.echoId)) || "Portfolio adjustment"}
                      </td>
                      <td className="py-3 text-right font-display tabular-nums text-neutral-900">
                        {formatCents(move.amountCents ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Echo history */}
          <section className="mb-12">
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 mb-4">
              Echo history
            </h2>
            {echoHistory.length === 0 ? (
              <p className="text-sm text-neutral-500">No briefs recorded.</p>
            ) : (
              <div className="space-y-4">
                {echoHistory.map((echo) => (
                  <div key={echo.id} className="border border-neutral-200 rounded-md p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-neutral-500">
                        {formatDateTime(echo.createdAt ? new Date(echo.createdAt) : null)}
                      </span>
                      <span className="text-xs font-mono text-neutral-400">
                        {Math.round(Number(echo.confidence ?? 0) * 100)}% conf.
                      </span>
                    </div>
                    <p className="text-sm text-neutral-800 leading-relaxed mb-3">
                      {echo.extracted?.summary ?? echo.transcript ?? "—"}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span style={{ color: echo.status === "committed" ? "#059669" : "#d97706" }}>
                        {echo.status === "committed"
                          ? "Auto-committed"
                          : echo.status === "staged"
                          ? "In staging"
                          : "Rolled back"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="border-t border-neutral-200 pt-6 flex items-end justify-between">
            <div className="max-w-md">
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                This brief was assembled by Rapport from verified, advisor-approved records.
                Confidential — prepared for internal advisory use only. Not investment advice.
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Ledger reference
              </p>
              <p className="text-xs font-mono text-neutral-700 mt-1">
                #{client.id.slice(0, 3)}-{totalCommitted}{totalFlagged}-{client.id.slice(-6)}
              </p>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
