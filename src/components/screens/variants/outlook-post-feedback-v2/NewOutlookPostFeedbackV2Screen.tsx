"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useFlow } from "@/components/flow/FlowProvider";
import { OutlookShell } from "@/components/prototypes/outlook/OutlookShell";
import {
  ComparisonToggle,
  SkeletonLines,
} from "@/components/prototypes/outlook/OutlookStatsPanel";
import { InfoTarget } from "@/components/prototypes/outlook/OutlookInfoTip";
import { OutlookStatsPanelPFV2 } from "./OutlookStatsPanelPFV2";
import { AllocationPie, AnimatedNumber } from "@/components/prototypes/outlook/charts";
import { computeOutlook, fmtDollars } from "@/lib/outlook";

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/**
 * Post-feedback v2 Screen 3 — a copy of the personalized-plan screen with the
 * hover-help box enabled and key terms/graphs wrapped as InfoTargets.
 */
export function NewOutlookPostFeedbackV2Screen() {
  const { answers, setOutlook, goNext, goTo } = useFlow();
  const { spendingAim, marketT, riskT, comparisonNew, customEvents } = answers.outlook;

  useEffect(() => {
    setOutlook({ comparisonNew: true });
  }, [setOutlook]);

  // First-entry reveal (plays on every arrival at this page): the grey
  // current-plan graphs render immediately and fully (no entrance fade on the
  // stats panel), with the violet layers sitting exactly on top of the grey for
  // a deliberate hold. After the hold, `revealStarted` flips and the violet
  // layers slowly morph up to the personalized values as the focal celebratory
  // beat — success first, then the asset curve, then the loss bars (each graph's
  // long duration + widened stagger lives in the chart components). The hold is
  // long enough that the eye clearly registers the grey "before" state first.
  const REVEAL_HOLD_MS = 700;
  const [revealStarted, setRevealStarted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setRevealStarted(true), REVEAL_HOLD_MS);
    return () => clearTimeout(id);
  }, []);

  const current = useMemo(
    () =>
      computeOutlook({ plan: "current", spendingAim, marketT, riskT, events: customEvents, preset: "pfV2" }),
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
        preset: "pfV2",
      }),
    [spendingAim, marketT, riskT, customEvents],
  );

  return (
    <OutlookShell
      stage={1}
      cta="Refine your Plan"
      onCta={goNext}
      onBack={() => goTo("current-outlook")}
      showInfoTip
    >
      <div className="flex min-w-0 shrink-0 flex-col gap-3 pb-2 pr-1">
        {/* Intro line — emphasis on the improved outlook */}
        <motion.h1
          {...enter(0)}
          className="text-lg font-semibold leading-snug tracking-[-0.01em] text-deep-black"
        >
          Considering{" "}
          <InfoTarget tipId="sim-scenarios" className="text-violet">
            5,000 more scenarios
          </InfoTarget>{" "}
          based on your{" "}
          <InfoTarget tipId="personalized-plan" className="text-violet">
            personalized plan
          </InfoTarget>
          ,{" "}
          <InfoTarget tipId="success" className="text-success">
            your outlook has improved.
          </InfoTarget>
        </motion.h1>

        <motion.div {...enter(0.06)} className="flex items-center justify-end">
          <InfoTarget tipId="comparison" as="div" interactive>
            <ComparisonToggle
              on={comparisonNew}
              onChange={(next) => setOutlook({ comparisonNew: next })}
            />
          </InfoTarget>
        </motion.div>

        {/* Graphs fill the remaining space. No entrance fade/slide here: the
            grey current-plan graphs must be fully on screen from frame 0 so the
            purple morph reads as a distinct beat happening on top of them. */}
        <div className="flex flex-col">
          <OutlookStatsPanelPFV2
            current={current}
            personalized={personalized}
            comparison={comparisonNew}
            revealMode="morph"
            replayNonce={revealStarted ? 1 : 0}
          />
        </div>

        {/* Description hero + fee savings, now below the graphs */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
          <motion.section
            {...enter(0.18)}
            className="flex items-center gap-5 rounded-card bg-[radial-gradient(circle_at_12%_18%,rgba(160,110,203,0.30),transparent_55%),radial-gradient(circle_at_90%_88%,rgba(201,0,172,0.14),transparent_50%),rgba(127,53,178,0.10)] p-5"
          >
            <InfoTarget tipId="allocation" as="div" className="flex size-24 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-[0_2px_10px_rgba(127,53,178,0.16)]">
              <AllocationPie
                allocation={personalized.allocation}
                palette="violet"
                className="size-full"
              />
            </InfoTarget>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-snug tracking-[-0.01em] text-deep-black">
                Your Personalized Plan{" "}
                <InfoTarget tipId="fees" className="text-violet">
                  reduces fees
                </InfoTarget>{" "}
                and involves{" "}
                <InfoTarget tipId="risk-profile" className="text-violet">
                  less risk
                </InfoTarget>
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
            <InfoTarget tipId="fee-savings" as="div">
              <p className="text-xs font-medium text-gray-1">Lifetime fee savings</p>
              <span className="mt-1 block text-2xl font-semibold tracking-[-0.01em] text-success">
                <AnimatedNumber value={personalized.feeSavings} format={fmtDollars} />
              </span>
            </InfoTarget>
            <SkeletonLines rows={2} className="mt-3" shimmer />
          </motion.section>
        </div>
      </div>
    </OutlookShell>
  );
}
