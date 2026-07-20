"use client";

import { useEffect, useRef, useState } from "react";

/** Shared easing used across the signature flow's motion. */
export const SIG_EASE = [0.22, 1, 0.36, 1] as const;

/** Shared spring used for accordions, layout shifts and settle micro-motions
 *  so expand/collapse and row-insertion feel cohesive across all screens. */
export const SIG_SPRING = { type: "spring", stiffness: 260, damping: 30 } as const;

/** Snappier spring for small, tactile elements (rows popping in, chips). */
export const SIG_SPRING_SNAPPY = {
  type: "spring",
  stiffness: 420,
  damping: 32,
} as const;

/**
 * CANONICAL signature purple hero gradient — verbatim from the Figma
 * Banner/Advisor Banner fill (#742CA5 19.541% → #D124B8 137.51%). This is the
 * single source of truth for the standard purple hero card.
 *
 * Phase 2 adoption: Story, Assets, and Expense hero cards should all use this
 * constant. Figma renders these frames at slightly different angles
 * (Assets 191.69deg, Expense 194.49deg) but with identical stops; we unify on
 * 198deg here. Swap the per-screen inline gradients to `SIG_HERO_GRADIENT` in
 * Phase 2 (do not edit those screen files in this token-consolidation phase).
 */
export const SIG_HERO_GRADIENT =
  "linear-gradient(198deg, #742ca5 19.541%, #d124b8 137.51%)";

/**
 * CANONICAL Home hero gradient — Home base (Figma frame 2165:28944, hero node
 * 2165:28945) uses a distinct BLUE → PURPLE → BEIGE blend, genuinely different
 * from the standard purple hero. Figma layers three fills:
 *   - linear 172.92deg  blue  #3078c2 (18.3%) → beige #d3bfb3 (85.1%)
 *   - linear 226.33deg  purple #742ca5        → cream #fbe0c1
 *   - solid mauve base  #887ba2
 * Reproduced here as a single diagonal (~200deg, matching the other hero
 * tokens) that reads blue at the top, purple through the middle, and warms to
 * beige at the bottom — the exact Figma stops in the exact Figma order. A
 * subtle top-left radial darkens the text-bearing corner so the white hero
 * copy keeps contrast (the light beige only reaches the lower/right region,
 * behind the photo cut-out and the overlapping "Your details" card).
 */
export const SIG_HOME_GRADIENT =
  "radial-gradient(120% 120% at 15% 0%, rgba(28,18,66,0.28) 0%, rgba(28,18,66,0) 55%), linear-gradient(200deg, #3078c2 0%, #5e389f 28%, #742ca5 48%, #9a6bab 74%, #d3bfb3 100%)";

export const fmtMoney = (n: number): string =>
  `$${Math.round(n).toLocaleString("en-US")}`;

export const fmtMoneyCents = (n: number): string =>
  `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * Smoothly animates a displayed number toward `target` with an ease-out ramp.
 * Used for the net-worth card so each added account visibly counts up.
 */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo — a fast, satisfying ramp that settles softly on the total.
      const eased = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const next = from + (target - from) * eased;
      setValue(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, duration]);

  return value;
}
