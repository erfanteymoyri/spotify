"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import {
  Home,
  Library,
  ListMusic,
  Bell,
  Settings,
  User,
  LayoutDashboard,
  LogOut,
  Music,
} from "lucide-react";
import { routes } from "@/config/site";
import { useAuth } from "@/contexts/auth-context";
import { useLogout } from "@/hooks/use-logout";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { logout, loading: loggingOut } = useLogout();
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
      <Link
        href={routes.home}
        className="mb-6 flex items-center gap-2.5 px-2 transition-opacity hover:opacity-80"
      >
        <Image src="/logo.png" alt="" width={32} height={32} className="size-8" />
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
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                {/* Shared-layout indicator glides between the active items */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-y-2.5 start-0 w-1 rounded-full bg-primary"
                  />
                )}
                <Icon
                  className={cn("size-5 shrink-0", isActive && "text-primary")}
                />
                {label}
              </Link>
            );
          },
        )}
      </nav>

      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        <LogOut className="size-5 shrink-0" />
        {loggingOut ? t("common.loading") : t("common.logout")}
      </button>
    </aside>
  );
}
