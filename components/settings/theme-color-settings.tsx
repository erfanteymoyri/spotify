"use client";

import { useState } from "react";
import { Palette, Wand2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { isHexColor } from "@/lib/color";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/providers/preferences-provider";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

/** A starting point for someone who wants a colour but not a colour wheel. */
const PRESETS = ["#1db954", "#e85d75", "#457bd6", "#f1a93c", "#8b60d6", "#22a8a8"];

const FALLBACK = "#1db954";

/**
 * Chooses between "follow the artwork" and a fixed colour.
 *
 * The stored value carries both facts: a `#rrggbb` is a manual choice and an
 * empty string is automatic. One field, so the two can never disagree about
 * which mode is in force — and switching back to automatic is a save of `""`
 * rather than a second flag to keep in step.
 */
export function ThemeColorSettings() {
  const { t } = useTranslation();
  const { settings, update } = usePreferences();

  const isAuto = settings.backgroundColor === "";

  // Local, because a colour input fires on every drag: the text field has to
  // follow the pointer at 60 Hz while the server hears about it only on
  // release.
  const [draft, setDraft] = useState(settings.backgroundColor || FALLBACK);

  // Re-sync when the stored colour changes underneath us (another device, or
  // the optimistic update rolling back). Adjusted during render rather than in
  // an effect, so the field never paints a value that is already stale.
  const [lastStored, setLastStored] = useState(settings.backgroundColor);
  if (lastStored !== settings.backgroundColor) {
    setLastStored(settings.backgroundColor);
    // An empty value means "automatic"; keep the last colour in the picker so
    // switching back to manual does not start from scratch.
    if (settings.backgroundColor) setDraft(settings.backgroundColor);
  }

  const save = (color: string) => void update({ backgroundColor: color }).catch(() => {});

  return (
    <section className="space-y-5 rounded-xl bg-card/40 p-6">
      <div>
        <h3 className="font-semibold">{t("settings.themeColor")}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {t("settings.themeColorHint")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ModeCard
          icon={<Wand2 className="size-4" />}
          label={t("settings.themeAuto")}
          description={t("settings.themeAutoHint")}
          active={isAuto}
          onClick={() => save("")}
        />
        <ModeCard
          icon={<Palette className="size-4" />}
          label={t("settings.themeManual")}
          description={t("settings.themeManualHint")}
          active={!isAuto}
          onClick={() => save(draft)}
        />
      </div>

      {!isAuto && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="color"
              aria-label={t("settings.themeColor")}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              // Commit on release, not on every intermediate colour.
              onBlur={() => save(draft)}
              className="size-11 cursor-pointer rounded-lg border border-border bg-transparent p-1"
            />
            <Input
              value={draft}
              spellCheck={false}
              dir="ltr"
              aria-invalid={!isHexColor(draft)}
              onChange={(e) => setDraft(e.target.value.trim())}
              onBlur={() => isHexColor(draft) && save(draft.toLowerCase())}
              className="w-32 font-mono uppercase"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!isHexColor(draft)}
              onClick={() => save(draft.toLowerCase())}
            >
              {t("common.save")}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-label={preset}
                onClick={() => {
                  setDraft(preset);
                  save(preset);
                }}
                style={{ backgroundColor: preset }}
                className={cn(
                  "size-8 rounded-full ring-offset-2 ring-offset-card transition-transform hover:scale-110",
                  settings.backgroundColor === preset && "ring-2 ring-foreground",
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reads the live variables, so it shows what the app is actually
          wearing -- including the colour just pulled off a cover. */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{t("settings.themePreview")}</p>
        <div className="flex items-center gap-2">
          <Swatch className="bg-background" label={t("settings.previewBackground")} />
          <Swatch className="bg-card" label={t("settings.previewSurface")} />
          <Swatch className="bg-primary" label={t("settings.previewAccent")} />
          <div className="h-8 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ModeCard({
  icon,
  label,
  description,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl border p-4 text-start transition-colors",
        active
          ? "border-primary bg-primary/10"
          : "border-border hover:bg-muted-foreground/5",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-2 text-sm font-medium",
          active && "text-primary",
        )}
      >
        {icon}
        {label}
      </span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span
      title={label}
      className={cn("size-8 rounded-lg border border-border/60", className)}
    />
  );
}
