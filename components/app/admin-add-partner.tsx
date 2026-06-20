"use client";

/**
 * Admin control to add a firm partner to the ecosystem. Posts to
 * /api/admin/partners (admin-only) and refreshes the page.
 *
 * @module components/app/admin-add-partner
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Handshake } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AdminAddPartner() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [tags, setTags] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) {
      toast.error("Partner name is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, specialization, tags, contactEmail }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to add partner.");
      toast.success("Partner added to the ecosystem");
      setName("");
      setSpecialization("");
      setTags("");
      setContactEmail("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add partner.");
    } finally {
      setBusy(false);
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
          placeholder="Partner name (e.g. Meridian Tax Advisory)"
        />
        <input
          className={field}
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          placeholder="Specialization (e.g. Tax & estate planning)"
        />
        <input
          className={field}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags, comma-separated (e.g. tax, estate-planning)"
        />
        <input
          className={field}
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="Contact email"
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          className="rounded-full bg-foreground text-background hover:bg-foreground/90"
          disabled={busy}
          onClick={add}
        >
          {busy ? "Adding…" : "Add partner"}
        </Button>
      </div>
    </div>
  );
}
