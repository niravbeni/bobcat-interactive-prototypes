"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { CardSort } from "@/components/interactions/CardSort";
import { EditQuestionModal } from "@/components/v2/EditQuestionModal";
import {
  INCOME_QUESTIONS,
  SPENDING_QUESTIONS,
  MANDATORY_QIDS,
  RETIREMENT_GOALS,
  type QuestionDef,
} from "@/lib/questions";
import type { GoalCard, SectionId } from "@/lib/types";

/** First five preset goals, used to seed the ranking when none exist yet. */
const DEFAULT_GOAL_CARDS: GoalCard[] = RETIREMENT_GOALS.slice(0, 5).map((g) => ({
  id: g.id,
  label: g.label,
  source: "preset" as const,
}));

type SectionKey = "about" | "income" | "spending" | "goals";

const SECTIONS: { id: SectionKey; label: string }[] = [
  { id: "about", label: "About You" },
  { id: "income", label: "Income" },
  { id: "spending", label: "Spending" },
  { id: "goals", label: "Goals" },
];

interface FieldRow {
  key: string;
  label: string;
  value: string;
  answered: boolean;
  required: boolean;
  edit?: { section: SectionId; question: QuestionDef };
}

export function DetailsMenuScreen() {
  const { answers, goTo, setAnswers } = useFlow();
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  // Show preset goals by default so the ranking is never empty; any edit commits
  // the working set to state. The chat flow can refine these later.
  const goalCards = answers.goalCards.length
    ? answers.goalCards
    : DEFAULT_GOAL_CARDS;
  const setCards = (next: GoalCard[]) => setAnswers({ goalCards: next });
  const renameCard = (id: string, label: string) =>
    setCards(goalCards.map((c) => (c.id === id ? { ...c, label } : c)));
  const removeCard = (id: string) =>
    setCards(goalCards.filter((c) => c.id !== id));
  const [editing, setEditing] = useState<{
    section: SectionId;
    question: QuestionDef;
  } | null>(null);

  const questionRows = (
    section: SectionId,
    questions: QuestionDef[],
  ): FieldRow[] =>
    questions.map((q) => {
      const a = answers[section][q.id];
      const answered = Boolean(a?.choice);
      return {
        key: q.id,
        label: q.chipLabel,
        value: answered ? q.chipValue(a) : "Empty",
        answered,
        required: MANDATORY_QIDS.has(q.id),
        edit: { section, question: q },
      };
    });

  const aboutRows: FieldRow[] = [
    { key: "name", label: "Name", value: "Gloria", answered: true, required: true },
    { key: "age", label: "Age", value: "62", answered: true, required: true },
    { key: "retiring", label: "Retiring", value: "2031", answered: true, required: false },
  ];

  const goalRows: FieldRow[] = answers.goalCards.length
    ? answers.goalCards.map((c, i) => ({
        key: c.id,
        label: `Priority ${i + 1}`,
        value: c.label,
        answered: true,
        required: false,
      }))
    : [{ key: "none", label: "Goals", value: "Empty", answered: false, required: false }];

  const rowsFor = (section: SectionKey): FieldRow[] => {
    if (section === "about") return aboutRows;
    if (section === "income") return questionRows("income", INCOME_QUESTIONS);
    if (section === "spending")
      return questionRows("spending", SPENDING_QUESTIONS);
    return goalRows;
  };

  const activeLabel = SECTIONS.find((s) => s.id === openSection)?.label ?? "";

  return (
    <AppShell fill hideSidebar>
      {openSection === null ? (
        <div className="mx-auto flex w-full max-w-[640px] flex-col">
          <div className="flex flex-col gap-4 rounded-field bg-ghost-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-medium text-deep-black">
              Your outlook will update once we have initial mandatory data.
            </p>
            <Button
              variant="blue"
              size="md"
              className="shrink-0"
              onClick={() => goTo("chat")}
            >
              Add extra details
            </Button>
          </div>

          <h1 className="mt-8 text-3xl font-semibold tracking-[-0.01em] text-deep-black">
            Your details
          </h1>

          <div className="mt-5 flex flex-col gap-3">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setOpenSection(s.id)}
                className="flex h-14 items-center justify-between rounded-field bg-divider px-5 text-left transition-colors hover:bg-divider/80"
              >
                <span className="text-lg font-semibold text-deep-black">
                  {s.label}
                </span>
                <ChevronRight
                  className="size-5 text-deep-black"
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 w-full flex-1 flex-col">
          <BackButton
            onClick={() => setOpenSection(null)}
            label="All details"
            size={36}
          />

          <div className="scrollbar-slim mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
            <h2 className="text-center text-2xl font-semibold tracking-[-0.01em] text-deep-black">
              {activeLabel}
            </h2>

            {openSection === "goals" ? (
              <div className="mx-auto mt-6 flex w-full max-w-[520px] flex-col gap-4">
                <p className="text-center text-sm leading-snug text-gray-2">
                  Drag to re-rank your priorities. We weight your outlook from
                  the top down.
                </p>
                <CardSort
                  cards={goalCards}
                  onReorder={setCards}
                  onRename={renameCard}
                  onRemove={removeCard}
                />
              </div>
            ) : (
              <div className="mx-auto mt-6 flex w-full max-w-[520px] flex-col gap-3">
              {rowsFor(openSection).map((row) => {
                const editable = Boolean(row.edit);
                const content = (
                  <>
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-2">
                        {row.label}
                      </span>
                      {row.required ? (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-mandarin">
                          Required
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={
                        row.answered
                          ? "text-base font-semibold text-deep-black"
                          : "text-base text-gray-2"
                      }
                    >
                      {row.value}
                    </span>
                  </>
                );

                return editable ? (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => setEditing(row.edit!)}
                    className="flex items-center justify-between gap-4 rounded-field border border-stroke-subtle bg-white px-4 py-3 text-left transition-colors hover:border-deep-black/30"
                  >
                    {content}
                  </button>
                ) : (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-4 rounded-field border border-stroke-subtle bg-white px-4 py-3"
                  >
                    {content}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
      )}

      {editing ? (
        <EditQuestionModal
          section={editing.section}
          question={editing.question}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </AppShell>
  );
}
