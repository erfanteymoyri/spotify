"use client";

import { SectionHeader } from "@/components/shared/section-header";
import { useTranslation } from "@/hooks/use-translation";

export default function AdminArtistsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background p-6">
      <SectionHeader
        title={t("admin.artistsTitle")}
        subtitle={t("admin.artistsSubtitle")}
      />
      <p className="text-muted-foreground">
        GET /admin/artist-requests — PATCH approve/reject
      </p>
    </div>
  );
}
