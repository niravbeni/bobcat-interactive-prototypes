"use client";

import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { QuestionWizard } from "@/components/flow/QuestionWizard";
import { SPENDING_QUESTIONS } from "@/lib/questions";

export function SpendingScreen() {
  const { goNext, goBack } = useFlow();

  return (
    <AppShell
      sidebar={{
        planBadge: { label: "Updated", tone: "success" },
        detailsBadges: [
          { label: "Required 60%", tone: "warning" },
          { label: "Optional 0%", tone: "neutral" },
        ],
        subSections: [
          { label: "About You" },
          { label: "Assets" },
          { label: "Income" },
          { label: "Spending", active: true },
          { label: "Goals" },
        ],
      }}
    >
      <QuestionWizard
        section="spending"
        questions={SPENDING_QUESTIONS}
        onComplete={goNext}
        onExitBack={goBack}
      />
    </AppShell>
  );
}
