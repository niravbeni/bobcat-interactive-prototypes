"use client";

import { useState } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { CardSwipe, type SwipeResult } from "@/components/interactions/CardSwipe";
import { RETIREMENT_PRIORITIES } from "@/lib/priorities";
import type { GoalCard } from "@/lib/types";

export function SwipeGoalsScreen() {
  const { goNext, goBack, setAnswers } = useFlow();
  const [sorted, setSorted] = useState(false);

  const handleComplete = (result: SwipeResult) => {
    const byId = new Map(RETIREMENT_PRIORITIES.map((p) => [p.id, p]));
    const goalCards: GoalCard[] = result.ranking
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({ id: p.id, label: p.title, source: "preset" as const }));
    setAnswers({
      goalRanking: result.ranking,
      goalCards,
      goalVerdicts: result.decisions,
    });
    goNext();
  };

  return (
    <AppShell
      sidebar={{
        planBadge: { label: "Updated", tone: "success" },
        detailsBadges: [{ label: "Required 80%", tone: "warning" }],
        subSections: [
          { label: "About You" },
          { label: "Assets" },
          { label: "Income" },
          { label: "Spending" },
          { label: "Goals", active: true },
        ],
      }}
    >
      <div className="flex w-full flex-1 flex-col">
        <BackButton onClick={goBack} />

        <div className="mt-6 text-center">
          <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black sm:text-[30px]">
            What matters most in your retirement?
          </h1>
          {!sorted ? (
            <p className="mx-auto mt-2 max-w-[460px] text-sm text-black/75">
              Swipe each card to sort it. Up for essential, right for nice to
              have, left for not for me.
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-1 items-start justify-center">
          <div className="w-full max-w-[640px]">
            <CardSwipe
              items={RETIREMENT_PRIORITIES}
              onComplete={handleComplete}
              onStatusChange={setSorted}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
