"use client";

import { useTranslation } from "@/hooks/use-translation";
import { usePreferences } from "@/providers/preferences-provider";
import { Checkbox } from "@/ui/checkbox";
import { Select } from "@/ui/select";
import { Slider } from "@/ui/slider";
import type { QualityPreference } from "@/types";

const QUALITIES: QualityPreference[] = ["auto", "low", "standard", "high"];

/**
 * Playback preferences: the blend between tracks, and streaming quality.
 *
 * The same two settings appear on the player bar. Both surfaces write through
 * `usePreferences`, so neither can drift from the other or from the server.
 */
export function PlaybackSettings() {
  const { t } = useTranslation();
  const { settings, update } = usePreferences();

  const save = (patch: Parameters<typeof update>[0]) =>
    void update(patch).catch(() => {});

  return (
    <section className="space-y-5 rounded-xl bg-card/40 p-6">
      <h3 className="font-semibold">{t("settings.playback")}</h3>

      <label className="flex items-center justify-between gap-4">
        <span className="min-w-0">
          <span className="block text-sm leading-6">
            {t("settings.crossfade")}
          </span>
          <span className="block text-xs leading-5 text-muted-foreground">
            {t("settings.crossfadeHint")}
          </span>
        </span>
        <Checkbox
          checked={settings.crossfadeEnabled}
          onChange={(e) => save({ crossfadeEnabled: e.target.checked })}
        />
      </label>

      {/* Only meaningful while the blend is on, so it appears with it. */}
      {settings.crossfadeEnabled && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("settings.crossfadeDuration")}
            </span>
            <span className="tabular-nums">
              {t("settings.seconds", { count: settings.crossfadeSeconds })}
            </span>
          </div>
          <Slider
            min={1}
            max={12}
            step={1}
            value={settings.crossfadeSeconds}
            onChange={(e) => save({ crossfadeSeconds: Number(e.target.value) })}
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm leading-6" htmlFor="preferred-quality">
          {t("settings.streamQuality")}
        </label>
        <Select
          id="preferred-quality"
          value={settings.preferredQuality}
          onChange={(e) =>
            save({ preferredQuality: e.target.value as QualityPreference })
          }
        >
          {QUALITIES.map((quality) => (
            <option key={quality} value={quality}>
              {t(`settings.quality.${quality}`)}
            </option>
          ))}
        </Select>
        <p className="text-xs leading-5 text-muted-foreground">
          {t("settings.streamQualityHint")}
        </p>
      </div>
    </section>
  );
}
