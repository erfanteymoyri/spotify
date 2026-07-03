"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/site";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";

const ADMIN_ROLES: UserRole[] = ["admin", "support"];

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasAdminAccess = Boolean(
    user && ADMIN_ROLES.includes(user.role),
  );

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.replace(routes.login);
      return;
    }

    if (user && !ADMIN_ROLES.includes(user.role)) {
      router.replace(routes.home);
    }
  }, [hydrated, isAuthenticated, user, router]);

  if (!hydrated || !isAuthenticated || !hasAdminAccess) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  return children;
}
