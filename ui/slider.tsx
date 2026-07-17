import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps
  extends Omit<React.ComponentProps<"input">, "value" | "min" | "max"> {
  value: number;
  min?: number;
  max?: number;
}

/**
 * Range input with a filled track.
 * Always rendered LTR — media sliders keep their direction in RTL layouts.
 */
function Slider({ className, value, min = 0, max = 100, ...props }: SliderProps) {
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <input
      type="range"
      dir="ltr"
      value={value}
      min={min}
      max={max}
      style={{
        background: `linear-gradient(to right, var(--primary) ${percent}%, var(--muted) ${percent}%)`,
      }}
      className={cn(
        "h-1 w-full cursor-pointer appearance-none rounded-full",
        "[&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125",
        "[&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Slider };
