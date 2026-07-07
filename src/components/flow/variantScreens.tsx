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
import { NarrativeScreen } from "@/components/screens/variants/NarrativeScreen";
import { PersonaPickerScreen } from "@/components/screens/variants/PersonaPickerScreen";
import { SectionScrollScreen } from "@/components/screens/variants/SectionScrollScreen";
import { GuidedSectionWizard } from "@/components/screens/variants/GuidedSectionWizard";
import { GuidedSummaryScreen } from "@/components/screens/variants/GuidedSummaryScreen";
import { GuidedGoalsScreen } from "@/components/screens/variants/GuidedGoalsScreen";
import { EducationScreen } from "@/components/screens/variants/EducationScreen";
import { LoadingSimScreen } from "@/components/screens/variants/LoadingSimScreen";
import { SmartSortScreen } from "@/components/screens/variants/SmartSortScreen";
import { DataDumpScreen } from "@/components/screens/variants/DataDumpScreen";
import { CardSortScreen } from "@/components/screens/variants/CardSortScreen";
import { SmartAssetsScreen } from "@/components/screens/variants/SmartAssetsScreen";
import { CurrentOutlookScreen } from "@/components/screens/variants/CurrentOutlookScreen";
import { OutlookLoadingScreen } from "@/components/screens/variants/OutlookLoadingScreen";
import { NewOutlookScreen } from "@/components/screens/variants/NewOutlookScreen";
import { RefineOutlookScreen } from "@/components/screens/variants/RefineOutlookScreen";
import { CurrentOutlookEnhancedScreen } from "@/components/screens/variants/outlook-enhanced/CurrentOutlookEnhancedScreen";
import { NewOutlookEnhancedScreen } from "@/components/screens/variants/outlook-enhanced/NewOutlookEnhancedScreen";
import { RefineOutlookEnhancedScreen } from "@/components/screens/variants/outlook-enhanced/RefineOutlookEnhancedScreen";
import { CurrentOutlookPostFeedbackScreen } from "@/components/screens/variants/outlook-post-feedback/CurrentOutlookPostFeedbackScreen";
import { NewOutlookPostFeedbackScreen } from "@/components/screens/variants/outlook-post-feedback/NewOutlookPostFeedbackScreen";
import { RefineOutlookPostFeedbackScreen } from "@/components/screens/variants/outlook-post-feedback/RefineOutlookPostFeedbackScreen";
import { CurrentOutlookPostFeedbackV2Screen } from "@/components/screens/variants/outlook-post-feedback-v2/CurrentOutlookPostFeedbackV2Screen";
import { NewOutlookPostFeedbackV2Screen } from "@/components/screens/variants/outlook-post-feedback-v2/NewOutlookPostFeedbackV2Screen";
import { RefineOutlookPostFeedbackV2Screen } from "@/components/screens/variants/outlook-post-feedback-v2/RefineOutlookPostFeedbackV2Screen";
import { DetailsHomeScreen } from "@/components/screens/variants/details-flow/DetailsHomeScreen";
import { AboutYouDetailsScreen } from "@/components/screens/variants/details-flow/AboutYouDetailsScreen";
import { AssetsDetailsScreen } from "@/components/screens/variants/details-flow/AssetsDetailsScreen";
import { SpendingDetailsScreen } from "@/components/screens/variants/details-flow/SpendingDetailsScreen";
import { GoalsDetailsScreen } from "@/components/screens/variants/details-flow/GoalsDetailsScreen";

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
    case "narrative":
      if (step === "outlook") return <OutlookDashboardScreen />;
      if (step === "marketplace") return <MarketplaceScreen />;
      if (step === "complete") return <CompleteScreen />;
      return <NarrativeScreen step={step} />;
    case "hybrid":
      return <PersonaPickerScreen />;
    case "smart-sort":
      return <SmartSortScreen />;
    case "data-dump":
      return <DataDumpScreen />;
    case "card-sort":
      return <CardSortScreen />;
    case "smart-assets":
      return <SmartAssetsScreen />;
    case "outlook-flow":
      if (step === "current-outlook") return <CurrentOutlookScreen />;
      if (step === "loading") return <OutlookLoadingScreen />;
      if (step === "new-outlook") return <NewOutlookScreen />;
      if (step === "refine-outlook") return <RefineOutlookScreen />;
      return null;
    case "outlook-flow-enhanced":
      if (step === "current-outlook") return <CurrentOutlookEnhancedScreen />;
      if (step === "loading") return <OutlookLoadingScreen />;
      if (step === "new-outlook") return <NewOutlookEnhancedScreen />;
      if (step === "refine-outlook") return <RefineOutlookEnhancedScreen />;
      return null;
    case "outlook-flow-post-feedback":
      if (step === "current-outlook") return <CurrentOutlookPostFeedbackScreen />;
      if (step === "loading") return <OutlookLoadingScreen />;
      if (step === "new-outlook") return <NewOutlookPostFeedbackScreen />;
      if (step === "refine-outlook") return <RefineOutlookPostFeedbackScreen />;
      return null;
    case "outlook-flow-post-feedback-v2":
      if (step === "current-outlook") return <CurrentOutlookPostFeedbackV2Screen />;
      if (step === "loading") return <OutlookLoadingScreen />;
      if (step === "new-outlook") return <NewOutlookPostFeedbackV2Screen />;
      if (step === "refine-outlook") return <RefineOutlookPostFeedbackV2Screen />;
      return null;
    case "details-flow":
      if (step === "details-home") return <DetailsHomeScreen />;
      if (step === "details-about") return <AboutYouDetailsScreen />;
      if (step === "details-assets") return <AssetsDetailsScreen />;
      if (step === "details-spending") return <SpendingDetailsScreen />;
      if (step === "details-goals") return <GoalsDetailsScreen />;
      return null;
    case "hybrid-quick":
      if (step === "profile")
        return <NarrativeScreen step="profile" hideSidebar />;
      if (step === "loading") return <LoadingSimScreen />;
      if (step === "outlook") return <OutlookDashboardScreen />;
      if (step === "details")
        return <SectionScrollScreen key="details" section="aboutMore" />;
      if (step === "income")
        return <SectionScrollScreen key="income" section="income" />;
      if (step === "spending")
        return <SectionScrollScreen key="spending" section="spending" />;
      if (step === "goals")
        return <SectionScrollScreen key="goals" section="goals" />;
      if (step === "marketplace") return <MarketplaceScreen />;
      return <CompleteScreen />;
    case "hybrid-guided":
      if (step === "education") return <EducationScreen />;
      if (step === "details") return <NarrativeScreen step="details" />;
      if (step === "income")
        return <GuidedSectionWizard section="income" nextStep="summary" />;
      if (step === "summary") return <GuidedSummaryScreen />;
      if (step === "spending")
        return <GuidedSectionWizard section="spending" nextStep="summary" />;
      if (step === "goals") return <GuidedGoalsScreen />;
      if (step === "outlook") return <OutlookDashboardScreen />;
      if (step === "marketplace") return <MarketplaceScreen />;
      return <CompleteScreen />;
    default:
      return null;
  }
}
