"use client";

import { useEffect, useState } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { MandarinBadge } from "@/components/ui/MandarinBadge";
import { MoneyField } from "@/components/ui/MoneyField";
import { Bubble } from "@/components/chat/ChatUI";
import { SpendingDetail } from "@/components/flow/SpendingDetail";
import type { QuestionDef } from "@/lib/questions";
import type { SectionId } from "@/lib/types";

/**
 * Modal for editing a single income/spending question from the sidebar. Mirrors
 * the V2 chat-panel surface (rounded-field bg-card, BackButton close, dropdown
 * options) so editing feels like a quick detour inside the same flow rather
 * than a separate dialog system.
 */
export function EditQuestionModal({
  section,
  question,
  onClose,
}: {
  section: SectionId;
  question: QuestionDef;
  onClose: () => void;
}) {
  const { answers, setQuestion } = useFlow();
  const ans = answers[section][question.id];

  // Local drafts so Cancel discards changes. Save commits to FlowAnswers.
  const [choice, setChoice] = useState<string | undefined>(ans?.choice);
  const [value, setValue] = useState<string>(
    ans?.value ?? question.moneyDefault ?? question.prefill?.value ?? "",
  );

  const selectedOption = question.options.find((o) => o.id === choice);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSelect = (optionId: string) => {
    const opt = question.options.find((o) => o.id === optionId);
    setChoice(optionId);
    if (opt?.reveal === "money" && !value) {
      setValue(question.moneyDefault ?? "");
    }
  };

  const save = () => {
    if (!choice) {
      onClose();
      return;
    }
    setQuestion(section, question.id, { choice, value });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={question.chipLabel}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
    >
      <div
        className="absolute inset-0 bg-deep-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="scrollbar-slim relative z-10 flex max-h-full w-full max-w-[720px] flex-col overflow-hidden rounded-field bg-card p-6 shadow-[0_24px_64px_rgba(16,24,32,0.24)] xl:p-10">
        <div className="flex items-start justify-between gap-4">
          <BackButton onClick={onClose} label="Edit detail" size={36} />
          <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-2">
            {question.chipLabel}
          </span>
        </div>

        <div className="scrollbar-slim mt-6 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <Bubble role="bot">
            {question.lead}
            {question.highlight ? (
              <>
                {" "}
                <span className="text-violet">{question.highlight}</span>
              </>
            ) : null}
          </Bubble>

          {question.prefill ? (
            <div className="w-full max-w-sm self-start">
              <MoneyField
                value={value}
                onChange={setValue}
                onSubmit={save}
                trailing={
                  question.prefill.badge ? (
                    <MandarinBadge>{question.prefill.badge}</MandarinBadge>
                  ) : undefined
                }
              />
            </div>
          ) : null}

          <div className="grid w-fit grid-cols-1 self-start overflow-hidden rounded-card bg-white p-1">
            {question.options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => handleSelect(o.id)}
                className={`whitespace-nowrap rounded-lg px-4 py-3 text-left text-base transition-colors ${
                  choice === o.id
                    ? "bg-deep-black text-white"
                    : "text-deep-black hover:bg-divider/60"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {selectedOption?.reveal === "money" ? (
            <div className="w-full max-w-sm self-start">
              <MoneyField
                value={value}
                onChange={setValue}
                onSubmit={save}
                trailing={
                  selectedOption.badge ? (
                    <MandarinBadge>{selectedOption.badge}</MandarinBadge>
                  ) : undefined
                }
                helper={selectedOption.helper}
              />
            </div>
          ) : null}

          {selectedOption?.reveal === "detail" ? <SpendingDetail /> : null}

          {selectedOption?.reveal === "placeholder" ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-card bg-deep-black px-6 py-8 text-center text-white">
              <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-white/40">
                Placeholder
              </p>
              <p className="text-base text-white/60">
                We&rsquo;ll help you work this out in the full plan.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill px-4 py-2 text-sm font-semibold text-deep-black transition-colors hover:bg-white/60"
          >
            Cancel
          </button>
          <Button variant="blue" size="md" onClick={save} disabled={!choice}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
