import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/app/login-form";

export const metadata: Metadata = {
  title: "Sign in · Rapport",
  description: "Advisor sign-in.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-2xl font-display tracking-tight">RAPPORT</span>
            <span className="text-[10px] font-mono text-muted-foreground mt-0.5">TM</span>
          </div>
          <p className="text-sm font-mono text-muted-foreground">The advisor&apos;s silent back-office</p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
