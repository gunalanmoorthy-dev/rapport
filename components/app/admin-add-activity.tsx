"use client";

/**
 * Admin control to log a compliance activity for a specific advisor. Posts to
 * /api/admin/activities (admin-only, firm-scoped) and refreshes the page.
 *
 * @module components/app/admin-add-activity
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["CPD", "Ethics", "Product", "Regulatory"];

export function AdminAddActivity({ advisorId }: { advisorId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("CPD");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advisorId, title, category, scheduledAt: scheduledAt || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to add activity.");
      toast.success("Activity logged for advisor");
      setTitle("");
      setScheduledAt("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add activity.");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "rounded-md border border-foreground/15 bg-foreground/[0.03] px-3 h-10 text-sm focus:outline-none focus:border-foreground/40";

  return (
    <div className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-5 mb-4">
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
        <CalendarPlus className="w-4 h-4 text-[#eca8d6]" />
        Log an activity for this advisor
      </p>
      <div className="grid md:grid-cols-[1fr_auto_auto_auto] gap-3">
        <input
          className={field}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Activity or seminar title"
        />
        <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          className={field}
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
        <Button
          className="rounded-full bg-foreground text-background hover:bg-foreground/90"
          disabled={busy}
          onClick={add}
        >
          {busy ? "Adding…" : "Add"}
        </Button>
      </div>
    </div>
  );
}
