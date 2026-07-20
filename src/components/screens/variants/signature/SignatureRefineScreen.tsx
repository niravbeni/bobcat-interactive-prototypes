"use client";

import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useFlow } from "@/components/flow/FlowProvider";
import { ComparisonToggle } from "@/components/prototypes/outlook/OutlookStatsPanel";
import { computeOutlook } from "@/lib/outlook";
import { SignatureOutlookShell } from "./SignatureOutlookShell";
import { SignatureOutlookStats } from "./SignatureOutlookStats";
import { SignatureInfoCard } from "./SignatureInfoCard";
import { SectionHeading } from "./SectionHeading";
import {
  AdditionalKeyBenefits,
  RiskSlider,
  sigAllocation,
} from "./sigOutlookCharts";
import { SIG_EASE } from "./shared";

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: SIG_EASE, delay },
});

/**
 * Signature "Refine your plan" (stage 2). A live 7-stop risk slider (its card
 * fills with the signature purple gradient while engaged) drives the shared
 * outlook state, so the summary charts and asset allocation re-weight with a
 * live spring as the slider moves.
 */
export function SignatureRefineScreen() {
  const { answers, setOutlook, goBack } = useFlow();
  const { spendingAim, marketT, riskT, comparisonRefine, customEvents } = answers.outlook;

  useEffect(() => {
    setOutlook({ comparisonRefine: true });
  }, [setOutlook]);

  const current = useMemo(
    () =>
      computeOutlook({
        plan: "current",
        spendingAim,
        marketT,
        riskT,
        events: customEvents,
        preset: "sig",
      }),
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
        preset: "sig",
      }),
    [spendingAim, marketT, riskT, customEvents],
  );
  const allocation = useMemo(() => sigAllocation(riskT), [riskT]);

  return (
    <SignatureOutlookShell
      stage={2}
      cta="Confirm plan with advisor"
      onCta={() => {}}
      onBack={goBack}
      sidebarComplete
    >
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4">
        <motion.section
          {...enter(0)}
          className="flex flex-col gap-6 rounded-card bg-white p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SectionHeading>Refine your plan</SectionHeading>
            <ComparisonToggle
              accent="stratosphere"
              on={comparisonRefine}
              onChange={(next) => setOutlook({ comparisonRefine: next })}
            />
          </div>

          <RiskSlider riskT={riskT} onChange={(t) => setOutlook({ riskT: t })} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <SignatureInfoCard iconSrc="/signature/icon-plan.svg" title="How this works" />
            <SignatureInfoCard iconSrc="/signature/icon-info.svg" title="What's changed?" />
          </div>
        </motion.section>

        <motion.div {...enter(0.1)}>
          {/* Deliberately NO `reveal` prop: unlike the Plan screen's one-time
              staged grey→violet morph, Refine keeps the stats LIVE so the
              headlines, sparklines and allocation re-tween continuously as the
              risk slider moves. A staged reveal here would fight the slider. */}
          <SignatureOutlookStats
            current={current}
            personalized={personalized}
            comparison={comparisonRefine}
            allocation={allocation}
            customEvents={customEvents}
          />
        </motion.div>

        <motion.div {...enter(0.18)}>
          <AdditionalKeyBenefits />
        </motion.div>
      </div>
    </SignatureOutlookShell>
  );
}
