"use client";

import { useMemo, useState } from "react";
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
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import {
  CardSwipe,
  VERDICTS,
  type SwipeResult,
  type SwipeVerdict,
} from "@/components/interactions/CardSwipe";
import { RETIREMENT_PRIORITIES, type Priority } from "@/lib/priorities";

export interface PriorityRankResult {
  ranking: string[];
  decisions: Record<string, SwipeVerdict>;
}

type Phase = "swipe" | "sort" | "rank";

/** Buckets laid out left → right along the sort line. */
const BUCKET_ORDER: SwipeVerdict[] = ["skip", "nice", "essential"];

export function PriorityRankFlow({
  onDone,
  onEnterSort,
  onEnterRank,
}: {
  onDone: (result: PriorityRankResult) => void;
  /** Fired once when the swipe deck is finished and the sort phase begins. */
  onEnterSort?: () => void;
  /** Fired once when the sort phase is finished and the rank phase begins. */
  onEnterRank?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("swipe");
  const [decisions, setDecisions] = useState<Record<string, SwipeVerdict>>({});
  const [ranking, setRanking] = useState<string[]>([]);

  const byId = useMemo(
    () => new Map(RETIREMENT_PRIORITIES.map((p) => [p.id, p])),
    [],
  );

  const handleSwipeComplete = (result: SwipeResult) => {
    setDecisions(result.decisions);
    setPhase("sort");
    onEnterSort?.();
  };

  const handleSortContinue = (next: Record<string, SwipeVerdict>) => {
    setDecisions(next);
    const keepers = RETIREMENT_PRIORITIES.filter(
      (p) => next[p.id] === "essential",
    )
      .concat(RETIREMENT_PRIORITIES.filter((p) => next[p.id] === "nice"))
      .map((p) => p.id);
    setRanking(keepers);
    setPhase("rank");
    onEnterRank?.();
  };

  const handleSave = () => {
    const skipped = RETIREMENT_PRIORITIES.filter(
      (p) => decisions[p.id] === "skip" || !decisions[p.id],
    ).map((p) => p.id);
    onDone({ ranking: [...ranking, ...skipped], decisions });
  };

  if (phase === "swipe") {
    return (
      <div className="w-full">
        <CardSwipe
          items={RETIREMENT_PRIORITIES}
          showResults={false}
          onComplete={handleSwipeComplete}
        />
      </div>
    );
  }

  if (phase === "sort") {
    return (
      <SortPhase
        byId={byId}
        decisions={decisions}
        onContinue={handleSortContinue}
      />
    );
  }

  return (
    <RankPhase
      byId={byId}
      ranking={ranking}
      onReorder={setRanking}
      onSave={handleSave}
    />
  );
}

function SortPhase({
  byId,
  decisions,
  onContinue,
}: {
  byId: Map<string, Priority>;
  decisions: Record<string, SwipeVerdict>;
  onContinue: (next: Record<string, SwipeVerdict>) => void;
}) {
  const [working, setWorking] = useState<Record<string, SwipeVerdict>>(() => {
    const seeded: Record<string, SwipeVerdict> = {};
    RETIREMENT_PRIORITIES.forEach((p) => {
      seeded[p.id] = decisions[p.id] ?? "skip";
    });
    return seeded;
  });
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
      grouped[working[p.id] ?? "skip"].push(p);
    });
    return grouped;
  }, [working]);

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const verdict = over.id as SwipeVerdict;
    if (!BUCKET_ORDER.includes(verdict)) return;
    setWorking((w) =>
      w[String(active.id)] === verdict
        ? w
        : { ...w, [String(active.id)]: verdict },
    );
  };

  const activeCard = activeId ? byId.get(activeId) : null;

  return (
    <div className="flex w-full flex-col gap-4">
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
              verdict={working[activeCard.id] ?? "skip"}
              dragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      <div className="flex justify-start pt-1">
        <Button variant="blue" size="md" onClick={() => onContinue(working)}>
          Continue
        </Button>
      </div>
    </div>
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
          className="size-2.5 rounded-full ring-4 ring-card"
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
  onSave,
}: {
  byId: Map<string, Priority>;
  ranking: string[];
  onReorder: (ids: string[]) => void;
  onSave: () => void;
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
      <div className="flex justify-start">
        <Button
          variant="blue"
          size="md"
          onClick={onSave}
          disabled={ranking.length === 0}
        >
          Save ranking
        </Button>
      </div>
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
