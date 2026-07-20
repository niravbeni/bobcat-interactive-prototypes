"use client";

import { useEffect, useId, useState } from "react";
import { motion, animate, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowRight, CircleHelp } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AllocationBreakdown, OutlookStats } from "@/lib/outlook";
import { computeOutlook, SPENDING_RANGE } from "@/lib/outlook";
import { AnimatedNumber } from "@/components/prototypes/outlook/charts";
import { lossDomainMaxFor } from "../outlook-post-feedback/pfCharts";
import { SnapSlider } from "@/components/ui/SnapSlider";
import { SIG_EASE, SIG_HERO_GRADIENT, SIG_SPRING, fmtMoneyCents } from "./shared";

/* --------------------------------------------------------------- palette -- */

/** Per-asset-class colors for the Signature allocation visuals (white cards +
 *  the Sankey). On gradient cards the tiles use a translucent dark overlay. */
export const SIG_ALLOC_COLORS: Record<keyof AllocationBreakdown, string> = {
  equities: "#7f35b2",
  bonds: "#b268ea",
  diversifiers: "#c900ac",
  incomeAnnuities: "#00ccb4",
  growthAnnuities: "#327fef",
};

/** The uniform light-purple used for the Sankey's non-annuity flow band
 *  (sampled from Figma 2165:33637). */
const RIBBON_PURPLE = "#bf9ad9";

export const SIG_ALLOC_ORDER: {
  key: keyof AllocationBreakdown;
  label: string;
}[] = [
  { key: "equities", label: "Equities" },
  { key: "bonds", label: "Bonds" },
  { key: "diversifiers", label: "Diversifiers" },
  { key: "incomeAnnuities", label: "Income Annuities" },
  { key: "growthAnnuities", label: "Growth Annuities" },
];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const lerp = (lo: number, hi: number, t: number) => lo + (hi - lo) * t;

/**
 * Slider-independent y-domain for the Signature detail AssetCurve. Evaluating
 * `computeOutlook` at the slider extremes (for the current custom events) gives
 * a fixed frame that comfortably fits the tallest asset curve across the whole
 * market/spending/risk range, so the curve tweens *within* a steady frame as
 * the sliders move instead of re-snapping its scale (which read as "jumpy").
 * Only re-computes when the custom events change — never during a slider drag.
 *
 * The loss chart gets the same treatment via `lossDomainMax`: the adaptive
 * PF v2 domain re-snaps its scale in 150k steps when the (worst-case) losses
 * cross a threshold mid-drag, which read as the bars/gridlines jumping — most
 * visibly on large screens where the rescale spans more pixels. Sizing the
 * frame to the deepest losses across the whole slider range keeps it fixed, so
 * the bars grow/shrink smoothly within it instead of the axis rescaling.
 */
export function sigStableDomains(events?: string[]): {
  assetDomainTop: number;
  lossDomainMax: number;
} {
  // Tallest asset peak: best market + max risk + lowest spending.
  const hiAssets = computeOutlook({
    plan: "personalized",
    spendingAim: SPENDING_RANGE.min,
    marketT: 100,
    riskT: 100,
    events,
    preset: "sig",
  });
  const assetDomainTop = Math.max(
    1_750_000,
    Math.ceil((hiAssets.peak.value * 1.12) / 250_000) * 250_000,
  );

  // Deepest losses: worst market (marketT 0). Risk deepens only the
  // personalized plan's volatility (the current plan is risk-independent), and
  // spending doesn't affect losses — so the max-risk, worst-market corner
  // bounds both series. Framing to this fixed max means the axis never rescales
  // as the market slider moves; the bars just tween within it.
  const worstMarket = { marketT: 0, riskT: 100, events, preset: "sig" as const };
  const worstCurrent = computeOutlook({
    plan: "current",
    spendingAim: SPENDING_RANGE.min,
    ...worstMarket,
  });
  const worstPersonalized = computeOutlook({
    plan: "personalized",
    spendingAim: SPENDING_RANGE.min,
    ...worstMarket,
  });
  const lossDomainMax = lossDomainMaxFor([worstCurrent, worstPersonalized]);

  return { assetDomainTop, lossDomainMax };
}

/** Success %, and asset-curve value, ranges each plan can reach as the sliders
 *  sweep — used to tightly frame the small summary sparklines. */
export interface SigSparkDomains {
  /** Success-% domain for the Chance sparkline. */
  success: { loAll: number; hi: number; loPers: number; hiPers: number };
  /** Asset-value domain for the Assets sparkline. */
  assets: { loAll: number; hi: number; loPers: number; hiPers: number };
}

/**
 * Tight, slider-independent domains for the *small summary sparklines* (Chance /
 * Assets cards). Unlike the wide steady frame the detail `AssetCurve`/`LossBars`
 * use, these are fitted snugly to the value range each metric actually reaches
 * as the sliders sweep, so a change in success%/assets clearly moves the little
 * line. Computed from `computeOutlook` at the slider corners, so it's fixed
 * during a drag (the `d` path just tweens within it — smooth, never snapping)
 * and only re-derives when the custom events change.
 */
export function sigSparkDomains(events?: string[]): SigSparkDomains {
  const evalOutlook = (
    plan: "current" | "personalized",
    marketT: number,
    riskT: number,
    spendingAim: number,
  ) => computeOutlook({ plan, spendingAim, marketT, riskT, events, preset: "sig" });

  const persCorners: OutlookStats[] = [];
  const curCorners: OutlookStats[] = [];
  for (const marketT of [0, 100]) {
    for (const riskT of [0, 100]) {
      for (const spendingAim of [SPENDING_RANGE.min, SPENDING_RANGE.max]) {
        persCorners.push(evalOutlook("personalized", marketT, riskT, spendingAim));
        curCorners.push(evalOutlook("current", marketT, riskT, spendingAim));
      }
    }
  }

  const persSucc = persCorners.map((c) => c.successPct);
  const curSucc = curCorners.map((c) => c.successPct);
  const persAsset = persCorners.flatMap((c) => c.assetCurve.map((p) => p.value));
  const curAsset = curCorners.flatMap((c) => c.assetCurve.map((p) => p.value));

  return {
    success: {
      hi: Math.max(...persSucc, ...curSucc),
      loAll: Math.min(...persSucc, ...curSucc),
      hiPers: Math.max(...persSucc),
      loPers: Math.min(...persSucc),
    },
    assets: {
      hi: Math.max(...persAsset, ...curAsset),
      loAll: Math.min(...persAsset, ...curAsset),
      hiPers: Math.max(...persAsset),
      loPers: Math.min(...persAsset),
    },
  };
}

/** Widen a [lo, hi] domain by `frac` on each side so lines never hug the edges. */
function padDomain(lo: number, hi: number, frac: number): [number, number] {
  const pad = (hi - lo) * frac || 1;
  return [lo - pad, hi + pad];
}

/**
 * Signature personalized asset mix along the risk slider. Tuned so the
 * "Balanced" midpoint (riskT 50) reads exactly the frame's 35 / 15 / 10 / 20 /
 * 20, shifting toward equities/bonds at higher risk and toward annuities at
 * lower risk. Kept local to the Signature flow so the shared
 * `personalizedAllocation` (used by every other outlook flow) is untouched.
 */
export function sigAllocation(riskT: number): AllocationBreakdown {
  const r = clamp(riskT, 0, 100) / 100;
  const raw = {
    equities: lerp(21, 49, r),
    bonds: lerp(11, 19, r),
    diversifiers: lerp(13, 7, r),
    incomeAnnuities: lerp(28, 12, r),
    growthAnnuities: lerp(27, 13, r),
  };
  const rounded = {
    equities: Math.round(raw.equities),
    bonds: Math.round(raw.bonds),
    diversifiers: Math.round(raw.diversifiers),
    incomeAnnuities: Math.round(raw.incomeAnnuities),
    growthAnnuities: Math.round(raw.growthAnnuities),
  };
  const sum =
    rounded.equities +
    rounded.bonds +
    rounded.diversifiers +
    rounded.incomeAnnuities +
    rounded.growthAnnuities;
  rounded.equities += 100 - sum;
  return rounded;
}

/* ---------------------------------------------------- AllocationGrid tile -- */

function AllocTile({
  label,
  pct,
  color,
  variant,
  radius,
  delay,
}: {
  label: string;
  pct: number;
  color: string;
  variant: "gradient" | "white";
  radius: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, flexGrow: pct }}
      transition={{ ...SIG_SPRING, opacity: { duration: 0.4, ease: SIG_EASE, delay }, scale: { ...SIG_SPRING, delay } }}
      className="relative flex min-h-0 basis-0 flex-col justify-between overflow-hidden p-2.5"
      style={{
        borderRadius: radius,
        background: variant === "white" ? color : "rgba(0,0,0,0.10)",
      }}
    >
      <AnimatedNumber
        value={pct}
        format={(n) => `${Math.round(n)}%`}
        className="text-[15px] font-medium leading-none text-white"
      />
      <span className="text-[10px] font-medium leading-[1.15] text-white/90 [overflow-wrap:anywhere]">
        {label}
      </span>
    </motion.div>
  );
}

/**
 * Treemap-style asset-mix grid used on summary card 3. Three columns
 * (Equities · Bonds/Diversifiers · Income/Growth annuities), each tile sized to
 * its allocation weight so it re-flows smoothly as the risk slider moves.
 */
export function AllocationGrid({
  allocation,
  variant,
  startDelay = 0,
}: {
  allocation: AllocationBreakdown;
  variant: "gradient" | "white";
  startDelay?: number;
}) {
  const c = SIG_ALLOC_COLORS;
  const a = allocation;
  return (
    <div className="flex h-full min-h-[150px] w-full gap-0.5">
      <motion.div
        className="flex min-w-0 basis-0"
        animate={{ flexGrow: a.equities }}
        transition={SIG_SPRING}
      >
        <AllocTile
          label="Equities"
          pct={a.equities}
          color={c.equities}
          variant={variant}
          radius="16px 8px 8px 16px"
          delay={startDelay}
        />
      </motion.div>

      <motion.div
        className="flex min-w-0 basis-0 flex-col gap-0.5"
        animate={{ flexGrow: a.bonds + a.diversifiers }}
        transition={SIG_SPRING}
      >
        <AllocTile
          label="Bonds"
          pct={a.bonds}
          color={c.bonds}
          variant={variant}
          radius="8px 8px 2px 2px"
          delay={startDelay + 0.05}
        />
        <AllocTile
          label="Diversifiers"
          pct={a.diversifiers}
          color={c.diversifiers}
          variant={variant}
          radius="2px 2px 8px 8px"
          delay={startDelay + 0.1}
        />
      </motion.div>

      <motion.div
        className="flex min-w-0 basis-0 flex-col gap-0.5"
        animate={{ flexGrow: a.incomeAnnuities + a.growthAnnuities }}
        transition={SIG_SPRING}
      >
        <AllocTile
          label="Income Annuities"
          pct={a.incomeAnnuities}
          color={c.incomeAnnuities}
          variant={variant}
          radius="8px 16px 2px 2px"
          delay={startDelay + 0.15}
        />
        <AllocTile
          label="Growth Annuities"
          pct={a.growthAnnuities}
          color={c.growthAnnuities}
          variant={variant}
          radius="2px 2px 16px 8px"
          delay={startDelay + 0.2}
        />
      </motion.div>
    </div>
  );
}

/* --------------------------------------------------- summary sparklines -- */

const clampN = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Live-tweened `d` transition so a sparkline morphs (not snaps) when the
 *  slider-driven values change. */
const SPARK_TWEEN = { duration: 0.6, ease: SIG_EASE } as const;

/**
 * Build a lightly-rounded but still JAGGED mini path plus its end point from a
 * set of normalized y values (0 = top, 1 = bottom of the plot box). Uses short
 * cubic segments that pass THROUGH every point (Catmull-Rom → Bézier) so the
 * zig-zag amplitude of the shape is preserved (a pure quadratic-midpoint smooth
 * flattened the peaks). The corners keep a small radius so the line reads as a
 * lively hand-drawn sparkline rather than a hard polyline.
 */
function sparkPath(ys: number[], w: number, h: number) {
  const pts = ys.map((y, i) => ({
    x: (i / (ys.length - 1)) * (w - 14) + 6,
    y: clampN(y, 0, 1) * (h - 16) + 8,
  }));
  if (pts.length < 2) {
    const p = pts[0] ?? { x: 6, y: h / 2 };
    return { d: `M${p.x},${p.y}`, last: p };
  }
  // Catmull-Rom → cubic Bézier, tension kept very low so the jagged staircase
  // kinks stay angular (a higher tension rounds the steps into a smooth taper).
  const k = 0.1;
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) * k;
    const c1y = p1.y + (p2.y - p0.y) * k;
    const c2x = p2.x - (p3.x - p1.x) * k;
    const c2y = p2.y - (p3.y - p1.y) * k;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  return { d, last };
}

/**
 * Renders one or two overlaid mini lines: a solid "personalized" line and —
 * when `currentYs` is provided (comparison on) — a fainter "current plan" line
 * beneath it, with the end dot pinned to the personalized line. Each `d` path
 * draws in on mount and then tweens on change so the sparkline visibly moves as
 * the sliders update. Matches the two-line treatment on the comparison-on
 * summary cards (Figma 2165:32824); the single-line state matches 2165:33135.
 */
function OverlaySparkline({
  personalizedYs,
  currentYs,
  color,
  faintColor,
  dotRing = "rgba(255,255,255,0.7)",
  drawKey = "",
  className,
  w = 300,
  h = 100,
}: {
  personalizedYs: number[];
  currentYs?: number[];
  color: string;
  faintColor: string;
  /** Halo color around the end-dot (white on gradient cards, violet on white). */
  dotRing?: string;
  /** Bump to replay the draw-in (mount + comparison toggle). Slider-driven value
   *  changes keep the same key so the `d` path tweens smoothly instead. */
  drawKey?: string;
  className?: string;
  w?: number;
  h?: number;
}) {
  const reduce = useReducedMotion();
  const p = sparkPath(personalizedYs, w, h);
  const c = currentYs ? sparkPath(currentYs, w, h) : null;

  // Solid "personalized" line: draws on (re)mount + comparison toggle, then
  // tweens its `d` smoothly on slider changes (same drawKey → no redraw).
  const persTransition = reduce
    ? { opacity: { duration: 0.25 }, d: SPARK_TWEEN }
    : ({
        pathLength: { duration: 1.0, ease: SIG_EASE },
        opacity: { duration: 0.4, ease: SIG_EASE },
        d: SPARK_TWEEN,
      } as const);

  // Faint "current" line: mounts/unmounts with the comparison toggle so
  // AnimatePresence can stroke-reveal it in (staggered after the solid line)
  // and stroke-retract it out again — instead of a hard pop/cut.
  const faintEnter = reduce
    ? { opacity: 0.9, d: c?.d }
    : { pathLength: 1, opacity: 1, d: c?.d };
  const faintExit = reduce ? { opacity: 0 } : { pathLength: 0, opacity: 0 };
  const faintTransition = reduce
    ? { opacity: { duration: 0.25 } }
    : {
        pathLength: { duration: 0.85, ease: SIG_EASE },
        opacity: { duration: 0.4, ease: SIG_EASE },
        d: SPARK_TWEEN,
      };

  return (
    <div className={cn("relative h-full w-full", className)}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
        <AnimatePresence>
          {c ? (
            <motion.path
              key="faint-current"
              d={c.d}
              fill="none"
              stroke={faintColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
              animate={faintEnter}
              exit={faintExit}
              transition={{
                ...faintTransition,
                // Stagger the reveal a touch behind the solid line settling.
                pathLength: reduce
                  ? undefined
                  : { duration: 0.85, ease: SIG_EASE, delay: 0.18 },
              }}
            />
          ) : null}
        </AnimatePresence>
        <motion.path
          key={`p-${drawKey}`}
          d={p.d}
          fill="none"
          stroke={color}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
          animate={reduce ? { opacity: 1, d: p.d } : { pathLength: 1, opacity: 1, d: p.d }}
          transition={persTransition}
        />
      </svg>
      <motion.span
        key={`dot-${drawKey}`}
        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: color }}
        initial={
          reduce
            ? { scale: 1, opacity: 0, boxShadow: `0 0 0 3px ${dotRing}` }
            : { scale: 0, opacity: 0, boxShadow: `0 0 0 3px ${dotRing}` }
        }
        animate={{
          scale: 1,
          opacity: 1,
          left: `${(p.last.x / w) * 100}%`,
          top: `${(p.last.y / h) * 100}%`,
          // Soft glow that blooms once the line finishes drawing, then settles.
          boxShadow: reduce
            ? `0 0 0 3px ${dotRing}`
            : [
                `0 0 0 3px ${dotRing}`,
                `0 0 12px 4px ${dotRing}`,
                `0 0 0 3px ${dotRing}`,
              ],
        }}
        transition={{
          scale: reduce
            ? { duration: 0.2 }
            : { delay: 0.9, type: "spring", stiffness: 320, damping: 18 },
          opacity: { delay: reduce ? 0 : 0.9, duration: 0.2 },
          boxShadow: reduce
            ? { duration: 0 }
            : { delay: 0.95, duration: 0.9, ease: SIG_EASE },
          left: SPARK_TWEEN,
          top: SPARK_TWEEN,
        }}
      />
    </div>
  );
}

// --- expressive sparkline shape templates (0 = top, 1 = bottom of the box) ----
// Values are the JAGGED staircase profiles (Figma 2165:33015/33016): they carry
// the exaggerated angular up/down character, while the value-driven `level` /
// `amp` / `shift` below give the slider its visible lift & steepness. The solid
// personalized templates are deliberately spiky; the faint current templates are
// kept flatter/calmer so the personalized line's exaggeration stands out.
//
// Chance card: personalized starts HIGH on the left, holds high briefly, then
// steps DOWN in a jagged, staircase-like descent (drop, small up-kink, drop,
// …) — distinct angular segments, not a smooth taper. It keeps that spiky
// character across the middle, but the FINAL segment eases off (the last two
// control points are raised: …0.82, 0.74 instead of 0.9, 1.0) so the end dot
// lands noticeably HIGHER, pulling the personalized line clearly away from the
// faint current line at the endpoint. The faint current line (Figma
// 2165:33014) starts at ~the same top-left point and also clearly DESCENDS —
// but with only gentle stagger (tiny up-kinks rather than the personalized
// line's big reversals) — but drops steeper through the back half to a much
// lower endpoint, so the two read as distinct declining trajectories with a
// gap that widens conspicuously toward the right (new plan high, old plan
// falling away beneath it).
const SUCC_PERS_SHAPE = [
  0.0, 0.0, 0.04, 0.06, 0.26, 0.22, 0.3, 0.52, 0.48, 0.58, 0.78, 0.72, 0.82,
  0.74,
];
const SUCC_CUR_SHAPE = [
  0.02, 0.06, 0.05, 0.12, 0.2, 0.18, 0.3, 0.38, 0.4, 0.52, 0.64, 0.72, 0.88, 1.0,
];
// Assets card: personalized starts LOW on the left (high y) and climbs UP in a
// jagged zigzag/staircase (each rise overshoots, then dips slightly before the
// next, taller rise) to a HIGH peak (small y) near the end dot — energetic and
// clearly ascending. Templates are y-values (0 = top). The value-driven `shift`
// below moves the whole line so sliders visibly raise/lower it. The personalized
// shape climbs harder through the back half (lower tail values) so the new plan
// reaches decisively higher near the end dot. The faint current line (Figma
// 2165:33014) staggers UP much more shallowly and tops out low so it stays
// clearly BELOW the personalized peak, the gap widening toward the right.
const ASSET_PERS_SHAPE = [
  0.95, 0.88, 0.92, 0.72, 0.78, 0.56, 0.62, 0.4, 0.46, 0.24, 0.3, 0.12, 0.16,
  0.02,
];
// Kept >= ASSET_PERS_SHAPE at every index: since the current plan's assets are
// always <= the personalized plan's, its `shift` is always >= the personalized
// `shift`, so this element-wise ordering guarantees the current line never
// crosses above the personalized one — even at the personalized zigzag's early
// troughs near the shared bottom-left start.
const ASSET_CUR_SHAPE = [
  0.96, 0.92, 0.93, 0.84, 0.86, 0.78, 0.8, 0.74, 0.76, 0.7, 0.72, 0.66, 0.68,
  0.62,
];

/**
 * A "chance over time" shape whose whole vertical level tracks the success %
 * (mapped across the tight [lo, hi] domain) so a higher-success plan sits
 * clearly higher and a small slider change visibly lifts/drops the line. The
 * jagged template gives it real amplitude; `current` uses a gently-staggered
 * template with its own (large) amplitude so it clearly declines too, while
 * staying below the personalized line.
 */
function successYs(
  successPct: number,
  lo: number,
  hi: number,
  kind: "personalized" | "current",
): number[] {
  const shape = kind === "current" ? SUCC_CUR_SHAPE : SUCC_PERS_SHAPE;
  const t = clampN((successPct - lo) / Math.max(1, hi - lo), 0, 1);
  if (kind === "current") {
    // Current line starts near the personalized start (just below it) and
    // descends across most of the box height with a big-but-gentle amplitude,
    // so it reads as a clearly declining trajectory — not a flat line — and
    // ends well below the personalized endpoint dot. A larger amplitude (than
    // the personalized line's) plus a steeper tail in SUCC_CUR_SHAPE make the
    // old plan drop away sharply toward the right, so the gap between the two
    // lines widens conspicuously by the endpoint.
    const level = lerp(0.3, 0.12, t);
    const amp = lerp(0.66, 0.82, t);
    return shape.map((s) => level + s * amp);
  }
  // Higher success → the personalized line sits higher (smaller y) and has more
  // headroom to drop into its dramatic staircase descent.
  const level = lerp(0.4, 0.05, t);
  const amp = lerp(0.5, 0.56, t);
  return shape.map((s) => level + s * amp);
}

/**
 * A rising, jagged "assets over time" shape (Figma 2165:33016). The SHAPE is an
 * imposed lively staircase (so it never flattens to the wide cross-slider value
 * frame), while the value-driven vertical `shift` moves the whole line — a
 * higher assets-remaining figure lifts the line, so market/risk/spending changes
 * are clearly visible. `current` sits below `personalized`.
 */
function assetYs(
  curve: { value: number }[],
  min: number,
  max: number,
  kind: "personalized" | "current",
): number[] {
  const shape = kind === "current" ? ASSET_CUR_SHAPE : ASSET_PERS_SHAPE;
  // Drive the level off the assets-remaining figure (end of the curve).
  const repVal = curve[curve.length - 1]?.value ?? 0;
  const t = clampN((repVal - min) / Math.max(1, max - min), 0, 1);
  // Higher assets → shift the whole line up (negative y offset) so the jagged
  // ascent peaks higher. Widened a touch vs before so the high-assets
  // personalized line is lifted further up and the low-assets current line is
  // pushed further down — opening a bigger, obvious gap between the two.
  const shift = lerp(0.12, -0.08, t);
  return shape.map((s) => clampN(s + shift, 0.03, 0.97));
}

/**
 * The "chance your assets will last" mini line for summary card 1. Shows the
 * personalized line alone (comparison off) or the personalized line over a
 * fainter current-plan line (comparison on).
 */
export function SuccessSparkline({
  color,
  faintColor = "rgba(255,255,255,0.42)",
  dotRing,
  personalizedPct,
  currentPct,
  comparison = false,
  domain,
  className,
}: {
  color: string;
  faintColor?: string;
  dotRing?: string;
  personalizedPct: number;
  currentPct?: number;
  comparison?: boolean;
  /** Tight success-% frame from {@link sigSparkDomains}. Widened to include both
   *  plans in comparison mode; personalized-only (tighter) otherwise. */
  domain: SigSparkDomains["success"];
  className?: string;
}) {
  const showCurrent = comparison && currentPct !== undefined;
  const lo = showCurrent ? domain.loAll : domain.loPers;
  const hi = showCurrent ? domain.hi : domain.hiPers;
  return (
    <OverlaySparkline
      personalizedYs={successYs(personalizedPct, lo, hi, "personalized")}
      currentYs={
        showCurrent ? successYs(currentPct, lo, hi, "current") : undefined
      }
      color={color}
      faintColor={faintColor}
      dotRing={dotRing}
      drawKey={showCurrent ? "cmp" : "solo"}
      className={className}
      h={110}
    />
  );
}

/**
 * The "assets remaining" mini line for summary card 2, derived from the live
 * asset-projection curves so it re-shapes as the sliders move. Personalized
 * (solid) sits above a fainter current-plan line when comparison is on.
 */
export function AssetsSparkline({
  current,
  personalized,
  comparison = false,
  color,
  faintColor = "rgba(255,255,255,0.42)",
  dotRing,
  domain,
  className,
}: {
  current: OutlookStats;
  personalized: OutlookStats;
  comparison?: boolean;
  color: string;
  faintColor?: string;
  dotRing?: string;
  /** Tight asset-value frame from {@link sigSparkDomains}. Widened to include
   *  both plans in comparison mode; personalized-only (tighter) otherwise. */
  domain: SigSparkDomains["assets"];
  className?: string;
}) {
  const showCurrent = comparison;
  // A fixed (slider-independent) frame snug around the value range the sliders
  // can produce, so the line visibly rises/falls with market/risk/spending
  // instead of re-normalising to itself each render (which hid the movement).
  const [lo, hi] = padDomain(
    showCurrent ? domain.loAll : domain.loPers,
    showCurrent ? domain.hi : domain.hiPers,
    0.12,
  );
  return (
    <OverlaySparkline
      personalizedYs={assetYs(personalized.assetCurve, lo, hi, "personalized")}
      currentYs={
        showCurrent ? assetYs(current.assetCurve, lo, hi, "current") : undefined
      }
      color={color}
      faintColor={faintColor}
      dotRing={dotRing}
      drawKey={showCurrent ? "cmp" : "solo"}
      className={className}
      h={90}
    />
  );
}

/* ---------------------------------------------------------- AllocationSankey -- */

/** The current asset mix flowing into the personalized 5-way mix. */
export function AllocationSankey({
  personalized,
}: {
  personalized: AllocationBreakdown;
}) {
  const gradId = useId().replace(/:/g, "");
  const W = 560;
  const H = 340;
  const blockW = 46;
  const gap = 4; // vertical gap between stacked blocks (in svg units)
  const leftX = 96;
  const rightX = W - 96 - blockW;
  const leftFlowX = leftX + blockW;
  const rightFlowX = rightX;

  // Current side: fixed 45 / 55 (Figma frame), two blocks.
  const left = [
    { key: "equities", label: "Equities", pct: 45, color: SIG_ALLOC_COLORS.equities },
    { key: "bonds", label: "Bonds", pct: 55, color: SIG_ALLOC_COLORS.bonds },
  ];
  const right = SIG_ALLOC_ORDER.map((o) => ({
    ...o,
    pct: personalized[o.key],
    color: SIG_ALLOC_COLORS[o.key],
  }));

  // Convert a stack of pcts into [y, h] spans, distributing the inter-block gaps.
  const spans = (items: { pct: number }[]) => {
    const n = items.length;
    const usable = H - gap * (n - 1);
    let y = 0;
    return items.map((it) => {
      const h = (it.pct / 100) * usable;
      const span = { y, h };
      y += h + gap;
      return span;
    });
  };
  const leftSpans = spans(left);
  const rightSpans = spans(right);

  // Purple flow ribbons connect the LEFT column to the EXISTING-asset portion of
  // the right (Equities + Bonds + Diversifiers) — Figma 2165:33637. Each existing
  // right block draws from the same cumulative fraction of the left column (a
  // clean, non-crossing redistribution fan), so together the ribbons fill the
  // top ~60% of the left. The bottom (Income + Growth Annuities = "new money")
  // has NO purple ribbon — it reads as the hatched blue background flowing up
  // into the two annuity blocks.
  const existingKeys = new Set(["equities", "bonds", "diversifiers"]);
  const ribbons = right
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => existingKeys.has(r.key))
    .map(({ r, i }) => {
      const startPct = right.slice(0, i).reduce((a, b) => a + b.pct, 0);
      const ly0 = (startPct / 100) * H;
      const ly1 = ((startPct + r.pct) / 100) * H;
      const rs = rightSpans[i];
      const ry0 = rs.y;
      const ry1 = rs.y + rs.h;
      const mx = (leftFlowX + rightFlowX) / 2;
      const d = `M${leftFlowX},${ly0.toFixed(1)} C${mx},${ly0.toFixed(1)} ${mx},${ry0.toFixed(1)} ${rightFlowX},${ry0.toFixed(1)} L${rightFlowX},${ry1.toFixed(1)} C${mx},${ry1.toFixed(1)} ${mx},${ly1.toFixed(1)} ${leftFlowX},${ly1.toFixed(1)} Z`;
      return { d, key: r.key };
    });

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between px-1 text-sm font-semibold text-deep-black">
        <span>Your current assets</span>
        <span>Your personalized plan</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-[300px] w-full"
      >
        <defs>
          <pattern
            id={`hatch-${gradId}`}
            patternUnits="userSpaceOnUse"
            width="7"
            height="7"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="7"
              stroke="rgba(50,127,239,0.32)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Middle flow area: full-height faint-blue tint + diagonal hatch (Figma
            2165:33637). The hatch shows through wherever no purple ribbon covers
            it — i.e. the bottom region feeding the "new money" annuity blocks. */}
        <rect
          x={leftFlowX}
          y={0}
          width={rightFlowX - leftFlowX}
          height={H}
          fill="rgba(50,127,239,0.1)"
        />
        <rect
          x={leftFlowX}
          y={0}
          width={rightFlowX - leftFlowX}
          height={H}
          fill={`url(#hatch-${gradId})`}
        />

        {/* Purple flow ribbons (Equities + Bonds + Diversifiers). Geometry tweens
            as the risk slider re-weights the mix. */}
        {ribbons.map((rb, i) => (
          <motion.path
            key={rb.key}
            d={rb.d}
            fill={RIBBON_PURPLE}
            initial={{ opacity: 0, d: rb.d }}
            animate={{ opacity: 1, d: rb.d }}
            transition={{
              opacity: { duration: 0.6, ease: SIG_EASE, delay: 0.15 + i * 0.06 },
              d: SIG_SPRING,
            }}
          />
        ))}

        {/* Thin white dividers between the blocks and the flow area. */}
        <rect x={leftFlowX - 1.5} y={0} width={3} height={H} fill="#ffffff" />
        <rect x={rightFlowX - 1.5} y={0} width={3} height={H} fill="#ffffff" />

        {/* Left blocks */}
        {left.map((b, i) => {
          const s = leftSpans[i];
          return (
            <g key={b.key}>
              <motion.rect
                x={leftX}
                y={s.y}
                width={blockW}
                height={s.h}
                rx={6}
                fill={b.color}
                initial={{ opacity: 0, x: leftX - 12 }}
                animate={{ opacity: 1, x: leftX }}
                transition={{ duration: 0.4, ease: SIG_EASE, delay: i * 0.06 }}
              />
              <text
                x={leftX + blockW / 2}
                y={s.y + s.h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-[13px] font-semibold"
              >
                {b.pct}%
              </text>
              <text
                x={leftX - 10}
                y={s.y + s.h / 2}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-deep-black text-[12px]"
              >
                {b.label}
              </text>
            </g>
          );
        })}

        {/* Right blocks — height/position tween as the slider re-weights the mix. */}
        {right.map((b, i) => {
          const s = rightSpans[i];
          return (
            <g key={b.key}>
              <motion.rect
                width={blockW}
                rx={6}
                fill={b.color}
                initial={{ opacity: 0, x: rightX + 12, y: s.y, height: s.h }}
                animate={{ opacity: 1, x: rightX, y: s.y, height: s.h }}
                transition={{
                  opacity: { duration: 0.4, ease: SIG_EASE, delay: 0.2 + i * 0.06 },
                  x: { duration: 0.4, ease: SIG_EASE, delay: 0.2 + i * 0.06 },
                  y: SIG_SPRING,
                  height: SIG_SPRING,
                }}
              />
              <motion.text
                x={rightX + blockW / 2}
                initial={{ y: s.y + s.h / 2 }}
                animate={{ y: s.y + s.h / 2 }}
                transition={SIG_SPRING}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-[12px] font-semibold"
              >
                {b.pct}%
              </motion.text>
              <motion.text
                x={rightX + blockW + 10}
                initial={{ y: s.y + s.h / 2 }}
                animate={{ y: s.y + s.h / 2 }}
                transition={SIG_SPRING}
                textAnchor="start"
                dominantBaseline="middle"
                className="fill-deep-black text-[12px]"
              >
                {b.label}
              </motion.text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------- RiskSlider -- */

const RISK_STOPS = [0, 17, 33, 50, 67, 83, 100];
const RISK_LABELS = [
  "Fully Protected",
  "Protected",
  "Conservative",
  "Balanced",
  "Growth-leaning",
  "Growth",
  "Maximum Growth",
];

function riskLabelFor(riskT: number): string {
  let nearest = 0;
  let best = Infinity;
  RISK_STOPS.forEach((stop, i) => {
    const d = Math.abs(stop - riskT);
    if (d < best) {
      best = d;
      nearest = i;
    }
  });
  return RISK_LABELS[nearest];
}

/**
 * The refine-screen hero: "Your chosen risk level" + a live 7-stop risk slider.
 * The card fills with the signature purple gradient while the control is being
 * dragged or focused (r2), settling back to white at rest (r1).
 */
export function RiskSlider({
  riskT,
  onChange,
}: {
  riskT: number;
  onChange: (t: number) => void;
}) {
  const [engaged, setEngaged] = useState(false);
  const label = riskLabelFor(riskT);

  useEffect(() => {
    if (!engaged) return;
    const up = () => setEngaged(false);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, [engaged]);

  return (
    <motion.div
      onPointerDown={() => setEngaged(true)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={() => setEngaged(false)}
      className="relative overflow-hidden rounded-card border border-stroke-subtle"
      animate={{
        boxShadow: engaged
          ? "0 12px 34px -12px rgba(127,53,178,0.5)"
          : "0 0 0 0 rgba(127,53,178,0)",
      }}
      transition={SIG_SPRING}
    >
      {/* Gradient fill overlay springs in while engaged. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: SIG_HERO_GRADIENT }}
        initial={false}
        animate={{ opacity: engaged ? 1 : 0 }}
        transition={SIG_SPRING}
      />
      <div className="relative grid grid-cols-1 items-center gap-4 bg-white/0 px-5 py-4 sm:grid-cols-[220px_1fr] sm:gap-6">
        <div className="flex flex-col">
          <span
            className={cn(
              "text-[11px] font-medium transition-colors",
              engaged ? "text-white/80" : "text-gray-1",
            )}
          >
            Your chosen risk level
          </span>
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: SIG_EASE }}
            className={cn(
              "text-[26px] font-medium leading-tight tracking-[-0.5px] transition-colors",
              engaged ? "text-white" : "text-violet",
            )}
          >
            {label}
          </motion.span>
        </div>

        <div className="flex flex-col">
          <SnapSlider
            aria-label="Risk level"
            value={riskT}
            snapPoints={RISK_STOPS}
            onChange={onChange}
            accent="violet"
          />
          <div className="mt-2 flex items-center justify-between">
            <span
              className={cn(
                "flex items-center gap-1 text-[12px] transition-colors",
                engaged ? "text-white/90" : "text-gray-1",
              )}
            >
              Increased Protection
              <CircleHelp className="size-3.5 opacity-70" strokeWidth={2} />
            </span>
            <span
              className={cn(
                "flex items-center gap-1 text-[12px] transition-colors",
                engaged ? "text-white/90" : "text-gray-1",
              )}
            >
              Increased Returns
              <CircleHelp className="size-3.5 opacity-70" strokeWidth={2} />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { RISK_STOPS };

/* ------------------------------------------------- AdditionalKeyBenefits -- */

/** Counts a value up from zero once, on mount (mirrors AnimatedNumber's
 *  allowed animate()+onUpdate pattern rather than a bare setState-in-effect). */
function CountUpOnce({
  to,
  format,
  className,
  delay = 0,
}: {
  to: number;
  format: (n: number) => string;
  className?: string;
  delay?: number;
}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const controls = animate(0, to, {
      duration: 1.1,
      delay,
      ease: SIG_EASE,
      onUpdate: (val) => setV(val),
    });
    return () => controls.stop();
  }, [to, delay]);
  return <span className={className}>{format(v)}</span>;
}

const BENEFITS: {
  value: number;
  format: (n: number) => string;
  body: string;
  rule: string;
}[] = [
  {
    value: 134892,
    format: fmtMoneyCents,
    body: "Saved in lifetime fees paid when compared with typical retail fees.",
    rule: "linear-gradient(#14b8a6, #327fef)",
  },
  {
    value: 4500,
    format: fmtMoneyCents,
    body: "Guaranteed monthly income for life, lowering risk of running out of money.",
    rule: "linear-gradient(#7f35b2, #d124b8)",
  },
  {
    value: 34,
    format: (n) => `${Math.round(n)}%`,
    body: "Smaller losses in short-term economic downturns.",
    rule: "linear-gradient(#d124b8, #ff9f5c)",
  },
];

/** The "Additional key benefits" strip: three count-up figures with a colored
 *  left rule, real body copy and an inert "Learn more" pill (Figma 2165:33086). */
export function AdditionalKeyBenefits() {
  return (
    <div className="@container relative overflow-hidden rounded-card border border-stroke-subtle bg-white px-6 pb-8 pt-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/signature/card-texture.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.04] mix-blend-multiply"
      />
      <p className="relative text-2xl font-normal leading-none tracking-[-0.48px] text-black/50">
        Additional key benefits
      </p>
      {/* Container queries (not viewport): the card area is narrowed by the fixed
          sidebar, so we only go 3-up once the card itself is genuinely wide
          enough for three wide currency figures — otherwise it stacks cleanly. */}
      <div className="relative mt-6 grid grid-cols-1 gap-6 @2xl:grid-cols-2 @4xl:grid-cols-3">
        {BENEFITS.map((b, i) => (
          <div key={b.body} className="flex min-w-0 items-stretch gap-4">
            <span
              aria-hidden
              className="w-[3px] shrink-0 rounded-full"
              style={{ background: b.rule }}
            />
            <div className="flex min-w-0 flex-col items-start gap-3 py-1">
              <CountUpOnce
                to={b.value}
                format={b.format}
                delay={0.15 + i * 0.12}
                className="max-w-full truncate text-[40px] font-light leading-none tracking-[-2px] text-deep-black @4xl:text-[36px]"
              />
              <p className="text-sm leading-snug tracking-[-0.32px] text-deep-black">
                {b.body}
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-medium text-deep-black shadow-[0_1px_2px_rgba(16,24,32,0.08)] transition-colors hover:bg-ghost-white"
              >
                Learn more
                <ArrowRight className="size-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
