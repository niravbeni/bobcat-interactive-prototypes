"use client";

import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { QuestionWizard } from "@/components/flow/QuestionWizard";
import { INCOME_QUESTIONS } from "@/lib/questions";

export function IncomeScreen() {
  const { goTo, goBack } = useFlow();

  return (
    <AppShell
      sidebar={{
        planBadge: { label: "Updated", tone: "success" },
        detailsBadges: [{ label: "Required 40%", tone: "warning" }],
      }}
    >
      <QuestionWizard
        section="income"
        questions={INCOME_QUESTIONS}
        onComplete={() => goTo("summary")}
        onExitBack={goBack}
      />
    </AppShell>
  );
}
