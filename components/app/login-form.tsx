"use client";

/**
 * Sign-in form (work id + password) for advisors, admins, and partners. The
 * Advisor/Admin/Partner tab is authoritative: it is sent to the API, which
 * rejects credentials whose account role doesn't match the selected tab, and we
 * route strictly by the account's role so you always land in the right area.
 *
 * On success we do a FULL-PAGE navigation (not router.replace) so the new session
 * cookie is seen by middleware and no stale, logged-out RSC payload is shown.
 *
 * @module components/app/login-form
 */
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Mode = "advisor" | "admin" | "partner";

export function LoginForm() {
  const params = useSearchParams();
  const from = params.get("from") || "/digest";

  const [mode, setMode] = useState<Mode>("advisor");
  const [workId, setWorkId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workId, password, role: mode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Login failed.");
      // Route strictly by the account's role. Only honor `from` for advisors and
      // only when it isn't a cross-role path, so an advisor never lands in the
      // admin/partner area via a stale redirect target.
      const safeFrom =
        from.startsWith("/admin") || from.startsWith("/partner") ? "/digest" : from;
      const dest =
        json.role === "admin" ? "/admin" : json.role === "partner" ? "/partner" : safeFrom;
      // Hard navigation so middleware sees the cookie and we don't render a
      // cached logged-out view of the destination.
      window.location.assign(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-md border border-foreground/15 bg-foreground/[0.03] px-3 h-11 text-sm focus:outline-none focus:border-foreground/40";

  const tab = (m: Mode) =>
    `flex-1 h-9 rounded-full text-xs font-mono uppercase tracking-wider transition-colors ${
      mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <form onSubmit={submit} className="space-y-4" autoComplete="off">
      {/* Advisor / Admin / Partner toggle */}
      <div className="flex items-center gap-1 p-1 rounded-full border border-foreground/15 bg-foreground/[0.03]">
        <button type="button" className={tab("advisor")} onClick={() => setMode("advisor")}>
          Advisor
        </button>
        <button type="button" className={tab("admin")} onClick={() => setMode("admin")}>
          Admin
        </button>
        <button type="button" className={tab("partner")} onClick={() => setMode("partner")}>
          Partner
        </button>
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Work ID
        </label>
        <input
          className={field}
          value={workId}
          onChange={(e) => setWorkId(e.target.value)}
          placeholder={
            mode === "admin" ? "e.g. ADM-001" : mode === "partner" ? "e.g. PTR-001" : "e.g. ADV-001"
          }
          autoFocus
          autoComplete="off"
          name="rapport-workid"
        />
      </div>
      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Password
        </label>
        <input
          className={field}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          name="rapport-password"
        />
      </div>

      {error && (
        <p className="text-sm text-red-300 font-mono border border-red-400/20 bg-red-400/[0.06] rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={busy}
        className="w-full h-11 rounded-full bg-foreground text-background hover:bg-foreground/90"
      >
        {busy
          ? "Signing in…"
          : mode === "admin"
            ? "Sign in as admin"
            : mode === "partner"
              ? "Sign in as partner"
              : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to Rapport?{" "}
        <Link href="/signup" className="text-foreground hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
