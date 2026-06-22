"use client";

import { cn } from "@/lib/cn";
import { Pencil } from "lucide-react";

export function EditableChip({
  label,
  value,
  onEdit,
  className,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        "group flex flex-col items-start gap-0.5 rounded-card border border-stroke-subtle bg-white px-3 py-2 text-left transition-colors hover:border-deep-black",
        className,
      )}
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-gray-2">
        {label}
      </span>
      <span className="flex items-center gap-1.5 text-sm font-medium leading-none text-deep-black">
        {value}
        <Pencil className="size-3 text-gray-2 group-hover:text-deep-black" />
      </span>
    </button>
  );
}
