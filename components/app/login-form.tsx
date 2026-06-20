"use client";

/**
 * Advisor sign-in form (work id + password). Posts to /api/auth/login and, on
 * success, navigates to the `from` route (if any) or the morning brief.
 *
 * @module components/app/login-form
 */
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/digest";

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
        body: JSON.stringify({ workId, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Login failed.");
      // Full navigation so the middleware sees the new cookie.
      router.replace(from);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-md border border-foreground/15 bg-foreground/[0.03] px-3 h-11 text-sm focus:outline-none focus:border-foreground/40";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Work ID
        </label>
        <input
          className={field}
          value={workId}
          onChange={(e) => setWorkId(e.target.value)}
          placeholder="e.g. ADV-001"
          autoFocus
          autoComplete="username"
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
          autoComplete="current-password"
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
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
