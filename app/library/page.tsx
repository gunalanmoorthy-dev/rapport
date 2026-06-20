import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { BriefLibrary } from "@/components/app/brief-library";
import { requireAdvisorId } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Library · Rapport",
  description: "A searchable library of de-identified field briefs.",
};

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  // Gate the page (data is fetched client-side from /api/briefs, tenant-scoped).
  await requireAdvisorId();

  return (
    <AppShell>
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="mb-12">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Library
          </span>
          <h1 className="text-5xl lg:text-6xl font-display tracking-tight mb-4">
            Field briefs
          </h1>
          <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
            Record a quick field note — Rapport distills it into a reusable lesson and
            redacts every personal detail in code before it&apos;s ever stored. Search the
            library for how a situation was handled before.
          </p>
        </div>

        <BriefLibrary />
      </section>
    </AppShell>
  );
}
