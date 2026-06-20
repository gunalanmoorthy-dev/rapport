import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { ComplianceLog, type ActivityView } from "@/components/app/compliance-log";
import { CpdProgress } from "@/components/app/cpd-progress";
import { getActivities } from "@/lib/queries";
import { requireAdvisorId } from "@/lib/auth";
import { formatDateTime } from "@/lib/display";

export const metadata: Metadata = {
  title: "Compliance · Rapport",
  description: "Continuing-education activities and seminars — past and upcoming.",
};

export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const advisorId = await requireAdvisorId();
  const activities = await getActivities(advisorId);
  const now = Date.now();

  const items: ActivityView[] = activities.map((a) => {
    const at = a.scheduledAt ? new Date(a.scheduledAt) : null;
    return {
      id: a.id,
      title: a.title,
      category: a.category,
      when: at ? formatDateTime(at) : null,
      upcoming: at ? at.getTime() >= now : false,
    };
  });

  return (
    <AppShell>
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="mb-12">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Compliance
          </span>
          <h1 className="text-5xl lg:text-6xl font-display tracking-tight mb-4">
            Activities &amp; seminars
          </h1>
          <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
            Your continuing-education log — seminars attended and sessions coming up.
            Add an upcoming activity with its date and time.
          </p>
        </div>

        <ComplianceLog items={items} />

        {/* Feature A — passive CPD tracking (appended below the activity log) */}
        <CpdProgress />
      </section>
    </AppShell>
  );
}
