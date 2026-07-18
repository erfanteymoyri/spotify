"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Library,
  ListMusic,
  Bell,
  Settings,
  User,
  LayoutDashboard,
  Music,
} from "lucide-react";
import { routes } from "@/config/site";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useTranslation();

  const mainNav = [
    { href: routes.home, label: t("nav.home"), icon: Home },
    { href: routes.library, label: t("nav.library"), icon: Library },
    { href: routes.playlists, label: t("nav.playlists"), icon: ListMusic },
    { href: routes.notifications, label: t("nav.notifications"), icon: Bell },
    { href: routes.profile, label: t("nav.profile"), icon: User },
    { href: routes.settings, label: t("nav.settings"), icon: Settings },
  ];

  const artistNav = [
    {
      href: routes.artistDashboard,
      label: t("nav.artistDashboard"),
      icon: Music,
    },
  ];

  const adminNav = [
    {
      href: routes.adminDashboard,
      label: t("nav.adminDashboard"),
      icon: LayoutDashboard,
    },
  ];

  const extraNav =
    user?.role === "artist" || user?.role === "admin" ? artistNav : [];
  const adminLinks =
    user?.role === "admin" || user?.role === "support" ? adminNav : [];

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-2 bg-sidebar p-4 md:flex">
      <Link href={routes.home} className="mb-6 px-2">
        <span className="text-xl font-bold text-primary">{t("app.name")}</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {[...mainNav, ...extraNav, ...adminLinks].map(
          ({ href, label, icon: Icon }) => {
            const isActive =
              href === routes.home
                ? pathname === href
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-2.5 before:start-0 before:w-1 before:rounded-full before:bg-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <Icon
                  className={cn("size-5 shrink-0", isActive && "text-primary")}
                />
                {label}
              </Link>
            );
          },
        )}
      </nav>
    </aside>
  );
}
