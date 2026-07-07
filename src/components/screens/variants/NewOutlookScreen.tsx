"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { useFlow } from "@/components/flow/FlowProvider";
import { OutlookShell } from "@/components/prototypes/outlook/OutlookShell";
import {
  ComparisonToggle,
  OutlookStatsPanel,
  SkeletonLines,
} from "@/components/prototypes/outlook/OutlookStatsPanel";
import { AllocationPie, AnimatedNumber } from "@/components/prototypes/outlook/charts";
import { computeOutlook, fmtDollars } from "@/lib/outlook";

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/**
 * Screen 3 — the personalized plan recommendation. Both plans are computed
 * from the same slider inputs, the green pills are live deltas between them,
 * and the comparison toggle layers the grey "current" series into every chart.
 * Clicking a stat card zooms it into its detail tab.
 */
export function NewOutlookScreen() {
  const { answers, setOutlook, goNext, goTo } = useFlow();
  const { spendingAim, marketT, riskT, comparisonNew, customEvents } = answers.outlook;

  const current = useMemo(
    () =>
      computeOutlook({ plan: "current", spendingAim, marketT, riskT, events: customEvents }),
    [spendingAim, marketT, riskT, customEvents],
  );
  const personalized = useMemo(
    () =>
      computeOutlook({
        plan: "personalized",
        spendingAim,
        marketT,
        riskT,
        events: customEvents,
      }),
    [spendingAim, marketT, riskT, customEvents],
  );

  return (
    // Back skips the loader (it would just auto-advance forward again).
    <OutlookShell
      stage={1}
      cta="Refine your Plan"
      onCta={goNext}
      onBack={() => goTo("current-outlook")}
    >
      <div className="flex min-w-0 flex-col gap-3 pb-2 pr-1">
        {/* Header: personalized-plan hero + fee savings */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
          <motion.section
            {...enter(0)}
            className="flex items-center gap-5 rounded-card bg-violet/10 p-5"
          >
            <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-[0_2px_10px_rgba(127,53,178,0.16)]">
              <AllocationPie
                allocation={personalized.allocation}
                palette="violet"
                className="size-full"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-snug tracking-[-0.01em] text-deep-black">
                Your Personalized Plan{" "}
                <span className="text-violet">reduces fees</span> and involves{" "}
                <span className="text-violet">less risk</span>
              </h1>
              <SkeletonLines rows={2} className="mt-3 max-w-[420px]" />
              <button
                type="button"
                className="mt-3 inline-block text-xs font-medium text-violet underline transition-opacity hover:opacity-70"
              >
                Learn more
              </button>
            </div>
          </motion.section>

          <motion.section
            {...enter(0.08)}
            className="flex flex-col justify-center rounded-card border border-stroke-subtle bg-white p-5"
          >
            <p className="text-xs font-medium text-gray-1">Lifetime fee savings</p>
            <span className="mt-1 text-2xl font-semibold tracking-[-0.01em] text-success">
              <AnimatedNumber value={personalized.feeSavings} format={fmtDollars} />
            </span>
            <SkeletonLines rows={2} className="mt-3" />
          </motion.section>
        </div>

        <motion.div {...enter(0.14)} className="flex items-center justify-end">
          <ComparisonToggle
            on={comparisonNew}
            onChange={(next) => setOutlook({ comparisonNew: next })}
          />
        </motion.div>

        <motion.div {...enter(0.2)}>
          <OutlookStatsPanel
            current={current}
            personalized={personalized}
            comparison={comparisonNew}
          />
        </motion.div>
      </div>
    </OutlookShell>
  );
}
