"use client";

import { useRouter } from "next/navigation";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { DetailsSidebar } from "@/components/chrome/DetailsSidebar";
import { BackButton } from "@/components/ui/BackButton";
import {
  PriorityRankFlow,
  priorityCardsFromRanking,
  type PriorityRankResult,
} from "@/components/interactions/PriorityRankFlow";
import {
  narrativeProgress,
  narrativeSidebarItems,
} from "@/components/narrative/sidebarItems";

/**
 * Goals step of the hybrid flow: the swipe → sort → rank deck, laid out in the
 * same page chrome as the rest of the flow (back + heading + roomy full-width
 * components) so it reads as part of the experience rather than a dropped-in
 * widget. Committing the ranking updates the live side panel + outlook.
 */
export function HybridGoalsScreen() {
  const { answers, setAnswers, goNext, goTo, variant } = useFlow();
  const router = useRouter();
  const about = answers.about;

  const handleDone = (result: PriorityRankResult) => {
    setAnswers({
      goalRanking: result.ranking,
      goalCards: priorityCardsFromRanking(result.ranking),
      goalVerdicts: result.decisions,
    });
    // Persona-1 returns to the now-FULL outlook; the guided flow continues on.
    if (variant === "hybrid-quick") goTo("outlook");
    else goNext();
  };

  const {
    aboutItems,
    incomeItems,
    spendingItems,
    goalsItems,
  } = narrativeSidebarItems(about);

  return (
    <AppShell
      fill
      customSidebar={
        <DetailsSidebar
          variant="chat"
          aboutItems={aboutItems}
          incomeItems={incomeItems}
          spendingItems={spendingItems}
          goalsItems={goalsItems}
          openSection="goals"
          progress={narrativeProgress(about)}
        />
      }
    >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <BackButton onClick={() => router.back()} label="Back" size={36} />

        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <h1 className="max-w-[640px] text-2xl font-semibold leading-[1.15] tracking-[-0.01em] text-deep-black sm:text-3xl">
            What matters most in your retirement?
          </h1>
          <p className="mt-2 max-w-[600px] text-base leading-snug text-gray-text">
            Swipe through each priority, sort them into what&rsquo;s essential or
            nice to have, then rank your keepers. Your outlook sharpens around
            your top goals.
          </p>

          <div className="mt-8 flex min-h-0 w-full flex-1 flex-col">
            <PriorityRankFlow fit roomy onDone={handleDone} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
