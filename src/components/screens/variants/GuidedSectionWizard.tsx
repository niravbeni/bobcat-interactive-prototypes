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
  narrativeProgress,
  narrativeSidebarItems,
} from "@/components/narrative/sidebarItems";
import { madlibFieldById, sampleValueFor } from "@/lib/narrative";
import { isFilled, isValid } from "@/lib/narrativeValidation";
import { SECTIONS, visiblePartFields, type SectionKey } from "@/lib/sections";
import type { StepId } from "@/lib/types";

/**
 * Guided-path (`hybrid-guided`) section wizard: shows ONE base-linear question
 * per screen and Continues question-by-question, writing to `answers.about` so
 * the live side panel + outlook stay in sync. The last question routes on to
 * {@link nextStep} (the income summary). Conditional questions (e.g. the
 * Social-Security amount, the per-account breakdown) insert/skip automatically.
 * Shift+Enter auto-fills the current section for testing.
 */
export function GuidedSectionWizard({
  section,
  nextStep,
}: {
  section: SectionKey;
  nextStep: StepId;
}) {
  const { answers, setAbout, goBack, goTo } = useFlow();
  const about = answers.about;
  const def = SECTIONS[section];

  // Flatten the section's currently-visible fields into a single question list;
  // recomputed each render so conditional fields appear/disappear correctly.
  const fields = useMemo(
    () => def.parts.flatMap((part) => visiblePartFields(part, about)),
    [def, about],
  );
  const maxIndex = Math.max(0, fields.length - 1);

  const [index, setIndex] = useState(0);
  const [trackedSection, setTrackedSection] = useState<SectionKey>(section);
  if (trackedSection !== section) {
    setTrackedSection(section);
    setIndex(0);
  }
  if (index > maxIndex) setIndex(maxIndex);
  const current = Math.min(index, maxIndex);
  const field = fields[current];

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const editingField = editingFieldId
    ? madlibFieldById(editingFieldId)
    : undefined;

  // The current question is satisfied when it's valid (optionals may be empty).
  const canContinue = !field
    ? true
    : isFilled(field, about)
      ? isValid(field, about)
      : Boolean(field.optional);

  const handleContinue = () => {
    if (!canContinue) return;
    if (current >= maxIndex) goTo(nextStep);
    else setIndex(current + 1);
  };

  const handleBack = () => {
    if (current > 0) setIndex(current - 1);
    else goBack();
  };

  // Enter advances only when the current question is satisfied — the exact
  // condition gating the Continue button (`disabled={!canContinue}`).
  useEnterToContinue(canContinue, handleContinue);

  // Prototype shortcut: Shift+Enter fills the whole section with sample data.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || !e.shiftKey) return;
      e.preventDefault();
      for (const part of def.parts) {
        for (const f of visiblePartFields(part, about)) {
          setAbout(f.id, sampleValueFor(f));
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const { aboutItems, incomeItems, spendingItems, goalsItems } =
    narrativeSidebarItems(about);

  const progressPct = Math.round(((current + 1) / Math.max(1, fields.length)) * 100);

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
          openSection={def.sidebar}
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

        <div className="scrollbar-slim -mx-2 mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
          {field ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${section}-${field.id}`}
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
                  field={field}
                  value={about[field.id]?.value ?? field.default ?? ""}
                  onChange={(v) => setAbout(field.id, v)}
                  onSubmit={handleContinue}
                  error={isFilled(field, about) && !isValid(field, about)}
                  compact
                />

                <div className="mt-2 flex flex-col items-start gap-2">
                  <Button
                    onClick={handleContinue}
                    disabled={!canContinue}
                    data-wizard-continue="true"
                  >
                    Continue
                  </Button>
                  {canContinue ? <EnterHint className="ml-4" /> : null}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <h1 className="mt-2 max-w-[640px] text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-deep-black">
              {def.title}
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
