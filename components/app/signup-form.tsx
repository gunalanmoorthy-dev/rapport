"use client";

/**
 * Sign-up form. Posts to /api/auth/register, which creates the account and signs
 * the new user in. The Advisor/Admin toggle picks the account role; on success we
 * do a full-page navigation (advisor → /digest, admin → /admin) so middleware
 * sees the new cookie.
 *
 * @module components/app/signup-form
 */
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Mode = "advisor" | "admin";

export function SignupForm() {
  const [mode, setMode] = useState<Mode>("advisor");
  const [form, setForm] = useState({ name: "", email: "", firm: "", workId: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: mode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Sign-up failed.");
      // Hard navigation so middleware sees the new session cookie.
      window.location.assign(json.role === "admin" ? "/admin" : "/digest");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed.");
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-md border border-foreground/15 bg-foreground/[0.03] px-3 h-11 text-sm focus:outline-none focus:border-foreground/40";
  const label = "text-xs font-mono uppercase tracking-wider text-muted-foreground";
  const tab = (m: Mode) =>
    `flex-1 h-9 rounded-full text-xs font-mono uppercase tracking-wider transition-colors ${
      mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Account type */}
      <div className="flex items-center gap-1 p-1 rounded-full border border-foreground/15 bg-foreground/[0.03]">
        <button type="button" className={tab("advisor")} onClick={() => setMode("advisor")}>
          Advisor
        </button>
        <button type="button" className={tab("admin")} onClick={() => setMode("admin")}>
          Admin
        </button>
      </div>
      {mode === "admin" && (
        <p className="text-xs font-mono text-[#eca8d6] -mt-1">
          Admins oversee every advisor in the firm you enter below.
        </p>
      )}

      <div>
        <label className={label}>Full name</label>
        <input className={field} value={form.name} onChange={set("name")} placeholder={mode === "admin" ? "Morgan Reyes" : "Jordan Avery"} autoFocus />
      </div>
      <div>
        <label className={label}>Email</label>
        <input className={field} type="email" value={form.email} onChange={set("email")} placeholder="you@firm.com" autoComplete="email" />
      </div>
      <div>
        <label className={label}>
          Firm {mode === "admin" ? <span className="normal-case text-[#eca8d6]">(advisors you oversee)</span> : <span className="normal-case opacity-60">(optional)</span>}
        </label>
        <input className={field} value={form.firm} onChange={set("firm")} placeholder="Firm name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Work ID</label>
          <input className={field} value={form.workId} onChange={set("workId")} placeholder={mode === "admin" ? "ADM-002" : "ADV-003"} autoComplete="username" />
        </div>
        <div>
          <label className={label}>Password</label>
          <input className={field} type="password" value={form.password} onChange={set("password")} placeholder="min 6 chars" autoComplete="new-password" />
        </div>
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
        {busy ? "Creating account…" : mode === "admin" ? "Create admin account" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
