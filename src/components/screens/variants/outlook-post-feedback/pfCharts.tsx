"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, animate } from "motion/react";
import { cn } from "@/lib/cn";
import { fmtCompact, type OutlookStats } from "@/lib/outlook";
import {
  AnimatedNumber,
  SERIES_GREY,
  SERIES_VIOLET,
} from "@/components/prototypes/outlook/charts";

/**
 * PF v2 "purple reveals over grey" first-entry choreography. `revealMode`
 * undefined = the shared, pre-existing behavior used by every other outlook
 * flow. `replayNonce` is bumped by the debug toggle to replay the reveal.
 */
export type RevealMode = "draw" | "morph";

/* --------------------------------------------------------- derivations -- */

const round1000 = (n: number) => Math.round(n / 1000) * 1000;

/** Probability buckets shown on the loss chart's x-axis (P assets stay within). */
export const LOSS_PROBABILITIES = [0.9, 0.75, 0.5, 0.25, 0.1] as const;

/**
 * Loss magnitude (positive dollars) at a given probability bucket. The 0.5
 * bucket equals the plan's headline one-year loss, and deeper tails (0.1) are
 * progressively larger, so the "50% chance" subtitle and the middle bar agree.
 */
export function lossAtProbability(potentialLoss: number, p: number): number {
  const mult: Record<number, number> = {
    0.9: 0.2,
    0.75: 0.45,
    0.5: 1.0,
    0.25: 1.45,
    0.1: 1.9,
  };
  return round1000(potentialLoss * (mult[p] ?? 1));
}

/** Average extra assets the personalized plan holds across the 60->90 curve. */
export function avgLifetimeDelta(
  current: OutlookStats,
  personalized: OutlookStats,
): number {
  const n = Math.min(current.assetCurve.length, personalized.assetCurve.length);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    sum += personalized.assetCurve[i].value - current.assetCurve[i].value;
  }
  return round1000(sum / n);
}

/** Illustrative cumulative net losses over the ~30 year horizon. */
export function netLossOver30y(potentialLoss: number): number {
  return round1000(potentialLoss * 3.5);
}

/* --------------------------------------------------------- SuccessDelta -- */

/**
 * "Chance of success" as a big number treatment. When a personalized plan is
 * present and comparison is on, it foregrounds the delta (`+N%`) with a
 * "From X% to Y%" line; otherwise it shows the single plan's percentage.
 */
export function SuccessDelta({
  current,
  personalized,
  comparison,
  tall = false,
  fill = false,
  revealMode,
  replayNonce = 0,
}: {
  current?: OutlookStats;
  personalized?: OutlookStats;
  comparison: boolean;
  tall?: boolean;
  fill?: boolean;
  revealMode?: RevealMode;
  replayNonce?: number;
}) {
  const hero = personalized ?? current;
  const showDelta = !!personalized && !!current && comparison;
  const delta = personalized && current ? personalized.successPct - current.successPct : 0;

  // Reveal choreography (only kicks in when a revealMode is supplied and we
  // have both plans to compare).
  const doReveal = revealMode !== undefined && showDelta;
  const doMorph = doReveal && revealMode === "morph";
  const doDraw = doReveal && !doMorph;
  // Once the parent's on-mount trigger fires (replayNonce 0 → 1, after the grey
  // hold) the number slowly counts up and gives a gentle settle-pop as it lands.
  const morphNow = doMorph && replayNonce > 0;

  // Morph: the headline number counts up from the current plan's success % to
  // the personalized plan's. Tween the raw value (setState only fires from the
  // animation callback, never synchronously in the effect body).
  const currentPct = current?.successPct ?? 0;
  const personalizedPct = personalized?.successPct ?? currentPct;
  const [morphPct, setMorphPct] = useState(currentPct);
  useEffect(() => {
    // Wait for the parent's on-mount trigger (replayNonce 0 → 1) so the number
    // holds at the current % through the grey beat, then counts up slowly.
    // Success is first in the staggered choreography (zero extra delay); the
    // long duration makes the climb feel deliberate and celebratory.
    if (!doMorph || replayNonce <= 0) return;
    const controls = animate(currentPct, personalizedPct, {
      duration: 1.9,
      delay: 0,
      // Ease-in-out so the digits tick steadily across the whole duration and
      // decelerate into the final value, rather than snapping up front.
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setMorphPct(v),
    });
    return () => controls.stop();
  }, [doMorph, replayNonce, currentPct, personalizedPct]);

  if (!hero) return null;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col items-center justify-center text-center",
        fill
          ? cn(tall ? "max-lg:h-72" : "max-lg:h-56", "lg:min-h-0 lg:flex-1")
          : tall
            ? "h-72"
            : "h-56",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {doMorph ? (
          <motion.div
            key="morph"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            {/* The hero percentage itself evolves the story: it sits at the grey
                current value (86%) through the hold, then counts up to the
                personalized value (97%) while its text color tweens grey →
                violet in sync — grey "before" visibly becoming purple "after". */}
            <motion.span
              className="text-6xl font-bold leading-none tracking-[-0.02em] lg:text-7xl"
              style={{ display: "inline-block", transformOrigin: "50% 60%" }}
              initial={{ scale: 1, color: SERIES_GREY }}
              animate={
                morphNow
                  ? { scale: [1, 1, 1.09, 1], color: SERIES_VIOLET }
                  : { scale: 1, color: SERIES_GREY }
              }
              transition={
                morphNow
                  ? {
                      scale: { duration: 2.0, times: [0, 0.55, 0.84, 1], ease: [0.22, 1, 0.36, 1] },
                      // Color evolves over the same window as the count-up.
                      color: { duration: 1.9, ease: [0.65, 0, 0.35, 1] },
                    }
                  : { duration: 0 }
              }
            >
              {Math.round(morphPct)}%
            </motion.span>
            {/* Optional subtle "better" cue — fades in as the number settles.
                Remove this whole <motion.p> to drop the improvement accent. */}
            <motion.p
              className="mt-5 text-sm font-semibold text-success"
              initial={{ opacity: 0 }}
              animate={{ opacity: morphNow ? 1 : 0 }}
              transition={{ duration: 0.5, delay: morphNow ? 1.6 : 0 }}
            >
              +{Math.round(delta)}% improvement
            </motion.p>
          </motion.div>
        ) : showDelta ? (
          <motion.div
            key={doReveal ? `delta-${replayNonce}` : "delta"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: 0.32,
              ease: [0.22, 1, 0.36, 1],
              delay: doDraw ? 0.35 : 0,
            }}
            className="flex flex-col items-center"
          >
            <AnimatedNumber
              value={delta}
              format={(n) => `${n >= 0 ? "+" : "\u2212"}${Math.abs(Math.round(n))}%`}
              className="text-6xl font-bold leading-none tracking-[-0.02em] text-violet lg:text-7xl"
            />
            <p className="mt-6 text-lg font-semibold text-deep-black">
              From{" "}
              <span className={doDraw ? "text-gray-1" : undefined}>
                <AnimatedNumber
                  value={current!.successPct}
                  format={(n) => `${Math.round(n)}%`}
                />
              </span>{" "}
              to{" "}
              <AnimatedNumber
                value={personalized!.successPct}
                format={(n) => `${Math.round(n)}%`}
              />
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatedNumber
              value={hero.successPct}
              format={(n) => `${Math.round(n)}%`}
              className={cn(
                "text-6xl font-bold leading-none tracking-[-0.02em] lg:text-7xl",
                personalized ? "text-violet" : "text-gray-1",
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------- LossBars -- */

/**
 * "Potential asset loss" as grouped bars across probability buckets (0.9 ->
 * 0.1). Bars hang from the 0 line and deepen toward the worst-case tail. Violet
 * is the personalized plan; the grey "current" bar only appears when comparison
 * is on (or on screen 1 where it's the sole plan).
 */
export function LossBars({
  current,
  personalized,
  comparison,
  tall = false,
  fill = false,
  revealMode,
  replayNonce = 0,
}: {
  current?: OutlookStats;
  personalized?: OutlookStats;
  comparison: boolean;
  tall?: boolean;
  fill?: boolean;
  revealMode?: RevealMode;
  replayNonce?: number;
}) {
  const plans: { key: string; stats: OutlookStats; color: string }[] = [];
  if (personalized) {
    plans.push({ key: "personalized", stats: personalized, color: "bg-violet" });
    if (comparison && current) {
      plans.push({ key: "current", stats: current, color: "bg-[#b3b9c0]" });
    }
  } else if (current) {
    plans.push({ key: "current", stats: current, color: "bg-[#b3b9c0]" });
  }

  if (plans.length === 0) return null;

  const maxLoss = Math.max(
    1,
    ...LOSS_PROBABILITIES.flatMap((p) =>
      plans.map((pl) => lossAtProbability(pl.stats.potentialLoss, p)),
    ),
  );
  // Fixed y-domain floor so bars visibly grow/shrink as the sliders deepen or
  // ease the losses. An auto-fit domain rescaled with the data, which kept the
  // deepest bar pinned near the top and made slider changes look almost static.
  // The domain only expands past the floor for extreme (event-driven) losses.
  const AXIS_STEP = 150_000;
  const AXIS_FLOOR = 600_000;
  const domainMax = Math.max(
    AXIS_FLOOR,
    Math.ceil((maxLoss * 1.18) / AXIS_STEP) * AXIS_STEP,
  );
  // Draw gridlines up to (but not including) the domain max — the bottom-most
  // line is just the scaling floor's headroom and only adds clutter.
  const grid: number[] = [];
  for (let v = 0; v < domainMax; v += AXIS_STEP) grid.push(v);
  const showLegend = plans.length > 1;

  // Reveal choreography: grey/current bars land immediately; the violet
  // (personalized) bars either grow in ("draw") or rise from the grey bucket
  // height ("morph"). No-op when revealMode is undefined.
  const doReveal = revealMode !== undefined && !!personalized;
  const canMorph = doReveal && revealMode === "morph" && !!current;
  const VIOLET_DELAY = 0.3;
  // Morph plays once, on mount: the violet bars sit at the grey/current bucket
  // heights for the first frame, then rise to the personalized heights when the
  // parent bumps `replayNonce` (0 → 1). Last in the staggered choreography
  // (success counts, then the curve morphs, then these bars rise).
  const morphNow = canMorph && replayNonce > 0;
  const MORPH_DELAY = 0.6;
  const bucketHeight = (stats: OutlookStats, p: number) =>
    `${(lossAtProbability(stats.potentialLoss, p) / domainMax) * 100}%`;

  return (
    <div className={cn("flex w-full min-w-0 flex-col", fill && "lg:min-h-0 lg:flex-1")}>
      <div
        className={cn(
          "relative w-full min-w-0",
          fill
            ? cn(tall ? "max-lg:h-72" : "max-lg:h-64", "lg:min-h-0 lg:flex-1")
            : tall
              ? "h-72"
              : "h-64",
        )}
      >
        <div className="absolute inset-0">
          {/* y-axis loss labels aligned to their gridlines */}
          <div className="pointer-events-none absolute inset-0 text-[9px] text-gray-2">
            {grid.map((v) => (
              <span
                key={v}
                className="absolute left-0 -translate-y-1/2"
                style={{ top: `${(v / domainMax) * 100}%` }}
              >
                {v === 0 ? "0" : `\u2212${fmtCompact(v)}`}
              </span>
            ))}
          </div>
          <div className="absolute inset-y-0 left-9 right-0">
            {grid.map((v) => (
              <div
                key={v}
                className={cn(
                  "absolute inset-x-0 border-t",
                  v === 0 ? "border-divider" : "border-divider/50",
                )}
                style={{ top: `${(v / domainMax) * 100}%` }}
              />
            ))}
            {/* bars hang from the 0 line at the top */}
            <div className="absolute inset-0 flex items-start justify-between gap-2">
              {LOSS_PROBABILITIES.map((p) => (
                <div
                  key={p}
                  className="relative flex h-full flex-1 items-start justify-center gap-1.5"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {plans.map((pl) => {
                      const targetH = bucketHeight(pl.stats, p);
                      const isPersonalized = pl.key === "personalized";
                      // Grey (current) bar: appears instantly under the reveal.
                      if (doReveal && !isPersonalized) {
                        return (
                          <motion.div
                            key={`${pl.key}-reveal`}
                            layout="position"
                            className={cn("min-w-0 flex-1 max-w-6 origin-top", pl.color)}
                            initial={{ height: targetH, opacity: 1 }}
                            animate={{ height: targetH, opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0 }}
                          />
                        );
                      }
                      // Violet (personalized) bar under the reveal. In "morph" it
                      // sits at the current bucket height and rises to the
                      // personalized height once the mount trigger fires; in
                      // "draw" it grows up from zero.
                      if (doReveal && isPersonalized) {
                        const fromH = canMorph ? bucketHeight(current!, p) : "0%";
                        const toH = canMorph ? (morphNow ? targetH : fromH) : targetH;
                        return (
                          <motion.div
                            key={`${pl.key}-${revealMode}`}
                            layout="position"
                            className={cn("min-w-0 flex-1 max-w-6 origin-top", pl.color)}
                            initial={{ height: fromH, opacity: canMorph ? 1 : 0 }}
                            animate={{ height: toH, opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={
                              canMorph
                                ? {
                                    // Slow, last beat of the reveal: the violet
                                    // bars ease up from the grey buckets with a
                                    // gentle overshoot-and-settle.
                                    type: "spring",
                                    duration: 1.8,
                                    bounce: 0.28,
                                    delay: MORPH_DELAY,
                                  }
                                : {
                                    type: "spring",
                                    stiffness: 170,
                                    damping: 26,
                                    delay: VIOLET_DELAY,
                                  }
                            }
                          />
                        );
                      }
                      // Default (all other flows): unchanged.
                      return (
                        <motion.div
                          key={pl.key}
                          layout="position"
                          className={cn("min-w-0 flex-1 max-w-6 origin-top", pl.color)}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: targetH, opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 170, damping: 26 }}
                        />
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* x-axis probability labels */}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-divider/60 pl-9 pt-1.5 text-[9px] text-gray-2">
        {LOSS_PROBABILITIES.map((p) => (
          <span key={p} className="flex-1 text-center">
            {p}
          </span>
        ))}
      </div>
      <AnimatePresence>
        {showLegend ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-x-3 gap-y-0.5 overflow-hidden pt-1.5 text-[9px] text-gray-1"
          >
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-violet" />
              Your personalized plan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[#b3b9c0]" />
              Typical retail experience
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
