"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { ChevronDown, SquareUser } from "lucide-react";
import { cn } from "@/lib/cn";
import { BrandWordmark } from "@/components/chrome/BrandWordmark";
import { OutlookTopNav } from "@/components/prototypes/outlook/OutlookTopNav";
import { SIG_EASE } from "./shared";

const GLORIA_MENU = [
  "View profile",
  "Plan documents",
  "Preferences",
  "Sign out",
] as const;

/**
 * Stepper-mode top nav (Retirement Story): brand wordmark on the left and the
 * Help / Ask an Advisor / Gloria cluster on the right — no center tab toggle.
 */
function StepperTopNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="relative flex h-16 w-full shrink-0 items-center gap-3 border-b-[0.5px] border-[#ececee] bg-[#f7f7f7] px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center">
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="inline-flex shrink-0 items-center text-deep-black transition-opacity hover:opacity-60"
        >
          <BrandWordmark width={72} height={24} />
        </Link>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2">
        {/* Figma: "Ask an Advisor" is the outlined pill, "Help" the filled one. */}
        <button
          type="button"
          className="hidden h-8 items-center rounded-full border-[0.75px] border-stratosphere px-3 text-sm tracking-[0.14px] text-stratosphere transition-colors hover:bg-stratosphere/5 lg:flex"
        >
          Ask an Advisor
        </button>
        <button
          type="button"
          className="hidden h-8 items-center rounded-full bg-stratosphere px-3 text-sm font-medium tracking-[0.14px] text-white transition-colors hover:bg-stratosphere/90 sm:flex"
        >
          Help
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-8 items-center gap-1 rounded-full bg-white py-1 pl-2 pr-1.5 shadow-[0_1px_2px_rgba(16,24,32,0.1)] transition-colors hover:bg-white/70"
          >
            <SquareUser className="size-4 shrink-0 text-deep-black" strokeWidth={2} />
            <span className="text-sm tracking-[0.14px] text-black">Gloria</span>
            <motion.span
              animate={{ rotate: menuOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="size-4 shrink-0 text-deep-black" strokeWidth={2} />
            </motion.span>
          </button>

          <AnimatePresence>
            {menuOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: SIG_EASE }}
                  className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-card border border-stroke-subtle bg-white py-1 shadow-[0_12px_36px_rgba(16,24,32,0.16)]"
                >
                  {GLORIA_MENU.map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-deep-black transition-colors hover:bg-ghost-white"
                    >
                      {item}
                    </button>
                  ))}
                </motion.div>
              </>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export interface SubBarSlots {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

/**
 * Shared page shell for the Signature flow. Mirrors DetailsShell's h-screen
 * mount fade, with two top-chrome modes (stepper for the story, the Outlook
 * tabs nav for the hub/aggregator), an optional sub-bar and a floating
 * bottom-left "Ask a question" pill.
 */
export function SignatureShell({
  mode,
  subBar,
  children,
  bodyClassName,
  scroll = true,
  askPill = true,
}: {
  mode: "stepper" | "tabs";
  subBar?: SubBarSlots;
  children: React.ReactNode;
  /** Extra classes for the body (e.g. padding / background). */
  bodyClassName?: string;
  /** When false the body itself doesn't scroll — the screen manages its own
   *  inner scroll (used for the sidebar + main-column aggregator layout). */
  scroll?: boolean;
  /** Whether to render the floating bottom-left ask pill. Off for screens
   *  whose sidebar already carries its own ask pill. */
  askPill?: boolean;
}) {
  return (
    <MotionConfig reducedMotion="user">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: SIG_EASE }}
      className="relative flex h-screen flex-col overflow-hidden bg-[#f7f7f7]"
    >
      {mode === "stepper" ? <StepperTopNav /> : <OutlookTopNav activeTab="Details" />}

      {subBar ? (
        <div className="relative z-20 flex h-14 w-full shrink-0 items-center gap-3 bg-[#fdfdfd] px-4 shadow-[0_0_20px_rgba(0,0,0,0.15)] sm:px-8">
          <div className="flex min-w-0 flex-1 items-center">{subBar.left}</div>
          {/* Center note is revealed only once there's room for it beside the
              right pill (lg+), and it truncates rather than colliding if tight. */}
          <div className="hidden min-w-0 items-center justify-center overflow-hidden px-2 text-center lg:flex [&>*]:min-w-0 [&>*]:truncate">
            {subBar.center}
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end">
            {subBar.right}
          </div>
        </div>
      ) : null}

      <main
        className={cn(
          "scrollbar-slim relative flex min-h-0 w-full flex-1 flex-col",
          scroll ? "overflow-y-auto" : "overflow-hidden",
          bodyClassName,
        )}
      >
        {children}
      </main>

      {askPill ? <AskPill /> : null}
    </motion.div>
    </MotionConfig>
  );
}

/** Floating bottom-left "Ask a question" pill (inert; gradient spiral icon). */
function AskPill() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: SIG_EASE, delay: 0.4 }}
      whileHover={{ y: -2 }}
      className="pointer-events-auto absolute bottom-6 left-4 z-30 flex h-10 items-center justify-between gap-3 rounded-full bg-white/[0.33] py-2 pl-4 pr-2 shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_6px_18px_rgba(0,0,0,0.14)] sm:left-8"
    >
      <span className="text-sm text-[#767676]">Ask a question</span>
      {/* Gradient spiral exported verbatim from Figma (matches the sidebar pill). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/signature/ask-spiral.svg"
        alt=""
        aria-hidden
        className="size-[30px] shrink-0"
      />
    </motion.div>
  );
}

/**
 * Black rounded nav pill used on the sub-bar (e.g. "View initial outlook →").
 * Never wraps: the pill stays a single line and, when a `secondary` label is
 * supplied (e.g. the section name), that part is dropped on narrow screens so
 * the pill shrinks cleanly instead of breaking onto two lines.
 */
export function NavPill({
  onClick,
  children,
  secondary,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  /** Optional secondary label shown only on wider screens (e.g. "Income"). */
  secondary?: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="group inline-flex h-8 max-w-full shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-deep-black px-3.5 text-sm font-medium tracking-[0.14px] text-white transition-colors hover:bg-black"
    >
      <span className="min-w-0 truncate">{children}</span>
      {secondary ? (
        <span className="hidden shrink-0 sm:inline">· {secondary}</span>
      ) : null}
      <span
        aria-hidden
        className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
      >
        →
      </span>
    </motion.button>
  );
}
