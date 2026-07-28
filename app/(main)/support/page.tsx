"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { NewTicketDialog } from "@/components/support/new-ticket-dialog";
import {
  TICKET_STATUS_META,
  TicketThread,
} from "@/components/support/ticket-thread";
import { EmptyState } from "@/components/shared/empty-state";
import { FadeIn } from "@/components/shared/motion";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { formatDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import { supportService } from "@/services/support.service";
import type { SupportTicket } from "@/types";
import { cn } from "@/lib/utils";

/**
 * The listener's half of the ticket system (spec 2.11.1).
 *
 * Same master/detail shape as the support queue, so the two sides of a
 * conversation look like one product. On a narrow screen the list and the
 * thread swap places instead of sitting side by side, which is why `selectedId`
 * is allowed to be null even when tickets exist.
 */
export default function SupportPage() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    supportService
      .getMyTickets()
      .then((data) => {
        setTickets(data);
        setSelectedId((current) => current ?? data[0]?.id ?? null);
      })
      .catch(() => toast.error(t("common.error")))
      .finally(() => setLoading(false));
    // `t` is memoised on the locale, so this runs once per language rather
    // than on every render.
  }, [t]);

  const selected = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) ?? null,
    [tickets, selectedId],
  );

  /** Used for both a reply and a newly opened ticket: upsert, newest first. */
  const upsert = (ticket: SupportTicket) => {
    setTickets((prev) => {
      const known = prev.some((item) => item.id === ticket.id);
      return known
        ? prev.map((item) => (item.id === ticket.id ? ticket : item))
        : [ticket, ...prev];
    });
    setSelectedId(ticket.id);
  };

  const handleCreated = (ticket: SupportTicket) => {
    upsert(ticket);
    setDialogOpen(false);
    toast.success(t("support.ticketCreated"));
  };

  if (loading) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  return (
    <FadeIn className="space-y-6 py-4">
      <SectionHeader
        title={t("support.title")}
        subtitle={t("support.subtitle")}
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            {t("support.newTicket")}
          </Button>
        }
      />

      {tickets.length === 0 ? (
        <EmptyState
          title={t("support.emptyTitle")}
          description={t("support.emptyDescription")}
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              {t("support.openFirst")}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
          <ul className={cn("space-y-2", selected && "hidden lg:block")}>
            {tickets.map((ticket) => {
              const meta = TICKET_STATUS_META[ticket.status];
              return (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(ticket.id)}
                    className={cn(
                      "flex w-full flex-col gap-1 rounded-xl border p-3 text-start transition-colors",
                      ticket.id === selectedId
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card/40 hover:bg-card/70",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        {ticket.subject}
                      </span>
                      <Badge variant={meta.variant}>{t(meta.labelKey)}</Badge>
                    </div>
                    <span className="text-xs leading-5 text-muted-foreground">
                      {formatDate(ticket.createdAt)}
                    </span>
                    <span
                      dir="ltr"
                      className="text-[0.7rem] text-muted-foreground/70"
                    >
                      #{ticket.id.slice(-6)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected ? (
            <TicketThread
              ticket={selected}
              onReplied={upsert}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <p className="hidden items-center justify-center text-sm text-muted-foreground lg:flex">
              {t("support.selectHint")}
            </p>
          )}
        </div>
      )}

      {dialogOpen && (
        <NewTicketDialog
          onClose={() => setDialogOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </FadeIn>
  );
}
