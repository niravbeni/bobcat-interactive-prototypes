"use client";

import { useEffect, useMemo } from "react";
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
 * Enhanced Screen 3 — identical to NewOutlookScreen but with a violet aurora
 * hero, shimmering skeleton copy and the enhanced stats panel (asset-curve
 * gradient wash). The original stays untouched.
 */
export function NewOutlookEnhancedScreen() {
  const { answers, setOutlook, goNext, goTo } = useFlow();
  const { spendingAim, marketT, riskT, comparisonNew, customEvents } = answers.outlook;

  // Comparison always starts on when you enter the personalised plan page.
  useEffect(() => {
    setOutlook({ comparisonNew: true });
  }, [setOutlook]);

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
      <div className="flex min-h-0 min-w-0 flex-col gap-3 pb-2 pr-1 lg:flex-1">
        {/* Header: personalized-plan hero + fee savings */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
          <motion.section
            {...enter(0)}
            className="flex items-center gap-5 rounded-card bg-[radial-gradient(circle_at_12%_18%,rgba(160,110,203,0.30),transparent_55%),radial-gradient(circle_at_90%_88%,rgba(201,0,172,0.14),transparent_50%),rgba(127,53,178,0.10)] p-5"
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
              <SkeletonLines rows={2} className="mt-3 max-w-[420px]" shimmer />
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
            <SkeletonLines rows={2} className="mt-3" shimmer />
          </motion.section>
        </div>

        <motion.div {...enter(0.14)} className="flex items-center justify-end">
          <ComparisonToggle
            on={comparisonNew}
            onChange={(next) => setOutlook({ comparisonNew: next })}
          />
        </motion.div>

        <motion.div {...enter(0.2)} className="flex min-h-0 flex-col lg:flex-1">
          <OutlookStatsPanel
            current={current}
            personalized={personalized}
            comparison={comparisonNew}
            enhanced
            fill
          />
        </motion.div>
      </div>
    </OutlookShell>
  );
}
