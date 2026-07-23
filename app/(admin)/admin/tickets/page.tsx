"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Send } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Textarea } from "@/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";
import { formatDate } from "@/lib/format";
import { adminService } from "@/services/admin.service";
import type { SupportTicket, TicketStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  TicketStatus,
  { labelKey: string; variant: "default" | "muted" | "warning" }
> = {
  open: { labelKey: "admin.statusOpen", variant: "warning" },
  answered: { labelKey: "admin.statusAnswered", variant: "default" },
  closed: { labelKey: "admin.statusClosed", variant: "muted" },
};

export default function AdminTicketsPage() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    adminService
      .getTickets()
      .then((data) => {
        setTickets(data);
        setSelectedId((current) => current ?? data[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) ?? null,
    [tickets, selectedId],
  );

  const handleReplied = (updated: SupportTicket) => {
    setTickets((prev) =>
      prev.map((ticket) => (ticket.id === updated.id ? updated : ticket)),
    );
  };

  if (loading) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t("admin.ticketsTitle")}
        subtitle={t("admin.ticketsSubtitle")}
      />

      {tickets.length === 0 ? (
        <EmptyState
          title={t("admin.ticketsEmptyTitle")}
          description={t("admin.ticketsEmptyDescription")}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
          <ul
            className={cn(
              "space-y-2",
              selected && "hidden lg:block",
            )}
          >
            {tickets.map((ticket) => {
              const meta = STATUS_META[ticket.status];
              return (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(ticket.id)}
                    className={cn(
                      "flex w-full flex-col gap-1 rounded-xl border p-3 text-right transition-colors",
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
                      {ticket.userName} · {formatDate(ticket.createdAt)}
                    </span>
                    {/* Ticket id column required by spec 2.11.1 */}
                    <span dir="ltr" className="text-[0.7rem] text-muted-foreground/70">
                      #{ticket.id.slice(-6)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected && (
            <TicketConversation
              ticket={selected}
              onReplied={handleReplied}
              onBack={() => setSelectedId(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TicketConversation({
  ticket,
  onReplied,
  onBack,
}: {
  ticket: SupportTicket;
  onReplied: (ticket: SupportTicket) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const closed = ticket.status === "closed";

  const send = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    const updated = await adminService.replyToTicket(ticket.id, reply);
    if (updated) onReplied(updated);
    setReply("");
    setSending(false);
  };

  return (
    <div className="flex min-h-[24rem] flex-col rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onBack}
          aria-label={t("admin.backToTickets")}
        >
          <ArrowRight className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{ticket.subject}</p>
          <p className="text-xs leading-5 text-muted-foreground">
            {ticket.userName} ·{" "}
            <span dir="ltr">#{ticket.id.slice(-6)}</span>
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {ticket.messages.map((message) => {
          const fromSupport = message.senderRole === "support";
          return (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1",
                fromSupport ? "items-start" : "items-end",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                  fromSupport
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {message.content}
              </div>
              <span className="text-[0.7rem] text-muted-foreground">
                {fromSupport
                  ? t("admin.messageFromSupport")
                  : t("admin.messageFromUser")}
                {" · "}
                {formatDate(message.createdAt)}
              </span>
            </div>
          );
        })}
      </div>

      {!closed && (
        <div className="space-y-2 border-t border-border p-4">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={t("admin.replyPlaceholder")}
            className="min-h-16"
          />
          <div className="flex justify-end">
            <Button onClick={send} disabled={sending || !reply.trim()}>
              <Send className="size-4" />
              {t("common.send")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
