"use client";

import { SectionHeader } from "@/components/shared/section-header";
import { useTranslation } from "@/hooks/use-translation";

/** Artist works management panel — phase 1 placeholder */
export default function ArtistDashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        title={t("artist.manageWorks")}
        subtitle={t("artist.manageWorksSubtitle")}
      />
      <p className="text-muted-foreground">
        POST /artist/tracks (multipart) — GET /artist/analytics
      </p>
    </div>
  );
}
