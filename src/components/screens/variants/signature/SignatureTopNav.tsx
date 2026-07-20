"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, SquareUser } from "lucide-react";
import { cn } from "@/lib/cn";
import { SignatureBrand } from "./SignatureBrand";
import { SIG_EASE } from "./shared";

/**
 * Center tabs for the Signature flow. Unlike the Outlook flow's pill toggle,
 * Figma 2005:53034 specifies plain text labels with a 2px underline marking the
 * active tab (ultra-violet). Labels are the long-form Signature names.
 */
const TABS = ["Your Details", "Your Outlook", "Marketplace"] as const;

const GLORIA_MENU = [
  "View profile",
  "Plan documents",
  "Preferences",
  "Sign out",
] as const;

/**
 * Signature-flow top nav, styled to match Figma node 2005:53034
 * ("UI-Design-Working-file | Bobcat"). Deliberately separate from the shared
 * `OutlookTopNav` so the Outlook journeys keep their existing pill-toggle nav.
 *
 * Structure mirrors the Outlook nav (brand wordmark · centered tabs · help /
 * profile cluster) but the styling follows the Signature spec: a
 * `#f7f7f7` bar with a hairline bottom divider, underline-style tabs, an
 * outlined "Help" control, a vertical divider, and a white "Gloria" account
 * pill.
 */
export function SignatureTopNav({
  activeTab = "Your Details",
  onSelectTab,
}: {
  /** Which centered tab reads as active. The Signature aggregator screens sit
   *  under "Your Details", so that is the default. */
  activeTab?: (typeof TABS)[number];
  /** When provided, the "Your Details" and "Your Outlook" tabs become clickable
   *  (Marketplace stays inert). */
  onSelectTab?: (tab: (typeof TABS)[number]) => void;
} = {}) {
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

      <nav
        aria-label="Signature sections"
        className="hidden shrink-0 items-start gap-8 md:flex"
      >
        {TABS.map((tab) => {
          const active = tab === activeTab;
          const clickable =
            !!onSelectTab && (tab === "Your Details" || tab === "Your Outlook");
          return (
            <button
              key={tab}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={clickable ? () => onSelectTab?.(tab) : undefined}
              className={cn(
                "flex flex-col items-center gap-1.5",
                clickable ? "cursor-pointer" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "whitespace-nowrap text-sm leading-[1.28] tracking-[0.14px] transition-colors",
                  active
                    ? "font-medium text-violet"
                    : "font-normal text-black/75 hover:text-black",
                )}
              >
                {tab}
              </span>
              <span
                aria-hidden
                className={cn(
                  "h-0.5 w-full rounded-full transition-colors",
                  active ? "bg-violet" : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
        <button
          type="button"
          className="hidden h-8 items-center rounded-full bg-stratosphere px-3 text-sm font-medium tracking-[0.14px] text-white transition-colors hover:bg-stratosphere/90 lg:flex"
        >
          Help
        </button>

        <span
          aria-hidden
          className="hidden h-[18px] w-px shrink-0 bg-divider sm:block"
        />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-8 items-center gap-1 rounded-full bg-white py-1 pl-3 pr-2 transition-colors hover:bg-white/70"
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
