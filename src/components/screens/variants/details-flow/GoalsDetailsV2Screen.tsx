"use client";

import { AnimatePresence, Reorder, motion } from "motion/react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { DetailsShell } from "@/components/prototypes/details/DetailsShell";
import { InfoTarget } from "@/components/prototypes/details/DetailsInfoTip";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  DETAILS_BUCKETS,
  DETAILS_GOAL_BY_ID,
  DETAILS_GOAL_CARDS,
  detailsBucketMeta,
  detailsTopBucketForIndex,
  type DetailsBucket,
  type DetailsGoalCard,
} from "@/lib/detailsGoals";

/**
 * Details v2 gives the page header a lighter, origin-cued settle (a gentle
 * overshoot spring) so it feels like it arrives when navigating from the hub.
 * This screen is v2-only, so the spring is hardcoded here.
 */
const headerEnter = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: "spring" as const, stiffness: 320, damping: 24 },
};

/**
 * Goals details page, v2. Splits the single low → high timeline into TWO
 * stacked rows: a top timeline holding only Important + Very important cards
 * (laid out left → right), and a bottom shelf holding Not important cards.
 * Cards move between rows via a tap affordance (up-chevron promotes, down-
 * chevron demotes) rather than cross-timeline dragging; drag reorders within
 * a row. Bound to the shared details.goals: `order` is the top timeline and
 * `notImportant` is the bottom shelf, so the sidebar + completion logic (which
 * read `order`/`confirmed`) need no changes.
 */
export function GoalsDetailsV2Screen() {
  const { answers, setDetails } = useFlow();
  const { order, confirmed, notImportant = [] } = answers.details.goals;

  const writeGoals = (next: {
    order: string[];
    notImportant: string[];
    confirmed: boolean;
  }) => setDetails({ goals: next });

  const setOrder = (next: string[]) =>
    writeGoals({ order: next, notImportant, confirmed });
  const setNotImportant = (next: string[]) =>
    writeGoals({ order, notImportant: next, confirmed });
  const setConfirmed = (value: boolean) =>
    writeGoals({ order, notImportant, confirmed: value });

  const placedCount = order.length + notImportant.length;
  const current =
    placedCount < DETAILS_GOAL_CARDS.length
      ? DETAILS_GOAL_CARDS[placedCount]
      : null;
  const done = current === null;

  const place = (bucket: DetailsBucket) => {
    if (!current) return;
    const id = current.id;
    if (bucket === "low") {
      writeGoals({ order, notImportant: [...notImportant, id], confirmed });
    } else if (bucket === "medium") {
      // Important lands on the LEFT of the top timeline.
      writeGoals({ order: [id, ...order], notImportant, confirmed });
    } else {
      // Very important lands on the RIGHT of the top timeline.
      writeGoals({ order: [...order, id], notImportant, confirmed });
    }
  };

  /** Demote a top card down onto the Not-important shelf. */
  const demote = (id: string) =>
    writeGoals({
      order: order.filter((x) => x !== id),
      notImportant: [...notImportant, id],
      confirmed,
    });

  /** Promote a Not-important card up into the top timeline (as Important). */
  const promote = (id: string) =>
    writeGoals({
      order: [id, ...order],
      notImportant: notImportant.filter((x) => x !== id),
      confirmed,
    });

  const startOver = () =>
    setDetails({ goals: { order: [], notImportant: [], confirmed: false } });

  return (
    <DetailsShell>
      <div className="mt-3 flex items-start justify-between gap-6">
        <motion.div {...headerEnter} className="max-w-[640px]">
          <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black sm:text-[30px]">
            <InfoTarget tipId="goals">Sort your priorities</InfoTarget>
          </h1>
          <p className="mt-2 text-sm leading-snug text-black/70">
            For each goal, choose how much it matters. Not-important goals rest
            on the shelf below; the rest land on your timeline. Use the arrows to
            move a card between rows, and drag left or right to fine-tune.
          </p>
        </motion.div>

        <div className="flex shrink-0 items-center gap-3 pt-1">
          <AnimatePresence>
            {confirmed ? (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-success"
              >
                <Check className="size-4" strokeWidth={2.5} />
                Ranking saved
              </motion.span>
            ) : null}
          </AnimatePresence>
          <Button
            variant="primary"
            size="md"
            onClick={() => setConfirmed(true)}
            disabled={!done}
          >
            Confirm ranking
          </Button>
        </div>
      </div>

      {/* Sorting workspace: the chooser and both timelines are kept as one
          vertically-centered cluster with tight internal gaps so there's no
          dead space between the question card and the sort rows. */}
      <div className="mt-2 flex min-h-0 flex-1 flex-col justify-center gap-3">
        {/* Chooser */}
        <div className="flex flex-col items-center">
          <AnimatePresence mode="popLayout">
            {current ? (
              <motion.div
                key={current.id}
                className="w-full max-w-[320px]"
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 150, scale: 0.85 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <ChooserCard card={current} />
                <InfoTarget
                  tipId="goal-importance"
                  as="div"
                  interactive
                  className="mt-3 grid grid-cols-3 gap-2.5"
                >
                  {DETAILS_BUCKETS.map((b) => (
                    <BucketButton
                      key={b.id}
                      label={b.label}
                      color={b.color}
                      onClick={() => place(b.id)}
                    />
                  ))}
                </InfoTarget>
                <p className="mt-2 text-center text-[12px] text-gray-2">
                  {placedCount + 1} of {DETAILS_GOAL_CARDS.length}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="chooser-done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-2 text-center"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-violet/12 text-violet">
                  <Check className="size-6" strokeWidth={2.5} />
                </span>
                <p className="text-lg font-semibold text-deep-black">
                  All sorted
                </p>
                <p className="max-w-[360px] text-sm text-gray-2">
                  Fine-tune each row by dragging, or use the arrows to move a
                  card between the timeline and the shelf, then confirm.
                </p>
                <Button
                  variant="outline"
                  size="md"
                  onClick={startOver}
                  className="mt-1.5"
                >
                  Start over
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Top timeline: Important → Very important */}
        <div className="flex w-full flex-col">
          <div className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.1em]">
            <span style={{ color: detailsBucketMeta("medium").color }}>
              Important
            </span>
            <span style={{ color: detailsBucketMeta("high").color }}>
              Very important
            </span>
          </div>

          <div className="relative mt-1.5 min-h-[112px] rounded-card border border-stroke-subtle bg-white px-4 py-2">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-1/2 flex -translate-y-1/2 items-center"
            >
              <span className="size-0 shrink-0 border-y-[5px] border-r-[7px] border-y-transparent border-r-[#9145c4]/50" />
              <span
                className="h-[3px] flex-1 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, #9145c4 0%, #7f35b2 100%)",
                  opacity: 0.8,
                }}
              />
              <span className="size-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-violet/70" />
            </div>

            {order.length === 0 ? (
              <p className="pointer-events-none absolute inset-x-4 top-5 text-center text-sm text-gray-2">
                Important goals you sort will land here.
              </p>
            ) : (
              <Reorder.Group
                axis="x"
                values={order}
                onReorder={setOrder}
                className="relative flex flex-nowrap items-stretch justify-center gap-2"
              >
                <AnimatePresence initial={false}>
                  {order.map((id, index) => {
                    const card = DETAILS_GOAL_BY_ID[id];
                    if (!card) return null;
                    const bucket = detailsTopBucketForIndex(
                      index,
                      order.length,
                    );
                    return (
                      <TimelineCard
                        key={id}
                        id={id}
                        card={card}
                        bucket={bucket}
                        actionIcon="down"
                        onAction={() => demote(id)}
                      />
                    );
                  })}
                </AnimatePresence>
              </Reorder.Group>
            )}
          </div>
        </div>

        {/* Bottom shelf: Not important */}
        <div className="flex w-full flex-col">
          <div className="flex items-center px-1 text-[11px] font-semibold uppercase tracking-[0.1em]">
            <span className="text-gray-2">Not important</span>
          </div>

          <div className="relative mt-1.5 min-h-[112px] rounded-card border border-stroke-subtle bg-ghost-white/60 px-4 py-2">
            {notImportant.length === 0 ? (
              <p className="pointer-events-none absolute inset-x-4 top-5 text-center text-sm text-gray-2">
                Cards you mark not important will rest here.
              </p>
            ) : (
              <Reorder.Group
                axis="x"
                values={notImportant}
                onReorder={setNotImportant}
                className="relative flex flex-nowrap items-stretch justify-center gap-2"
              >
                <AnimatePresence initial={false}>
                  {notImportant.map((id) => {
                    const card = DETAILS_GOAL_BY_ID[id];
                    if (!card) return null;
                    return (
                      <ShelfCard
                        key={id}
                        id={id}
                        card={card}
                        onAction={() => promote(id)}
                      />
                    );
                  })}
                </AnimatePresence>
              </Reorder.Group>
            )}
          </div>
        </div>
      </div>
    </DetailsShell>
  );
}

/** The single, prominent card shown in the chooser. */
function ChooserCard({ card }: { card: DetailsGoalCard }) {
  const Icon = card.icon;
  return (
    <div className="flex min-h-[176px] w-full flex-col items-center justify-center gap-3.5 rounded-card border border-violet/25 bg-gradient-to-br from-violet/[0.12] via-white to-white px-6 py-6 text-center shadow-[0_8px_22px_-16px_rgba(127,53,178,0.5)]">
      <span
        className="grid size-14 shrink-0 place-items-center rounded-2xl bg-violet text-white shadow-[0_10px_22px_-8px_rgba(127,53,178,0.75)]"
        aria-hidden
      >
        <Icon className="size-7" strokeWidth={2.1} />
      </span>
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        <h2 className="text-[19px] font-bold leading-[1.2] tracking-[-0.01em] text-deep-black">
          {card.title}
        </h2>
        <p className="text-[13.5px] leading-snug text-gray-1">
          {card.description}
        </p>
      </div>
    </div>
  );
}

/** A tactile, tinted importance button; brighter purple = more important. */
function BucketButton({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-1.5 rounded-card border-2 px-2.5 py-3 text-center transition-all hover:-translate-y-0.5 active:scale-[0.97]"
      style={{
        borderColor: `${color}59`,
        background: `${color}14`,
      }}
    >
      <span
        className="size-2.5 rounded-full transition-transform group-hover:scale-125"
        style={{ background: color }}
        aria-hidden
      />
      <span
        className="text-[12.5px] font-semibold leading-tight"
        style={{ color }}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * A placed, horizontally draggable card on the TOP timeline. Carries an action
 * chevron (down = demote to the shelf) in its top corner; the chevron button
 * stops drag/propagation so a tap moves rather than reorders.
 */
function TimelineCard({
  id,
  card,
  bucket,
  actionIcon,
  onAction,
}: {
  id: string;
  card: DetailsGoalCard;
  bucket: DetailsBucket;
  actionIcon: "down" | "up";
  onAction: () => void;
}) {
  const meta = detailsBucketMeta(bucket);
  const ActionIcon = actionIcon === "down" ? ChevronDown : ChevronUp;
  return (
    <Reorder.Item
      value={id}
      initial={{ opacity: 0, y: -24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.85 }}
      whileDrag={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative z-[1] flex h-[104px] min-w-0 flex-1 basis-0 max-w-[132px] cursor-grab touch-none select-none flex-col overflow-hidden rounded-card border bg-white px-2.5 py-2 shadow-[0_4px_16px_-6px_rgba(16,24,32,0.18)] active:cursor-grabbing",
      )}
      style={{ borderColor: `${meta.color}59` }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={onAction}
          aria-label="Move to Not important"
          className="grid size-6 place-items-center rounded-full text-gray-2 transition-colors hover:bg-black/5 hover:text-deep-black"
        >
          <ActionIcon className="size-4" strokeWidth={2.2} />
        </button>
        <span
          className="size-2.5 rounded-full"
          style={{ background: meta.color }}
          aria-hidden
        />
      </div>
      <span className="mt-1 line-clamp-5 text-[10px] font-medium leading-[1.2] text-deep-black">
        {card.title}
      </span>
      <span
        className="mt-auto pt-1.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: meta.color }}
      >
        {meta.label}
      </span>
    </Reorder.Item>
  );
}

/**
 * A shorter, grey card on the BOTTOM shelf (always Not important). Carries an
 * up-chevron that promotes it into the top timeline.
 */
function ShelfCard({
  id,
  card,
  onAction,
}: {
  id: string;
  card: DetailsGoalCard;
  onAction: () => void;
}) {
  const meta = detailsBucketMeta("low");
  return (
    <Reorder.Item
      value={id}
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.85 }}
      whileDrag={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-[1] flex h-[104px] min-w-0 flex-1 basis-0 max-w-[132px] cursor-grab touch-none select-none flex-col overflow-hidden rounded-card border bg-white px-2.5 py-2 shadow-[0_4px_16px_-6px_rgba(16,24,32,0.18)] active:cursor-grabbing"
      style={{ borderColor: `${meta.color}59` }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={onAction}
          aria-label="Move to timeline"
          className="grid size-6 place-items-center rounded-full text-gray-2 transition-colors hover:bg-black/5 hover:text-deep-black"
        >
          <ChevronUp className="size-4" strokeWidth={2.2} />
        </button>
        <span
          className="size-2.5 rounded-full"
          style={{ background: meta.color }}
          aria-hidden
        />
      </div>
      <span className="mt-1 line-clamp-5 text-[10px] font-medium leading-[1.2] text-deep-black">
        {card.title}
      </span>
      <span
        className="mt-auto pt-1.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: meta.color }}
      >
        {meta.label}
      </span>
    </Reorder.Item>
  );
}
