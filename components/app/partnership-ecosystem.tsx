/**
 * The Partnership ecosystem view — the firm's shared partner network, the
 * add-partner control, a contacts directory, and the referral pipeline. Shared
 * verbatim by the admin oversight page (`/admin/partners`) and the partner
 * portal (`/partner`); each just wraps it in its own shell and passes the API
 * route the add form should post to.
 *
 * @module components/app/partnership-ecosystem
 */
import { Handshake, Mail } from "lucide-react";
import { AdminAddPartner } from "@/components/app/admin-add-partner";
import { EcosystemIdentity } from "@/components/app/ecosystem-identity";
import { relativeFromNow } from "@/lib/display";
import type { Partner, ReferralStatus } from "@/db/schema";
import type { FirmReferral } from "@/lib/partners";

const STATUS_META: Record<ReferralStatus, { label: string; cls: string }> = {
  introduced: { label: "Introduced", cls: "border-foreground/15 bg-foreground/5 text-muted-foreground" },
  responded: { label: "Responded", cls: "border-sky-400/30 bg-sky-400/10 text-sky-300" },
  progressing: { label: "Progressing", cls: "border-[#eca8d6]/30 bg-[#eca8d6]/10 text-[#eca8d6]" },
  closed: { label: "Closed", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
};

const PIPELINE_ORDER: ReferralStatus[] = ["introduced", "responded", "progressing", "closed"];

/** Demo directory rows — referred contacts and the partner they belong to. */
const DIRECTORY_CONTACTS = [
  { name: "Daniel Mercer", email: "daniel.mercer@meridiantax.com", partner: "Meridian Tax Advisory" },
  { name: "Sophia Reyes", email: "sophia.reyes@helioslending.com", partner: "Helios Private Lending" },
  { name: "Marcus Aldridge", email: "marcus.aldridge@asterlegal.com", partner: "Aster Legal Partners" },
  { name: "Olivia Chen", email: "olivia.chen@nimbusinsure.com", partner: "Nimbus Insurance Group" },
  { name: "Ethan Vance", email: "ethan.vance@vantarealty.com", partner: "Vanta Real Estate Advisors" },
];

/** Stable, personal-looking referral code derived from the account's id. */
export function personalReferralCode(seed: string): string {
  const hex = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase() || "RAPPORT1";
  return `RAP-${hex}`;
}

export function PartnershipEcosystem({
  firm,
  name,
  referralCode,
  partners,
  referrals,
  addPartnerEndpoint,
  topSlot,
}: {
  firm: string;
  name: string;
  referralCode: string;
  partners: Partner[];
  referrals: FirmReferral[];
  /** API route the add-partner form posts to (admin vs partner). */
  addPartnerEndpoint?: string;
  /** Optional content above the header (e.g. a back link). */
  topSlot?: React.ReactNode;
}) {
  const activeTotal = referrals.filter((r) => r.status !== "closed").length;
  const closedTotal = referrals.filter((r) => r.status === "closed").length;
  const conversion = referrals.length ? Math.round((closedTotal / referrals.length) * 100) : 0;

  const sectionLabel = "text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5";

  return (
    <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-12 lg:py-16">
      {topSlot}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 pb-10 border-b border-foreground/10">
        <div>
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            {firm} · Ecosystem
          </span>
          <h1 className="text-4xl lg:text-5xl font-display tracking-tight">Partnership ecosystem</h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">
            The firm&apos;s shared partner network and every introduction advisors have made —
            so the right partner surfaces at the right moment.
          </p>
          <EcosystemIdentity name={name} coins={10} referralCode={referralCode} />
        </div>
        <div className="flex items-center gap-8 shrink-0">
          <div className="text-right">
            <p className="text-3xl font-display tabular-nums">{partners.length}</p>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">partners</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-display tabular-nums">{activeTotal}</p>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">active intros</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-display tabular-nums">{conversion}%</p>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">conversion</p>
          </div>
        </div>
      </div>

      {/* Add partner */}
      <AdminAddPartner endpoint={addPartnerEndpoint} />

      {/* Partner directory — referred contacts across the ecosystem */}
      <div className="mb-14">
        <h2 className={sectionLabel}>Partner directory · {DIRECTORY_CONTACTS.length} contacts</h2>
        <div className="border border-foreground/10 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/10 bg-foreground/[0.02] text-left">
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground font-normal">Name</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground font-normal">Email</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground font-normal">Ecosystem partner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {DIRECTORY_CONTACTS.map((c) => (
                <tr key={c.email} className="hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" /> {c.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#eca8d6]">
                      <Handshake className="w-3.5 h-3.5 shrink-0" /> {c.partner}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referral pipeline — across all advisors in the firm */}
      <div>
        <h2 className={sectionLabel}>Introductions &amp; referrals · {referrals.length}</h2>
        {referrals.length === 0 ? (
          <p className="text-sm font-mono text-muted-foreground/60">No introductions logged yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PIPELINE_ORDER.map((status) => {
              const inStage = referrals.filter((r) => r.status === status);
              const meta = STATUS_META[status];
              return (
                <div key={status} className="border border-foreground/10 rounded-md overflow-hidden">
                  <div className="px-4 py-3 border-b border-foreground/10 bg-foreground/[0.02] flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground tabular-nums">{inStage.length}</span>
                  </div>
                  <div className="divide-y divide-foreground/10">
                    {inStage.length === 0 ? (
                      <p className="px-4 py-4 text-xs font-mono text-muted-foreground/40">—</p>
                    ) : (
                      inStage.map((r) => (
                        <div key={r.id} className="px-4 py-3">
                          <p className="text-sm font-medium truncate">{r.clientName ?? "Client"}</p>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">
                            → {r.partnerName ?? "Partner"}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">
                            {r.advisorName ?? "Advisor"} · {relativeFromNow(r.introducedAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
