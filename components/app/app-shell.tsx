"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const appLinks = [
  { name: "Echo", href: "/echo" },
  { name: "Clients", href: "/clients" },
  { name: "Staging", href: "/staging" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-display tracking-tight">RAPPORT</span>
              <span className="text-[10px] font-mono text-muted-foreground mt-0.5">TM</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              {appLinks.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/echo" && pathname.startsWith(link.href)) ||
                  (link.href === "/clients" && pathname.startsWith("/clients"));
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-sm font-mono uppercase tracking-wider transition-colors ${
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
            <div className="w-8 h-8 rounded-full bg-foreground/10 border border-foreground/15 flex items-center justify-center text-xs font-mono">
              AD
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
