"use client";

import { cn } from "@/lib/cn";

export function MoneyField({
  value,
  onChange,
  onSubmit,
  trailing,
  helper,
  variant = "white",
  className,
}: {
  value: string;
  onChange?: (v: string) => void;
  /** Fired when the user presses Enter in the field. */
  onSubmit?: () => void;
  trailing?: React.ReactNode;
  helper?: string;
  variant?: "white" | "field";
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div
        className={cn(
          "relative flex h-20 items-center rounded-field px-6",
          variant === "white"
            ? "bg-white border border-stroke-subtle"
            : "bg-field",
        )}
      >
        <span className="text-2xl leading-[1.6] text-black">$</span>
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit?.();
            }
          }}
          className="ml-2 w-full bg-transparent text-2xl leading-[1.6] text-black outline-none placeholder:text-gray-text"
          placeholder="0.00"
        />
        {trailing ? <div className="ml-3 shrink-0">{trailing}</div> : null}
      </div>
      {helper ? (
        <p className="px-6 pt-1.5 text-right text-sm leading-snug text-gray-text">{helper}</p>
      ) : null}
    </div>
  );
}
