"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { SIG_EASE } from "./shared";
import { TREND_OPTIONS, type TrendId } from "./signatureSpending";

/**
 * Spend-trend chooser (Figma 2046:26006). A wide dialog titled
 * "How might your [category] costs change over time?" (category in violet), a
 * non-essential shimmer intro, and three trend cards (decrease / steady /
 * increase) — one Suggested. Selecting a card sets that category's trend and
 * closes. Motion / scrim / Escape mirror `AddSavingModal`.
 */
export function SpendTrendModal({
  open,
  categoryTitle,
  selected,
  onSelect,
  onClose,
}: {
  open: boolean;
  categoryTitle: string;
  selected: TrendId | null;
  onSelect: (trend: TrendId) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/[0.66]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`How might your ${categoryTitle} costs change over time?`}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 8,
              transition: { duration: 0.16, ease: SIG_EASE },
            }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="scrollbar-slim relative max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded-[16px] bg-[#f7f7f7] p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-6">
              <h2 className="text-[26px] font-normal leading-[1.28] tracking-[-0.64px] text-title-ink sm:text-[32px]">
                How might your{" "}
                <span className="text-violet">{categoryTitle}</span> costs change
                over time?
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-12 shrink-0 place-items-center rounded-[12px] text-deep-black transition-colors hover:bg-black/5 sm:size-14"
              >
                <X className="size-6" strokeWidth={2} />
              </button>
            </div>

            {/* Intro copy is non-essential → shimmer placeholder bars. */}
            <div className="mt-6 flex flex-col gap-2" aria-hidden>
              <span className="h-3 w-full rounded-full skeleton-shimmer" />
              <span className="h-3 w-[68%] rounded-full skeleton-shimmer" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {TREND_OPTIONS.map((opt) => {
                const isSelected = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      onSelect(opt.id);
                      onClose();
                    }}
                    className={cn(
                      "group flex flex-col items-stretch gap-4 rounded-[16px] bg-white px-6 pb-6 pt-7 text-left transition-colors",
                      isSelected
                        ? "border-2 border-black"
                        : "border border-stroke-subtle hover:border-black/40",
                    )}
                  >
                    <span className="flex flex-col gap-4">
                      <span className="flex h-[18px] items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={opt.iconSrc}
                          alt=""
                          aria-hidden
                          className={opt.iconClass}
                        />
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="text-[20px] leading-[23.25px] text-title-ink">
                          {opt.title}
                        </span>
                        {/* Body copy is non-essential → shimmer bar + info dot. */}
                        <span className="flex items-center gap-1">
                          <span
                            className="h-2.5 w-28 rounded-full skeleton-shimmer"
                            aria-hidden
                          />
                          <Info
                            className="size-4 shrink-0 text-gray-2"
                            strokeWidth={2}
                          />
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center justify-between">
                      {opt.recommended ? (
                        <span className="rounded-full bg-success/[0.06] px-2.5 py-1 text-xs leading-[18px] text-success">
                          Suggested
                        </span>
                      ) : (
                        <span aria-hidden />
                      )}
                      {isSelected ? (
                        <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-black">
                          <span className="size-3.5 rounded-full bg-black" />
                        </span>
                      ) : (
                        <span className="size-7 shrink-0 rounded-full border-[1.5px] border-black" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
