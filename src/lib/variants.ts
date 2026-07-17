import type { StepId } from "./types";

/** Window event a flow screen listens for to jump to its in-step interaction. */
export const SKIP_INTERACTION_EVENT = "bobcat:skip-interaction";

export type VariantId =
  | "linear-chat-v2"
  | "narrative"
  | "hybrid"
  | "hybrid-quick"
  | "hybrid-guided"
  | "base"
  | "cardsort"
  | "swipe"
  | "chat-cardsort"
  | "happiness"
  | "linear-chat"
  | "smart-sort"
  | "data-dump"
  | "card-sort"
  | "card-sort-hifi"
  | "smart-assets"
  | "outlook-flow"
  | "outlook-flow-enhanced"
  | "outlook-flow-post-feedback"
  | "outlook-flow-post-feedback-v2"
  | "details-flow"
  | "details-flow-v2"
  | "details-to-outlook"
  | "signature-flow";

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
  /** Whether this is a standalone component prototype or an end-to-end flow. */
  kind: "flow" | "component";
  /** Older/superseded work. Drives default ordering (recent first, older last). */
  archived?: boolean;
  /** Approximate creation date (ISO, from git history), shown as a card pill. */
  created: string;
  /** Approximate last-modified date (ISO, from git history of the variant's files). */
  modified: string;
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
    kind: "flow",
    archived: true,
    created: "2026-06-23",
    modified: "2026-06-24",
    steps: ["outlook", "details", "chat", "complete", "marketplace"],
    skipInFlow: { label: "the goals chat" },
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
    kind: "flow",
    archived: true,
    created: "2026-06-25",
    modified: "2026-06-26",
    skipTo: { step: "goals", label: "the goals" },
  },
  hybrid: {
    id: "hybrid",
    title: "Hybrid Flow",
    description:
      "Start by choosing how you'd like to build your retirement plan: a quick draft outlook you refine later, a guided step-by-step build, or talking to an advisor. Each path then runs end to end.",
    status: "ready",
    kind: "flow",
    archived: true,
    created: "2026-06-26",
    modified: "2026-06-26",
    // The picker is a single screen that branches into the hybrid-quick /
    // hybrid-guided flows (each its own variant so answers reset cleanly).
    steps: ["persona"],
  },
  "hybrid-quick": {
    id: "hybrid-quick",
    title: "Hybrid · Quick draft",
    description:
      "Persona 1: capture a rich profile in one page, see a draft outlook immediately, then optionally add Income & Spending detail and rank goals to firm it up.",
    status: "ready",
    kind: "flow",
    created: "2026-06-26",
    modified: "2026-06-26",
    // Continue path: profile (rich madlib) → loading (simulation pause) →
    // outlook (draft) → details/income/spending (scrollable section screens) →
    // goals (questions + swipe rank) → back to the full outlook. complete +
    // marketplace are appended so the top-nav toggle can reach them.
    steps: [
      "profile",
      "loading",
      "outlook",
      "details",
      "income",
      "spending",
      "goals",
      "complete",
      "marketplace",
    ],
    skipTo: { step: "goals", label: "the goals" },
  },
  "hybrid-guided": {
    id: "hybrid-guided",
    title: "Hybrid · Guided build",
    description:
      "Persona 2: a blend of three onboarding styles — the mad-libs About you page, a one-question-at-a-time Income & Spending wizard, and a swipe-to-rank Goals deck — all feeding the same live side panel and outlook.",
    status: "ready",
    kind: "flow",
    created: "2026-06-26",
    modified: "2026-06-26",
    // Continue path: education → details (madlib) → income (wizard) → summary →
    // spending (wizard) → summary → goals (questions + rank) → outlook →
    // complete. The single summary step is revisited via goTo after income and
    // again after spending (conditional Continue). marketplace is appended so
    // the top-nav toggle can reach it.
    steps: [
      "education",
      "details",
      "income",
      "summary",
      "spending",
      "goals",
      "outlook",
      "complete",
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
    kind: "flow",
    archived: true,
    created: "2026-06-22",
    modified: "2026-06-24",
    steps: BASE_STEPS,
    skipTo: { step: "goals", label: "the Retirement Goals chat" },
  },
  cardsort: {
    id: "cardsort",
    title: "Card-sort Goals",
    description:
      "Goals are shown back to you as cards you can edit, add to, then drag to rank what matters most.",
    status: "ready",
    kind: "flow",
    archived: true,
    created: "2026-06-22",
    modified: "2026-06-24",
    steps: PRIORITIZE_STEPS,
    skipTo: { step: "goals", label: "the goal card sort" },
  },
  swipe: {
    id: "swipe",
    title: "Swipe to Prioritize",
    description:
      "A Tinder-style deck: swipe each retirement priority up, right or left to rank what matters.",
    status: "ready",
    kind: "flow",
    archived: true,
    created: "2026-06-22",
    modified: "2026-06-24",
    steps: PRIORITIZE_STEPS,
    skipTo: { step: "goals", label: "the swipe deck" },
  },
  "chat-cardsort": {
    id: "chat-cardsort",
    title: "Chat + Card-sort",
    description:
      "The Retirement Goals chat breaks out into a drag-to-rank card sort mid-conversation, then returns.",
    status: "ready",
    kind: "flow",
    archived: true,
    created: "2026-06-22",
    modified: "2026-06-24",
    steps: BASE_STEPS,
    skipTo: { step: "goals", label: "the chat + card sort" },
  },
  happiness: {
    id: "happiness",
    title: "Happiness Chapter",
    description:
      "A breakout that pops out of the flow: picture your retirement on a mood board, saved back to your outlook.",
    status: "ready",
    kind: "flow",
    archived: true,
    created: "2026-06-22",
    modified: "2026-06-24",
    steps: BASE_STEPS,
    skipTo: { step: "goals", label: "the happiness chapter" },
  },
  "linear-chat": {
    id: "linear-chat",
    title: "Linear Chat Flow",
    description:
      "The whole onboarding delivered as one conversational chat, with actions embedded inline.",
    status: "ready",
    kind: "flow",
    archived: true,
    created: "2026-06-22",
    modified: "2026-06-24",
    steps: ["chat", "complete"],
  },
  "smart-sort": {
    id: "smart-sort",
    title: "Smart Sort",
    description:
      "Type a bank or provider and an AI-style autocomplete recognizes the account, then auto-tags it by tax treatment so your savings sort themselves.",
    status: "ready",
    kind: "component",
    created: "2026-07-01",
    modified: "2026-07-01",
    steps: ["smart-sort"],
  },
  "data-dump": {
    id: "data-dump",
    title: "Data Dump",
    description:
      "Throw everything at one canvas — files, screenshots, pasted notes, a voice memo or a phone scan — then let AI structure the mess into an editable account profile you can tweak.",
    status: "ready",
    kind: "component",
    created: "2026-07-01",
    modified: "2026-07-01",
    steps: ["data-dump"],
  },
  "card-sort": {
    id: "card-sort",
    title: "Card Sort",
    description:
      "Decide how much each financial goal matters with one clear tap, watch it drop onto a low-to-high timeline, then drag the cards to fine-tune your ranking.",
    status: "ready",
    kind: "component",
    created: "2026-07-01",
    modified: "2026-07-02",
    steps: ["card-sort"],
  },
  "card-sort-hifi": {
    id: "card-sort-hifi",
    title: "Card Sort (High Fidelity)",
    description:
      "A refined restyle of the goal card sort: an intro cluster, a binary \"does this matter?\" step with a stacked gradient card deck, then a single-select rank of the goals that matter most.",
    status: "ready",
    kind: "component",
    created: "2026-07-15",
    modified: "2026-07-15",
    steps: ["card-sort-hifi"],
  },
  "smart-assets": {
    id: "smart-assets",
    title: "Smart Assets",
    description:
      "Bring in everything in one place: connect with Plaid, drop your statements, notes and voice memos into an AI canvas, or search and add accounts by hand — all collected into one editable list.",
    status: "ready",
    kind: "component",
    created: "2026-07-01",
    modified: "2026-07-02",
    steps: ["smart-assets"],
  },
  "outlook-flow": {
    id: "outlook-flow",
    title: "Outlook Flow",
    description:
      "See your current outlook in a typical retail experience, watch a personalized plan get built, compare the two side by side, then refine your risk profile — every chart driven live by the sliders.",
    status: "ready",
    kind: "flow",
    archived: true,
    created: "2026-07-07",
    modified: "2026-07-07",
    steps: ["current-outlook", "loading", "new-outlook", "refine-outlook"],
  },
  "outlook-flow-enhanced": {
    id: "outlook-flow-enhanced",
    title: "Outlook Flow (Enhanced)",
    description:
      "The Outlook Flow with extra polish: an animated gradient wash under the asset curve, shimmering placeholder copy and soft aurora hero cards — same live, slider-driven charts.",
    status: "ready",
    kind: "flow",
    archived: true,
    created: "2026-07-07",
    modified: "2026-07-07",
    steps: ["current-outlook", "loading", "new-outlook", "refine-outlook"],
  },
  "outlook-flow-post-feedback": {
    id: "outlook-flow-post-feedback",
    title: "Outlook Flow (Post Feedback)",
    description:
      "The enhanced Outlook Flow reworked with post-feedback edits.",
    status: "ready",
    kind: "flow",
    archived: true,
    created: "2026-07-07",
    modified: "2026-07-07",
    steps: ["current-outlook", "loading", "new-outlook", "refine-outlook"],
  },
  "outlook-flow-post-feedback-v2": {
    id: "outlook-flow-post-feedback-v2",
    title: "Outlook Flow (Post Feedback) v2",
    description:
      "The Post Feedback Outlook Flow with a persistent hover-help box: point at any chart, highlighted term or sidebar control and a plain-language explanation appears in the bottom-left of the sidebar.",
    status: "ready",
    kind: "flow",
    featured: true,
    created: "2026-07-07",
    modified: "2026-07-08",
    steps: ["current-outlook", "loading", "new-outlook", "refine-outlook"],
  },
  "details-flow": {
    id: "details-flow",
    title: "Details Flow",
    description:
      "A hub-and-spoke \"Your details\" dashboard: review your progress at a glance, then dive into About you, Assets, Spending or Goals — each an editable detail page that feeds a live left panel and returns you to the summary.",
    status: "ready",
    kind: "flow",
    archived: true,
    created: "2026-07-07",
    modified: "2026-07-08",
    steps: [
      "details-home",
      "details-about",
      "details-assets",
      "details-spending",
      "details-goals",
    ],
  },
  "details-flow-v2": {
    id: "details-flow-v2",
    title: "Details Flow v2",
    description:
      "The Details Flow with a persistent hover-help box: point at a section, value or highlighted term and a plain-language explanation appears in the bottom-left of the sidebar.",
    status: "ready",
    kind: "flow",
    featured: true,
    created: "2026-07-08",
    modified: "2026-07-08",
    steps: [
      "details-home",
      "details-about",
      "details-assets",
      "details-spending",
      "details-goals",
    ],
  },
  "details-to-outlook": {
    id: "details-to-outlook",
    title: "Details to Outlook Flow",
    description:
      "The Details Flow v2 and Outlook Flow (Post Feedback) v2 joined into one continuous experience: fill in your details, then flow straight into your personalized outlook.",
    status: "ready",
    kind: "flow",
    created: "2026-07-13",
    modified: "2026-07-13",
    steps: [
      "details-home",
      "details-about",
      "details-assets",
      "details-spending",
      "details-goals",
      "current-outlook",
      "loading",
      "new-outlook",
      "refine-outlook",
    ],
  },
  "signature-flow": {
    id: "signature-flow",
    title: "Signature Flow",
    description:
      "A motion-first take on the signature onboarding moments: tell your retirement story as a mad-lib, land on a Home Base hub, then aggregate every asset into one live net-worth picture.",
    status: "ready",
    kind: "flow",
    created: "2026-07-16",
    modified: "2026-07-16",
    steps: ["sig-story", "sig-home", "sig-assets", "sig-expense", "sig-goals"],
  },
};

/** Standalone signature-component prototypes, shown first on the dashboard. */
export const COMPONENT_PROTOTYPE_ORDER: VariantId[] = [
  "smart-assets",
  "smart-sort",
  "card-sort",
  "card-sort-hifi",
  "data-dump",
];

/** The end-to-end retirement onboarding UX flows. */
export const FLOW_ORDER: VariantId[] = [
  "signature-flow",
  "outlook-flow-post-feedback-v2",
  "details-flow-v2",
  "details-to-outlook",
  "details-flow",
  "outlook-flow-post-feedback",
  "outlook-flow-enhanced",
  "outlook-flow",
  "hybrid",
  "linear-chat-v2",
  "narrative",
  "base",
  "cardsort",
  "swipe",
  "chat-cardsort",
  "happiness",
  "linear-chat",
];

export const VARIANT_ORDER: VariantId[] = [
  ...COMPONENT_PROTOTYPE_ORDER,
  ...FLOW_ORDER,
];

export function isVariantId(value: string): value is VariantId {
  return value in VARIANTS;
}

/** True for the v2 Details experiences (standalone v2 + the merged flow). */
export function isDetailsV2Variant(v: VariantId): boolean {
  return v === "details-flow-v2" || v === "details-to-outlook";
}

export function firstStep(variant: VariantId): StepId {
  return VARIANTS[variant].steps[0];
}

/** Resolve the URL for a given variant + step. Base keeps its root URLs. */
export function pathFor(variant: VariantId, step: StepId): string {
  return variant === "base" ? `/${step}` : `/flows/${variant}/${step}`;
}
