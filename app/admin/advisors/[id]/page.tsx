import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, BookOpen, Bot, Lock, Mic, StickyNote, User } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import { AdminAddActivity } from "@/components/app/admin-add-activity";
import { SentimentTag } from "@/components/app/sentiment-tag";
import { db } from "@/db/client";
import { cpdEntries } from "@/db/schema";
import { formatCents, auditTrail, auditTypeMeta } from "@/lib/mock-data";
import { requireAdmin } from "@/lib/auth";
import {
  getAdvisorById,
  getClients,
  getStagedEchoes,
  getActivities,
  getLastContactByClient,
} from "@/lib/queries";
import { getManagedAdvisor } from "@/lib/admin";
import { tallyCpd } from "@/lib/cpd";
import { relativeFromNow, formatDateTime, householdLabel } from "@/lib/display";

export const dynamic = "force-dynamic";

const LOCKED_AREAS = [
  { name: "Notes", icon: StickyNote },
  { name: "Library", icon: BookOpen },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const adminId = await requireAdmin();
  const admin = await getAdvisorById(adminId);
  const target = await getManagedAdvisor(admin?.firm ?? null, id);
  return { title: target ? `${target.name} · Admin · Rapport` : "Admin · Rapport" };
}

export default async function AdminAdvisorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminId = await requireAdmin();
  const admin = await getAdvisorById(adminId);
  const target = await getManagedAdvisor(admin?.firm ?? null, id);
  if (!target) notFound();

  const [clients, staged, activities, lastContact, cpdRows] = await Promise.all([
    getClients(target.id),
    getStagedEchoes(target.id),
    getActivities(target.id),
    getLastContactByClient(target.id),
    db.select().from(cpdEntries).where(eq(cpdEntries.advisorId, target.id)),
  ]);

  const aum = clients.reduce((s, c) => s + (c.totalBalanceCents ?? 0), 0);
  const cpd = tallyCpd(cpdRows, activities);
  const now = Date.now();
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
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-12 pb-10 border-b border-foreground/10">
          <div>
            <h1 className="text-4xl lg:text-5xl font-display tracking-tight">{target.name}</h1>
            <p className="text-sm font-mono text-muted-foreground mt-2">
              {target.workId} · {target.firm}
            </p>
            <p className="text-xs font-mono text-[#eca8d6] mt-3 inline-flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Oversight · you can log compliance here; Notes &amp; Library stay private to the advisor
            </p>
          </div>
          <div className="flex items-center gap-8 shrink-0">
            <div className="text-right">
              <p className="text-3xl font-display tabular-nums">{formatCents(aum)}</p>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">AUM</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-display tabular-nums">{clients.length}</p>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">clients</p>
            </div>
          </div>
        </div>

        {/* Locked areas — private to the advisor */}
        <div className="mb-14">
          <h2 className={sectionLabel}>Private to advisor · locked</h2>
          <div className="grid grid-cols-2 gap-3">
            {LOCKED_AREAS.map(({ name, icon: Icon }) => (
              <div
                key={name}
                aria-disabled="true"
                title={`${name} is private to the advisor`}
                className="opacity-50 cursor-not-allowed select-none flex items-center gap-3 border border-foreground/10 bg-foreground/[0.02] rounded-md px-5 py-4"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm flex-1">{name}</span>
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        {/* Clients */}
        <div className="mb-14">
          <h2 className={sectionLabel}>Clients</h2>
          {clients.length === 0 ? (
            <p className="text-sm font-mono text-muted-foreground/60">No clients.</p>
          ) : (
            <div className="border border-foreground/10 rounded-md divide-y divide-foreground/10">
              {clients.map((c) => (
                <div key={c.id} className="grid grid-cols-2 md:grid-cols-12 gap-4 px-6 py-4 items-center">
                  <div className="col-span-2 md:col-span-5 min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2">
                      {c.name}
                      {c.status === "pending" && (
                        <span className="px-2 py-0.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-[10px] font-mono uppercase">
                          Pending
                        </span>
                      )}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">
                      {householdLabel(c.name)}
                      {c.email ? ` · ${c.email}` : ""}
                    </p>
                  </div>
                  <div className="md:col-span-3 md:text-right">
                    <p className="text-sm font-display tabular-nums">{formatCents(c.totalBalanceCents ?? 0)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <SentimentTag sentiment={c.sentiment ?? "green"} />
                  </div>
                  <div className="md:col-span-2 md:text-right text-xs font-mono text-muted-foreground">
                    {relativeFromNow(lastContact.get(c.id))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staging */}
        <div className="mb-14">
          <h2 className={sectionLabel}>Staging · {staged.length}</h2>
          {staged.length === 0 ? (
            <p className="text-sm font-mono text-muted-foreground/60">Nothing staged.</p>
          ) : (
            <div className="space-y-3">
              {staged.map(({ echo, client }) => (
                <div key={echo.id} className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-5">
                  <div className="flex items-center justify-between mb-2 text-xs font-mono text-muted-foreground">
                    <span>{client?.name ?? echo.extracted?.matchedClientName ?? "Unmatched"}</span>
                    <span>{formatDateTime(echo.createdAt ? new Date(echo.createdAt) : null)}</span>
                  </div>
                  <p className="text-sm text-foreground/90">{echo.extracted?.summary ?? echo.transcript ?? "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compliance */}
        <div className="mb-14">
          <h2 className={sectionLabel}>Compliance · CPD</h2>
          <div className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-6 mb-4">
            <p className="text-3xl font-display tabular-nums">
              {(cpd.totalMinutes / 60).toFixed(1)}
              <span className="text-lg text-muted-foreground"> / {(cpd.requirementMinutes / 60).toFixed(0)} h</span>
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              {cpd.metRequirement ? "Annual requirement met" : "CPD in progress"}
            </p>
          </div>
          <AdminAddActivity advisorId={target.id} />
          {activities.length === 0 ? (
            <p className="text-sm font-mono text-muted-foreground/60">No activities logged.</p>
          ) : (
            <div className="border border-foreground/10 rounded-md divide-y divide-foreground/10">
              {activities.map((a) => {
                const at = a.scheduledAt ? new Date(a.scheduledAt) : null;
                return (
                  <div key={a.id} className="flex items-center gap-4 px-6 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{a.title}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{formatDateTime(at)}</p>
                    </div>
                    {a.category && (
                      <span className="px-2 py-0.5 rounded-full border border-foreground/10 bg-foreground/5 text-xs font-mono text-muted-foreground">
                        {a.category}
                      </span>
                    )}
                    <span className={`text-xs font-mono ${at && at.getTime() >= now ? "text-[#eca8d6]" : "text-muted-foreground/60"}`}>
                      {at && at.getTime() >= now ? "upcoming" : "past"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Audit (firm-wide demo ledger) */}
        <div>
          <h2 className={sectionLabel}>Audit trail</h2>
          <div className="border border-foreground/10 rounded-md divide-y divide-foreground/10">
            {auditTrail.slice(0, 8).map((entry) => {
              const meta = auditTypeMeta[entry.type];
              const Icon = entry.actor === "Rapport" ? Bot : User;
              return (
                <div key={entry.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-6 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground md:w-28">
                    <Icon className="w-3.5 h-3.5" /> {entry.actor}
                  </span>
                  <span className={`inline-block w-fit px-2 py-0.5 rounded-full border text-xs font-mono ${meta.bg} ${meta.border} ${meta.text}`}>
                    {meta.label}
                  </span>
                  <span className="text-sm text-muted-foreground flex-1">{entry.detail}</span>
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">{entry.timestamp}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs font-mono text-muted-foreground/50 mt-3 inline-flex items-center gap-1.5">
            <Mic className="w-3 h-3" /> Demo ledger (shared) — a per-advisor audit table is the next step.
          </p>
        </div>
      </section>
    </AdminShell>
  );
}
