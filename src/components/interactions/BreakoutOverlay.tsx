"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BreakoutOverlayProps {
  open: boolean;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  children: React.ReactNode;
}

/**
 * A full-screen interaction that "pops out" of the linear flow for a richer
 * moment, then returns. The underlying step stays mounted, so all flow state is
 * preserved; this overlay only writes its results back via onSave/onClose.
 */
export function BreakoutOverlay({
  open,
  eyebrow,
  title,
  subtitle,
  onClose,
  onSave,
  saveLabel = "Save & continue",
  saveDisabled,
  children,
}: BreakoutOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-deep-black/40 backdrop-blur-sm animate-[overlayIn_200ms_ease-out]"
      />

      <div className="relative flex h-full w-full max-w-[1100px] flex-col overflow-hidden rounded-card bg-white shadow-[0_24px_80px_rgba(16,24,32,0.28)] animate-[breakoutIn_220ms_cubic-bezier(0.16,1,0.3,1)]">
        <header className="flex items-start justify-between gap-4 border-b border-stroke-subtle px-8 py-6">
          <div className="flex flex-col gap-1">
            {eyebrow ? (
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">
                {eyebrow}
              </span>
            ) : null}
            <h2 className="text-2xl font-semibold tracking-[-0.01em] text-deep-black">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-base text-gray-text">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
          >
            <X className="size-6" strokeWidth={2} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6">{children}</div>

        {onSave ? (
          <footer className="flex items-center justify-end gap-3 border-t border-stroke-subtle px-8 py-5">
            <Button variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="blue"
              size="md"
              onClick={onSave}
              disabled={saveDisabled}
            >
              {saveLabel}
            </Button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
