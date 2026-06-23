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

/** A retirement goal used by the card-sort interactions. */
export interface GoalCard {
  id: string;
  label: string;
  /** Where the card came from: a preset, detected in chat, or user-added. */
  source: "preset" | "chat" | "custom";
}

export interface FlowAnswers {
  /** Answers to the Future Income question wizard, keyed by question id. */
  income: AnswerMap;
  /** Answers to the Retirement Spending question wizard, keyed by question id. */
  spending: AnswerMap;
  /** Second-level "basic needs / lifestyle" breakdown for the spending section. */
  detail: SpendingDetail;
  /** Goals chat transcript + derived state. */
  goalsMessages: ChatMessage[];
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
}

export const initialAnswers: FlowAnswers = {
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
  | "chat";
