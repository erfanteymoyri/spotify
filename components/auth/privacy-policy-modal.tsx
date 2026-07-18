"use client";

import { Button } from "@/ui/button";
import { Dialog } from "@/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";

interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ open, onClose }: PrivacyPolicyModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("auth.privacyPolicyTitle")}
      closeLabel={t("common.close")}
      footer={
        <Button type="button" className="w-full" onClick={onClose}>
          {t("auth.privacyPolicyClose")}
        </Button>
      }
    >
      <div className="space-y-3 text-sm leading-7 text-muted-foreground">
        <p>{t("auth.privacyPolicyBody1")}</p>
        <p>{t("auth.privacyPolicyBody2")}</p>
        <p>{t("auth.privacyPolicyBody3")}</p>
      </div>
    </Dialog>
  );
}
