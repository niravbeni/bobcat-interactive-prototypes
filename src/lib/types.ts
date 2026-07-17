import type { TaxStatus } from "./institutions";

export interface QAnswer {
  choice?: string;
  value?: string;
  /** Wall-clock timestamp of the most recent update, for newest-first lists. */
  at?: number;
}

export type AnswerMap = Record<string, QAnswer>;

export interface SpendingDetail {
  housing: string;
  food: string;
  healthInsurance: string;
  transport: string;
  travel: string;
  entertainment: string;
  hobbies: string;
}

export interface ChatMessage {
  role: "bot" | "user";
  text: string;
  /** Optional non-bubble rendering hint, e.g. a milestone pill in-line. */
  kind?: "pill";
  /** When kind is "pill", a green-check chip with this label is rendered. */
  pill?: { label: string };
}

/** Conversation phase for the Time and Goals chat. */
export type GoalsPhase = "asking" | "confirm" | "extra" | "done";

/** Interaction mode of the V2 linear chat at a given moment. */
export type V2ChatMode =
  | "options"
  | "money"
  | "checkpoint"
  | "priorities"
  | "done";

/**
 * Persisted progress of the V2 linear chat so the conversation survives
 * navigating between the chat and the details page (and only resets when the
 * user returns to the flow picker). The transcript itself lives in
 * `goalsMessages`; this tracks where in the script the user is.
 */
export interface V2ChatState {
  /** Whether the intro + first question have been seeded into the transcript. */
  seeded: boolean;
  /** Current question index into the V2 chat's TURNS list. */
  qi: number;
  /** Which inline interaction is currently shown. */
  mode: V2ChatMode;
  /** When in "money" mode, the id of the option that revealed the amount. */
  pendingOptionId: string | null;
  /** Draft amount while in "money" mode. */
  moneyValue: string;
  /** Question index to resume at after the mandatory-set checkpoint. */
  resumeIdx: number | null;
}

/** A retirement goal used by the card-sort interactions. */
export interface GoalCard {
  id: string;
  label: string;
  /** Where the card came from: a preset, detected in chat, or user-added. */
  source: "preset" | "chat" | "custom";
}

/**
 * Outlook-flow state shared across its four steps. Slider positions and the
 * comparison toggles live here so they survive navigation between steps.
 */
export interface OutlookState {
  /** Monthly spending aim in dollars (sidebar slider). */
  spendingAim: number;
  /** Market scenario position, 0 (worst case) → 100 (best case). */
  marketT: number;
  /** Risk profile position, 0 (low) → 100 (high). Personalized plan only. */
  riskT: number;
  /** "Comparison" toggle on the New outlook screen (defaults on). */
  comparisonNew: boolean;
  /** "Comparison" toggle on the Refine outlook screen (defaults off). */
  comparisonRefine: boolean;
  /** Active "custom event" ids modelled onto the timeline (defaults empty). */
  customEvents: string[];
}

/** One account row in the Details-flow Assets screen (ported from Smart Assets). */
export interface AssetRow {
  id: string;
  provider: string;
  accountType?: string;
  taxStatus: TaxStatus;
  balance: number | null;
  source: "search" | "ai" | "plaid" | "manual";
  accentColor?: string;
}

/** "About you" basic details captured in the Details flow. */
export interface DetailsAbout {
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  zip: string;
  relationship: string;
}

/** Retirement spending target + per-category monthly breakdown. */
export interface DetailsSpending {
  /** How the spending target is being defined. */
  method: "know" | "estimate" | "workout";
  /** Monthly spending aim in dollars. */
  aim: number;
  /** Safety-buffer select label, e.g. "Medium ($30k)". */
  safetyBuffer: string;
  /** Active category tab. */
  tab: "essentials" | "lifestyle";
  /** Monthly amounts keyed by category id. */
  categories: Record<string, number>;
}

/** Ranked goals for the Details-flow card sort. */
export interface DetailsGoals {
  /** Placed timeline order, low → high (card ids). */
  order: string[];
  /**
   * The Not-important shelf, kept separate from `order` (v2 only). Optional so
   * the v1 screen, which never sets it, stays untouched; v1 ignores this field.
   */
  notImportant?: string[];
  confirmed: boolean;
}

/**
 * Details-flow state shared across the hub + four detail pages. It is the
 * single source of truth so edits (in the sidebar or on a detail page) persist
 * across hub round-trips.
 */
export interface DetailsState {
  about: DetailsAbout;
  accounts: AssetRow[];
  spending: DetailsSpending;
  goals: DetailsGoals;
}

export interface FlowAnswers {
  /** Personal "About you" free-text details, keyed by field id. */
  about: AnswerMap;
  /** Answers to the Future Income question wizard, keyed by question id. */
  income: AnswerMap;
  /** Answers to the Retirement Spending question wizard, keyed by question id. */
  spending: AnswerMap;
  /** Second-level "basic needs / lifestyle" breakdown for the spending section. */
  detail: SpendingDetail;
  /** Goals chat transcript + derived state. */
  goalsMessages: ChatMessage[];
  /** V2 linear chat progress, kept so the conversation persists across nav. */
  v2Chat: V2ChatState;
  goalsStage: GoalsPhase;
  goalsText: string;
  goalsPriorities: string[];
  goalsConfirmed: boolean | null;
  /** Card-sort variations: the working set of goal cards and their ranked order. */
  goalCards: GoalCard[];
  goalRanking: string[];
  /** Swipe variation: each card's bucket (essential / nice to have / not for me). */
  goalVerdicts: Record<string, "essential" | "nice" | "skip">;
  /** Happiness Chapter: selected "vision" mood ids. */
  vision: string[];
  /** V2 chat: true once the mandatory-info threshold has been crossed. */
  planRefreshed: boolean;
  /** V2 chat: true after the user has opened the plan preview at least once. */
  planPreviewSeen: boolean;
  /** V2 chat: which top-nav tab is currently active. */
  v2ActiveTab: "details" | "plan" | "marketplace";
  /**
   * V2: the last-viewed sub-page within the "Details" tab — either the form
   * (`details`) or the conversational (`chat`) view — so the Details nav button
   * returns to wherever the user last was.
   */
  lastDetailsView: "details" | "chat";
  /** V2 outlook dashboard: which scenario the Plan Conditions slider is set to. */
  planCondition: "worst" | "typical" | "best";
  /**
   * V2 outlook dashboard: continuous Plan Conditions position, 0 (worst) → 50
   * (typical) → 100 (best). Drives interpolated card values; the discrete
   * `planCondition` mirrors the nearest key point.
   */
  planConditionT: number;
  /** Outlook-flow prototype: sliders + comparison toggles shared across steps. */
  outlook: OutlookState;
  /** Details-flow prototype: about/accounts/spending/goals shared across pages. */
  details: DetailsState;
}

export const initialAnswers: FlowAnswers = {
  about: {},
  income: {},
  spending: {},
  detail: {
    housing: "",
    food: "",
    healthInsurance: "",
    transport: "",
    travel: "",
    entertainment: "",
    hobbies: "",
  },
  goalsMessages: [],
  v2Chat: {
    seeded: false,
    qi: 0,
    mode: "options",
    pendingOptionId: null,
    moneyValue: "",
    resumeIdx: null,
  },
  goalsStage: "asking",
  goalsText: "",
  goalsPriorities: [],
  goalsConfirmed: null,
  goalCards: [],
  goalRanking: [],
  goalVerdicts: {},
  vision: [],
  planRefreshed: false,
  planPreviewSeen: false,
  v2ActiveTab: "details",
  lastDetailsView: "details",
  planCondition: "typical",
  planConditionT: 50,
  outlook: {
    spendingAim: 12000,
    marketT: 50,
    riskT: 50,
    comparisonNew: true,
    comparisonRefine: false,
    customEvents: [],
  },
  details: {
    about: {
      firstName: "Gloria",
      middleName: "Jean",
      lastName: "Bennett",
      dob: "01/15/1955",
      zip: "91102",
      relationship: "Widowed",
    },
    accounts: [],
    spending: {
      method: "workout",
      aim: 12000,
      safetyBuffer: "Medium ($60k)",
      tab: "essentials",
      categories: {
        home: 3800,
        transport: 700,
        food: 1500,
        travel: 2200,
        hobbies: 800,
        dining: 1000,
      },
    },
    goals: {
      order: [],
      notImportant: [],
      confirmed: false,
    },
  },
};

export type SectionId = "income" | "spending";

export type StepId =
  | "income"
  | "summary"
  | "spending"
  | "review"
  | "goals"
  | "priorities"
  | "complete"
  | "chat"
  | "outlook"
  | "details"
  | "marketplace"
  | "persona"
  | "profile"
  | "loading"
  | "education"
  | "smart-sort"
  | "data-dump"
  | "card-sort"
  | "smart-assets"
  | "current-outlook"
  | "new-outlook"
  | "refine-outlook"
  | "details-home"
  | "details-about"
  | "details-assets"
  | "details-spending"
  | "details-goals"
  | "card-sort-hifi"
  | "sig-story"
  | "sig-home"
  | "sig-assets"
  | "sig-expense"
  | "sig-goals";
