import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { StagingQueue, type StagedItem } from "@/components/app/staging-queue";
import { getStagedEchoes } from "@/lib/queries";
import { formatCents } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/display";

export const metadata: Metadata = {
  title: "Staging · Rapport",
  description: "Review pending low-confidence changes before they commit.",
};

export const dynamic = "force-dynamic";

export default async function StagingPage() {
  const staged = await getStagedEchoes();

  const items: StagedItem[] = staged.map(({ echo, client }) => {
    const ex = echo.extracted;
    const move = ex?.move ?? null;
    const confidence = Number(echo.confidence ?? 0);
    const clientId = client?.id ?? ex?.matchedClientId ?? null;
    const clientName = client?.name ?? ex?.matchedClientName ?? "Unmatched client";
    const source = `Echo · ${formatDateTime(echo.createdAt ? new Date(echo.createdAt) : null)}`;

    if (move) {
      const before = ex?.balanceBeforeCents ?? client?.totalBalanceCents ?? 0;
      const attemptedAfter =
        move.direction === "in" ? before + move.amountCents : before - move.amountCents;
      return {
        echoId: echo.id,
        clientId,
        clientName,
        field: move.direction === "in" ? "Inflow" : "Outflow",
        category: "Portfolio",
        confidence,
        source,
        before: formatCents(before),
        after: formatCents(attemptedAfter),
        invalid: !!ex?.invalid,
        invalidReason: ex?.invalidReason ?? null,
      };
    }

    return {
      echoId: echo.id,
      clientId,
      clientName,
      field: "Client note",
      category: "CRM",
      confidence,
      source,
      before: "No note on file",
      after: ex?.summary ?? ex?.intents?.join("; ") ?? "Update",
      invalid: false,
      invalidReason: null,
    };
  });

  return (
    <AppShell>
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="mb-12">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Staging
          </span>
          <h1 className="text-5xl lg:text-6xl font-display tracking-tight mb-4">
            Review queue
          </h1>
          <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
            High-confidence updates commit automatically. Anything Rapport isn&apos;t sure about
            waits here for your judgment — shown as a clean before/after diff.
          </p>
        </div>

        <StagingQueue items={items} />
      </section>
    </AppShell>
  );
}
