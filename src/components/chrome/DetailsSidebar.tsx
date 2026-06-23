"use client";

import { useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { cn } from "@/lib/cn";
import {
  INCOME_QUESTIONS,
  SPENDING_QUESTIONS,
  type QuestionDef,
} from "@/lib/questions";
import type { QAnswer } from "@/lib/types";

interface SectionItem {
  key: string;
  label: string;
  value: string;
  /** Sort key — bigger = more recent. */
  at: number;
}

const ABOUT_YOU: SectionItem[] = [
  { key: "name", label: "Name", value: "Gloria", at: 0 },
  { key: "age", label: "Age", value: "62", at: 0 },
  { key: "retiring", label: "Retiring", value: "2031", at: 0 },
];

/** Map answered income/spending questions to display rows, newest first. */
function answeredItems(
  questions: QuestionDef[],
  answers: Record<string, QAnswer>,
): SectionItem[] {
  return questions
    .filter((q) => Boolean(answers[q.id]?.choice))
    .map((q) => ({
      key: q.id,
      label: q.chipLabel,
      value: q.chipValue(answers[q.id]),
      at: answers[q.id]?.at ?? 0,
    }))
    .sort((a, b) => b.at - a.at);
}

function Row({ item }: { item: SectionItem }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div className="flex min-w-0 flex-col">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-gray-2">
          {item.label}
        </span>
        <span className="truncate text-sm font-medium text-deep-black">
          {item.value}
        </span>
      </div>
      <button
        type="button"
        aria-label={`Edit ${item.label}`}
        className="mt-0.5 shrink-0 rounded p-1 text-gray-2 transition-colors hover:text-deep-black"
      >
        <Pencil className="size-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}

function Folder({
  id,
  label,
  items,
  open,
  onToggle,
  emptyHint,
}: {
  id: string;
  label: string;
  items: SectionItem[];
  open: boolean;
  onToggle: () => void;
  emptyHint?: string;
}) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`details-folder-${id}`}
        className="flex h-12 items-center justify-between rounded-field bg-divider px-4 text-left transition-colors hover:bg-divider/80"
      >
        <span className="text-lg font-semibold text-deep-black">{label}</span>
        <ChevronDown
          className={cn(
            "size-5 text-deep-black transition-transform",
            open && "rotate-180",
          )}
          strokeWidth={2}
        />
      </button>
      {open ? (
        <div id={`details-folder-${id}`} className="flex flex-col px-4 pt-2">
          {items.length === 0 ? (
            <p className="py-1.5 text-xs italic text-gray-2">
              {emptyHint ?? "Nothing added yet"}
            </p>
          ) : (
            items.map((it) => <Row key={it.key} item={it} />)
          )}
        </div>
      ) : null}
    </div>
  );
}

const REQUIRED_TOTAL = INCOME_QUESTIONS.length + SPENDING_QUESTIONS.length;

export function DetailsSidebar() {
  const { answers } = useFlow();

  const income = answeredItems(INCOME_QUESTIONS, answers.income);
  const spending = answeredItems(SPENDING_QUESTIONS, answers.spending);
  const goals: SectionItem[] = answers.goalCards.map((c, i) => ({
    key: c.id,
    label: `Priority ${i + 1}`,
    value: c.label,
    at: -i,
  }));

  const answered = income.length + spending.length;
  const pct = Math.round((answered / REQUIRED_TOTAL) * 100);

  // Only one folder is open at a time so the panel never grows past the column.
  // The "current" folder is the section the user is actively answering. As they
  // progress through the flow the open folder follows along; manual toggles
  // override until the section changes again (we tie the override to the
  // current section so a stale override is automatically dropped).
  const currentId: string =
    goals.length > 0
      ? "goals"
      : spending.length > 0
        ? "spending"
        : income.length > 0
          ? "income"
          : "about";

  const [manual, setManual] = useState<{
    section: string;
    openId: string | null;
  } | null>(null);

  const openId =
    manual && manual.section === currentId ? manual.openId : currentId;

  const toggle = (id: string) =>
    setManual({ section: currentId, openId: openId === id ? null : id });
  const isOpen = (id: string) => openId === id;

  return (
    <aside className="flex w-[335px] shrink-0 flex-col gap-3 rounded-field bg-ghost-white px-4 pb-6 pt-4 3xl:w-[400px] 3xl:px-6 4xl:w-[460px]">
      <Folder
        id="about"
        label="About You"
        items={ABOUT_YOU}
        open={isOpen("about")}
        onToggle={() => toggle("about")}
      />
      <Folder
        id="income"
        label="Income"
        items={income}
        open={isOpen("income")}
        onToggle={() => toggle("income")}
        emptyHint="No income details yet"
      />
      <Folder
        id="spending"
        label="Spending"
        items={spending}
        open={isOpen("spending")}
        onToggle={() => toggle("spending")}
        emptyHint="No spending details yet"
      />
      <Folder
        id="goals"
        label="Goals"
        items={goals}
        open={isOpen("goals")}
        onToggle={() => toggle("goals")}
        emptyHint="No goals ranked yet"
      />

      <div className="mt-auto rounded-card border border-stroke-subtle bg-white p-4">
        <p className="text-sm leading-snug text-gray-1">
          Your plan will update once we have initial mandatory data.
        </p>
        <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-2">
          <span>Required details</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-divider">
          <div
            className="h-full rounded-full bg-success transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
