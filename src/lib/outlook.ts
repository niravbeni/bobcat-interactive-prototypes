/**
 * Outlook-flow model: the single source of truth for every number and chart in
 * the Outlook Flow prototype. All screens call {@link computeOutlook} with the
 * live slider inputs, so headlines, bars, curves and pies always agree — the
 * failure bar is exactly 100 − success, the asset curve's age-90 value IS the
 * "Expected assets remaining" headline, and the drawdown line bottoms out at
 * exactly the quoted drawdown percentage.
 *
 * At the default inputs (spendingAim 12000, marketT 50, riskT 50) the outputs
 * reproduce Gloria's CSV reference numbers:
 *   current       → 60% success, $182,000 assets at 90, $220,000 loss, 17% dd
 *   personalized  → 72% success, $400,000 assets at 90, $190,000 loss, 15% dd
 *
 * The "pfV2" preset swaps ONLY the base constants (all modifier math is shared)
 * to reproduce the Post-Feedback v2 reference table at the same default inputs:
 *   current       → 86% success, ~$1,346,000 assets at 90, $254,000 loss
 *   personalized  → 97% success, ~$2,085,000 assets at 90, $127,000 loss
 * The $254k / $127k loss headlines are chosen so the 5-bucket loss chart lands
 * in the table's range: the deepest (0.1) bucket is 1.9× the headline, so
 * current peaks at ~$483k and personalized at ~$242k (see lossAtProbability).
 */

export type PlanKind = "current" | "personalized";

export interface OutlookInputs {
  plan: PlanKind;
  /** Monthly spending aim in dollars (sidebar slider, 8000..16000). */
  spendingAim: number;
  /** Market scenario, 0 (worst case) → 100 (best case). */
  marketT: number;
  /** Risk profile, 0 (low) → 100 (high). Only affects the personalized plan. */
  riskT: number;
  /** Active "custom event" ids (see {@link OUTLOOK_EVENTS}) modelled onto the
   * timeline. Undefined/empty reproduces the untouched baseline numbers. */
  events?: string[];
  /**
   * Which set of base constants to use. "default" is the original CSV baseline
   * shared by the base / enhanced / post-feedback-v1 flows; "pfV2" swaps in the
   * Post-Feedback v2 reference-table numbers (86%/97%, ~1.346M/~2.085M); "sig"
   * swaps in the Signature-flow frame numbers (84%/95%, ~1.43M/~1.55M, so the
   * personalized plan reads ~95% success, ~$1.55M at age 90 and ~+$104k average
   * lifetime delta). Only the base constants differ — every modifier
   * (market/spending/risk, events, curve, drawdown, allocation) is shared.
   */
  preset?: "default" | "pfV2" | "sig";
}

export interface AllocationBreakdown {
  equities: number;
  bonds: number;
  diversifiers: number;
  incomeAnnuities: number;
  growthAnnuities: number;
}

export interface OutlookStats {
  plan: PlanKind;
  /** Chance of plan success, percent (0..99). */
  successPct: number;
  /** 100 − success; this is what the bar charts plot. */
  failurePct: number;
  /** Expected assets remaining at age 90 — the headline dollar number. */
  assetsAt90: number;
  /** Asset projection from age 60 to 90; last point's value === assetsAt90. */
  assetCurve: { age: number; value: number }[];
  /** The curve's highest point (for the peak marker on the chart). */
  peak: { age: number; value: number };
  /** Potential asset loss in any given year — headline dollar number. */
  potentialLoss: number;
  /** Worst-year drawdown percent; the jagged line bottoms out here. */
  drawdownPct: number;
  /** Yearly-return wiggle series ending at −drawdownPct (for the line chart). */
  drawdownSeries: number[];
  /** Lifetime fees paid (current plan headline). */
  lifetimeFees: number;
  /** Fee savings vs the current plan (personalized headline). */
  feeSavings: number;
  /** Asset-mix percentages; always sums to 100. */
  allocation: AllocationBreakdown;
}

/** Deltas between the personalized and current plans, for the green pills. */
export interface OutlookDeltas {
  successPts: number;
  assetsAt90: number;
  lossReduction: number;
  drawdownPts: number;
}

export const OUTLOOK_DEFAULTS = {
  spendingAim: 12000,
  marketT: 50,
  riskT: 50,
};

export const SPENDING_RANGE = { min: 8000, max: 16000 };

/* -------------------------------------------------------- custom events -- */

/** How a modelled event bends the asset curve near its age. */
export type EventShape =
  /** A localized dip/hump that fades back — e.g. a crash or one-off expense. */
  | "dip"
  /** A permanent level shift from the event age onward — e.g. an inheritance. */
  | "step";

export interface OutlookEventEffects {
  /** Signed dollars added to the curve near the event age (before recompute). */
  assetShift: number;
  /** Whether the shift is a transient dip/hump or a permanent step. */
  shape: EventShape;
  /** Signed percentage-points folded into chance of success. */
  successPts: number;
  /** Signed dollars folded into the potential-loss headline. */
  lossShift: number;
  /** Signed percentage-points folded into worst-year drawdown. */
  drawdownPts: number;
}

export interface OutlookEvent {
  id: string;
  label: string;
  description: string;
  category: "market" | "life";
  /** Directional hint for the UI (net effect on the outlook). */
  direction: "up" | "down";
  /** Age (60..90) at which the event lands on the timeline. */
  age: number;
  /** lucide-react icon name, resolved to a component in the modal. */
  icon: string;
  effects: OutlookEventEffects;
}

/**
 * The catalog of life/market events the user can model onto their timeline.
 * Deterministic, signed magnitudes — a mix of positive and negative — chosen so
 * the reshaped curves read clearly against the 60→90 projection. Applied to
 * BOTH plans so the comparison stays coherent.
 */
export const OUTLOOK_EVENTS: OutlookEvent[] = [
  {
    id: "market-crash",
    label: "Market crash",
    description: "A sharp, sudden bear market rattles your portfolio.",
    category: "market",
    direction: "down",
    age: 70,
    icon: "TrendingDown",
    effects: {
      assetShift: -320_000,
      shape: "dip",
      successPts: -12,
      lossShift: 95_000,
      drawdownPts: 9,
    },
  },
  {
    id: "bull-market",
    label: "Prolonged bull market",
    description: "A long stretch of strong returns lifts your assets.",
    category: "market",
    direction: "up",
    age: 67,
    icon: "TrendingUp",
    effects: {
      assetShift: 250_000,
      shape: "step",
      successPts: 7,
      lossShift: -30_000,
      drawdownPts: -3,
    },
  },
  {
    id: "inheritance",
    label: "Inheritance",
    description: "A lump sum from a loved one steps up your savings.",
    category: "life",
    direction: "up",
    age: 72,
    icon: "Gift",
    effects: {
      assetShift: 300_000,
      shape: "step",
      successPts: 8,
      lossShift: 0,
      drawdownPts: 0,
    },
  },
  {
    id: "medical-expense",
    label: "Major medical expense",
    description: "A large out-of-pocket health cost draws down assets.",
    category: "life",
    direction: "down",
    age: 78,
    icon: "Stethoscope",
    effects: {
      assetShift: -185_000,
      shape: "dip",
      successPts: -6,
      lossShift: 60_000,
      drawdownPts: 3,
    },
  },
  {
    id: "downsize-home",
    label: "Downsize your home",
    description: "Selling the family home frees up home equity.",
    category: "life",
    direction: "up",
    age: 75,
    icon: "Home",
    effects: {
      assetShift: 220_000,
      shape: "step",
      successPts: 5,
      lossShift: 0,
      drawdownPts: -1,
    },
  },
  {
    id: "early-retirement",
    label: "Early retirement",
    description: "Retiring at 63 means fewer contributions, longer drawdown.",
    category: "life",
    direction: "down",
    age: 63,
    icon: "Armchair",
    effects: {
      assetShift: -240_000,
      shape: "step",
      successPts: -9,
      lossShift: 20_000,
      drawdownPts: 2,
    },
  },
  {
    id: "long-term-care",
    label: "Long-term care need",
    description: "Late-life care costs weigh on your final years.",
    category: "life",
    direction: "down",
    age: 82,
    icon: "HeartPulse",
    effects: {
      assetShift: -260_000,
      shape: "dip",
      successPts: -8,
      lossShift: 70_000,
      drawdownPts: 5,
    },
  },
];

/** Resolve active event ids to their catalog entries (order-stable). */
export function resolveEvents(ids?: string[]): OutlookEvent[] {
  if (!ids || ids.length === 0) return [];
  return OUTLOOK_EVENTS.filter((e) => ids.includes(e.id));
}

const round1000 = (n: number) => Math.round(n / 1000) * 1000;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Smooth deterministic projection curve. `start` grows with contributions and
 * market returns, peaks, then draws down toward `end` at age 90. The bump term
 * controls how far the curve overshoots its endpoints mid-flight.
 */
function buildCurve(start: number, end: number, bump: number) {
  const points: { age: number; value: number }[] = [];
  for (let age = 60; age <= 90; age += 1) {
    const p = (age - 60) / 30;
    // Linear blend start→end plus a sine bump that is zero at both ends.
    const base = start + (end - start) * p;
    const arc = Math.sin(Math.PI * Math.min(1, p * 1.12)) * bump;
    points.push({ age, value: Math.max(0, base + arc) });
  }
  // Pin the endpoint exactly so the headline number matches the chart.
  points[points.length - 1] = { age: 90, value: end };
  return points;
}

/**
 * Reshape a base curve by overlaying each active event as an age-localized
 * perturbation. A "dip" is a smooth gaussian window centered on the event age
 * (transient — the curve recovers afterward); a "step" is a smoothstep ramp
 * that turns on around the event age and persists to 90 (so it also moves the
 * endpoint). Deterministic and additive, so multiple events compose cleanly.
 */
function applyEvents(
  curve: { age: number; value: number }[],
  events: OutlookEvent[],
): { age: number; value: number }[] {
  if (events.length === 0) return curve;
  const out = curve.map((p) => ({ ...p }));
  for (const ev of events) {
    const { age: a, effects } = ev;
    for (let i = 0; i < out.length; i += 1) {
      const age = out[i].age;
      let w: number;
      if (effects.shape === "dip") {
        // Bell curve (~±9yr reach) that is ~0 far from the event age.
        const sigma = 4.5;
        w = Math.exp(-((age - a) ** 2) / (2 * sigma * sigma));
      } else {
        // Smoothstep ramp turning on over ~5 years centered on the event age.
        const t = clamp((age - (a - 2.5)) / 5, 0, 1);
        w = t * t * (3 - 2 * t);
      }
      out[i].value = Math.max(0, out[i].value + effects.assetShift * w);
    }
  }
  return out;
}

/**
 * Jagged yearly-return series that wobbles downward and bottoms out at exactly
 * −drawdownPct. Deterministic (no Math.random) so renders are stable.
 */
function buildDrawdownSeries(drawdownPct: number): number[] {
  const n = 25;
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const p = i / (n - 1);
    const trend = -drawdownPct * p;
    // Gentle pseudo-noise from stacked sines; low amplitude so the line reads
    // as a smooth downward drift rather than a jagged zig-zag, and it fades
    // near the end so the last point lands exactly on the quoted drawdown.
    const wiggle =
      (Math.sin(i * 1.15) * 0.9 + Math.sin(i * 0.55 + 1.7) * 0.6) * (1 - p * 0.55);
    out.push(trend + wiggle);
  }
  out[0] = 0;
  out[n - 1] = -drawdownPct;
  return out;
}

/** Interpolate the personalized asset mix along the risk slider. */
function personalizedAllocation(riskT: number): AllocationBreakdown {
  const r = clamp(riskT, 0, 100) / 100; // 0 low risk → 1 high risk
  const lerp = (lo: number, hi: number) => lo + (hi - lo) * r;
  const raw = {
    equities: lerp(16, 48),
    bonds: lerp(14, 24),
    diversifiers: lerp(15, 11),
    incomeAnnuities: lerp(34, 10),
    growthAnnuities: lerp(21, 7),
  };
  // Round to integers that still sum to 100 (dump the remainder on equities).
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

/** The typical-retail asset mix is fixed: heavy equities, no annuities. */
const CURRENT_ALLOCATION: AllocationBreakdown = {
  equities: 58,
  bonds: 27,
  diversifiers: 15,
  incomeAnnuities: 0,
  growthAnnuities: 0,
};

export function computeOutlook(inputs: OutlookInputs): OutlookStats {
  const { plan } = inputs;
  // Normalized modifiers, all zero at the defaults.
  const m = (clamp(inputs.marketT, 0, 100) - 50) / 50; // −1 worst … +1 best
  const s =
    (clamp(inputs.spendingAim, SPENDING_RANGE.min, SPENDING_RANGE.max) - 12000) /
    4000; // −1 … +1 as spending goes 8000 → 16000
  const r = (clamp(inputs.riskT, 0, 100) - 50) / 50; // −1 low … +1 high

  const isPersonal = plan === "personalized";
  // Base-constant preset. Only the *base* numbers below switch on this; the
  // modifier math is shared so sliders/events behave identically either way.
  const preset = inputs.preset ?? "default";
  const isPfV2 = preset === "pfV2";
  const isSig = preset === "sig";

  // Fold the cumulative impact of any active custom events into the headline
  // numbers (the curve gets its own age-localized reshaping below).
  const activeEvents = resolveEvents(inputs.events);
  const eventSuccessPts = activeEvents.reduce((n, e) => n + e.effects.successPts, 0);
  const eventLoss = activeEvents.reduce((n, e) => n + e.effects.lossShift, 0);
  const eventDrawdownPts = activeEvents.reduce((n, e) => n + e.effects.drawdownPts, 0);

  // --- Chance of success -------------------------------------------------
  // Market tilts both plans; spending drags success down as it rises. Risk
  // barely moves success ("all are efficient") — a slight dip at the extremes.
  const baseSuccess = isSig
    ? isPersonal
      ? 95
      : 84
    : isPfV2
      ? isPersonal
        ? 97
        : 86
      : isPersonal
        ? 72
        : 60;
  const successPct = Math.round(
    clamp(
      baseSuccess + m * 5 - s * 6 - (isPersonal ? Math.abs(r) * 1.5 : 0) + eventSuccessPts,
      15,
      99,
    ),
  );
  const failurePct = 100 - successPct;

  // --- Expected assets remaining at 90 ------------------------------------
  // Market and spending scale the endpoint; risk raises the personalized
  // ceiling (more equities → more expected growth).
  const baseEnd = isSig
    ? isPersonal
      ? 1_550_000
      : 1_430_000
    : isPfV2
      ? isPersonal
        ? 2_085_000
        : 1_346_000
      : isPersonal
        ? 400_000
        : 182_000;
  const baseAssetsAt90 = round1000(
    baseEnd * (1 + 0.16 * m) * (1 - 0.1 * s) * (isPersonal ? 1 + 0.12 * r : 1),
  );

  const start = 1_320_000 * (1 + 0.02 * m);
  // pfV2's personalized endpoint (~2.085M) sits well above `start`, so the
  // default 160k sine bump would balloon the mid-curve above the age-90
  // headline; a gentler bump keeps it a clean, mostly-rising line. The "sig"
  // preset's endpoints sit just above `start`, so both plans use gentle bumps
  // tuned so the personalized line stays clearly above the current one and the
  // average gap lands at ~+$104k.
  const bump = isPersonal
    ? (isSig ? 120_000 : isPfV2 ? 80_000 : 160_000) * (1 + 0.25 * r)
    : isSig
      ? 40_000
      : 240_000;
  // Reshape the base curve with the active events, then re-derive the headline
  // endpoint and peak from the reshaped curve so chart and numbers stay in sync.
  const assetCurve = applyEvents(buildCurve(start, baseAssetsAt90, bump), activeEvents);
  const assetsAt90 = round1000(assetCurve[assetCurve.length - 1].value);
  assetCurve[assetCurve.length - 1] = { age: 90, value: assetsAt90 };
  const peak = assetCurve.reduce((a, b) => (b.value > a.value ? b : a));

  // --- Potential loss in any given year ------------------------------------
  // Worst markets deepen losses; higher risk raises personalized volatility.
  const baseLoss = isSig
    ? isPersonal
      ? 168_000
      : 254_000
    : isPfV2
      ? isPersonal
        ? 127_000
        : 254_000
      : isPersonal
        ? 190_000
        : 220_000;
  const potentialLoss = round1000(
    clamp(
      baseLoss * (1 - 0.2 * m) * (isPersonal ? 1 + 0.24 * r : 1) + eventLoss,
      20_000,
      2_000_000,
    ),
  );
  const baseDrawdown = isSig
    ? isPersonal
      ? 9
      : 14
    : isPfV2
      ? isPersonal
        ? 10
        : 14
      : isPersonal
        ? 15
        : 17;
  const drawdownPct = Math.round(
    clamp(
      baseDrawdown * (1 - 0.15 * m) * (isPersonal ? 1 + 0.28 * r : 1) + eventDrawdownPts,
      4,
      30,
    ),
  );
  const drawdownSeries = buildDrawdownSeries(drawdownPct);

  // --- Fees ----------------------------------------------------------------
  const lifetimeFees = 310_000;
  const feeSavings = 135_000;

  return {
    plan,
    successPct,
    failurePct,
    assetsAt90,
    assetCurve,
    peak,
    potentialLoss,
    drawdownPct,
    drawdownSeries,
    lifetimeFees,
    feeSavings,
    allocation: isPersonal ? personalizedAllocation(inputs.riskT) : CURRENT_ALLOCATION,
  };
}

/** Green-pill deltas, always computed (never hard-coded) so sliders stay honest. */
export function computeDeltas(
  current: OutlookStats,
  personalized: OutlookStats,
): OutlookDeltas {
  return {
    successPts: personalized.successPct - current.successPct,
    assetsAt90: personalized.assetsAt90 - current.assetsAt90,
    lossReduction: current.potentialLoss - personalized.potentialLoss,
    drawdownPts: current.drawdownPct - personalized.drawdownPct,
  };
}

/** $1,447,000-style formatting. */
export const fmtDollars = (n: number): string =>
  `$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;

/** $55K-style compact formatting for pills. */
export const fmtCompact = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(abs / 1000)}K`;
};

/** 1.5M / 1.0M / 0.5M axis-tick formatting. */
export const fmtAxis = (n: number): string => `${(n / 1_000_000).toFixed(1)}M`;

export const ALLOCATION_LABELS: { key: keyof AllocationBreakdown; label: string }[] = [
  { key: "equities", label: "Equities" },
  { key: "bonds", label: "Bonds" },
  { key: "diversifiers", label: "Diversifiers" },
  { key: "incomeAnnuities", label: "Income Annuities" },
  { key: "growthAnnuities", label: "Growth Annuities" },
];

/** "Here's what's changed" copy for the refine screen, driven by the slider. */
export function riskChangeCopy(riskT: number): string {
  if (riskT >= 65)
    return "A higher risk allocation focuses on traditional equities and bonds, reducing your annuities slightly to optimize for potential returns.";
  if (riskT <= 35)
    return "A lower risk allocation leans on income and growth annuities to protect your spending, trading some upside for steadier outcomes.";
  return "A balanced allocation blends equities with annuities so growth and protection pull together. This is the mix we recommend.";
}
