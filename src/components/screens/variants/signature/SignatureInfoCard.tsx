"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { SIG_EASE, SIG_SPRING } from "./shared";

/**
 * Collapsible translucent info card used across the Signature "Your details"
 * section screens (Assets, Expense, Goals). A 48px color icon on the left, an
 * essential heading + chevron toggle, and a faint concentric-ring texture
 * (`/signature/card-texture.png`) laid over a near-white ground. The body copy
 * is intentionally non-essential, so it renders as shimmer placeholder bars.
 *
 * Extracted verbatim from the corrected `InfoCard` in `SignatureAssetsScreen`
 * (Figma 1996:30999 / texture 1996:31000) so the expense screen can reuse it.
 *
 * CANONICAL info card — this is the single source of truth for the signature
 * "Your details" collapsible info card. Phase 2 should migrate the local
 * duplicates in Assets and Goals to import this component. Spec (do not drift):
 * `rounded-card bg-black/[0.02] px-5`, texture overlay opacity 0.06, title
 * `text-sm font-medium leading-[1.4] tracking-[-0.42px]`.
 */
export function SignatureInfoCard({
  iconSrc,
  title,
  defaultOpen = true,
}: {
  /** Color icon exported from the Figma frame (48px). */
  iconSrc: string;
  title: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`relative flex items-start gap-[22px] overflow-hidden rounded-card bg-black/[0.02] px-5 transition-[padding] duration-300 ${
        open ? "py-5" : "py-2"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/signature/card-texture.png"
          alt=""
          className="absolute left-0 top-[-120%] h-[340%] w-full max-w-none opacity-[0.06]"
        />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconSrc} alt="" aria-hidden className="relative size-12 shrink-0" />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`flex items-center justify-between gap-2 text-left transition-[min-height] duration-300 ${
            open ? "min-h-5" : "min-h-12"
          }`}
        >
          <span className="text-sm font-medium leading-[1.4] tracking-[-0.42px] text-black">
            {title}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25, ease: SIG_EASE }}
          >
            <ChevronDown className="size-[18px] text-gray-2" strokeWidth={2} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={SIG_SPRING}
              className="overflow-hidden"
            >
              {/* Body copy is non-essential → shimmer placeholder bars. */}
              <div className="flex flex-col gap-1.5 pt-3" aria-hidden>
                <span className="h-2.5 w-full rounded-full skeleton-shimmer" />
                <span className="h-2.5 w-[92%] rounded-full skeleton-shimmer" />
                <span className="h-2.5 w-[60%] rounded-full skeleton-shimmer" />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
