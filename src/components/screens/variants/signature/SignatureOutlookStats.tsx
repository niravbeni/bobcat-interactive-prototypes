"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  fmtCompact,
  fmtDollars,
  type AllocationBreakdown,
  type OutlookStats,
} from "@/lib/outlook";
import { AnimatedNumber, AssetCurve } from "@/components/prototypes/outlook/charts";
import { SkeletonLines } from "@/components/prototypes/outlook/OutlookStatsPanel";
import {
  LossBars,
  avgLifetimeDelta,
  netLossOver30y,
} from "../outlook-post-feedback/pfCharts";
import {
  AllocationGrid,
  AssetsSparkline,
  SuccessSparkline,
  sigSparkDomains,
  sigStableDomains,
  type SigSparkDomains,
} from "./sigOutlookCharts";
import { SIG_EASE } from "./shared";

/* --------------------------------------------------------- card gradients -- */

const CARD_GRADIENTS: Record<"success" | "assets" | "alloc", string> = {
  success:
    "linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1)), linear-gradient(185.14deg, #742ca5 5.4%, #fbe0c1 194.96%)",
  assets:
    "linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1)), linear-gradient(164.36deg, #4135b2 3.9%, #ffd19c 146.88%)",
  alloc:
    "linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1)), linear-gradient(187.76deg, #b235a6 33.8%, #ffd19c 160.34%)",
};

const WHITE_ACCENT: Record<"success" | "assets" | "alloc", string> = {
  success: "#7f35b2",
  assets: "#14b8a6",
  alloc: "#d124b8",
};

const HOLD_GREY = "#9aa1a9";

type SummaryKind = "success" | "assets" | "alloc";
type TabId = "summary" | "income" | "loss" | "allocation";

const TABS: { id: TabId; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "income", label: "Lifetime Income" },
  { id: "loss", label: "Potential Losses" },
  { id: "allocation", label: "Asset Allocation" },
];

/** A big count-up headline that morphs from a grey "before" to the accent color. */
function Headline({
  active,
  from,
  to,
  format,
  color,
}: {
  active: boolean;
  from: number;
  to: number;
  format: (n: number) => string;
  color: string;
}) {
  return (
    <motion.span
      className="block w-full min-w-0 truncate text-[clamp(2rem,6vw,3.25rem)] font-light leading-none tracking-[-1.5px]"
      animate={{ color: active ? color : HOLD_GREY }}
      transition={{ duration: 0.9, ease: SIG_EASE }}
    >
      <AnimatedNumber value={active ? to : from} format={format} />
    </motion.span>
  );
}

/** Small pill chip shown over the summary visual. */
function Chip({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "gradient" | "white";
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-medium",
        variant === "gradient"
          ? "bg-white/20 text-white"
          : "bg-violet/10 text-violet",
      )}
    >
      {children}
    </span>
  );
}

function SummaryCard({
  kind,
  comparison,
  active,
  current,
  personalized,
  allocation,
  sparkDomains,
  onOpen,
}: {
  kind: SummaryKind;
  comparison: boolean;
  /** Whether the card shows its "after" (personalized) state (vs the grey hold). */
  active: boolean;
  current: OutlookStats;
  personalized: OutlookStats;
  allocation: AllocationBreakdown;
  /** Tight summary-sparkline frames (see `sigSparkDomains`). */
  sparkDomains: SigSparkDomains;
  onOpen: () => void;
}) {
  const variant = comparison ? "gradient" : "white";
  const white = variant === "white";
  const accent = WHITE_ACCENT[kind];
  const numberColor = white ? accent : "#ffffff";
  const textColor = white ? "text-deep-black" : "text-white";
  const successDelta = personalized.successPct - current.successPct;
  const avgDelta = avgLifetimeDelta(current, personalized);
  const newAssets = Object.values(allocation).filter((v) => v > 0).length;

  const caption =
    kind === "success"
      ? "Chance your assets will last for your full expected lifetime."
      : kind === "assets"
        ? "Average amount of assets remaining over your lifetime."
        : "New assets integrated into plan for recommended purchase.";

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group relative flex min-h-[320px] min-w-0 flex-col overflow-hidden rounded-card p-5 text-left",
        white && "border border-stroke-subtle bg-white",
      )}
      style={white ? undefined : { background: CARD_GRADIENTS[kind] }}
    >
      <div className="relative flex flex-1 flex-col">
        {kind === "success" ? (
          <Headline
            active={active}
            from={current.successPct}
            to={personalized.successPct}
            format={(n) => `${Math.round(n)}%`}
            color={numberColor}
          />
        ) : kind === "assets" ? (
          <Headline
            active={active}
            from={0}
            to={avgDelta}
            format={(n) => `+${fmtCompact(n)}`}
            color={numberColor}
          />
        ) : (
          <Headline
            active={active}
            from={0}
            to={newAssets}
            format={(n) => `+${Math.round(n)}`}
            color={numberColor}
          />
        )}

        <p className={cn("mt-3 max-w-[240px] text-[17px] font-medium leading-snug tracking-[-0.4px]", textColor)}>
          {caption}
        </p>

        {kind === "success" ? (
          <div className="relative mt-auto flex flex-col gap-3 pt-4">
            <Chip variant={variant}>+{successDelta}% at Age 90</Chip>
            <div className="h-16 w-full">
              <SuccessSparkline
                comparison={comparison}
                personalizedPct={personalized.successPct}
                currentPct={current.successPct}
                domain={sparkDomains.success}
                color={white ? accent : "rgba(255,255,255,0.95)"}
                faintColor={white ? "rgba(159,72,225,0.4)" : "rgba(255,255,255,0.55)"}
                dotRing={white ? "rgba(159,72,225,0.28)" : "rgba(255,255,255,0.7)"}
                className="h-full"
              />
            </div>
          </div>
        ) : kind === "assets" ? (
          <div className="relative mt-auto flex flex-col gap-3 pt-4">
            <Chip variant={variant}>{fmtCompact(personalized.assetsAt90)} at Age 90</Chip>
            <div className="h-20 w-full">
              <AssetsSparkline
                comparison={comparison}
                current={current}
                personalized={personalized}
                domain={sparkDomains.assets}
                color={white ? accent : "rgba(255,255,255,0.95)"}
                faintColor={white ? "rgba(159,72,225,0.4)" : "rgba(255,255,255,0.55)"}
                dotRing={white ? "rgba(159,72,225,0.28)" : "rgba(255,255,255,0.7)"}
              />
            </div>
          </div>
        ) : (
          <div className="relative mt-4 min-h-[150px] flex-1">
            <AllocationGrid allocation={allocation} variant={variant} />
          </div>
        )}
      </div>

      {/* Full-bleed footer pinned to the card's bottom edge. On the gradient
          (comparison-on) card it's a subtle translucent-white band with white
          text; on the white card it's plain violet text with no band. */}
      <div
        className={cn(
          "relative -mx-5 -mb-5 mt-4 flex items-center justify-center gap-1 px-5 py-3 text-[13px] font-medium",
          white
            ? "text-violet"
            : "bg-white/15 text-white backdrop-blur-sm",
        )}
      >
        Open full details
        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
      </div>
    </motion.button>
  );
}

/* ---------------------------------------------------------- detail panels -- */

function DetailCopy({
  title,
  subtitle,
  subtitleAccent = false,
}: {
  title: string;
  subtitle: React.ReactNode;
  subtitleAccent?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-card bg-ghost-white p-5 lg:h-full">
      <p className="text-base font-semibold leading-snug text-deep-black">{title}</p>
      <p
        className={cn(
          "text-sm leading-relaxed",
          subtitleAccent ? "font-medium text-violet" : "text-gray-1",
        )}
      >
        {subtitle}
      </p>
      <div className="flex flex-col gap-3">
        <SkeletonLines rows={4} shimmer />
      </div>
      <div className="flex flex-col gap-3">
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

/**
 * Signature outlook stats panel: a tabbed card with a 3-card summary and three
 * detail views (Lifetime Income, Potential Losses, Asset Allocation). Summary
 * cards render as gradient (comparison on) or white w/ colored charts
 * (comparison off), and — on the plan screen — morph from a grey "before" state
 * once each staged reveal flag flips.
 */
export function SignatureOutlookStats({
  current,
  personalized,
  comparison,
  allocation,
  reveal,
  customEvents,
}: {
  current: OutlookStats;
  personalized: OutlookStats;
  comparison: boolean;
  allocation: AllocationBreakdown;
  /** Staged morph reveal flags (plan screen). Undefined = live (all active). */
  reveal?: { success: boolean; assets: boolean; alloc: boolean };
  /** Active custom-event ids — used to size the detail charts' steady frame. */
  customEvents?: string[];
}) {
  const [tab, setTab] = useState<TabId>("summary");
  const active = reveal ?? { success: true, assets: true, alloc: true };
  // A slider-independent frame so the detail charts tween smoothly (rather than
  // re-snapping their scale) as the market / spending / risk sliders move.
  const { assetDomainTop, lossDomainMax } = useMemo(
    () => sigStableDomains(customEvents),
    [customEvents],
  );
  // Tight frames for the little summary sparklines so slider changes clearly
  // move the lines (separate from the wide steady frame the detail charts use).
  const sparkDomains = useMemo(
    () => sigSparkDomains(customEvents),
    [customEvents],
  );

  return (
    <div className="@container flex min-w-0 flex-col">
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-6 border-b border-stroke-subtle px-1">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="relative flex flex-col items-center gap-1.5 pt-1"
            >
              <span
                className={cn(
                  "whitespace-nowrap pb-1.5 text-sm transition-colors",
                  on ? "font-medium text-violet" : "font-normal text-gray-1 hover:text-deep-black",
                )}
              >
                {t.label}
              </span>
              {on ? (
                <motion.span
                  layoutId="sig-outlook-tab-underline"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-violet"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="pt-5">
        <AnimatePresence mode="wait" initial={false}>
          {tab === "summary" ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: SIG_EASE }}
              className="grid grid-cols-1 gap-3 @lg:grid-cols-2 @4xl:grid-cols-3"
            >
              <SummaryCard
                kind="success"
                comparison={comparison}
                active={active.success}
                current={current}
                personalized={personalized}
                allocation={allocation}
                sparkDomains={sparkDomains}
                onOpen={() => setTab("loss")}
              />
              <SummaryCard
                kind="assets"
                comparison={comparison}
                active={active.assets}
                current={current}
                personalized={personalized}
                allocation={allocation}
                sparkDomains={sparkDomains}
                onOpen={() => setTab("income")}
              />
              <SummaryCard
                kind="alloc"
                comparison={comparison}
                active={active.alloc}
                current={current}
                personalized={personalized}
                allocation={allocation}
                sparkDomains={sparkDomains}
                onOpen={() => setTab("allocation")}
              />
            </motion.div>
          ) : tab === "income" ? (
            <motion.div
              key="income"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: SIG_EASE }}
              className="grid grid-cols-1 gap-4 rounded-card border border-stroke-subtle bg-white p-5 lg:grid-cols-[1.3fr_1fr]"
            >
              <div className="flex min-w-0 flex-col">
                <p className="text-base font-semibold leading-snug text-deep-black">
                  Most likely amount of assets remaining over your lifetime
                </p>
                <p className="mt-1 text-sm text-gray-1">
                  <span className="font-semibold text-deep-black">
                    +<AnimatedNumber value={avgLifetimeDelta(current, personalized)} format={fmtDollars} />
                  </span>{" "}
                  on average, ending at{" "}
                  <span className="font-semibold text-deep-black">
                    <AnimatedNumber value={personalized.assetsAt90} format={fmtDollars} />
                  </span>{" "}
                  at age 90
                </p>
                <div className="mt-4 min-h-0 flex-1">
                  <AssetCurve
                    current={comparison ? current : undefined}
                    personalized={personalized}
                    showLegend={comparison}
                    areaFill
                    tall
                    domainTop={assetDomainTop}
                  />
                </div>
              </div>
              <DetailCopy
                title="Lifetime income"
                subtitle="Protected income sources keep your essentials covered for life, so your invested assets can stay invested for longer."
              />
            </motion.div>
          ) : tab === "loss" ? (
            <motion.div
              key="loss"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: SIG_EASE }}
              className="grid grid-cols-1 gap-4 rounded-card border border-stroke-subtle bg-white p-5 lg:grid-cols-[1.3fr_1fr]"
            >
              <div className="flex min-w-0 flex-col">
                <p className="text-base font-semibold leading-snug text-deep-black">
                  Your investment approach could result in asset losses
                </p>
                <div className="mt-1 text-sm text-gray-1">
                  There is a <span className="font-semibold text-deep-black">50% chance</span> you
                  will lose{" "}
                  <span className="font-semibold text-violet">
                    <AnimatedNumber value={personalized.potentialLoss} format={fmtDollars} />
                  </span>{" "}
                  in any one year, and{" "}
                  <span className="font-semibold text-violet">
                    <AnimatedNumber value={netLossOver30y(personalized.potentialLoss)} format={fmtDollars} />
                  </span>{" "}
                  over 30 years.
                </div>
                <div className="mt-4 min-h-0 flex-1">
                  <LossBars
                    current={current}
                    personalized={personalized}
                    comparison={comparison}
                    tall
                    domainMax={lossDomainMax}
                  />
                </div>
              </div>
              <DetailCopy
                title="Potential losses"
                subtitle="Blending in protected income and diversifiers cushions the deepest downturns, shrinking your worst-case yearly loss."
              />
            </motion.div>
          ) : (
            <motion.div
              key="allocation"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: SIG_EASE }}
              className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]"
            >
              {/* Static Figma-exported Sankey (node 2165:33637) — kept as the
                  exact design asset rather than the code-drawn version, so it no
                  longer re-weights with the risk slider. The export bakes in its
                  own near-white rounded card, so no outer card chrome here. */}
              <div className="min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/signature/asset-allocation-sankey.png"
                  alt="Asset allocation: your current assets versus your personalized plan"
                  className="h-auto w-full"
                />
              </div>
              <DetailCopy
                title="Asset Allocation"
                subtitle="A recommended approach to diversification to reduce fees and increase guaranteed income."
                subtitleAccent
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
