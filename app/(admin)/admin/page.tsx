"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/shared/section-header";
import { routes } from "@/config/site";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/ui/button";

/**
 * Admin/support dashboard — placeholder.
 * Sections: tickets, artist verification, accounting, pricing (admin only).
 */
export default function AdminDashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-background p-6">
      <SectionHeader
        title={t("admin.dashboardTitle")}
        subtitle={t("admin.dashboardSubtitle")}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard
          title={t("admin.tickets")}
          description="GET /admin/tickets — GET /admin/artist-requests"
          href={routes.adminTickets}
        />
        <AdminCard
          title={t("admin.artistApproval")}
          description="PATCH /admin/artist-requests/:id"
          href={routes.adminArtists}
        />
        <AdminCard
          title={t("admin.accounting")}
          description="GET /admin/accounting — PATCH settle"
          href={routes.adminAccounting}
        />
        <AdminCard
          title={t("admin.pricing")}
          description={t("admin.pricingAdminOnly")}
          href={routes.adminPricing}
        />
      </div>

      <Button asChild variant="outline" className="mt-8">
        <Link href={routes.home}>{t("admin.backToApp")}</Link>
      </Button>
    </div>
  );
}

function AdminCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-card/40 p-6 transition-colors hover:bg-card/70"
    >
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
