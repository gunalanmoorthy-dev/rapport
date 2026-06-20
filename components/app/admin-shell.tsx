"use client";

/**
 * Chrome for the admin oversight area. Mirrors AppShell but with an admin-only
 * nav (firm overview), an "Admin" badge, the theme toggle, and sign-out. Admins
 * never see the advisor nav (Notes/Library/Echo are out of scope for them).
 *
 * @module components/app/admin-shell
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<{ name: string; workId: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) setAdmin({ name: d.name, workId: d.workId });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  const onOverview = pathname === "/admin";
  const onPartners = pathname.startsWith("/admin/partners");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-xl font-display tracking-tight">RAPPORT</span>
              <span className="text-[10px] font-mono text-muted-foreground mt-0.5">TM</span>
            </Link>
            <span className="px-2 py-0.5 rounded-full border border-[#eca8d6]/30 bg-[#eca8d6]/10 text-[#eca8d6] text-[10px] font-mono uppercase tracking-wider">
              Admin
            </span>
            <nav className="hidden lg:flex items-center gap-6">
              <Link
                href="/admin"
                className={`text-xs font-mono uppercase tracking-wider transition-colors ${
                  onOverview ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Firm overview
              </Link>
              <Link
                href="/admin/partners"
                className={`text-xs font-mono uppercase tracking-wider transition-colors ${
                  onPartners ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Partnerships
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-[#eca8d6] animate-pulse" />
              firm oversight
            </span>
            {admin && (
              <span className="hidden md:flex flex-col items-end leading-tight">
                <span className="text-xs font-medium">{admin.name}</span>
                {admin.workId && (
                  <span className="text-[10px] font-mono text-muted-foreground">{admin.workId}</span>
                )}
              </span>
            )}
            <div className="w-8 h-8 rounded-full bg-foreground/10 border border-foreground/15 flex items-center justify-center text-xs font-mono">
              {admin ? initials(admin.name) : "—"}
            </div>
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="w-8 h-8 rounded-full flex items-center justify-center border border-foreground/15 text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
