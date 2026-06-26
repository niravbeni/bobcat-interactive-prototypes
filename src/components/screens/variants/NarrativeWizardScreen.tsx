"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { DetailsSidebar } from "@/components/chrome/DetailsSidebar";
import { EditMadlibFieldModal } from "@/components/narrative/EditMadlibFieldModal";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { EnterHint } from "@/components/ui/EnterHint";
import { MoneyField } from "@/components/ui/MoneyField";
import { Option, OptionList } from "@/components/ui/Option";
import {
  narrativeProgress,
  narrativeSidebarItems,
} from "@/components/narrative/sidebarItems";
import { isFilled, isValid } from "@/lib/narrativeValidation";
import {
  NARRATIVE_PAGES,
  isLineVisible,
  madlibFieldById,
  sampleValueFor,
  type MadlibField,
  type MadlibLine,
  type MadlibPage,
} from "@/lib/narrative";

/** Money raw digits -> grouped display (e.g. "5000" -> "5,000"). */
function moneyDisplay(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits).toLocaleString("en-US") : "";
}

const fieldsOfLine = (line: MadlibLine): MadlibField[] =>
  line.tokens.filter(
    (t): t is MadlibField => typeof t !== "string" && t.kind === "field",
  );

/** Plain-string tokens of a line, joined into the question heading. */
const headingOf = (line: MadlibLine): string =>
  line.tokens
    .filter((t): t is string => typeof t === "string")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Renders a single narrative page (income or spending) as a linear, one-line-at-
 * a-time wizard in the base-flow chrome, while writing to the shared
 * `answers.about` store so the live side panel + outlook stay in sync.
 */
export function NarrativeWizardScreen({ step }: { step: string }) {
  const { answers, setAbout, goNext, goBack } = useFlow();
  const about = answers.about;
  const page: MadlibPage = NARRATIVE_PAGES[step] ?? NARRATIVE_PAGES.income;

  const valueOf = (f: MadlibField): string =>
    about[f.id]?.value ?? f.default ?? "";

  // Currently-visible lines, recomputed every render so conditional lines that a
  // select reveals slot into the sequence right after their trigger.
  const visibleLines = page.lines.filter((line) =>
    isLineVisible(line, (id) => about[id]?.value),
  );

  // Index into the visible list. Reset on page change, clamped if the visible
  // list shrinks (e.g. toggling a select hides a conditional line).
  const [index, setIndex] = useState(0);
  const [trackedStep, setTrackedStep] = useState(step);
  if (trackedStep !== step) {
    setTrackedStep(step);
    setIndex(0);
  }
  const maxIndex = Math.max(0, visibleLines.length - 1);
  if (index > maxIndex) setIndex(maxIndex);
  const current = Math.min(index, maxIndex);
  const line = visibleLines[current];

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const editingField = editingFieldId
    ? madlibFieldById(editingFieldId)
    : undefined;

  const lineComplete = (l: MadlibLine | undefined): boolean =>
    !!l && fieldsOfLine(l).every((f) => isFilled(f, about) && isValid(f, about));
  const canContinue = lineComplete(line);

  // Mirror the base flow: when the answer is a typed input (money/number/text),
  // tuck Continue just under it and left-aligned; for option lists, drop it lower
  // and to the right like QuestionWizard does.
  const nearInput = !!line && fieldsOfLine(line).some((f) => f.type !== "select");
  const footerClass = nearInput
    ? "mt-5 flex justify-start"
    : "mt-12 flex justify-end";

  const handleContinue = () => {
    if (!canContinue) return;
    if (current >= maxIndex) goNext();
    else setIndex(current + 1);
  };

  const handleBack = () => {
    if (current > 0) setIndex(current - 1);
    else goBack();
  };

  // Enter advances when the current line is satisfied. Text/money inputs handle
  // their own Enter (via onSubmit), so ignore key events originating in inputs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (el?.dataset.wizardContinue) return;
      if (!canContinue) return;
      e.preventDefault();
      handleContinue();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canContinue, current, maxIndex, step]);

  // Prototype shortcut: Shift+Enter fills every line on the page with sample
  // data and jumps to the last one so you can skip through while testing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || !e.shiftKey) return;
      e.preventDefault();
      visibleLines.forEach((l) =>
        fieldsOfLine(l).forEach((f) => setAbout(f.id, sampleValueFor(f))),
      );
      setIndex(Math.max(0, visibleLines.length - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const {
    aboutItems: liveAboutItems,
    incomeItems: liveIncomeItems,
    spendingItems: liveSpendingItems,
    goalsItems: liveGoalsItems,
  } = narrativeSidebarItems(about);

  const renderField = (f: MadlibField) => {
    if (f.type === "select") {
      return (
        <OptionList key={f.id} className="mt-4">
          {f.options?.map((o) => (
            <Option
              key={o.id}
              label={o.label}
              selected={valueOf(f) === o.id}
              onClick={() => setAbout(f.id, o.id)}
            />
          ))}
        </OptionList>
      );
    }
    if (f.type === "money") {
      return (
        <MoneyField
          key={f.id}
          className="mt-4"
          value={moneyDisplay(valueOf(f))}
          onChange={(v) => setAbout(f.id, v.replace(/[^0-9]/g, ""))}
          onSubmit={handleContinue}
        />
      );
    }
    const isNumber = f.type === "number";
    return (
      <input
        key={f.id}
        type="text"
        inputMode={isNumber ? "numeric" : "text"}
        value={valueOf(f)}
        placeholder={f.placeholder}
        onChange={(e) =>
          setAbout(
            f.id,
            isNumber ? e.target.value.replace(/[^0-9]/g, "") : e.target.value,
          )
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleContinue();
          }
        }}
        className="mt-4 h-20 w-full rounded-field border border-stroke-subtle bg-white px-6 text-2xl leading-[1.6] text-black outline-none transition-shadow placeholder:text-gray-text focus:ring-2 focus:ring-violet/40"
      />
    );
  };

  return (
    <AppShell
      fill
      customSidebar={
        <DetailsSidebar
          variant="chat"
          aboutItems={liveAboutItems}
          incomeItems={liveIncomeItems}
          spendingItems={liveSpendingItems}
          goalsItems={liveGoalsItems}
          onEditAbout={(id) => setEditingFieldId(id)}
          onEditMadlib={(id) => setEditingFieldId(id)}
          openSection={page.section}
          progress={narrativeProgress(about)}
        />
      }
    >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <BackButton onClick={handleBack} label="Back" size={36} />

        <div className="mt-4 h-1.5 w-full shrink-0 overflow-hidden rounded-full bg-divider">
          <div
            className="h-full rounded-full bg-violet transition-[width] duration-300 ease-out"
            style={{
              width: `${((current + 1) / Math.max(1, visibleLines.length)) * 100}%`,
            }}
          />
        </div>

        {/* -mx-2 px-2 gives the inputs' focus rings room so the overflow-y
            container doesn't clip them on the left/right edges. */}
        <div className="scrollbar-slim -mx-2 mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
          {line ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${step}-${line.id}`}
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -36 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col"
              >
                <h1 className="mt-2 max-w-[640px] text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-deep-black">
                  {headingOf(line)}
                </h1>
                {fieldsOfLine(line).map((f) => renderField(f))}

                <div className={footerClass}>
                  <div className="flex flex-col items-start gap-2">
                    <Button
                      onClick={handleContinue}
                      disabled={!canContinue}
                      data-wizard-continue="true"
                    >
                      Continue
                    </Button>
                    {canContinue ? <EnterHint className="ml-4" /> : null}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <h1 className="mt-2 max-w-[640px] text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-deep-black">
              {page.heading}
            </h1>
          )}
        </div>
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
