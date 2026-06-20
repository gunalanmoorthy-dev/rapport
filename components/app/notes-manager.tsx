"use client";

/**
 * Per-client free-text notes. Each client gets a textarea the advisor can edit
 * and save independently. Persists via PATCH /api/clients/[id] { note }.
 *
 * @module components/app/notes-manager
 */
import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ClientNote = { id: string; name: string | null; note: string | null };

export function NotesManager({ clients }: { clients: ClientNote[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {clients.map((c) => (
        <NoteCard key={c.id} client={c} />
      ))}
      {clients.length === 0 && (
        <p className="text-sm font-mono text-muted-foreground">No clients yet.</p>
      )}
    </div>
  );
}

function NoteCard({ client }: { client: ClientNote }) {
  const [value, setValue] = useState(client.note ?? "");
  const [saved, setSaved] = useState(client.note ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = value !== saved;

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed.");
      setSaved(value);
      toast.success(`Note saved for ${client.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <Link href={`/clients/${client.id}`} className="font-medium hover:text-[#eca8d6] transition-colors">
          {client.name}
        </Link>
        {dirty && <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">Unsaved</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a note…"
        rows={5}
        className="w-full flex-1 rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus:border-foreground/40"
      />
      <div className="flex justify-end mt-3">
        <Button
          size="sm"
          className="rounded-full bg-foreground text-background hover:bg-foreground/90"
          disabled={!dirty || saving}
          onClick={save}
        >
          <Check className="w-4 h-4 mr-1" />
          {saving ? "Saving…" : "Save note"}
        </Button>
      </div>
    </div>
  );
}
