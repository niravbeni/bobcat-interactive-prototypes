"use client";

import { cn } from "@/lib/cn";

export function LabeledMoneyField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex h-20 w-full flex-col justify-center gap-1 rounded-field border border-stroke-subtle bg-white px-4 py-3 transition-colors focus-within:border-deep-black",
        className,
      )}
    >
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] leading-none text-gray-2">{label}</span>
      <div className="flex items-center">
        <span className="text-2xl leading-none text-black">$</span>
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="ml-1 w-full bg-transparent text-2xl leading-none text-black outline-none"
        />
      </div>
    </label>
  );
}
