"use client";

import { SectionHeader } from "@/components/shared/section-header";
import { useTranslation } from "@/hooks/use-translation";

export default function AdminAccountingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-background p-6">
      <SectionHeader
        title={t("admin.accountingTitle")}
        subtitle={t("admin.accountingSubtitle")}
      />
      <p className="text-muted-foreground">
        GET /admin/accounting — PATCH /admin/accounting/:id/settle
      </p>
    </div>
  );
}
