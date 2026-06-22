"use client";

import { useFlow } from "@/components/flow/FlowProvider";
import { SpendingDetail } from "@/components/flow/SpendingDetail";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { MandarinBadge } from "@/components/ui/MandarinBadge";
import { MoneyField } from "@/components/ui/MoneyField";
import { Option, OptionList } from "@/components/ui/Option";
import type { QuestionDef } from "@/lib/questions";
import type { SectionId } from "@/lib/types";

export function QuestionWizard({
  section,
  questions,
  onComplete,
  onExitBack,
}: {
  section: SectionId;
  questions: QuestionDef[];
  onComplete: () => void;
  onExitBack: () => void;
}) {
  const { answers, sectionIdx, setSectionIdx, setQuestion } = useFlow();

  const total = questions.length;
  const idx = Math.min(sectionIdx[section], total - 1);
  const q = questions[idx];
  const ans = answers[section][q.id];
  const choice = ans?.choice;
  const selectedOption = q.options.find((o) => o.id === choice);

  const handleSelect = (optionId: string) => {
    const opt = q.options.find((o) => o.id === optionId);
    const patch: { choice: string; value?: string } = { choice: optionId };
    if (opt?.reveal === "money" && !ans?.value) {
      patch.value = q.moneyDefault ?? "";
    }
    setQuestion(section, q.id, patch);
  };

  const handleContinue = () => {
    if (idx < total - 1) setSectionIdx(section, idx + 1);
    else onComplete();
  };

  const handleBack = () => {
    if (idx > 0) setSectionIdx(section, idx - 1);
    else onExitBack();
  };

  const moneyValue = ans?.value ?? q.moneyDefault ?? "";
  const prefillValue = ans?.value ?? q.prefill?.value ?? "";

  return (
    <div className="flex w-full flex-col">
      <div className="flex items-center justify-between gap-4">
        <BackButton onClick={handleBack} />
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-gray-2">
          {idx + 1} / {total}
        </span>
      </div>

      <div className="mt-3 flex gap-1.5">
        {questions.map((_, i) => (
          <span
            key={i}
            className={
              "h-1.5 flex-1 rounded-full " +
              (i <= idx ? "bg-violet" : "bg-divider")
            }
          />
        ))}
      </div>

      <h1 className="mt-10 max-w-[640px] text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-deep-black">
        {q.lead}
        {q.highlight ? (
          <>
            {" "}
            <span className="text-violet">{q.highlight}</span>
          </>
        ) : null}
      </h1>
      {q.subtitle ? (
        <p className="mt-3 text-sm tracking-[-0.28px] text-black/75">{q.subtitle}</p>
      ) : null}

      {q.prefill ? (
        <MoneyField
          className="mt-6"
          value={prefillValue}
          onChange={(v) => setQuestion(section, q.id, { value: v })}
          trailing={q.prefill.badge ? <MandarinBadge>{q.prefill.badge}</MandarinBadge> : undefined}
        />
      ) : null}

      <OptionList className="mt-4">
        {q.options.map((o) => (
          <Option
            key={o.id}
            label={o.label}
            selected={choice === o.id}
            onClick={() => handleSelect(o.id)}
          />
        ))}
      </OptionList>

      {selectedOption?.reveal === "money" ? (
        <MoneyField
          className="mt-4"
          value={moneyValue}
          onChange={(v) => setQuestion(section, q.id, { value: v })}
          trailing={selectedOption.badge ? <MandarinBadge>{selectedOption.badge}</MandarinBadge> : undefined}
          helper={selectedOption.helper}
        />
      ) : null}

      {selectedOption?.reveal === "detail" ? <SpendingDetail /> : null}

      {selectedOption?.reveal === "placeholder" ? (
        <div className="mt-4 flex min-h-[280px] flex-col items-center justify-center rounded-card bg-deep-black px-6 text-center text-white">
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-white/40">
            Placeholder
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.02em]">Placeholder</p>
          <p className="mt-3 max-w-md text-base text-white/50">
            We&rsquo;re still figuring out what this &ldquo;work it out&rdquo; step looks
            like. Click Continue to carry on with the questions.
          </p>
        </div>
      ) : null}

      <div className="mt-12 flex justify-end">
        <Button onClick={handleContinue} disabled={!choice}>
          Continue
        </Button>
      </div>
    </div>
  );
}
