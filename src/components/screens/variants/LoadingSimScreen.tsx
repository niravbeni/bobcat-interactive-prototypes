"use client";

import { useEffect, useState } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";

/** How long the simulated "crunching numbers" pause runs before advancing. */
const DURATION_MS = 3400;

/**
 * A brief "running the Monte Carlo simulation" pause shown between the profile
 * madlib and the draft outlook. The progress bar fills over {@link DURATION_MS}
 * and then auto-advances to the next step.
 */
export function LoadingSimScreen() {
  const { goNext } = useFlow();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      setProgress(t);
      if (t < 1) raf = requestAnimationFrame(tick);
      else window.setTimeout(goNext, 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [goNext]);

  return (
    <AppShell fill card={false} hideSidebar>
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-[680px] text-2xl font-semibold leading-[1.15] tracking-[-0.01em] text-deep-black sm:text-3xl">
          We&rsquo;re now analyzing &amp; building your plan
        </h1>
        <p className="mx-auto mt-4 max-w-[560px] text-sm leading-snug text-gray-text sm:text-base">
          Using a Monte Carlo Simulator we&rsquo;ve considered 5,000 scenarios,
          spanning market volatility, likelihood of health trends, and more.
        </p>

        {/* The exported illustration also bakes in a "Simulating..." label and a
            static bar at the bottom; we crop those off and render our own
            animated bar below so it actually moves. */}
        <div
          className="relative mt-8 w-full max-w-[620px] overflow-hidden"
          style={{ aspectRatio: "1436 / 520" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/simulating.png"
            alt="Branching retirement scenarios fanning out from a single person"
            className="absolute left-0 top-0 w-full"
          />
        </div>

        <div className="mt-6 w-full max-w-[420px]">
          <p className="text-center text-sm font-semibold text-violet">
            Simulating&hellip;
          </p>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-pill bg-violet/15">
            <div
              className="h-full rounded-pill bg-violet transition-[width] duration-150 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
