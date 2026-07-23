"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  UserCheck,
  Receipt,
  Tag,
  ArrowRight,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { routes } from "@/config/site";
import { useAuth } from "@/contexts/auth-context";
import { useLogout } from "@/hooks/use-logout";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

interface AdminNavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  adminOnly: boolean;
}

const NAV_ITEMS: AdminNavItem[] = [
  { href: routes.adminDashboard, labelKey: "admin.overview", icon: LayoutDashboard, adminOnly: false },
  { href: routes.adminTickets, labelKey: "admin.tickets", icon: Ticket, adminOnly: false },
  { href: routes.adminArtists, labelKey: "admin.artistApproval", icon: UserCheck, adminOnly: false },
  { href: routes.adminAccounting, labelKey: "admin.accounting", icon: Receipt, adminOnly: true },
  { href: routes.adminPricing, labelKey: "admin.pricing", icon: Tag, adminOnly: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { logout, loading: loggingOut } = useLogout();
  const { t } = useTranslation();

  const isAdmin = user?.role === "admin";
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const isActive = (href: string) =>
    href === routes.adminDashboard
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col gap-2 border-l border-border bg-sidebar p-4 md:flex">
        <div className="mb-6 px-2">
          <Link href={routes.home} className="text-xl font-bold text-primary">
            {t("app.name")}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("admin.dashboardTitle")}
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map(({ href, labelKey, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors select-none",
                isActive(href)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" />
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        <Button asChild variant="outline" size="sm" className="justify-start">
          <Link href={routes.home}>
            <ArrowRight className="size-4" />
            {t("admin.backToApp")}
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start text-muted-foreground hover:text-destructive"
          onClick={logout}
          disabled={loggingOut}
        >
          <LogOut className="size-4" />
          {loggingOut ? t("common.loading") : t("common.logout")}
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md md:px-6">
          <Badge variant="muted">{t(`roles.${user?.role ?? "support"}`)}</Badge>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <LanguageToggle compact />
            {/* Desktop logout lives in the aside; keep it reachable on mobile */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive md:hidden"
              onClick={logout}
              disabled={loggingOut}
              aria-label={t("common.logout")}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2 md:hidden">
          {items.map(({ href, labelKey, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors select-none",
                isActive(href)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)] md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
