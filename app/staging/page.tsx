import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { StagingLog, type StagingGroup } from "@/components/app/staging-log";
import { getStagedEchoes } from "@/lib/queries";
import { formatDateTime } from "@/lib/display";

export const metadata: Metadata = {
  title: "Staging · Rapport",
  description: "A per-client log of captured briefs — full transcript and AI summary.",
};

export const dynamic = "force-dynamic";

export default async function StagingPage() {
  const staged = await getStagedEchoes();

  // Group staged echoes by client (unmatched briefs go in their own bucket).
  const groups = new Map<string, StagingGroup>();
  for (const { echo, client } of staged) {
    const key = client?.id ?? "__unmatched__";
    if (!groups.has(key)) {
      groups.set(key, {
        clientId: client?.id ?? null,
        clientName: client?.name ?? echo.extracted?.matchedClientName ?? "Unmatched client",
        email: client?.email ?? null,
        phone: client?.phone ?? null,
        echoes: [],
      });
    }
    groups.get(key)!.echoes.push({
      id: echo.id,
      transcript: echo.transcript ?? "",
      summary: echo.extracted?.summary ?? null,
      intents: echo.extracted?.intents ?? [],
      move: echo.extracted?.move ?? null,
      confidence: Number(echo.confidence ?? 0),
      when: formatDateTime(echo.createdAt ? new Date(echo.createdAt) : null),
    });
  }

  return (
    <AppShell>
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="mb-12">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Staging
          </span>
          <h1 className="text-5xl lg:text-6xl font-display tracking-tight mb-4">
            Captured briefs
          </h1>
          <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
            A per-client log of everything Rapport captured — the full transcript alongside
            the AI&apos;s pinpoint summary. Contact details are editable inline.
          </p>
        </div>

        <StagingLog groups={Array.from(groups.values())} />
      </section>
    </AppShell>
  );
}
