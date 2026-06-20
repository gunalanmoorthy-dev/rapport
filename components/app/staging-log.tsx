"use client";

/**
 * Read-only Staging log, grouped by client. Each section shows the client's
 * (editable) contact details, then every captured brief as two boxes: the full
 * transcript on the left and the AI's pinpoint summary on the right. There is no
 * approve/reject here — high-confidence briefs auto-commit at /echo.
 *
 * @module components/app/staging-log
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, FileText, Mail, Pencil, Phone, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/mock-data";

type StagedEchoView = {
  id: string;
  transcript: string;
  summary: string | null;
  intents: string[];
  move: { amountCents: number; direction: "in" | "out" } | null;
  confidence: number;
  when: string;
};

export type StagingGroup = {
  clientId: string | null;
  clientName: string;
  email: string | null;
  phone: string | null;
  echoes: StagedEchoView[];
};

export function StagingLog({ groups }: { groups: StagingGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className="border border-foreground/10 rounded-md p-16 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-foreground/[0.04] border border-foreground/10 flex items-center justify-center mb-5">
          <FileText className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-2xl font-display mb-2">No captured briefs yet</p>
        <p className="text-sm font-mono text-muted-foreground max-w-md">
          Record an Echo and anything that isn&apos;t auto-committed will appear here, grouped by client.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <ClientSection key={group.clientId ?? "unmatched"} group={group} />
      ))}
    </div>
  );
}

function ClientSection({ group }: { group: StagingGroup }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(group.email ?? "");
  const [phone, setPhone] = useState(group.phone ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!group.clientId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${group.clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed.");
      toast.success("Contact updated");
      setEditing(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const field =
    "rounded-md border border-foreground/15 bg-foreground/[0.03] px-3 h-9 text-sm focus:outline-none focus:border-foreground/40";

  return (
    <div className="border border-foreground/10 rounded-md overflow-hidden">
      {/* Client header + editable contact */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-foreground/10 bg-foreground/[0.02]">
        <div className="min-w-0">
          {group.clientId ? (
            <Link
              href={`/clients/${group.clientId}`}
              className="text-lg font-medium hover:text-[#eca8d6] transition-colors"
            >
              {group.clientName}
            </Link>
          ) : (
            <span className="text-lg font-medium">{group.clientName}</span>
          )}

          {editing ? (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <input className={field} value={email} placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
              <input className={field} value={phone} placeholder="Phone" onChange={(e) => setPhone(e.target.value)} />
              <Button size="sm" className="rounded-full" disabled={saving} onClick={save}>
                <Check className="w-4 h-4 mr-1" /> Save
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm font-mono text-muted-foreground">
              {group.email && (
                <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{group.email}</span>
              )}
              {group.phone && (
                <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{group.phone}</span>
              )}
              {!group.email && !group.phone && <span className="text-muted-foreground/40">No contact on file</span>}
            </div>
          )}
        </div>

        {group.clientId && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit contact
          </button>
        )}
      </div>

      {/* Briefs: full transcript | AI summary */}
      <div className="divide-y divide-foreground/10">
        {group.echoes.map((echo) => (
          <div key={echo.id} className="px-6 py-6">
            <div className="flex items-center justify-between mb-3 text-xs font-mono text-muted-foreground">
              <span>{echo.when}</span>
              <span>{Math.round(echo.confidence * 100)}% confidence</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Left: full transcript */}
              <div className="rounded-md border border-foreground/10 bg-foreground/[0.02] p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Full transcript
                </p>
                <p className="text-sm font-mono leading-relaxed text-foreground/85 whitespace-pre-wrap">
                  {echo.transcript || "—"}
                </p>
              </div>

              {/* Right: AI pinpoint summary */}
              <div className="rounded-md border border-[#eca8d6]/20 bg-[#eca8d6]/[0.04] p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#eca8d6]/80 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> AI summary
                </p>
                {echo.summary && <p className="text-sm text-foreground/90 leading-relaxed mb-3">{echo.summary}</p>}
                <ul className="space-y-1.5">
                  {echo.intents.map((intent, i) => (
                    <li key={i} className="text-sm text-foreground/80 flex gap-2">
                      <span className="text-[#eca8d6] mt-0.5">•</span>
                      {intent}
                    </li>
                  ))}
                  {echo.move && (
                    <li className="text-sm font-mono text-foreground/80 flex gap-2">
                      <span className="text-[#eca8d6] mt-0.5">•</span>
                      {echo.move.direction === "in" ? "Inflow" : "Outflow"} {formatCents(echo.move.amountCents)}
                    </li>
                  )}
                  {echo.intents.length === 0 && !echo.move && !echo.summary && (
                    <li className="text-sm text-muted-foreground/50">No summary extracted.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
