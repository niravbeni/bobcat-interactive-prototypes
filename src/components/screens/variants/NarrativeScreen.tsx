"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFlow } from "@/components/flow/FlowProvider";
import { useEnterToContinue } from "@/components/flow/useEnterToContinue";
import { AppShell } from "@/components/chrome/AppShell";
import { DetailsSidebar } from "@/components/chrome/DetailsSidebar";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { MadlibFieldView } from "@/components/narrative/MadlibField";
import { EditMadlibFieldModal } from "@/components/narrative/EditMadlibFieldModal";
import {
  narrativeProgress,
  narrativeSidebarItems,
} from "@/components/narrative/sidebarItems";
import { isFilled, isValid } from "@/lib/narrativeValidation";
import {
  NARRATIVE_PAGES,
  NARRATIVE_PAGE_STEPS,
  isLineVisible,
  madlibFieldById,
  sampleValueFor,
  type MadlibField,
  type MadlibLine,
  type MadlibPage,
} from "@/lib/narrative";
import { cn } from "@/lib/cn";
import type { StepId } from "@/lib/types";

export function NarrativeScreen({
  step,
  hideSidebar = false,
}: {
  step: StepId;
  hideSidebar?: boolean;
}) {
  const { answers, setAbout, goNext, goBack, variant } = useFlow();
  const router = useRouter();
  const page: MadlibPage = NARRATIVE_PAGES[step] ?? NARRATIVE_PAGES.details;

  // In the hybrid persona flows, Back follows real navigation history so it
  // returns to wherever you actually came from (the picker, an outlook, etc.)
  // rather than a fixed step.
  const isHybridPersona =
    variant === "hybrid-quick" || variant === "hybrid-guided";
  const handleBack = isHybridPersona ? () => router.back() : goBack;

  // Track which fields the user has interacted with (blurred) so we only show
  // errors after they've left an empty field. Reset on page change using the
  // render-time "adjust state when a prop changes" pattern.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [touchedStep, setTouchedStep] = useState(step);
  if (touchedStep !== step) {
    setTouchedStep(step);
    setTouched({});
  }

  // Progressive line reveal — ids of lines currently allowed to render. Reset on
  // page change; grown monotonically below so revealed lines never disappear.
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [revealStep, setRevealStep] = useState(step);
  if (revealStep !== step) {
    setRevealStep(step);
    setRevealed(new Set());
  }

  // Which mad-libs field is being edited from the side panel (if any).
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const editingField = editingFieldId
    ? madlibFieldById(editingFieldId)
    : undefined;

  const about = answers.about;
  const valueOf = (f: MadlibField): string =>
    about[f.id]?.value ?? f.default ?? "";

  const fieldsOfLine = (line: MadlibLine): MadlibField[] =>
    line.tokens.filter(
      (t): t is MadlibField => typeof t !== "string" && t.kind === "field",
    );

  // Transitive conditional visibility: a gated line hides when its trigger's own
  // line is hidden (e.g. turning "plan for partner" off also hides the partner
  // postcode, even though the stored postcode value lingers).
  const valueGetter = (id: string) => about[id]?.value;
  const lineComplete = (line: MadlibLine): boolean =>
    fieldsOfLine(line).every((f) => isFilled(f, about) && isValid(f, about));

  // Lines whose conditional trigger currently passes, in order.
  const condLines = page.lines.filter((line) =>
    isLineVisible(line, valueGetter),
  );

  // Stagger: reveal each leading complete line plus the first not-yet-complete
  // line. Union into the monotonic `revealed` set so editing an earlier answer
  // never makes later lines vanish.
  const desired = new Set<string>();
  for (const line of condLines) {
    desired.add(line.id);
    if (!lineComplete(line)) break;
  }
  let revealedNow = revealed;
  if ([...desired].some((id) => !revealed.has(id))) {
    revealedNow = new Set([...revealed, ...desired]);
    setRevealed(revealedNow);
  }

  // Only revealed + still-condition-visible lines render and gate Continue.
  const renderedLines = condLines.filter((line) => revealedNow.has(line.id));
  const visibleFields: MadlibField[] = renderedLines.flatMap(fieldsOfLine);

  // A visible field is "good" only when filled AND valid; the page is complete
  // when all condition-visible lines have been revealed and satisfied.
  const allRevealed = condLines.every((line) => revealedNow.has(line.id));
  const isComplete =
    allRevealed &&
    visibleFields.every((f) => isFilled(f, about) && isValid(f, about));

  // A field shows an error once touched (blurred) and either empty or invalid.
  const fieldError = (f: MadlibField): boolean =>
    !!touched[f.id] && (!isFilled(f, about) || !isValid(f, about));

  const hasVisibleError = visibleFields.some(fieldError);

  const markTouched = (id: string) =>
    setTouched((prev) => (prev[id] ? prev : { ...prev, [id]: true }));

  // Prototype shortcut: Shift+Enter auto-fills every visible field on the page
  // with sample data so you can skip through the flow while testing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || !e.shiftKey) return;
      e.preventDefault();
      for (const line of condLines) {
        for (const f of fieldsOfLine(line)) {
          setAbout(f.id, sampleValueFor(f));
          markTouched(f.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const handleContinue = () => {
    if (!isComplete) {
      // Surface errors on every still-empty field if somehow triggered.
      setTouched(
        Object.fromEntries(visibleFields.map((f) => [f.id, true] as const)),
      );
      return;
    }
    goNext();
  };

  // Enter advances only when the madlib page is complete — the same condition
  // gating the Continue button (`disabled={!isComplete}`).
  useEnterToContinue(isComplete, handleContinue);

  // Live side-panel rows, shared with the Outlook dashboard so both match.
  const {
    aboutItems: liveAboutItems,
    incomeItems: liveIncomeItems,
    spendingItems: liveSpendingItems,
    goalsItems: liveGoalsItems,
  } = narrativeSidebarItems(about);

  const pageIndex = NARRATIVE_PAGE_STEPS.indexOf(
    step as (typeof NARRATIVE_PAGE_STEPS)[number],
  );
  // The step dots map the four core narrative pages; hide them for the
  // standalone Profile page (hybrid quick draft), which isn't on that path.
  const showStepDots = !hideSidebar && pageIndex >= 0;

  return (
    <AppShell
      fill
      hideSidebar={hideSidebar}
      customSidebar={
        hideSidebar ? undefined : (
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
        )
      }
    >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <BackButton onClick={handleBack} label="Back" size={36} />

        {/* -mx-2 px-2 gives the inputs' focus/error rings room so the
            overflow-y container doesn't clip them on the left/right edges. */}
        <div
          className={cn(
            "scrollbar-slim mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto px-2",
            hideSidebar ? "mx-auto w-full max-w-[820px]" : "-mx-2",
          )}
        >
          <h1
            className={cn(
              "font-semibold leading-[1.15] tracking-[-0.01em] text-deep-black",
              hideSidebar ? "max-w-[760px] text-2xl" : "max-w-[560px] text-3xl",
            )}
          >
            {page.heading}
          </h1>

          {page.stub ? (
            <div className="mt-10 flex max-w-[520px] flex-col items-start gap-3 rounded-field border border-dashed border-stroke-subtle bg-ghost-white p-6">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-2">
                Coming soon
              </span>
              <p className="text-base leading-snug text-gray-1">
                This mad-libs section is still being designed. Continue to move
                through the flow.
              </p>
            </div>
          ) : (
            <div
              className={cn(
                "flex flex-col",
                hideSidebar ? "mt-6 gap-4" : "mt-10 gap-6",
              )}
            >
              {renderedLines.map((line) => (
                <div
                  key={line.id}
                  className={cn(
                    "madlib-line-in flex flex-wrap items-center gap-x-3 leading-snug tracking-[-0.01em] text-deep-black",
                    hideSidebar ? "gap-y-2 text-xl" : "gap-y-3 text-2xl",
                  )}
                >
                  {line.tokens.map((token, i) =>
                    typeof token === "string" ? (
                      <span key={i}>{token}</span>
                    ) : (
                      <MadlibFieldView
                        key={token.id}
                        field={token}
                        value={valueOf(token)}
                        onChange={(v) => setAbout(token.id, v)}
                        onBlur={() => markTouched(token.id)}
                        error={fieldError(token)}
                      />
                    ),
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Back · page dots · Continue */}
        <div className="mt-4 flex shrink-0 flex-col gap-2 pt-2">
          {hasVisibleError && !isComplete ? (
            <p className="text-right text-sm font-medium text-violet">
              Please fill in all fields correctly to continue.
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <div />

            {showStepDots ? (
              <div className="flex items-center gap-2">
                {NARRATIVE_PAGE_STEPS.map((s, i) => (
                  <span
                    key={s}
                    aria-hidden
                    className={cn(
                      "size-2 rounded-full transition-colors",
                      i === pageIndex ? "bg-deep-black" : "bg-divider",
                    )}
                  />
                ))}
              </div>
            ) : (
              <div />
            )}

            <Button
              variant="primary"
              size="md"
              onClick={handleContinue}
              disabled={!isComplete}
              className="disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
          </div>
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
