"use client";

import { useState } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BasicDetailsBar } from "@/components/v2/BasicDetailsBar";
import { Button } from "@/components/ui/Button";
import {
  PriorityRankFlow,
  priorityCardsFromRanking,
  type PriorityRankResult,
} from "@/components/interactions/PriorityRankFlow";
import { EditQuestionModal } from "@/components/v2/EditQuestionModal";
import {
  ABOUT_FIELDS,
  aboutValue,
  EditAboutFieldModal,
  type AboutField,
} from "@/components/v2/EditAboutFieldModal";
import {
  INCOME_QUESTIONS,
  SPENDING_QUESTIONS,
  MANDATORY_QIDS,
  RETIREMENT_GOALS,
  type QuestionDef,
} from "@/lib/questions";
import { cn } from "@/lib/cn";
import type { GoalCard, SectionId } from "@/lib/types";

/** First five preset goals, used to seed the ranking when none exist yet. */
const DEFAULT_GOAL_CARDS: GoalCard[] = RETIREMENT_GOALS.slice(0, 5).map((g) => ({
  id: g.id,
  label: g.label,
  source: "preset" as const,
}));

type TabKey = "about" | "income" | "spending" | "goals";

const TABS: { id: TabKey; label: string }[] = [
  { id: "about", label: "About you" },
  { id: "income", label: "Assets" },
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
  const { answers, setAnswers } = useFlow();
  const [tab, setTab] = useState<TabKey>("about");

  // Show preset goals by default so the summary is never empty; the full
  // swipe → sort → rank process below commits a fresh ranking.
  const goalCards = answers.goalCards.length
    ? answers.goalCards
    : DEFAULT_GOAL_CARDS;
  const [goalsUpdating, setGoalsUpdating] = useState(false);
  const handleGoalsDone = (result: PriorityRankResult) => {
    setAnswers({
      goalRanking: result.ranking,
      goalCards: priorityCardsFromRanking(result.ranking),
      goalVerdicts: result.decisions,
    });
    setGoalsUpdating(false);
  };
  const [editing, setEditing] = useState<{
    section: SectionId;
    question: QuestionDef;
  } | null>(null);
  const [editingAbout, setEditingAbout] = useState<AboutField | null>(null);

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

  const activeLabel = TABS.find((t) => t.id === tab)?.label ?? "";

  return (
    <AppShell fill hideSidebar card={false} footer={<BasicDetailsBar />}>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        {/* Section tabs — segmented toggle */}
        <div className="flex justify-center">
          <div
            role="tablist"
            className="inline-flex items-center gap-1 rounded-full border border-stroke-subtle bg-ghost-white p-1"
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  onClick={() => setTab(t.id)}
                  aria-selected={active}
                  className={cn(
                    "h-9 rounded-full px-5 text-sm font-semibold tracking-[0.16px] transition-colors",
                    active
                      ? "bg-deep-black text-white shadow-[0_1px_2px_rgba(16,24,32,0.18)]"
                      : "text-gray-1 hover:text-deep-black",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section content — the goals ranking fills the available height so it
            fits the screen without scrolling; other tabs scroll as needed. */}
        {tab === "goals" && goalsUpdating ? (
          <div className="mx-auto mt-6 flex min-h-0 w-full max-w-[560px] flex-1 flex-col rounded-field bg-ghost-white p-5 sm:p-6">
            <PriorityRankFlow
              fit
              onDone={handleGoalsDone}
              onExit={() => setGoalsUpdating(false)}
            />
          </div>
        ) : (
        <div className="scrollbar-slim mx-auto mt-6 flex min-h-0 w-full max-w-[560px] flex-1 flex-col overflow-y-auto">
          <div className="w-full rounded-field bg-ghost-white p-4 sm:p-5">
            <h2 className="text-xl font-semibold tracking-[-0.01em] text-deep-black">
              {activeLabel}
            </h2>

            {tab === "about" ? (
              <div className="mt-4 flex flex-col gap-2">
                {ABOUT_FIELDS.map((f) => {
                  const value = aboutValue(f, answers.about);
                  const answered = Boolean(value);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setEditingAbout(f)}
                      className="flex items-center justify-between gap-4 rounded-3xl border border-stroke-subtle bg-white px-5 py-3 text-left transition-colors hover:border-deep-black/30"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-2">
                          {f.label}
                        </span>
                        {f.required ? (
                          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-mandarin">
                            Required
                          </span>
                        ) : null}
                      </div>
                      <span
                        className={
                          answered
                            ? "text-base font-semibold text-deep-black"
                            : "text-base text-gray-2"
                        }
                      >
                        {answered ? value : (f.placeholder ?? "Empty")}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : tab === "goals" ? (
              <div className="mt-5 flex flex-col gap-3">
                <p className="text-sm leading-snug text-gray-2">
                  Your priorities, ranked most to least important. We weight your
                  outlook from the top down.
                </p>
                <ol className="flex flex-col gap-2">
                  {goalCards.slice(0, 5).map((c, i) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 rounded-field border border-stroke-subtle bg-white px-4 py-3"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet/10 text-xs font-semibold text-violet">
                        {i + 1}
                      </span>
                      <span className="text-base font-medium text-deep-black">
                        {c.label}
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="flex justify-start pt-1">
                  <Button
                    variant="blue"
                    size="md"
                    onClick={() => setGoalsUpdating(true)}
                  >
                    Update priorities
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                {questionRows(
                  tab,
                  tab === "income" ? INCOME_QUESTIONS : SPENDING_QUESTIONS,
                ).map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => setEditing(row.edit!)}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-stroke-subtle bg-white px-5 py-3 text-left transition-colors hover:border-deep-black/30"
                  >
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
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {editing ? (
        <EditQuestionModal
          section={editing.section}
          question={editing.question}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {editingAbout ? (
        <EditAboutFieldModal
          field={editingAbout}
          onClose={() => setEditingAbout(null)}
        />
      ) : null}
    </AppShell>
  );
}
