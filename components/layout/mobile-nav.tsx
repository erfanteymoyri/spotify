"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Library,
  ListMusic,
  User,
  Music,
  LayoutDashboard,
} from "lucide-react";
import { routes } from "@/config/site";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useTranslation();

  const roleItem =
    user?.role === "artist"
      ? {
          href: routes.artistDashboard,
          icon: Music,
          label: t("nav.artistDashboard"),
        }
      : user?.role === "admin" || user?.role === "support"
        ? {
            href: routes.adminDashboard,
            icon: LayoutDashboard,
            label: t("nav.adminDashboard"),
          }
        : null;

  const items = [
    { href: routes.home, icon: Home, label: t("nav.home") },
    { href: routes.library, icon: Library, label: t("nav.libraryShort") },
    { href: routes.playlists, icon: ListMusic, label: t("nav.playlistShort") },
    { href: routes.profile, icon: User, label: t("nav.profile") },
    ...(roleItem ? [roleItem] : []),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-[72px] z-20 flex border-t border-border bg-background/95 backdrop-blur md:hidden">
      {items.map(({ href, icon: Icon, label }) => {
        const isActive =
          href === routes.home ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
