"use client";

/**
 * Interactive Clients table: add, edit, delete, and approve (pending → active)
 * clients. New records start `pending` and show a green ✓ (approve) and red ✗
 * (delete); active records show edit + delete. Talks to /api/clients.
 *
 * @module components/app/clients-manager
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Clock, Mail, Pencil, Phone, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SentimentTag } from "@/components/app/sentiment-tag";
import { formatCents } from "@/lib/mock-data";
import { householdLabel } from "@/lib/display";
import type { Client, Sentiment } from "@/db/schema";

type FormState = {
  name: string;
  email: string;
  phone: string;
  balanceDollars: string;
  sentiment: Sentiment;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  balanceDollars: "",
  sentiment: "green",
};

export function ClientsManager({
  initialClients,
  lastContactById,
}: {
  initialClients: Client[];
  lastContactById: Record<string, string>;
}) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Client | null>(null); // null = closed
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const totalAum = clients
    .filter((c) => c.status !== "pending")
    .reduce((sum, c) => sum + (c.totalBalanceCents ?? 0), 0);

  const refresh = () => router.refresh();

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setAdding(true);
  };

  const openEdit = (c: Client) => {
    setForm({
      name: c.name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      balanceDollars: String((c.totalBalanceCents ?? 0) / 100),
      sentiment: c.sentiment ?? "green",
    });
    setEditing(c);
  };

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    const totalBalanceCents = Math.round((parseFloat(form.balanceDollars) || 0) * 100);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      sentiment: form.sentiment,
      totalBalanceCents,
    };

    try {
      if (editing) {
        const res = await fetch(`/api/clients/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Update failed.");
        setClients((prev) => prev.map((c) => (c.id === editing.id ? json.client : c)));
        toast.success("Client updated");
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Create failed.");
        setClients((prev) => [json.client, ...prev]);
        toast.success("Client added — pending approval");
      }
      closeForm();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const approve = async (c: Client) => {
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/clients/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Approve failed.");
      setClients((prev) => prev.map((x) => (x.id === c.id ? json.client : x)));
      toast.success(`${c.name} approved`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approve failed.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (c: Client) => {
    if (!confirm(`Delete ${c.name}? This removes their echoes and moves too.`)) return;
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/clients/${c.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Delete failed.");
      setClients((prev) => prev.filter((x) => x.id !== c.id));
      toast.success(`${c.name} deleted`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  const counts = clients.reduce(
    (acc, c) => {
      if (c.sentiment) acc[c.sentiment] += 1;
      return acc;
    },
    { green: 0, amber: 0, red: 0 } as Record<Sentiment, number>
  );
  const pendingCount = clients.filter((c) => c.status === "pending").length;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
        <div>
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Clients
          </span>
          <h1 className="text-5xl lg:text-6xl font-display tracking-tight">
            Your book of business
          </h1>
        </div>

        <div className="flex items-center gap-8">
          <div>
            <p className="text-3xl font-display">{formatCents(totalAum)}</p>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">
              Total AUM
            </p>
          </div>
          <div className="flex items-center gap-5 text-sm font-mono">
            <span className="flex items-center gap-2" title="Engaged">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-muted-foreground">Engaged</span>
              <span className="tabular-nums">{counts.green}</span>
            </span>
            <span className="flex items-center gap-2" title="Cooling">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-muted-foreground">Cooling</span>
              <span className="tabular-nums">{counts.amber}</span>
            </span>
            <span className="flex items-center gap-2" title="Going cold">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-muted-foreground">Going cold</span>
              <span className="tabular-nums">{counts.red}</span>
            </span>
          </div>
          <Button
            onClick={openAdd}
            className="rounded-full bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add client
          </Button>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="mb-4 inline-flex items-center gap-2 text-sm font-mono text-amber-300">
          <Clock className="w-4 h-4" />
          {pendingCount} client{pendingCount === 1 ? "" : "s"} pending your approval
        </div>
      )}

      {/* Table */}
      <div className="border border-foreground/10 rounded-md overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-foreground/10 bg-foreground/[0.02] text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <div className="col-span-4">Client</div>
          <div className="col-span-3">Contact</div>
          <div className="col-span-2 text-right">Balance</div>
          <div className="col-span-1">Sentiment</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-foreground/10">
          {clients.map((client) => {
            const pending = client.status === "pending";
            const busy = busyId === client.id;
            return (
              <div
                key={client.id}
                className={`grid grid-cols-2 md:grid-cols-12 gap-4 px-6 py-5 items-center transition-colors border-l-2 ${
                  pending
                    ? "border-l-amber-400/60 bg-amber-400/[0.04]"
                    : client.sentiment === "red"
                    ? "border-l-red-400/60 bg-red-400/[0.035]"
                    : client.sentiment === "amber"
                    ? "border-l-amber-400/50 bg-amber-400/[0.025]"
                    : "border-l-transparent"
                }`}
              >
                <div className="col-span-2 md:col-span-4 min-w-0">
                  <p className="text-base font-medium flex items-center gap-2">
                    <Link
                      href={`/clients/${client.id}`}
                      className="hover:text-[#eca8d6] transition-colors inline-flex items-center gap-1.5 group"
                    >
                      {client.name}
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </Link>
                    {pending && (
                      <span className="px-2 py-0.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-[10px] font-mono uppercase tracking-wider">
                        Pending
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                    {householdLabel(client.name)}
                  </p>
                </div>

                <div className="md:col-span-3 min-w-0 text-sm font-mono text-muted-foreground space-y-1">
                  {client.email && (
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </p>
                  )}
                  {client.phone && (
                    <p className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3 h-3 shrink-0" />
                      {client.phone}
                    </p>
                  )}
                  {!client.email && !client.phone && <span className="text-muted-foreground/40">—</span>}
                </div>

                <div className="md:col-span-2 md:text-right">
                  <p className="text-base font-display tabular-nums">
                    {formatCents(client.totalBalanceCents ?? 0)}
                  </p>
                  {lastContactById[client.id] && (
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      {lastContactById[client.id]}
                    </p>
                  )}
                </div>

                <div className="md:col-span-1">
                  <SentimentTag sentiment={client.sentiment ?? "green"} />
                </div>

                <div className="col-span-2 md:col-span-2 flex items-center md:justify-end gap-2">
                  {pending && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => approve(client)}
                      title="Approve"
                      className="w-8 h-8 rounded-full flex items-center justify-center border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openEdit(client)}
                    title="Edit"
                    className="w-8 h-8 rounded-full flex items-center justify-center border border-foreground/15 text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors disabled:opacity-50"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(client)}
                    title="Delete"
                    className="w-8 h-8 rounded-full flex items-center justify-center border border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400/20 transition-colors disabled:opacity-50"
                  >
                    {pending ? <X className="w-4 h-4" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}

          {clients.length === 0 && (
            <div className="px-6 py-16 text-center text-sm font-mono text-muted-foreground">
              No clients yet. Use “Add client” to create one.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      {(adding || editing) && (
        <ClientForm
          title={editing ? "Edit client" : "Add client"}
          form={form}
          setForm={setForm}
          onCancel={closeForm}
          onSubmit={submitForm}
          submitLabel={editing ? "Save changes" : "Add client"}
        />
      )}
    </>
  );
}

function ClientForm({
  title,
  form,
  setForm,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  title: string;
  form: FormState;
  setForm: (f: FormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  const field = "w-full rounded-md border border-foreground/15 bg-foreground/[0.03] px-3 h-10 text-sm focus:outline-none focus:border-foreground/40";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-lg border border-foreground/15 bg-background p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-display mb-5">{title}</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Name</label>
            <input
              className={field}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                className={field}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@firm.com"
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Phone</label>
              <input
                className={field}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Balance (USD)</label>
              <input
                className={field}
                type="number"
                value={form.balanceDollars}
                onChange={(e) => setForm({ ...form, balanceDollars: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Sentiment</label>
              <select
                className={field}
                value={form.sentiment}
                onChange={(e) => setForm({ ...form, sentiment: e.target.value as Sentiment })}
              >
                <option value="green">Green — engaged</option>
                <option value="amber">Amber — cooling</option>
                <option value="red">Red — going cold</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" className="rounded-full" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            onClick={onSubmit}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
