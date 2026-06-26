"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useFlow } from "@/components/flow/FlowProvider";
import { useEnterToContinue } from "@/components/flow/useEnterToContinue";
import { AppShell } from "@/components/chrome/AppShell";
import { DetailsSidebar } from "@/components/chrome/DetailsSidebar";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { SectionQuestion } from "@/components/narrative/SectionQuestion";
import { EditMadlibFieldModal } from "@/components/narrative/EditMadlibFieldModal";
import {
  PriorityRankFlow,
  priorityCardsFromRanking,
  type PriorityRankResult,
} from "@/components/interactions/PriorityRankFlow";
import {
  narrativeProgress,
  narrativeSidebarItems,
} from "@/components/narrative/sidebarItems";
import { isFilled, isValid } from "@/lib/narrativeValidation";
import {
  madlibFieldById,
  sampleValueFor,
  type MadlibField,
} from "@/lib/narrative";
import type { AnswerMap } from "@/lib/types";
import {
  SECTIONS,
  isPartComplete,
  sectionProgress,
  visiblePartFields,
  type SectionDef,
  type SectionKey,
} from "@/lib/sections";

/**
 * Experience-path (`hybrid-quick`) section screen. The non-goals sections
 * (About You / Income / Spending) render as a single progressively-revealed,
 * auto-scrolling form: one base-linear question per block stacks in a scrollable
 * column, the next question fades in once the current one is answered, and an
 * explicit footer Continue advances once every question is complete. Goals keeps
 * its focused pick → rank → more flow (the rank interaction needs the full
 * height) and ends on a Continue into the outlook.
 *
 * Keyed per-section by the caller so navigating between sections remounts the
 * component and resets its reveal state cleanly — no setState during render.
 */
export function SectionScrollScreen({ section }: { section: SectionKey }) {
  return section === "goals" ? (
    <GoalsSection />
  ) : (
    <StackedSection section={section} />
  );
}

/** A field counts as "done" for reveal/completion once valid (optionals pass). */
function fieldComplete(field: MadlibField, about: AnswerMap): boolean {
  return Boolean(field.optional) || (isFilled(field, about) && isValid(field, about));
}

/** One base-linear question rendered in a light card for stacked separation. */
function QuestionCard({
  field,
  about,
  setAbout,
}: {
  field: MadlibField;
  about: AnswerMap;
  setAbout: (id: string, value: string) => void;
}) {
  return (
    <div className="rounded-field bg-ghost-white p-5 sm:p-6">
      <SectionQuestion
        field={field}
        value={about[field.id]?.value ?? field.default ?? ""}
        onChange={(v) => setAbout(field.id, v)}
        error={isFilled(field, about) && !isValid(field, about)}
        compact
      />
    </div>
  );
}

/** Shared chrome: sidebar, back, pinned progress + header, then the body. */
function SectionFrame({
  def,
  progressPct,
  about,
  children,
  footer,
}: {
  def: SectionDef;
  progressPct: number;
  about: AnswerMap;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const router = useRouter();
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const editingField = editingFieldId
    ? madlibFieldById(editingFieldId)
    : undefined;

  const { aboutItems, incomeItems, spendingItems, goalsItems } =
    narrativeSidebarItems(about);

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
          <BackButton onClick={() => router.back()} label="Back" size={36} />
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

        <div className="mt-9 shrink-0">
          <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-deep-black">
            {def.name}
          </h1>
          <p className="mt-0.5 max-w-[560px] text-base font-medium text-deep-black">
            {def.title}
          </p>
          <p className="mt-1 max-w-[560px] text-sm leading-snug text-gray-text">
            {def.subtitle}
          </p>
        </div>

        {children}

        {footer}
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

/** Smoothly bring the latest-revealed block to the top of the scroll column. */
function useRevealScroll(
  shownCount: number,
  lastKey: string | null,
  scrollRef: React.RefObject<HTMLDivElement | null>,
  refs: React.MutableRefObject<Record<string, HTMLDivElement | null>>,
) {
  const mountedRef = useRef(false);
  const prevCountRef = useRef(shownCount);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevCountRef.current = shownCount;
      return;
    }
    if (shownCount > prevCountRef.current) {
      const el = lastKey ? refs.current[lastKey] : null;
      const container = scrollRef.current;
      if (el && container) {
        requestAnimationFrame(() => {
          const top =
            container.scrollTop +
            (el.getBoundingClientRect().top -
              container.getBoundingClientRect().top) -
            8;
          container.scrollTo({ top, behavior: "smooth" });
        });
      }
    }
    prevCountRef.current = shownCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownCount]);
}

/** Prototype shortcut: Shift+Enter fills every visible field in the section. */
function useSampleFill(def: SectionDef, about: AnswerMap, setAbout: (id: string, v: string) => void) {
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
}

/**
 * About You / Income / Spending: one progressively-revealed, scrollable stack of
 * base-linear questions. Reveal count is derived from completion (first
 * unanswered question + 1) and only ever grows, so conditional questions (e.g.
 * breakdown=Yes adding the tax-advantaged / after-tax amounts) reveal in without
 * flicker. An explicit footer Continue advances once every question is answered.
 */
function StackedSection({ section }: { section: SectionKey }) {
  const { answers, setAbout, goNext } = useFlow();
  const about = answers.about;
  const def = SECTIONS[section];

  const fields = useMemo(
    () => def.parts.flatMap((part) => visiblePartFields(part, about)),
    [def, about],
  );
  const firstIncomplete = useMemo(() => {
    const i = fields.findIndex((f) => !fieldComplete(f, about));
    return i === -1 ? fields.length : i;
  }, [fields, about]);
  const sectionComplete = fields.length > 0 && firstIncomplete >= fields.length;

  const shownCount = Math.min(fields.length, Math.max(firstIncomplete + 1, 1));
  const shown = fields.slice(0, shownCount);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useRevealScroll(
    shownCount,
    shown[shown.length - 1]?.id ?? null,
    scrollRef,
    fieldRefs,
  );
  useSampleFill(def, about, setAbout);

  const progressPct = Math.round(sectionProgress(def, about) * 100);

  // Enter advances only once every question is answered — the exact condition
  // gating the footer Continue (`disabled={!sectionComplete}`).
  useEnterToContinue(sectionComplete, goNext);

  const footer = (
    <div className="mt-4 flex shrink-0 items-center justify-end gap-4 pt-2">
      <Button
        variant="primary"
        size="md"
        onClick={goNext}
        disabled={!sectionComplete}
        className="disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
      </Button>
    </div>
  );

  return (
    <SectionFrame
      def={def}
      progressPct={progressPct}
      about={about}
      footer={footer}
    >
      <div
        ref={scrollRef}
        className="scrollbar-slim -mx-2 mt-4 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-2 pb-6"
      >
        <AnimatePresence initial={false}>
          {shown.map((field) => (
            <motion.div
              key={field.id}
              ref={(el) => {
                fieldRefs.current[field.id] = el;
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <QuestionCard field={field} about={about} setAbout={setAbout} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </SectionFrame>
  );
}

type GoalStep =
  | { kind: "field"; field: MadlibField }
  | { kind: "rank" };

const goalStepKey = (s: GoalStep) => (s.kind === "rank" ? "rank" : s.field.id);

/**
 * Goals: one progressively-revealed scroll column (matching the other sections)
 * — the goal-picker questions, then the swipe/sort/rank interaction, then the
 * extra detail questions. Each block reveals once the previous is satisfied and
 * auto-scrolls into focus, but earlier blocks stay in the scroll so the user can
 * scroll up to revisit them. An explicit Continue enters the outlook.
 */
function GoalsSection() {
  const { answers, setAbout, setAnswers, goTo } = useFlow();
  const about = answers.about;
  const def = SECTIONS.goals;
  const pickPart = def.parts[0];
  const morePart = def.parts[1];
  const ranked = answers.goalRanking.length > 0;

  const steps = useMemo<GoalStep[]>(() => {
    const pick = visiblePartFields(pickPart, about).map(
      (field): GoalStep => ({ kind: "field", field }),
    );
    const more = visiblePartFields(morePart, about).map(
      (field): GoalStep => ({ kind: "field", field }),
    );
    return [...pick, { kind: "rank" }, ...more];
  }, [pickPart, morePart, about]);

  const stepDone = (s: GoalStep) =>
    s.kind === "rank" ? ranked : fieldComplete(s.field, about);
  const firstIncomplete = steps.findIndex((s) => !stepDone(s));
  const shownCount =
    firstIncomplete === -1
      ? steps.length
      : Math.min(steps.length, firstIncomplete + 1);
  const shown = steps.slice(0, shownCount);

  const scrollRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useRevealScroll(
    shownCount,
    shown[shown.length - 1] ? goalStepKey(shown[shown.length - 1]) : null,
    scrollRef,
    blockRefs,
  );
  useSampleFill(def, about, setAbout);

  const handleRankDone = (result: PriorityRankResult) => {
    setAnswers({
      goalRanking: result.ranking,
      goalCards: priorityCardsFromRanking(result.ranking),
      goalVerdicts: result.decisions,
    });
  };

  const sectionComplete =
    isPartComplete(pickPart, about) && isPartComplete(morePart, about) && ranked;
  const progressPct = Math.round(
    ((sectionProgress(def, about) + (ranked ? 1 : 0)) / 2) * 100,
  );

  // The rank is the active step while it's the latest-revealed block and not yet
  // committed. We then lock it into the full content height (it owns its own
  // commit button) and hide the page footer Continue to avoid two competing
  // bottom-right buttons; the footer returns once ranking commits and the
  // "more" questions reveal.
  const lastShown = shown[shown.length - 1];
  const rankActive = lastShown?.kind === "rank" && !ranked;

  // Enter enters the outlook only once goals are picked, detailed and ranked —
  // the same condition gating the footer Continue (`disabled={!sectionComplete}`).
  // While the rank is active it commits itself, so Enter stays disabled there.
  useEnterToContinue(sectionComplete && !rankActive, () => goTo("outlook"));

  const footer = (
    <div className="mt-4 flex shrink-0 items-center justify-end gap-4 pt-2">
      <Button
        variant="primary"
        size="md"
        onClick={() => goTo("outlook")}
        disabled={!sectionComplete}
        className="disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
      </Button>
    </div>
  );

  return (
    <SectionFrame
      def={def}
      progressPct={progressPct}
      about={about}
      footer={rankActive ? undefined : footer}
    >
      {rankActive ? (
        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
          <div className="shrink-0">
            <h2 className="text-lg font-semibold tracking-[-0.01em] text-deep-black">
              Rank your priorities
            </h2>
            <p className="max-w-[560px] text-[13px] leading-snug text-gray-text">
              Swipe each priority, sort what&rsquo;s essential or nice to have,
              then rank your keepers.
            </p>
          </div>
          <div className="flex min-h-0 w-full flex-1 flex-col rounded-field bg-ghost-white p-5 sm:p-6">
            <PriorityRankFlow fit roomy onDone={handleRankDone} />
          </div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="scrollbar-slim -mx-2 mt-4 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-2 pb-6"
        >
          <AnimatePresence initial={false}>
            {shown.map((step) => (
              <motion.div
                key={goalStepKey(step)}
                ref={(el) => {
                  blockRefs.current[goalStepKey(step)] = el;
                }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {step.kind === "rank" ? (
                  // In the stack the rank is always already committed (the active,
                  // uncommitted rank renders focused above), so show a compact
                  // read-only recap with a re-rank affordance instead of the full
                  // interaction — which keeps the stack short and avoids
                  // re-mounting the swipe deck.
                  <div className="flex flex-col gap-3 rounded-field bg-ghost-white p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-0.5">
                        <h2 className="text-lg font-semibold tracking-[-0.01em] text-deep-black">
                          Your ranked priorities
                        </h2>
                        <p className="text-[13px] leading-snug text-gray-text">
                          Most important first.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAnswers({
                            goalRanking: [],
                            goalCards: [],
                            goalVerdicts: {},
                          })
                        }
                        className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-violet transition-colors hover:bg-violet/10"
                      >
                        Re-rank
                      </button>
                    </div>
                    <ol className="flex flex-col gap-1.5">
                      {answers.goalCards.map((card, i) => (
                        <li
                          key={card.id}
                          className="flex items-center gap-3 rounded-xl border border-stroke-subtle bg-white px-3 py-2"
                        >
                          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-violet/10 text-xs font-semibold tabular-nums text-violet">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium leading-tight text-deep-black">
                            {card.label}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <QuestionCard
                    field={step.field}
                    about={about}
                    setAbout={setAbout}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </SectionFrame>
  );
}
