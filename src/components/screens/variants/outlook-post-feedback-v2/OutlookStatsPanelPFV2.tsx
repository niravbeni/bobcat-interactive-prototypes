"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/cn";
import { fmtDollars, type OutlookStats } from "@/lib/outlook";
import { SkeletonLines } from "@/components/prototypes/outlook/OutlookStatsPanel";
import { AnimatedNumber, AssetCurve } from "@/components/prototypes/outlook/charts";
import { InfoTarget } from "@/components/prototypes/outlook/OutlookInfoTip";
import {
  SuccessDelta,
  LossBars,
  avgLifetimeDelta,
  netLossOver30y,
  type RevealMode,
} from "../outlook-post-feedback/pfCharts";

/* ------------------------------------------------------------- metrics -- */

type OutlookMetric = "success" | "assets" | "loss";

const METRIC_TITLES: Record<OutlookMetric, string> = {
  success: "Chance of success",
  assets: "Most likely amount of assets remaining over your lifetime",
  loss: "Your investment approach could result in asset losses",
};

interface MetricProps {
  current: OutlookStats;
  personalized?: OutlookStats;
  comparison: boolean;
  tall?: boolean;
  fill?: boolean;
  /** PF v2 first-entry "purple reveals over grey" reveal choreography. */
  revealMode?: RevealMode;
  /** Bump to replay the reveal (driven by the debug toggle). */
  replayNonce?: number;
}

/** The visualization for a metric (post-feedback designs). */
function MetricVisual({
  metric,
  current,
  personalized,
  comparison,
  tall,
  fill,
  revealMode,
  replayNonce,
}: MetricProps & { metric: OutlookMetric }) {
  switch (metric) {
    case "success":
      return (
        <SuccessDelta
          current={current}
          personalized={personalized}
          comparison={comparison}
          tall={tall}
          fill={fill}
          revealMode={revealMode}
          replayNonce={replayNonce}
        />
      );
    case "assets": {
      const overlay = personalized && comparison ? current : undefined;
      const heroCurrent = personalized ? overlay : current;
      return (
        <AssetCurve
          current={heroCurrent}
          personalized={personalized}
          showLegend={!!overlay}
          tall={tall}
          fill={fill}
          areaFill
          revealMode={revealMode}
          replayNonce={replayNonce}
        />
      );
    }
    case "loss":
      return (
        <LossBars
          current={current}
          personalized={personalized}
          comparison={comparison}
          tall={tall}
          fill={fill}
          revealMode={revealMode}
          replayNonce={replayNonce}
        />
      );
  }
}

/** Real explanatory copy under each visual (replaces the blocked-out copy). */
function MetricSubtitle({
  metric,
  current,
  personalized,
  comparison,
}: MetricProps & { metric: OutlookMetric }) {
  const hero = personalized ?? current;
  switch (metric) {
    case "success":
      return (
        <p className="text-sm leading-relaxed text-gray-1">
          Chance that your assets will last for your full expected lifetime.
        </p>
      );
    case "assets":
      return (
        <div className="flex flex-col gap-1 text-sm leading-relaxed text-gray-1">
          {personalized && comparison ? (
            <p>
              <span className="font-semibold text-deep-black">
                +
                <AnimatedNumber
                  value={avgLifetimeDelta(current, personalized)}
                  format={fmtDollars}
                />
              </span>{" "}
              on average over your lifetime
            </p>
          ) : null}
          <p>
            Ending at{" "}
            <span className="font-semibold text-deep-black">
              <AnimatedNumber value={hero.assetsAt90} format={fmtDollars} />
            </span>{" "}
            at age 90
          </p>
        </div>
      );
    case "loss":
      return (
        <div className="text-sm leading-relaxed text-gray-1">
          <p className="text-deep-black">
            There is a <span className="font-semibold">50% chance</span>:
          </p>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
            <li>
              you will lose{" "}
              <span className="font-semibold text-violet">
                <AnimatedNumber value={hero.potentialLoss} format={fmtDollars} />
              </span>{" "}
              in any one year
            </li>
            <li>
              net losses over 30 years will be{" "}
              <span className="font-semibold text-violet">
                <AnimatedNumber
                  value={netLossOver30y(hero.potentialLoss)}
                  format={fmtDollars}
                />
              </span>
            </li>
          </ul>
        </div>
      );
  }
}

/* ----------------------------------------------------- detail copy panel -- */

function DetailCopyPanelPF({
  metric,
  current,
  personalized,
  comparison,
}: MetricProps & { metric: OutlookMetric }) {
  return (
    <div className="flex min-w-0 flex-col gap-5 rounded-card bg-ghost-white p-5 lg:h-full">
      <MetricSubtitle
        metric={metric}
        current={current}
        personalized={personalized}
        comparison={comparison}
      />
      <div className="flex flex-col gap-3">
        <div className="h-3 w-2/5 rounded-full skeleton-shimmer" />
        <SkeletonLines rows={4} shimmer />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-3 w-1/3 rounded-full skeleton-shimmer" />
        <SkeletonLines rows={3} shimmer />
      </div>
      <button
        type="button"
        className="mt-auto pt-2 text-left text-xs font-medium text-violet underline transition-opacity hover:opacity-70"
      >
        Learn more
      </button>
    </div>
  );
}

/* --------------------------------------------------------- summary card -- */

function PFCard({
  metric,
  current,
  personalized,
  comparison,
  fill,
  revealMode,
  replayNonce,
  onClick,
}: MetricProps & { metric: OutlookMetric; onClick?: () => void }) {
  const Tag = onClick ? motion.button : motion.div;
  return (
    <Tag
      layoutId={`pf-v2-card-${metric}`}
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col rounded-card border border-stroke-subtle bg-white p-4 text-left",
        fill && "lg:h-full",
        onClick &&
          "cursor-pointer transition-shadow hover:shadow-[0_8px_28px_rgba(16,24,32,0.09)]",
      )}
    >
      <p className="text-sm font-semibold leading-snug text-deep-black">
        {METRIC_TITLES[metric]}
      </p>
      <InfoTarget
        tipId={metric}
        as="div"
        className={cn("mt-3 w-full min-w-0", fill && "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col")}
      >
        <MetricVisual
          metric={metric}
          current={current}
          personalized={personalized}
          comparison={comparison}
          fill={fill}
          revealMode={revealMode}
          replayNonce={replayNonce}
        />
      </InfoTarget>
      <div className="mt-5">
        <MetricSubtitle
          metric={metric}
          current={current}
          personalized={personalized}
          comparison={comparison}
        />
      </div>
    </Tag>
  );
}

function SummaryRow({
  current,
  personalized,
  comparison,
  fill,
  revealMode,
  replayNonce,
  onCardClick,
}: MetricProps & { onCardClick?: (m: OutlookMetric) => void }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 lg:grid-cols-3",
        fill && "lg:min-h-0 lg:flex-1 lg:auto-rows-fr",
      )}
    >
      {(["success", "assets", "loss"] as const).map((metric) => (
        <PFCard
          key={metric}
          metric={metric}
          current={current}
          personalized={personalized}
          comparison={comparison}
          fill={fill}
          revealMode={revealMode}
          replayNonce={replayNonce}
          onClick={onCardClick ? () => onCardClick(metric) : undefined}
        />
      ))}
    </div>
  );
}

/* ----------------------------------------------------------- tabs panel -- */

type TabId = "summary" | OutlookMetric;

const TABS: { id: TabId; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "success", label: "Chance of Success" },
  { id: "assets", label: "Assets Remaining" },
  { id: "loss", label: "Potential Loss" },
];

/**
 * Post-feedback v2 stats panel: identical to OutlookStatsPanelPF, but each
 * metric visual is wrapped in an InfoTarget so hovering a graph fills the
 * sidebar hover-help box with a plain-language definition.
 */
export function OutlookStatsPanelPFV2({
  current,
  personalized,
  comparison,
  fill,
  revealMode,
  replayNonce,
}: MetricProps) {
  const [tab, setTab] = useState<TabId>("summary");

  return (
    <div className={cn("flex min-w-0 flex-col", fill && "lg:min-h-0 lg:flex-1")}>
      <div className="flex flex-wrap items-end gap-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative -mb-px whitespace-nowrap rounded-t-card px-4 py-2 text-xs transition-colors",
                active
                  ? "z-10 border border-x-stroke-subtle border-t-stroke-subtle border-b-white bg-white font-semibold text-deep-black"
                  : "border border-stroke-subtle bg-ghost-white font-medium text-gray-1 hover:text-deep-black",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "rounded-b-card rounded-tr-card border border-stroke-subtle bg-white p-5",
          fill && "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {tab === "summary" ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={cn(fill && "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col")}
            >
              <SummaryRow
                current={current}
                personalized={personalized}
                comparison={comparison}
                fill={fill}
                revealMode={revealMode}
                replayNonce={replayNonce}
                onCardClick={(m) => setTab(m)}
              />
            </motion.div>
          ) : (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]",
                fill && "lg:min-h-0 lg:flex-1 lg:auto-rows-fr",
              )}
            >
              <motion.div
                layoutId={`pf-v2-card-${tab}`}
                className={cn(
                  "flex min-w-0 flex-col rounded-card border border-stroke-subtle bg-white p-5",
                  fill && "lg:h-full",
                )}
              >
                <p className="text-base font-semibold leading-snug text-deep-black">
                  {METRIC_TITLES[tab]}
                </p>
                <InfoTarget
                  tipId={tab}
                  as="div"
                  className={cn("mt-4 w-full min-w-0", fill && "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col")}
                >
                  <MetricVisual
                    metric={tab}
                    current={current}
                    personalized={personalized}
                    comparison={comparison}
                    tall
                    fill={fill}
                    revealMode={revealMode}
                    replayNonce={replayNonce}
                  />
                </InfoTarget>
              </motion.div>
              <DetailCopyPanelPF
                metric={tab}
                current={current}
                personalized={personalized}
                comparison={comparison}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
