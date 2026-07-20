"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { OutlookTopNav } from "@/components/prototypes/outlook/OutlookTopNav";
import {
  OutlookLoadingContent,
  useOutlookLoadingReady,
} from "./OutlookLoadingContent";

/**
 * Screen 2 — a brief interstitial while the personalized plan is "built".
 * A violet arc spinner with three staggered info cards.
 *
 * By default it auto-advances to the recommendation after the shared loading
 * duration. When {@link manualContinue} is set, it instead settles into a
 * "ready" state (spinner swaps to a check, copy updates) and surfaces a
 * bottom-right Continue button so the member can read the content before moving
 * on.
 */
export function OutlookLoadingScreen({
  manualContinue = false,
}: {
  /** When true, wait for an explicit Continue click instead of auto-advancing. */
  manualContinue?: boolean;
}) {
  const { goNext } = useFlow();
  const ready = useOutlookLoadingReady(manualContinue);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-white">
      <OutlookTopNav />
      <OutlookLoadingContent ready={ready} />

      {manualContinue && (
        <AnimatePresence>
          {ready && (
            <motion.button
              type="button"
              onClick={goNext}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="absolute bottom-6 right-6 flex items-center gap-2 whitespace-nowrap rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(127,53,178,0.6)] transition-colors hover:brightness-110"
            >
              Continue
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
