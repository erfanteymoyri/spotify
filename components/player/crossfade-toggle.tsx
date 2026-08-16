"use client";

import { Blend } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/providers/preferences-provider";
import { Button } from "@/ui/button";

/**
 * Turns the blend between tracks on and off.
 *
 * Writes through the preferences provider rather than straight to the player
 * store, so the choice is stored on the account and the same switch on the
 * settings page shows it — the store is downstream of both.
 */
export function CrossfadeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { settings, update } = usePreferences();
  const enabled = settings.crossfadeEnabled;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => void update({ crossfadeEnabled: !enabled }).catch(() => {})}
      aria-label={t("player.crossfade")}
      aria-pressed={enabled}
      title={
        enabled
          ? t("player.crossfadeOn", { seconds: settings.crossfadeSeconds })
          : t("player.crossfadeOff")
      }
      className={cn(enabled ? "text-primary" : "text-muted-foreground", className)}
    >
      <Blend className="size-4" />
    </Button>
  );
}
