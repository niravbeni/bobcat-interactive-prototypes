"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, SquareUser } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = ["Details", "Outlook", "Market"] as const;

const GLORIA_MENU = [
  "View profile",
  "Plan documents",
  "Preferences",
  "Sign out",
] as const;

/** The wtw wordmark used by the app's shared navbar. */
function WtwLogo() {
  return (
    <svg
      width="72"
      height="24"
      viewBox="0 0 90 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M90 5.70254L81.1742 28.4837H73.7419L70.0258 15.7617L66.2806 28.4837H58.8542L52.3277 11.4921H48.2632V19.1438C48.2632 22.7347 49.7148 23.3265 51.7006 23.3265C52.2268 23.316 52.7504 23.2499 53.2626 23.1292L55.2948 28.4199C53.7119 28.8074 52.0878 29.0022 50.4581 29C43.6529 29 40.7497 26.2212 40.7497 19.7181V11.4921H37.649L31.0703 28.4837H23.6381L19.9277 15.7617L16.171 28.4837H8.74452L0 5.70254H8.42516L12.8206 19.4687L17.0129 5.70254H22.8194L27.0523 19.4687L31.4245 5.70254H40.7497V1.60692L48.2632 0V5.70254H58.5348L62.9245 19.4687L67.1168 5.70254H72.9232L77.1561 19.4687L81.511 5.70254H90Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Figma-style top nav for the Outlook flow: wtw wordmark, a centered
 * Details / Outlook / Market pill toggle (Outlook active), and the advisor /
 * help / profile cluster on the right. Help surfaces a placeholder modal and
 * Gloria opens a small account menu; "Chat with an Advisor" is a placeholder
 * button with no action — all without navigating away from the Outlook journey.
 * The same nav renders on every Outlook screen (including the loader) for a
 * consistent top-of-page across the flow.
 */
export function OutlookTopNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative flex h-16 w-full shrink-0 items-center gap-3 bg-ghost-white px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center">
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="inline-flex shrink-0 items-center text-deep-black transition-opacity hover:opacity-60"
        >
          <WtwLogo />
        </Link>
      </div>

      <div
        role="tablist"
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white p-1 shadow-[0_1px_2px_rgba(16,24,32,0.06)]"
      >
        {TABS.map((tab) => {
          const active = tab === "Outlook";
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                "flex h-8 items-center rounded-full px-4 text-sm font-semibold tracking-[0.16px] transition-colors",
                active
                  ? "bg-deep-black text-white shadow-[0_1px_2px_rgba(16,24,32,0.18)]"
                  : "text-deep-black hover:bg-ghost-white",
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <button
          type="button"
          className="hidden h-8 items-center rounded-full border border-stratosphere px-3.5 text-sm font-semibold text-stratosphere transition-colors hover:bg-stratosphere/5 lg:flex"
        >
          Chat with an Advisor
        </button>
        <button
          type="button"
          className="hidden h-8 items-center rounded-full border border-stratosphere px-3.5 text-sm font-semibold text-stratosphere transition-colors hover:bg-stratosphere/5 sm:flex"
        >
          Help
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-8 items-center gap-1 rounded-full border border-stratosphere py-1 pl-2 pr-1.5 transition-colors hover:bg-stratosphere/5"
          >
            <SquareUser className="size-4 shrink-0 text-deep-black" strokeWidth={2} />
            <span className="text-sm font-semibold text-deep-black">Gloria</span>
            <motion.span
              animate={{ rotate: menuOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown
                className="size-4 shrink-0 text-deep-black"
                strokeWidth={2}
              />
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
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
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
