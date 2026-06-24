"use client";

import { useState } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { DetailsSidebar } from "@/components/chrome/DetailsSidebar";
import { BasicDetailsBar } from "@/components/v2/BasicDetailsBar";
import { Button } from "@/components/ui/Button";
import { SnapSlider } from "@/components/ui/SnapSlider";
import { FullscreenPlaceholder } from "@/components/v2/FullscreenPlaceholder";
import { cn } from "@/lib/cn";

/** Lifetime fee of the user's current plan, in thousands (constant baseline). */
const CURRENT_FEE_K = 272;

/** Numeric key points at t = 0 (worst), 50 (typical), 100 (best). */
interface PlanPoint {
  income: number; // dollars per month
  success: number; // percent
  cone: number; // 0..1 cone opening (smaller = more certain)
  altFeeK: number; // alternative-plan lifetime fee, thousands
  altBar: number; // 0..1 alternative-plan bar height
}

const PLAN_POINTS: PlanPoint[] = [
  { income: 5200, success: 78, cone: 0.85, altFeeK: 152, altBar: 0.56 },
  { income: 7500, success: 96, cone: 0.5, altFeeK: 72, altBar: 0.26 },
  { income: 9400, success: 99, cone: 0.28, altFeeK: 12, altBar: 0.1 },
];

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

interface Preset {
  income: string;
  success: string;
  cone: number;
  feeSaving: string;
  currentFee: string;
  altFee: string;
  altBar: number;
}

/** Interpolate the card values for a continuous Plan Conditions position (0..100). */
function planAt(t: number): Preset {
  const clamped = Math.min(100, Math.max(0, t));
  const seg = clamped <= 50 ? 0 : 1;
  const f = seg === 0 ? clamped / 50 : (clamped - 50) / 50;
  const a = PLAN_POINTS[seg];
  const b = PLAN_POINTS[seg + 1];
  const income = Math.round(lerp(a.income, b.income, f) / 100) * 100;
  const success = Math.round(lerp(a.success, b.success, f));
  const cone = lerp(a.cone, b.cone, f);
  const altFeeK = Math.round(lerp(a.altFeeK, b.altFeeK, f));
  const altBar = lerp(a.altBar, b.altBar, f);
  return {
    income: `$${income.toLocaleString("en-US")}`,
    success: `${success}%`,
    cone,
    feeSaving: `$${CURRENT_FEE_K - altFeeK}k`,
    currentFee: `$${CURRENT_FEE_K}k`,
    altFee: `$${altFeeK}k`,
    altBar,
  };
}

/** A single tall metric card: value + caption + visual. */
function OutlookCard({
  value,
  caption,
  children,
}: {
  value: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-field bg-ghost-white p-5 sm:p-6">
      <p className="text-center text-3xl font-semibold tracking-[-0.01em] text-deep-black 3xl:text-4xl">
        {value}
      </p>
      <p className="mx-auto mt-2 max-w-[200px] text-center text-sm leading-snug text-gray-text">
        {caption}
      </p>
      <div className="mt-4 flex min-h-0 flex-1 flex-col justify-end">{children}</div>
    </div>
  );
}

/** Bar heights at each age-range key point: dips in the middle, rises again. */
const INCOME_BARS_BY_POS: [number, number][] = [
  [0.7, 0.85], // early retirement (t=0)
  [0.42, 0.52], // mid — dips (t=50)
  [0.82, 0.97], // late retirement — rises again (t=100)
];

const AGE_RANGE_LABELS = [
  "Early Retirement Ages 65 - 75",
  "Mid Retirement Ages 70 - 80",
  "Late Retirement Ages 75 - 85",
];

const AGE_SNAP_POINTS = [0, 50, 100];

/** Interpolated [bar1, bar2] heights for a continuous age position (0..100). */
function barsAt(t: number): [number, number] {
  const clamped = Math.min(100, Math.max(0, t));
  const seg = clamped <= 50 ? 0 : 1;
  const f = seg === 0 ? clamped / 50 : (clamped - 50) / 50;
  const a = INCOME_BARS_BY_POS[seg];
  const b = INCOME_BARS_BY_POS[seg + 1];
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
}

/**
 * Card 1: two vertical bars over a baseline. The age-range slider shapes the
 * dip/rise pattern; the Plan Conditions value scales the overall height so the
 * graphic also responds when the scenario changes.
 */
function IncomeVisual({ conditionT }: { conditionT: number }) {
  const [t, setT] = useState(0);
  const factor = 0.65 + (Math.min(100, Math.max(0, conditionT)) / 100) * 0.35;
  const bars = barsAt(t).map((h) => Math.min(1, h * factor));
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="relative min-h-[72px] flex-1">
        <div className="absolute inset-x-0 top-1/2 h-px bg-deep-black" />
        <div className="flex h-full items-center justify-center gap-4 sm:gap-5">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-10 rounded-sm bg-divider transition-[height] duration-200 ease-out sm:w-14"
              style={{ height: `${Math.round(h * 100)}%` }}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SnapSlider
          className="w-3/4"
          aria-label="Retirement age range"
          value={t}
          snapPoints={AGE_SNAP_POINTS}
          onChange={setT}
        />
        <p className="text-center text-[11px] text-gray-2">
          {AGE_RANGE_LABELS[Math.round(t / 50)]}
        </p>
      </div>
    </div>
  );
}

/** Card 2: nested fan/cones that narrow as certainty rises. */
function ConeVisual({ opening }: { opening: number }) {
  const outer = Math.max(6, Math.round(opening * 46));
  const inner = Math.max(3, Math.round(outer * 0.5));
  return (
    <div className="relative h-full min-h-[80px]">
      <div className="absolute inset-x-0 top-1/2 h-px bg-deep-black" />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <polygon
          points={`6,50 94,${50 - outer} 94,${50 + outer}`}
          className="fill-gray-2/30 transition-all duration-200 ease-out"
        />
        <polygon
          points={`6,50 94,${50 - inner} 94,${50 + inner}`}
          className="fill-gray-2/70 transition-all duration-200 ease-out"
        />
      </svg>
    </div>
  );
}

/** One labelled fee bar that grows from the baseline up to `frac` of the track. */
function FeeBar({
  label,
  value,
  frac,
  solid,
}: {
  label: string;
  value: string;
  frac: number;
  solid?: boolean;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col items-center gap-2">
      <div className="flex w-full flex-1 items-end justify-center">
        <div
          className="flex w-12 flex-col items-center justify-end transition-[height] duration-300 ease-out sm:w-16"
          style={{ height: `${Math.round(frac * 100)}%` }}
        >
          <span className="mb-1 whitespace-nowrap text-xs font-medium text-deep-black">
            {value}
          </span>
          <div
            className={cn(
              "w-full flex-1 rounded-sm",
              solid ? "bg-gray-2/70" : "bg-divider",
            )}
          />
        </div>
      </div>
      <span className="text-center text-[11px] text-gray-2">{label}</span>
    </div>
  );
}

/** Card 3: current vs alternative plan fee bars. */
function FeeVisual({
  currentFee,
  altFee,
  altBar,
}: {
  currentFee: string;
  altFee: string;
  altBar: number;
}) {
  return (
    <div className="flex h-full min-h-[80px] items-stretch justify-center gap-8 sm:gap-10">
      <FeeBar label="Current plan" value={currentFee} frac={1} solid />
      <FeeBar label="Alternative plan" value={altFee} frac={altBar} />
    </div>
  );
}

export function OutlookDashboardScreen() {
  const { answers } = useFlow();
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const preset = planAt(answers.planConditionT);

  return (
    <AppShell
      fill
      card={false}
      customSidebar={<DetailsSidebar variant="outlook" />}
      footer={<BasicDetailsBar />}
    >
      <div className="scrollbar-slim flex min-h-0 w-full flex-1 flex-col gap-5 overflow-y-auto rounded-field bg-white p-5 3xl:p-7">
        {/* Top section — heading + actions in one card */}
        <div className="flex flex-col gap-5 rounded-field bg-ghost-white p-5 sm:p-6 xl:p-8">
          <div className="flex items-center gap-5 sm:gap-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/flower.svg"
              alt=""
              className="size-24 shrink-0 object-contain sm:size-36 3xl:size-44"
            />
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-semibold leading-[1.25] tracking-[-0.01em] text-deep-black sm:text-2xl 3xl:text-3xl">
                A first look... Your current outlook.
                <br />
                More confidence, less lost to fees.
              </h1>
              <p className="max-w-[420px] text-sm leading-snug text-gray-text sm:text-base">
                Based on the details you&rsquo;ve shared so far. Keep adding
                information to sharpen these numbers and see how lower fees could
                grow your retirement.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <Button
              variant="outline"
              size="md"
              className="ai-glow w-full !border-violet/40 !text-violet hover:!bg-violet/5 sm:w-auto"
              onClick={() => setAdvisorOpen(true)}
            >
              Book a chat to advisor
            </Button>
          </div>
        </div>

        {/* Metrics — three separate tall cards in a row */}
        <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-5 md:grid-cols-3">
          <OutlookCard
            value={preset.income}
            caption="income per month, more security over time"
          >
            <IncomeVisual conditionT={answers.planConditionT} />
          </OutlookCard>
          <OutlookCard
            value={preset.success}
            caption="chance of plan success for expected lifetime"
          >
            <ConeVisual opening={preset.cone} />
          </OutlookCard>
          <OutlookCard
            value={preset.feeSaving}
            caption="estimate lifetime fee saving"
          >
            <FeeVisual
              currentFee={preset.currentFee}
              altFee={preset.altFee}
              altBar={preset.altBar}
            />
          </OutlookCard>
        </div>
      </div>

      {advisorOpen ? (
        <FullscreenPlaceholder
          eyebrow="Book an advisor"
          title="Booking a chat with an advisor"
          copy="We're still designing this. You'll be able to find a time with a WTW retirement advisor right here."
          backLabel="Back to outlook"
          onClose={() => setAdvisorOpen(false)}
        />
      ) : null}
    </AppShell>
  );
}
