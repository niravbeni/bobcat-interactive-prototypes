import type { StepId } from "./types";

export type VariantId =
  | "base"
  | "cardsort"
  | "swipe"
  | "chat-cardsort"
  | "happiness"
  | "linear-chat";

export interface VariantMeta {
  id: VariantId;
  title: string;
  description: string;
  status: "ready" | "coming-soon";
  /** Ordered step ids. Forward/back navigation is derived from this order. */
  steps: StepId[];
  /**
   * The signature interaction this flow is built around. When set, the Help
   * menu offers to skip straight to this step (used by flows that share the
   * standard income/summary/spending setup before a differentiating moment).
   */
  skipTo?: { step: StepId; label: string };
}

const BASE_STEPS: StepId[] = ["income", "summary", "spending", "goals", "complete"];
const PRIORITISE_STEPS: StepId[] = [
  "income",
  "summary",
  "spending",
  "goals",
  "priorities",
  "complete",
];

/**
 * Registry of every selectable flow. The base flow is unchanged and served at
 * the root (`/income`); every other variant is served under `/flows/<id>/<step>`
 * and reuses the shared income/summary/spending steps, swapping in a different
 * Time and Goals experience.
 */
export const VARIANTS: Record<VariantId, VariantMeta> = {
  base: {
    id: "base",
    title: "Base Flow (Linear)",
    description:
      "The core click-through flow: future income, summary, spending and a guided Retirement Goals chat.",
    status: "ready",
    steps: BASE_STEPS,
    skipTo: { step: "goals", label: "the Retirement Goals chat" },
  },
  cardsort: {
    id: "cardsort",
    title: "Card-sort Goals",
    description:
      "Goals are shown back to you as cards you can edit, add to, then drag to rank what matters most.",
    status: "ready",
    steps: PRIORITISE_STEPS,
    skipTo: { step: "goals", label: "the goal card sort" },
  },
  swipe: {
    id: "swipe",
    title: "Swipe to Prioritise",
    description:
      "A Tinder-style deck: swipe each retirement priority up, right or left to rank what matters.",
    status: "ready",
    steps: PRIORITISE_STEPS,
    skipTo: { step: "goals", label: "the swipe deck" },
  },
  "chat-cardsort": {
    id: "chat-cardsort",
    title: "Chat + Card-sort",
    description:
      "The Retirement Goals chat breaks out into a drag-to-rank card sort mid-conversation, then returns.",
    status: "ready",
    steps: BASE_STEPS,
    skipTo: { step: "goals", label: "the chat + card sort" },
  },
  happiness: {
    id: "happiness",
    title: "Happiness Chapter",
    description:
      "A breakout that pops out of the flow: picture your retirement on a mood board, saved back to your plan.",
    status: "ready",
    steps: BASE_STEPS,
    skipTo: { step: "goals", label: "the happiness chapter" },
  },
  "linear-chat": {
    id: "linear-chat",
    title: "Linear Chat Flow",
    description:
      "The whole onboarding delivered as one conversational chat, with actions embedded inline.",
    status: "ready",
    steps: ["chat", "complete"],
  },
};

export const VARIANT_ORDER: VariantId[] = [
  "base",
  "cardsort",
  "swipe",
  "chat-cardsort",
  "happiness",
  "linear-chat",
];

export function isVariantId(value: string): value is VariantId {
  return value in VARIANTS;
}

export function firstStep(variant: VariantId): StepId {
  return VARIANTS[variant].steps[0];
}

/** Resolve the URL for a given variant + step. Base keeps its root URLs. */
export function pathFor(variant: VariantId, step: StepId): string {
  return variant === "base" ? `/${step}` : `/flows/${variant}/${step}`;
}
