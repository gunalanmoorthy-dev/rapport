import type { Metadata } from "next";
import { PartnerShell } from "@/components/app/partner-shell";
import {
  PartnershipEcosystem,
  personalReferralCode,
} from "@/components/app/partnership-ecosystem";
import { requirePartner } from "@/lib/auth";
import { getAdvisorById } from "@/lib/queries";
import { getPartners, getFirmReferrals } from "@/lib/partners";
import { getEffectiveAdminFirm } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Partnerships · Partner · Rapport",
  description: "Partner ecosystem — directory, introductions, and conversion.",
};

export const dynamic = "force-dynamic";

export default async function PartnerPage() {
  const partnerId = await requirePartner();
  const partner = await getAdvisorById(partnerId);
  const firm = await getEffectiveAdminFirm(partner?.firm ?? null);

  const [partners, referrals] = await Promise.all([
    getPartners(),
    getFirmReferrals(firm),
  ]);

  return (
    <PartnerShell>
      <PartnershipEcosystem
        firm={firm}
        name={partner?.name ?? "Partner"}
        referralCode={personalReferralCode(partner?.id ?? partnerId)}
        partners={partners}
        referrals={referrals}
        addPartnerEndpoint="/api/partner/partners"
      />
    </PartnerShell>
  );
}
