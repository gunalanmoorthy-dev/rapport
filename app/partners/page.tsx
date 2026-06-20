import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { PartnerEcosystem } from "@/components/app/partner-ecosystem";
import { getClients } from "@/lib/queries";
import { requireAdvisorId } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Partners · Rapport",
  description: "Match a client need to the right specialist partner.",
};

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const advisorId = await requireAdvisorId();
  const clients = await getClients(advisorId);

  return (
    <AppShell>
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="mb-12">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Partners
          </span>
          <h1 className="text-5xl lg:text-6xl font-display tracking-tight mb-4">
            Specialist partners
          </h1>
          <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
            Describe a client need — Rapport maps it to the right specializations and ranks
            partners by fit and their real track record. Success scores and response times
            are computed in code from actual referrals, never invented.
          </p>
        </div>

        <PartnerEcosystem clients={clients.map((c) => ({ id: c.id, name: c.name ?? "Unnamed" }))} />
      </section>
    </AppShell>
  );
}
