"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ticket, UserCheck, Receipt, Tag, type LucideIcon } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { routes } from "@/config/site";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/hooks/use-translation";
import { formatNumber } from "@/lib/format";
import { adminService } from "@/services/admin.service";
import type { AdminStats } from "@/types";

interface SectionLink {
  href: string;
  titleKey: string;
  subtitleKey: string;
  icon: LucideIcon;
  adminOnly: boolean;
}

const SECTIONS: SectionLink[] = [
  { href: routes.adminTickets, titleKey: "admin.ticketsTitle", subtitleKey: "admin.ticketsSubtitle", icon: Ticket, adminOnly: false },
  { href: routes.adminArtists, titleKey: "admin.artistsTitle", subtitleKey: "admin.artistsSubtitle", icon: UserCheck, adminOnly: false },
  { href: routes.adminAccounting, titleKey: "admin.accountingTitle", subtitleKey: "admin.accountingSubtitle", icon: Receipt, adminOnly: true },
  { href: routes.adminPricing, titleKey: "admin.pricingTitle", subtitleKey: "admin.pricingSubtitle", icon: Tag, adminOnly: true },
];

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    adminService.getStats().then(setStats);
  }, [isAdmin]);

  const sections = SECTIONS.filter((s) => !s.adminOnly || isAdmin);

  return (
    <div className="space-y-8">
      <SectionHeader
        title={t("admin.dashboardTitle")}
        subtitle={t("admin.dashboardSubtitle")}
      />

      {isAdmin && stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatTile
            label={t("admin.totalUsers")}
            value={formatNumber(stats.totalUsers)}
          />
          <StatTile
            label={t("admin.totalArtists")}
            value={formatNumber(stats.totalArtists)}
          />
          <StatTile
            label={t("admin.monthlyRevenue")}
            value={`${formatNumber(stats.monthlyRevenue)} ${t("subscription.toman")}`}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, titleKey, subtitleKey, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-4 rounded-xl border border-border bg-card/40 p-6 transition-colors hover:bg-card/70"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold">{t(titleKey)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(subtitleKey)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card/40 p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
