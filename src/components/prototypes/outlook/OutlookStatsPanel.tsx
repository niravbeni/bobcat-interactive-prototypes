"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import {
  computeDeltas,
  fmtCompact,
  fmtDollars,
  type OutlookStats,
} from "@/lib/outlook";
import {
  AnimatedNumber,
  AssetCurve,
  DrawdownLine,
  SuccessBars,
} from "./charts";
/* ------------------------------------------------------------- skeletons -- */

/** Grey placeholder text rows (the Figma screens use these for body copy). */
export function SkeletonLines({
  rows,
  className,
  shimmer = false,
}: {
  rows: number;
  className?: string;
  /** When true, bars animate with a soft shimmer sweep (enhanced flow). */
  shimmer?: boolean;
}) {
  const widths = ["w-full", "w-[92%]", "w-[97%]", "w-[64%]", "w-[85%]", "w-[76%]"];
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2.5 rounded-full",
            shimmer ? "skeleton-shimmer" : "bg-divider/50",
            widths[i % widths.length],
          )}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- motion tokens -- */

/** easeOutExpo-ish curve shared across the comparison motion. */
const EXPO = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------ comparison toggle -- */

/** COMPARISON ON/OFF pill switch; springy knob slide + track colour crossfade. */
export function ComparisonToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex shrink-0 items-center gap-2 rounded-full border border-stroke-subtle bg-white py-1.5 pl-3 pr-1.5 transition-colors hover:bg-ghost-white"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-1">
        Comparison {on ? "on" : "off"}
      </span>
      <motion.span
        className={cn(
          "flex h-5 w-9 items-center rounded-full p-0.5",
          on ? "justify-end" : "justify-start",
        )}
        animate={{ backgroundColor: on ? "#7f35b2" : "#d9d9d9" }}
        transition={{ duration: reduce ? 0 : 0.32, ease: EXPO }}
      >
        <motion.span
          layout
          whileTap={reduce ? undefined : { scale: 0.86 }}
          transition={
            reduce ? { duration: 0 } : { type: "spring", stiffness: 550, damping: 30 }
          }
          className="size-4 rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,32,0.25)]"
        />
      </motion.span>
    </button>
  );
}

/* ------------------------------------------------------------- delta pill -- */

function DeltaPill({ label, delay = 0 }: { label: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7, x: -6 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.7, x: -6 }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 420, damping: 26, delay }
      }
      className="inline-flex shrink-0 items-center rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success"
    >
      {label}
    </motion.span>
  );
}

/* -------------------------------------------------------------- stat card -- */

export type OutlookMetric = "success" | "assets" | "loss";

function StatCard({
  metric,
  title,
  headline,
  pill,
  showPill = true,
  pillDelay = 0,
  fill = false,
  onClick,
  children,
}: {
  metric: OutlookMetric;
  title: string;
  headline: React.ReactNode;
  pill?: string;
  showPill?: boolean;
  pillDelay?: number;
  fill?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const Tag = onClick ? motion.button : motion.div;
  return (
    <Tag
      layoutId={`outlook-card-${metric}`}
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col rounded-card border border-stroke-subtle bg-white p-4 text-left",
        fill && "lg:h-full",
        onClick &&
          "cursor-pointer transition-shadow hover:shadow-[0_8px_28px_rgba(16,24,32,0.09)]",
      )}
    >
      <p className="text-xs font-medium leading-snug text-gray-1">{title}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-xl font-semibold tracking-[-0.01em] text-deep-black">
          {headline}
        </span>
        <AnimatePresence initial={false}>
          {pill && showPill ? (
            <DeltaPill key="pill" label={pill} delay={pillDelay} />
          ) : null}
        </AnimatePresence>
      </div>
      <div className={cn("mt-3", fill && "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col")}>
        {children}
      </div>
    </Tag>
  );
}

/* ------------------------------------------------- shared metric contents -- */

interface MetricProps {
  current: OutlookStats;
  personalized?: OutlookStats;
  comparison: boolean;
  tall?: boolean;
  fill?: boolean;
  /** Enhanced flow: turns on the asset-curve gradient wash + shimmer skeletons. */
  enhanced?: boolean;
}

function metricHeadline(metric: OutlookMetric, stats: OutlookStats) {
  switch (metric) {
    case "success":
      return (
        <AnimatedNumber value={stats.successPct} format={(n) => `${Math.round(n)}%`} />
      );
    case "assets":
      return <AnimatedNumber value={stats.assetsAt90} format={fmtDollars} />;
    case "loss":
      return (
        <>
          <AnimatedNumber value={stats.potentialLoss} format={fmtDollars} />{" "}
          <span className="text-sm font-medium text-gray-1">
            (-
            <AnimatedNumber
              value={stats.drawdownPct}
              format={(n) => `${Math.round(n)}%`}
            />
            )
          </span>
        </>
      );
  }
}

const METRIC_TITLES: Record<OutlookMetric, string> = {
  success: "Chance of plan success",
  assets: "Expected assets remaining",
  loss: "Potential asset loss in any given year",
};

function MetricChart({
  metric,
  current,
  personalized,
  comparison,
  tall,
  fill,
  enhanced,
}: MetricProps & { metric: OutlookMetric }) {
  // Hero plan is personalized when present; comparison layers the grey current.
  const overlay = personalized && comparison ? current : undefined;
  const heroCurrent = personalized ? overlay : current;
  switch (metric) {
    case "success":
      return (
        <SuccessBars
          current={heroCurrent}
          personalized={personalized}
          tall={tall}
          fill={fill}
        />
      );
    case "assets":
      return (
        <AssetCurve
          current={heroCurrent}
          personalized={personalized}
          showLegend={!!overlay}
          tall={tall}
          fill={fill}
          areaFill={enhanced}
        />
      );
    case "loss":
      return (
        <DrawdownLine
          current={heroCurrent}
          personalized={personalized}
          tall={tall}
          fill={fill}
        />
      );
  }
}

/* ------------------------------------------------------------ summary row -- */

/**
 * The three stat cards. When `personalized` is provided the headlines show
 * the personalized plan with green computed-delta pills vs current; otherwise
 * (screen 1) they show the current plan alone in grey.
 */
export function StatCardsRow({
  current,
  personalized,
  comparison,
  fill,
  enhanced,
  onCardClick,
}: MetricProps & { onCardClick?: (m: OutlookMetric) => void }) {
  const hero = personalized ?? current;
  const deltas = personalized ? computeDeltas(current, personalized) : null;
  const pills: Record<OutlookMetric, string | undefined> = {
    success: deltas ? `+${deltas.successPts}%` : undefined,
    assets: deltas ? `+${fmtDollars(deltas.assetsAt90)}` : undefined,
    loss: deltas ? `${fmtCompact(deltas.lossReduction)} reduction` : undefined,
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 lg:grid-cols-3",
        fill && "lg:h-full",
      )}
    >
      {(["success", "assets", "loss"] as const).map((metric, i) => (
        <StatCard
          key={metric}
          metric={metric}
          title={METRIC_TITLES[metric]}
          headline={metricHeadline(metric, hero)}
          pill={pills[metric]}
          showPill={comparison}
          pillDelay={i * 0.06}
          fill={fill}
          onClick={onCardClick ? () => onCardClick(metric) : undefined}
        >
          <MetricChart
            metric={metric}
            current={current}
            personalized={personalized}
            comparison={comparison}
            fill={fill}
            enhanced={enhanced}
          />
        </StatCard>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- tabs panel -- */

type TabId = "summary" | OutlookMetric;

const TABS: { id: TabId; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "success", label: "Chance of Success" },
  { id: "assets", label: "Assets Remaining" },
  { id: "loss", label: "Potential Loss" },
];

/**
 * Tabbed stats area for screens 3 and 4: a Summary grid of clickable stat
 * cards plus one detail tab per graph (big chart + skeleton copy), reached via
 * the tab bar or by clicking a card. Card → detail is a shared-layout zoom
 * (`layoutId` per metric).
 */
export function OutlookStatsPanel({ current, personalized, comparison, fill, enhanced }: MetricProps) {
  const [tab, setTab] = useState<TabId>("summary");

  return (
    <div className={cn("flex min-w-0 flex-col", fill && "lg:h-full lg:min-h-0")}>
      <div className="flex flex-wrap items-end gap-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                // -mb-px lets the active tab overlap the panel's top border so
                // it reads as an open folder tab merging into the content below.
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
        {/* Placeholder intro copy for the section, per design. */}
        <SkeletonLines rows={2} className="max-w-[440px] pb-5" shimmer={enhanced} />
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
              <StatCardsRow
                current={current}
                personalized={personalized}
                comparison={comparison}
                fill={fill}
                enhanced={enhanced}
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
                fill && "lg:min-h-0 lg:flex-1",
              )}
            >
              <motion.div
                layoutId={`outlook-card-${tab}`}
                className={cn(
                  "flex min-w-0 flex-col rounded-card border border-stroke-subtle bg-white p-5",
                  fill && "lg:h-full",
                )}
              >
                <p className="text-xs font-medium leading-snug text-gray-1">
                  {METRIC_TITLES[tab]}
                </p>
                <div className="mt-1 text-2xl font-semibold tracking-[-0.01em] text-deep-black">
                  {metricHeadline(tab, personalized ?? current)}
                </div>
                <div className={cn("mt-4", fill && "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col")}>
                  <MetricChart
                    metric={tab}
                    current={current}
                    personalized={personalized}
                    comparison={comparison}
                    tall
                    fill={fill}
                    enhanced={enhanced}
                  />
                </div>
              </motion.div>
              <DetailCopyPanel shimmer={enhanced} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Right-hand explainer column in detail views. Filled with blocked-out
 * placeholder text (headings + paragraphs) so the area clearly reads as
 * "copy goes here". "Learn more" is an inert placeholder link.
 */
function DetailCopyPanel({ shimmer = false }: { shimmer?: boolean }) {
  const heading = shimmer ? "skeleton-shimmer" : "bg-divider/80";
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5 rounded-card bg-ghost-white p-5">
      <div className="flex flex-col gap-3">
        <div className={cn("h-3 w-2/5 rounded-full", heading)} />
        <SkeletonLines rows={5} shimmer={shimmer} />
      </div>
      <div className="flex flex-col gap-3">
        <div className={cn("h-3 w-1/3 rounded-full", heading)} />
        <SkeletonLines rows={4} shimmer={shimmer} />
      </div>
      <div className="flex flex-col gap-3">
        <div className={cn("h-3 w-[45%] rounded-full", heading)} />
        <SkeletonLines rows={4} shimmer={shimmer} />
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
