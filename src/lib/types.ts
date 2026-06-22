export interface QAnswer {
  choice?: string;
  value?: string;
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
}

/** Conversation phase for the Time and Goals chat. */
export type GoalsPhase = "asking" | "confirm" | "extra" | "done";

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
};

export type SectionId = "income" | "spending";

export type StepId =
  | "income"
  | "summary"
  | "spending"
  | "goals"
  | "complete";
