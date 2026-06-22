import type { FlowAnswers, StepId } from "./types";

export interface StepConfig {
  id: StepId;
  /** Resolve the next step adaptively based on the user's current answers. */
  next: (answers: FlowAnswers) => StepId | null;
}

/**
 * Config-driven step machine. The income and spending steps are multi-question
 * wizards that manage their own internal question index; their forward/back
 * transitions out of the section are driven by the screens themselves.
 */
export const STEPS: Record<StepId, StepConfig> = {
  income: { id: "income", next: () => "summary" },
  summary: { id: "summary", next: () => "spending" },
  spending: { id: "spending", next: () => "goals" },
  goals: { id: "goals", next: () => "complete" },
  complete: { id: "complete", next: () => null },
};

export const FIRST_STEP: StepId = "income";

/**
 * Resolve the previous step deterministically from the flow graph. Deriving
 * "back" from the graph (rather than browser history) keeps the back arrow
 * correct no matter how the user arrived. Returns null at the start of the flow.
 */
export function previousStep(step: StepId): StepId | null {
  switch (step) {
    case "income":
      return null;
    case "summary":
      return "income";
    case "spending":
      return "summary";
    case "goals":
      return "spending";
    case "complete":
      return "goals";
    default:
      return null;
  }
}
