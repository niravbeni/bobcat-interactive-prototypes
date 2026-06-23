"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { SpendingDetail } from "@/components/flow/SpendingDetail";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { INCOME_QUESTIONS, SPENDING_QUESTIONS, type QuestionDef } from "@/lib/questions";
import type { SectionId } from "@/lib/types";
import { Check, Pencil } from "lucide-react";

type EditTarget = { section: SectionId; id: string } | null;

/** Compact selectable row used inside the inline editor. */
function MiniOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
        selected
          ? "border-deep-black bg-deep-black text-white"
          : "border-stroke-subtle bg-white text-deep-black hover:border-deep-black",
      )}
    >
      <span>{label}</span>
      {selected ? <Check className="size-4 shrink-0" strokeWidth={2} /> : null}
    </button>
  );
}

/** Compact money input used inside the inline editor. */
function MiniMoney({
  value,
  onChange,
  onSubmit,
  badge,
  helper,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  badge?: string;
  helper?: string;
}) {
  return (
    <div className="flex w-full flex-col">
      <div className="flex h-12 items-center rounded-lg border border-stroke-subtle bg-white px-3">
        <span className="text-lg text-black">$</span>
        <input
          autoFocus
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit?.();
            }
          }}
          className="ml-1.5 w-full bg-transparent text-lg text-black outline-none placeholder:text-gray-text"
          placeholder="0.00"
        />
        {badge ? (
          <span className="ml-2 inline-flex shrink-0 items-center rounded-full bg-mandarin/20 px-2.5 py-1 text-[11px] font-semibold leading-none text-mandarin whitespace-nowrap">
            {badge}
          </span>
        ) : null}
      </div>
      {helper ? (
        <p className="pt-1 text-right text-xs leading-snug text-gray-text">{helper}</p>
      ) : null}
    </div>
  );
}

export function ReviewScreen() {
  const { answers, goBack, goNext, setQuestion } = useFlow();
  const [editing, setEditing] = useState<EditTarget>(null);

  const isEditing = (section: SectionId, id: string) =>
    editing?.section === section && editing?.id === id;

  const handleSelect = (section: SectionId, q: QuestionDef, optionId: string) => {
    const opt = q.options.find((o) => o.id === optionId);
    const ans = answers[section][q.id];
    const patch: { choice: string; value?: string } = { choice: optionId };
    if (opt?.reveal === "money" && !ans?.value) {
      patch.value = q.moneyDefault ?? "";
    }
    setQuestion(section, q.id, patch);
    // Plain choices are done in one tap; reveals keep the editor open to refine.
    if (!opt?.reveal && !q.prefill) setEditing(null);
  };

  const renderItem = (section: SectionId, q: QuestionDef) => {
    const ans = answers[section][q.id];
    const selectedOption = q.options.find((o) => o.id === ans?.choice);
    const open = isEditing(section, q.id);
    const moneyValue = ans?.value ?? q.moneyDefault ?? "";
    const prefillValue = ans?.value ?? q.prefill?.value ?? "";

    if (!open) {
      return (
        <button
          key={q.id}
          type="button"
          onClick={() => setEditing({ section, id: q.id })}
          className="group flex flex-col items-start gap-0.5 rounded-card border border-stroke-subtle bg-white px-3 py-2 text-left transition-colors hover:border-deep-black"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-gray-2">
            {q.chipLabel}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-medium leading-none text-deep-black">
            {q.chipValue(ans)}
            <Pencil className="size-3 text-gray-2 group-hover:text-deep-black" />
          </span>
        </button>
      );
    }

    return (
      <motion.div
        key={q.id}
        layout
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-card border border-deep-black bg-ghost-white p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-gray-2">
            {q.chipLabel}
          </span>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="rounded-md bg-deep-black px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-80"
          >
            Done
          </button>
        </div>

        <p className="mt-2 text-sm font-medium text-deep-black">
          {q.lead}
          {q.highlight ? <span className="text-violet"> {q.highlight}</span> : null}
        </p>

        {q.prefill ? (
          <div className="mt-3">
            <MiniMoney
              value={prefillValue}
              onChange={(v) => setQuestion(section, q.id, { value: v })}
              onSubmit={() => setEditing(null)}
              badge={q.prefill.badge}
            />
          </div>
        ) : null}

        <div className="mt-3 flex flex-col gap-2">
          {q.options.map((o) => (
            <MiniOption
              key={o.id}
              label={o.label}
              selected={ans?.choice === o.id}
              onClick={() => handleSelect(section, q, o.id)}
            />
          ))}
        </div>

        {selectedOption?.reveal === "money" ? (
          <div className="mt-3">
            <MiniMoney
              value={moneyValue}
              onChange={(v) => setQuestion(section, q.id, { value: v })}
              onSubmit={() => setEditing(null)}
              badge={selectedOption.badge}
              helper={selectedOption.helper}
            />
          </div>
        ) : null}

        {selectedOption?.reveal === "detail" ? <SpendingDetail /> : null}

        {selectedOption?.reveal === "placeholder" ? (
          <p className="mt-3 rounded-lg bg-deep-black px-4 py-3 text-xs text-white/70">
            We&rsquo;ll help you work this out later in the plan.
          </p>
        ) : null}
      </motion.div>
    );
  };

  return (
    <AppShell
      fill
      sidebar={{
        planBadge: { label: "Updated", tone: "success" },
        detailsBadges: [{ label: "Required 70%", tone: "warning" }],
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
          Here&rsquo;s everything so far.{" "}
          <span className="text-violet">Confirm or tweak any detail.</span>
        </h1>
        <p className="mt-3 max-w-[620px] text-sm tracking-[-0.28px] text-black/75">
          Tap any item to edit it right here. When it all looks right, continue
          to your goals.
        </p>

        <div className="scrollbar-slim mt-6 min-h-0 flex-1 overflow-y-auto pr-3">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-2">
              Future income
            </h2>
            <div className="mt-3 flex flex-wrap items-start gap-2.5">
              <AnimatePresence initial={false}>
                {INCOME_QUESTIONS.map((q) => renderItem("income", q))}
              </AnimatePresence>
            </div>
          </section>

          <section className="mt-7">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-2">
              Retirement spending
            </h2>
            <div className="mt-3 flex flex-wrap items-start gap-2.5">
              <AnimatePresence initial={false}>
                {SPENDING_QUESTIONS.map((q) => renderItem("spending", q))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-stroke-subtle pt-4">
          <span className="text-sm text-gray-text">All details captured</span>
          <Button variant="blue" size="md" onClick={goNext}>
            Looks good, continue
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
