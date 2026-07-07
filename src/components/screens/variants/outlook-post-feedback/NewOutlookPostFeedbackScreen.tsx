"use client";

import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useFlow } from "@/components/flow/FlowProvider";
import { OutlookShell } from "@/components/prototypes/outlook/OutlookShell";
import {
  ComparisonToggle,
  SkeletonLines,
} from "@/components/prototypes/outlook/OutlookStatsPanel";
import { OutlookStatsPanelPF } from "./OutlookStatsPanelPF";
import { AllocationPie, AnimatedNumber } from "@/components/prototypes/outlook/charts";
import { computeOutlook, fmtDollars } from "@/lib/outlook";

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/**
 * Post-feedback Screen 3 — a copy of the enhanced personalized-plan screen.
 * This is the branch where post-feedback edits will land; the enhanced and
 * original flows stay untouched.
 */
export function NewOutlookPostFeedbackScreen() {
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
        {/* Intro line — emphasis on the improved outlook */}
        <motion.h1
          {...enter(0)}
          className="text-lg font-semibold leading-snug tracking-[-0.01em] text-deep-black"
        >
          Considering{" "}
          <span className="text-violet">5,000 more scenarios</span> based on your
          personalized plan,{" "}
          <span className="text-success">your outlook has improved.</span>
        </motion.h1>

        <motion.div {...enter(0.06)} className="flex items-center justify-end">
          <ComparisonToggle
            on={comparisonNew}
            onChange={(next) => setOutlook({ comparisonNew: next })}
          />
        </motion.div>

        {/* Graphs fill the remaining space */}
        <motion.div {...enter(0.12)} className="flex flex-col lg:min-h-0 lg:flex-1">
          <OutlookStatsPanelPF
            current={current}
            personalized={personalized}
            comparison={comparisonNew}
            fill
          />
        </motion.div>

        {/* Description hero + fee savings, now below the graphs */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
          <motion.section
            {...enter(0.18)}
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
              <h2 className="text-lg font-semibold leading-snug tracking-[-0.01em] text-deep-black">
                Your Personalized Plan{" "}
                <span className="text-violet">reduces fees</span> and involves{" "}
                <span className="text-violet">less risk</span>
              </h2>
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
            {...enter(0.24)}
            className="flex flex-col justify-center rounded-card border border-stroke-subtle bg-white p-5"
          >
            <p className="text-xs font-medium text-gray-1">Lifetime fee savings</p>
            <span className="mt-1 text-2xl font-semibold tracking-[-0.01em] text-success">
              <AnimatedNumber value={personalized.feeSavings} format={fmtDollars} />
            </span>
            <SkeletonLines rows={2} className="mt-3" shimmer />
          </motion.section>
        </div>
      </div>
    </OutlookShell>
  );
}
