"use client";

import { cn } from "@/lib/cn";
import { CircleArrowLeft } from "lucide-react";

export function BackButton({
  onClick,
  label,
  size = 48,
  className,
}: {
  onClick?: () => void;
  label?: string;
  size?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? "Go back"}
      className={cn(
        "inline-flex items-center gap-3 text-deep-black transition-opacity hover:opacity-70",
        className,
      )}
    >
      <CircleArrowLeft style={{ width: size, height: size }} strokeWidth={1.5} />
      {label ? <span className="text-2xl leading-none">{label}</span> : null}
    </button>
  );
}
