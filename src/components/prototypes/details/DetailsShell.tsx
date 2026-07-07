"use client";

import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { OutlookTopNav } from "@/components/prototypes/outlook/OutlookTopNav";
import { DetailsSidebar } from "./DetailsSidebar";

/**
 * Viewport-locked page shell for the Details flow. Mirrors OutlookShell's
 * whole-screen mount fade and h-screen flex layout, and reuses the Outlook top
 * nav (with the Details tab active).
 *
 * - Detail-page mode (default): top nav + DetailsSidebar + a scrollable main
 *   column whose header is a "Back to summary" link (no bottom stepper).
 * - Hub mode (`withSidebar={false}`): top nav + centered content, no sidebar
 *   and no back-to-summary link.
 */
export function DetailsShell({
  children,
  withSidebar = true,
}: {
  children: React.ReactNode;
  withSidebar?: boolean;
}) {
  const { goTo } = useFlow();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-screen flex-col overflow-hidden bg-white"
    >
      <OutlookTopNav activeTab="Details" />

      {withSidebar ? (
        <div className="flex min-h-0 w-full flex-1 gap-4 px-4 pb-4 pt-4">
          <DetailsSidebar />
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <main className="scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto rounded-field bg-ghost-white px-5 py-5 xl:px-10 xl:py-6">
              <div className="mx-auto flex w-full max-w-[820px] flex-1 flex-col xl:max-w-[1040px]">
                <button
                  type="button"
                  onClick={() => goTo("details-home")}
                  className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-deep-black transition-opacity hover:opacity-60"
                >
                  <ChevronLeft className="size-4 shrink-0" strokeWidth={2.2} />
                  Back to summary
                </button>
                {children}
              </div>
            </main>
          </div>
        </div>
      ) : (
        <main className="scrollbar-slim flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-white px-4 pb-10 pt-6">
          {children}
        </main>
      )}
    </motion.div>
  );
}
