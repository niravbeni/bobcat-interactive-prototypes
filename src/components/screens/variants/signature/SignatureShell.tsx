"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { ChevronDown, SquareUser } from "lucide-react";
import { cn } from "@/lib/cn";
import { SignatureBrand } from "./SignatureBrand";
import { SignatureTopNav } from "./SignatureTopNav";
import { SIG_EASE } from "./shared";

const GLORIA_MENU = [
  "View profile",
  "Plan documents",
  "Preferences",
  "Sign out",
] as const;

/**
 * Hidden demo shortcut: double-clicking the bottom-left assistant pill broadcasts
 * this window CustomEvent. Every Signature screen listens for it and resets its
 * own field state to empty so a presenter can fill values in live. Signature flow
 * only — screens subscribe in a `useEffect` (SSR-safe). */
export const SIG_DEMO_CLEAR_EVENT = "sig-demo-clear";

/**
 * Stepper-mode top nav (Retirement Story): brand wordmark on the left and the
 * Help / Gloria cluster on the right — no center tab toggle.
 */
function StepperTopNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="relative flex h-16 w-full shrink-0 items-center gap-3 border-b-[0.5px] border-[#ececee] bg-[#f7f7f7] px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center">
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="inline-flex shrink-0 items-center transition-opacity hover:opacity-60"
        >
          <SignatureBrand height={18} />
        </Link>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2">
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
  activeTab = "Your Details",
  onSelectTab,
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
  /** Which top-nav tab reads as active in "tabs" mode. */
  activeTab?: "Your Details" | "Your Outlook" | "Marketplace";
  /** Optional handler making the "Your Details"/"Your Outlook" tabs clickable. */
  onSelectTab?: (tab: "Your Details" | "Your Outlook" | "Marketplace") => void;
}) {
  return (
    <MotionConfig reducedMotion="user">
    {/* Unified premium cross-step entrance shared by every Signature screen
        (incl. the loading interstitial): a soft opacity fade paired with a
        subtle upward rise on SIG_EASE so each App Router page swap settles in
        gracefully and cohesively. `reducedMotion="user"` drops the transform
        for users who prefer reduced motion, leaving a plain fade. */}
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: SIG_EASE }}
      className="relative flex h-screen flex-col overflow-hidden bg-[#f7f7f7]"
    >
      {mode === "stepper" ? (
        <StepperTopNav />
      ) : (
        <SignatureTopNav activeTab={activeTab} onSelectTab={onSelectTab} />
      )}

      {subBar ? (
        <div className="relative z-20 flex h-14 w-full shrink-0 items-center gap-3 bg-[#fdfdfd] px-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:px-8">
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

/** Floating bottom-left "Ask a question" pill (gradient spiral icon). Single
 *  click keeps its existing (inert) behavior; a hidden demo shortcut fires when
 *  the pill is double-clicked — see `SIG_DEMO_CLEAR_EVENT`. */
function AskPill() {
  // Manual double-click detection: a second click within DOUBLE_CLICK_MS fires
  // the demo clear and suppresses the single-click path. Using a timestamp ref
  // (rather than onDoubleClick) keeps the single click's existing behavior
  // undisturbed while making the shortcut feel like a hidden gesture.
  const DOUBLE_CLICK_MS = 350;
  const lastClickRef = useRef(0);
  const [flash, setFlash] = useState(false);

  const handleClick = () => {
    const now = Date.now();
    if (now - lastClickRef.current <= DOUBLE_CLICK_MS) {
      lastClickRef.current = 0;
      // Broadcast to every mounted Signature screen so each resets its own state.
      window.dispatchEvent(new CustomEvent(SIG_DEMO_CLEAR_EVENT));
      setFlash(true);
      window.setTimeout(() => setFlash(false), 420);
    } else {
      lastClickRef.current = now;
      // Single-click behavior intentionally left inert (matches prior pill).
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      initial={{ opacity: 0, y: 12 }}
      animate={
        flash
          ? {
              opacity: 1,
              y: 0,
              scale: [1, 1.06, 1],
              boxShadow: [
                "0 2px 8px rgba(0,0,0,0.1)",
                "0 6px 20px rgba(127,53,178,0.35)",
                "0 2px 8px rgba(0,0,0,0.1)",
              ],
            }
          : { opacity: 1, y: 0 }
      }
      transition={{ duration: 0.45, ease: SIG_EASE, delay: flash ? 0 : 0.4 }}
      whileHover={{ y: -2 }}
      className="pointer-events-auto absolute bottom-6 left-4 z-30 flex h-10 cursor-pointer items-center justify-between gap-3 rounded-full bg-white/[0.33] py-2 pl-4 pr-2 shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_6px_18px_rgba(0,0,0,0.14)] sm:left-8"
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
  shape = "rounded",
}: {
  onClick?: () => void;
  children: React.ReactNode;
  /** Optional secondary label shown only on wider screens (e.g. "Income"). */
  secondary?: React.ReactNode;
  /** "rounded" = 8px radius to match the Figma "Desktop/NavButton" used across
   *  the Signature sub-bar CTAs (default). "pill" = fully rounded. */
  shape?: "pill" | "rounded";
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "group inline-flex h-8 max-w-full shrink-0 items-center justify-center gap-1 whitespace-nowrap bg-deep-black text-sm font-medium tracking-[0.14px] text-white transition-colors hover:bg-black",
        shape === "pill" ? "rounded-full px-3.5" : "rounded-lg px-3",
      )}
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
