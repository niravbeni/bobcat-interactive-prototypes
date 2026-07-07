"use client";

import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { useOutlookFeedback, type OutlookModalOpts } from "./OutlookFeedback";

const STAGES = [
  "Current outlook",
  "New outlook",
  "Refine outlook",
  "Confirm with advisor",
] as const;

/**
 * Bottom journey bar: four labeled progress segments with the active one
 * filled (and animated when the stage advances), a circular back button, and
 * the per-screen CTA on the right.
 */
export function OutlookStepper({
  active,
  cta,
  onCta,
  onBack,
  ctaDisabled = false,
  ctaModal,
}: {
  /** Index of the active stage, 0..3. */
  active: number;
  cta: string;
  onCta: () => void;
  onBack: () => void;
  ctaDisabled?: boolean;
  /** When set, the CTA opens this confirmation modal instead of calling onCta. */
  ctaModal?: OutlookModalOpts;
}) {
  const { showModal } = useOutlookFeedback();
  return (
    <footer className="flex w-full shrink-0 items-center gap-3 rounded-card border border-stroke-subtle bg-white px-4 py-2.5 shadow-[0_12px_40px_-8px_rgba(16,24,32,0.28)] sm:gap-4 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {STAGES.map((label, i) => {
          const isActive = i === active;
          const isDone = i < active;
          return (
            <div key={label} className="flex min-w-0 flex-1 flex-col gap-1.5">
              {/* Labels are hidden below lg so the bar + CTA always fit in the
                  narrower content column; the progress bars still convey stage. */}
              <span
                className={cn(
                  "hidden truncate text-[11px] leading-none lg:block",
                  isActive
                    ? "font-semibold text-deep-black"
                    : "text-gray-2",
                )}
              >
                {label}
              </span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-divider/50">
                {isActive ? (
                  // The active segment fills in from empty each time you arrive on
                  // a stage, so it reads as fresh progress being made.
                  <motion.div
                    className="h-full w-full origin-left rounded-full bg-deep-black"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  />
                ) : isDone ? (
                  <div className="h-full w-full rounded-full bg-deep-black/25" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-stroke-subtle bg-ghost-white text-deep-black transition-colors hover:bg-divider/40"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => (ctaModal ? showModal(ctaModal) : onCta())}
          disabled={ctaDisabled}
          className="whitespace-nowrap rounded-full bg-violet px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:bg-violet-disabled sm:px-5"
        >
          {cta}
        </button>
      </div>
    </footer>
  );
}
