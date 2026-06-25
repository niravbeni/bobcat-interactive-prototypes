import type { StepId } from "./types";

/** Window event a flow screen listens for to jump to its in-step interaction. */
export const SKIP_INTERACTION_EVENT = "bobcat:skip-interaction";

export type VariantId =
  | "linear-chat-v2"
  | "narrative"
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
  /**
   * For flows whose signature interaction lives *inside* a single step (e.g. the
   * linear chat), the Help menu fires an in-flow skip event the screen listens
   * for, rather than navigating to a different step.
   */
  skipInFlow?: { label: string };
  /** Highlight this flow on the dashboard (e.g. the active client deliverable). */
  featured?: boolean;
}

const BASE_STEPS: StepId[] = [
  "income",
  "summary",
  "spending",
  "review",
  "goals",
  "complete",
];
const PRIORITIZE_STEPS: StepId[] = [
  "income",
  "summary",
  "spending",
  "review",
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
  "linear-chat-v2": {
    id: "linear-chat-v2",
    title: "Linear Chat Flow V2",
    description:
      "Work-in-progress iteration of the conversational flow, being shaped as a client deliverable.",
    status: "ready",
    steps: ["outlook", "details", "chat", "complete", "marketplace"],
    skipInFlow: { label: "the goals chat" },
    featured: true,
  },
  narrative: {
    id: "narrative",
    title: "Narrative Flow",
    description:
      "A mad-libs style onboarding: fill in the blanks of plain-language sentences across About you, Income, Spending and Goals, with the side panel updating as you go.",
    status: "ready",
    // The madlib Continue path is details → income → spending → goals →
    // complete (order drives goNext/goBack). outlook + marketplace are appended
    // so the top-nav toggle can jump to them without affecting that path.
    steps: [
      "details",
      "income",
      "spending",
      "goals",
      "complete",
      "outlook",
      "marketplace",
    ],
    skipTo: { step: "goals", label: "the goals" },
  },
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
    steps: PRIORITIZE_STEPS,
    skipTo: { step: "goals", label: "the goal card sort" },
  },
  swipe: {
    id: "swipe",
    title: "Swipe to Prioritize",
    description:
      "A Tinder-style deck: swipe each retirement priority up, right or left to rank what matters.",
    status: "ready",
    steps: PRIORITIZE_STEPS,
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
      "A breakout that pops out of the flow: picture your retirement on a mood board, saved back to your outlook.",
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
  "linear-chat-v2",
  "narrative",
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
