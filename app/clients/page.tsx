import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { ClientsManager } from "@/components/app/clients-manager";
import { getClients, getLastContactByClient } from "@/lib/queries";
import { requireAdvisorId } from "@/lib/auth";
import { relativeFromNow } from "@/lib/display";

export const metadata: Metadata = {
  title: "Clients · Rapport",
  description: "Your book of business with live sentiment.",
};

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const advisorId = await requireAdvisorId();
  const [clients, lastContact] = await Promise.all([
    getClients(advisorId),
    getLastContactByClient(advisorId),
  ]);

  // Precompute "last contact" labels into a plain object for the client component.
  const lastContactById: Record<string, string> = {};
  for (const c of clients) {
    const d = lastContact.get(c.id);
    if (d) lastContactById[c.id] = relativeFromNow(d);
  }

  return (
    <AppShell>
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <ClientsManager initialClients={clients} lastContactById={lastContactById} />
      </section>
    </AppShell>
  );
}
