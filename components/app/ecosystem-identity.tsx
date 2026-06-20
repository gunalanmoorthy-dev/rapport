"use client";

/**
 * Identity strip under the Partnership ecosystem title: the logged-in admin's
 * name, their coin balance, and their secret personal referral code (click to
 * copy). Coins/referral are a demo gamification layer — not persisted.
 *
 * @module components/app/ecosystem-identity
 */
import { useState } from "react";
import { Coins, KeyRound, Copy, Check } from "lucide-react";

export function EcosystemIdentity({
  name,
  coins,
  referralCode,
}: {
  name: string;
  coins: number;
  referralCode: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mt-5">
      <span className="text-sm font-medium">{name}</span>

      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 px-2.5 h-7 text-xs font-mono tabular-nums">
        <Coins className="w-3.5 h-3.5" />
        {coins} coins
      </span>

      <button
        type="button"
        onClick={copy}
        title="Your secret personal referral code — click to copy"
        className="inline-flex items-center gap-1.5 rounded-full border border-[#eca8d6]/30 bg-[#eca8d6]/10 text-[#eca8d6] px-2.5 h-7 text-xs font-mono hover:bg-[#eca8d6]/20 transition-colors"
      >
        <KeyRound className="w-3.5 h-3.5" />
        {referralCode}
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
