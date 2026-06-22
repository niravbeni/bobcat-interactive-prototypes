import type { ComponentType } from "react";
import { IncomeScreen } from "@/components/screens/IncomeScreen";
import { SummaryScreen } from "@/components/screens/SummaryScreen";
import { SpendingScreen } from "@/components/screens/SpendingScreen";
import { GoalsScreen } from "@/components/screens/GoalsScreen";
import { CompleteScreen } from "@/components/screens/CompleteScreen";
import type { StepId } from "@/lib/types";

export const SCREENS: Record<StepId, ComponentType> = {
  income: IncomeScreen,
  summary: SummaryScreen,
  spending: SpendingScreen,
  goals: GoalsScreen,
  complete: CompleteScreen,
};

export function isStepId(value: string): value is StepId {
  return value in SCREENS;
}
