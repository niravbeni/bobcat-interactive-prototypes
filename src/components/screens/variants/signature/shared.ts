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

/** The signature purple hero gradient — verbatim from the Figma
 *  Banner/Advisor Banner fill (198deg, #742CA5 19.541% → #D124B8 137.51%). */
export const SIG_HERO_GRADIENT =
  "linear-gradient(198deg, #742ca5 19.541%, #d124b8 137.51%)";

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
