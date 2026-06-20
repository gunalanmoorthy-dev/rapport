import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Handshake, Mail, TrendingUp } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import { AdminAddPartner } from "@/components/app/admin-add-partner";
import { requireAdmin } from "@/lib/auth";
import { getAdvisorById } from "@/lib/queries";
import { getPartners, getFirmReferrals, tallyPartners } from "@/lib/partners";
import type { ReferralStatus } from "@/db/schema";
import { relativeFromNow } from "@/lib/display";

export const metadata: Metadata = {
  title: "Partnerships · Admin · Rapport",
  description: "Firm partner ecosystem — directory, introductions, and conversion.",
};

export const dynamic = "force-dynamic";

const STATUS_META: Record<ReferralStatus, { label: string; cls: string }> = {
  introduced: { label: "Introduced", cls: "border-foreground/15 bg-foreground/5 text-muted-foreground" },
  responded: { label: "Responded", cls: "border-sky-400/30 bg-sky-400/10 text-sky-300" },
  progressing: { label: "Progressing", cls: "border-[#eca8d6]/30 bg-[#eca8d6]/10 text-[#eca8d6]" },
  closed: { label: "Closed", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
};

const PIPELINE_ORDER: ReferralStatus[] = ["introduced", "responded", "progressing", "closed"];

export default async function AdminPartnersPage() {
  const adminId = await requireAdmin();
  const admin = await getAdvisorById(adminId);

  const [partners, referrals] = await Promise.all([
    getPartners(),
    getFirmReferrals(admin?.firm ?? null),
  ]);
  const stats = tallyPartners(partners, referrals);

  const activeTotal = referrals.filter((r) => r.status !== "closed").length;
  const closedTotal = referrals.filter((r) => r.status === "closed").length;
  const conversion = referrals.length ? Math.round((closedTotal / referrals.length) * 100) : 0;

  const sectionLabel = "text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5";

  return (
    <AdminShell>
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Firm overview
        </Link>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 pb-10 border-b border-foreground/10">
          <div>
            <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              <span className="w-8 h-px bg-foreground/30" />
              {admin?.firm ?? "Firm"} · Ecosystem
            </span>
            <h1 className="text-4xl lg:text-5xl font-display tracking-tight">Partnership ecosystem</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">
              The firm&apos;s shared partner network and every introduction advisors have made —
              so the right partner surfaces at the right moment.
            </p>
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

        {/* Add partner (admin write) */}
        <AdminAddPartner />

        {/* Partner directory — ranked best-fit first (conversion, then volume) */}
        <div className="mb-14">
          <h2 className={sectionLabel}>Partner directory · ranked by productivity</h2>
          {stats.length === 0 ? (
            <p className="text-sm font-mono text-muted-foreground/60">No partners yet — add one above.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {stats.map(({ partner, total, active, closed, conversionRate }) => (
                <div key={partner.id} className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-base font-medium flex items-center gap-2">
                        <Handshake className="w-4 h-4 text-[#eca8d6] shrink-0" />
                        {partner.name}
                      </p>
                      {partner.specialization && (
                        <p className="text-xs font-mono text-muted-foreground mt-1">{partner.specialization}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-300 shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {Math.round(conversionRate * 100)}%
                    </span>
                  </div>

                  {partner.specializationTags && partner.specializationTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {partner.specializationTags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-full border border-foreground/10 bg-foreground/5 text-[10px] font-mono text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                    <span>{total} intros</span>
                    <span className="text-[#eca8d6]">{active} active</span>
                    <span className="text-emerald-300">{closed} closed</span>
                  </div>

                  {partner.contactEmail && (
                    <p className="text-xs font-mono text-muted-foreground/70 mt-3 inline-flex items-center gap-1.5">
                      <Mail className="w-3 h-3" /> {partner.contactEmail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
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
    </AdminShell>
  );
}
