/**
 * Plain-language descriptions surfaced in the Outlook Flow (Post Feedback) v2
 * hover-help box. Keyed so any hoverable element (a graph, a highlighted term,
 * a sidebar control) can point at a shared, editable definition.
 */
export interface OutlookInfoTip {
  title: string;
  body: string;
  /** When true, the box nudges the user to discuss this with their advisor. */
  advisor?: boolean;
}

export type OutlookInfoTipId =
  | "sim-scenarios"
  | "current-plan"
  | "personalized-plan"
  | "success"
  | "assets"
  | "loss"
  | "volatility"
  | "fees"
  | "fee-savings"
  | "allocation"
  | "risk-profile"
  | "spending-aim"
  | "market-scenario"
  | "safety-buffer"
  | "comparison"
  | "custom-events";

export const OUTLOOK_INFO_TIPS: Record<OutlookInfoTipId, OutlookInfoTip> = {
  "sim-scenarios": {
    title: "Market simulation",
    body: "We run thousands of possible market futures (a Monte Carlo simulation) to see how often your plan holds up — not just one lucky or unlucky path.",
  },
  "current-plan": {
    title: "Current plan",
    body: "Your existing setup as it stands today, before any personalized changes.",
  },
  "personalized-plan": {
    title: "Personalized plan",
    body: "A plan tailored to you — adjusting your investments, fees and risk to improve your outlook.",
  },
  success: {
    title: "Chance of success",
    body: "The share of simulated futures where your money lasts your full expected lifetime. Higher is better.",
  },
  assets: {
    title: "Assets remaining",
    body: "How much of your savings is projected to remain over time, across all the simulated markets.",
  },
  loss: {
    title: "Potential loss",
    body: "How much your investments could fall in a single bad year, and cumulatively over 30 years.",
  },
  volatility: {
    title: "Volatility",
    body: "How much your investment value swings up and down. Higher volatility means a bumpier ride, especially near retirement.",
  },
  fees: {
    title: "Fees",
    body: "The ongoing cost of your investments. Small yearly percentages add up to large amounts over a lifetime.",
  },
  "fee-savings": {
    title: "Lifetime fee savings",
    body: "How much less you would pay in fees over your retirement under the personalized plan.",
  },
  allocation: {
    title: "Asset allocation",
    body: "The mix of investment types (stocks, bonds and protected income) that make up your plan.",
    advisor: true,
  },
  "risk-profile": {
    title: "Risk profile",
    body: "How much risk you are comfortable taking. More risk can mean more growth, but bigger swings along the way.",
    advisor: true,
  },
  "spending-aim": {
    title: "Spending aim",
    body: "How much you plan to spend each month in retirement. Drag the slider to see how it changes your outlook.",
  },
  "market-scenario": {
    title: "Market scenario",
    body: "Stress-test your plan against tougher or kinder markets, from a worst case to a best case.",
  },
  "safety-buffer": {
    title: "Safety buffer",
    body: "Money kept aside for surprises, so one bad year doesn't derail the rest of your plan.",
  },
  comparison: {
    title: "Compare plans",
    body: "Toggle to show your current plan alongside the personalized plan, so you can see the difference side by side.",
  },
  "custom-events": {
    title: "Custom events",
    body: "Add one-off life events — a home sale, a big trip, an inheritance — to see how they shift your outlook.",
  },
};
