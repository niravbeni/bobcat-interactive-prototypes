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
import { ArrowLeft, ArrowRight, Check, GripVertical } from "lucide-react";
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
  onExit,
  onEnterSort,
  onEnterRank,
  fit = false,
}: {
  onDone: (result: PriorityRankResult) => void;
  /** Back from the first (swipe) phase — e.g. cancel and return to a summary. */
  onExit?: () => void;
  /** Fired once when the sort phase is first reached. */
  onEnterSort?: () => void;
  /** Fired once when the rank phase is first reached. */
  onEnterRank?: () => void;
  /**
   * Fill the available height instead of using the swipe deck's fixed height.
   * Used where the flow must fit a screen without adding scroll (details menu).
   */
  fit?: boolean;
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

  const canBack = phase !== "swipe" || Boolean(onExit);
  const goBack = () => {
    if (phase === "rank") setPhase("sort");
    else if (phase === "sort") setPhase("swipe");
    else onExit?.();
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
      <div className="mb-3 flex shrink-0 items-center gap-1.5">
        <NavButton kind="back" disabled={!canBack} onClick={goBack} />
        <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-2">
          Step {stepIndex + 1} of 3 · {PHASE_LABEL[phase]}
        </span>
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          !fit && "justify-center",
        )}
      >
        {phase === "swipe" ? (
          <CardSwipe
            items={RETIREMENT_PRIORITIES}
            showResults={false}
            onComplete={handleSwipeComplete}
            fit={fit}
          />
        ) : phase === "sort" ? (
          <SortPhase value={decisions} byId={byId} onChange={setDecisions} />
        ) : (
          <RankPhase byId={byId} ranking={ranking} onReorder={setRanking} />
        )}
      </div>

      {phase !== "swipe" ? (
        <div className="mt-4 flex shrink-0 justify-end">
          <Button
            variant="blue"
            size="md"
            onClick={goForward}
            disabled={!canForward}
            className="gap-1.5 disabled:opacity-40"
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
      ) : null}
    </div>
  );
}

function NavButton({
  kind,
  disabled,
  onClick,
}: {
  kind: "back" | "forward" | "commit";
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = kind === "back" ? ArrowLeft : kind === "commit" ? Check : ArrowRight;
  const label = kind === "back" ? "Back" : kind === "commit" ? "Save" : "Next";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded-full border transition-colors",
        kind === "commit" && !disabled
          ? "border-stratosphere bg-stratosphere text-white hover:brightness-110"
          : "border-stroke-subtle bg-white text-deep-black hover:bg-ghost-white",
        disabled && "cursor-not-allowed opacity-40 hover:bg-white",
      )}
    >
      <Icon className="size-4" strokeWidth={2.4} />
    </button>
  );
}

function SortPhase({
  value,
  byId,
  onChange,
}: {
  value: Record<string, SwipeVerdict>;
  byId: Map<string, Priority>;
  onChange: (next: Record<string, SwipeVerdict>) => void;
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
      <div className="relative grid grid-cols-3 gap-2">
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
          />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? (
          <SortChipContent
            priority={activeCard}
            verdict={value[activeCard.id] ?? "skip"}
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
}: {
  verdict: SwipeVerdict;
  cards: Priority[];
  activeId: string | null;
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
          className="text-center text-[11px] font-semibold leading-tight"
          style={{ color: v.color }}
        >
          {v.label}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] w-full flex-col gap-1.5 rounded-card p-1.5 transition-colors",
          isOver ? "bg-violet/5" : "bg-transparent",
        )}
      >
        {cards.map((p) => (
          <SortChip
            key={p.id}
            priority={p}
            verdict={verdict}
            dimmed={p.id === activeId}
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
}: {
  priority: Priority;
  verdict: SwipeVerdict;
  dimmed?: boolean;
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
      <SortChipContent priority={priority} verdict={verdict} />
    </div>
  );
}

function SortChipContent({
  priority,
  verdict,
  dragging,
}: {
  priority: Priority;
  verdict: SwipeVerdict;
  dragging?: boolean;
}) {
  const Icon = priority.icon;
  const color = VERDICTS[verdict].color;
  return (
    <div
      className={cn(
        "flex cursor-grab touch-none select-none items-center gap-1.5 rounded-xl border bg-white px-2 py-1.5 active:cursor-grabbing",
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
      <span className="text-[11.5px] font-medium leading-tight text-deep-black">
        {priority.title}
      </span>
    </div>
  );
}

function RankPhase({
  byId,
  ranking,
  onReorder,
}: {
  byId: Map<string, Priority>;
  ranking: string[];
  onReorder: (ids: string[]) => void;
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
            className="pointer-events-none absolute left-1 right-2 top-[74px] flex -translate-y-1/2 items-center"
          >
            <span className="size-0 shrink-0 border-y-[5px] border-r-[7px] border-y-transparent border-r-stroke-subtle" />
            <span className="h-px flex-1 bg-stroke-subtle" />
            <span className="size-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-stroke-subtle" />
          </div>
          <SortableContext
            items={display}
            strategy={horizontalListSortingStrategy}
          >
            <div className="scrollbar-slim relative flex justify-between gap-3 overflow-x-auto px-8 pb-2">
              {display.map((id) => {
                const p = byId.get(id);
                if (!p) return null;
                return <RankCard key={id} priority={p} />;
              })}
            </div>
          </SortableContext>
        </div>
        <DragOverlay>
          {activeCard ? (
            <RankCardContent priority={activeCard} dragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function RankCard({ priority }: { priority: Priority }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: priority.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-0")}>
      <RankCardContent
        priority={priority}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function RankCardContent({
  priority,
  dragging,
  dragHandleProps,
}: {
  priority: Priority;
  dragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const Icon = priority.icon;
  const isNeed = priority.category === "need";
  const color = isNeed ? "#7f35b2" : "#c900ac";
  return (
    <div
      className={cn(
        "flex h-[148px] w-[116px] shrink-0 cursor-grab touch-none select-none flex-col justify-between rounded-card border bg-white p-3 active:cursor-grabbing",
        dragging
          ? "border-violet shadow-[0_8px_30px_rgba(16,24,32,0.12)]"
          : "border-stroke-subtle",
      )}
      {...dragHandleProps}
    >
      <div className="flex items-center justify-between">
        <span
          className="grid size-8 place-items-center rounded-lg"
          style={{ background: `${color}1a`, color }}
        >
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <GripVertical className="size-4 text-gray-2" strokeWidth={2} />
      </div>
      <span className="line-clamp-3 text-[12.5px] font-medium leading-tight text-deep-black">
        {priority.title}
      </span>
    </div>
  );
}
