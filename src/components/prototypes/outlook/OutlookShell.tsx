"use client";

import { motion } from "motion/react";
import { OutlookTopNav } from "./OutlookTopNav";
import { OutlookSidebar } from "./OutlookSidebar";
import { OutlookStepper } from "./OutlookStepper";
import { OutlookFeedbackProvider, type OutlookModalOpts } from "./OutlookFeedback";

/**
 * Viewport-locked page shell for the Outlook flow: Figma-style top nav, a
 * full-height left panel running from under the nav to the bottom of the page,
 * and a right-hand column holding the internally-scrolling main content with
 * the journey stepper pinned to its bottom (to the right of the sidebar, not
 * underneath it). Mirrors AppShell's `fill` behavior without the shared chrome.
 */
export function OutlookShell({
  children,
  stage,
  cta,
  onCta,
  onBack,
  sidebarComplete = false,
  ctaModal,
}: {
  children: React.ReactNode;
  /** Active stepper stage, 0..3. */
  stage: number;
  cta: string;
  onCta: () => void;
  onBack: () => void;
  sidebarComplete?: boolean;
  /** When set, the stepper CTA opens this confirmation modal instead of onCta. */
  ctaModal?: OutlookModalOpts;
}) {
  return (
    <OutlookFeedbackProvider>
      {/* A gentle whole-screen fade on mount so each route change eases in
          cohesively (chrome + content together) instead of the nav/sidebar/
          stepper popping while only the content staggers. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-screen flex-col overflow-hidden bg-white"
      >
        <OutlookTopNav />
        <div className="flex min-h-0 w-full flex-1 gap-4 px-4 pb-4 pt-4">
          <OutlookSidebar complete={sidebarComplete} />
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            {/* Extra bottom padding lets the last content scroll fully into view
                from behind the floating stepper. */}
            <main className="scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto pb-20">
              {children}
            </main>
            {/* Fade so content dissolves as it scrolls behind the stepper. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/85 to-transparent" />
            <div className="absolute inset-x-0 bottom-0">
              <OutlookStepper
                active={stage}
                cta={cta}
                onCta={onCta}
                onBack={onBack}
                ctaModal={ctaModal}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </OutlookFeedbackProvider>
  );
}
