import type { VariantId } from "@/lib/variants";
import type { StepId } from "@/lib/types";

import { IncomeScreen } from "@/components/screens/IncomeScreen";
import { SummaryScreen } from "@/components/screens/SummaryScreen";
import { SpendingScreen } from "@/components/screens/SpendingScreen";
import { ReviewScreen } from "@/components/screens/ReviewScreen";
import { GoalsScreen } from "@/components/screens/GoalsScreen";
import { CompleteScreen } from "@/components/screens/CompleteScreen";

import { CardSortGoalsScreen } from "@/components/screens/variants/CardSortGoalsScreen";
import { SwipeGoalsScreen } from "@/components/screens/variants/SwipeGoalsScreen";
import { PrioritiesSummaryScreen } from "@/components/screens/variants/PrioritiesSummaryScreen";
import { ChatBreakoutGoalsScreen } from "@/components/screens/variants/ChatBreakoutGoalsScreen";
import { HappinessGoalsScreen } from "@/components/screens/variants/HappinessGoalsScreen";
import { LinearChatScreen } from "@/components/screens/variants/LinearChatScreen";
import { LinearChatV2Screen } from "@/components/screens/variants/LinearChatV2Screen";
import { OutlookDashboardScreen } from "@/components/screens/variants/OutlookDashboardScreen";
import { DetailsMenuScreen } from "@/components/screens/variants/DetailsMenuScreen";
import { MarketplaceScreen } from "@/components/screens/variants/MarketplaceScreen";

/** The income/summary/spending/complete steps are identical across variants. */
function sharedStep(step: StepId) {
  switch (step) {
    case "income":
      return <IncomeScreen />;
    case "summary":
      return <SummaryScreen />;
    case "spending":
      return <SpendingScreen />;
    case "review":
      return <ReviewScreen />;
    case "complete":
      return <CompleteScreen />;
    default:
      return null;
  }
}

/**
 * Renders the correct screen for a given variant + step. Each branch returns a
 * statically declared component so React can preserve state across renders.
 */
export function VariantScreen({
  variant,
  step,
}: {
  variant: VariantId;
  step: StepId;
}) {
  switch (variant) {
    case "base":
      return step === "goals" ? <GoalsScreen /> : sharedStep(step);
    case "cardsort":
      if (step === "goals") return <CardSortGoalsScreen />;
      if (step === "priorities") return <PrioritiesSummaryScreen />;
      return sharedStep(step);
    case "swipe":
      if (step === "goals") return <SwipeGoalsScreen />;
      if (step === "priorities") return <PrioritiesSummaryScreen />;
      return sharedStep(step);
    case "chat-cardsort":
      return step === "goals" ? <ChatBreakoutGoalsScreen /> : sharedStep(step);
    case "happiness":
      return step === "goals" ? <HappinessGoalsScreen /> : sharedStep(step);
    case "linear-chat":
      return step === "chat" ? <LinearChatScreen /> : sharedStep(step);
    case "linear-chat-v2":
      if (step === "outlook") return <OutlookDashboardScreen />;
      if (step === "details") return <DetailsMenuScreen />;
      if (step === "marketplace") return <MarketplaceScreen />;
      if (step === "chat") return <LinearChatV2Screen />;
      return sharedStep(step);
    default:
      return null;
  }
}
