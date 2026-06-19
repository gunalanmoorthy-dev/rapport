import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { StagingQueue } from "@/components/app/staging-queue";

export const metadata: Metadata = {
  title: "Staging · Rapport",
  description: "Review pending low-confidence changes before they commit.",
};

export default function StagingPage() {
  return (
    <AppShell>
      <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="mb-12">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Staging
          </span>
          <h1 className="text-5xl lg:text-6xl font-display tracking-tight mb-4">
            Review queue
          </h1>
          <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
            High-confidence updates commit automatically. Anything Rapport isn&apos;t sure about
            waits here for your judgment — shown as a clean before/after diff.
          </p>
        </div>

        <StagingQueue />
      </section>
    </AppShell>
  );
}
