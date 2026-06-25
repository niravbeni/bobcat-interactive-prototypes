"use client";

import { useState } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
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
import {
  NARRATIVE_PAGES,
  NARRATIVE_PAGE_STEPS,
  isLineVisible,
  madlibFieldById,
  type MadlibField,
  type MadlibLine,
  type MadlibPage,
} from "@/lib/narrative";
import { cn } from "@/lib/cn";
import type { StepId } from "@/lib/types";

export function NarrativeScreen({ step }: { step: StepId }) {
  const { answers, setAbout, goNext, goBack } = useFlow();
  const page: MadlibPage = NARRATIVE_PAGES[step] ?? NARRATIVE_PAGES.details;

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

  const isFilled = (f: MadlibField): boolean =>
    (about[f.id]?.value ?? "").trim().length > 0;

  // Per-field format/type validity. Empty values are handled by `isFilled`;
  // these rules judge a NON-EMPTY value. Rules live here (not in the schema)
  // so this stays decoupled from `lib/narrative.ts`.
  const ZIP_RE = /^\d{5}(-\d{4})?$/;
  const isValid = (f: MadlibField): boolean => {
    const raw = (about[f.id]?.value ?? "").trim();
    if (!raw) return true; // emptiness is the required check's job
    if (f.type === "number") {
      const n = Number(raw);
      return Number.isInteger(n) && n >= 18 && n <= 100;
    }
    if (f.type === "money") {
      const n = Number(raw.replace(/[^0-9.]/g, ""));
      return Number.isFinite(n) && n >= 0;
    }
    if (f.type === "text" && (f.id === "zip" || f.id === "partnerZip")) {
      return ZIP_RE.test(raw);
    }
    return true; // selects and generic text just need to be non-empty
  };

  // Transitive conditional visibility: a gated line hides when its trigger's own
  // line is hidden (e.g. turning "plan for partner" off also hides the partner
  // postcode, even though the stored postcode value lingers).
  const valueGetter = (id: string) => about[id]?.value;
  const lineComplete = (line: MadlibLine): boolean =>
    fieldsOfLine(line).every((f) => isFilled(f) && isValid(f));

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
    allRevealed && visibleFields.every((f) => isFilled(f) && isValid(f));

  // A field shows an error once touched (blurred) and either empty or invalid.
  const fieldError = (f: MadlibField): boolean =>
    !!touched[f.id] && (!isFilled(f) || !isValid(f));

  const hasVisibleError = visibleFields.some(fieldError);

  const markTouched = (id: string) =>
    setTouched((prev) => (prev[id] ? prev : { ...prev, [id]: true }));

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
        <BackButton onClick={goBack} label="Back" size={36} />

        {/* -mx-2 px-2 gives the inputs' focus/error rings room so the
            overflow-y container doesn't clip them on the left/right edges. */}
        <div className="scrollbar-slim -mx-2 mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
          <h1 className="max-w-[560px] text-3xl font-semibold leading-[1.15] tracking-[-0.01em] text-deep-black">
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
            <div className="mt-10 flex flex-col gap-6">
              {renderedLines.map((line) => (
                <div
                  key={line.id}
                  className="madlib-line-in flex flex-wrap items-center gap-x-3 gap-y-3 text-2xl leading-snug tracking-[-0.01em] text-deep-black"
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
            <Button variant="outline" size="md" onClick={goBack}>
              Back
            </Button>

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
