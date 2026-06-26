"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, Check, GripVertical } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import {
  CardSwipe,
  VERDICTS,
  type SwipeResult,
  type SwipeVerdict,
} from "@/components/interactions/CardSwipe";
import { RETIREMENT_PRIORITIES, type Priority } from "@/lib/priorities";
import type { GoalCard } from "@/lib/types";

export interface PriorityRankResult {
  ranking: string[];
  decisions: Record<string, SwipeVerdict>;
}

/** Map a ranked id list to ordered preset goal cards (for the details menu). */
export function priorityCardsFromRanking(ranking: string[]): GoalCard[] {
  const byId = new Map(RETIREMENT_PRIORITIES.map((p) => [p.id, p]));
  return ranking
    .map((id) => byId.get(id))
    .filter((p): p is Priority => Boolean(p))
    .map((p) => ({ id: p.id, label: p.title, source: "preset" as const }));
}

type Phase = "swipe" | "sort" | "rank";
const PHASES: Phase[] = ["swipe", "sort", "rank"];
const PHASE_LABEL: Record<Phase, string> = {
  swipe: "Swipe",
  sort: "Sort",
  rank: "Rank",
};

/** Buckets laid out left → right along the sort line. */
const BUCKET_ORDER: SwipeVerdict[] = ["skip", "nice", "essential"];

/**
 * Build the rank list (essential then nice) from the sort decisions, preserving
 * any existing order so navigating back and forth doesn't reshuffle the user's
 * ranking.
 */
function keepersFrom(
  decisions: Record<string, SwipeVerdict>,
  prev: string[],
): string[] {
  const ordered = RETIREMENT_PRIORITIES.filter(
    (p) => decisions[p.id] === "essential",
  )
    .concat(RETIREMENT_PRIORITIES.filter((p) => decisions[p.id] === "nice"))
    .map((p) => p.id);
  const kept = prev.filter((id) => ordered.includes(id));
  const added = ordered.filter((id) => !kept.includes(id));
  return [...kept, ...added];
}

export function PriorityRankFlow({
  onDone,
  onEnterSort,
  onEnterRank,
  fit = false,
  roomy = false,
}: {
  onDone: (result: PriorityRankResult) => void;
  /** Fired once when the sort phase is first reached. */
  onEnterSort?: () => void;
  /** Fired once when the rank phase is first reached. */
  onEnterRank?: () => void;
  /**
   * Fill the available height instead of using the swipe deck's fixed height.
   * Used where the flow must fit a screen without adding scroll (details menu).
   */
  fit?: boolean;
  /**
   * Larger, more spaced sort chips / rank cards for full-page layouts (the
   * hybrid Goals step) vs. the compact sidebar/details-menu placement.
   */
  roomy?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("swipe");
  const [decisions, setDecisions] = useState<Record<string, SwipeVerdict>>({});
  const [ranking, setRanking] = useState<string[]>([]);
  const enteredSort = useRef(false);
  const enteredRank = useRef(false);

  const byId = useMemo(
    () => new Map(RETIREMENT_PRIORITIES.map((p) => [p.id, p])),
    [],
  );

  const swipeComplete = RETIREMENT_PRIORITIES.every((p) =>
    Boolean(decisions[p.id]),
  );

  const enterSort = () => {
    setPhase("sort");
    if (!enteredSort.current) {
      enteredSort.current = true;
      onEnterSort?.();
    }
  };

  const enterRank = () => {
    setRanking((prev) => keepersFrom(decisions, prev));
    setPhase("rank");
    if (!enteredRank.current) {
      enteredRank.current = true;
      onEnterRank?.();
    }
  };

  const handleSwipeComplete = (result: SwipeResult) => {
    setDecisions(result.decisions);
    enterSort();
  };

  const commit = () => {
    const skipped = RETIREMENT_PRIORITIES.filter(
      (p) => decisions[p.id] === "skip" || !decisions[p.id],
    ).map((p) => p.id);
    onDone({ ranking: [...ranking, ...skipped], decisions });
  };

  const canForward =
    phase === "swipe"
      ? swipeComplete
      : phase === "sort"
        ? true
        : ranking.length > 0;
  const goForward = () => {
    if (phase === "swipe") enterSort();
    else if (phase === "sort") enterRank();
    else commit();
  };

  const stepIndex = PHASES.indexOf(phase);

  return (
    <div
      className={cn(
        // In fit mode (details menu) the surrounding grey panel is the container,
        // so the flow itself is transparent. In the chat (non-fit) it's a white
        // card with a fixed height so it's the same size across all three phases.
        fit
          ? "flex h-full min-h-0 flex-col"
          : "flex h-[600px] flex-col rounded-card border border-stroke-subtle bg-white p-4 shadow-[0_1px_2px_rgba(16,24,32,0.06)]",
      )}
    >
      <div className="mb-3 flex shrink-0 items-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-2">
          Step {stepIndex + 1} of 3 · {PHASE_LABEL[phase]}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {phase === "swipe" ? (
          <div className="flex min-h-0 flex-1 flex-col justify-center">
            <CardSwipe
              items={RETIREMENT_PRIORITIES}
              showResults={false}
              onComplete={handleSwipeComplete}
              fit={fit}
            />
          </div>
        ) : (
          <>
            <div className="scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto pt-1">
              {/* Auto margins vertically center the cards when there's spare
                  room, but collapse so the content scrolls from the top if it
                  ever overflows the available height. */}
              <div className="my-auto w-full">
                {phase === "sort" ? (
                  <SortPhase
                    value={decisions}
                    byId={byId}
                    onChange={setDecisions}
                    roomy={roomy}
                  />
                ) : (
                  <RankPhase
                    byId={byId}
                    ranking={ranking}
                    onReorder={setRanking}
                    roomy={roomy}
                  />
                )}
              </div>
            </div>
            <div className="mt-8 flex shrink-0 justify-end">
              <Button
                variant={roomy ? "primary" : "blue"}
                size="md"
                onClick={goForward}
                disabled={!canForward}
                className="gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {phase === "rank" ? (
                  <>
                    Confirm ranking
                    <Check className="size-4" strokeWidth={2.4} />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="size-4" strokeWidth={2.4} />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SortPhase({
  value,
  byId,
  onChange,
  roomy = false,
}: {
  value: Record<string, SwipeVerdict>;
  byId: Map<string, Priority>;
  onChange: (next: Record<string, SwipeVerdict>) => void;
  roomy?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const buckets = useMemo(() => {
    const grouped: Record<SwipeVerdict, Priority[]> = {
      skip: [],
      nice: [],
      essential: [],
    };
    RETIREMENT_PRIORITIES.forEach((p) => {
      grouped[value[p.id] ?? "skip"].push(p);
    });
    return grouped;
  }, [value]);

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const verdict = over.id as SwipeVerdict;
    if (!BUCKET_ORDER.includes(verdict)) return;
    if (value[String(active.id)] === verdict) return;
    onChange({ ...value, [String(active.id)]: verdict });
  };

  const activeCard = activeId ? byId.get(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className={cn("relative grid grid-cols-3", roomy ? "gap-4" : "gap-2")}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[16.66%] top-[5px] h-px bg-stroke-subtle"
        />
        {BUCKET_ORDER.map((verdict) => (
          <BucketColumn
            key={verdict}
            verdict={verdict}
            cards={buckets[verdict]}
            activeId={activeId}
            roomy={roomy}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? (
          <SortChipContent
            priority={activeCard}
            verdict={value[activeCard.id] ?? "skip"}
            roomy={roomy}
            dragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function BucketColumn({
  verdict,
  cards,
  activeId,
  roomy = false,
}: {
  verdict: SwipeVerdict;
  cards: Priority[];
  activeId: string | null;
  roomy?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: verdict });
  const v = VERDICTS[verdict];

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="flex flex-col items-center gap-1">
        <span
          className="size-2.5 rounded-full ring-4 ring-white"
          style={{ background: v.color }}
          aria-hidden
        />
        <span
          className={cn(
            "text-center font-semibold leading-tight",
            roomy ? "text-xs" : "text-[11px]",
          )}
          style={{ color: v.color }}
        >
          {v.label}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex w-full flex-col rounded-card transition-colors",
          roomy ? "min-h-[110px] gap-1.5 p-1.5" : "min-h-[120px] gap-1.5 p-1.5",
          isOver ? "bg-violet/5" : "bg-transparent",
        )}
      >
        {cards.map((p) => (
          <SortChip
            key={p.id}
            priority={p}
            verdict={verdict}
            dimmed={p.id === activeId}
            roomy={roomy}
          />
        ))}
      </div>
    </div>
  );
}

function SortChip({
  priority,
  verdict,
  dimmed,
  roomy = false,
}: {
  priority: Priority;
  verdict: SwipeVerdict;
  dimmed?: boolean;
  roomy?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: priority.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn((dimmed || isDragging) && "opacity-0")}
      {...attributes}
      {...listeners}
    >
      <SortChipContent priority={priority} verdict={verdict} roomy={roomy} />
    </div>
  );
}

function SortChipContent({
  priority,
  verdict,
  dragging,
  roomy = false,
}: {
  priority: Priority;
  verdict: SwipeVerdict;
  dragging?: boolean;
  roomy?: boolean;
}) {
  const Icon = priority.icon;
  const color = VERDICTS[verdict].color;
  return (
    <div
      className={cn(
        "flex cursor-grab touch-none select-none items-center rounded-xl border bg-white active:cursor-grabbing",
        roomy ? "gap-2 px-2.5 py-1.5" : "gap-1.5 px-2 py-1.5",
        dragging
          ? "border-violet shadow-[0_8px_30px_rgba(16,24,32,0.12)]"
          : "border-stroke-subtle",
      )}
    >
        <span
          className="grid size-6 shrink-0 place-items-center rounded-lg"
          style={{ background: `${color}1a`, color }}
        >
          <Icon size={14} strokeWidth={2.2} />
      </span>
      <span
        className={cn(
          "line-clamp-2 font-medium leading-tight text-deep-black",
          roomy ? "text-[12px]" : "text-[11.5px]",
        )}
      >
        {priority.title}
      </span>
    </div>
  );
}

function RankPhase({
  byId,
  ranking,
  onReorder,
  roomy = false,
}: {
  byId: Map<string, Priority>;
  ranking: string[];
  onReorder: (ids: string[]) => void;
  roomy?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Data order is most-important-first; the line shows most important on the
  // right, so render and drag against the reversed (left = least) order.
  const display = useMemo(() => [...ranking].reverse(), [ranking]);

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = display.indexOf(String(active.id));
    const newIndex = display.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder([...arrayMove(display, oldIndex, newIndex)].reverse());
  };

  const activeCard = activeId ? byId.get(activeId) : null;

  if (ranking.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-2">
        Mark a few cards as essential or nice to have, then rank them here.
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-2">
        <span>Least important</span>
        <span>Most important</span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="relative">
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute left-1 right-2 flex -translate-y-1/2 items-center",
              roomy ? "top-[65px]" : "top-[74px]",
            )}
          >
            <span className="size-0 shrink-0 border-y-[5px] border-r-[7px] border-y-transparent border-r-stroke-subtle" />
            <span className="h-px flex-1 bg-stroke-subtle" />
            <span className="size-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-stroke-subtle" />
          </div>
          <SortableContext
            items={display}
            strategy={horizontalListSortingStrategy}
          >
            <div
              className={cn(
                "relative flex pb-2",
                roomy
                  ? "w-full justify-center gap-2 px-1"
                  : "scrollbar-slim justify-between overflow-x-auto gap-3 px-8",
              )}
            >
              {display.map((id) => {
                const p = byId.get(id);
                if (!p) return null;
                return <RankCard key={id} priority={p} roomy={roomy} />;
              })}
            </div>
          </SortableContext>
        </div>
        <DragOverlay>
          {activeCard ? (
            <RankCardContent priority={activeCard} roomy={roomy} dragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function RankCard({
  priority,
  roomy = false,
}: {
  priority: Priority;
  roomy?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: priority.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        roomy && "min-w-0 flex-1 basis-0 max-w-[156px]",
        isDragging && "opacity-0",
      )}
    >
      <RankCardContent
        priority={priority}
        roomy={roomy}
        fullWidth={roomy}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function RankCardContent({
  priority,
  dragging,
  dragHandleProps,
  roomy = false,
  fullWidth = false,
}: {
  priority: Priority;
  dragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  roomy?: boolean;
  /** Fill the (flex) parent's width instead of a fixed card width. */
  fullWidth?: boolean;
}) {
  const Icon = priority.icon;
  const isNeed = priority.category === "need";
  const color = isNeed ? "#7f35b2" : "#c900ac";
  return (
    <div
      className={cn(
        "flex shrink-0 cursor-grab touch-none select-none flex-col justify-between rounded-card border bg-white active:cursor-grabbing",
        roomy ? "h-[130px] p-3" : "h-[148px] w-[116px] p-3",
        roomy && (fullWidth ? "w-full" : "w-[148px]"),
        dragging
          ? "border-violet shadow-[0_8px_30px_rgba(16,24,32,0.12)]"
          : "border-stroke-subtle",
      )}
      {...dragHandleProps}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "grid place-items-center rounded-lg",
            roomy ? "size-9" : "size-8",
          )}
          style={{ background: `${color}1a`, color }}
        >
          <Icon size={roomy ? 18 : 16} strokeWidth={2.2} />
        </span>
        <GripVertical
          className="size-4 shrink-0 text-gray-2"
          strokeWidth={2}
        />
      </div>
      <span
        className={cn(
          "line-clamp-3 font-medium leading-tight text-deep-black",
          roomy ? "text-sm" : "text-[12.5px]",
        )}
      >
        {priority.title}
      </span>
    </div>
  );
}
