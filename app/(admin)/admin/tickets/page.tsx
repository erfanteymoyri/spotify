"use client";

import { SectionHeader } from "@/components/shared/section-header";
import { useTranslation } from "@/hooks/use-translation";

export default function AdminTicketsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-background p-6">
      <SectionHeader
        title={t("admin.ticketsTitle")}
        subtitle={t("admin.ticketsSubtitle")}
      />
      <p className="text-muted-foreground">
        GET /admin/tickets — POST /admin/tickets/:id/messages
      </p>
    </div>
  );
}
