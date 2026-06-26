"use client";

import Link from "next/link";
import { Avatar } from "@/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { routes } from "@/config/site";
import { useTranslation } from "@/hooks/use-translation";

export function TopBar() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  const tierKey = `subscription.${user.subscription}` as
    | "subscription.free"
    | "subscription.silver"
    | "subscription.gold";

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-background/80 px-6 py-4 backdrop-blur-md">
      <div>
        <p className="text-sm text-muted-foreground">{t("common.welcome")}</p>
        <h1 className="text-2xl font-bold">{user.displayName}</h1>
      </div>
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
    </header>
  );
}
