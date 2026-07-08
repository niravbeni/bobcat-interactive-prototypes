"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFlow } from "@/components/flow/FlowProvider";
import { OutlookShell } from "@/components/prototypes/outlook/OutlookShell";
import { ComparisonToggle } from "@/components/prototypes/outlook/OutlookStatsPanel";
import { InfoTarget } from "@/components/prototypes/outlook/OutlookInfoTip";
import { OutlookStatsPanelPFV2 } from "./OutlookStatsPanelPFV2";
import { AllocationPie, AnimatedNumber } from "@/components/prototypes/outlook/charts";
import { SnapSlider } from "@/components/ui/SnapSlider";
import {
  ALLOCATION_LABELS,
  computeOutlook,
  riskChangeCopy,
} from "@/lib/outlook";

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/** Seven magnetic stops across the Low → High risk track. */
const RISK_STOPS = [0, 17, 33, 50, 67, 83, 100];

const PIE_VIOLETS = ["#7f35b2", "#a06ecb", "#c49ae2", "#e0c8f3", "#8f4fc0"];

/**
 * Post-feedback v2 Screen 4 — a copy of the Refine screen with the hover-help
 * box enabled and key terms/graphs wrapped as InfoTargets.
 */
export function RefineOutlookPostFeedbackV2Screen() {
  const { answers, setOutlook, goBack } = useFlow();
  const { spendingAim, marketT, riskT, comparisonRefine, customEvents } = answers.outlook;

  useEffect(() => {
    setOutlook({ comparisonRefine: true });
  }, [setOutlook]);

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

  const riskLabel = riskT >= 65 ? "Higher" : riskT <= 35 ? "Lower" : "Balanced";

  return (
    <OutlookShell
      stage={2}
      cta="Implement your Plan"
      onCta={() => {}}
      onBack={goBack}
      sidebarComplete
      showInfoTip
    >
      <div className="flex min-h-0 min-w-0 flex-col gap-3 pb-2 pr-1 lg:flex-1">
        <motion.section
          {...enter(0)}
          className="rounded-card bg-[radial-gradient(circle_at_12%_18%,rgba(160,110,203,0.30),transparent_55%),radial-gradient(circle_at_90%_88%,rgba(201,0,172,0.14),transparent_50%),rgba(127,53,178,0.10)] p-5"
        >
          <h1 className="text-lg font-semibold leading-snug tracking-[-0.01em] text-deep-black">
            Last step, refine your plan by choosing the{" "}
            <InfoTarget tipId="risk-profile" className="text-violet">
              risk level
            </InfoTarget>
            {" you\u2019re comfortable with"}
          </h1>

          <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr]">
            {/* Risk slider */}
            <InfoTarget
              tipId="risk-profile"
              as="div"
              interactive
              className="flex flex-col justify-center rounded-card bg-white/70 px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
                  Risk profile
                </span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={riskLabel}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="text-sm font-semibold text-violet"
                  >
                    {riskLabel} risk
                  </motion.span>
                </AnimatePresence>
              </div>
              <SnapSlider
                aria-label="Risk profile"
                value={riskT}
                snapPoints={RISK_STOPS}
                onChange={(t) => setOutlook({ riskT: t })}
                className="mt-2"
                accent="violet"
              />
              <div className="mt-0.5 flex items-center justify-between text-[11px] text-gray-2">
                <span>Low</span>
                <span>High</span>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-gray-1">
                Every point on this track is an efficient plan — moving it
                trades protection for growth, never quality.
              </p>
            </InfoTarget>

            {/* Allocation pie + breakdown + what's-changed copy */}
            <InfoTarget tipId="allocation" as="div" className="flex items-center gap-5">
              <div className="flex size-28 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-[0_2px_10px_rgba(127,53,178,0.16)]">
                <AllocationPie
                  allocation={personalized.allocation}
                  palette="violet"
                  className="size-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <ul className="flex flex-col gap-1">
                  {ALLOCATION_LABELS.map(({ key, label }, i) => (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="flex items-center gap-2 text-gray-1">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: PIE_VIOLETS[i] }}
                        />
                        {label}
                      </span>
                      <AnimatedNumber
                        value={personalized.allocation[key]}
                        format={(n) => `${Math.round(n)}%`}
                        className="font-semibold tabular-nums text-deep-black"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </InfoTarget>
          </div>

          <div className="mt-4 rounded-card bg-white/70 px-5 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
              Here&rsquo;s what&rsquo;s changed
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={riskChangeCopy(riskT)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="mt-1 text-xs leading-relaxed text-deep-black"
              >
                {riskChangeCopy(riskT)}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.section>

        <motion.div {...enter(0.1)} className="flex items-center justify-end">
          <InfoTarget tipId="comparison" as="div" interactive>
            <ComparisonToggle
              on={comparisonRefine}
              onChange={(next) => setOutlook({ comparisonRefine: next })}
            />
          </InfoTarget>
        </motion.div>

        <motion.div {...enter(0.16)} className="flex min-h-0 flex-col lg:flex-1">
          <OutlookStatsPanelPFV2
            current={current}
            personalized={personalized}
            comparison={comparisonRefine}
            fill
          />
        </motion.div>
      </div>
    </OutlookShell>
  );
}
