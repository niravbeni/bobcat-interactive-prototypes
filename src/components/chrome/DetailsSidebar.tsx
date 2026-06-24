"use client";

import { useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { EditQuestionModal } from "@/components/v2/EditQuestionModal";
import { SnapSlider } from "@/components/ui/SnapSlider";
import { cn } from "@/lib/cn";
import {
  INCOME_QUESTIONS,
  SPENDING_QUESTIONS,
  type QuestionDef,
} from "@/lib/questions";
import type { QAnswer, SectionId } from "@/lib/types";

interface SectionItem {
  key: string;
  label: string;
  value: string;
  /** Sort key — bigger = more recent. */
  at: number;
  /** If set, clicking the pencil opens the edit modal for this question. */
  edit?: { section: SectionId; question: QuestionDef };
  /** If set, a quick-adjust slider is shown for this money value. */
  money?: { section: SectionId; id: string; amount: number };
}

const ABOUT_YOU: SectionItem[] = [
  { key: "name", label: "Name", value: "Gloria", at: 0 },
  { key: "age", label: "Age", value: "62", at: 0 },
  { key: "retiring", label: "Retiring", value: "2031", at: 0 },
];

const parseMoney = (s: string | undefined): number =>
  Number((s ?? "").replace(/[^0-9.]/g, ""));

const formatMoney = (n: number): string =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Numeric amount for an answer iff it's a money-revealing option with a value. */
function moneyAmount(q: QuestionDef, a: QAnswer | undefined): number | null {
  if (!a?.choice || !a.value) return null;
  const opt = q.options.find((o) => o.id === a.choice);
  if (opt?.reveal !== "money") return null;
  const n = parseMoney(a.value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** A "nice" slider ceiling and step for a given amount magnitude. */
function sliderBounds(amount: number): { max: number; step: number } {
  if (amount >= 100000) return { max: Math.ceil((amount * 2) / 50000) * 50000, step: 5000 };
  if (amount >= 10000) return { max: Math.ceil((amount * 2) / 5000) * 5000, step: 500 };
  if (amount >= 1000) return { max: Math.ceil((amount * 2) / 1000) * 1000, step: 100 };
  return { max: Math.max(Math.ceil((amount * 2) / 100) * 100, 1000), step: 50 };
}

/** Map answered income/spending questions to display rows, newest first. */
function answeredItems(
  section: SectionId,
  questions: QuestionDef[],
  answers: Record<string, QAnswer>,
): SectionItem[] {
  return questions
    .filter((q) => Boolean(answers[q.id]?.choice))
    .map((q) => {
      const amount = moneyAmount(q, answers[q.id]);
      return {
        key: q.id,
        label: q.chipLabel,
        value: q.chipValue(answers[q.id]),
        at: answers[q.id]?.at ?? 0,
        edit: { section, question: q },
        money:
          amount !== null ? { section, id: q.id, amount } : undefined,
      };
    })
    .sort((a, b) => b.at - a.at);
}

/**
 * A fine "nudge" control, not a full-range editor. It spans a small band (±25%)
 * around a *baseline* that only re-anchors when the value changes from outside
 * the slider (e.g. via the edit modal). The slider's own writes never move the
 * baseline, so the thumb holds its position off-centre instead of springing back
 * to the middle. Drastic changes go through the edit modal.
 */
function MoneyNudgeSlider({
  amount,
  label,
  onChange,
}: {
  amount: number;
  label: string;
  onChange: (n: number) => void;
}) {
  const [baseline, setBaseline] = useState(amount);
  const [selfValue, setSelfValue] = useState<number | null>(null);
  const [prevAmount, setPrevAmount] = useState(amount);

  // Re-anchor only when the change didn't come from this slider's own writes.
  if (amount !== prevAmount) {
    setPrevAmount(amount);
    if (amount !== selfValue) setBaseline(amount);
  }

  const base = baseline || 1;
  const min = Math.round(base * 0.75);
  const max = Math.max(Math.round(base * 1.25), 1);
  const step = sliderBounds(base).step;
  const value = Math.min(max, Math.max(min, amount));

  return (
    <input
      type="range"
      className="slider-slim w-full pr-1"
      aria-label={`Adjust ${label}`}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const n = Number(e.target.value);
        setSelfValue(n);
        onChange(n);
      }}
    />
  );
}

function Row({
  item,
  onEdit,
  onMoneyChange,
}: {
  item: SectionItem;
  onEdit?: () => void;
  onMoneyChange?: (section: SectionId, id: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-gray-2">
            {item.label}
          </span>
          <span className="truncate text-sm font-medium text-deep-black">
            {item.value}
          </span>
        </div>
        {onEdit ? (
          <button
            type="button"
            aria-label={`Edit ${item.label}`}
            onClick={onEdit}
            className="mt-0.5 shrink-0 rounded p-1 text-gray-2 transition-colors hover:text-deep-black"
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
      {item.money && onMoneyChange ? (
        <MoneyNudgeSlider
          amount={item.money.amount}
          label={item.label}
          onChange={(n) =>
            onMoneyChange(item.money!.section, item.money!.id, formatMoney(n))
          }
        />
      ) : null}
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
  onEditItem,
  onMoneyChange,
}: {
  id: string;
  label: string;
  items: SectionItem[];
  open: boolean;
  onToggle: () => void;
  emptyHint?: string;
  onEditItem?: (item: SectionItem) => void;
  onMoneyChange?: (section: SectionId, id: string, value: string) => void;
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
            items.map((it) => (
              <Row
                key={it.key}
                item={it}
                onEdit={
                  it.edit && onEditItem ? () => onEditItem(it) : undefined
                }
                onMoneyChange={onMoneyChange}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

const REQUIRED_TOTAL = INCOME_QUESTIONS.length + SPENDING_QUESTIONS.length;

const CONDITION_BY_INDEX = ["worst", "typical", "best"] as const;
const CONDITION_LABELS = ["Worst case", "Typical", "Best Case"] as const;
const CONDITION_SNAP_POINTS = [0, 50, 100];

export function DetailsSidebar({
  variant = "chat",
  onOpenPreview,
}: {
  /** Controls the bottom card: progress/refresh (chat) or Plan Conditions (outlook). */
  variant?: "chat" | "outlook";
  /** Optional callback invoked when the user clicks the "See your outlook" CTA. */
  onOpenPreview?: () => void;
} = {}) {
  const { answers, setQuestion, setAnswers } = useFlow();

  const income = answeredItems("income", INCOME_QUESTIONS, answers.income);
  const spending = answeredItems(
    "spending",
    SPENDING_QUESTIONS,
    answers.spending,
  );
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

  const [editing, setEditing] = useState<{
    section: SectionId;
    question: QuestionDef;
  } | null>(null);

  const handleEditItem = (item: SectionItem) => {
    if (item.edit) setEditing(item.edit);
  };

  const handleMoneyChange = (
    section: SectionId,
    id: string,
    value: string,
  ) => {
    // Quick nudges shouldn't re-order the panel, so keep the recency timestamp.
    setQuestion(section, id, { value }, { bump: false });
  };

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
        onEditItem={handleEditItem}
        onMoneyChange={handleMoneyChange}
      />
      <Folder
        id="spending"
        label="Spending"
        items={spending}
        open={isOpen("spending")}
        onToggle={() => toggle("spending")}
        emptyHint="No spending details yet"
        onEditItem={handleEditItem}
        onMoneyChange={handleMoneyChange}
      />
      <Folder
        id="goals"
        label="Goals"
        items={goals}
        open={isOpen("goals")}
        onToggle={() => toggle("goals")}
        emptyHint="No goals ranked yet"
      />

      {variant === "outlook" ? (
        <div className="mt-auto rounded-card border border-stroke-subtle bg-white p-4">
          <p className="text-base font-semibold text-deep-black">
            Plan Conditions
          </p>
          <p className="mt-1 text-sm leading-snug text-gray-1">
            See how your outlook shifts across different market scenarios.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <SnapSlider
              aria-label="Plan conditions"
              value={answers.planConditionT}
              snapPoints={CONDITION_SNAP_POINTS}
              onChange={(t) =>
                setAnswers({
                  planConditionT: t,
                  planCondition: CONDITION_BY_INDEX[Math.round(t / 50)],
                })
              }
            />
            <div className="flex justify-between">
              {CONDITION_LABELS.map((label, i) => (
                <span
                  key={label}
                  className={cn(
                    "text-[11px] leading-tight text-gray-2",
                    i === 0 && "text-left",
                    i === CONDITION_LABELS.length - 1 && "text-right",
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-auto rounded-card border border-stroke-subtle bg-white p-4">
          {answers.planRefreshed ? (
            <>
              <span className="inline-flex items-center rounded-pill bg-success/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-success">
                Plan refreshed
              </span>
              <p className="mt-2 text-sm leading-snug text-gray-1">
                Your outlook has refreshed. It will now update anytime you add
                additional information or make edits.
              </p>
              <button
                type="button"
                onClick={onOpenPreview}
                className="mt-3 w-full rounded-pill bg-deep-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
              >
                See your outlook
              </button>
              <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-2">
                <span>Required details</span>
                <span>100%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-divider">
                <div className="h-full w-full rounded-full bg-success" />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-snug text-gray-1">
                Your outlook will update once we have initial mandatory data.
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
            </>
          )}
        </div>
      )}

      {editing ? (
        <EditQuestionModal
          section={editing.section}
          question={editing.question}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </aside>
  );
}
