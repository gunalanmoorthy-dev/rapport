"use client";

/**
 * Compliance log: list of continuing-education activities split into Upcoming
 * and Past, plus a form to add a new activity/seminar with a date + time.
 * Talks to /api/activities.
 *
 * @module components/app/compliance-log
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type ActivityView = {
  id: string;
  title: string;
  category: string | null;
  when: string | null;
  upcoming: boolean;
};

const CATEGORIES = ["CPD", "Ethics", "Product", "Regulatory"];

export function ComplianceLog({ items }: { items: ActivityView[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("CPD");
  const [scheduledAt, setScheduledAt] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const upcoming = items.filter((i) => i.upcoming);
  const past = items.filter((i) => !i.upcoming);

  const add = async () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, scheduledAt: scheduledAt || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Add failed.");
      toast.success("Activity added");
      setTitle("");
      setScheduledAt("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Add failed.");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Delete failed.");
      toast.success("Activity removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  const field =
    "rounded-md border border-foreground/15 bg-foreground/[0.03] px-3 h-10 text-sm focus:outline-none focus:border-foreground/40";

  return (
    <div className="space-y-12">
      {/* Add form */}
      <div className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-6">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <CalendarPlus className="w-4 h-4 text-[#eca8d6]" />
          Add an activity / seminar
        </h2>
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
            disabled={adding}
            onClick={add}
          >
            {adding ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>

      <ActivityGroup label="Upcoming" items={upcoming} onDelete={remove} busyId={busyId} accent />
      <ActivityGroup label="Past" items={past} onDelete={remove} busyId={busyId} />
    </div>
  );
}

function ActivityGroup({
  label,
  items,
  onDelete,
  busyId,
  accent = false,
}: {
  label: string;
  items: ActivityView[];
  onDelete: (id: string) => void;
  busyId: string | null;
  accent?: boolean;
}) {
  return (
    <div>
      <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5">
        {label} · {items.length}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm font-mono text-muted-foreground/50">Nothing here yet.</p>
      ) : (
        <div className="border border-foreground/10 rounded-md divide-y divide-foreground/10">
          {items.map((a) => (
            <div key={a.id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm">{a.title}</p>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  {a.when ?? "No date set"}
                </p>
              </div>
              {a.category && (
                <span
                  className={`px-2 py-0.5 rounded-full border text-xs font-mono ${
                    accent
                      ? "border-[#eca8d6]/20 bg-[#eca8d6]/10 text-[#eca8d6]"
                      : "border-foreground/10 bg-foreground/5 text-muted-foreground"
                  }`}
                >
                  {a.category}
                </span>
              )}
              <button
                type="button"
                disabled={busyId === a.id}
                onClick={() => onDelete(a.id)}
                title="Remove"
                className="w-8 h-8 rounded-full flex items-center justify-center border border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400/20 transition-colors disabled:opacity-50 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
