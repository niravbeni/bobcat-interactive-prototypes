"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { useFlow } from "@/components/flow/FlowProvider";
import { OutlookShell } from "@/components/prototypes/outlook/OutlookShell";
import {
  OutlookStatsPanel,
  SkeletonLines,
} from "@/components/prototypes/outlook/OutlookStatsPanel";
import { AllocationPie, AnimatedNumber } from "@/components/prototypes/outlook/charts";
import { OutlookLearnMore } from "@/components/prototypes/outlook/OutlookFeedback";
import { computeOutlook, fmtDollars } from "@/lib/outlook";

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/**
 * Screen 1 — the "typical retail experience" outlook, all in grey. Every
 * number comes from computeOutlook("current") with the live sidebar sliders,
 * so dragging Spending aim or Market scenario reshapes the whole page.
 */
export function CurrentOutlookScreen() {
  const { answers, goNext, goBack } = useFlow();
  const { spendingAim, marketT, riskT, customEvents } = answers.outlook;

  const current = useMemo(
    () =>
      computeOutlook({ plan: "current", spendingAim, marketT, riskT, events: customEvents }),
    [spendingAim, marketT, riskT, customEvents],
  );

  return (
    <OutlookShell
      stage={0}
      cta="Personalize your Plan"
      onCta={goNext}
      onBack={goBack}
    >
      <div className="flex min-h-0 min-w-0 flex-col gap-3 pb-2 pr-1 lg:flex-1">
        {/* Header: current-strategy diagnosis + lifetime fees */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
          <motion.section
            {...enter(0)}
            className="flex items-center gap-5 rounded-card bg-[#eceef0] p-5"
          >
            <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-[0_2px_10px_rgba(16,24,32,0.08)]">
              <AllocationPie
                allocation={current.allocation}
                palette="grey"
                className="size-full"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-snug tracking-[-0.01em] text-deep-black">
                Your current strategy exposes you to{" "}
                <span className="text-gray-1">High Volatility</span> and{" "}
                <span className="text-gray-1">Higher Fees</span>
              </h1>
              <SkeletonLines rows={2} className="mt-3 max-w-[420px]" />
              <OutlookLearnMore
                className="mt-3 inline-block text-xs font-medium text-deep-black underline transition-opacity hover:opacity-70"
                modal={{
                  eyebrow: "Your current strategy",
                  title: "Why a typical retail plan costs you",
                  copy: "A standard retail portfolio leans heavily on equities with no protected income, so it swings hard in bad markets and pays higher lifetime fees. Your personalized plan is built to smooth both.",
                  bullets: [
                    "Higher volatility in the years that matter most",
                    "Six-figure fees over a lifetime",
                    "No protected income floor",
                  ],
                }}
              >
                Learn more
              </OutlookLearnMore>
            </div>
          </motion.section>

          <motion.section
            {...enter(0.08)}
            className="flex flex-col justify-center rounded-card border border-stroke-subtle bg-white p-5"
          >
            <p className="text-xs font-medium text-gray-1">Lifetime fees paid</p>
            <AnimatedNumber
              value={current.lifetimeFees}
              format={fmtDollars}
              className="mt-1 text-2xl font-semibold tracking-[-0.01em] text-deep-black"
            />
            <SkeletonLines rows={2} className="mt-3" />
          </motion.section>
        </div>

        <motion.div {...enter(0.2)} className="flex min-h-0 flex-col lg:flex-1">
          <OutlookStatsPanel current={current} comparison={false} fill />
        </motion.div>
      </div>
    </OutlookShell>
  );
}
