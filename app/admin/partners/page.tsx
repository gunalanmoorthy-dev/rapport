import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import {
  PartnershipEcosystem,
  personalReferralCode,
} from "@/components/app/partnership-ecosystem";
import { requireAdmin } from "@/lib/auth";
import { getAdvisorById } from "@/lib/queries";
import { getPartners, getFirmReferrals } from "@/lib/partners";
import { getEffectiveAdminFirm } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Partnerships · Admin · Rapport",
  description: "Firm partner ecosystem — directory, introductions, and conversion.",
};

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const adminId = await requireAdmin();
  const admin = await getAdvisorById(adminId);
  const firm = await getEffectiveAdminFirm(admin?.firm ?? null);

  const [partners, referrals] = await Promise.all([
    getPartners(),
    getFirmReferrals(firm),
  ]);

  return (
    <AdminShell>
      <PartnershipEcosystem
        firm={firm}
        name={admin?.name ?? "Admin"}
        referralCode={personalReferralCode(admin?.id ?? adminId)}
        partners={partners}
        referrals={referrals}
        addPartnerEndpoint="/api/admin/partners"
        topSlot={
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Firm overview
          </Link>
        }
      />
    </AdminShell>
  );
}
