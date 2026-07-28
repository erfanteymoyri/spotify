"use client";

import { useState } from "react";
import { Button } from "@/ui/button";
import { Dialog } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";
import { parseApiError } from "@/lib/parse-api-error";
import { supportService } from "@/services/support.service";
import type { SupportTicket } from "@/types";

interface NewTicketDialogProps {
  onClose: () => void;
  /** Receives the created ticket, first message already in its thread. */
  onCreated: (ticket: SupportTicket) => void;
}

/**
 * Mounted only while open, so the draft — and any error from a failed attempt
 * — is discarded on close rather than resurrected the next time it is opened.
 */
export function NewTicketDialog({ onClose, onCreated }: NewTicketDialogProps) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = subject.trim() && message.trim() && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      onCreated(
        await supportService.openTicket(subject.trim(), message.trim()),
      );
    } catch (err) {
      setError(parseApiError(err, t("support.createFailed")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("support.newTicket")}
      closeLabel={t("common.close")}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {submitting ? t("support.submitting") : t("support.submit")}
          </Button>
        </div>
      }
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="ticket-subject">
          {t("support.subject")}
        </label>
        <Input
          id="ticket-subject"
          value={subject}
          maxLength={200}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("support.subjectPlaceholder")}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="ticket-message">
          {t("support.message")}
        </label>
        <Textarea
          id="ticket-message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("support.messagePlaceholder")}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </Dialog>
  );
}
