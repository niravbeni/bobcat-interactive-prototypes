"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { useFlow } from "@/components/flow/FlowProvider";
import { OutlookShell } from "@/components/prototypes/outlook/OutlookShell";
import { SkeletonLines } from "@/components/prototypes/outlook/OutlookStatsPanel";
import { InfoTarget } from "@/components/prototypes/outlook/OutlookInfoTip";
import { OutlookStatsPanelPFV2 } from "./OutlookStatsPanelPFV2";
import { AllocationPie, AnimatedNumber } from "@/components/prototypes/outlook/charts";
import { OutlookLearnMore } from "@/components/prototypes/outlook/OutlookFeedback";
import { computeOutlook, fmtDollars } from "@/lib/outlook";

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/**
 * Post-feedback v2 Screen 1 — a copy of the Current outlook screen with the
 * hover-help box enabled and key terms/graphs wrapped as InfoTargets.
 */
export function CurrentOutlookPostFeedbackV2Screen() {
  const { answers, goNext, goBack } = useFlow();
  const { spendingAim, marketT, riskT, customEvents } = answers.outlook;

  const current = useMemo(
    () =>
      computeOutlook({ plan: "current", spendingAim, marketT, riskT, events: customEvents, preset: "pfV2" }),
    [spendingAim, marketT, riskT, customEvents],
  );

  return (
    <OutlookShell
      stage={0}
      cta="Personalize your Plan"
      onCta={goNext}
      onBack={goBack}
      showInfoTip
    >
      <div className="flex min-h-0 min-w-0 flex-col gap-3 pb-2 pr-1 lg:flex-1">
        {/* Intro line — sets up the baseline outlook above the graphs */}
        <motion.h1
          {...enter(0)}
          className="text-lg font-semibold leading-snug tracking-[-0.01em] text-deep-black"
        >
          Modeling{" "}
          <InfoTarget tipId="sim-scenarios" className="text-gray-1">
            5,000 market scenarios
          </InfoTarget>
          , here&apos;s how your{" "}
          <InfoTarget tipId="current-plan" className="text-gray-1">
            current plan
          </InfoTarget>{" "}
          is projected to perform.
        </motion.h1>

        {/* Graphs fill the remaining space */}
        <motion.div {...enter(0.12)} className="flex flex-col lg:min-h-0 lg:flex-1">
          <OutlookStatsPanelPFV2 current={current} comparison={false} fill />
        </motion.div>

        {/* Current-strategy diagnosis + lifetime fees, now below the graphs */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
          <motion.section
            {...enter(0.18)}
            className="flex items-center gap-5 rounded-card bg-[radial-gradient(circle_at_15%_20%,#f5f7f9,transparent_58%),radial-gradient(circle_at_85%_88%,#e2e6ea,transparent_52%),#eceef0] p-5"
          >
            <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-[0_2px_10px_rgba(16,24,32,0.08)]">
              <AllocationPie
                allocation={current.allocation}
                palette="grey"
                className="size-full"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-snug tracking-[-0.01em] text-deep-black">
                Your current strategy exposes you to{" "}
                <InfoTarget tipId="volatility" className="text-gray-1">
                  High Volatility
                </InfoTarget>{" "}
                and{" "}
                <InfoTarget tipId="fees" className="text-gray-1">
                  Higher Fees
                </InfoTarget>
              </h2>
              <SkeletonLines rows={2} className="mt-3 max-w-[420px]" shimmer />
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
            {...enter(0.24)}
            className="flex flex-col justify-center rounded-card border border-stroke-subtle bg-white p-5"
          >
            <InfoTarget tipId="fees" as="div">
              <p className="text-xs font-medium text-gray-1">Lifetime fees paid</p>
              <AnimatedNumber
                value={current.lifetimeFees}
                format={fmtDollars}
                className="mt-1 text-2xl font-semibold tracking-[-0.01em] text-deep-black"
              />
            </InfoTarget>
            <SkeletonLines rows={2} className="mt-3" shimmer />
          </motion.section>
        </div>
      </div>
    </OutlookShell>
  );
}
