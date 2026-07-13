"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "motion/react";
import { fmtAxis, fmtCompact, type AllocationBreakdown, type OutlookStats } from "@/lib/outlook";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------- palette -- */

export const SERIES_GREY = "#9aa1a9";
export const SERIES_VIOLET = "#7f35b2";

/** easeOutExpo-ish curve shared with the stats panel for cohesive motion. */
const EXPO = [0.22, 1, 0.36, 1] as const;

const PIE_GREYS = ["#aab0b7", "#c2c7cd", "#8b919a", "#d7dbdf", "#747b84"];
const PIE_VIOLETS = ["#7f35b2", "#a06ecb", "#c49ae2", "#e0c8f3", "#8f4fc0"];

/* ------------------------------------------------------- animated number -- */

/**
 * Tweens between values whenever `value` changes so headline numbers count
 * up/down instead of snapping — sells the "everything reacts" feel.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);

  return <span className={className}>{format(display)}</span>;
}

/* ------------------------------------------------------------ line utils -- */

function toPath(
  points: { x: number; y: number }[],
  smooth: boolean,
): string {
  if (points.length === 0) return "";
  if (!smooth)
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
  // Quadratic midpoint smoothing: cheap, stable, and morphable (fixed count).
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    d += ` Q${points[i].x.toFixed(1)},${points[i].y.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L${last.x.toFixed(1)},${last.y.toFixed(1)}`;
  return d;
}

/* ------------------------------------------------------------ SuccessBars -- */

/**
 * "Chance of plan success" visual: each plan's success probability as a bar on
 * a plain 0–100% scale, so a 99% plan nearly fills the plot and a 73% plan
 * reaches ~three-quarters. Reading the bar height straight off the % axis makes
 * the comparison obvious and matches the headline number above the chart.
 */
export function SuccessBars({
  current,
  personalized,
  tall = false,
  fill = false,
}: {
  current?: OutlookStats;
  personalized?: OutlookStats;
  tall?: boolean;
  fill?: boolean;
}) {
  const bars = [
    current && {
      key: "current",
      pct: current.successPct,
      color: "bg-[#b3b9c0]",
      label: personalized ? "Typical Retail Advisor" : "Typical Retail Experience",
      text: "text-gray-1",
    },
    personalized && {
      key: "personalized",
      pct: personalized.successPct,
      color: "bg-violet",
      label: "Your Personalized Plan",
      text: "text-violet",
    },
  ].filter(Boolean) as {
    key: string;
    pct: number;
    color: string;
    label: string;
    text: string;
  }[];

  const gridValues = [0, 25, 50, 75, 100];

  return (
    <div className={cn("flex w-full flex-col", fill && "lg:h-full")}>
      <div
        className={cn(
          "relative w-full",
          fill
            ? cn(tall ? "max-lg:h-72" : "max-lg:h-64", "lg:min-h-0 lg:flex-1")
            : tall
              ? "h-72"
              : "h-64",
        )}
      >
        {/* Reserve top room so the value label above a full-height bar never clips. */}
        <div className="absolute inset-0 pt-6">
          {/* y-axis % labels aligned to their gridlines */}
          <div className="pointer-events-none absolute inset-0 text-[9px] text-gray-2">
            {gridValues.map((v) => (
              <span
                key={v}
                className="absolute left-0 -translate-y-1/2"
                style={{ top: `${100 - v}%` }}
              >
                {v}%
              </span>
            ))}
          </div>
          <div className="absolute inset-y-0 left-8 right-0">
            {gridValues.map((v) => (
              <div
                key={v}
                className={cn(
                  "absolute inset-x-0 border-t",
                  v === 0 ? "border-divider" : "border-divider/50",
                )}
                style={{ top: `${100 - v}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end justify-center gap-6">
              <AnimatePresence mode="popLayout" initial={false}>
                {bars.map((b) => (
                  <motion.div
                    key={b.key}
                    layout="position"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 26 }}
                    className="relative flex h-full w-24 items-end justify-center"
                  >
                    <motion.div
                      className={cn(
                        "relative w-12 origin-bottom rounded-t-md",
                        b.color,
                      )}
                      initial={{ height: 0 }}
                      animate={{ height: `${b.pct}%` }}
                      transition={{ type: "spring", stiffness: 170, damping: 26 }}
                    >
                      <AnimatedNumber
                        value={b.pct}
                        format={(n) => `${Math.round(n)}%`}
                        className={cn(
                          "absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-semibold",
                          b.text,
                        )}
                      />
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-start justify-center gap-6 border-t border-divider/60 pl-8 pt-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {bars.map((b) => (
            <motion.span
              key={b.key}
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EXPO }}
              className={cn(
                "w-24 text-center text-[10px] leading-snug",
                b.text,
                b.key === "personalized" && "font-medium",
              )}
            >
              {b.label}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** The little 60–90 age tick strip that sits under the Figma charts. */
function AxisStrip() {
  return (
    <div className="mt-2 flex items-center justify-between px-1 text-[9px] text-gray-2">
      {[60, 70, 80, 90].map((age) => (
        <span key={age}>{age}</span>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- AssetCurve -- */

const CURVE_W = 300;
const CURVE_H = 150;

function curvePoints(stats: OutlookStats, max: number) {
  return stats.assetCurve.map((p) => ({
    x: ((p.age - 60) / 30) * (CURVE_W - 24) + 12,
    y: CURVE_H - (p.value / max) * CURVE_H,
  }));
}

/**
 * "Expected assets remaining" projection from 60 → 90. The right-hand end of
 * the personalized line is exactly the headline dollar figure; a dashed Age-90
 * marker pins that relationship visually.
 */
export function AssetCurve({
  current,
  personalized,
  showLegend = false,
  tall = false,
  fill = false,
  areaFill = false,
  revealMode,
  replayNonce = 0,
}: {
  current?: OutlookStats;
  personalized?: OutlookStats;
  showLegend?: boolean;
  tall?: boolean;
  fill?: boolean;
  /** Enhanced flow: animated gradient wash under each curve. */
  areaFill?: boolean;
  /**
   * PF v2 "purple reveals over grey" first-entry choreography. When set, the
   * grey (current) layer renders immediately at full and the violet
   * (personalized) layer either draws in ("draw") or morphs from the current
   * curve ("morph"). Undefined = the shared, pre-existing behavior for every
   * other flow.
   */
  revealMode?: "draw" | "morph";
  /** Bump to replay the reveal (used by the debug toggle). */
  replayNonce?: number;
}) {
  const gradId = useId().replace(/:/g, "");
  const hero = personalized ?? current;
  if (!hero) return null;
  // Fit the y-domain to the tallest series (with headroom for the peak dot +
  // its label), snapped to 250k so it stays steady as the sliders move. A fixed
  // domain used to clip the curve whenever expected assets ran past ~1.65M.
  const maxVal = Math.max(
    current?.peak.value ?? 0,
    personalized?.peak.value ?? 0,
  );
  const domainTop = Math.max(
    1_750_000,
    Math.ceil((maxVal * 1.12) / 250_000) * 250_000,
  );
  const heroPts = curvePoints(hero, domainTop);
  const peakPt = heroPts.reduce((a, b) => (b.y < a.y ? b : a));
  // Close a line's points down to the baseline so the stroke path becomes a
  // fillable area (enhanced flow only).
  const toArea = (pts: { x: number; y: number }[]) =>
    pts.length === 0
      ? ""
      : `${toPath(pts, true)} L${pts[pts.length - 1].x.toFixed(1)},${CURVE_H} L${pts[0].x.toFixed(1)},${CURVE_H} Z`;
  const gridValues: number[] = [];
  for (let v = 500_000; v < domainTop - 1; v += 500_000) gridValues.push(v);

  // ---- PF v2 first-entry reveal choreography (no-op for every other flow) --
  const doReveal = revealMode !== undefined && !!personalized;
  // Morph needs a grey/current curve to grow out of; without one (comparison
  // off) we gracefully fall back to the draw-in behavior.
  const doMorph = doReveal && revealMode === "morph" && !!current;
  const doDraw = doReveal && !doMorph;
  const VIOLET_DELAY = 0.3;
  // Morph plays once, on mount: the violet layer sits on the grey/current path
  // for the first frame, then animates to the personalized path when the parent
  // bumps `replayNonce` (0 → 1) on the next frame. Second in the staggered
  // choreography (success counts first, then the curve, then the loss bars).
  const morphNow = doMorph && replayNonce > 0;
  // Curve is the middle beat of the reveal: it starts ~0.3s after the success
  // number and morphs slowly so the line feels like it "arrives". The peak
  // dot gives a soft scale-pulse + glow as it reaches the personalized peak.
  const MORPH_DELAY = 0.3;
  const MORPH_DUR = 2.0;
  const PEAK_PULSE_DELAY = MORPH_DELAY + MORPH_DUR - 0.55;
  const currentPts = current ? curvePoints(current, domainTop) : null;
  const currentPeakPt = currentPts
    ? currentPts.reduce((a, b) => (b.y < a.y ? b : a))
    : peakPt;
  const heroStroke = toPath(heroPts, true);
  const heroArea = toArea(heroPts);
  const currentStroke = currentPts ? toPath(currentPts, true) : heroStroke;
  const currentArea = currentPts ? toArea(currentPts) : heroArea;
  const peakLeftFor = (pt: { x: number; y: number }) =>
    `calc(1.75rem + (100% - 1.75rem) * ${(pt.x / CURVE_W).toFixed(4)})`;
  const peakTopFor = (pt: { x: number; y: number }) =>
    `${((pt.y / CURVE_H) * 100).toFixed(2)}%`;
  const peakLabelLeftFor = (pt: { x: number; y: number }) =>
    `calc(1.75rem + (100% - 1.75rem) * ${(pt.x / CURVE_W).toFixed(4)} - 24px)`;
  const peakLabelTopFor = (pt: { x: number; y: number }) =>
    `calc(${((pt.y / CURVE_H) * 100).toFixed(2)}% - 20px)`;

  return (
    <div className={cn("flex w-full min-w-0 flex-col", fill && "lg:min-h-0 lg:flex-1")}>
      <div
        className={cn(
          "relative w-full min-w-0 pl-7",
          fill
            ? cn(tall ? "max-lg:h-80" : "max-lg:h-64", "lg:min-h-0 lg:flex-1")
            : tall
              ? "h-80"
              : "h-64",
        )}
      >
        {/* y-axis labels aligned to their gridlines */}
        <div className="pointer-events-none absolute inset-0 left-0 text-[9px] text-gray-2">
          {gridValues.map((v) => (
            <span
              key={v}
              className="absolute left-0 -translate-y-1/2"
              style={{ top: `${(1 - v / domainTop) * 100}%` }}
            >
              {fmtAxis(v)}
            </span>
          ))}
        </div>
        {/* Plot area: the SVG is an in-flow child of the plot box (which has a
            pl-7 left gutter for the y-axis labels). Mirroring DrawdownLine's
            pattern — an in-flow svg with viewBox + preserveAspectRatio="none"
            and no width/height presentation attributes — avoids Safari
            collapsing the SVG to a thin sliver when nested in an
            absolutely-positioned box. */}
          <svg
            viewBox={`0 0 ${CURVE_W} ${CURVE_H}`}
            preserveAspectRatio="none"
            className="block h-full w-full"
          >
          {areaFill ? (
            <defs>
              <linearGradient id={`asset-violet-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_VIOLET} stopOpacity={0.32} />
                <stop offset="100%" stopColor={SERIES_VIOLET} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`asset-grey-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_GREY} stopOpacity={0.22} />
                <stop offset="100%" stopColor={SERIES_GREY} stopOpacity={0} />
              </linearGradient>
            </defs>
          ) : null}
          {areaFill && current ? (
            <motion.path
              key="comparison-area"
              d={currentArea}
              fill={`url(#asset-grey-${gradId})`}
              stroke="none"
              initial={doReveal ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1, d: currentArea }}
              transition={doReveal ? { duration: 0 } : { duration: 0.7, ease: EXPO }}
              className="pointer-events-none"
            />
          ) : null}
          {areaFill && personalized ? (
            doReveal ? (
              <motion.path
                key={`violet-area-${revealMode}`}
                d={doMorph ? currentArea : heroArea}
                fill={`url(#asset-violet-${gradId})`}
                stroke="none"
                initial={
                  doMorph ? { opacity: 1, d: currentArea } : { opacity: 0 }
                }
                animate={
                  doMorph
                    ? { opacity: 1, d: morphNow ? heroArea : currentArea }
                    : { opacity: 1 }
                }
                transition={
                  doMorph
                    ? { duration: MORPH_DUR, delay: MORPH_DELAY, ease: EXPO }
                    : { opacity: { duration: 0.5, delay: VIOLET_DELAY, ease: EXPO } }
                }
                className="pointer-events-none"
              />
            ) : (
              <motion.path
                d={toArea(heroPts)}
                fill={`url(#asset-violet-${gradId})`}
                stroke="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, d: toArea(heroPts) }}
                transition={{ duration: 0.7, ease: EXPO }}
                className="pointer-events-none"
              />
            )
          ) : null}
          {gridValues.map((v) => (
            <line
              key={v}
              x1={0}
              x2={CURVE_W}
              y1={CURVE_H - (v / domainTop) * CURVE_H}
              y2={CURVE_H - (v / domainTop) * CURVE_H}
              stroke="#e5e7ea"
              strokeWidth={1}
            />
          ))}
          {/* Age-90 marker */}
          <line
            x1={CURVE_W - 12}
            x2={CURVE_W - 12}
            y1={8}
            y2={CURVE_H}
            stroke="#c6cbd1"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <AnimatePresence>
            {current ? (
              <motion.path
                key="comparison-curve"
                d={currentStroke}
                fill="none"
                stroke={personalized ? SERIES_GREY : "#8b919a"}
                strokeWidth={1.8}
                initial={
                  doReveal
                    ? { pathLength: 1, opacity: 1 }
                    : { pathLength: 0, opacity: 0 }
                }
                animate={{ pathLength: 1, opacity: 1, d: currentStroke }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={doReveal ? { duration: 0 } : { duration: 0.6, ease: EXPO }}
              />
            ) : null}
          </AnimatePresence>
          {personalized ? (
            doReveal ? (
              <motion.path
                key={`violet-stroke-${revealMode}`}
                d={doMorph ? currentStroke : heroStroke}
                fill="none"
                stroke={SERIES_VIOLET}
                strokeWidth={2.2}
                strokeLinecap="round"
                initial={
                  doMorph
                    ? { pathLength: 1, opacity: 1 }
                    : { pathLength: 0, opacity: 0 }
                }
                animate={
                  doMorph
                    ? { pathLength: 1, opacity: 1, d: morphNow ? heroStroke : currentStroke }
                    : { pathLength: 1, opacity: 1 }
                }
                transition={
                  doMorph
                    ? { duration: MORPH_DUR, delay: MORPH_DELAY, ease: EXPO }
                    : {
                        pathLength: { duration: 0.8, delay: VIOLET_DELAY, ease: EXPO },
                        opacity: { duration: 0.3, delay: VIOLET_DELAY },
                      }
                }
              />
            ) : (
              <motion.path
                d={toPath(heroPts, true)}
                fill="none"
                stroke={SERIES_VIOLET}
                strokeWidth={2.2}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1, d: toPath(heroPts, true) }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            )
          ) : null}
          </svg>
        {/* Peak marker + label as HTML overlays so the dot stays a true circle
            (an SVG circle inside this preserveAspectRatio="none" chart gets
            stretched into an ellipse). The svg is inset by 1.75rem on the left,
            so map x across (100% - 1.75rem) to sit exactly on the curve. */}
        {personalized ? (
          doReveal ? (
            <motion.span
              key={`peak-dot-${revealMode}`}
              className="pointer-events-none absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet ring-2 ring-white"
              initial={
                doMorph
                  ? {
                      left: peakLeftFor(currentPeakPt),
                      top: peakTopFor(currentPeakPt),
                      opacity: 1,
                      scale: 1,
                    }
                  : {
                      left: peakLeftFor(peakPt),
                      top: peakTopFor(peakPt),
                      opacity: 0,
                      scale: 0,
                    }
              }
              animate={
                doMorph
                  ? {
                      left: peakLeftFor(morphNow ? peakPt : currentPeakPt),
                      top: peakTopFor(morphNow ? peakPt : currentPeakPt),
                      opacity: 1,
                      scale: morphNow ? [1, 1.5, 1] : 1,
                      filter: morphNow
                        ? [
                            "drop-shadow(0 0 0px rgba(127,53,178,0))",
                            "drop-shadow(0 0 7px rgba(127,53,178,0.85))",
                            "drop-shadow(0 0 0px rgba(127,53,178,0))",
                          ]
                        : "drop-shadow(0 0 0px rgba(127,53,178,0))",
                    }
                  : {
                      left: peakLeftFor(peakPt),
                      top: peakTopFor(peakPt),
                      opacity: 1,
                      scale: 1,
                    }
              }
              transition={
                doDraw
                  ? {
                      delay: VIOLET_DELAY + 0.55,
                      type: "spring",
                      stiffness: 320,
                      damping: 22,
                    }
                  : {
                      left: { duration: MORPH_DUR, delay: MORPH_DELAY, ease: EXPO },
                      top: { duration: MORPH_DUR, delay: MORPH_DELAY, ease: EXPO },
                      // The pulse + glow land as the dot reaches the peak.
                      scale: {
                        duration: 0.85,
                        delay: PEAK_PULSE_DELAY,
                        ease: "easeInOut",
                        times: [0, 0.5, 1],
                      },
                      filter: {
                        duration: 0.85,
                        delay: PEAK_PULSE_DELAY,
                        ease: "easeInOut",
                        times: [0, 0.5, 1],
                      },
                    }
              }
            />
          ) : (
            <motion.span
              className="pointer-events-none absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet ring-2 ring-white"
              animate={{
                left: `calc(1.75rem + (100% - 1.75rem) * ${(peakPt.x / CURVE_W).toFixed(4)})`,
                top: `${((peakPt.y / CURVE_H) * 100).toFixed(2)}%`,
              }}
              // Match the personalized line's morph exactly so the dot stays glued
              // to the curve instead of springing on a different timing curve.
              transition={{ duration: 0.7, ease: EXPO }}
            />
          )
        ) : null}
        {personalized ? (
          doReveal ? (
            <motion.span
              key={`peak-label-${revealMode}`}
              className="absolute rounded-full bg-deep-black px-1.5 py-0.5 text-[9px] font-medium text-white"
              initial={
                doMorph
                  ? {
                      left: peakLabelLeftFor(currentPeakPt),
                      top: peakLabelTopFor(currentPeakPt),
                      opacity: 1,
                    }
                  : {
                      left: peakLabelLeftFor(peakPt),
                      top: peakLabelTopFor(peakPt),
                      opacity: 0,
                    }
              }
              animate={
                doMorph
                  ? {
                      left: peakLabelLeftFor(morphNow ? peakPt : currentPeakPt),
                      top: peakLabelTopFor(morphNow ? peakPt : currentPeakPt),
                      opacity: 1,
                    }
                  : {
                      left: peakLabelLeftFor(peakPt),
                      top: peakLabelTopFor(peakPt),
                      opacity: 1,
                    }
              }
              transition={
                doDraw
                  ? { delay: VIOLET_DELAY + 0.55, duration: 0.3, ease: EXPO }
                  : { duration: MORPH_DUR, delay: MORPH_DELAY, ease: EXPO }
              }
            >
              {fmtCompact(hero.peak.value)}
            </motion.span>
          ) : (
            <motion.span
              className="absolute rounded-full bg-deep-black px-1.5 py-0.5 text-[9px] font-medium text-white"
              animate={{
                left: `calc(1.75rem + (100% - 1.75rem) * ${(peakPt.x / CURVE_W).toFixed(4)} - 24px)`,
                top: `calc(${((peakPt.y / CURVE_H) * 100).toFixed(2)}% - 20px)`,
              }}
              transition={{ duration: 0.7, ease: EXPO }}
            >
              {fmtCompact(hero.peak.value)}
            </motion.span>
          )
        ) : null}
        <span className="absolute bottom-1 right-0 rounded-sm bg-white/80 px-1 text-[9px] text-gray-2">
          Age 90
        </span>
      </div>
      <AxisStrip />
      <AnimatePresence>
        {showLegend ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-x-3 gap-y-0.5 overflow-hidden pt-1.5 text-[9px] text-gray-1"
          >
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-[#9aa1a9]" />
              Typical retail experience
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-violet" />
              Your personalized alternative
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------ DrawdownLine -- */

const DD_W = 300;
const DD_H = 130;
const DD_MIN = -32; // fixed y-domain: +6 .. −32%
const DD_MAX = 6;

function drawdownPoints(stats: OutlookStats) {
  const n = stats.drawdownSeries.length;
  return stats.drawdownSeries.map((v, i) => ({
    x: (i / (n - 1)) * (DD_W - 34) + 4,
    y: ((DD_MAX - v) / (DD_MAX - DD_MIN)) * DD_H,
  }));
}

/**
 * "Potential asset loss in any given year": a jagged yearly-return line that
 * bottoms out at exactly −drawdownPct, with the percentage annotated at the
 * line's end.
 */
export function DrawdownLine({
  current,
  personalized,
  tall = false,
  fill = false,
}: {
  current?: OutlookStats;
  personalized?: OutlookStats;
  tall?: boolean;
  fill?: boolean;
}) {
  const series = [
    current && { key: "current", stats: current, color: SERIES_GREY },
    personalized && { key: "personalized", stats: personalized, color: SERIES_VIOLET },
  ].filter(Boolean) as { key: string; stats: OutlookStats; color: string }[];

  return (
    <div className={cn("flex w-full flex-col", fill && "lg:h-full")}>
      <div
        className={cn(
          "relative w-full",
          fill
            ? cn(tall ? "max-lg:h-72" : "max-lg:h-64", "lg:min-h-0 lg:flex-1")
            : tall
              ? "h-72"
              : "h-64",
        )}
      >
        <svg
          viewBox={`0 0 ${DD_W} ${DD_H}`}
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <line
            x1={0}
            x2={DD_W}
            y1={((DD_MAX - 0) / (DD_MAX - DD_MIN)) * DD_H}
            y2={((DD_MAX - 0) / (DD_MAX - DD_MIN)) * DD_H}
            stroke="#e5e7ea"
            strokeWidth={1}
          />
          <AnimatePresence>
            {series.map((s) => (
              <motion.path
                key={s.key}
                d={toPath(drawdownPoints(s.stats), true)}
                fill="none"
                stroke={s.color}
                strokeWidth={s.key === "personalized" ? 1.8 : 1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1, d: toPath(drawdownPoints(s.stats), true) }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: EXPO }}
              />
            ))}
          </AnimatePresence>
        </svg>
        <AnimatePresence>
          {series.map((s) => {
            const pts = drawdownPoints(s.stats);
            const end = pts[pts.length - 1];
            return (
              <motion.span
                key={s.key}
                className="absolute text-[9px] font-medium"
                style={{ color: s.color }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  left: `calc(${(end.x / DD_W) * 100}% + 4px)`,
                  top: `calc(${(end.y / DD_H) * 100}% - 6px)`,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                // Track the line's morph (same tween) so the % label follows the
                // drawdown end smoothly rather than on a separate spring.
                transition={{ duration: 0.6, ease: EXPO }}
              >
                <AnimatedNumber
                  value={-s.stats.drawdownPct}
                  format={(n) => `${Math.round(n)}%`}
                />
              </motion.span>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-divider/60 pt-1.5 text-[9px] text-gray-2">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-divider" />
          Asset return
        </span>
        <span>1 Year</span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- AllocationPie -- */

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  // Clamp so a full-circle segment still renders.
  const sweep = Math.min(a1 - a0, Math.PI * 2 - 0.001);
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a0 + sweep);
  const y1 = cy + r * Math.sin(a0 + sweep);
  const large = sweep > Math.PI ? 1 : 0;
  return `M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
}

/**
 * Solid pie of the asset mix. Segment angles are the allocation percentages,
 * so the pie is the same data as the "Allocation breakdown" list — and it
 * re-sweeps smoothly when the risk slider moves.
 */
export function AllocationPie({
  allocation,
  palette,
  className,
}: {
  allocation: AllocationBreakdown;
  palette: "grey" | "violet";
  className?: string;
}) {
  const colors = palette === "grey" ? PIE_GREYS : PIE_VIOLETS;
  const target = [
    allocation.equities,
    allocation.bonds,
    allocation.diversifiers,
    allocation.incomeAnnuities,
    allocation.growthAnnuities,
  ];
  // Key the tween on the actual numbers so it only re-runs on real changes.
  const targetKey = target.join(",");

  // We tween the raw allocation NUMBERS and recompute the arc paths every frame
  // (rather than letting Motion interpolate the SVG `d`, which breaks on arcs
  // when the large-arc flag flips or a slice drops out). This keeps the pie a
  // clean, continuously-correct sweep as the risk slider moves.
  const [vals, setVals] = useState(target);
  // Holds the latest animated values so a new tween can start from wherever the
  // last one left off. Updated inside the animation (never during render).
  const valsRef = useRef(vals);

  useEffect(() => {
    const from = valsRef.current;
    const to = targetKey.split(",").map(Number);
    const controls = animate(0, 1, {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (t) => {
        const next = from.map((f, i) => f + (to[i] - f) * t);
        valsRef.current = next;
        setVals(next);
      },
    });
    return () => controls.stop();
  }, [targetKey]);

  const total = vals.reduce((a, b) => a + b, 0) || 1;
  // Cumulative offsets computed without mutating outer state, so each segment's
  // start angle is derived purely from the slices before it.
  const segments = vals.map((v, i) => {
    const startSum = vals.slice(0, i).reduce((a, b) => a + b, 0);
    const a0 = -Math.PI / 2 + (startSum / total) * Math.PI * 2;
    const a1 = -Math.PI / 2 + ((startSum + v) / total) * Math.PI * 2;
    return { a0, a1, color: colors[i % colors.length], key: i };
  });

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {segments
        .filter((s) => s.a1 - s.a0 > 0.002)
        .map((s) => (
          <path key={s.key} fill={s.color} d={arcPath(50, 50, 48, s.a0, s.a1)} />
        ))}
    </svg>
  );
}
