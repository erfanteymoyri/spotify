"use client";

import { Badge } from "@/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import type { BillingOption } from "@/types";
import { cn } from "@/lib/utils";

interface BillingPeriodPickerProps {
  options: BillingOption[];
  value: number;
  onChange: (months: number) => void;
}

/**
 * The 1 / 3 / 6 / 12-month ladder (spec 3.2).
 *
 * Both the discount and the "best value" flag come from the server, so the
 * badges cannot advertise a saving the checkout would not actually apply.
 */
export function BillingPeriodPicker({
  options,
  value,
  onChange,
}: BillingPeriodPickerProps) {
  const { t } = useTranslation();

  return (
    <div
      role="radiogroup"
      aria-label={t("subscription.duration")}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {options.map((option) => {
        const selected = option.months === value;
        return (
          <button
            key={option.months}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.months)}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-xl border p-4 transition-colors",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                : "border-border bg-card/40 hover:bg-card/70",
            )}
          >
            {option.isBestValue && (
              <Badge
                variant="success"
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 shadow-sm"
              >
                {t("subscription.bestValue")}
              </Badge>
            )}
            <span className="mt-1 font-semibold">
              {option.months === 1
                ? t("subscription.oneMonth")
                : t("subscription.months", { count: option.months })}
            </span>
            {/* The one-month row has nothing to advertise; a "0%" chip there
                would make the real discounts read as less meaningful. */}
            {option.discountPercent > 0 ? (
              <span className="text-xs font-medium text-primary">
                {t("subscription.save", { percent: option.discountPercent })}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">&nbsp;</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
