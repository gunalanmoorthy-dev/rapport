"use client";

/**
 * Shared in-app chrome: the sticky top nav (with active-route highlighting) that
 * wraps every authenticated screen. Children render in the main content area.
 *
 * @module components/app/app-shell
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";

const appLinks = [
  { name: "Brief", href: "/digest" },
  { name: "Echo", href: "/echo" },
  { name: "Clients", href: "/clients" },
  { name: "Staging", href: "/staging" },
  { name: "Notes", href: "/notes" },
  { name: "Compliance", href: "/compliance" },
  { name: "Audit", href: "/audit" },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [advisor, setAdvisor] = useState<{ name: string; workId: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) setAdvisor({ name: d.name, workId: d.workId });
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-display tracking-tight">RAPPORT</span>
              <span className="text-[10px] font-mono text-muted-foreground mt-0.5">TM</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
              {appLinks.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/echo" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-xs font-mono uppercase tracking-wider transition-colors ${
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-[#eca8d6] animate-pulse" />
              0 client-facing AI
            </span>
            {advisor && (
              <span className="hidden md:flex flex-col items-end leading-tight">
                <span className="text-xs font-medium">{advisor.name}</span>
                {advisor.workId && (
                  <span className="text-[10px] font-mono text-muted-foreground">{advisor.workId}</span>
                )}
              </span>
            )}
            <div className="w-8 h-8 rounded-full bg-foreground/10 border border-foreground/15 flex items-center justify-center text-xs font-mono">
              {advisor ? initials(advisor.name) : "—"}
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
