"use client";

import { useEffect, useRef } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { CardSort } from "@/components/interactions/CardSort";
import { buildGoalCards } from "@/lib/questions";
import type { GoalCard } from "@/lib/types";

export function CardSortGoalsScreen() {
  const { answers, setAnswers, goNext, goBack } = useFlow();
  const cards = answers.goalCards;
  const seeded = useRef(false);

  useEffect(() => {
    if (!seeded.current && cards.length === 0) {
      seeded.current = true;
      const chatText = answers.goalsMessages
        .filter((m) => m.role === "user")
        .map((m) => m.text)
        .join(" ");
      setAnswers({ goalCards: buildGoalCards(chatText) });
    }
  }, [cards.length, answers.goalsMessages, setAnswers]);

  const setCards = (next: GoalCard[]) => setAnswers({ goalCards: next });

  const rename = (id: string, label: string) =>
    setCards(cards.map((c) => (c.id === id ? { ...c, label } : c)));
  const remove = (id: string) => setCards(cards.filter((c) => c.id !== id));
  const add = (label: string) =>
    setCards([
      ...cards,
      { id: `custom-${Date.now()}`, label, source: "custom" },
    ]);

  const handleContinue = () => {
    setAnswers({ goalRanking: cards.map((c) => c.id) });
    goNext();
  };

  return (
    <AppShell
      fill
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
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <BackButton onClick={goBack} />

        <h1 className="mt-6 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black xl:text-[32px]">
          Here are your goals.{" "}
          <span className="text-violet">Drag to rank what matters most.</span>
        </h1>
        <p className="mt-3 text-sm tracking-[-0.28px] text-black/75">
          Top of the list gets the most weight in your plan. Rename or remove any
          goal, or add your own, then continue.
        </p>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
          <CardSort
            cards={cards}
            onReorder={setCards}
            onRename={rename}
            onRemove={remove}
            onAdd={add}
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-stroke-subtle pt-4">
          <span className="text-sm text-gray-text">
            {cards.length} goal{cards.length === 1 ? "" : "s"}, ranked
          </span>
          <Button
            variant="blue"
            size="md"
            onClick={handleContinue}
            disabled={cards.length === 0}
          >
            Continue
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
