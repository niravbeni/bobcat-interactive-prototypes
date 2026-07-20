"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useFlow } from "@/components/flow/FlowProvider";
import { ComparisonToggle } from "@/components/prototypes/outlook/OutlookStatsPanel";
import { computeOutlook } from "@/lib/outlook";
import { SignatureOutlookShell } from "./SignatureOutlookShell";
import { SignatureOutlookStats } from "./SignatureOutlookStats";
import { SignatureInfoCard } from "./SignatureInfoCard";
import { SectionHeading } from "./SectionHeading";
import { AdditionalKeyBenefits, sigAllocation } from "./sigOutlookCharts";
import { SIG_EASE } from "./shared";

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: SIG_EASE, delay },
});

/** Grey-hold, then staggered violet morph across the three summary cards. */
const REVEAL_HOLD_MS = 700;

/**
 * Signature "Your Personalized Plan" (stage 1). The personalized outlook is
 * revealed with a 700ms grey hold then a staggered morph (success → assets →
 * allocation), a comparison toggle switching the summary cards between gradient
 * (on) and white-with-colored-charts (off), two info cards, the tabbed stats
 * panel and the "Additional key benefits" strip.
 */
export function SignaturePlanScreen() {
  const { answers, setOutlook, goNext, goBack } = useFlow();
  const { spendingAim, marketT, riskT, comparisonNew, customEvents } = answers.outlook;

  useEffect(() => {
    setOutlook({ comparisonNew: true });
  }, [setOutlook]);

  // Plan is the FIRST time the personalized outlook is shown, so it plays a
  // one-time staged grey→violet morph across the three summary cards on entry
  // (success → assets → allocation). This is a deliberate, first-impression
  // reveal — the Refine screen intentionally does NOT reveal (it renders the
  // same stats live so they re-tween continuously as the risk slider moves).
  const [reveal, setReveal] = useState({
    success: false,
    assets: false,
    alloc: false,
  });
  useEffect(() => {
    const t1 = window.setTimeout(
      () => setReveal((r) => ({ ...r, success: true })),
      REVEAL_HOLD_MS,
    );
    const t2 = window.setTimeout(
      () => setReveal((r) => ({ ...r, assets: true })),
      REVEAL_HOLD_MS + 320,
    );
    const t3 = window.setTimeout(
      () => setReveal((r) => ({ ...r, alloc: true })),
      REVEAL_HOLD_MS + 640,
    );
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

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
      stage={1}
      cta="Refine your personalized plan"
      onCta={goNext}
      onBack={goBack}
    >
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4">
        {/* Hero panel: title + comparison toggle + info cards */}
        <motion.section
          {...enter(0)}
          className="flex flex-col gap-6 rounded-card bg-white p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <SectionHeading>Your Personalized Plan</SectionHeading>
              <p className="text-sm leading-relaxed text-gray-1">
                Simulated against 5,000 more scenarios based on your details, your
                outlook has improved.
              </p>
            </div>
            <ComparisonToggle
              accent="stratosphere"
              on={comparisonNew}
              onChange={(next) => setOutlook({ comparisonNew: next })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <SignatureInfoCard iconSrc="/signature/icon-plan.svg" title="What you need to do" />
            <SignatureInfoCard
              iconSrc="/signature/icon-info.svg"
              title="How this affects your retirement plan"
            />
          </div>
        </motion.section>

        <motion.div {...enter(0.1)}>
          {/* `reveal` drives the one-time staged grey→violet morph (Plan only). */}
          <SignatureOutlookStats
            current={current}
            personalized={personalized}
            comparison={comparisonNew}
            allocation={allocation}
            reveal={reveal}
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
