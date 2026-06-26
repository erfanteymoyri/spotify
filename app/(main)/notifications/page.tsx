"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { notificationService } from "@/services/notification.service";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationService
      .getNotifications()
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const markAllRead = async () => {
    await notificationService.markAllAsRead();
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

  return (
    <div className="space-y-6 py-4">
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
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "flex items-start justify-between gap-4 rounded-xl p-4",
                notif.isRead ? "bg-card/30" : "bg-primary/10",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{notif.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {notif.message}
                </p>
                {notif.link && (
                  <Link
                    href={notif.link}
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    {t("common.view")}
                  </Link>
                )}
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
                  onClick={() => remove(notif.id)}
                >
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
