"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  Reorder,
  useAnimationControls,
  type PanInfo,
} from "motion/react";
import { CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import {
  CARD_GRADIENT,
  SIGNATURE_GOALS,
  SIGNATURE_GOAL_BY_ID,
  SIGNATURE_GOAL_COUNT,
  type SignatureGoal,
} from "@/lib/signatureGoals";
import { SignatureShell, SIG_DEMO_CLEAR_EVENT } from "./SignatureShell";
import { SignatureDetailsSidebar } from "./SignatureDetailsSidebar";
import { SignatureInfoCard } from "./SignatureInfoCard";
import { SectionHeading } from "./SectionHeading";
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

  // Hidden demo shortcut: return the blueprint to its empty/initial state —
  // reuses the "Reset axis" logic plus clears the interaction flags so the
  // onboarding hint returns. SSR-safe — listener added on the client only.
  useEffect(() => {
    const clear = () => {
      resetAxis();
      setReordering(false);
      setHasInteracted(false);
    };
    window.addEventListener(SIG_DEMO_CLEAR_EVENT, clear);
    return () => window.removeEventListener(SIG_DEMO_CLEAR_EVENT, clear);
  }, []);

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
          <p className="text-xs text-title-ink">
            {complete
              ? "Any changes to your details will immediately be reflected in your personalized outlook."
              : "Your personalized outlook will update once we have more details in each category."}
          </p>
        ),
        right: (
          <ViewOutlookButton
            active={complete}
            onClick={complete ? () => goTo("sig-outlook-loading") : undefined}
          />
        ),
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

/** A gray outline until the sort is complete, then an active black CTA with a
 *  leading status dot (Figma 2165:32588 · complete frame). Shape/motion are kept
 *  in lockstep with the canonical `NavPill` rounded variant (h-8 · rounded-lg ·
 *  px-3 · deep-black · animated arrow) so this details-screen CTA reads the same
 *  as the Outlook sub-bar CTA — it just adds the gated disabled state + the
 *  mandarin status dot that NavPill doesn't carry. When complete it becomes
 *  clickable and advances into the personalized outlook. */
function ViewOutlookButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      disabled={!active}
      whileHover={active ? { y: -1 } : undefined}
      whileTap={active ? { scale: 0.96 } : undefined}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`group inline-flex h-8 max-w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm tracking-[0.14px] transition-colors ${
        active
          ? "cursor-pointer bg-deep-black font-medium text-white hover:bg-black"
          : "cursor-default border border-gray-2 font-normal text-gray-2"
      }`}
    >
      {active ? (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={SIG_SPRING_SNAPPY}
          className="size-1.5 shrink-0 rounded-full bg-mandarin"
          aria-hidden
        />
      ) : null}
      <span className="min-w-0 truncate">View updated outlook</span>
      <span
        aria-hidden
        className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
      >
        →
      </span>
    </motion.button>
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
              <span className="min-w-0 truncate text-sm font-medium leading-6 text-title-ink">
                {goal.shortLabel}
              </span>
            </motion.div>
          ))}
          {extra > 0 ? (
            <span className="pl-0.5 text-sm font-medium leading-6 text-title-ink">
              + {extra} more
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header card (opaque white, violet accent + shimmer info cards)      */
/* ------------------------------------------------------------------ */

function HeaderCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: SIG_EASE }}
      className="flex shrink-0 flex-col gap-6 rounded-card bg-white p-6 sm:p-8"
    >
      <SectionHeading>Your retirement goals</SectionHeading>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <SignatureInfoCard
          iconSrc="/signature/icon-plan.svg"
          title="What you need to do"
        />
        <SignatureInfoCard
          iconSrc="/signature/icon-info.svg"
          title="How this affects your retirement plan"
        />
      </div>
    </motion.div>
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
      className="relative flex min-h-[420px] shrink-0 flex-col overflow-hidden rounded-card border border-stroke-subtle bg-white"
    >
      {/* Header row: least ← | counter | → most important */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
        <span className="shrink-0 text-sm font-semibold tracking-[0.16px] text-title-ink sm:text-base">
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
        <span className="shrink-0 text-sm font-semibold tracking-[0.16px] text-title-ink sm:text-base">
          Most important →
        </span>
      </div>

      {/* Axis band with the placed-card row on top of it. */}
      <div className="relative mt-4 shrink-0 px-4 sm:mt-6 sm:px-6 lg:px-8">
        {/* Dashed axis strip. Fades away once all seven are placed — the Figma
            completion frame (1964:22089) shows the sorted cards on a clean board
            with no dashed guide. */}
        <motion.div
          aria-hidden
          animate={{ opacity: complete ? 0 : 1 }}
          transition={{ duration: 0.35, ease: SIG_EASE }}
          className="pointer-events-none absolute inset-x-4 top-1/2 h-[92px] -translate-y-1/2 rounded-card border border-black/50 border-dashed sm:inset-x-6 sm:h-[104px] lg:inset-x-8"
        />

        {/* Placed cards: draggable-to-reorder along x. The empty-state ghost slot
            sits on the axis as the first drop target, with the onboarding path
            curving up to it from the deck (Figma 1952:20978). */}
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

      {/* Lower stage: the deck (while sorting) or the completion/reorder note.
          While sorting the stage is tall enough to hold the full deck below the
          axis without overlap or clipping (Figma 1954:21837: deck sits ~13px
          below the cards, ~36px above the board edge). When complete the stage
          is shorter and the check + two lines + Reset pill are vertically
          centered below the cards (Figma 1964:22089). */}
      <div
        className={`relative flex flex-1 flex-col items-center justify-center px-4 ${
          complete
            ? "min-h-[184px] gap-8 py-4"
            : "min-h-[248px] py-4 sm:min-h-[264px]"
        }`}
      >
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
    <div className="pointer-events-none absolute left-1/2 top-0 h-[220px] w-[168px] -translate-x-1/2 sm:h-[240px] sm:w-[200px]">
      {/* Backer cards peeking out behind the active card. */}
      {backers.map((g, i) => (
        <div
          key={g.id}
          aria-hidden
          className="absolute inset-0 overflow-hidden rounded-card border border-white/[0.33] shadow-[0_24px_48px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.2)]"
          style={{
            background: CARD_GRADIENT,
            transform: `rotate(${(i + 1) * -5.2}deg)`,
            zIndex: -i - 1,
          }}
        >
          <CardTexture />
        </div>
      ))}

      {top ? (
        <DraggableDeckCard
          key={top.id}
          axisRef={axisRef}
          goal={top}
          onInteract={onInteract}
          onPlace={onPlace}
        />
      ) : null}

      {/* First-card affordance: the hand resting on the card, the dotted drag
          path curving up to the ghost slot, and the hint text. Rendered above
          the card (pointer-events-none) and fades out the moment the user first
          interacts. */}
      <AnimatePresence>{showHint ? <DragPathHint key="hint" /> : null}</AnimatePresence>
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
      className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-card border p-4 shadow-[0_24px_48px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.2)] sm:p-5"
      style={{ background: CARD_GRADIENT, borderColor: "rgba(255,255,255,0.33)" }}
    >
      <CardTexture />
      <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-black/[0.01] p-2 text-white">
        <Icon className="size-5" strokeWidth={2.1} />
      </span>
      <div className="relative flex flex-col items-start gap-2 text-left">
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
      className="relative flex h-[112px] w-full max-w-[126px] flex-col justify-between overflow-hidden rounded-[10px] border p-3 shadow-[0_15px_30px_rgba(0,0,0,0.15),0_2.5px_5px_rgba(0,0,0,0.2)] sm:h-[132px] sm:p-3.5 lg:h-[151px]"
      style={{ background: CARD_GRADIENT, borderColor: "rgba(255,255,255,0.33)" }}
    >
      <CardTexture />
      <span className="relative grid size-[21px] shrink-0 place-items-center rounded-full bg-black/[0.01] text-[12px] font-medium leading-none text-white sm:size-[26px] sm:text-[15px]">
        {rank}
      </span>
      <p className="relative line-clamp-5 text-[11px] font-semibold leading-[1.28] tracking-[-0.36px] text-white sm:line-clamp-6 sm:text-[13px] lg:text-[15px] lg:tracking-[-0.45px]">
        {goal.title}
      </p>
    </div>
  );
}

/** Faint film-grain texture overlaid on the purple cards — the Figma Key Card
 *  soft-light layer (imgKeyCard === banner-texture.png), scaled and offset per
 *  the frame so it reads as a subtle sheen over the gradient rather than a flat
 *  fill. */
function CardTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-soft-light opacity-50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/signature/banner-texture.png"
        alt=""
        className="absolute left-[-64%] top-0 h-full w-[244%] max-w-none object-cover"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state + notes                                                 */
/* ------------------------------------------------------------------ */

/** The faint ghost drop slot shown on the empty axis. Sits right-of-centre and
 *  floats just ABOVE the top dashed edge of the axis band (the first drop
 *  target, toward "most important"), rather than crossing the band, so it reads
 *  as a card hovering over the drop zone. The dotted path curves up to it from
 *  the deck, so the deck card, path and ghost slot read as one connected
 *  affordance (Figma 1952:20978).
 *
 *  The ghost card sits centred within the dashed drop zone and is opaque white
 *  with a higher z-index than the dashed strip, so it reads as a card *laid on
 *  top of* the drop zone — the dashed line is hidden behind it rather than
 *  showing through/over it. */
function EmptyAxisHint() {
  return (
    <div className="pointer-events-none absolute left-[calc(50%+128px)] top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 sm:left-[calc(50%+156px)]">
      <div
        aria-hidden
        className="h-[112px] w-[96px] rounded-card bg-white shadow-[0_24px_48px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.2)] sm:h-[120px] sm:w-[100px]"
        style={{ transform: "rotate(-5.87deg)" }}
      />
    </div>
  );
}

/** The onboarding affordance shown on the untouched first deck card: an open
 *  hand resting on the card's lower-right, a dotted path curving up to the
 *  ghost slot on the axis, and the "Drag the goal card…" hint (Figma
 *  1952:20978). Rendered as a pointer-events-none overlay above the deck card
 *  and fades out on first interaction.
 *
 *  The hand + hint text always show so the affordance is never missing; the
 *  dotted path + side-positioned text appear once the board is wide enough for
 *  them to sit beside the deck without spilling past the board (min-[900px]),
 *  otherwise the text collapses to a compact line above the deck. */
function DragPathHint() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: SIG_EASE }}
      className="pointer-events-none absolute inset-0 z-40"
      aria-hidden
    >
      {/* Open hand resting on the card's right edge (always visible). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/signature/goals-hand.svg"
        alt=""
        className="absolute left-[84%] top-[50%] size-9 -rotate-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] sm:left-[85%] sm:size-10"
      />

      {/* Dotted path curving up from the hand to the ghost slot (always on).
          Bottom stays anchored on the hand; the top reaches the ghost slot,
          which sits centred in the dashed drop zone, so the deck card → path →
          slot still read as one connected affordance. */}
      <div className="absolute left-[calc(100%+6px)] top-[-29px] h-[151px] w-[60px] sm:left-[calc(100%+7px)] sm:h-[162px] sm:w-[72px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/signature/goals-drag-path.svg"
          alt=""
          className="absolute inset-0 size-full opacity-70"
        />
      </div>

      {/* Hint text in the clear space to the right of the deck (Figma layout).
          Stays in that empty zone at every width — clear of the ghost slot, the
          deck, the dashed axis line and the dotted path — degrading by shrinking
          on narrow boards rather than collapsing onto the centered composition. */}
      <p className="absolute left-[calc(100%+74px)] top-[51px] w-[140px] text-right text-sm font-medium leading-[1.28] tracking-[-0.32px] text-title-ink sm:left-[calc(100%+76px)] sm:top-[56px] sm:w-[160px] sm:text-base xl:left-[calc(100%+88px)] xl:w-[165px]">
        Drag the goal card to a position on the axis
      </p>
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
      <p className="text-base font-semibold leading-[1.28] tracking-[0.16px] text-title-ink">
        Our financial planning model will use this current order
      </p>
      <p className="text-base leading-[1.28] tracking-[0.16px] text-title-ink">
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
      <Loader2 className="size-6 animate-spin text-title-ink" strokeWidth={2} />
      <p className="text-base font-semibold leading-[1.28] tracking-[0.16px] text-title-ink">
        Place the currently selected card to save a new order
      </p>
      <p className="text-base leading-[1.28] tracking-[0.16px] text-title-ink">
        Reorder your goals until you are satisfied
      </p>
    </motion.div>
  );
}
