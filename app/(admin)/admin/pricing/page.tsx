"use client";

import { SectionHeader } from "@/components/shared/section-header";
import { useTranslation } from "@/hooks/use-translation";

export default function AdminPricingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background p-6">
      <SectionHeader
        title={t("admin.pricingTitle")}
        subtitle={t("admin.pricingSubtitle")}
      />
      <p className="text-muted-foreground">
        GET /admin/pricing — PATCH /admin/pricing — body: {"{ silver, gold }"}
      </p>
    </div>
  );
}
