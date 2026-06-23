"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useFlow } from "@/components/flow/FlowProvider";
import { SpendingDetail } from "@/components/flow/SpendingDetail";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { EnterHint } from "@/components/ui/EnterHint";
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

  // When the user is looking at an input (money field / detailed breakdown),
  // keep Continue tucked just under it and left-aligned rather than pushed to
  // the far bottom-right.
  const nearInput =
    Boolean(q.prefill) ||
    selectedOption?.reveal === "money" ||
    selectedOption?.reveal === "detail";

  // The helper text under a money field already adds a line of spacing, so the
  // button can sit tight; without it, give the button a little more room so the
  // gap reads the same either way.
  const showsHelper =
    selectedOption?.reveal === "money" && Boolean(selectedOption.helper);
  const footerClass = nearInput
    ? `${showsHelper ? "mt-2" : "mt-5"} flex justify-start`
    : "mt-12 flex justify-end";

  const submitIfReady = () => {
    if (choice) handleContinue();
  };

  // Enter advances once a choice is made — works for plain option questions too,
  // not just the money fields. We skip text inputs (they handle their own Enter)
  // and the Continue button itself (its native click already advances).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (el?.dataset.wizardContinue) return;
      if (!choice) return;
      e.preventDefault();
      handleContinue();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, idx, section, total]);

  return (
    <div className="flex w-full flex-col">
      <BackButton onClick={handleBack} />

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-divider">
        <div
          className="h-full rounded-full bg-violet transition-[width] duration-300 ease-out"
          style={{ width: `${((idx + 1) / total) * 100}%` }}
        />
      </div>

      {/* The current question scrolls up and out while the next scrolls up into
          view, giving a sectioned long-form feel rather than an instant swap. */}
      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`${section}-${idx}`}
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -36 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col"
      >
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
          onSubmit={submitIfReady}
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
          onSubmit={submitIfReady}
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

        <div className={footerClass}>
          <div className="flex flex-col items-start gap-2">
            <Button
              onClick={handleContinue}
              disabled={!choice}
              data-wizard-continue="true"
            >
              Continue
            </Button>
            {choice ? <EnterHint className="ml-4" /> : null}
          </div>
        </div>
      </motion.div>
      </AnimatePresence>
    </div>
  );
}
