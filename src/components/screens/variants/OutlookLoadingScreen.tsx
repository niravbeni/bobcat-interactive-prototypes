"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { ShieldCheck, TrendingDown, FileText } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { OutlookTopNav } from "@/components/prototypes/outlook/OutlookTopNav";

/** How long the "creating your plan" pause runs before auto-advancing. */
const DURATION_MS = 3500;

const CARDS = [
  {
    icon: ShieldCheck,
    title: "Adding protected income",
    copy: "We blend income and growth annuities into your mix so your essentials stay covered in any market.",
  },
  {
    icon: TrendingDown,
    title: "Cutting fees with low-cost products",
    copy: "Institutional pricing on the underlying funds saves most members six figures over a lifetime.",
  },
  {
    icon: FileText,
    title: "Checking the fine print",
    copy: "Every recommendation is screened against your goals, taxes and disclosures before it reaches you.",
  },
];

/**
 * Screen 2 — a brief interstitial while the personalized plan is "built".
 * A violet arc spinner with three staggered info cards, auto-advancing to the
 * recommendation after {@link DURATION_MS}.
 */
export function OutlookLoadingScreen() {
  const { goNext } = useFlow();

  useEffect(() => {
    const t = window.setTimeout(goNext, DURATION_MS);
    return () => window.clearTimeout(t);
  }, [goNext]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-white">
      <OutlookTopNav />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        {/* Violet arc spinner */}
        <motion.svg
          viewBox="0 0 48 48"
          className="size-14"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, ease: "linear", repeat: Infinity }}
          aria-hidden="true"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#e4cff3"
            strokeWidth="5"
          />
          <path
            d="M24 4 a20 20 0 0 1 20 20"
            fill="none"
            stroke="#7f35b2"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </motion.svg>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-2xl font-semibold tracking-[-0.01em] text-deep-black"
        >
          Creating your personalized plan
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-2 max-w-[480px] text-sm text-gray-1"
        >
          Rebuilding your outlook with protected income, lower fees and your
          spending aim in mind.
        </motion.p>

        <div className="mt-10 grid w-full max-w-[860px] grid-cols-1 gap-4 sm:grid-cols-3">
          {CARDS.map((card, i) => {
            const start = 0.35 + i * 0.2;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 34, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: start,
                  type: "spring",
                  stiffness: 210,
                  damping: 22,
                }}
                className="flex min-h-[260px] flex-col items-start justify-center gap-5 rounded-card border border-stroke-subtle bg-white p-6 text-left shadow-[0_10px_30px_-12px_rgba(16,24,32,0.18)]"
              >
                <motion.span
                  initial={{ scale: 0, rotate: -35 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: start + 0.14,
                    type: "spring",
                    stiffness: 340,
                    damping: 16,
                  }}
                  className="flex size-11 items-center justify-center rounded-full bg-violet/10 text-violet"
                >
                  <card.icon className="size-5" strokeWidth={2} />
                </motion.span>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold text-deep-black">
                    {card.title}
                  </p>
                  <p className="text-xs leading-relaxed text-gray-1">
                    {card.copy}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
