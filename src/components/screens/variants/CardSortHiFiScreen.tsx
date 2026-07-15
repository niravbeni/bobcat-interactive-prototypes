"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  X,
  type LucideIcon,
} from "lucide-react";
import { OutlookTopNav } from "@/components/prototypes/outlook/OutlookTopNav";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { cn } from "@/lib/cn";
import { DETAILS_GOAL_CARDS, type DetailsGoalCard } from "@/lib/detailsGoals";

type Phase = "intro" | "sort" | "rank";
type ExitDir = "yes" | "no" | "undo";

/**
 * How the active deck card should animate: `dir` drives the exit (Yes flies
 * right, No flies left, undo sinks back into the deck) and `entry` drives
 * where the next card comes from (the deck, or back in from the side the
 * undone card exited to).
 */
interface DeckMotion {
  dir: ExitDir;
  entry: "deck" | "right" | "left";
}

const CORAL = "#f6517f";
const BLUE = "#327fef";
const TOTAL = DETAILS_GOAL_CARDS.length;

/**
 * The "Key Card" gradient (Figma 1782-5946): predominantly deep purple with
 * the peach barely surfacing at the very bottom. Stops sit far apart so the
 * card doesn't read washed-out/peach.
 */
const CARD_GRADIENT = "linear-gradient(185deg, #742ca5 5%, #fbe0c1 195%)";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Card Sort (High Fidelity) — a standalone component prototype that re-skins the
 * goal card sort to the refined Figma. Internal phase machine
 * (intro → sort → rank) rendered inside a self-contained, details-style
 * chrome with the Goals section selected.
 */
export function CardSortHiFiScreen() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [answered, setAnswered] = useState<string[]>([]);
  const [matters, setMatters] = useState<Record<string, boolean>>({});
  const [deckMotion, setDeckMotion] = useState<DeckMotion>({
    dir: "yes",
    entry: "deck",
  });
  const [topGoalId, setTopGoalId] = useState<string | null>(null);

  const index = answered.length;
  const current = index < TOTAL ? DETAILS_GOAL_CARDS[index] : null;

  const candidates = useMemo(() => {
    const yes = DETAILS_GOAL_CARDS.filter((g) => matters[g.id]);
    return yes.length > 0 ? yes : DETAILS_GOAL_CARDS;
  }, [matters]);

  const topGoal = topGoalId
    ? DETAILS_GOAL_CARDS.find((g) => g.id === topGoalId) ?? null
    : null;

  // Advance to the rank phase once all nine goals are answered, after the last
  // card's exit animation has had a beat to play.
  useEffect(() => {
    if (phase !== "sort" || answered.length < TOTAL) return;
    const t = setTimeout(() => setPhase("rank"), 380);
    return () => clearTimeout(t);
  }, [phase, answered.length]);

  const resetSorting = () => {
    setAnswered([]);
    setMatters({});
    setDeckMotion({ dir: "undo", entry: "deck" });
  };

  /** Rank-screen reset: clear the pick and restart the sort from goal 1. */
  const resetFromRank = () => {
    resetSorting();
    setTopGoalId(null);
    setPhase("sort");
  };

  const answer = (keep: boolean) => {
    if (!current) return;
    const id = current.id;
    setDeckMotion({ dir: keep ? "yes" : "no", entry: "deck" });
    setAnswered((prev) => [...prev, id]);
    setMatters((prev) => ({ ...prev, [id]: keep }));
  };

  const undo = () => {
    if (answered.length === 0) return;
    const lastId = answered[answered.length - 1];
    // The restored card returns from the side it originally exited to.
    setDeckMotion({ dir: "undo", entry: matters[lastId] ? "right" : "left" });
    setAnswered((prev) => prev.slice(0, -1));
    setMatters((prev) => {
      const next = { ...prev };
      delete next[lastId];
      return next;
    });
  };

  const pickTop = (id: string) => {
    setTopGoalId(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="flex h-screen flex-col overflow-hidden bg-ghost-white"
    >
      <OutlookTopNav activeTab="Details" />

      <div className="flex min-h-0 w-full flex-1 gap-4 px-4 pb-4 pt-4">
        <StaticGoalsSidebar topGoal={topGoal} />

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-[#eeeeee] bg-white">
          {/* Top bar: phase-specific chrome pills, pinned above the scroll body. */}
          <div className="flex h-10 shrink-0 items-center justify-end gap-2 px-6 pt-6">
            {phase === "intro" ? (
              <ChromePill tone="gray" onClick={() => setPhase("rank")}>
                Skip
              </ChromePill>
            ) : null}
            {phase === "sort" ? (
              <>
                <ChromePill
                  tone="blue"
                  onClick={undo}
                  disabled={answered.length === 0}
                >
                  Undo
                </ChromePill>
                <ChromePill
                  tone="blue"
                  onClick={resetSorting}
                  disabled={answered.length === 0}
                >
                  Reset sorting
                </ChromePill>
              </>
            ) : null}
          </div>

          {/* Scroll body: content is vertically centered when there's room and
              scrolls (never squashes) on short viewports. */}
          <div className="scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-8 pt-2">
            <div className="mx-auto my-auto w-full max-w-[640px]">
              <AnimatePresence mode="wait">
                {phase === "intro" ? (
                  <IntroPhase key="intro" onStart={() => setPhase("sort")} />
                ) : phase === "sort" ? (
                  <SortPhase
                    key="sort"
                    current={current}
                    index={index}
                    deckMotion={deckMotion}
                    onAnswer={answer}
                  />
                ) : (
                  <RankPhase
                    key="rank"
                    candidates={candidates}
                    selectedId={topGoalId}
                    onPick={pickTop}
                    onReset={resetFromRank}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Intro                                                               */
/* ------------------------------------------------------------------ */

/**
 * Icons floated in the intro cluster. Positions/sizes/rotations map the Figma
 * cluster (7 solid violet circles, 32–54px, ±8–16° tilts) into a 300×170 box.
 */
const CLUSTER: {
  icon: LucideIcon;
  size: number;
  x: number;
  y: number;
  rotate: number;
  delay: number;
}[] = [
  { icon: DETAILS_GOAL_CARDS[8].icon, size: 40, x: 32, y: 131, rotate: -16.43, delay: 0 },
  { icon: DETAILS_GOAL_CARDS[2].icon, size: 54, x: 115, y: 131, rotate: 16.47, delay: 0.4 },
  { icon: DETAILS_GOAL_CARDS[3].icon, size: 54, x: 188, y: 79, rotate: 16.47, delay: 0.8 },
  { icon: DETAILS_GOAL_CARDS[0].icon, size: 32, x: 100, y: 64, rotate: -8.5, delay: 1.2 },
  { icon: DETAILS_GOAL_CARDS[5].icon, size: 32, x: 280, y: 96, rotate: -8.5, delay: 0.6 },
  { icon: DETAILS_GOAL_CARDS[4].icon, size: 40, x: 219, y: 147, rotate: -13.66, delay: 1.0 },
  { icon: DETAILS_GOAL_CARDS[7].icon, size: 40, x: 228, y: 30, rotate: -13.66, delay: 0.2 },
];

function IntroPhase({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex flex-col items-center text-center"
    >
      <div className="relative mx-auto h-[170px] w-[300px]">
        {CLUSTER.map((chip, i) => {
          const Icon = chip.icon;
          return (
            <motion.span
              key={i}
              aria-hidden
              className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-violet p-2 text-white drop-shadow-[0_8px_6px_rgba(0,0,0,0.2)]"
              style={{
                left: chip.x,
                top: chip.y,
                width: chip.size,
                height: chip.size,
                rotate: `${chip.rotate}deg`,
              }}
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 4 + i * 0.35,
                ease: "easeInOut",
                repeat: Infinity,
                delay: chip.delay,
              }}
            >
              <Icon size={Math.round(chip.size / 2)} strokeWidth={2.1} />
            </motion.span>
          );
        })}
      </div>

      <h1 className="mt-1 text-[28px] font-medium leading-[1.3] tracking-[-0.64px] text-[#18181b] sm:text-[32px]">
        What matters most to you in retirement?
      </h1>
      <p className="mt-3 max-w-[438px] text-[16px] leading-[1.49] tracking-[-0.32px] text-gray-1">
        We&apos;ll show you 9 possible goals. Tell us which ones matter to you
        and we&apos;ll build your plan around them.
      </p>

      <button
        type="button"
        onClick={onStart}
        className="mt-8 inline-flex h-12 w-64 items-center justify-center rounded-full bg-deep-black text-sm font-medium tracking-[0.14px] text-white transition-colors hover:bg-black"
      >
        Start
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Sort                                                                */
/* ------------------------------------------------------------------ */

/**
 * Deck-card motion: Yes exits clearly to the RIGHT, No clearly to the LEFT
 * (horizontal travel with a slight tilt, no vertical arc). An undone card
 * re-enters from the side it exited; the next card otherwise rises out of
 * the deck.
 */
const deckCardVariants = {
  enter: ({ entry }: DeckMotion) =>
    entry === "right"
      ? { opacity: 0, x: 320, y: 0, rotate: 10, scale: 0.96 }
      : entry === "left"
        ? { opacity: 0, x: -320, y: 0, rotate: -10, scale: 0.96 }
        : { opacity: 0, x: 0, y: 16, rotate: 0, scale: 0.94 },
  center: { opacity: 1, x: 0, y: 0, rotate: -0.15, scale: 1 },
  exit: ({ dir }: DeckMotion) =>
    dir === "yes"
      ? { opacity: 0, x: 320, y: 0, rotate: 10, scale: 0.96 }
      : dir === "no"
        ? { opacity: 0, x: -320, y: 0, rotate: -10, scale: 0.96 }
        : { opacity: 0, x: 0, y: 20, rotate: 0, scale: 0.94 },
};

function SortPhase({
  current,
  index,
  deckMotion,
  onAnswer,
}: {
  current: DetailsGoalCard | null;
  index: number;
  deckMotion: DeckMotion;
  onAnswer: (keep: boolean) => void;
}) {
  const remaining = TOTAL - index;
  const goalNumber = Math.min(index + 1, TOTAL);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex flex-col"
    >
      <h1 className="text-center text-2xl font-medium leading-tight tracking-[-0.48px] text-[#18181b]">
        Does this matter to you in retirement?
      </h1>

      {/* Card deck: a single fully-opaque backer card peeks out behind the
          active card via a stronger tilt (Figma: -4.48° behind -0.15°). */}
      <div className="relative mx-auto mt-16 h-[240px] w-[200px]">
        {remaining > 1 ? <DeckBacker /> : null}
        <AnimatePresence mode="popLayout" custom={deckMotion}>
          {current ? (
            <motion.div
              key={current.id}
              custom={deckMotion}
              className="absolute inset-0"
              variants={deckCardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.34, ease: EASE }}
            >
              <SortCard goal={current} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Verdict buttons: full-width within a narrow column. */}
      <div className="mx-auto mt-12 flex w-full max-w-[371px] flex-col gap-3">
        <VerdictButton
          color={BLUE}
          icon={Check}
          label="Yes, this matters to me"
          onClick={() => onAnswer(true)}
          disabled={!current}
        />
        <VerdictButton
          color={CORAL}
          icon={X}
          label="No, this doesn't matter to me"
          onClick={() => onAnswer(false)}
          disabled={!current}
        />
      </div>

      <p className="mt-14 text-center text-[16px] tracking-[-0.32px] text-black/50">
        Goal {goalNumber} of {TOTAL}
      </p>
    </motion.div>
  );
}

/** The card sitting directly behind the active card (same style, more tilt). */
function DeckBacker() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 rounded-[16px] border border-white/[0.33] shadow-[0_24px_48px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.2)]"
      style={{
        background: CARD_GRADIENT,
        transform: "rotate(-4.48deg)",
      }}
    />
  );
}

function SortCard({ goal }: { goal: DetailsGoalCard }) {
  const Icon = goal.icon;
  const [explained, setExplained] = useState(false);

  return (
    <div
      className="flex h-full w-full flex-col justify-between overflow-hidden rounded-[16px] border p-5 shadow-[0_24px_48px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.2)]"
      style={{
        background: CARD_GRADIENT,
        borderColor: "rgba(255,255,255,0.33)",
      }}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-black/[0.01] p-2 text-white">
        <Icon className="size-5" strokeWidth={2.1} />
      </span>

      <div className="flex flex-col items-start gap-2 text-left">
        <h2 className="max-w-[160px] text-2xl font-normal leading-[1.4] tracking-[-0.72px] text-white">
          {goal.title}
        </h2>
        <button
          type="button"
          onClick={() => setExplained((v) => !v)}
          className="text-xs text-white underline underline-offset-2 transition-opacity hover:opacity-80"
        >
          Explain this
        </button>
        <AnimatePresence initial={false}>
          {explained ? (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="overflow-hidden text-left text-[11px] leading-snug text-white/85"
            >
              <span className="block">{goal.description}</span>
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function VerdictButton({
  color,
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  color: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex h-[58px] w-full items-center justify-center gap-2 rounded-lg border bg-white text-sm font-medium tracking-[0.14px] transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
      style={{ borderColor: color, color }}
    >
      <Icon className="size-6" strokeWidth={2.2} />
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Rank                                                                */
/* ------------------------------------------------------------------ */

function RankPhase({
  candidates,
  selectedId,
  onPick,
  onReset,
}: {
  candidates: DetailsGoalCard[];
  /** The persistently selected top goal (lives in the parent). */
  selectedId: string | null;
  onPick: (id: string) => void;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="mx-auto flex w-full max-w-[480px] flex-col"
    >
      <div className="flex flex-col gap-0.5 pb-3">
        <h1 className="text-2xl font-normal leading-[1.28] tracking-[-0.48px] text-deep-black">
          Which goal matters most?
        </h1>
        <p className="text-xs leading-[1.4] text-gray-2">
          You told us these matter to you. Choose the one you&apos;d like your
          plan to focus on first.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {candidates.map((goal, i) => {
          const Icon = goal.icon;
          const active = selectedId === goal.id;
          return (
            <motion.li
              key={goal.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE, delay: i * 0.05 }}
            >
              <button
                type="button"
                onClick={() => onPick(goal.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-[14px] border-[0.5px] bg-black/[0.02] px-6 py-4 text-left transition-colors",
                  active ? "border-violet" : "border-[#eeeeee] hover:border-violet/40",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-violet p-2 text-white">
                    <Icon className="size-5" strokeWidth={2.1} />
                  </span>
                  <span className="min-w-0 text-xl font-normal leading-[1.4] tracking-[-0.32px] text-[#171717]">
                    {goal.title}
                  </span>
                </span>
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
                    active ? "border-violet" : "border-black/30",
                  )}
                >
                  {active ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="size-3 rounded-full bg-violet"
                    />
                  ) : null}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>

      <div className="mt-6 flex justify-center">
        <ChromePill tone="blue" onClick={onReset}>
          Reset sorting
        </ChromePill>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Chrome                                                              */
/* ------------------------------------------------------------------ */

function ChromePill({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone: "gray" | "blue";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-full border-[0.75px] bg-white px-3 text-sm font-normal tracking-[0.14px] transition-colors disabled:pointer-events-none disabled:opacity-40",
        tone === "blue"
          ? "border-stratosphere text-stratosphere hover:bg-stratosphere/5"
          : "border-gray-1 text-gray-1 hover:bg-ghost-white",
      )}
    >
      {children}
    </button>
  );
}

/**
 * A static, presentational Details-style sidebar with Goals selected. Modeled
 * visually on DetailsSidebar but intentionally inert — no flow-state binding
 * and no navigation — so the prototype can never route away.
 */
const SUGGESTIONS = [
  "What taxes apply in retirement?",
  "Tell me more about how annuities work",
  "What happens if I spend more than planned?",
];

function StaticGoalsSidebar({ topGoal }: { topGoal: DetailsGoalCard | null }) {
  return (
    <aside className="hidden w-[280px] shrink-0 flex-col overflow-hidden lg:flex 3xl:w-[320px]">
      <div className="scrollbar-slim flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-2">
        <CompletedPill label="About you" />
        <PillDivider />
        <CompletedPill label="Assets" />
        <PillDivider />
        <CompletedPill label="Income" />
        <PillDivider />
        <CompletedPill label="Spending" />

        {/* Static Safety Buffer rows under Spending (per the Figma frames). */}
        <div className="flex flex-col gap-px px-1 pb-2">
          <SafetyBufferRow />
          <SafetyBufferRow />
        </div>

        <PillDivider />
        <SelectedPill label="Goals" />

        {/* Goals expanded content: the picked #1 goal, or a placeholder. */}
        <div className="flex flex-col px-1">
          <div className="flex flex-col px-4 py-1">
            <span className="text-[10px] font-medium uppercase leading-[16.5px] tracking-[0.66px] text-[#8a8a93]">
              Top aim
            </span>
            <AnimatePresence mode="wait" initial={false}>
              {topGoal ? (
                <motion.span
                  key={topGoal.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  className="min-w-0 truncate text-sm font-medium leading-6 text-[#18181b]"
                >
                  {topGoal.title}
                </motion.span>
              ) : (
                <motion.span
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="text-sm leading-6 text-gray-2"
                >
                  Rank your goals to fill this in
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 pb-1">
        <div className="flex flex-col">
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              className="flex items-center justify-between gap-2 pl-4 pr-[15px] text-left transition-opacity hover:opacity-70"
            >
              <span className="min-w-0 text-[11px] leading-6 tracking-[-0.22px] text-gray-2">
                {q}
              </span>
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full bg-violet/60"
              />
            </button>
          ))}
        </div>

        <div className="flex h-10 items-center justify-between rounded-full bg-black/[0.01] py-2 pl-4 pr-2 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <span className="text-sm leading-6 text-gray-2">Ask a question</span>
          <AskSendIcon className="size-[30px]" />
        </div>
      </div>
    </aside>
  );
}

/** A thin full-width rule between sidebar section pills. */
function PillDivider() {
  return <span className="h-px w-full shrink-0 bg-[#ececee]" aria-hidden />;
}

/** A completed section: filled violet check-circle + regular-weight label. */
function CompletedPill({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[14px] px-4 py-2">
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <CheckCircle2
          className="size-5 shrink-0 fill-violet text-white"
          strokeWidth={2}
        />
        <span className="truncate text-base font-normal leading-5 tracking-[-0.5px] text-[#171717]">
          {label}
        </span>
      </span>
      <ChevronDown
        className="size-[18px] shrink-0 text-gray-2"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}

/** The selected section: subtle grey background + filled radio. */
function SelectedPill({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[12px] bg-black/[0.02] px-4 py-2">
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-[#171717]">
          <span className="size-2 rounded-full bg-[#171717]" />
        </span>
        <span className="truncate text-base font-normal leading-5 tracking-[-0.5px] text-[#171717]">
          {label}
        </span>
      </span>
      <ChevronDown
        className="size-[18px] shrink-0 text-gray-2"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}

/** One static "Safety Buffer / Medium - $30k" row (the Figma shows two). */
function SafetyBufferRow() {
  return (
    <div className="flex flex-col px-4 py-1">
      <span className="text-[10px] font-medium uppercase leading-[16.5px] tracking-[0.66px] text-[#8a8a93]">
        Safety Buffer
      </span>
      <span className="text-sm font-medium leading-6 text-[#18181b]">
        Medium - $30k
      </span>
    </div>
  );
}
