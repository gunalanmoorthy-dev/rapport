"use client";

/**
 * Admin control to add a firm partner to the ecosystem. Posts to
 * /api/admin/partners (admin-only) and refreshes the page. Also mints a
 * shareable referral code for the partner (demo — copy to clipboard).
 *
 * @module components/app/admin-add-partner
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Handshake, Ticket, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Mint a short, human-readable referral code (demo only — not persisted). */
function mintReferralCode(seed: string): string {
  const slug = (seed.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "RPRT");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RAP-${slug}-${rand}`;
}

export function AdminAddPartner() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) {
      toast.error("Ecosystem partner is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, specialization, contactEmail }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to add partner.");
      toast.success("Partner added to the ecosystem");
      setName("");
      setSpecialization("");
      setContactEmail("");
      setReferralCode("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add partner.");
    } finally {
      setBusy(false);
    }
  };

  const generateCode = () => {
    const code = mintReferralCode(name);
    setReferralCode(code);
    setCopied(false);
    toast.success("Referral code generated");
  };

  const copyCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — copy it manually.");
    }
  };

  const field =
    "rounded-md border border-foreground/15 bg-foreground/[0.03] px-3 h-10 text-sm focus:outline-none focus:border-foreground/40";

  return (
    <div className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-5 mb-6">
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
        <Handshake className="w-4 h-4 text-[#eca8d6]" />
        Add a partner to the ecosystem
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        <input
          className={field}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ecosystem partner (e.g. Meridian Tax Advisory)"
        />
        <input
          className={field}
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          placeholder="Specialization (e.g. Tax & estate planning)"
        />
        <input
          className={field}
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="Contact email"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-full gap-2"
          onClick={generateCode}
        >
          <Ticket className="w-4 h-4" />
          Referral code
        </Button>
        {referralCode && (
          <button
            type="button"
            onClick={copyCode}
            title="Copy referral code"
            className="inline-flex items-center gap-2 rounded-full border border-[#eca8d6]/30 bg-[#eca8d6]/10 text-[#eca8d6] px-3 h-9 text-xs font-mono hover:bg-[#eca8d6]/20 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {referralCode}
          </button>
        )}
        <Button
          className="rounded-full bg-foreground text-background hover:bg-foreground/90 ml-auto"
          disabled={busy}
          onClick={add}
        >
          {busy ? "Adding…" : "Add partner"}
        </Button>
      </div>
    </div>
  );
}
