"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

/**
 * Fullscreen dark "Placeholder" takeover used wherever a destination is not yet
 * designed (e.g. booking an advisor, the Marketplace tab, the plan preview).
 */
export function FullscreenPlaceholder({
  eyebrow = "Plan preview",
  title,
  copy,
  backLabel = "Back",
  onClose,
}: {
  eyebrow?: string;
  title: string;
  copy: string;
  backLabel?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex flex-col bg-deep-black text-white"
    >
      <div className="flex items-center justify-between px-8 py-6">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          {backLabel}
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
          {eyebrow}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 pb-16 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.4em] text-white/40">
          Placeholder
        </p>
        <p className="max-w-2xl text-5xl font-semibold leading-[1.1] tracking-[-0.02em]">
          {title}
        </p>
        <p className="mt-2 max-w-xl text-lg text-white/55">{copy}</p>
      </div>
    </div>
  );
}
