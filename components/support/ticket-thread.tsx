"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Send } from "lucide-react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Textarea } from "@/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";
import { formatDate } from "@/lib/format";
import { parseApiError } from "@/lib/parse-api-error";
import { toast } from "@/lib/toast";
import { supportService } from "@/services/support.service";
import type { SupportTicket, TicketStatus } from "@/types";
import { cn } from "@/lib/utils";

export const TICKET_STATUS_META: Record<
  TicketStatus,
  { labelKey: string; variant: "default" | "muted" | "warning" }
> = {
  open: { labelKey: "support.statusOpen", variant: "warning" },
  answered: { labelKey: "support.statusAnswered", variant: "default" },
  closed: { labelKey: "support.statusClosed", variant: "muted" },
};

interface TicketThreadProps {
  ticket: SupportTicket;
  /** The server's updated ticket after a reply — status moves with the thread. */
  onReplied: (ticket: SupportTicket) => void;
  onBack: () => void;
}

/**
 * One ticket rendered as a conversation.
 *
 * The listener's side of the same view the support queue shows, with the
 * alignment mirrored: here *my* messages sit on the outside, so the thread
 * reads like any other chat rather than like an agent's console.
 */
export function TicketThread({ ticket, onReplied, onBack }: TicketThreadProps) {
  const { t } = useTranslation();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const closed = ticket.status === "closed";

  // Land on the newest message, both on open and after a reply — an agent's
  // answer at the bottom of a long thread would otherwise go unnoticed.
  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [ticket.id, ticket.messages.length]);

  const send = async () => {
    const content = reply.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      // Replying to an answered ticket reopens it, which is why the server's
      // ticket replaces ours rather than us appending the message locally.
      onReplied(await supportService.reply(ticket.id, content));
      setReply("");
    } catch (err) {
      toast.error(parseApiError(err, t("support.replyFailed")));
    } finally {
      setSending(false);
    }
  };

  const meta = TICKET_STATUS_META[ticket.status];

  return (
    <div className="flex min-h-[26rem] flex-col rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onBack}
          aria-label={t("support.backToList")}
        >
          <ArrowRight className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{ticket.subject}</p>
          <p className="text-xs leading-5 text-muted-foreground">
            <span dir="ltr">#{ticket.id.slice(-6)}</span>
            {" · "}
            {formatDate(ticket.createdAt)}
          </p>
        </div>
        <Badge variant={meta.variant}>{t(meta.labelKey)}</Badge>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {ticket.messages.map((message) => {
          const fromMe = message.senderRole === "user";
          return (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1",
                fromMe ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap",
                  fromMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {message.content}
              </div>
              <span className="text-[0.7rem] text-muted-foreground">
                {fromMe ? t("support.fromMe") : t("support.fromSupport")}
                {" · "}
                {formatDate(message.createdAt)}
              </span>
            </div>
          );
        })}
      </div>

      {closed ? (
        <p className="border-t border-border p-4 text-sm text-muted-foreground">
          {t("support.closedNotice")}
        </p>
      ) : (
        <div className="space-y-2 border-t border-border p-4">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={t("support.replyPlaceholder")}
            className="min-h-16"
          />
          <div className="flex justify-end">
            <Button onClick={send} disabled={sending || !reply.trim()}>
              <Send className="size-4" />
              {sending ? t("support.submitting") : t("common.send")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
