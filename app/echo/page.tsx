import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { EchoRecorder } from "@/components/app/echo-recorder";

export const metadata: Metadata = {
  title: "Echo · Rapport",
  description: "Capture a voice brief up to two hours and let Rapport handle the back-office.",
};

export default function EchoPage() {
  return (
    <AppShell>
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="mb-16 text-center">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5">
            <span className="w-8 h-px bg-foreground/30" />
            Echo
            <span className="w-8 h-px bg-foreground/30" />
          </span>
          <h1 className="text-5xl lg:text-7xl font-display tracking-tight leading-[0.95]">
            Talk. We&apos;ll do
            <br />
            the paperwork.
          </h1>
        </div>

        <EchoRecorder />
      </section>
    </AppShell>
  );
}
