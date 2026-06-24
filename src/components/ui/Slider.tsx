"use client";

import { cn } from "@/lib/cn";

/**
 * Slim range slider with a stratosphere thumb. Supports optional evenly-spaced
 * tick labels below the track (used by the Plan Conditions control).
 */
export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  ticks,
  className,
  "aria-label": ariaLabel,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (v: number) => void;
  /** Evenly-spaced labels rendered under the track. */
  ticks?: string[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <input
        type="range"
        className="slider-slim"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel}
        onChange={(e) => onChange?.(Number(e.target.value))}
      />
      {ticks && ticks.length > 0 ? (
        <div className="flex justify-between">
          {ticks.map((t, i) => (
            <span
              key={i}
              className={cn(
                "text-[11px] leading-tight text-gray-2",
                i === 0 && "text-left",
                i === ticks.length - 1 && "text-right",
              )}
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
