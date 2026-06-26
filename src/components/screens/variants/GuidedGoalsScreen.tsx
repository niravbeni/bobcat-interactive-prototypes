"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useFlow } from "@/components/flow/FlowProvider";
import { useEnterToContinue } from "@/components/flow/useEnterToContinue";
import { AppShell } from "@/components/chrome/AppShell";
import { DetailsSidebar } from "@/components/chrome/DetailsSidebar";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { EnterHint } from "@/components/ui/EnterHint";
import { SectionQuestion } from "@/components/narrative/SectionQuestion";
import { EditMadlibFieldModal } from "@/components/narrative/EditMadlibFieldModal";
import {
  PriorityRankFlow,
  priorityCardsFromRanking,
  type PriorityRankResult,
} from "@/components/interactions/PriorityRankFlow";
import {
  narrativeProgress,
  narrativeSidebarItems,
} from "@/components/narrative/sidebarItems";
import { isFilled, isValid } from "@/lib/narrativeValidation";
import {
  madlibFieldById,
  sampleValueFor,
  type MadlibField,
} from "@/lib/narrative";
import { SECTIONS, visiblePartFields } from "@/lib/sections";

type GoalStep =
  | { kind: "field"; field: MadlibField }
  | { kind: "rank" };

/**
 * Guided-path Goals step, run as a one-question-per-screen wizard on the `goals`
 * URL: the goal-picker questions, then the swipe → sort → rank deck, then the
 * "few more details" questions, finally routing on to the full outlook. Mirrors
 * the experienced flow's pick → rank → more ordering, but one screen at a time.
 */
export function GuidedGoalsScreen() {
  const { answers, setAbout, setAnswers, goBack, goTo } = useFlow();
  const about = answers.about;
  const def = SECTIONS.goals;
  const pickPart = def.parts[0];
  const morePart = def.parts[1];

  const steps = useMemo<GoalStep[]>(() => {
    const pick = visiblePartFields(pickPart, about).map(
      (field): GoalStep => ({ kind: "field", field }),
    );
    const more = visiblePartFields(morePart, about).map(
      (field): GoalStep => ({ kind: "field", field }),
    );
    return [...pick, { kind: "rank" }, ...more];
  }, [pickPart, morePart, about]);
  const maxIndex = Math.max(0, steps.length - 1);

  const [index, setIndex] = useState(0);
  if (index > maxIndex) setIndex(maxIndex);
  const current = Math.min(index, maxIndex);
  const step = steps[current];

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const editingField = editingFieldId
    ? madlibFieldById(editingFieldId)
    : undefined;

  const fieldStep = step?.kind === "field" ? step.field : undefined;
  const canContinue = !fieldStep
    ? false
    : isFilled(fieldStep, about)
      ? isValid(fieldStep, about)
      : Boolean(fieldStep.optional);

  const advance = () => {
    if (current >= maxIndex) goTo("outlook");
    else setIndex(current + 1);
  };

  const handleContinue = () => {
    if (!canContinue) return;
    advance();
  };

  const handleBack = () => {
    if (current > 0) setIndex(current - 1);
    else goBack();
  };

  const handleRankDone = (result: PriorityRankResult) => {
    setAnswers({
      goalRanking: result.ranking,
      goalCards: priorityCardsFromRanking(result.ranking),
      goalVerdicts: result.decisions,
    });
    advance();
  };

  // Enter advances only on a question screen whose answer is valid — the same
  // condition gating that screen's Continue. The rank deck commits itself, so
  // Enter is disabled on it.
  useEnterToContinue(step?.kind === "field" && canContinue, handleContinue);

  // Prototype shortcut: Shift+Enter fills the goal questions with sample data.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || !e.shiftKey) return;
      e.preventDefault();
      [pickPart, morePart].forEach((part) =>
        visiblePartFields(part, about).forEach((f) =>
          setAbout(f.id, sampleValueFor(f)),
        ),
      );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const { aboutItems, incomeItems, spendingItems, goalsItems } =
    narrativeSidebarItems(about);

  const progressPct = Math.round(((current + 1) / Math.max(1, steps.length)) * 100);

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
          onEditAbout={(id) => setEditingFieldId(id)}
          onEditMadlib={(id) => setEditingFieldId(id)}
          openSection="goals"
          progress={narrativeProgress(about)}
        />
      }
    >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4">
          <BackButton onClick={handleBack} label="Back" size={36} />
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-text">
              Progress
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-divider sm:w-40">
              <div
                className="h-full rounded-full bg-violet transition-[width] duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="w-9 text-right text-[11px] font-medium tabular-nums text-gray-2">
              {progressPct}%
            </span>
          </div>
        </div>

        {step?.kind === "rank" ? (
          <div className="mt-8 flex min-h-0 flex-1 flex-col">
            <h1 className="max-w-[640px] text-2xl font-semibold leading-[1.15] tracking-[-0.01em] text-deep-black sm:text-3xl">
              Now rank what matters most
            </h1>
            <p className="mt-2 max-w-[600px] text-base leading-snug text-gray-text">
              Swipe through each priority, sort them into what&rsquo;s essential
              or nice to have, then rank your keepers.
            </p>
            <div className="mt-8 flex min-h-0 w-full flex-1 flex-col">
              <PriorityRankFlow fit roomy onDone={handleRankDone} />
            </div>
          </div>
        ) : fieldStep ? (
          <>
            <div className="scrollbar-slim -mx-2 mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={fieldStep.id}
                  initial={{ opacity: 0, y: 36 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -36 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-5"
                >
                  <span className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-text">
                    {def.name}
                  </span>
                  <SectionQuestion
                    field={fieldStep}
                    value={about[fieldStep.id]?.value ?? fieldStep.default ?? ""}
                    onChange={(v) => setAbout(fieldStep.id, v)}
                    onSubmit={handleContinue}
                    error={isFilled(fieldStep, about) && !isValid(fieldStep, about)}
                    compact
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-4 flex shrink-0 flex-col items-end gap-2 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleContinue}
                disabled={!canContinue}
                data-wizard-continue="true"
                className="disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </Button>
              {canContinue ? <EnterHint /> : null}
            </div>
          </>
        ) : null}
      </div>

      {editingField ? (
        <EditMadlibFieldModal
          field={editingField}
          onClose={() => setEditingFieldId(null)}
        />
      ) : null}
    </AppShell>
  );
}
