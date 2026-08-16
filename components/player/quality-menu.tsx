"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Gauge } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/providers/preferences-provider";
import { preferenceForLevel, usePlayerStore } from "@/stores/player-store";
import { Button } from "@/ui/button";
import type { QualityPreference } from "@/types";

/**
 * The streaming-quality menu.
 *
 * It lists what hls.js reports after parsing the master playlist — not what
 * the catalogue says exists — so an entry is only ever offered when the
 * variant is genuinely loadable. When there is nothing to choose between (a
 * track with no package, or Safari playing HLS natively and exposing no level
 * API) the button hides rather than offering a switch that does nothing.
 *
 * Choosing writes the *preference*, never a level index: the index of a rung
 * depends on how many the track has, so the store re-resolves it against every
 * new manifest and the choice survives the queue advancing.
 */
export function QualityMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const levels = usePlayerStore((s) => s.qualityLevels);
  const activeLevel = usePlayerStore((s) => s.activeLevel);
  const preference = usePlayerStore((s) => s.qualityPreference);
  const { update } = usePreferences();

  if (levels.length === 0) return null;

  const choose = (next: QualityPreference) => {
    setOpen(false);
    // Optimistic and shared: the provider pushes the new preference into the
    // player store, which is what actually switches the stream.
    void update({ preferredQuality: next }).catch(() => {});
  };

  // Which rung is actually playing. Shown next to "Auto" so that option is
  // informative rather than opaque; the explicit rows say it themselves.
  const activeLabel = levels.find((level) => level.index === activeLevel)?.label;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen((value) => !value)}
        aria-label={t("player.quality")}
        aria-expanded={open}
        className={cn(preference !== "auto" && "text-primary")}
      >
        <Gauge className="size-4" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.4, 0.25, 1] }}
            className="absolute bottom-[calc(100%+0.75rem)] end-0 z-40 w-52 overflow-hidden rounded-2xl border border-border/60 bg-popover/95 shadow-2xl shadow-black/30 backdrop-blur-xl"
          >
            <p className="border-b border-border/50 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              {t("player.quality")}
            </p>

            <QualityOption
              label={t("player.qualityAuto")}
              hint={preference === "auto" ? activeLabel : undefined}
              selected={preference === "auto"}
              onSelect={() => choose("auto")}
            />

            {levels.map((level) => {
              const value = preferenceForLevel(levels, level.index);
              return (
                <QualityOption
                  key={level.index}
                  label={level.label}
                  selected={preference === value}
                  onSelect={() => choose(value)}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QualityOption({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string;
  /** What Auto currently resolves to; shown beside the Auto row only. */
  hint?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected}
      className={cn(
        "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-start text-sm transition-colors hover:bg-muted-foreground/10",
        selected && "text-primary",
      )}
    >
      <span className="flex items-center gap-2">
        {label}
        {hint && (
          <span className="text-xs text-muted-foreground tabular-nums">
            · {hint}
          </span>
        )}
      </span>
      {selected && <Check className="size-4" />}
    </button>
  );
}
