import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import { formatCents } from "@/lib/mock-data";
import { requireAdmin } from "@/lib/auth";
import { getAdvisorById, getClients } from "@/lib/queries";
import { getFirmAdvisors, getEffectiveAdminFirm } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin · Rapport",
  description: "Firm oversight — your advisors at a glance.",
};

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const adminId = await requireAdmin();
  const admin = await getAdvisorById(adminId);
  const firm = await getEffectiveAdminFirm(admin?.firm ?? null);
  const advisors = await getFirmAdvisors(firm);

  // Per-advisor headline stats (read-only).
  const stats = await Promise.all(
    advisors.map(async (a) => {
      const clients = await getClients(a.id);
      const aum = clients.reduce((s, c) => s + (c.totalBalanceCents ?? 0), 0);
      const pending = clients.filter((c) => c.status === "pending").length;
      return { advisor: a, clientCount: clients.length, aum, pending };
    })
  );

  const firmAum = stats.reduce((s, x) => s + x.aum, 0);

  return (
    <AdminShell>
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <div>
            <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              <span className="w-8 h-px bg-foreground/30" />
              {firm}
            </span>
            <h1 className="text-5xl lg:text-6xl font-display tracking-tight">Firm overview</h1>
          </div>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-display tabular-nums">{formatCents(firmAum)}</p>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">Firm AUM</p>
            </div>
            <div>
              <p className="text-3xl font-display tabular-nums">{advisors.length}</p>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">Advisors</p>
            </div>
          </div>
        </div>

        {advisors.length === 0 ? (
          <div className="border border-foreground/10 rounded-md p-16 text-center">
            <Users className="w-6 h-6 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-mono text-muted-foreground">
              No advisors in your firm yet.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map(({ advisor, clientCount, aum, pending }) => (
              <Link
                key={advisor.id}
                href={`/admin/advisors/${advisor.id}`}
                className="group border border-foreground/10 bg-foreground/[0.02] rounded-md p-6 hover:bg-foreground/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0">
                    <p className="text-lg font-medium flex items-center gap-1.5">
                      {advisor.name}
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{advisor.workId}</p>
                  </div>
                  {pending > 0 && (
                    <span className="px-2 py-0.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-[10px] font-mono uppercase tracking-wider">
                      {pending} pending
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-display tabular-nums">{formatCents(aum)}</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">AUM</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-display tabular-nums">{clientCount}</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">clients</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
