"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { FadeIn, Stagger, StaggerItem } from "@/components/shared/motion";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { formatDate } from "@/lib/format";
import { notificationService } from "@/services/notification.service";
import { useAuthStore } from "@/stores/auth-store";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { t, locale } = useTranslation();
  const role = useAuthStore((s) => s.user?.role);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role) return;
    notificationService
      .getNotifications(role)
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, [role]);

  const markRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const markAllRead = async () => {
    if (!role) return;
    await notificationService.markAllAsRead(role);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const remove = async (id: string) => {
    await notificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  const dateLocale = locale === "fa" ? "fa-IR" : "en-US";

  return (
    <FadeIn className="space-y-6 py-4">
      <SectionHeader
        title={t("notifications.title")}
        action={
          notifications.some((n) => !n.isRead) && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              {t("notifications.markAllRead")}
            </Button>
          )
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          title={t("notifications.emptyTitle")}
          description={t("notifications.emptyDescription")}
        />
      ) : (
        <Stagger className="space-y-3">
          {notifications.map((notif) => (
            <StaggerItem key={notif.id}>
              <div
                className={cn(
                  "flex items-start justify-between gap-4 rounded-xl border p-4 transition-colors",
                  notif.isRead
                    ? "border-transparent bg-card/30"
                    : "border-primary/20 bg-primary/10",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {/* Unread indicator dot (spec 2.6) */}
                    {!notif.isRead && (
                      <span className="size-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <p className="font-medium">{notif.title}</p>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {notif.message}
                  </p>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(notif.createdAt, dateLocale)}
                    </span>
                    {notif.link && (
                      <Link
                        href={notif.link}
                        className="text-sm text-primary hover:underline"
                      >
                        {t("common.view")}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!notif.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markRead(notif.id)}
                    >
                      {t("notifications.markRead")}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => remove(notif.id)}
                  >
                    {t("common.delete")}
                  </Button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </FadeIn>
  );
}
