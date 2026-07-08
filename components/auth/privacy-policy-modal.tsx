"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ open, onClose }: PrivacyPolicyModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border bg-background p-0 shadow-xl backdrop:bg-black/60 open:flex open:flex-col"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold">{t("auth.privacyPolicyTitle")}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t("common.cancel")}
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-4 text-sm leading-7 text-muted-foreground">
        <p>{t("auth.privacyPolicyBody1")}</p>
        <p>{t("auth.privacyPolicyBody2")}</p>
        <p>{t("auth.privacyPolicyBody3")}</p>
      </div>
      <div className="border-t border-border px-5 py-4">
        <Button type="button" className="w-full" onClick={onClose}>
          {t("auth.privacyPolicyClose")}
        </Button>
      </div>
    </dialog>
  );
}
