"use client";

import { AnimatePresence, Reorder, motion } from "motion/react";
import { Check } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { DetailsShell } from "@/components/prototypes/details/DetailsShell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  DETAILS_BUCKETS,
  DETAILS_GOAL_BY_ID,
  DETAILS_GOAL_CARDS,
  detailsBucketForIndex,
  detailsBucketMeta,
  type DetailsBucket,
  type DetailsGoalCard,
} from "@/lib/detailsGoals";

/**
 * Goals details page (frames 979-33247 + 979-33374). Ports the Card Sort
 * structure (chooser, importance buckets, drag-to-reorder timeline, confirm)
 * with Details-flow-only data + a brighter-purple/grey importance scheme, bound
 * to the shared details.goals so the sidebar Goals accordion reflects it.
 */
export function GoalsDetailsScreen() {
  const { answers, setDetails } = useFlow();
  const { order, confirmed } = answers.details.goals;

  const setOrder = (next: string[]) =>
    setDetails({ goals: { order: next, confirmed } });
  const setConfirmed = (value: boolean) =>
    setDetails({ goals: { order, confirmed: value } });

  const placedCount = order.length;
  const current =
    placedCount < DETAILS_GOAL_CARDS.length
      ? DETAILS_GOAL_CARDS[placedCount]
      : null;
  const done = current === null;

  const place = (bucket: DetailsBucket) => {
    if (!current) return;
    const id = current.id;
    const at =
      bucket === "low"
        ? 0
        : bucket === "medium"
          ? Math.floor(order.length / 2)
          : order.length;
    const next = [...order];
    next.splice(at, 0, id);
    setOrder(next);
  };

  const startOver = () => setDetails({ goals: { order: [], confirmed: false } });

  return (
    <DetailsShell>
      <div className="mt-3 flex items-start justify-between gap-6">
        <motion.div
          className="max-w-[640px]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black sm:text-[30px]">
            Sort your priorities
          </h1>
          <p className="mt-2 text-sm leading-snug text-black/70">
            For each goal, choose how much it matters. We drop it onto your
            timeline, then you can drag the card left or right to fine-tune the
            order. You&apos;ll see the confirmed ranking on the left sidebar.
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

      {/* Chooser */}
      <div className="mt-3 flex min-h-[236px] flex-col items-center justify-center">
        <AnimatePresence mode="popLayout">
          {current ? (
            <motion.div
              key={current.id}
              className="w-full max-w-[260px]"
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 150, scale: 0.85 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <ChooserCard card={current} />
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {DETAILS_BUCKETS.map((b) => (
                  <BucketButton
                    key={b.id}
                    label={b.label}
                    color={b.color}
                    onClick={() => place(b.id)}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-center text-[12px] text-gray-2">
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
              <p className="text-base font-semibold text-deep-black">
                All sorted
              </p>
              <p className="max-w-[360px] text-sm text-gray-2">
                Drag any card along the timeline below to fine-tune where it
                sits, then confirm.
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={startOver}
                className="mt-2"
              >
                Start over
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timeline */}
      <div className="mt-2 flex w-full flex-1 flex-col pb-6">
        <div className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.1em]">
          <span className="text-gray-2">Low priority</span>
          <span className="text-violet">High priority</span>
        </div>

        <div className="relative mt-2 min-h-[182px] rounded-card border border-stroke-subtle bg-white px-4 py-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-1/2 flex -translate-y-1/2 items-center"
          >
            <span className="size-0 shrink-0 border-y-[5px] border-r-[7px] border-y-transparent border-r-gray-2/40" />
            <span
              className="h-[3px] flex-1 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #c3c8d0 0%, #9145c4 55%, #7f35b2 100%)",
                opacity: 0.8,
              }}
            />
            <span className="size-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-violet/70" />
          </div>

          {order.length === 0 ? (
            <p className="relative text-center text-sm text-gray-2">
              Cards you sort will land here.
            </p>
          ) : (
            <Reorder.Group
              axis="x"
              values={order}
              onReorder={setOrder}
              className="relative flex flex-nowrap items-stretch justify-center gap-2"
            >
              {order.map((id, index) => {
                const card = DETAILS_GOAL_BY_ID[id];
                if (!card) return null;
                const bucket = detailsBucketForIndex(index, order.length);
                return (
                  <TimelineCard key={id} id={id} card={card} bucket={bucket} />
                );
              })}
            </Reorder.Group>
          )}
        </div>
      </div>
    </DetailsShell>
  );
}

/** The single, prominent card shown in the chooser. */
function ChooserCard({ card }: { card: DetailsGoalCard }) {
  const Icon = card.icon;
  return (
    <div className="flex h-[236px] w-full flex-col overflow-hidden rounded-card border border-violet/25 bg-gradient-to-br from-violet/[0.12] via-white to-white px-6 py-6 shadow-[0_8px_22px_-16px_rgba(127,53,178,0.5)]">
      <span
        className="grid size-14 shrink-0 place-items-center rounded-2xl bg-violet text-white shadow-[0_10px_22px_-8px_rgba(127,53,178,0.75)]"
        aria-hidden
      >
        <Icon className="size-7" strokeWidth={2.1} />
      </span>
      <div className="mt-auto flex min-w-0 flex-col">
        <h2 className="text-[22px] font-bold leading-[1.15] tracking-[-0.01em] text-deep-black">
          {card.title}
        </h2>
        <p className="mt-2.5 text-[14px] leading-snug text-gray-1">
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

/** A placed, horizontally draggable card sitting on the timeline. */
function TimelineCard({
  id,
  card,
  bucket,
}: {
  id: string;
  card: DetailsGoalCard;
  bucket: DetailsBucket;
}) {
  const meta = detailsBucketMeta(bucket);
  return (
    <Reorder.Item
      value={id}
      initial={{ opacity: 0, y: -28, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileDrag={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative z-[1] flex h-[148px] min-w-0 flex-1 basis-0 max-w-[124px] cursor-grab touch-none select-none flex-col rounded-card border bg-white px-2 py-2.5 shadow-[0_2px_8px_rgba(16,24,32,0.06)] active:cursor-grabbing",
      )}
      style={{ borderColor: `${meta.color}59` }}
    >
      <div className="flex items-center justify-end">
        <span
          className="size-2 rounded-full"
          style={{ background: meta.color }}
          aria-hidden
        />
      </div>
      <span className="mt-1.5 line-clamp-5 text-[12px] font-medium leading-tight text-deep-black">
        {card.title}
      </span>
      <span
        className="mt-auto pt-2 text-[10px] font-semibold uppercase tracking-[0.04em]"
        style={{ color: meta.color }}
      >
        {meta.label}
      </span>
    </Reorder.Item>
  );
}
