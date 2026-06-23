"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

/**
 * Fullscreen placeholder takeover for the plan preview. Used both from the
 * chat checkpoint option and the sidebar "See your plan" CTA. Matches the
 * dark "Placeholder" treatment used elsewhere in the prototype.
 */
export function PlanPreviewModal({ onClose }: { onClose: () => void }) {
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
      aria-label="Your plan preview"
      className="fixed inset-0 z-50 flex flex-col bg-deep-black text-white"
    >
      <div className="flex items-center justify-between px-8 py-6">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Back to chat
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
          Plan preview
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 pb-16 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.4em] text-white/40">
          Placeholder
        </p>
        <p className="max-w-2xl text-5xl font-semibold tracking-[-0.02em] leading-[1.1]">
          Your plan preview will appear here
        </p>
        <p className="mt-2 max-w-xl text-lg text-white/55">
          We&rsquo;re still designing this view. It&rsquo;ll show your forecast,
          priorities, and what to refine next.
        </p>
      </div>
    </div>
  );
}
