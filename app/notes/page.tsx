import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { NotesManager } from "@/components/app/notes-manager";
import { getClients } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Notes · Rapport",
  description: "A free-text note for every client — yours to use however you like.",
};

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const clients = await getClients();

  return (
    <AppShell>
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="mb-12">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Notes
          </span>
          <h1 className="text-5xl lg:text-6xl font-display tracking-tight mb-4">
            Client notes
          </h1>
          <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
            A free-text note for every client. Preferences, family details, reminders —
            whatever you want to remember. Entirely yours to fill in.
          </p>
        </div>

        <NotesManager
          clients={clients.map((c) => ({ id: c.id, name: c.name, note: c.note }))}
        />
      </section>
    </AppShell>
  );
}
