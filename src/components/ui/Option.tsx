"use client";

import { cn } from "@/lib/cn";
import { Check } from "lucide-react";

export function OptionList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 rounded-field bg-white p-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Option({
  label,
  selected,
  onClick,
  trailing,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center justify-between rounded pl-4 pr-6 py-2 text-left text-2xl leading-[1.6] transition-colors",
        selected
          ? "bg-deep-black text-white"
          : "bg-white text-deep-black hover:bg-ghost-white",
      )}
    >
      <span>{label}</span>
      {trailing ?? (selected ? <Check className="size-6 shrink-0" strokeWidth={2} /> : null)}
    </button>
  );
}
