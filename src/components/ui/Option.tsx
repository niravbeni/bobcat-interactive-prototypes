"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { Check } from "lucide-react";

export function OptionList({
  children,
  className,
  compact = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Tighter gaps/padding for dense stacked layouts (experienced flow). */
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Roving keyboard navigation: Up/Down move focus between the option buttons,
  // Enter selects the focused option. Selecting via Enter is stopped from
  // bubbling so it doesn't also trigger the page-level Enter-to-continue; a
  // second Enter on the already-selected option is allowed through so it can
  // advance the page.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Enter") {
      return;
    }
    const items = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>("[data-option]") ?? [],
    );
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      const next =
        e.key === "ArrowDown"
          ? index < 0
            ? 0
            : Math.min(index + 1, items.length - 1)
          : index < 0
            ? items.length - 1
            : Math.max(index - 1, 0);
      items[next]?.focus();
      return;
    }

    // Enter on a focused, not-yet-selected option selects it without advancing.
    if (index >= 0 && items[index].getAttribute("aria-selected") !== "true") {
      e.preventDefault();
      e.stopPropagation();
      items[index].click();
    }
  };

  return (
    <div
      ref={ref}
      role="listbox"
      onKeyDown={handleKeyDown}
      className={cn(
        "flex w-full flex-col rounded-field bg-white",
        compact ? "gap-1 p-1.5" : "gap-2 p-2",
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
  compact = false,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  trailing?: React.ReactNode;
  /** Smaller text + tighter padding for dense stacked layouts (experienced flow). */
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="option"
      data-option
      aria-selected={selected}
      className={cn(
        "flex w-full items-center justify-between rounded text-left transition-colors",
        compact
          ? "pl-3 pr-4 py-1.5 text-base leading-snug"
          : "pl-4 pr-6 py-2 text-2xl leading-[1.6]",
        selected
          ? "bg-deep-black text-white"
          : "bg-white text-deep-black hover:bg-ghost-white",
      )}
    >
      <span>{label}</span>
      {trailing ??
        (selected ? (
          <Check
            className={cn("shrink-0", compact ? "size-4" : "size-6")}
            strokeWidth={2}
          />
        ) : null)}
    </button>
  );
}
