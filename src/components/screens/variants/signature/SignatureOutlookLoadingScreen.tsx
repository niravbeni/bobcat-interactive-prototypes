"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import {
  OutlookLoadingContent,
  useOutlookLoadingReady,
} from "../OutlookLoadingContent";
import { SignatureShell, NavPill } from "./SignatureShell";
import { SIG_EASE } from "./shared";

/**
 * Signature-flow loading interstitial. Reuses the shared "building your plan"
 * animation ({@link OutlookLoadingContent}) but renders it inside the Signature
 * chrome (tabs-mode top nav with "Your Outlook" active, matching sig-plan /
 * sig-refine) so the hand-off in and out of the loading state reads as part of
 * the flow. Always manual-continue: once ready, a Continue NavPill appears in
 * the sub-bar and advances to the personalized plan.
 */
export function SignatureOutlookLoadingScreen() {
  const { goNext, goBack, goTo } = useFlow();
  const ready = useOutlookLoadingReady(true);

  return (
    <SignatureShell
      mode="tabs"
      askPill={false}
      activeTab="Your Outlook"
      onSelectTab={(tab) => {
        if (tab === "Your Details") goTo("sig-home");
        else if (tab === "Your Outlook") goTo("sig-plan");
      }}
      subBar={{
        left: (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1 text-sm font-medium text-deep-black transition-opacity hover:opacity-60"
          >
            <ChevronLeft className="size-4" strokeWidth={2.2} />
            Back
          </button>
        ),
        right: (
          <AnimatePresence>
            {ready ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.4, ease: SIG_EASE }}
              >
                <NavPill onClick={goNext} shape="rounded">
                  Continue
                </NavPill>
              </motion.div>
            ) : null}
          </AnimatePresence>
        ),
      }}
    >
      <OutlookLoadingContent ready={ready} />
    </SignatureShell>
  );
}
