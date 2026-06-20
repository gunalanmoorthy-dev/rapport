"use client";

/**
 * Partnership ecosystem UI: a need → ranked-partners match box, a "make
 * introduction" action, and the advisor's referral list with status advance.
 * All scores shown come from the code-computed values in the API responses; this
 * component never derives a score itself.
 *
 * @module components/app/partner-ecosystem
 */
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Score = {
  successScore: number | null;
  avgResponseDays: number | null;
  activeCount: number;
};

type Partner = {
  id: string;
  name: string;
  specialization: string | null;
  specializationTags: string[] | null;
  score: Score;
  overlap?: number;
};

type Referral = {
  id: string;
  status: "introduced" | "responded" | "progressing" | "closed";
  introducedAt: string | null;
  respondedAt: string | null;
  partnerName: string | null;
  clientName: string | null;
};

const NEXT_STATUS: Record<Referral["status"], Referral["status"] | null> = {
  introduced: "responded",
  responded: "progressing",
  progressing: "closed",
  closed: null,
};

const fmtScore = (s: Score) => (s.successScore === null ? "N/A" : `${s.successScore}%`);
const fmtDays = (s: Score) => (s.avgResponseDays === null ? "—" : `${s.avgResponseDays}d`);

export function PartnerEcosystem({ clients }: { clients: { id: string; name: string }[] }) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [need, setNeed] = useState("");
  const [tags, setTags] = useState<string[] | null>(null);
  const [ranked, setRanked] = useState<Partner[] | null>(null);
  const [clientId, setClientId] = useState("");
  const [matching, setMatching] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/partners");
      if (res.ok) {
        const json = await res.json();
        setPartners(json.partners ?? []);
        setReferrals(json.referrals ?? []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const match = async () => {
    if (!need.trim()) {
      toast.error("Describe the client need first.");
      return;
    }
    setMatching(true);
    try {
      const res = await fetch("/api/partners/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ need }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Match failed.");
      setTags(json.tags ?? []);
      setRanked(json.partners ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Match failed.");
    } finally {
      setMatching(false);
    }
  };

  const introduce = async (partner: Partner) => {
    if (!clientId) {
      toast.error("Pick a client to introduce first.");
      return;
    }
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, partnerId: partner.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Introduction failed.");
      toast.success(`Introduced to ${partner.name}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Introduction failed.");
    }
  };

  const advance = async (r: Referral) => {
    const next = NEXT_STATUS[r.status];
    if (!next) return;
    try {
      const res = await fetch(`/api/referrals/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  };

  const field =
    "rounded-md border border-foreground/15 bg-foreground/[0.03] px-3 h-10 text-sm focus:outline-none focus:border-foreground/40";

  return (
    <div className="space-y-12">
      {/* Match box */}
      <div className="border border-foreground/10 bg-foreground/[0.02] rounded-md p-6">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
          Match a client need
        </h2>
        <textarea
          value={need}
          onChange={(e) => setNeed(e.target.value)}
          rows={3}
          placeholder="e.g. My client is selling their business and needs estate and cross-border tax planning."
          className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus:border-foreground/40"
        />
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <select className={field} value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Introduce which client?</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button
            className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            disabled={matching}
            onClick={match}
          >
            <Search className="w-4 h-4 mr-1" />
            {matching ? "Matching…" : "Find partners"}
          </Button>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full border border-[#eca8d6]/20 bg-[#eca8d6]/10 text-[#eca8d6] text-xs font-mono">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {ranked && (
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {ranked.length === 0 ? (
              <p className="text-sm font-mono text-muted-foreground/60">No partners matched those tags.</p>
            ) : (
              ranked.map((p) => (
                <PartnerCard key={p.id} partner={p} onIntroduce={() => introduce(p)} highlight />
              ))
            )}
          </div>
        )}
      </div>

      {/* All partners */}
      <div>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5">
          All partners · {partners.length}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {partners.map((p) => (
            <PartnerCard key={p.id} partner={p} onIntroduce={() => introduce(p)} />
          ))}
        </div>
      </div>

      {/* Your referrals */}
      <div>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5">
          Your referrals · {referrals.length}
        </h2>
        {referrals.length === 0 ? (
          <p className="text-sm font-mono text-muted-foreground/60">No introductions yet.</p>
        ) : (
          <div className="border border-foreground/10 rounded-md divide-y divide-foreground/10">
            {referrals.map((r) => {
              const next = NEXT_STATUS[r.status];
              return (
                <div key={r.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {r.clientName} <span className="text-muted-foreground">→</span> {r.partnerName}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5 capitalize">{r.status}</p>
                  </div>
                  {next ? (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => advance(r)}>
                      Mark {next}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  ) : (
                    <span className="text-xs font-mono text-emerald-300">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PartnerCard({
  partner,
  onIntroduce,
  highlight = false,
}: {
  partner: Partner;
  onIntroduce: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border rounded-md p-5 ${
        highlight ? "border-[#eca8d6]/25 bg-[#eca8d6]/[0.04]" : "border-foreground/10 bg-foreground/[0.02]"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-base font-medium">{partner.name}</p>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">{partner.specialization}</p>
        </div>
        {typeof partner.overlap === "number" && partner.overlap > 0 && (
          <span className="text-xs font-mono text-[#eca8d6] shrink-0">
            {partner.overlap} tag{partner.overlap === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {partner.specializationTags && partner.specializationTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {partner.specializationTags.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full border border-foreground/10 bg-foreground/5 text-xs font-mono text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end justify-between gap-4">
        <div className="flex gap-6">
          <div>
            <p className="text-xl font-display tabular-nums">{fmtScore(partner.score)}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">success</p>
          </div>
          <div>
            <p className="text-xl font-display tabular-nums">{fmtDays(partner.score)}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">avg response</p>
          </div>
          <div>
            <p className="text-xl font-display tabular-nums">{partner.score.activeCount}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">active</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="rounded-full shrink-0" onClick={onIntroduce}>
          <UserPlus className="w-3.5 h-3.5 mr-1" />
          Introduce
        </Button>
      </div>
    </div>
  );
}
