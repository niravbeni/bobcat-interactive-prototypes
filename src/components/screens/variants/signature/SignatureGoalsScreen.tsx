"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  Reorder,
  useAnimationControls,
  type PanInfo,
} from "motion/react";
import { CheckCircle2, ChevronDown, ChevronLeft, Loader2 } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import {
  CARD_GRADIENT,
  SIGNATURE_GOALS,
  SIGNATURE_GOAL_BY_ID,
  SIGNATURE_GOAL_COUNT,
  type SignatureGoal,
} from "@/lib/signatureGoals";
import { SignatureShell } from "./SignatureShell";
import { SignatureDetailsSidebar } from "./SignatureDetailsSidebar";
import { SIG_EASE, SIG_SPRING, SIG_SPRING_SNAPPY } from "./shared";

/**
 * Signature flow "Goal Blueprint" — a card sort where the user drags a deck of
 * purple goal cards onto a least→most-important priority axis. Mirrors the
 * Assets layout (shell + shared sidebar + main column) and the four Figma
 * frames (empty → sorting → complete → reordering).
 */
export function SignatureGoalsScreen() {
  const { goTo } = useFlow();

  // Placed ids ordered left→right: index 0 = leftmost = least important;
  // the rightmost card is rank 1 (most important).
  const [placed, setPlaced] = useState<string[]>([]);
  // True while a placed card is being dragged to reorder.
  const [reordering, setReordering] = useState(false);
  // Set once the user first touches the front deck card (pick up / drag /
  // click). Onboarding hints show only before this and never return.
  const [hasInteracted, setHasInteracted] = useState(false);

  const count = placed.length;
  const complete = count === SIGNATURE_GOAL_COUNT;
  const deck = SIGNATURE_GOALS.filter((g) => !placed.includes(g.id));

  // Ranked most-important-first (rightmost first) for the sidebar order list.
  const ranked = [...placed].reverse().map((id) => SIGNATURE_GOAL_BY_ID[id]);

  const axisRef = useRef<HTMLDivElement>(null);

  const placeCard = (id: string, dropX: number) => {
    const rect = axisRef.current?.getBoundingClientRect();
    let index = count;
    if (rect && rect.width > 0) {
      const frac = Math.min(1, Math.max(0, (dropX - rect.left) / rect.width));
      index = Math.round(frac * count);
    }
    setPlaced((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, id);
      return next;
    });
  };

  const resetAxis = () => setPlaced([]);

  return (
    <SignatureShell
      mode="tabs"
      scroll={false}
      askPill={false}
      subBar={{
        left: (
          <button
            type="button"
            onClick={() => goTo("sig-home")}
            className="inline-flex items-center gap-1 text-sm font-medium text-deep-black transition-opacity hover:opacity-60"
          >
            <ChevronLeft className="size-4" strokeWidth={2.2} />
            Back to summary
          </button>
        ),
        center: (
          <p className="text-xs text-[#18181b]">
            {complete
              ? "Any changes to your details will immediately be reflected in your personalized outlook."
              : "Your personalized outlook will update once we have more details in each category."}
          </p>
        ),
        right: <ViewOutlookButton active={complete} />,
      }}
      bodyClassName="p-4"
    >
      <div className="flex min-h-0 w-full flex-1 gap-4">
        <SignatureDetailsSidebar
          selected="goals"
          selectedComplete={complete}
          onNavigate={(section) => {
            if (section === "assets") goTo("sig-assets");
            else if (section === "spending") goTo("sig-expense");
          }}
          subContent={<GoalOrderSubContent ranked={ranked} />}
        />

        <div className="scrollbar-slim mx-auto flex min-h-0 min-w-0 max-w-[1080px] flex-1 flex-col gap-4 overflow-y-auto pb-4 pr-1">
          <HeaderCard />

          <PriorityBoard
            axisRef={axisRef}
            placed={placed}
            deck={deck}
            count={count}
            complete={complete}
            reordering={reordering}
            hasInteracted={hasInteracted}
            onInteract={() => setHasInteracted(true)}
            onReorder={setPlaced}
            onReorderStart={() => setReordering(true)}
            onReorderEnd={() => setReordering(false)}
            onPlace={placeCard}
            onReset={resetAxis}
          />
        </div>
      </div>
    </SignatureShell>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-bar "View updated outlook" button                               */
/* ------------------------------------------------------------------ */

/** Inert on the sub-bar: a gray outline until the sort is complete, then an
 *  active black pill with a leading status dot (Figma 1964:22089). */
function ViewOutlookButton({ active }: { active: boolean }) {
  return (
    <motion.div
      layout
      transition={SIG_SPRING}
      className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-lg px-3 text-sm tracking-[0.14px] transition-colors ${
        active
          ? "bg-deep-black font-medium text-white"
          : "border border-gray-2 font-normal text-gray-2"
      }`}
    >
      {active ? (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={SIG_SPRING_SNAPPY}
          className="size-1.5 shrink-0 rounded-full bg-white"
          aria-hidden
        />
      ) : null}
      <span className="whitespace-nowrap">View updated outlook →</span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar "Goal order" sub-content                                    */
/* ------------------------------------------------------------------ */

function GoalOrderSubContent({ ranked }: { ranked: SignatureGoal[] }) {
  const complete = ranked.length === SIGNATURE_GOAL_COUNT;
  const top = ranked.slice(0, 3);
  const extra = ranked.length - top.length;

  return (
    <div className="flex flex-col gap-0.5 px-4 pb-2 pt-1">
      <span className="text-[10px] font-medium uppercase leading-[16.5px] tracking-[0.66px] text-[#8a8a93]">
        Goal order
      </span>
      {!complete ? (
        <span className="text-sm italic leading-6 text-gray-2">
          Pending completion
        </span>
      ) : (
        <div className="flex flex-col gap-0.5 pt-0.5">
          {top.map((goal, i) => (
            <motion.div
              key={goal.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SIG_SPRING, delay: i * 0.04 }}
              className="flex items-center gap-1.5"
            >
              <span className="grid size-4 shrink-0 place-items-center rounded-full bg-black text-[8px] font-bold leading-none text-white">
                {i + 1}
              </span>
              <span className="min-w-0 truncate text-sm font-medium leading-6 text-[#18181b]">
                {goal.shortLabel}
              </span>
            </motion.div>
          ))}
          {extra > 0 ? (
            <span className="pl-0.5 text-sm font-medium leading-6 text-[#18181b]">
              + {extra} more
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header card (translucent white, violet accent + shimmer info cards) */
/* ------------------------------------------------------------------ */

function HeaderCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: SIG_EASE }}
      className="flex shrink-0 flex-col gap-6 rounded-card bg-white/75 p-6 sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="h-[30px] w-[3px] shrink-0 rounded-full bg-violet"
        />
        <h1 className="text-[28px] font-medium leading-none tracking-[-0.64px] text-[#18181b] sm:text-[32px]">
          Your retirement goals
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <InfoCard
          iconSrc="/signature/icon-plan.svg"
          title="What you need to do"
        />
        <InfoCard
          iconSrc="/signature/icon-info.svg"
          title="How this affects your retirement plan"
        />
      </div>
    </motion.div>
  );
}

/** Collapsible info card — real title, shimmer-blocked body (per instruction).
 *  Mirrors the pattern from SignatureAssetsScreen. */
function InfoCard({ iconSrc, title }: { iconSrc: string; title: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div
      className={`relative flex items-start gap-[22px] overflow-hidden rounded-card bg-black/[0.02] px-5 transition-[padding] duration-300 ${
        open ? "py-5" : "py-2"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/signature/banner-texture.png"
          alt=""
          className="absolute left-0 top-[-120%] h-[340%] w-full max-w-none opacity-[0.06]"
        />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={iconSrc}
        alt=""
        aria-hidden
        className="relative size-12 shrink-0"
      />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`flex items-center justify-between gap-2 text-left transition-[min-height] duration-300 ${
            open ? "min-h-5" : "min-h-12"
          }`}
        >
          <span className="text-sm font-medium leading-[1.4] tracking-[-0.42px] text-black">
            {title}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25, ease: SIG_EASE }}
          >
            <ChevronDown className="size-[18px] text-gray-2" strokeWidth={2} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={SIG_SPRING}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1.5 pt-3" aria-hidden>
                <span className="h-2.5 w-full rounded-full skeleton-shimmer" />
                <span className="h-2.5 w-[92%] rounded-full skeleton-shimmer" />
                <span className="h-2.5 w-[60%] rounded-full skeleton-shimmer" />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Priority board                                                      */
/* ------------------------------------------------------------------ */

function PriorityBoard({
  axisRef,
  placed,
  deck,
  count,
  complete,
  reordering,
  hasInteracted,
  onInteract,
  onReorder,
  onReorderStart,
  onReorderEnd,
  onPlace,
  onReset,
}: {
  axisRef: React.RefObject<HTMLDivElement | null>;
  placed: string[];
  deck: SignatureGoal[];
  count: number;
  complete: boolean;
  reordering: boolean;
  hasInteracted: boolean;
  onInteract: () => void;
  onReorder: (order: string[]) => void;
  onReorderStart: () => void;
  onReorderEnd: () => void;
  onPlace: (id: string, dropX: number) => void;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: SIG_EASE, delay: 0.1 }}
      className="relative flex min-h-[420px] shrink-0 flex-1 flex-col overflow-hidden rounded-card border border-[#eee] bg-white"
    >
      {/* Header row: least ← | counter | → most important */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
        <span className="shrink-0 text-sm font-medium tracking-[0.16px] text-[#18181b] sm:text-base">
          ← Least important
        </span>
        <AnimatePresence mode="wait">
          {!complete ? (
            <motion.span
              key="counter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="min-w-0 truncate text-center text-[10px] font-medium uppercase tracking-[-0.32px] text-gray-2 sm:text-xs"
            >
              {count} of {SIGNATURE_GOAL_COUNT} goals sorted
            </motion.span>
          ) : (
            <span key="spacer" />
          )}
        </AnimatePresence>
        <span className="shrink-0 text-sm font-medium tracking-[0.16px] text-[#18181b] sm:text-base">
          Most important →
        </span>
      </div>

      {/* Axis band with the placed-card row on top of it. */}
      <div className="relative mt-4 shrink-0 px-4 sm:mt-6 sm:px-6 lg:px-8">
        {/* Dashed axis strip. */}
        <div className="pointer-events-none absolute inset-x-4 top-1/2 h-[92px] -translate-y-1/2 rounded-card border border-black/50 border-dashed sm:inset-x-6 sm:h-[104px] lg:inset-x-8" />

        {/* Placed cards: draggable-to-reorder along x. */}
        <Reorder.Group
          ref={axisRef}
          as="div"
          axis="x"
          values={placed}
          onReorder={onReorder}
          className="relative flex h-[148px] items-center justify-between gap-1 sm:h-[168px] sm:gap-2"
        >
          {placed.length === 0 ? <EmptyAxisHint /> : null}
          {placed.map((id, i) => {
            const goal = SIGNATURE_GOAL_BY_ID[id];
            const rank = placed.length - i;
            return (
              <Reorder.Item
                key={id}
                as="div"
                value={id}
                onDragStart={onReorderStart}
                onDragEnd={onReorderEnd}
                whileDrag={{ scale: 1.06, y: -14, rotate: -3, zIndex: 20 }}
                initial={{ opacity: 0, scale: 0.6, y: 44 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={SIG_SPRING}
                className="flex min-w-0 flex-1 cursor-grab justify-center active:cursor-grabbing"
              >
                <PlacedCard goal={goal} rank={rank} />
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      {/* Lower stage: the deck (while sorting) or the completion/reorder note. */}
      <div className="relative flex min-h-[168px] flex-1 flex-col items-center justify-center gap-4 px-4 py-4">
        {complete ? (
          // Complete: check + two lines + Reset axis stacked in normal flow so
          // they never overlap at any width (Figma 1964:22089).
          <>
            {reordering ? <ReorderNote /> : <CompletionNote />}
            <ResetAxisButton onReset={onReset} />
          </>
        ) : (
          <>
            <Deck
              axisRef={axisRef}
              deck={deck}
              count={count}
              hasInteracted={hasInteracted}
              onInteract={onInteract}
              onPlace={onPlace}
            />
            {/* While sorting the Reset pill sits bottom-left, clear of the deck
                (Figma 1954:21837). */}
            {count > 0 ? (
              <div className="absolute bottom-4 left-4 z-10 sm:bottom-5 sm:left-6 lg:left-8">
                <ResetAxisButton onReset={onReset} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </motion.div>
  );
}

/** Blue-outline "Reset axis" pill (returns every card to the deck). */
function ResetAxisButton({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={onReset}
      className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border-[0.75px] border-stratosphere bg-white px-3 text-sm tracking-[0.14px] text-stratosphere transition-colors hover:bg-stratosphere/5"
    >
      Reset axis
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Deck of draggable goal cards                                        */
/* ------------------------------------------------------------------ */

function Deck({
  axisRef,
  deck,
  count,
  hasInteracted,
  onInteract,
  onPlace,
}: {
  axisRef: React.RefObject<HTMLDivElement | null>;
  deck: SignatureGoal[];
  count: number;
  hasInteracted: boolean;
  onInteract: () => void;
  onPlace: (id: string, dropX: number) => void;
}) {
  const top = deck[0];
  const backers = deck.slice(1, 3);
  // Onboarding hint only before the first interaction, on the untouched deck.
  const showHint = count === 0 && !hasInteracted;

  return (
    <div className="pointer-events-none absolute bottom-0 left-1/2 h-[220px] w-[168px] -translate-x-1/2 translate-y-[12%] sm:h-[240px] sm:w-[200px]">
      {/* Backer cards peeking out behind the active card. */}
      {backers.map((g, i) => (
        <div
          key={g.id}
          aria-hidden
          className="absolute inset-0 rounded-card border border-white/[0.33] shadow-[0_24px_48px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.2)]"
          style={{
            background: CARD_GRADIENT,
            transform: `rotate(${(i + 1) * -5.2}deg)`,
            zIndex: -i - 1,
          }}
        />
      ))}

      {/* First-card affordance: the dotted drag path + hint. Sits behind the
          card and fades out smoothly the moment the user first interacts. */}
      <AnimatePresence>{showHint ? <DragPathHint key="hint" /> : null}</AnimatePresence>

      {top ? (
        <DraggableDeckCard
          key={top.id}
          axisRef={axisRef}
          goal={top}
          onInteract={onInteract}
          onPlace={onPlace}
        />
      ) : null}
    </div>
  );
}

function DraggableDeckCard({
  axisRef,
  goal,
  onInteract,
  onPlace,
}: {
  axisRef: React.RefObject<HTMLDivElement | null>;
  goal: SignatureGoal;
  onInteract: () => void;
  onPlace: (id: string, dropX: number) => void;
}) {
  const controls = useAnimationControls();

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const rect = axisRef.current?.getBoundingClientRect();
    // Placed if the pointer was released on or above the axis row.
    const dropped = rect ? info.point.y < rect.bottom + 72 : false;
    if (dropped) {
      onPlace(goal.id, info.point.x);
    } else {
      // Snap back to the deck.
      controls.start({ x: 0, y: 0, rotate: -0.2, transition: SIG_SPRING });
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.14}
      animate={controls}
      whileDrag={{ scale: 1.05, rotate: 0, zIndex: 30 }}
      onTapStart={onInteract}
      onPointerDown={onInteract}
      onDragStart={onInteract}
      onDragEnd={handleDragEnd}
      initial={{ rotate: -0.2 }}
      className="pointer-events-auto absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <DeckCardFace goal={goal} onInteract={onInteract} />
    </motion.div>
  );
}

/** The full-size deck card face: gradient, icon top-left, title, "Explain this". */
function DeckCardFace({
  goal,
  onInteract,
}: {
  goal: SignatureGoal;
  onInteract: () => void;
}) {
  const Icon = goal.icon;
  const [explained, setExplained] = useState(false);
  return (
    <div
      className="flex h-full w-full flex-col justify-between overflow-hidden rounded-card border p-4 shadow-[0_24px_48px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.2)] sm:p-5"
      style={{ background: CARD_GRADIENT, borderColor: "rgba(255,255,255,0.33)" }}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-black/[0.01] p-2 text-white">
        <Icon className="size-5" strokeWidth={2.1} />
      </span>
      <div className="flex flex-col items-start gap-2 text-left">
        <h2 className="max-w-[160px] text-xl font-normal leading-[1.4] tracking-[-0.72px] text-white sm:text-2xl">
          {goal.title}
        </h2>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInteract();
            setExplained((v) => !v);
          }}
          onPointerDownCapture={(e) => e.stopPropagation()}
          className="text-xs text-white underline underline-offset-2 transition-opacity hover:opacity-80"
        >
          Explain this
        </button>
        <AnimatePresence initial={false}>
          {explained ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: SIG_EASE }}
              className="flex flex-col gap-1.5 overflow-hidden pt-1"
              aria-hidden
            >
              {/* "Explain this" body is non-essential → shimmer. */}
              <span className="h-2 w-[150px] rounded-full bg-white/25" />
              <span className="h-2 w-[110px] rounded-full bg-white/25" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** The compact placed card on the axis: rank badge + title (no "Explain this").
 *  Fills its flex column up to the desktop max width and scales down on narrow
 *  viewports so all seven always fit the axis without overflow. */
function PlacedCard({ goal, rank }: { goal: SignatureGoal; rank: number }) {
  return (
    <div
      className="flex h-[110px] w-full max-w-[118px] flex-col justify-between overflow-hidden rounded-[12px] border p-2 shadow-[0_15px_30px_rgba(0,0,0,0.15),0_2.5px_5px_rgba(0,0,0,0.2)] sm:h-[132px] sm:p-3 lg:h-[150px]"
      style={{ background: CARD_GRADIENT, borderColor: "rgba(255,255,255,0.33)" }}
    >
      <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-black/[0.01] text-[13px] font-medium leading-none text-white sm:size-[26px] sm:text-[15px]">
        {rank}
      </span>
      <p className="line-clamp-5 text-[10px] font-semibold leading-[1.2] tracking-[-0.3px] text-white sm:line-clamp-6 sm:text-[12px] sm:leading-[1.28] sm:tracking-[-0.4px] lg:text-[13px]">
        {goal.title}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state + notes                                                 */
/* ------------------------------------------------------------------ */

/** The faint ghost drop slot shown on the empty axis. */
function EmptyAxisHint() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div
        aria-hidden
        className="h-[120px] w-[100px] rounded-card bg-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.2)]"
        style={{ transform: "rotate(-5.87deg)" }}
      />
    </div>
  );
}

/** The dotted curved path + hand + hint, floating off the first deck card.
 *  Fades in/out with AnimatePresence and collapses to a compact centered hint
 *  on narrow viewports (where there is no room for the path/hand off to the
 *  side). */
function DragPathHint() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: SIG_EASE }}
      className="pointer-events-none"
      aria-hidden
    >
      {/* Compact centered hint (no path/hand) below lg. */}
      <p className="absolute -top-11 left-1/2 w-[180px] -translate-x-1/2 text-center text-sm font-medium leading-[1.28] tracking-[-0.32px] text-black lg:hidden">
        Drag the goal card to a position on the axis
      </p>

      {/* Full path + hand + hint off to the right on lg+ (Figma layout). */}
      <div className="absolute right-[-172px] top-[-96px] hidden items-start gap-2 lg:flex">
        <div className="relative h-[120px] w-[64px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/signature/goals-drag-path.svg"
            alt=""
            className="absolute inset-0 size-full opacity-70"
          />
        </div>
        <p className="mt-[68px] w-[150px] text-base font-medium leading-[1.28] tracking-[-0.32px] text-black">
          Drag the goal card to a position on the axis
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/signature/goals-hand.svg"
          alt=""
          className="absolute left-[-40px] top-[104px] size-9 -rotate-12"
        />
      </div>
    </motion.div>
  );
}

/** All 7 placed: black check + the two confirmation lines. */
function CompletionNote() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: SIG_EASE }}
      className="flex w-[530px] max-w-full flex-col items-center gap-2 px-4 text-center"
    >
      <CheckCircle2 className="size-10 fill-black text-white" strokeWidth={2} />
      <p className="text-base font-semibold leading-[1.28] tracking-[0.16px] text-black">
        Our financial planning model will use this current order
      </p>
      <p className="text-base leading-[1.28] tracking-[0.16px] text-black">
        Reorder your goals until you are satisfied
      </p>
    </motion.div>
  );
}

/** Shown while a placed card is being dragged to a new position. */
function ReorderNote() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: SIG_EASE }}
      className="flex w-[530px] max-w-full flex-col items-center gap-2 px-4 text-center"
    >
      <Loader2 className="size-6 animate-spin text-black" strokeWidth={2} />
      <p className="text-base font-semibold leading-[1.28] tracking-[0.16px] text-black">
        Place the currently selected card to save a new order
      </p>
      <p className="text-base leading-[1.28] tracking-[0.16px] text-black">
        Reorder your goals until you are satisfied
      </p>
    </motion.div>
  );
}
