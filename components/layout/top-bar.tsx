"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Avatar } from "@/ui/avatar";
import { Button } from "@/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { routes } from "@/config/site";
import { useLogout } from "@/hooks/use-logout";
import { useTranslation } from "@/hooks/use-translation";

export function TopBar() {
  const { user } = useAuth();
  const { logout, loading: loggingOut } = useLogout();
  const { t } = useTranslation();

  if (!user) return null;

  const tierKey = `subscription.${user.subscription}` as
    | "subscription.free"
    | "subscription.silver"
    | "subscription.gold";

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-background/80 px-6 py-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Brand mark for mobile where the sidebar is hidden */}
        <Image
          src="/logo.png"
          alt=""
          width={36}
          height={36}
          className="size-9 md:hidden"
        />
        <div>
          <p className="text-sm text-muted-foreground">{t("common.welcome")}</p>
          <h1 className="text-2xl font-bold">{user.displayName}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={routes.profile}
          className="flex items-center gap-3 rounded-full bg-card/60 py-1.5 pr-4 pl-1.5 transition-colors hover:bg-card"
        >
          <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{user.displayName}</p>
            <p className="text-xs text-muted-foreground">{t(tierKey)}</p>
          </div>
        </Link>
        {/* The sidebar owns logout on desktop; keep it reachable on mobile */}
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
  );
}
